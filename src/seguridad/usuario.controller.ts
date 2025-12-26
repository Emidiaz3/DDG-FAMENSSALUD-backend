import { Controller, Get, Post, Body, UseGuards, Query } from '@nestjs/common';
import { UsuarioService } from './usuario.service';
import { CrearUsuarioDto } from './dto/crear-usuario.dto';
import { ok } from '../common/utils/api-response.util';
import {
  ApiResponse,
  PaginatedResponse,
} from '../common/interfaces/api-response.interface';
import { Usuario } from './entities/usuario.entity';
import { JwtAuthGuard } from './auth/jwt-auth.guard';
import { ListarUsuariosQueryDto } from './dto/listar-usuarios-query.dto';
import { UsuarioListItemDto } from './dto/usuario-list-item.dto';
import { okPaginated } from 'src/common/utils/pagination.util';

@Controller('usuarios')
export class UsuarioController {
  constructor(private readonly usuarioService: UsuarioService) {}

  @UseGuards(JwtAuthGuard)
  @Get()
  async listar(
    @Query() query: ListarUsuariosQueryDto,
  ): Promise<PaginatedResponse<UsuarioListItemDto>> {
    const page = Number(query.page ?? 1);
    const limit = Number(query.limit ?? 25);

    const safePage = Number.isFinite(page) && page > 0 ? page : 1;
    const safeLimit = Number.isFinite(limit) && limit > 0 ? limit : 25;

    const { items, total } = await this.usuarioService.listarPaginado({
      page: safePage,
      limit: safeLimit,
      search: query.search,
      rol_id: query.rol_id,
      fecha_desde: query.fecha_desde,
      fecha_hasta: query.fecha_hasta,
    });

    return okPaginated(
      items,
      total,
      safePage,
      safeLimit,
      'Lista de usuarios recuperada exitosamente',
    );
  }

  @Post()
  async crear(@Body() dto: CrearUsuarioDto): Promise<ApiResponse<Usuario>> {
    const usuario = await this.usuarioService.crear(dto);
    return ok(usuario, 'Usuario creado correctamente');
  }
}
