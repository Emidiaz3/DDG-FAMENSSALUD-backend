// src/operaciones/operaciones-resumen.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Afiliado } from 'src/afiliados/entities/afiliado.entity';
import { Devolucion } from './entities/devolucion.entity';
import { ResumenAdeudosAfiliadoDto } from './dto/resumen-adeudo-afiliado.dto.';
import { Exceso } from './entities/exceso.entity';

@Injectable()
export class OperacionesResumenService {
  constructor(
    @InjectRepository(Afiliado)
    private readonly afiliadoRepo: Repository<Afiliado>,
    @InjectRepository(Exceso) private readonly excesoRepo: Repository<Exceso>,
    @InjectRepository(Devolucion)
    private readonly devolucionRepo: Repository<Devolucion>,
  ) {}

  async resumenAdeudosPorAfiliado(params: {
    afiliado_id: number;
    fecha_desde?: string;
    fecha_hasta?: string;
  }): Promise<ResumenAdeudosAfiliadoDto> {
    const { afiliado_id, fecha_desde, fecha_hasta } = params;

    const afiliado = await this.afiliadoRepo.findOne({
      where: { afiliado_id },
    });
    if (!afiliado) {
      throw new NotFoundException({
        status: 'error',
        message: 'El afiliado no existe.',
      });
    }

    // ---- EXCESOS
    const exQb = this.excesoRepo
      .createQueryBuilder('e')
      .select(
        `COALESCE(SUM(CAST(e.monto_exceso AS decimal(18,2))), 0)`,
        'total',
      )
      .where('e.afiliado_id = :afiliado_id', { afiliado_id });

    if (fecha_desde)
      exQb.andWhere('e.fecha_exceso >= :desde', { desde: fecha_desde });
    if (fecha_hasta)
      exQb.andWhere('e.fecha_exceso <= :hasta', { hasta: fecha_hasta });

    const exRaw = await exQb.getRawOne<{ total: string | number }>();
    const total_excesos = Number(exRaw?.total ?? 0);

    // ---- DEVOLUCIONES
    const devQb = this.devolucionRepo
      .createQueryBuilder('d')
      .select(
        `COALESCE(SUM(CAST(d.monto_devolucion AS decimal(18,2))), 0)`,
        'total',
      )
      .where('d.afiliado_id = :afiliado_id', { afiliado_id });

    if (fecha_desde)
      devQb.andWhere('d.fecha_devolucion >= :desde', { desde: fecha_desde });
    if (fecha_hasta)
      devQb.andWhere('d.fecha_devolucion <= :hasta', { hasta: fecha_hasta });

    const devRaw = await devQb.getRawOne<{ total: string | number }>();
    const total_devoluciones = Number(devRaw?.total ?? 0);

    const monto_adeuda = Number(
      (total_excesos - total_devoluciones).toFixed(2),
    );

    return {
      afiliado_id,
      total_excesos: Number(total_excesos.toFixed(2)),
      total_devoluciones: Number(total_devoluciones.toFixed(2)),
      monto_adeuda,
    };
  }
}
