import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Devolucion } from './entities/devolucion.entity';
import { Exceso } from './entities/exceso.entity';
import { Planilla } from './entities/planilla.entity';
import { ExcesosController } from './excesos.controller';
import { DevolucionesController } from './devoluciones.controller';
import { ExcesosService } from './excesos.service';
import { DevolucionesService } from './devoluciones.service';
import { LogEvento } from 'src/auditoria/entities/log-event.entity';
import { Afiliado } from 'src/afiliados/entities/afiliado.entity';
import { AfiliacionHistorial } from 'src/afiliados/entities/afiliacion-historial.entity';
import { OperacionesResumenController } from './operaciones-resumen.controller';
import { OperacionesResumenService } from './operaciones-resumen.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Devolucion,
      Exceso,
      Planilla,
      LogEvento,
      Afiliado,
      AfiliacionHistorial,
    ]),
  ],
  controllers: [
    ExcesosController,
    DevolucionesController,
    OperacionesResumenController,
  ],
  providers: [ExcesosService, DevolucionesService, OperacionesResumenService],
})
export class OperacionesModule {}
