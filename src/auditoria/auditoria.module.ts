import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditoriaService } from './auditoria.service';
import { LogEvento } from './entities/log-event.entity';

@Module({
  imports: [TypeOrmModule.forFeature([LogEvento])],
  controllers: [],
  providers: [AuditoriaService],
  exports: [AuditoriaService], // Exportar si otros módulos lo necesitan
})
export class AuditoriaModule {}
