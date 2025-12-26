import {
  BadRequestException,
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AfiliadosService } from './afiliados.service';
import { Afiliado } from './entities/afiliado.entity';

// Imports de tu arquitectura actual
import { PaginatedResponse } from '../common/interfaces/api-response.interface';
import { JwtAuthGuard } from '../seguridad/auth/jwt-auth.guard';
import { GuardarAfiliadoDto } from './dto/crear-afiliado.dto';
import { okPaginated } from 'src/common/utils/pagination.util';
import { ListarAfiliadosQueryDto } from './dto/listar-afiliados-query.dto';
import { RetirarAfiliadoDto } from './dto/retirar-afiliado.dto';
import type { ModoAportes } from 'src/aportes/types/aportes.types';
import { ApiResponse } from 'src/common/decorator/custom-api-response.decorator';
import { ListarAportesAfiliadoQueryDto } from './dto/listar-aportes-afiliado-query.dto';

@Controller('afiliados')
@UseGuards(JwtAuthGuard) // 🔒 Protegemos todo el controlador
export class AfiliadosController {
  constructor(private readonly afiliadosService: AfiliadosService) {}

  @Post(':afiliadoId/retiro')
  async retirarAfiliado(
    @Param('afiliadoId', ParseIntPipe) afiliadoId: number,
    @Body() dto: RetirarAfiliadoDto,
    @Req() req: any,
  ) {
    // Ajusta según tu auth: req.user.usuario_id, req.user.id, etc.
    const usuarioId = req?.user?.id ?? null;

    const retiro = await this.afiliadosService.retirarAfiliado(
      afiliadoId,
      dto,
      usuarioId ?? undefined,
    );

    return {
      status: 'success',
      message: 'Afiliado retirado correctamente.',
      data: retiro,
    };
  }

  @Get()
  async listar(
    @Query() query: ListarAfiliadosQueryDto,
  ): Promise<PaginatedResponse<Afiliado>> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 25;

    const { items, total } = await this.afiliadosService.buscarPaginado({
      page,
      limit,
      estado: query.estado,
      search: query.search,
    });

    return okPaginated(
      items,
      total,
      page,
      limit,
      'Lista de afiliados recuperada exitosamente',
    );
  }

  @Get('busqueda-rapida')
  async busquedaRapida(
    @Query('q') q: string,
    @Query('limit') limit?: string,
  ): Promise<{ items: Afiliado[] }> {
    console.log('👉 ENTRO A busquedaRapida', { q, limit });
    if (!q || !q.trim()) {
      throw new BadRequestException({
        status: 'error',
        message: 'El parámetro "q" es obligatorio para la búsqueda.',
      });
    }

    let parsedLimit = parseInt(limit ?? '5', 10);
    if (isNaN(parsedLimit) || parsedLimit <= 0) {
      parsedLimit = 5;
    }
    // límite superior para no matar el server en autocompletes raros
    if (parsedLimit > 20) {
      parsedLimit = 20;
    }

    const items = await this.afiliadosService.buscarRapido(q, parsedLimit);

    return { items };
  }

  @Get(':id/aportes/kpis')
  async kpisAportes(@Param('id', ParseIntPipe) id: number) {
    return {
      status: 'success',
      data: await this.afiliadosService.obtenerKpisAportes(id),
    };
  }

  @Get(':id/aportes')
  async listarAportes(
    @Param('id', ParseIntPipe) id: number,
    @Query() query: ListarAportesAfiliadoQueryDto,
  ) {
    const page = Number(query.page ?? 1);
    const limit = Number(query.limit ?? 10);
    const safePage = Number.isFinite(page) && page > 0 ? page : 1;
    const safeLimit = Number.isFinite(limit) && limit > 0 ? limit : 10;

    const { items, total } =
      await this.afiliadosService.listarAportesDeAfiliadoPaginado(id, query);

    return okPaginated(
      items,
      total,
      safePage,
      safeLimit,
      'Historial de aportes',
    );
  }

  @Get(':id/detalleNew')
  @ApiResponse()
  async obtenerDetalleAfiliadoNew(@Param('id', ParseIntPipe) id: number) {
    return {
      status: 'success',
      data: await this.afiliadosService.obtenerDetalleAfiliadoSolo(id),
    };
  }

  @Get(':id/detalle')
  @ApiResponse()
  async obtenerDetalleAfiliado(
    @Param('id', ParseIntPipe) id: number,
    @Query('modo') modo?: ModoAportes,
  ) {
    const modoNormalizado: ModoAportes = (modo as ModoAportes) ?? 'actual';

    if (
      modoNormalizado !== 'actual' &&
      modoNormalizado !== 'historico' &&
      modoNormalizado !== 'todos'
    ) {
      throw new BadRequestException({
        status: 'error',
        message:
          "Modo inválido. Usa 'actual', 'historico' o 'todos' en el parámetro 'modo'.",
      });
    }

    return this.afiliadosService.obtenerDetalleAfiliado(id, modoNormalizado);
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<Afiliado> {
    const afiliado = await this.afiliadosService.findById(id);

    if (!afiliado) {
      throw new NotFoundException({
        status: 'error',
        message: `No existe un afiliado con ID ${id}.`,
      });
    }

    return afiliado;
  }

  @Post()
  crear(@Body() dto: GuardarAfiliadoDto) {
    return this.afiliadosService.guardar(dto); // sin id => crear
  }

  @Put(':id')
  actualizar(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: GuardarAfiliadoDto,
  ) {
    return this.afiliadosService.guardar({ ...dto, id }); // con id => actualizar
  }
}
