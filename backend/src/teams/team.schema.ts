import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type TeamDocument = Team & Document;

@Schema({ timestamps: true })
export class Team {
  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ required: true, uppercase: true, trim: true })
  short: string;

  @Prop({ required: true })
  captain: string;

  @Prop({ required: true })
  headCoach: string;

  @Prop({ required: true })
  homeGround: string;

  @Prop({ default: 0 })
  titles: number;

  @Prop({ default: 0 })
  wins: number;

  @Prop({ default: 0 })
  losses: number;

  @Prop({ default: 0 })
  points: number;
}

export const TeamSchema = SchemaFactory.createForClass(Team);
