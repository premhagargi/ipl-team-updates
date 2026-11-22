import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Team, TeamDocument } from '../teams/team.schema';
import { Subscription, SubscriptionDocument } from '../subscriptions/subscription.schema';
import { Notification, NotificationDocument } from '../notifications/notification.schema';
import { SocketRegistryService } from '../realtime/socket-registry.service';

@Injectable()
export class TeamsChangeStreamService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(TeamsChangeStreamService.name);
  private changeStream: any = null;
  private isDestroyed = false;
  // §7.4 Reconnect handling: resume token stored in memory
  private resumeToken: any = null;

  constructor(
    @InjectModel(Team.name) private readonly teamModel: Model<TeamDocument>,
    @InjectModel(Subscription.name) private readonly subscriptionModel: Model<SubscriptionDocument>,
    @InjectModel(Notification.name) private readonly notificationModel: Model<NotificationDocument>,
    private readonly socketRegistry: SocketRegistryService,
  ) {}

  onModuleInit() {
    this.startTeamsWatcher();
  }

  onModuleDestroy() {
    this.isDestroyed = true;
    if (this.changeStream) {
      try {
        this.changeStream.close();
      } catch (e) {}
    }
  }

  private startTeamsWatcher() {
    if (this.isDestroyed) return;

    try {
      this.logger.log(
        `Starting Teams Change Stream${this.resumeToken ? ' (resuming from token)' : ''}...`,
      );
      const teamsCollection = this.teamModel.collection;

      const watchOptions: any = {
        fullDocument: 'updateLookup',
      };
      if (this.resumeToken) {
        watchOptions.resumeAfter = this.resumeToken;
      }

      this.changeStream = teamsCollection.watch([], watchOptions);

      this.changeStream.on('change', async (event: any) => {
        // §7.4: Persist resumeToken in memory as we process each event
        if (event._id) {
          this.resumeToken = event._id;
        }

        try {
          await this.handleTeamChange(event);
        } catch (err) {
          this.logger.error('Error processing team change event:', err);
        }
      });

      this.changeStream.on('error', (err: any) => {
        this.logger.warn(`Teams Change Stream dropped, reconnecting: ${err.message}`);
        // If resumeToken falls outside oplog retention window (e.g. Atlas M0), clear it and start fresh
        if (
          err.message &&
          (err.message.includes('resume') ||
            err.message.includes('oplog') ||
            err.code === 286 || // ChangeStreamHistoryLost
            err.code === 40585) // ChangeStreamFatalError
        ) {
          this.logger.warn('Resume token invalidated or outside oplog window. Resetting resume token to start fresh.');
          this.resumeToken = null;
        }

        if (!this.isDestroyed) {
          setTimeout(() => this.startTeamsWatcher(), 1500);
        }
      });

      this.changeStream.on('close', () => {
        this.logger.warn('Teams Change Stream connection closed.');
        if (!this.isDestroyed) {
          setTimeout(() => this.startTeamsWatcher(), 1500);
        }
      });
    } catch (err) {
      this.logger.warn(`Teams Change Stream initialization failed (${err.message}). Retrying in 2s...`);
      if (!this.isDestroyed) {
        setTimeout(() => this.startTeamsWatcher(), 2000);
      }
    }
  }

  private async handleTeamChange(event: any) {
    if (event.operationType !== 'update') {
      return;
    }

    const teamId = event.documentKey._id;
    const updatedFieldsObj = event.updateDescription?.updatedFields || {};

    // Filter out internal Mongoose fields
    const fieldsToIgnore = ['_id', '__v', 'updatedAt', 'createdAt'];
    const changedFieldNames = Object.keys(updatedFieldsObj).filter(
      (f) => !fieldsToIgnore.includes(f),
    );

    if (changedFieldNames.length === 0) {
      return;
    }

    this.logger.log(
      `Team [${teamId}] changed fields: ${changedFieldNames.join(', ')}`,
    );

    // Find all subscribers for this team
    const subscribers = await this.subscriptionModel.find({ teamId });
    if (!subscribers || subscribers.length === 0) {
      return;
    }

    const fullDoc = event.fullDocument || {};

    for (const sub of subscribers) {
      // Requirement #10: Check field subscription filter
      let relevantFields: string[] = [];

      if (sub.fields === 'ALL' || !sub.fields) {
        relevantFields = changedFieldNames;
      } else if (Array.isArray(sub.fields)) {
        relevantFields = changedFieldNames.filter((f) =>
          sub.fields.includes(f),
        );
      }

      // If user subscribed to specific fields and none were in this update, silently skip
      if (relevantFields.length === 0) {
        continue;
      }

      // Requirement #8: One grouped notification per multi-field update
      const changes = relevantFields.map((field) => ({
        field,
        newValue: updatedFieldsObj[field],
      }));

      // Requirement #5 & #7.3: Always persist notification in MongoDB (offline durability)
      const notification = await this.notificationModel.create({
        userId: sub.userId,
        teamId,
        changes,
        read: false,
        createdAt: new Date(),
      });

      // Prepare populated payload for immediate UI consumption
      const notificationPayload = {
        _id: notification._id,
        userId: sub.userId,
        teamId: {
          _id: teamId,
          name: fullDoc.name,
          short: fullDoc.short,
          captain: fullDoc.captain,
          headCoach: fullDoc.headCoach,
          homeGround: fullDoc.homeGround,
          titles: fullDoc.titles,
          wins: fullDoc.wins,
          losses: fullDoc.losses,
          points: fullDoc.points,
        },
        changes,
        read: false,
        createdAt: notification.createdAt,
      };

      // Requirement #4: Push real-time over WebSocket if online
      const sentCount = this.socketRegistry.sendToUser(sub.userId.toString(), {
        type: 'notification',
        payload: notificationPayload,
      });

      this.logger.log(
        `Notification saved & dispatched to user ${sub.userId} (${sentCount} sockets active). Team: ${fullDoc.short || teamId}`,
      );
    }
  }
}
