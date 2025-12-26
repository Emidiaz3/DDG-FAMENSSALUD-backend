// src/seguridad/auth/auth.controller.ts
import {
  Body,
  Controller,
  Post,
  Req,
  Res,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { ApiResponse } from '../../common/interfaces/api-response.interface';
import type { Request, Response } from 'express';
import { RefreshTokenBodyDto } from './dto/refresh-token-body.dto';
import { isMobileRequest } from 'src/common/utils/device.util';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  private setRefreshCookie(res: Response, token: string) {
    res.cookie('rt', token, {
      httpOnly: true,
      secure: true, // ngrok usa https → ponlo en true
      sameSite: 'none', // CLAVE: permitir envío en cross-site requests
      path: '/api/auth/refresh',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
  }

  @Post('login')
  async login(
    @Req() req: Request,
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<
    ApiResponse<{
      accessToken: string;
      refreshToken?: string; // 👈 opcional (solo móvil)
      user: any;
      device: 'mobile' | 'web';
    }>
  > {
    const { accessToken, refreshToken, user } =
      await this.authService.login(dto);

    const isMobile = isMobileRequest(req);

    // ✅ WEB/PC: cookie + response normal
    if (!isMobile) {
      this.setRefreshCookie(res, refreshToken);
      return {
        status: 'success',
        data: {
          accessToken,
          user,
          device: 'web',
        },
        message: 'Login exitoso',
      };
    }

    // ✅ MÓVIL: NO cookie, devolver ambos tokens
    return {
      status: 'success',
      data: {
        accessToken,
        refreshToken,
        user,
        device: 'mobile',
      },
      message: 'Login exitoso',
    };
  }

  @Post('refresh')
  async refresh(
    @Req() req: Request,
    @Body() body: RefreshTokenBodyDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<
    ApiResponse<{
      accessToken: string;
      refreshToken?: string; // 👈 opcional (solo móvil)
      user: any;
      device: 'mobile' | 'web';
    }>
  > {
    const isMobile = isMobileRequest(req);

    // WEB: prioriza cookie
    let refreshToken = req.cookies?.['rt'];

    // MÓVIL (o fallback): body.refresh_token
    if (!refreshToken && body.refresh_token) {
      refreshToken = body.refresh_token;
    }

    if (!refreshToken) {
      throw new UnauthorizedException('No se encontró refresh token');
    }

    const {
      accessToken,
      refreshToken: newRefresh,
      user,
    } = await this.authService.refreshFromToken(refreshToken);

    // ✅ WEB: rotación guardada en cookie
    if (!isMobile) {
      this.setRefreshCookie(res, newRefresh);
      return {
        status: 'success',
        data: { accessToken, user, device: 'web' },
        message: 'Token renovado',
      };
    }

    // ✅ MÓVIL: devolver también el nuevo RT
    return {
      status: 'success',
      data: { accessToken, refreshToken: newRefresh, user, device: 'mobile' },
      message: 'Token renovado',
    };
  }
}
