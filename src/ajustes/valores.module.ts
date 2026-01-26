// src/valores/valores.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ValoresService } from './valores.service';
import { ValoresController } from './valores.controller';
import { ParametroGlobal } from './entities/parametro-global.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ParametroGlobal])],
  controllers: [ValoresController],
  providers: [ValoresService],
  exports: [ValoresService], // Exportar para que otros módulos puedan usarlo
})
export class ValoresModule {}