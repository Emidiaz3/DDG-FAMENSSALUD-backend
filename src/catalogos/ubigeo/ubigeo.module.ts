// catalogos/ubigeo.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Pais } from '../entities/pais.entity';
import { Departamento } from '../entities/departamento.entity';
import { Provincia } from '../entities/provincia.entity';
import { Distrito } from '../entities/distrito.entity';
import { UbigeoService } from './ubigeo.service';
import { UbigeoController } from './ubigeo.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([Pais, Departamento, Provincia, Distrito]),
  ],
  providers: [UbigeoService],
  controllers: [UbigeoController],
  exports: [UbigeoService],
})
export class UbigeoModule {}
