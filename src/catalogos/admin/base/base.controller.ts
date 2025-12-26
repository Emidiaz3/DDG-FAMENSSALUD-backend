// src/catalogos/base/base.controller.ts
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
import { BaseService } from './base.service';

type CrearBaseDto = {
  nombre: string;
  codigo?: string;
  departamento_id?: number;
};
type ActualizarBaseDto = Partial<CrearBaseDto>;

@UseGuards(JwtAuthGuard)
@Controller('catalogos/bases')
export class BaseController {
  constructor(private readonly service: BaseService) {}

  @Get()
  async listar(@Query('departamento_id') departamento_id?: string) {
    const depId = departamento_id ? Number(departamento_id) : undefined;
    const data = await this.service.listar(depId);
    return ok(data.data, 'Lista de bases recuperada exitosamente');
  }

  @Post()
  async crear(@Body() dto: CrearBaseDto, @Req() req: any) {
    const ctx = {
      usuario_id: req?.user?.id ?? null,
      ip_origen: getClientIp(req),
      user_agent: req?.headers?.['user-agent'] ?? null,
    };
    const result = await this.service.crear(dto, ctx);
    return ok(result.data, 'Base creada exitosamente');
  }

  @Post(':id')
  async actualizar(
    @Param('id') id: string,
    @Body() dto: ActualizarBaseDto,
    @Req() req: any,
  ) {
    const ctx = {
      usuario_id: req?.user?.id ?? null,
      ip_origen: getClientIp(req),
      user_agent: req?.headers?.['user-agent'] ?? null,
    };
    const result = await this.service.actualizar(Number(id), dto, ctx);
    return ok(result.data, 'Base actualizada exitosamente');
  }

  @Delete(':id')
  async eliminar(@Param('id') id: string, @Req() req: any) {
    const ctx = {
      usuario_id: req?.user?.id ?? null,
      ip_origen: getClientIp(req),
      user_agent: req?.headers?.['user-agent'] ?? null,
    };
    const result = await this.service.eliminar(Number(id), ctx);
    return ok(result, 'Base eliminada exitosamente');
  }
}
