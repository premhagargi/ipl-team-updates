import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { TeamsService } from './teams.service';
import { IsOptional } from 'class-validator';

export class SubscribeDto {
  @IsOptional()
  fields?: 'ALL' | string[];
}

export class UpdateSubscriptionDto {
  fields: 'ALL' | string[];
}

@Controller('teams')
@UseGuards(JwtAuthGuard)
export class TeamsController {
  constructor(private readonly teamsService: TeamsService) {}

  @Get()
  async getAllTeams(@Request() req) {
    return this.teamsService.findAll(req.user?.userId);
  }

  @Get(':id')
  async getTeamById(@Request() req, @Param('id') id: string) {
    return this.teamsService.findById(id, req.user?.userId);
  }

  @Post(':id/subscribe')
  async subscribe(
    @Request() req,
    @Param('id') id: string,
    @Body() body: SubscribeDto,
  ) {
    return this.teamsService.subscribe(req.user.userId, id, body?.fields || 'ALL');
  }

  @Post(':id/unsubscribe')
  async unsubscribe(@Request() req, @Param('id') id: string) {
    return this.teamsService.unsubscribe(req.user.userId, id);
  }

  @Patch(':id/subscription')
  async updateSubscription(
    @Request() req,
    @Param('id') id: string,
    @Body() body: UpdateSubscriptionDto,
  ) {
    return this.teamsService.updateSubscription(req.user.userId, id, body.fields);
  }
}
