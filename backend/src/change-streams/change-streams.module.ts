import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Team, TeamSchema } from '../teams/team.schema';
import { Subscription, SubscriptionSchema } from '../subscriptions/subscription.schema';
import { Notification, NotificationSchema } from '../notifications/notification.schema';
import { LiveMatch, LiveMatchSchema } from './livematch.schema';
import { TeamsChangeStreamService } from './teams-change-stream.service';
import { LivematchChangeStreamService } from './livematch-change-stream.service';
import { RealtimeModule } from '../realtime/realtime.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Team.name, schema: TeamSchema },
      { name: Subscription.name, schema: SubscriptionSchema },
      { name: Notification.name, schema: NotificationSchema },
      { name: LiveMatch.name, schema: LiveMatchSchema },
    ]),
    RealtimeModule,
  ],
  providers: [TeamsChangeStreamService, LivematchChangeStreamService],
  exports: [TeamsChangeStreamService, LivematchChangeStreamService, MongooseModule],
})
export class ChangeStreamsModule {}
