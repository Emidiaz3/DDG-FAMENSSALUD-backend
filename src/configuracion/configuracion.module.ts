import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ParametroGlobal } from './entities/parametro-global.entity';
import { ParametrosGlobalesService } from './parametros-globales.service';
import { EmpresaConfig } from './entities/empresa-config.entity';
import { EmpresaConfigService } from './empresa-config.service';
import { EmpresaConfigController } from './empresa-config.controller';

@Module({
  imports: [TypeOrmModule.forFeature([ParametroGlobal, EmpresaConfig])],
  controllers: [EmpresaConfigController],
  providers: [ParametrosGlobalesService, EmpresaConfigService],
  exports: [ParametrosGlobalesService, EmpresaConfigService],
})
export class ConfiguracionModule {}
