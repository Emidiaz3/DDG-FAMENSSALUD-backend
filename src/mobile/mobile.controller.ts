// src/mobile/mobile.controller.ts
import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import { MobileService } from './mobile.service';
// usa tu guard real (JwtAuthGuard)
import { AuthGuard } from '@nestjs/passport';

@Controller('mobile')
@UseGuards(AuthGuard('jwt'))
export class MobileController {
  constructor(private readonly mobileService: MobileService) {}

  // 1) Home KPIs
  @Get('home')
  async home(@Req() req: any) {
    console.log(req.user);
    const afiliadoId = Number(req.user?.afiliadoId); // 👈 AJUSTA según tu payload
    return {
      status: 'success',
      data: await this.mobileService.getHomeKpis(afiliadoId),
    };
  }

  // 2) Mis Préstamos (activos)
  @Get('mis-prestamos')
  async misPrestamos(@Req() req: any) {
    const afiliadoId = Number(req.user?.afiliadoId);
    return {
      status: 'success',
      data: await this.mobileService.listarPrestamosActivos(afiliadoId),
    };
  }

  // 3) Mis Aportes (total + últimos N)
  @Get('mis-aportes')
  async misAportes(@Req() req: any, @Query('limit') limit?: string) {
    const afiliadoId = Number(req.user?.afiliadoId);
    const take = Number(limit ?? 10);
    const safeTake =
      Number.isFinite(take) && take > 0 ? Math.min(take, 100) : 10;

    return {
      status: 'success',
      data: await this.mobileService.misAportes(afiliadoId, safeTake),
    };
  }
}
