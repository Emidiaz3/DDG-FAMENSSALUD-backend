import {
  Body,
  Controller,
  Param,
  ParseIntPipe,
  Post,
  Patch,
  Req,
} from '@nestjs/common';
import { PagosService } from './pagos.service';
import { RegistrarPagoNormalDto } from './dto/registrar-pago-normal.dto';
import { AnularPagoDto } from './dto/anular-pago.dto';
import { Pago } from './entities/pago.entity';
import { RegistrarPagoCancelacionTotalDto } from './dto/registrar-pago-cancelacion.dto';

@Controller('pagos')
export class PagosController {
  constructor(private readonly pagosService: PagosService) {}

  // POST /pagos/normal
  @Post('normal')
  async registrarPagoNormal(
    @Body() dto: RegistrarPagoNormalDto,
  ): Promise<Pago> {
    return this.pagosService.registrarPagoNormal(dto);
  }

  @Post('cancelacion-total')
  registrarCancelacionTotal(@Body() dto: RegistrarPagoCancelacionTotalDto) {
    return this.pagosService.registrarPagoCancelacionTotal(dto);
  }

  // PATCH /pagos/:id/anular
  @Patch(':id/anular')
  async anularPago(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AnularPagoDto,
    @Req() req: any, // si usas AuthGuard, aquí viene el usuario
  ): Promise<Pago> {
    const usuarioId = req.user?.id ?? undefined;
    const ip = req.ip;
    const userAgent = req.headers['user-agent'];

    return this.pagosService.anularPago(
      id,
      dto.motivo,
      usuarioId,
      ip,
      userAgent,
    );
  }
}
