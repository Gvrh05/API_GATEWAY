import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Pool } from 'pg';

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger('Analytics');
  private pool: Pool | null = null;

  constructor(private readonly config: ConfigService) {
    const host = this.config.get<string>('ANALYTICS_DB_HOST') ?? 'postgres';
    const port = Number(this.config.get<string>('ANALYTICS_DB_PORT') ?? 5432);
    const user = this.config.get<string>('ANALYTICS_DB_USER') ?? 'postgres';
    const password = this.config.get<string>('ANALYTICS_DB_PASSWORD') ?? 'postgres';
    const database = this.config.get<string>('ANALYTICS_DB_NAME') ?? 'postgres';
    try {
      this.pool = new Pool({ host, port, user, password, database });
      this.pool.on('error', (e) => this.logger.warn(`pg pool error: ${e.message}`));
    } catch (e) {
      this.logger.warn(`analytics disabled: ${(e as Error).message}`);
    }
  }

  async track(username = 'anonymous', action = 'page_view', route = '/'): Promise<void> {
    if (!this.pool) return;
    try {
      await this.pool.query(
        'INSERT INTO access_log (username, action, route) VALUES ($1,$2,$3)',
        [String(username).slice(0, 100), String(action).slice(0, 50), String(route).slice(0, 300)],
      );
    } catch (e) {
      this.logger.warn(`track failed: ${(e as Error).message}`);
    }
  }
}
