import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Banco } from '../entities/banco.entity';
import { Base } from '../entities/base.entity';
import { Moneda } from '../entities/moneda.entity';
import { RegimenLaboral } from '../entities/regimen-laboral.entity';
import { Departamento } from '../entities/departamento.entity';

import { BancoService } from './banco/banco.service';
import { BancoController } from './banco/banco.controller';

import { BaseService } from './base/base.service';
import { BaseController } from './base/base.controller';

import { MonedaService } from './moneda/moneda.service';
import { RegimenLaboralService } from './regimen-laboral/regimen-laboral.service';
import { RegimenLaboralController } from './regimen-laboral/regimen-laboral.controller';

import { DepartamentoService } from './departamento/departamento.service';
import { DepartamentoController } from './departamento/departamento.controller';
import { AuditoriaModule } from 'src/auditoria/auditoria.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Banco,
      Base,
      Moneda,
      RegimenLaboral,
      Departamento,
    ]),
    AuditoriaModule,
  ],
  controllers: [
    BancoController,
    BaseController,
    // MonedaController,
    RegimenLaboralController,
    DepartamentoController,
  ],
  providers: [
    BancoService,
    BaseService,
    MonedaService,
    RegimenLaboralService,
    DepartamentoService,
  ],
})
export class CatalogosAdminModule {}
