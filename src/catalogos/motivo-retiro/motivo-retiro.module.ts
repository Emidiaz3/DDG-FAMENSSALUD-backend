import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MotivoRetiro } from '../entities/motivo-retiro.entity';
import { MotivoRetiroService } from './motivo-retiro.service';
import { MotivoRetiroController } from './motivo-retiro.controller';

@Module({
  imports: [TypeOrmModule.forFeature([MotivoRetiro])],
  controllers: [MotivoRetiroController],
  providers: [MotivoRetiroService],
  exports: [MotivoRetiroService],
})
export class MotivoRetiroModule {}
