import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ParametroGlobal } from './entities/parametro-global.entity';
import { ParametrosGlobalesService } from './parametros-globales.service';

@Module({
  imports: [TypeOrmModule.forFeature([ParametroGlobal])],
  providers: [ParametrosGlobalesService],
  exports: [ParametrosGlobalesService],
})
export class ConfiguracionModule {}
