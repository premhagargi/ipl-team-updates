import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { LiveMatch, LiveMatchDocument } from './livematch.schema';
import { SocketRegistryService } from '../realtime/socket-registry.service';

@Injectable()
export class LivematchChangeStreamService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(LivematchChangeStreamService.name);
  private changeStream: any = null;
  private isDestroyed = false;
  private isReconnecting = false;
  private reconnectTimeout: any = null;
  // §7.4 Reconnect handling with resumeToken
  private resumeToken: any = null;

  constructor(
    @InjectModel(LiveMatch.name) private readonly liveMatchModel: Model<LiveMatchDocument>,
    private readonly socketRegistry: SocketRegistryService,
  ) {}

  onModuleInit() {
    this.startLivematchWatcher();
  }

  onModuleDestroy() {
    this.isDestroyed = true;
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
    }
    if (this.changeStream) {
      try {
        this.changeStream.removeAllListeners();
        this.changeStream.close();
      } catch (e) {}
      this.changeStream = null;
    }
  }

  async getLatestMatch(): Promise<LiveMatchDocument | null> {
    return this.liveMatchModel.findOne({ matchId: 'current_match' }).exec();
  }

  private scheduleReconnect(delayMs = 2000) {
    if (this.isDestroyed || this.isReconnecting) return;
    this.isReconnecting = true;
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
    }
    this.reconnectTimeout = setTimeout(() => {
      this.isReconnecting = false;
      this.startLivematchWatcher();
    }, delayMs);
  }

  private startLivematchWatcher() {
    if (this.isDestroyed) return;

    // Clean up any existing stream before creating a new one
    if (this.changeStream) {
      try {
        this.changeStream.removeAllListeners();
        this.changeStream.close();
      } catch (e) {}
      this.changeStream = null;
    }

    try {
      this.logger.log(
        `Starting Livematch Change Stream${this.resumeToken ? ' (resuming from token)' : ''}...`,
      );
      const collection = this.liveMatchModel.collection;

      const watchOptions: any = {
        fullDocument: 'updateLookup',
      };
      if (this.resumeToken) {
        watchOptions.resumeAfter = this.resumeToken;
      }

      this.changeStream = collection.watch([], watchOptions);

      this.changeStream.on('change', async (event: any) => {
        if (event._id) {
          this.resumeToken = event._id;
        }

        try {
          if (['insert', 'update', 'replace'].includes(event.operationType)) {
            const doc = event.fullDocument;
            if (doc && doc.matchId === 'current_match') {
              // Broadcast full updated live match scorecard to all connected WebSocket clients
              this.socketRegistry.broadcast({
                type: 'match_update',
                payload: doc,
              });
            }
          }
        } catch (err) {
          this.logger.error('Error broadcasting live match change:', err);
        }
      });

      this.changeStream.on('error', (err: any) => {
        this.logger.warn(`Livematch Change Stream dropped: ${err.message}`);
        if (
          err.message &&
          (err.message.includes('resume') ||
            err.message.includes('oplog') ||
            err.code === 286 ||
            err.code === 40585)
        ) {
          this.logger.warn('Resetting Livematch resume token.');
          this.resumeToken = null;
        }
        this.scheduleReconnect(2000);
      });

      this.changeStream.on('close', () => {
        this.logger.warn('Livematch Change Stream connection closed.');
        this.scheduleReconnect(2000);
      });
    } catch (err: any) {
      this.logger.warn(`Livematch Change Stream initialization failed (${err.message}). Retrying in 2s...`);
      this.scheduleReconnect(2000);
    }
  }
}
