// src/catalogos/regimen-laboral/regimen-laboral.controller.ts
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from 'src/seguridad/auth/jwt-auth.guard';
import { getClientIp } from 'src/auditoria/utils/ip';
import { ok } from 'src/common/utils/api-response.util';
import { RegimenLaboralService } from './regimen-laboral.service';

type CrearRegimenDto = { nombre: string };
type ActualizarRegimenDto = { nombre?: string };

@UseGuards(JwtAuthGuard)
@Controller('catalogos/regimenes-laborales')
export class RegimenLaboralController {
  constructor(private readonly service: RegimenLaboralService) {}

  @Get()
  async listar() {
    const data = await this.service.listar();
    return ok(
      data.data,
      'Lista de regímenes laborales recuperada exitosamente',
    );
  }

  @Post()
  async crear(@Body() dto: CrearRegimenDto, @Req() req: any) {
    const ctx = {
      usuario_id: req?.user?.id ?? null,
      ip_origen: getClientIp(req),
      user_agent: req?.headers?.['user-agent'] ?? null,
    };
    const result = await this.service.crear(dto, ctx);
    return ok(result.data, 'Régimen laboral creado exitosamente');
  }

  @Post(':id')
  async actualizar(
    @Param('id') id: string,
    @Body() dto: ActualizarRegimenDto,
    @Req() req: any,
  ) {
    const ctx = {
      usuario_id: req?.user?.id ?? null,
      ip_origen: getClientIp(req),
      user_agent: req?.headers?.['user-agent'] ?? null,
    };
    const result = await this.service.actualizar(Number(id), dto, ctx);
    return ok(result.data, 'Régimen laboral actualizado exitosamente');
  }

  @Delete(':id')
  async eliminar(@Param('id') id: string, @Req() req: any) {
    const ctx = {
      usuario_id: req?.user?.id ?? null,
      ip_origen: getClientIp(req),
      user_agent: req?.headers?.['user-agent'] ?? null,
    };
    const result = await this.service.eliminar(Number(id), ctx);
    return ok(result, 'Régimen laboral eliminado exitosamente');
  }
}
