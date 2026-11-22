import { Controller, Get } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { LiveMatch, LiveMatchDocument } from './livematch.schema';

@Controller('live-match')
export class LiveMatchController {
  constructor(
    @InjectModel(LiveMatch.name)
    private readonly liveMatchModel: Model<LiveMatchDocument>,
  ) {}

  @Get()
  async getCurrentMatch() {
    const match = await this.liveMatchModel.findOne({ matchId: 'current_match' }).exec();
    return match || null;
  }
}
