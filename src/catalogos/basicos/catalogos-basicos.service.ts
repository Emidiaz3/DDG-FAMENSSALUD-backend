// src/catalogos/basicos/catalogos-basicos.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Base } from '../entities/base.entity';
import { Banco } from '../entities/banco.entity';
import { Moneda } from '../entities/moneda.entity';
import { RegimenLaboral } from '../entities/regimen-laboral.entity';

@Injectable()
export class CatalogosBasicosService {
  constructor(
    @InjectRepository(Base)
    private readonly baseRepo: Repository<Base>,
    @InjectRepository(Banco)
    private readonly bancoRepo: Repository<Banco>,
    @InjectRepository(Moneda)
    private readonly monedaRepo: Repository<Moneda>,
    @InjectRepository(RegimenLaboral)
    private readonly regimenRepo: Repository<RegimenLaboral>,
  ) {}

  // Bases por departamento_id
  async getBases(departamentoId?: number) {
    const where = departamentoId ? { departamento_id: departamentoId } : {};
    const data = await this.baseRepo.find({
      where,
      order: { nombre: 'ASC' },
    });
    return { status: 'success', data };
  }

  async getBancos() {
    const data = await this.bancoRepo.find({
      order: { nombre: 'ASC' },
    });
    return { status: 'success', data };
  }

  async getMonedas() {
    const data = await this.monedaRepo.find({
      order: { nombre: 'ASC' },
    });
    return { status: 'success', data };
  }

  async getRegimenesLaborales() {
    const data = await this.regimenRepo.find({
      order: { nombre: 'ASC' },
    });
    return { status: 'success', data };
  }
}
