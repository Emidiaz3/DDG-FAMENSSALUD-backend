import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { PrestamosService } from './prestamos.service';
import { CrearPrestamoDto } from './dto/crear-prestamo.dto';
import { AnularPrestamoDto } from './dto/anular-prestamo.dto';
import { PrestamoListItemDto } from './dto/prestamo-list-item.dto';
import { PaginatedResponse } from 'src/common/interfaces/api-response.interface';
import { ListarPrestamosQueryDto } from './dto/listar-prestamos-query.dto';
import { okPaginated } from 'src/common/utils/pagination.util';
import { ListarTipoPrestamoQueryDto } from './dto/listar-tipo-prestamo-query.dto';
import { TipoPrestamo } from './entities/tipo-prestamo.entity';
import { ListarPagosPrestamoQueryDto } from './dto/listar-pagos-prestamo-query.dto';
import { ListarPrestamosAfiliadoQueryDto } from './dto/listar-prestamos-afiliado-query.dto';

@Controller('prestamos')
export class PrestamosController {
  constructor(private readonly prestamosService: PrestamosService) {}

  // (A) Resumen (cabecera y resumen de deuda)
  @Get('afiliado/:afiliadoId/resumen-prestamos')
  async resumenAfiliado(@Param('afiliadoId', ParseIntPipe) afiliadoId: number) {
    const data =
      await this.prestamosService.resumenPrestamosPorAfiliado(afiliadoId);
    return { status: 'success', data };
  }

  // (B) Historial de préstamos del afiliado (paginado)
  @Get('afiliado/:afiliadoId/prestamos')
  async historialPrestamos(
    @Param('afiliadoId', ParseIntPipe) afiliadoId: number,
    @Query() query: ListarPrestamosAfiliadoQueryDto,
  ) {
    const page = Number(query.page ?? 1);
    const limit = Number(query.limit ?? 10);
    const safePage = Number.isFinite(page) && page > 0 ? page : 1;
    const safeLimit = Number.isFinite(limit) && limit > 0 ? limit : 10;

    const { items, total } =
      await this.prestamosService.listarPrestamosDeAfiliadoPaginado(
        afiliadoId,
        query,
      );

    return okPaginated(
      items,
      total,
      safePage,
      safeLimit,
      'Historial de préstamos',
    );
  }

  // (C) Pagos por préstamo (paginado)
  @Get(':prestamoId/pagos')
  async pagosPrestamo(
    @Param('prestamoId', ParseIntPipe) prestamoId: number,
    @Query() query: ListarPagosPrestamoQueryDto,
  ) {
    const page = Number(query.page ?? 1);
    const limit = Number(query.limit ?? 10);
    const safePage = Number.isFinite(page) && page > 0 ? page : 1;
    const safeLimit = Number.isFinite(limit) && limit > 0 ? limit : 10;

    const { items, total } =
      await this.prestamosService.listarPagosDePrestamoPaginado(
        prestamoId,
        query,
      );

    return okPaginated(items, total, safePage, safeLimit, 'Pagos del préstamo');
  }

  // prestamos.controller.ts
  @Get(':prestamoId/info')
  async infoPrestamoModal(
    @Param('prestamoId', ParseIntPipe) prestamoId: number,
  ) {
    const data =
      await this.prestamosService.obtenerInfoPrestamoModal(prestamoId);

    return {
      status: 'success',
      data,
      message: 'Información del préstamo',
    };
  }

  @Post()
  async crear(@Body() dto: CrearPrestamoDto) {
    const prestamo = await this.prestamosService.crear(dto);

    return {
      status: 'success',
      data: prestamo,
    };
  }

  @Patch(':id/anular')
  async anular(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AnularPrestamoDto,
  ) {
    const prestamo = await this.prestamosService.anular(id, dto.motivo);
    return {
      status: 'success',
      data: prestamo,
    };
  }

  @Get()
  async listar(
    @Query() query: ListarPrestamosQueryDto,
  ): Promise<PaginatedResponse<PrestamoListItemDto>> {
    const page = Number(query.page ?? 1);
    const limit = Number(query.limit ?? 25);

    const safePage = Number.isFinite(page) && page > 0 ? page : 1;
    const safeLimit = Number.isFinite(limit) && limit > 0 ? limit : 25;

    const { items, total } = await this.prestamosService.listarPaginado({
      page: safePage,
      limit: safeLimit,
      search: query.search,
      fecha_desde: query.fecha_desde,
      fecha_hasta: query.fecha_hasta,
      departamento_id: query.departamento_id,
      base_id: query.base_id,
      tipo_prestamo_id: query.tipo_prestamo_id,
      estado_prestamo_id: query.estado_prestamo_id,
    });

    return okPaginated(
      items,
      total,
      safePage,
      safeLimit,
      'Lista de préstamos recuperada exitosamente',
    );
  }

  @Get('tipo-prestamo')
  async listarTipoPrestamo(
    @Query() query: ListarTipoPrestamoQueryDto,
    @Query('page') pageQ?: string,
    @Query('limit') limitQ?: string,
  ): Promise<PaginatedResponse<TipoPrestamo>> {
    const page = Number(pageQ ?? 1);
    const limit = Number(limitQ ?? 25);

    const safePage = Number.isFinite(page) && page > 0 ? page : 1;
    const safeLimit = Number.isFinite(limit) && limit > 0 ? limit : 25;

    const { items, total } =
      await this.prestamosService.listarTipoPrestamoPaginado({
        page: safePage,
        limit: safeLimit,
        search: query.search,
      });

    return okPaginated(items, total, safePage, safeLimit, 'Tipos de préstamo');
  }
}
