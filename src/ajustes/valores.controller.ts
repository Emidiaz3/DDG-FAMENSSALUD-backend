// src/valores/valores.controller.ts
import {
  Controller,
  Get,
  Patch,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ValoresService } from './valores.service';
import { ActualizarParametroDto } from './dto/actualizar-parametro.dto';
import { ActualizarMultiplesParametrosDto } from './dto/actualizar-multiples-parametros.dto';
import { JwtAuthGuard } from 'src/seguridad/auth/jwt-auth.guard';
import { ApiResponse } from 'src/common/decorator/custom-api-response.decorator';

@Controller('valores')
@UseGuards(JwtAuthGuard)
export class ValoresController {
  constructor(private readonly valoresService: ValoresService) {}

  @Get()
  @ApiResponse()
  async listarTodos() {
    const parametros = await this.valoresService.listarTodos();
    return {
      status: 'success',
      data: parametros,
      message: 'Parámetros globales recuperados exitosamente',
    };
  }

  @Get('agrupados')
  @ApiResponse()
  async obtenerAgrupados() {
    const agrupados = await this.valoresService.obtenerValoresAgrupados();
    return {
      status: 'success',
      data: agrupados,
      message: 'Parámetros agrupados recuperados exitosamente',
    };
  }

  @Get(':clave')
  @ApiResponse()
  async obtenerPorClave(@Param('clave') clave: string) {
    const parametro = await this.valoresService.obtenerPorClave(clave);
    return {
      status: 'success',
      data: parametro,
      message: 'Parámetro recuperado exitosamente',
    };
  }

  @Patch(':clave')
  @ApiResponse()
  async actualizar(
    @Param('clave') clave: string,
    @Body() dto: ActualizarParametroDto,
  ) {
    const parametro = await this.valoresService.actualizar(clave, dto);
    return {
      status: 'success',
      data: parametro,
      message: 'Parámetro actualizado exitosamente',
    };
  }

  @Patch()
  @ApiResponse()
  async actualizarMultiples(@Body() dto: ActualizarMultiplesParametrosDto) {
    const resultado = await this.valoresService.actualizarMultiples(
      dto.parametros,
    );
    return {
      status: 'success',
      data: resultado,
      message: `${resultado.actualizados} parámetros actualizados exitosamente`,
    };
  }
}