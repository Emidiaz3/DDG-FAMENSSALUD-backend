import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Afiliado } from 'src/afiliados/entities/afiliado.entity';
import { AfiliacionHistorial } from 'src/afiliados/entities/afiliacion-historial.entity';
import { Prestamo } from 'src/prestamos/entities/prestamo.entity';
import { Pago } from 'src/prestamos/entities/pago.entity';
import { Aporte } from 'src/aportes/entities/aporte.entity';
import { ConfiguracionModule } from 'src/configuracion/configuracion.module';
import { AuditoriaModule } from 'src/auditoria/auditoria.module';

import { PlanillasController } from './planillas.controller';
import { PlanillasService } from './planillas.service';
import { PlanillaExcelParserService } from './planilla-excel-parser.service';
import { PlanillaDistribucionService } from './planilla-distribucion.service';
import { Planilla } from 'src/operaciones/entities/planilla.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Planilla,
      Afiliado,
      AfiliacionHistorial,
      Prestamo,
      Pago,
      Aporte,
    ]),
    ConfiguracionModule,
    AuditoriaModule,
  ],
  controllers: [PlanillasController],
  providers: [
    PlanillasService,
    PlanillaExcelParserService,
    PlanillaDistribucionService,
  ],
})
export class PlanillasModule {}
