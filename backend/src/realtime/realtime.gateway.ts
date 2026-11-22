import {
  WebSocketGateway,
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketServer,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, WebSocket } from 'ws';
import { IncomingMessage } from 'http';
import { URL } from 'url';
import { AuthService } from '../auth/auth.service';
import { SocketRegistryService } from './socket-registry.service';

@WebSocketGateway({
  path: '/ws',
})
export class RealtimeGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(RealtimeGateway.name);

  @WebSocketServer()
  server: Server;

  constructor(
    private readonly authService: AuthService,
    private readonly socketRegistry: SocketRegistryService,
  ) {}

  handleConnection(client: WebSocket, req: IncomingMessage) {
    try {
      const fullUrl = `http://${req.headers.host || 'localhost'}${req.url || ''}`;
      const url = new URL(fullUrl);
      const token = url.searchParams.get('token');

      let userId: string | null = null;
      let username: string | null = null;

      if (token) {
        try {
          const payload = this.authService.verifyToken(token);
          userId = payload.sub || payload.userId;
          username = payload.username;
        } catch (authErr) {
          this.logger.warn(`Invalid JWT token on WS connection: ${authErr.message}`);
          client.close(4001, 'Unauthorized: Invalid token');
          return;
        }
      }

      this.socketRegistry.register(userId, client);

      // Send connection acknowledgement
      client.send(
        JSON.stringify({
          type: 'connected',
          payload: {
            authenticated: !!userId,
            userId,
            username,
            timestamp: new Date().toISOString(),
          },
        }),
      );

      // Listen for ping or custom messages
      client.on('message', (message: string) => {
        try {
          const parsed = JSON.parse(message.toString());
          if (parsed.type === 'ping') {
            client.send(JSON.stringify({ type: 'pong', timestamp: Date.now() }));
          }
        } catch (e) {
          // ignore non-json messages
        }
      });
    } catch (err) {
      this.logger.error('Error handling WebSocket connection:', err);
      client.close(1011, 'Internal Server Error');
    }
  }

  handleDisconnect(client: WebSocket) {
    this.socketRegistry.unregister(client);
  }
}
