// src/seguridad/rol.controller.ts
import { Controller, Get, UseGuards } from '@nestjs/common';
import { RolService } from './rol.service';
import { JwtAuthGuard } from './auth/jwt-auth.guard';
import { ok } from '../common/utils/api-response.util';
import { ApiResponse } from '../common/interfaces/api-response.interface';
import { RolSimpleDto } from './dto/rol-simple.dto';

@Controller('roles')
@UseGuards(JwtAuthGuard)
export class RolController {
  constructor(private readonly rolService: RolService) {}

  /**
   * GET /roles/para-creacion
   * Retorna solo ADMINISTRADOR y OPERADOR
   */
  @Get('para-creacion')
  async listarParaCreacion(): Promise<ApiResponse<RolSimpleDto[]>> {
    const roles = await this.rolService.listarRolesParaCreacion();
    return ok(roles, 'Roles disponibles para creación de usuarios');
  }

  /**
   * GET /roles
   * Retorna todos los roles activos
   */
  @Get()
  async listarTodos(): Promise<ApiResponse<RolSimpleDto[]>> {
    const roles = await this.rolService.listarTodos();
    return ok(roles, 'Todos los roles activos');
  }
}