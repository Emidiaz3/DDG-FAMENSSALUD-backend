// src/aportes/aportes.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AportesService } from './aportes.service';
import { AportesController } from './aportes.controller';
import { Aporte } from './entities/aporte.entity';
import { Afiliado } from '../afiliados/entities/afiliado.entity';
import { AfiliacionHistorial } from '../afiliados/entities/afiliacion-historial.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Aporte, Afiliado, AfiliacionHistorial])],
  controllers: [AportesController],
  providers: [AportesService],
})
export class AportesModule {}
