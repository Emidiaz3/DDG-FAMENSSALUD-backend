// src/mobile/mobile.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MobileController } from './mobile.controller';
import { MobileService } from './mobile.service';
import { Prestamo } from 'src/prestamos/entities/prestamo.entity';
import { Aporte } from 'src/aportes/entities/aporte.entity';
import { Afiliado } from 'src/afiliados/entities/afiliado.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Prestamo, Aporte, Afiliado])],
  controllers: [MobileController],
  providers: [MobileService],
})
export class MobileModule {}
