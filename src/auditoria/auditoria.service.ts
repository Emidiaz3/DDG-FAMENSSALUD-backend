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
}
