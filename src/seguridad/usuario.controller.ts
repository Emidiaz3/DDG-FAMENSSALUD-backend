import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { UsuarioService } from './usuario.service';
import { CrearUsuarioDto } from './dto/crear-usuario.dto';
import { ok } from '../common/utils/api-response.util';
import { ApiResponse } from '../common/interfaces/api-response.interface';
import { Usuario } from './entities/usuario.entity';
import { JwtAuthGuard } from './auth/jwt-auth.guard';

@Controller('usuarios')
export class UsuarioController {
  constructor(private readonly usuarioService: UsuarioService) {}

  @UseGuards(JwtAuthGuard)
  @Get()
  async listar(): Promise<ApiResponse<Usuario[]>> {
    const usuarios = await this.usuarioService.listarTodos();
    return ok(usuarios);
  }

  @Post()
  async crear(@Body() dto: CrearUsuarioDto): Promise<ApiResponse<Usuario>> {
    const usuario = await this.usuarioService.crear(dto);
    return ok(usuario, 'Usuario creado correctamente');
  }
}
