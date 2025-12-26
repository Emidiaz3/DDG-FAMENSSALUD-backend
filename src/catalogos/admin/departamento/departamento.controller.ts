// src/catalogos/departamento/departamento.controller.ts
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from 'src/seguridad/auth/jwt-auth.guard';
import { getClientIp } from 'src/auditoria/utils/ip';
import { ok } from 'src/common/utils/api-response.util';
import { DepartamentoService } from './departamento.service';

type CrearDepartamentoDto = { pais_id: number; nombre: string };
type ActualizarDepartamentoDto = { pais_id?: number; nombre?: string };

@UseGuards(JwtAuthGuard)
@Controller('catalogos/departamentos')
export class DepartamentoController {
  constructor(private readonly service: DepartamentoService) {}

  @Get()
  async listar(@Query('pais_id') pais_id?: string) {
    const pid = pais_id ? Number(pais_id) : undefined;
    const data = await this.service.listar(pid);
    return ok(data.data, 'Lista de departamentos recuperada exitosamente');
  }

  @Post()
  async crear(@Body() dto: CrearDepartamentoDto, @Req() req: any) {
    const ctx = {
      usuario_id: req?.user?.id ?? null,
      ip_origen: getClientIp(req),
      user_agent: req?.headers?.['user-agent'] ?? null,
    };
    const result = await this.service.crear(dto, ctx);
    return ok(result.data, 'Departamento creado exitosamente');
  }

  @Post(':id')
  async actualizar(
    @Param('id') id: string,
    @Body() dto: ActualizarDepartamentoDto,
    @Req() req: any,
  ) {
    const ctx = {
      usuario_id: req?.user?.id ?? null,
      ip_origen: getClientIp(req),
      user_agent: req?.headers?.['user-agent'] ?? null,
    };
    const result = await this.service.actualizar(Number(id), dto, ctx);
    return ok(result.data, 'Departamento actualizado exitosamente');
  }

  @Delete(':id')
  async eliminar(@Param('id') id: string, @Req() req: any) {
    const ctx = {
      usuario_id: req?.user?.id ?? null,
      ip_origen: getClientIp(req),
      user_agent: req?.headers?.['user-agent'] ?? null,
    };
    const result = await this.service.eliminar(Number(id), ctx);
    return ok(result, 'Departamento eliminado exitosamente');
  }
}
