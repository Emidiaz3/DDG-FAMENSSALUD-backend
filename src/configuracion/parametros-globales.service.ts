import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ParametroGlobal } from './entities/parametro-global.entity';

type CacheEntry = { value: ParametroGlobal; expiresAt: number };

@Injectable()
export class ParametrosGlobalesService {
  private cache = new Map<string, CacheEntry>();
  private ttlMs = 60_000; // 60s

  constructor(
    @InjectRepository(ParametroGlobal)
    private readonly repo: Repository<ParametroGlobal>,
  ) {}

  async getByClave(clave: string): Promise<ParametroGlobal> {
    const now = Date.now();
    const cached = this.cache.get(clave);
    if (cached && cached.expiresAt > now) return cached.value;

    const p = await this.repo.findOne({
      where: { clave, es_activo: true },
    });

    if (!p) {
      throw new NotFoundException({
        status: 'error',
        message: `Parámetro global no encontrado o inactivo: ${clave}`,
      });
    }

    this.cache.set(clave, { value: p, expiresAt: now + this.ttlMs });
    return p;
  }

  async getNumber(clave: string): Promise<number> {
    const p = await this.getByClave(clave);
    const n = Number(p.valor);
    if (!Number.isFinite(n)) {
      throw new NotFoundException({
        status: 'error',
        message: `Parámetro ${clave} no es numérico válido: "${p.valor}"`,
      });
    }
    return Number(n.toFixed(2));
  }

  async getString(clave: string): Promise<string> {
    const p = await this.getByClave(clave);
    return p.valor;
  }

  async getBoolean(clave: string): Promise<boolean> {
    const p = await this.getByClave(clave);
    const v = p.valor.trim().toLowerCase();
    return v === '1' || v === 'true' || v === 'si' || v === 'sí';
  }

  clearCache() {
    this.cache.clear();
  }
}
