import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { TeamsModule } from '../teams/teams.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [TeamsModule, AuthModule],
  controllers: [AdminController],
})
export class AdminModule {}
