import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { MotivoRetiroService } from './motivo-retiro.service';
import { JwtAuthGuard } from 'src/seguridad/auth/jwt-auth.guard';

@Controller('catalogos/motivos-retiro')
@UseGuards(JwtAuthGuard)
export class MotivoRetiroController {
  constructor(private readonly motivoRetiroService: MotivoRetiroService) {}

  /**
   * GET /catalogos/motivos-retiro
   * GET /catalogos/motivos-retiro?incluirInactivos=true
   */
  @Get()
  async listar(@Query('incluirInactivos') incluirInactivos?: string) {
    const soloActivos = incluirInactivos !== 'true';

    const items = await this.motivoRetiroService.listar({
      soloActivos,
    });

    return {
      status: 'success',
      data: items.map((m) => ({
        motivo_retiro_id: m.motivo_retiro_id,
        codigo: m.codigo,
        nombre: m.nombre,
      })),
    };
  }
}
