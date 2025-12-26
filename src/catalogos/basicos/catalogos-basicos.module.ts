// src/catalogos/basicos/catalogos-basicos.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Base } from '../entities/base.entity';
import { Banco } from '../entities/banco.entity';
import { Moneda } from '../entities/moneda.entity';
import { RegimenLaboral } from '../entities/regimen-laboral.entity';
import { CatalogosBasicosService } from './catalogos-basicos.service';
import { CatalogosBasicosController } from './catalogos-basicos.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Base, Banco, Moneda, RegimenLaboral])],
  providers: [CatalogosBasicosService],
  controllers: [CatalogosBasicosController],
  exports: [CatalogosBasicosService],
})
export class CatalogosBasicosModule {}
