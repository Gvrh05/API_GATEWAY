import { Controller, Post, Get, Body, Headers, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';

@ApiTags('auth')
@Controller()
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('auth/login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login público, devuelve JWT que Kong verifica' })
  @ApiResponse({ status: 200, description: '{ accessToken }' })
  @ApiResponse({ status: 401, description: 'Credenciales inválidas' })
  login(@Body() dto: LoginDto) {
    return this.auth.login(dto.username, dto.password);
  }

  @Get('health')
  @ApiOperation({ summary: 'Health del auth-service (y del gateway lógico)' })
  check() {
    return { status: 'ok', service: 'auth-service' };
  }

  // Kong enruta GET /api/health/services -> http://auth-service:3004/api/health/services
  @Get('api/health/services')
  @ApiOperation({ summary: 'Estado agregado de los 3 microservicios' })
  aggregated(@Headers('x-request-id') requestId?: string) {
    return this.auth.aggregatedHealth(requestId);
  }
}
