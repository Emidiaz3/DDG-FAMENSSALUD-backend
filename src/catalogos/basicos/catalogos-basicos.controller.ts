// src/catalogos/basicos/catalogos-basicos.controller.ts
import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { CatalogosBasicosService } from './catalogos-basicos.service';
import { JwtAuthGuard } from 'src/seguridad/auth/jwt-auth.guard';

@Controller('catalogos')
@UseGuards(JwtAuthGuard) // 🔒 Protegemos todo el controlador
export class CatalogosBasicosController {
  constructor(private readonly service: CatalogosBasicosService) {}

  // GET /catalogos/bases?departamento_id=15
  @Get('bases')
  getBases(@Query('departamento_id') departamentoId?: string) {
    const depId = departamentoId ? parseInt(departamentoId, 10) : undefined;
    return this.service.getBases(depId);
  }

  // GET /catalogos/bancos
  @Get('bancos')
  getBancos() {
    return this.service.getBancos();
  }

  // GET /catalogos/monedas
  @Get('monedas')
  getMonedas() {
    return this.service.getMonedas();
  }

  // GET /catalogos/regimenes-laborales
  @Get('regimenes-laborales')
  getRegimenesLaborales() {
    return this.service.getRegimenesLaborales();
  }
}
