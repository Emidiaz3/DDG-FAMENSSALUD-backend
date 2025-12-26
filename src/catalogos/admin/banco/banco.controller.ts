// src/catalogos/banco/banco.controller.ts
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
import { BancoService } from './banco.service';

type CrearBancoDto = { nombre: string };
type ActualizarBancoDto = { nombre?: string };

@UseGuards(JwtAuthGuard)
@Controller('catalogos/bancos')
export class BancoController {
  constructor(private readonly service: BancoService) {}

  @Get()
  async listar() {
    const data = await this.service.listar();
    return ok(data.data, 'Lista de bancos recuperada exitosamente');
  }

  @Post()
  async crear(@Body() dto: CrearBancoDto, @Req() req: any) {
    const ctx = {
      usuario_id: req?.user?.id ?? null,
      ip_origen: getClientIp(req),
      user_agent: req?.headers?.['user-agent'] ?? null,
    };
    const result = await this.service.crear(dto, ctx);
    return ok(result.data, 'Banco creado exitosamente');
  }

  @Post(':id')
  async actualizar(
    @Param('id') id: string,
    @Body() dto: ActualizarBancoDto,
    @Req() req: any,
  ) {
    const ctx = {
      usuario_id: req?.user?.id ?? null,
      ip_origen: getClientIp(req),
      user_agent: req?.headers?.['user-agent'] ?? null,
    };
    const result = await this.service.actualizar(Number(id), dto, ctx);
    return ok(result.data, 'Banco actualizado exitosamente');
  }

  @Delete(':id')
  async eliminar(@Param('id') id: string, @Req() req: any) {
    const ctx = {
      usuario_id: req?.user?.id ?? null,
      ip_origen: getClientIp(req),
      user_agent: req?.headers?.['user-agent'] ?? null,
    };
    const result = await this.service.eliminar(Number(id), ctx);
    return ok(result, 'Banco eliminado exitosamente');
  }
}
