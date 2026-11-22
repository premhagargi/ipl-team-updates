import { Module, forwardRef } from '@nestjs/common';
import { RealtimeGateway } from './realtime.gateway';
import { SocketRegistryService } from './socket-registry.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [forwardRef(() => AuthModule)],
  providers: [RealtimeGateway, SocketRegistryService],
  exports: [SocketRegistryService, RealtimeGateway],
})
export class RealtimeModule {}
