import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { randomUUID } from 'crypto';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = context.switchToHttp().getRequest();
    const res = context.switchToHttp().getResponse();
    const start = Date.now();
    const requestId: string = req.headers['x-request-id'] ?? randomUUID();
    req.headers['x-request-id'] = requestId;
    res.setHeader('x-request-id', requestId);

    return next.handle().pipe(
      tap({
        next: () => this.log(req, res, start, requestId),
        error: (err) => this.log(req, res, start, requestId, err),
      }),
    );
  }

  private log(req: any, res: any, start: number, requestId: string, err?: any) {
    const ms = Date.now() - start;
    const user = req.body?.username ?? 'anonymous';
    this.logger.log(
      `${new Date().toISOString()} ${req.method} ${req.originalUrl ?? req.url} ${res.statusCode} ${ms}ms ip=${req.ip} user=${user} requestId=${requestId} service=auth-service`,
    );
    if (err) {
      this.logger.error(`requestId=${requestId} error=${err?.message ?? err}`, err?.stack);
    }
  }
}
