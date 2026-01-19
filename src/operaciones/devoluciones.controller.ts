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
import { DevolucionesService } from './devoluciones.service';
import { Devolucion } from './entities/devolucion.entity';
import { okPaginated } from 'src/common/utils/pagination.util';
import { PaginatedResponse } from 'src/common/interfaces/api-response.interface';
import { ListarOperacionesQueryDto } from './dto/listar-operaciones-query.dto';
import { GuardarDevolucionDto } from './dto/guardar-devolucion.dto';
import { ok } from 'src/common/utils/api-response.util';
import { JwtAuthGuard } from 'src/seguridad/auth/jwt-auth.guard';
import { getClientIp } from 'src/auditoria/utils/ip';

@UseGuards(JwtAuthGuard)
@Controller('operaciones/devoluciones')
export class DevolucionesController {
  constructor(private readonly devolucionesService: DevolucionesService) {}

  @Get()
  async listar(
    @Query() query: ListarOperacionesQueryDto,
  ): Promise<PaginatedResponse<Devolucion>> {
    const page = Number(query.page ?? 1);
    const limit = Number(query.limit ?? 25);

    const safePage = Number.isFinite(page) && page > 0 ? page : 1;
    const safeLimit = Number.isFinite(limit) && limit > 0 ? limit : 25;

    const { items, total } = await this.devolucionesService.listarPaginado({
      page: safePage,
      limit: safeLimit,
      fecha_desde: query.fecha_desde,
      fecha_hasta: query.fecha_hasta,
    });

    return okPaginated(
      items,
      total,
      safePage,
      safeLimit,
      'Lista de devoluciones recuperada exitosamente',
    );
  }

  @Get('afiliado/:afiliadoId')
  async listarPorAfiliadoActual(
    @Param('afiliadoId') afiliadoId: string,
    @Query() query: ListarOperacionesQueryDto,
  ): Promise<PaginatedResponse<Devolucion>> {
    const page = Number(query.page ?? 1);
    const limit = Number(query.limit ?? 25);

    const safePage = Number.isFinite(page) && page > 0 ? page : 1;
    const safeLimit = Number.isFinite(limit) && limit > 0 ? limit : 25;

    const { items, total } =
      await this.devolucionesService.listarPaginadoPorAfiliadoActual({
        afiliado_id: Number(afiliadoId),
        page: safePage,
        limit: safeLimit,
        fecha_desde: query.fecha_desde,
        fecha_hasta: query.fecha_hasta,
      });

    return okPaginated(
      items,
      total,
      safePage,
      safeLimit,
      'Lista de devoluciones del afiliado (afiliación activa) recuperada exitosamente',
    );
  }

  // -------------------------
  // POST /operaciones/devoluciones
  // -------------------------
  @UseGuards(JwtAuthGuard)
  @Post('guardar')
  async guardar(@Body() dto: GuardarDevolucionDto, @Req() req: any) {
    const ctx = {
      usuario_id: req?.user?.id ?? null,
      ip_origen: getClientIp(req),
      user_agent: req?.headers?.['user-agent'] ?? null,
    };

    const data = await this.devolucionesService.guardar(dto, ctx);

    return ok(
      data,
      dto.devolucion_id
        ? 'Devolución actualizada exitosamente'
        : 'Devolución creada exitosamente',
    );
  }

  // -------------------------
  // DELETE /operaciones/devoluciones/:id
  // -------------------------
  @Delete(':id')
  async eliminar(@Param('id') id: string, @Req() req: Request) {
    const ctx = {
      usuario_id: (req as any)?.user?.id ?? null, // 👈 CLAVE
      ip_origen: getClientIp(req),
      user_agent: req.headers['user-agent'],
    };

    const data = await this.devolucionesService.eliminar(id, ctx);

    return ok(data, 'Devolución eliminada exitosamente');
  }
}
