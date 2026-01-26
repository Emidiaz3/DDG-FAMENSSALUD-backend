// src/auditoria/auditoria.controller.ts
import {
  Controller,
  Get,
  Query,
  UseGuards,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import { AuditoriaService } from './auditoria.service';
import { JwtAuthGuard } from 'src/seguridad/auth/jwt-auth.guard';
import { ApiResponse } from 'src/common/decorator/custom-api-response.decorator';
import { PaginatedResponse } from 'src/common/interfaces/api-response.interface';
import { okPaginated } from 'src/common/utils/pagination.util';
import { LogEvento } from './entities/log-event.entity';

// GET /auditoria/logs
@Controller('auditoria')
@UseGuards(JwtAuthGuard)
export class AuditoriaController {
  constructor(private readonly auditoriaService: AuditoriaService) {}

  @Get('logs')
  @ApiResponse()
  async listarLogs(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(25), ParseIntPipe) limit: number,
    @Query('categoria') categoria?: string,
    @Query('tipo_evento') tipo_evento?: string,
    @Query('usuario_id', new ParseIntPipe({ optional: true }))
    usuario_id?: number,
    @Query('es_exitoso') es_exitoso?: string,
    @Query('entidad_esquema') entidad_esquema?: string,
    @Query('entidad_tabla') entidad_tabla?: string,
    @Query('fecha_desde') fecha_desde?: string,
    @Query('fecha_hasta') fecha_hasta?: string,
    @Query('search') search?: string,
  ): Promise<PaginatedResponse<LogEvento>> {
    const { items, total } = await this.auditoriaService.listar({
      page,
      limit,
      categoria,
      tipo_evento,
      usuario_id,
      es_exitoso: es_exitoso === 'true' ? true : es_exitoso === 'false' ? false : undefined,
      entidad_esquema,
      entidad_tabla,
      fecha_desde,
      fecha_hasta,
      search,
    });

    return okPaginated(
      items,
      total,
      page,
      limit,
      'Logs de auditoría recuperados exitosamente',
    );
  }
}