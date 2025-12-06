// src/presentation/controllers/health.controller.ts

import { Controller, Get, HttpCode, HttpStatus } from '@nestjs/common';
import { Public } from '../decorators/public.decorator';

@Controller('health') // Endpoint: /api/health
export class HealthController {
  
  @Public() // JWT kontrolünden muaf tutar
  @Get()
  @HttpCode(HttpStatus.OK)
  check() {
    // Uygulama sağlamsa 200 OK döner
    return { status: 'ok' }; 
  }
}