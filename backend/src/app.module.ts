import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import * as dotenv from 'dotenv';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { TeamsModule } from './teams/teams.module';
import { SubscriptionsModule } from './subscriptions/subscriptions.module';
import { NotificationsModule } from './notifications/notifications.module';
import { RealtimeModule } from './realtime/realtime.module';
import { ChangeStreamsModule } from './change-streams/change-streams.module';
import { AdminModule } from './admin/admin.module';

dotenv.config();

const mongoUri =
  process.env.MONGO_URI ||
  'mongodb://127.0.0.1:27017/ipl_updates?replicaSet=rs0&directConnection=true';

@Module({
  imports: [
    MongooseModule.forRoot(mongoUri),
    UsersModule,
    AuthModule,
    TeamsModule,
    SubscriptionsModule,
    NotificationsModule,
    RealtimeModule,
    ChangeStreamsModule,
    AdminModule,
  ],
})
export class AppModule {}
