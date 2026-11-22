import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Subscription, SubscriptionDocument } from './subscription.schema';

@Injectable()
export class SubscriptionsService {
  constructor(
    @InjectModel(Subscription.name)
    private subscriptionModel: Model<SubscriptionDocument>,
  ) {}

  async subscribe(
    userId: string,
    teamId: string,
    fields: 'ALL' | string[] = 'ALL',
  ): Promise<SubscriptionDocument> {
    const userObjId = new Types.ObjectId(userId);
    const teamObjId = new Types.ObjectId(teamId);

    const subscription = await this.subscriptionModel.findOneAndUpdate(
      { userId: userObjId, teamId: teamObjId },
      { $set: { fields: fields || 'ALL', updatedAt: new Date() } },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );
    return subscription;
  }

  async unsubscribe(userId: string, teamId: string): Promise<{ success: boolean }> {
    const userObjId = new Types.ObjectId(userId);
    const teamObjId = new Types.ObjectId(teamId);

    const res = await this.subscriptionModel.deleteOne({
      userId: userObjId,
      teamId: teamObjId,
    });
    return { success: res.deletedCount > 0 };
  }

  async updateSubscriptionFields(
    userId: string,
    teamId: string,
    fields: 'ALL' | string[],
  ): Promise<SubscriptionDocument> {
    const userObjId = new Types.ObjectId(userId);
    const teamObjId = new Types.ObjectId(teamId);

    const sub = await this.subscriptionModel.findOneAndUpdate(
      { userId: userObjId, teamId: teamObjId },
      { $set: { fields } },
      { new: true },
    );

    if (!sub) {
      throw new NotFoundException('Subscription not found. Please subscribe to this team first.');
    }
    return sub;
  }

  async getUserSubscriptions(userId: string): Promise<SubscriptionDocument[]> {
    return this.subscriptionModel
      .find({ userId: new Types.ObjectId(userId) })
      .exec();
  }

  async getSubscribersForTeam(teamId: string | Types.ObjectId): Promise<SubscriptionDocument[]> {
    const teamObjId = typeof teamId === 'string' ? new Types.ObjectId(teamId) : teamId;
    return this.subscriptionModel.find({ teamId: teamObjId }).exec();
  }

  async isSubscribed(userId: string, teamId: string): Promise<boolean> {
    const count = await this.subscriptionModel.countDocuments({
      userId: new Types.ObjectId(userId),
      teamId: new Types.ObjectId(teamId),
    });
    return count > 0;
  }
}
