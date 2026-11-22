import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema, Types } from 'mongoose';

export type SubscriptionDocument = Subscription & Document;

@Schema({ timestamps: true })
export class Subscription {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Team', required: true })
  teamId: Types.ObjectId;

  // 'ALL' = notify on any field change; otherwise an explicit allow-list e.g. ['captain', 'wins']
  @Prop({ type: MongooseSchema.Types.Mixed, default: 'ALL' })
  fields: 'ALL' | string[];

  @Prop({ default: Date.now })
  createdAt: Date;
}

export const SubscriptionSchema = SchemaFactory.createForClass(Subscription);

// Unique compound index on (userId, teamId)
SubscriptionSchema.index({ userId: 1, teamId: 1 }, { unique: true });
