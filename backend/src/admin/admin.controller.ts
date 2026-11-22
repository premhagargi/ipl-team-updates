import {
  Controller,
  Patch,
  Param,
  Body,
  UseGuards,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Team, TeamDocument } from '../teams/team.schema';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AdminController {
  private readonly logger = new Logger(AdminController.name);

  constructor(
    @InjectModel(Team.name) private readonly teamModel: Model<TeamDocument>,
  ) {}

  @Patch('teams/:id')
  @Roles('admin')
  async updateTeam(@Param('id') id: string, @Body() updateData: Partial<Team>) {
    if (!updateData || Object.keys(updateData).length === 0) {
      throw new BadRequestException('No update fields provided');
    }

    // Disallow overriding _id or internal fields
    const sanitized = { ...updateData };
    delete (sanitized as any)._id;
    delete (sanitized as any).__v;

    this.logger.log(`Admin updating team ${id}: ${JSON.stringify(sanitized)}`);

    // IMPORTANT: Only update MongoDB document.
    // MongoDB Change Stream handles the notification pipeline!
    // No manual notification push here to prevent duplicates (Requirement #7.2).
    const updatedTeam = await this.teamModel.findByIdAndUpdate(
      id,
      { $set: sanitized },
      { new: true, runValidators: true },
    );

    if (!updatedTeam) {
      throw new NotFoundException(`Team with ID ${id} not found`);
    }

    return {
      success: true,
      message: 'Team updated successfully. Change Stream will notify subscribers.',
      team: updatedTeam,
    };
  }
}
