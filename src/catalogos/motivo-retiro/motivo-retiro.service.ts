import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MotivoRetiro } from '../entities/motivo-retiro.entity';

@Injectable()
export class MotivoRetiroService {
  constructor(
    @InjectRepository(MotivoRetiro)
    private readonly motivoRetiroRepo: Repository<MotivoRetiro>,
  ) {}

  async listar(options?: { soloActivos?: boolean }) {
    const soloActivos = options?.soloActivos ?? true;

    return this.motivoRetiroRepo.find({
      where: soloActivos ? { es_activo: true } : {},
      order: { nombre: 'ASC' },
    });
  }
}
