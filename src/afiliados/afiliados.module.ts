import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AfiliadosService } from './afiliados.service';
import { AfiliadosController } from './afiliados.controller';
import { Afiliado } from './entities/afiliado.entity';
import { SeguridadModule } from 'src/seguridad/seguridad.module';

@Module({
  imports: [TypeOrmModule.forFeature([Afiliado]), SeguridadModule],
  controllers: [AfiliadosController],
  providers: [AfiliadosService],
  exports: [AfiliadosService], // Exportar si otros módulos lo necesitan
})
export class AfiliadosModule {}
