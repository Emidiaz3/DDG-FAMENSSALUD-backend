// src/operaciones/operaciones-resumen.controller.ts
import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from 'src/seguridad/auth/jwt-auth.guard';
import { OperacionesResumenService } from './operaciones-resumen.service';
import { ok } from 'src/common/utils/api-response.util';
import { ResumenAdeudosQueryDto } from './dto/resumen-adeudo-query.dto';

@UseGuards(JwtAuthGuard)
@Controller('operaciones')
export class OperacionesResumenController {
  constructor(private readonly service: OperacionesResumenService) {}

  @Get('afiliado/:afiliadoId/resumen-adeudos')
  async resumenAdeudos(
    @Param('afiliadoId', ParseIntPipe) afiliadoId: number,
    @Query() query: ResumenAdeudosQueryDto,
  ) {
    const data = await this.service.resumenAdeudosPorAfiliado({
      afiliado_id: afiliadoId,
      fecha_desde: query.fecha_desde,
      fecha_hasta: query.fecha_hasta,
    });

    return ok(data, 'Resumen de excesos y devoluciones del afiliado');
  }
}
