// src/seguridad/auth/jwt-auth.guard.ts
import { ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import type { Request } from 'express';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  async canActivate(context: ExecutionContext) {
    const req = context.switchToHttp().getRequest<Request>();
    console.log('🛡 JwtAuthGuard.canActivate - Authorization:', req.headers['authorization']);
    return (await super.canActivate(context)) as boolean;
  }
}
