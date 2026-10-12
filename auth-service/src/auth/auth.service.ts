import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';

interface MemUser {
  username: string;
  password: string;
  role: string;
}

@Injectable()
export class AuthService {
  private readonly users: MemUser[];

  constructor(
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {
    // AUTH_USERS=admin:admin123:admin,user:user123:user
    this.users = (this.config.get<string>('AUTH_USERS') ?? '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
      .map((entry) => {
        const [username, password, role] = entry.split(':');
        return { username, password, role: role ?? 'user' };
      });
  }

  async login(username: string, password: string): Promise<{ accessToken: string }> {
    const user = this.users.find(
      (u) => u.username === username && u.password === password,
    );
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }
    // El iss debe coincidir con el "key" de la credencial jwt de Kong (kong.yml).
    const iss =
      user.username === 'admin'
        ? this.config.get<string>('JWT_ISS_ADMIN')
        : this.config.get<string>('JWT_ISS_USER');
    const accessToken = await this.jwt.signAsync(
      { iss, sub: user.username, username: user.username, role: user.role },
      {
        secret: this.config.get<string>('JWT_SECRET'),
        expiresIn: this.config.get<string>('JWT_EXPIRES_IN') as never,
      },
    );
    return { accessToken };
  }

  /** Consulta el /health de cada microservicio y devuelve el estado agregado. */
  async aggregatedHealth(requestId?: string) {
    const targets = [
      { name: 'product-service', url: this.config.get<string>('PRODUCT_SERVICE_URL') },
      { name: 'order-service', url: this.config.get<string>('ORDER_SERVICE_URL') },
      { name: 'customer-service', url: this.config.get<string>('CUSTOMER_SERVICE_URL') },
    ];
    const services: Record<string, unknown> = {};
    let allOk = true;
    await Promise.all(
      targets.map(async (t) => {
        try {
          const controller = new AbortController();
          const timer = setTimeout(() => controller.abort(), 3000);
          const res = await fetch(`${t.url}/health`, {
            signal: controller.signal,
            headers: requestId ? { 'x-request-id': requestId } : {},
          });
          clearTimeout(timer);
          const body = await res.json().catch(() => ({}));
          services[t.name] = res.ok ? body : { status: 'down', httpStatus: res.status };
          if (!res.ok) allOk = false;
        } catch (e) {
          allOk = false;
          services[t.name] = { status: 'down', error: (e as Error).message };
        }
      }),
    );
    return {
      status: allOk ? 'ok' : 'degraded',
      gateway: 'kong',
      services,
      checkedAt: new Date().toISOString(),
    };
  }
}
