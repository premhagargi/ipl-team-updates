import { Injectable, Logger } from '@nestjs/common';
import { WebSocket } from 'ws';

@Injectable()
export class SocketRegistryService {
  private readonly logger = new Logger(SocketRegistryService.name);

  // Map of userId -> Set of active WebSockets for that user
  private readonly userSockets = new Map<string, Set<WebSocket>>();

  // Reverse map: WebSocket -> userId (or null for guest/anonymous)
  private readonly socketToUser = new Map<WebSocket, string | null>();

  // Set of all active connected WebSockets
  private readonly allSockets = new Set<WebSocket>();

  register(userId: string | null, socket: WebSocket): void {
    this.allSockets.add(socket);
    this.socketToUser.set(socket, userId);

    if (userId) {
      if (!this.userSockets.has(userId)) {
        this.userSockets.set(userId, new Set<WebSocket>());
      }
      this.userSockets.get(userId)!.add(socket);
      this.logger.log(`Registered socket for user: ${userId}. Active sockets for user: ${this.userSockets.get(userId)!.size}`);
    } else {
      this.logger.log(`Registered guest/public socket. Total connections: ${this.allSockets.size}`);
    }
  }

  unregister(socket: WebSocket): void {
    const userId = this.socketToUser.get(socket);
    if (userId && this.userSockets.has(userId)) {
      const set = this.userSockets.get(userId)!;
      set.delete(socket);
      if (set.size === 0) {
        this.userSockets.delete(userId);
      }
    }
    this.socketToUser.delete(socket);
    this.allSockets.delete(socket);
    this.logger.log(`Socket disconnected. Total active sockets: ${this.allSockets.size}`);
  }

  sendToUser(userId: string, data: any): number {
    const sockets = this.userSockets.get(userId);
    if (!sockets || sockets.size === 0) {
      return 0;
    }

    const payload = JSON.stringify(data);
    let sentCount = 0;

    for (const socket of sockets) {
      if (socket.readyState === WebSocket.OPEN) {
        try {
          socket.send(payload);
          sentCount++;
        } catch (err) {
          this.logger.error(`Error sending message to user ${userId}:`, err);
        }
      }
    }
    return sentCount;
  }

  broadcast(data: any): number {
    const payload = JSON.stringify(data);
    let count = 0;

    for (const socket of this.allSockets) {
      if (socket.readyState === WebSocket.OPEN) {
        try {
          socket.send(payload);
          count++;
        } catch (err) {
          this.logger.error(`Error broadcasting to socket:`, err);
        }
      }
    }
    return count;
  }

  isUserOnline(userId: string): boolean {
    const sockets = this.userSockets.get(userId);
    return !!sockets && sockets.size > 0;
  }

  getStats() {
    return {
      totalSockets: this.allSockets.size,
      connectedUsers: this.userSockets.size,
    };
  }
}
