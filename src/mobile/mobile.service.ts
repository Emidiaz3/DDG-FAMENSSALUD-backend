// src/mobile/mobile.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Aporte } from 'src/aportes/entities/aporte.entity';
import { Prestamo } from 'src/prestamos/entities/prestamo.entity';
import { EstadoPrestamoEnum } from 'src/prestamos/prestamos.constants';
import { toYmd } from 'src/common/utils/date.util';
import { Afiliado } from 'src/afiliados/entities/afiliado.entity';

@Injectable()
export class MobileService {
  constructor(
    @InjectRepository(Aporte)
    private readonly aporteRepo: Repository<Aporte>,

    @InjectRepository(Prestamo)
    private readonly prestamoRepo: Repository<Prestamo>,

    @InjectRepository(Afiliado)
    private readonly afiliadoRepo: Repository<Afiliado>,
  ) {}

  // 1) KPIs Home: aportes acumulados, # préstamos activos, saldo pendiente total
  async getHomeKpis(afiliadoId: number) {
    if (!afiliadoId) {
      throw new NotFoundException({
        status: 'error',
        message: 'Afiliado no válido en token.',
      });
    }

    // total aportes
    const aporteAgg = await this.aporteRepo
      .createQueryBuilder('a')
      .select('COALESCE(SUM(a.monto_aporte), 0)', 'total_aportes')
      .where('a.afiliado_id = :afiliadoId', { afiliadoId })
      .getRawOne<{ total_aportes: string }>();

    // préstamos activos: count + saldo total
    const prestamoAgg = await this.prestamoRepo
      .createQueryBuilder('p')
      .select('COUNT(1)', 'prestamos_activos')
      .addSelect('COALESCE(SUM(p.monto_saldo), 0)', 'saldo_pendiente')
      .where('p.afiliado_id = :afiliadoId', { afiliadoId })
      .andWhere('p.estado_prestamo_id = :estado', {
        estado: EstadoPrestamoEnum.PENDIENTE,
      })
      .getRawOne<{ prestamos_activos: string; saldo_pendiente: string }>();

    return {
      aportes_acumulados: Number(
        Number(aporteAgg?.total_aportes ?? 0).toFixed(2),
      ),
      prestamos_activos: Number(prestamoAgg?.prestamos_activos ?? 0),
      saldo_pendiente: Number(
        Number(prestamoAgg?.saldo_pendiente ?? 0).toFixed(2),
      ),
    };
  }

  // 2) Mis Préstamos: listar préstamos activos con campos requeridos
  async listarPrestamosActivos(afiliadoId: number) {
    const existe = await this.afiliadoRepo.exist({
      where: { afiliado_id: afiliadoId },
    });
    if (!existe) {
      throw new NotFoundException({
        status: 'error',
        message: 'El afiliado no existe.',
      });
    }

    const prestamos = await this.prestamoRepo.find({
      where: {
        afiliado_id: afiliadoId,
        estado_prestamo_id: EstadoPrestamoEnum.PENDIENTE,
      },
      relations: ['tipo_prestamo'],
      order: { fecha_prestamo: 'DESC', numero_prestamo: 'DESC' },
    });

    return {
      items: prestamos.map((p) => ({
        prestamo_id: p.prestamo_id,

        tipo_prestamo_id: p.tipo_prestamo_id,
        tipo_prestamo: p.tipo_prestamo
          ? {
              tipo_prestamo_id: p.tipo_prestamo.tipo_prestamo_id,
              codigo: p.tipo_prestamo.codigo,
              descripcion: p.tipo_prestamo.descripcion,
              tasa_interes_mensual: Number(
                p.tipo_prestamo.tasa_interes_mensual,
              ),
            }
          : null,

        fecha_prestamo: toYmd(p.fecha_prestamo) ?? String(p.fecha_prestamo),

        monto_prestamo: Number(p.monto_prestamo),
        saldo_pendiente: Number(p.monto_saldo),
        cuota_mensual: Number(p.cuota_mensual),
        saldo_pagado: Number(p.monto_total_pagado), // lo que ya pagó
      })),
    };
  }

  // 3) Mis Aportes: total acumulado + últimos N aportes con planilla
  async misAportes(afiliadoId: number, limit: number) {
    const existe = await this.afiliadoRepo.exist({
      where: { afiliado_id: afiliadoId },
    });
    if (!existe) {
      throw new NotFoundException({
        status: 'error',
        message: 'El afiliado no existe.',
      });
    }

    const totalAgg = await this.aporteRepo
      .createQueryBuilder('a')
      .select('COALESCE(SUM(a.monto_aporte), 0)', 'total_aportes')
      .where('a.afiliado_id = :afiliadoId', { afiliadoId })
      .getRawOne<{ total_aportes: string }>();

    const aportes = await this.aporteRepo.find({
      where: { afiliado_id: afiliadoId },
      relations: ['planilla'],
      order: { fecha_aporte: 'DESC', aporte_id: 'DESC' },
      take: limit,
    });

    return {
      total_aportes_acumulados: Number(
        Number(totalAgg?.total_aportes ?? 0).toFixed(2),
      ),
      items: aportes.map((a) => ({
        aporte_id: a.aporte_id,
        fecha_aporte: toYmd(a.fecha_aporte) ?? String(a.fecha_aporte),
        monto_aporte: Number(a.monto_aporte),

        planilla_id: a.planilla_id ?? null,
        planilla: a.planilla
          ? {
              planilla_id: a.planilla.planilla_id,
              codigo: a.planilla.codigo,
              anio: a.planilla.anio,
              mes: a.planilla.mes,
              tipo: a.planilla.tipo,
            }
          : null,
      })),
    };
  }
}
