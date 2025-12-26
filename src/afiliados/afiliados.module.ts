import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AfiliadosService } from './afiliados.service';
import { AfiliadosController } from './afiliados.controller';
import { Afiliado } from './entities/afiliado.entity';
import { SeguridadModule } from 'src/seguridad/seguridad.module';
import { AfiliacionHistorial } from './entities/afiliacion-historial.entity';
import { Aporte } from 'src/aportes/entities/aporte.entity';
import { Prestamo } from 'src/prestamos/entities/prestamo.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Afiliado, AfiliacionHistorial, Aporte, Prestamo]),
    SeguridadModule,
  ],
  controllers: [AfiliadosController],
  providers: [AfiliadosService],
  exports: [AfiliadosService], // Exportar si otros módulos lo necesitan
})
export class AfiliadosModule {}
