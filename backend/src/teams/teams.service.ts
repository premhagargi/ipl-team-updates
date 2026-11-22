import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Team, TeamDocument } from './team.schema';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';

@Injectable()
export class TeamsService {
  constructor(
    @InjectModel(Team.name) private teamModel: Model<TeamDocument>,
    private subscriptionsService: SubscriptionsService,
  ) {}

  async findAll(userId?: string) {
    const teams = await this.teamModel.find().sort({ points: -1, wins: -1 }).exec();

    if (!userId) {
      return teams.map((t) => ({
        ...t.toObject(),
        isSubscribed: false,
        subscribedFields: null,
      }));
    }

    const subscriptions = await this.subscriptionsService.getUserSubscriptions(userId);
    const subMap = new Map<string, any>();
    for (const sub of subscriptions) {
      subMap.set(sub.teamId.toString(), sub.fields);
    }

    return teams.map((team) => {
      const teamIdStr = team._id.toString();
      const isSubscribed = subMap.has(teamIdStr);
      return {
        ...team.toObject(),
        isSubscribed,
        subscribedFields: isSubscribed ? subMap.get(teamIdStr) : null,
      };
    });
  }

  async findById(teamId: string, userId?: string) {
    const team = await this.teamModel.findById(teamId).exec();
    if (!team) {
      throw new NotFoundException(`Team with ID ${teamId} not found`);
    }

    let isSubscribed = false;
    let subscribedFields = null;

    if (userId) {
      const subs = await this.subscriptionsService.getUserSubscriptions(userId);
      const sub = subs.find((s) => s.teamId.toString() === teamId);
      if (sub) {
        isSubscribed = true;
        subscribedFields = sub.fields;
      }
    }

    return {
      ...team.toObject(),
      isSubscribed,
      subscribedFields,
    };
  }

  async subscribe(userId: string, teamId: string, fields: 'ALL' | string[] = 'ALL') {
    await this.findById(teamId); // Ensure team exists
    const sub = await this.subscriptionsService.subscribe(userId, teamId, fields);
    return {
      success: true,
      subscription: sub,
    };
  }

  async unsubscribe(userId: string, teamId: string) {
    const res = await this.subscriptionsService.unsubscribe(userId, teamId);
    return {
      success: res.success,
      message: res.success ? 'Unsubscribed successfully' : 'Not subscribed',
    };
  }

  async updateSubscription(userId: string, teamId: string, fields: 'ALL' | string[]) {
    await this.findById(teamId);
    const sub = await this.subscriptionsService.updateSubscriptionFields(userId, teamId, fields);
    return {
      success: true,
      subscription: sub,
    };
  }
}
