import { Controller, Post, Get, Body, Query, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { AnalyticsService } from './analytics.service';

@ApiTags('analytics')
@Controller()
export class AnalyticsController {
  constructor(private readonly analytics: AnalyticsService) {}

  @Post('analytics')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({ summary: 'Registra un acceso/acción del frontend (público, fire-and-forget)' })
  async track(@Body() body: { username?: string; action?: string; route?: string }) {
    await this.analytics.track(body?.username, body?.action, body?.route);
    return { ok: true };
  }

  @Get('analytics/recent')
  @ApiOperation({ summary: 'Últimos eventos de auditoría (vía Kong exige JWT)' })
  recent(
    @Query('limit') limit?: string,
    @Query('action') action?: string,
    @Query('username') username?: string,
  ) {
    return this.analytics.recent(limit, action, username);
  }
}
