import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PrestamosService } from './prestamos.service';
import { PrestamosController } from './prestamos.controller';
import { Prestamo } from './entities/prestamo.entity';
import { Afiliado } from '../afiliados/entities/afiliado.entity';
import { AfiliacionHistorial } from '../afiliados/entities/afiliacion-historial.entity';
import { TipoPrestamo } from './entities/tipo-prestamo.entity';
import { Pago } from './entities/pago.entity';
import { PagosService } from './pagos.service';
import { PagosController } from './pagos.controller';
import { EstadoPrestamo } from './entities/estado-prestamo.entity';
import { TipoPagoPrestamo } from './entities/tipo-pago-prestamo.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Prestamo,
      Pago,
      Afiliado,
      AfiliacionHistorial,
      TipoPrestamo,
      EstadoPrestamo,
      TipoPagoPrestamo,
    ]),
  ],
  controllers: [PrestamosController, PagosController],
  providers: [PrestamosService, PagosService],
})
export class PrestamosModule {}
