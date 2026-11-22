import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema, Types } from 'mongoose';

export type NotificationDocument = Notification & Document;

@Schema({ _id: false })
export class FieldChange {
  @Prop({ required: true })
  field: string;

  @Prop({ type: MongooseSchema.Types.Mixed })
  newValue: any;
}

const FieldChangeSchema = SchemaFactory.createForClass(FieldChange);

@Schema({ timestamps: true })
export class Notification {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true, index: true })
  userId: Types.ObjectId;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Team', required: true })
  teamId: Types.ObjectId;

  @Prop({ type: [FieldChangeSchema], required: true })
  changes: FieldChange[];

  @Prop({ default: false, index: true })
  read: boolean;

  @Prop({ default: Date.now, index: true })
  createdAt: Date;
}

export const NotificationSchema = SchemaFactory.createForClass(Notification);
