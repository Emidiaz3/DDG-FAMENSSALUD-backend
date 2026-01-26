import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ParametrosGlobalesService } from './parametros-globales.service';
import { JwtAuthGuard } from '../seguridad/auth/jwt-auth.guard';
import { ApiResponse } from 'src/common/decorator/custom-api-response.decorator';

@Controller('parametros-globales')
@UseGuards(JwtAuthGuard) // 🔒 protegemos igual que afiliados
export class ParametrosGlobalesController {
  constructor(private readonly parametrosService: ParametrosGlobalesService) {}

  /**
   * 🔹 Obtener parámetro global completo por clave
   * GET /parametros-globales/:clave
   */
  @Get(':clave')
  @ApiResponse()
  async getByClave(@Param('clave') clave: string) {
    const parametro = await this.parametrosService.getByClave(clave);

    return {
      status: 'success',
      data: parametro,
    };
  }

  /**
   * 🔹 Obtener valor STRING
   * GET /parametros-globales/:clave/string
   */
  @Get(':clave/string')
  @ApiResponse()
  async getString(@Param('clave') clave: string) {
    return {
      status: 'success',
      data: await this.parametrosService.getString(clave),
    };
  }

  /**
   * 🔹 Obtener valor NUMBER
   * GET /parametros-globales/:clave/number
   */
  @Get(':clave/number')
  @ApiResponse()
  async getNumber(@Param('clave') clave: string) {
    return {
      status: 'success',
      data: await this.parametrosService.getNumber(clave),
    };
  }

  /**
   * 🔹 Obtener valor BOOLEAN
   * GET /parametros-globales/:clave/boolean
   */
  @Get(':clave/boolean')
  @ApiResponse()
  async getBoolean(@Param('clave') clave: string) {
    return {
      status: 'success',
      data: await this.parametrosService.getBoolean(clave),
    };
  }

  /**
   * 🔹 Limpiar cache manualmente (opcional / admin)
   * GET /parametros-globales/cache/clear
   */
  @Get('cache/clear')
  clearCache() {
    this.parametrosService.clearCache();

    return {
      status: 'success',
      message: 'Cache de parámetros globales limpiado correctamente',
    };
  }
}
