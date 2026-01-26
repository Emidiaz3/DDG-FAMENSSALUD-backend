import { Controller, Get, Post, Body, UseGuards, Query, Param, ParseIntPipe, Patch } from '@nestjs/common';
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
import { CambiarContrasenaDto } from './dto/cambiar-contrasena.dto';
import { ActualizarUsuarioDto } from './dto/actualizar-usuario.dto';

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

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  async obtenerPorId(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<ApiResponse<Usuario>> {
    const usuario = await this.usuarioService.obtenerPorId(id);
    return ok(usuario, 'Usuario recuperado exitosamente');
  }

  @Post()
  async crear(@Body() dto: CrearUsuarioDto): Promise<ApiResponse<Usuario>> {
    const usuario = await this.usuarioService.crear(dto);
    return ok(usuario, 'Usuario creado correctamente');
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  async actualizar(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ActualizarUsuarioDto,
  ): Promise<ApiResponse<Usuario>> {
    const usuario = await this.usuarioService.actualizar(id, dto);
    return ok(usuario, 'Usuario actualizado correctamente');
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id/anular')
  async anular(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<ApiResponse<Usuario>> {
    const usuario = await this.usuarioService.anular(id);
    return ok(usuario, 'Usuario anulado correctamente');
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id/activar')
  async activar(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<ApiResponse<Usuario>> {
    const usuario = await this.usuarioService.activar(id);
    return ok(usuario, 'Usuario activado correctamente');
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id/cambiar-contrasena')
  async cambiarContrasena(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CambiarContrasenaDto,
  ): Promise<ApiResponse<null>> {
    await this.usuarioService.cambiarContrasena(id, dto);
    return ok(null, 'Contraseña cambiada correctamente');
  }
}