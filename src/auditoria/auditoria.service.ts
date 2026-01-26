import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LogEvento } from './entities/log-event.entity';

export type AuditContext = {
  usuario_id?: number | null;
  ip_origen?: string | null;
  user_agent?: string | null;
};

@Injectable()
export class AuditoriaService {
  constructor(
    @InjectRepository(LogEvento)
    private readonly logRepo: Repository<LogEvento>,
  ) {}

  async log(params: {
    ctx?: AuditContext;
    categoria: string;
    tipo_evento: string;
    entidad_esquema?: string | null;
    entidad_tabla?: string | null;
    entidad_id?: string | null;
    descripcion?: string | null;
    datos_anteriores?: any;
    datos_nuevos?: any;
    es_exitoso: boolean;
  }) {
    const {
      ctx,
      categoria,
      tipo_evento,
      entidad_esquema,
      entidad_tabla,
      entidad_id,
      descripcion,
      datos_anteriores,
      datos_nuevos,
      es_exitoso,
    } = params;

    await this.logRepo.save(
      this.logRepo.create({
        usuario_id: ctx?.usuario_id ?? null,
        categoria,
        tipo_evento,
        entidad_esquema: entidad_esquema ?? null,
        entidad_tabla: entidad_tabla ?? null,
        entidad_id: entidad_id ?? null,
        descripcion: descripcion ?? null,
        datos_anteriores:
          datos_anteriores === undefined
            ? null
            : JSON.stringify(datos_anteriores),
        datos_nuevos:
          datos_nuevos === undefined ? null : JSON.stringify(datos_nuevos),
        es_exitoso,
        ip_origen: ctx?.ip_origen ?? null,
        user_agent: ctx?.user_agent ?? null,
      }),
    );
  }
  // Agregar este método en auditoria.service.ts

async listar(filters: {
  page: number;
  limit: number;
  categoria?: string;
  tipo_evento?: string;
  usuario_id?: number;
  es_exitoso?: boolean;
  entidad_esquema?: string;
  entidad_tabla?: string;
  fecha_desde?: string;
  fecha_hasta?: string;
  search?: string;
}): Promise<{ items: LogEvento[]; total: number }> {
  const {
    page,
    limit,
    categoria,
    tipo_evento,
    usuario_id,
    es_exitoso,
    entidad_esquema,
    entidad_tabla,
    fecha_desde,
    fecha_hasta,
    search,
  } = filters;

  const queryBuilder = this.logRepo
    .createQueryBuilder('log')
    .leftJoinAndSelect('log.usuario', 'usuario');

  // Filtros específicos
  if (categoria) {
    queryBuilder.andWhere('log.categoria = :categoria', { categoria });
  }

  if (tipo_evento) {
    queryBuilder.andWhere('log.tipo_evento = :tipo_evento', { tipo_evento });
  }

  if (usuario_id) {
    queryBuilder.andWhere('log.usuario_id = :usuario_id', { usuario_id });
  }

  if (es_exitoso !== undefined) {
    queryBuilder.andWhere('log.es_exitoso = :es_exitoso', { es_exitoso });
  }

  if (entidad_esquema) {
    queryBuilder.andWhere('log.entidad_esquema = :entidad_esquema', {
      entidad_esquema,
    });
  }

  if (entidad_tabla) {
    queryBuilder.andWhere('log.entidad_tabla = :entidad_tabla', {
      entidad_tabla,
    });
  }

  if (fecha_desde) {
    queryBuilder.andWhere('log.fecha_hora >= :fecha_desde', { fecha_desde });
  }

  if (fecha_hasta) {
    queryBuilder.andWhere('log.fecha_hora <= :fecha_hasta', { fecha_hasta });
  }

  // Búsqueda general
  if (search) {
    queryBuilder.andWhere(
      '(log.descripcion LIKE :search OR log.entidad_id LIKE :search OR log.ip_origen LIKE :search)',
      { search: `%${search}%` },
    );
  }

  // Paginación
  const skip = (page - 1) * limit;
  queryBuilder.skip(skip).take(limit);

  // Ordenar por fecha descendente (más recientes primero)
  queryBuilder.orderBy('log.fecha_hora', 'DESC');

  const [items, total] = await queryBuilder.getManyAndCount();

  return { items, total };
}
}
