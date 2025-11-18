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

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  private setRefreshCookie(res: Response, token: string) {
    const isProd = process.env.NODE_ENV === 'production';

    // res.cookie('rt', token, {
    //   httpOnly: true,
    //   // secure: isProd,
    //   secure: true,
    //   // sameSite: 'lax',
    //   sameSite: 'none', // IMPORTANTE si front y back tienen dominios distintos

    //   // path: '/', // 👈 se enviará a TODAS las rutas
    //   path: '/api/auth/refresh',
    //   maxAge: 7 * 24 * 60 * 60 * 1000,
    // });

    res.cookie('rt', token, {
      httpOnly: true,
      secure: true, // ngrok usa https → ponlo en true
      sameSite: 'none', // CLAVE: permitir envío en cross-site requests
      path: '/auth/refresh', // opcionalmente restringir al endpoint de refresh
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
  }

  @Post('login')
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<
    ApiResponse<{
      accessToken: string;
      user: any;
    }>
  > {
    const { accessToken, refreshToken, user } =
      await this.authService.login(dto);

    this.setRefreshCookie(res, refreshToken);

    return {
      status: 'success',
      data: {
        accessToken,
        user,
      },
      message: 'Login exitoso',
    };
  }

  @Post('refresh')
  async refresh(
    @Req() req: Request,
    @Body() body: RefreshTokenBodyDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<ApiResponse<{ accessToken: string; user: any }>> {
    // 1) Leer RT de la cookie (req.cookies.rt)

    console.log(req.cookies);

    let refreshToken = req.cookies?.['rt'];

    // opcional: permitir RT por body si no viene cookie
    if (!refreshToken && body.refresh_token) {
      refreshToken = body.refresh_token;
    }

    // 5) Si algo falla → 401
    if (!refreshToken) {
      throw new UnauthorizedException('No se encontró refresh token');
    }

    // 2, 3, 4) validar, comprobar en BD, rotar y generar nuevo access
    const {
      accessToken,
      refreshToken: newRefresh,
      user,
    } = await this.authService.refreshFromToken(refreshToken);

    this.setRefreshCookie(res, newRefresh);

    return {
      status: 'success',
      data: {
        accessToken,
        user,
      },
      message: 'Token renovado',
    };
  }
}
