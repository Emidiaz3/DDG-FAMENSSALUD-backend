// catalogos/ubigeo.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Pais } from '../entities/pais.entity';
import { Departamento } from '../entities/departamento.entity';
import { Provincia } from '../entities/provincia.entity';
import { Distrito } from '../entities/distrito.entity';

@Injectable()
export class UbigeoService {
  constructor(
    @InjectRepository(Pais)
    private readonly paisRepo: Repository<Pais>,

    @InjectRepository(Departamento)
    private readonly depRepo: Repository<Departamento>,

    @InjectRepository(Provincia)
    private readonly provRepo: Repository<Provincia>,

    @InjectRepository(Distrito)
    private readonly distRepo: Repository<Distrito>,
  ) {}

  async getPaises() {
    const data = await this.paisRepo.find({
      order: { nombre: 'ASC' },
    });
    return { status: 'success', data };
  }

  async getDepartamentosPorPais(paisId: number) {
    const data = await this.depRepo.find({
      where: { pais_id: paisId },
      order: { nombre: 'ASC' },
    });
    return { status: 'success', data };
  }

  async getProvinciasPorDepartamento(depId: number) {
    const data = await this.provRepo.find({
      where: { departamento_id: depId },
      order: { nombre: 'ASC' },
    });
    return { status: 'success', data };
  }

  async getDistritosPorProvincia(provId: number) {
    const data = await this.distRepo.find({
      where: { provincia_id: provId },
      order: { nombre: 'ASC' },
    });
    return { status: 'success', data };
  }
}
