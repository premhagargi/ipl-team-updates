import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type LiveMatchDocument = LiveMatch & Document;

@Schema({ _id: false })
export class Batter {
  @Prop({ required: true })
  name: string;

  @Prop({ default: 0 })
  runs: number;

  @Prop({ default: 0 })
  balls: number;

  @Prop({ default: false })
  onStrike: boolean;
}

@Schema({ _id: false })
export class Bowler {
  @Prop({ required: true })
  name: string;

  @Prop({ default: 0 })
  overs: number;

  @Prop({ default: 0 })
  runsConceded: number;

  @Prop({ default: 0 })
  wickets: number;
}

@Schema({ timestamps: true, collection: 'livematches' })
export class LiveMatch {
  @Prop({ default: 'current_match', unique: true })
  matchId: string;

  @Prop({ required: true })
  battingTeam: string;

  @Prop({ required: true })
  bowlingTeam: string;

  @Prop({ default: 0 })
  runs: number;

  @Prop({ default: 0 })
  wickets: number;

  @Prop({ default: '0.0' })
  oversBowled: string;

  @Prop({ default: 20 })
  totalOvers: number;

  @Prop({ type: [Batter], default: [] })
  batters: Batter[];

  @Prop({ type: Bowler })
  bowler: Bowler;

  @Prop({ type: [String], default: [] })
  currentOverBalls: string[];

  @Prop({ default: Date.now })
  updatedAt: Date;
}

export const LiveMatchSchema = SchemaFactory.createForClass(LiveMatch);
