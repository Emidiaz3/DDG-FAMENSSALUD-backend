import {
  Body,
  Controller,
  Param,
  ParseIntPipe,
  Post,
  Patch,
  Req,
  Get,
  Query,
} from '@nestjs/common';
import { PagosService } from './pagos.service';
import { RegistrarPagoNormalDto } from './dto/registrar-pago-normal.dto';
import { AnularPagoDto } from './dto/anular-pago.dto';
import { Pago } from './entities/pago.entity';
import { RegistrarPagoCancelacionTotalDto } from './dto/registrar-pago-cancelacion.dto';
import { TipoPagoPrestamo } from './entities/tipo-pago-prestamo.entity';
import { ApiResponse } from 'src/common/interfaces/api-response.interface';

@Controller('pagos')
export class PagosController {
  constructor(private readonly pagosService: PagosService) {}

  @Get('tipos-pago-prestamo')
  async listarTiposPago(
    @Query('codigos') codigos: string,
  ): Promise<ApiResponse<TipoPagoPrestamo[]>> {
    const listaCodigos = codigos ? codigos.split(',').map((c) => c.trim()) : [];

    const data = await this.pagosService.listarTiposPagoPorCodigo(listaCodigos);

    return {
      status: 'success',
      data,
      message: 'Tipos de pago de préstamo',
    };
  }

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
