// src/aportes/aportes.service.ts
import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, IsNull, Like, Repository } from 'typeorm';
import { Aporte } from './entities/aporte.entity';
import { CrearAporteDto } from './dto/crear-aporte.dto';
import { Afiliado } from '../afiliados/entities/afiliado.entity';
import { AfiliacionHistorial } from '../afiliados/entities/afiliacion-historial.entity';
import { ModoAportes } from './types/aportes.types';

export type ResumenAportesPorAfiliado = {
  afiliado: Afiliado;
  ultimoAporte: Aporte | null;
  numeroAporte: number; // N° de aporte (count)
};

@Injectable()
export class AportesService {
  constructor(
    @InjectRepository(Aporte)
    private readonly aporteRepo: Repository<Aporte>,
    @InjectRepository(Afiliado)
    private readonly afiliadoRepo: Repository<Afiliado>,
    @InjectRepository(AfiliacionHistorial)
    private readonly historialRepo: Repository<AfiliacionHistorial>,
  ) {}

  async crear(dto: CrearAporteDto): Promise<Aporte> {
    const afiliado = await this.afiliadoRepo.findOne({
      where: { afiliado_id: dto.afiliado_id },
    });

    if (!afiliado) {
      throw new NotFoundException({
        status: 'error',
        message: 'El afiliado no existe.',
      });
    }

    if (!afiliado.estado) {
      throw new BadRequestException({
        status: 'error',
        message: 'El afiliado no está ACTIVO y no puede registrar aportes.',
      });
    }

    const historial = await this.historialRepo.findOne({
      where: { afiliado_id: afiliado.afiliado_id, es_activo: true },
    });

    if (!historial) {
      throw new BadRequestException({
        status: 'error',
        message: 'No existe historial de afiliación activo para este afiliado.',
      });
    }

    const aporte = this.aporteRepo.create({
      afiliado_id: afiliado.afiliado_id,
      afiliacion_historial_id: historial.afiliacion_historial_id,
      fecha_aporte: dto.fecha_aporte as any,
      monto_aporte: dto.monto_aporte,
      origen: dto.origen,
      referencia_lote: dto.referencia_lote,
      observacion: dto.observacion,
      codtra_legacy: dto.codtra_legacy,
      codafi2_legacy: dto.codafi2_legacy,
      codafi_legacy: dto.codafi_legacy,
      codret_legacy: dto.codret_legacy,
      estafi_legacy: dto.estafi_legacy,
      ind_legacy: dto.ind_legacy,
    });

    return this.aporteRepo.save(aporte);
  }

  // luego puedes agregar listados, por afiliado, por rango de fechas, etc.

  async listarPorAfiliado(
    afiliadoId: number,
    modo: ModoAportes = 'actual',
  ): Promise<{ afiliado: Afiliado; aportes: Aporte[]; totalAportes: number }> {
    const afiliado = await this.afiliadoRepo.findOne({
      where: { afiliado_id: afiliadoId },
    });

    if (!afiliado) {
      throw new NotFoundException({
        status: 'error',
        message: 'El afiliado no existe.',
      });
    }

    const historialActivo = await this.historialRepo.findOne({
      where: { afiliado_id: afiliado.afiliado_id, es_activo: true },
      order: { fecha_inicio: 'DESC' },
    });

    let aportes: Aporte[] = [];

    if (modo === 'actual') {
      if (!historialActivo) {
        // Afiliado retirado o con datos viejos sin historial activo
        return { afiliado, aportes: [], totalAportes: 0 };
      }

      aportes = await this.aporteRepo.find({
        where: {
          afiliado_id: afiliado.afiliado_id,
          afiliacion_historial_id: historialActivo.afiliacion_historial_id,
        },
        order: { fecha_aporte: 'ASC' },
      });
    } else if (modo === 'historico') {
      if (historialActivo) {
        // Todo lo que no sea el historial activo (incluye NULL = legado)
        aportes = await this.aporteRepo.find({
          where: [
            {
              afiliado_id: afiliado.afiliado_id,
              afiliacion_historial_id: IsNull(),
            },
            {
              afiliado_id: afiliado.afiliado_id,
              // distinto al activo
              afiliacion_historial_id: historialActivo.afiliacion_historial_id, // 👈 ojo: esto trae los del activo
            },
          ],
          order: { fecha_aporte: 'ASC' },
        });

        // Mejor hacemos la condición "no igual" con query builder:
        aportes = await this.aporteRepo
          .createQueryBuilder('a')
          .where('a.afiliado_id = :afiliadoId', {
            afiliadoId: afiliado.afiliado_id,
          })
          .andWhere(
            '(a.afiliacion_historial_id IS NULL OR a.afiliacion_historial_id <> :historialId)',
            { historialId: historialActivo.afiliacion_historial_id },
          )
          .orderBy('a.fecha_aporte', 'ASC')
          .getMany();
      } else {
        // Sin historial activo: devolvemos todo el histórico
        aportes = await this.aporteRepo.find({
          where: { afiliado_id: afiliado.afiliado_id },
          order: { fecha_aporte: 'ASC' },
        });
      }
    } else if (modo === 'todos') {
      aportes = await this.aporteRepo.find({
        where: { afiliado_id: afiliado.afiliado_id },
        order: { fecha_aporte: 'ASC' },
      });
    } else {
      throw new BadRequestException({
        status: 'error',
        message:
          "Modo inválido. Usa 'actual', 'historico' o 'todos' en el parámetro 'modo'.",
      });
    }

    // 🧮 Calcular la suma total de los aportes
    const totalAportes = aportes.reduce((sum, aporte) => {
      const valor = parseFloat(aporte.monto_aporte as any);
      return sum + (isNaN(valor) ? 0 : valor);
    }, 0);

    return { afiliado, aportes, totalAportes };
  }

