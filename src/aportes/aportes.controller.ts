// src/aportes/aportes.controller.ts
import {
  Controller,
  Post,
  Body,
  UseGuards,
  Get,
  Param,
  Query,
  ParseIntPipe,
} from '@nestjs/common';
import { AportesService, ResumenAportesPorAfiliado } from './aportes.service';
import { CrearAporteDto } from './dto/crear-aporte.dto';
import { JwtAuthGuard } from 'src/seguridad/auth/jwt-auth.guard';
import { ApiResponse } from 'src/common/decorator/custom-api-response.decorator';
import type {
  ListarResumenAportesQueryDto,
  ModoAportes,
} from './types/aportes.types';
import { PaginatedResponse } from 'src/common/interfaces/api-response.interface';
import { okPaginated } from 'src/common/utils/pagination.util';

@Controller('aportes')
@UseGuards(JwtAuthGuard)
export class AportesController {
  constructor(private readonly aportesService: AportesService) {}

  @Post()
  async crear(@Body() dto: CrearAporteDto) {
    const aporte = await this.aportesService.crear(dto);
    return {
      status: 'success',
      data: aporte,
    };
  }

  @Get('resumen')
  @ApiResponse()
  async listarResumenAportes(
    @Query() query: ListarResumenAportesQueryDto,
  ): Promise<PaginatedResponse<ResumenAportesPorAfiliado>> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 25;
    const modo: ModoAportes = query.modo ?? 'actual';

    const { items, total } =
      await this.aportesService.listarTodosConUltimoAporte({
        page,
        limit,
        modo,
        estado: query.estado,
        search: query.search,
      });

    return okPaginated(
      items,
      total,
      page,
      limit,
      'Resumen de aportes recuperado exitosamente',
    );
  }

  @Get('afiliados/:id/aportes')
  async listarPorAfiliado(
    @Param('id', ParseIntPipe) id: number,
    @Query('modo') modo?: 'actual' | 'historico' | 'todos',
  ) {
    const { afiliado, aportes, totalAportes } =
      await this.aportesService.listarPorAfiliado(
        id,
        (modo as any) || 'actual',
      );

    return {
      status: 'success',
      data: {
        afiliado,
        aportes,
        totalAportes,
      },
    };
  }
}
