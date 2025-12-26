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
import { ExcesosService } from './excesos.service';
import { Exceso } from './entities/exceso.entity';
import { PaginatedResponse } from 'src/common/interfaces/api-response.interface';
import { ListarOperacionesQueryDto } from './dto/listar-operaciones-query.dto';
import { okPaginated } from 'src/common/utils/pagination.util';
import { ok } from 'src/common/utils/api-response.util';
import { getClientIp } from 'src/auditoria/utils/ip';
import { JwtAuthGuard } from 'src/seguridad/auth/jwt-auth.guard';
import { GuardarExcesoDto } from './dto/guardar-exceso.dto';

@UseGuards(JwtAuthGuard)
@Controller('operaciones/excesos')
export class ExcesosController {
  constructor(private readonly excesosService: ExcesosService) {}

  @Get()
  async listar(
    @Query() query: ListarOperacionesQueryDto,
  ): Promise<PaginatedResponse<Exceso>> {
    const page = Number(query.page ?? 1);
    const limit = Number(query.limit ?? 25);

    const safePage = Number.isFinite(page) && page > 0 ? page : 1;
    const safeLimit = Number.isFinite(limit) && limit > 0 ? limit : 25;

    const { items, total } = await this.excesosService.listarPaginado({
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
      'Lista de excesos recuperada exitosamente',
    );
  }

  // -------------------------
  // POST /operaciones/excesos
  // -------------------------
  @UseGuards(JwtAuthGuard)
  @Post('guardar')
  async guardar(@Body() dto: GuardarExcesoDto, @Req() req: any) {
    const ctx = {
      usuario_id: req?.user?.id ?? null,
      ip_origen: getClientIp(req),
      user_agent: req?.headers?.['user-agent'] ?? null,
    };

    const data = await this.excesosService.guardar(dto, ctx);

    return ok(
      data,
      dto.exceso_id
        ? 'Exceso actualizado exitosamente'
        : 'Exceso creado exitosamente',
    );
  }
  // -------------------------
  // DELETE /operaciones/excesos/:id
  // -------------------------
  @Delete(':id')
  async eliminar(@Param('id') id: string, @Req() req: Request) {
    const ctx = {
      usuario_id: (req as any)?.user?.id ?? null, // 👈 CLAVE
      ip_origen: getClientIp(req),
      user_agent: req.headers['user-agent'],
    };

    const data = await this.excesosService.eliminar(id, ctx);

    return ok(data, 'Exceso eliminado exitosamente');
  }
}
