import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { AfiliadosService } from './afiliados.service';
import { Afiliado } from './entities/afiliado.entity';

// Imports de tu arquitectura actual
import { ok } from '../common/utils/api-response.util';
import { ApiResponse } from '../common/interfaces/api-response.interface';
import { JwtAuthGuard } from '../seguridad/auth/jwt-auth.guard';
import { CrearAfiliadoDto } from './dto/crear-afiliado.dto';

@Controller('afiliados')
@UseGuards(JwtAuthGuard) // 🔒 Protegemos todo el controlador
export class AfiliadosController {
  constructor(private readonly afiliadosService: AfiliadosService) {}

  @Get()
  async listar(): Promise<ApiResponse<Afiliado[]>> {
    const afiliados = await this.afiliadosService.listarTodos();
    return ok(afiliados, 'Lista de afiliados recuperada exitosamente');
  }

  @Post()
  async crear(@Body() dto: CrearAfiliadoDto): Promise<ApiResponse<Afiliado>> {
    const afiliado = await this.afiliadosService.crear(dto);
    return ok(afiliado, 'Afiliado creado y usuario generado automáticamente');
  }
}