  async listarTodosConUltimoAporte(params: {
    page: number;
    limit: number;
    modo: ModoAportes;
    estado?: boolean;
    search?: string;
  }): Promise<{ items: ResumenAportesPorAfiliado[]; total: number }> {
    const { page, limit, modo, estado, search } = params;
    const skip = (page - 1) * limit;

    // 1) WHERE base para afiliados (igual que en buscarPaginado)
    const baseWhere: FindOptionsWhere<Afiliado> = {};
    if (estado !== undefined) {
      baseWhere.estado = estado;
    }

    let where: FindOptionsWhere<Afiliado> | FindOptionsWhere<Afiliado>[];

    if (search && search.trim() !== '') {
      const term = `%${search.trim()}%`;

      where = [
        { ...baseWhere, nombres: Like(term) },
        { ...baseWhere, ap_paterno: Like(term) },
        { ...baseWhere, doc_identidad: Like(term) },
      ];
    } else {
      where = baseWhere;
    }

    // 2) Paginamos afiliados (NO todos)
    const [afiliados, total] = await this.afiliadoRepo.findAndCount({
      where,
      skip,
      take: limit,
      order: { ap_paterno: 'ASC', nombres: 'ASC' },
    });

    const resultados: ResumenAportesPorAfiliado[] = [];

    // 3) Para cada afiliado de ESTA página, armamos el resumen
    for (const afiliado of afiliados) {
      // 3.1) Buscar historial activo (si aplica)
      const historialActivo = await this.historialRepo.findOne({
        where: { afiliado_id: afiliado.afiliado_id, es_activo: true },
        order: { fecha_inicio: 'DESC' },
      });

      // 3.2) Armar query base según "modo"
      const qbBase = this.buildAporteBaseQuery(afiliado, modo, historialActivo);

      if (!qbBase) {
        // Caso modo = 'actual' y sin historial activo → no hay aportes
        resultados.push({
          afiliado,
          ultimoAporte: null,
          numeroAporte: 0,
        });
        continue;
      }

      // 3.3) Contar N° de aportes (para ese modo)
      const numeroAporte = await qbBase.clone().getCount();

      // 3.4) Obtener el último aporte (por fecha y luego por id)
      const ultimoAporte = await qbBase
        .clone()
        .orderBy('a.fecha_aporte', 'DESC')
        .addOrderBy('a.aporte_id', 'DESC')
        .getOne();

      resultados.push({
        afiliado,
        ultimoAporte: ultimoAporte ?? null,
        numeroAporte,
      });
    }

    return { items: resultados, total };
  }

  /* helpers */

  private buildAporteBaseQuery(
    afiliado: Afiliado,
    modo: ModoAportes,
    historialActivo?: AfiliacionHistorial | null,
  ) {
    // Query base por afiliado
    const qb = this.aporteRepo
      .createQueryBuilder('a')
      .where('a.afiliado_id = :afiliadoId', {
        afiliadoId: afiliado.afiliado_id,
      });

    if (modo === 'actual') {
      if (!historialActivo) {
        // No hay historial activo → no hay aportes "actuales"
        return null;
      }

      qb.andWhere('a.afiliacion_historial_id = :historialId', {
        historialId: historialActivo.afiliacion_historial_id,
      });
    } else if (modo === 'historico') {
      if (historialActivo) {
        qb.andWhere(
          '(a.afiliacion_historial_id IS NULL OR a.afiliacion_historial_id <> :historialId)',
          { historialId: historialActivo.afiliacion_historial_id },
        );
      }
      // Si no hay historial activo, "histórico" = todos los aportes del afiliado
    } else if (modo === 'todos') {
      // No se agrega filtro extra, ya está filtrado por afiliado_id
    } else {
      throw new BadRequestException({
        status: 'error',
        message:
          "Modo inválido. Usa 'actual', 'historico' o 'todos' en el parámetro 'modo'.",
      });
    }

    return qb;
  }
}
