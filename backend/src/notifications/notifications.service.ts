import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Notification, NotificationDocument } from './notification.schema';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectModel(Notification.name)
    private notificationModel: Model<NotificationDocument>,
  ) {}

  async getForUser(userId: string, limit = 50) {
    return this.notificationModel
      .find({ userId: new Types.ObjectId(userId) })
      .populate('teamId', 'name short captain headCoach homeGround titles wins losses points')
      .sort({ createdAt: -1 })
      .limit(limit)
      .exec();
  }

  async getUnreadCount(userId: string): Promise<number> {
    return this.notificationModel.countDocuments({
      userId: new Types.ObjectId(userId),
      read: false,
    });
  }

  async markAllRead(userId: string) {
    const res = await this.notificationModel.updateMany(
      { userId: new Types.ObjectId(userId), read: false },
      { $set: { read: true } },
    );
    return { markedReadCount: res.modifiedCount };
  }

  async create(userId: Types.ObjectId, teamId: Types.ObjectId, changes: { field: string; newValue: any }[]) {
    return this.notificationModel.create({
      userId,
      teamId,
      changes,
      read: false,
      createdAt: new Date(),
    });
  }
}
