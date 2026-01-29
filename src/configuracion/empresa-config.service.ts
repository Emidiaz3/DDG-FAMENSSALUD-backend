import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EmpresaConfig } from './entities/empresa-config.entity';
import { UpdateEmpresaConfigDto } from './dto/update-empresa-config.dto';

@Injectable()
export class EmpresaConfigService {
  private readonly SINGLETON_ID = 1;

  constructor(
    @InjectRepository(EmpresaConfig)
    private readonly repo: Repository<EmpresaConfig>,
  ) {}

  async get(): Promise<EmpresaConfig> {
    const row = await this.repo.findOne({
      where: { empresa_config_id: this.SINGLETON_ID },
    });

    if (!row) {
      const created = this.repo.create({
        empresa_config_id: this.SINGLETON_ID,
        razon_social: '',
        titulo: '',
        ruc: '00000000000',
        creado_en: new Date(),
        actualizado_en: new Date(),
      });
      return this.repo.save(created);
    }

    return row;
  }

  async update(dto: UpdateEmpresaConfigDto): Promise<EmpresaConfig> {
    const row = await this.repo.findOne({
      where: { empresa_config_id: this.SINGLETON_ID },
    });

    if (!row) {
      throw new NotFoundException({
        status: 'error',
        message: 'No existe la configuración de empresa (id=1). Ejecuta el seed.',
      });
    }

    const merged = this.repo.merge(row, {
      ...dto,
      actualizado_en: new Date(),
    });

    return this.repo.save(merged);
  }
}
