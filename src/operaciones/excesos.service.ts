import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Exceso } from './entities/exceso.entity';
import { GuardarExcesoDto } from './dto/guardar-exceso.dto';
import { LogEvento } from 'src/auditoria/entities/log-event.entity';
import { Afiliado } from 'src/afiliados/entities/afiliado.entity';
import { AfiliacionHistorial } from 'src/afiliados/entities/afiliacion-historial.entity';

type AuditoriaContext = {
  usuario_id?: number | null;
  ip_origen?: string | null;
  user_agent?: string | null;
};

@Injectable()
export class ExcesosService {
  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(Exceso) private readonly excesoRepo: Repository<Exceso>,
    @InjectRepository(LogEvento)
    private readonly logRepo: Repository<LogEvento>,
    @InjectRepository(Afiliado)
    private readonly afiliadoRepo: Repository<Afiliado>,
    @InjectRepository(AfiliacionHistorial)
    private readonly historialRepo: Repository<AfiliacionHistorial>,
  ) {}

  async listarPaginado(params: {
    page: number;
    limit: number;
    fecha_desde?: string;
    fecha_hasta?: string;
  }): Promise<{ items: Exceso[]; total: number }> {
    const { page, limit, fecha_desde, fecha_hasta } = params;

    const skip = (page - 1) * limit;

    const qb = this.excesoRepo.createQueryBuilder('e');

    if (fecha_desde) {
      qb.andWhere('e.fecha_exceso >= :desde', { desde: fecha_desde });
    }

    if (fecha_hasta) {
      qb.andWhere('e.fecha_exceso <= :hasta', { hasta: fecha_hasta });
    }

    qb.orderBy('e.fecha_exceso', 'DESC').offset(skip).limit(limit);

    const totalQb = qb.clone();
    totalQb
      .offset(undefined as any)
      .limit(undefined as any)
      .orderBy();

    const total = await totalQb.getCount();
    const items = await qb.getMany();

    return { items, total };
  }

  async guardar(dto: GuardarExcesoDto, ctx: AuditoriaContext): Promise<Exceso> {
    return this.dataSource.transaction(async (manager) => {
      const excesoRepo = manager.getRepository(Exceso);
      const logRepo = manager.getRepository(LogEvento);
      const afiliadoRepo = manager.getRepository(Afiliado);
      const historialRepo = manager.getRepository(AfiliacionHistorial);

      // EDITAR
      if (dto.exceso_id) {
        const existente = await excesoRepo.findOne({
          where: { exceso_id: dto.exceso_id as any },
        });

        if (!existente) {
          throw new NotFoundException({
            status: 'error',
            message: 'El exceso no existe.',
          });
        }

        const anteriores = { ...existente };

        if (dto.fecha_exceso)
          existente.fecha_exceso = new Date(dto.fecha_exceso);
        if (dto.monto_exceso != null)
          existente.monto_exceso = dto.monto_exceso.toFixed(2) as any;
        if (dto.observacion_exceso !== undefined)
          existente.observacion_exceso = dto.observacion_exceso ?? null;

        const saved = await excesoRepo.save(existente);

        await logRepo.save(
          logRepo.create({
            usuario_id: ctx.usuario_id ?? null,
            categoria: 'OPERACIONES',
            tipo_evento: 'EDITAR_EXCESO',
            entidad_esquema: 'operaciones',
            entidad_tabla: 'exceso',
            entidad_id: String(saved.exceso_id),
            descripcion: `Exceso editado (exceso_id=${saved.exceso_id}).`,
            datos_anteriores: JSON.stringify(anteriores),
            datos_nuevos: JSON.stringify(saved),
            es_exitoso: true,
            ip_origen: ctx.ip_origen ?? null,
            user_agent: ctx.user_agent ?? null,
          }),
        );

        return saved;
      }

      // CREAR (validaciones mínimas)
      if (!dto.afiliado_id) {
        throw new BadRequestException({
          status: 'error',
          message: 'afiliado_id es obligatorio para crear.',
        });
      }
      if (!dto.fecha_exceso) {
        throw new BadRequestException({
          status: 'error',
          message: 'fecha_exceso es obligatorio para crear.',
        });
      }
      if (dto.monto_exceso == null) {
        throw new BadRequestException({
          status: 'error',
          message: 'monto_exceso es obligatorio para crear.',
        });
      }

      const afiliado = await afiliadoRepo.findOne({
        where: { afiliado_id: dto.afiliado_id },
      });
      if (!afiliado)
        throw new NotFoundException({
          status: 'error',
          message: 'El afiliado no existe.',
        });
      if (!afiliado.estado) {
        throw new BadRequestException({
          status: 'error',
          message: 'El afiliado no está ACTIVO y no puede registrar excesos.',
        });
      }

      const historial = await historialRepo.findOne({
        where: { afiliado_id: afiliado.afiliado_id, es_activo: true },
      });
      if (!historial) {
        throw new BadRequestException({
          status: 'error',
          message:
            'No existe historial de afiliación activo para este afiliado.',
        });
      }

      const exceso = excesoRepo.create({
        afiliado_id: afiliado.afiliado_id,
        afiliacion_historial_id: historial.afiliacion_historial_id,
        fecha_exceso: new Date(dto.fecha_exceso),
        monto_exceso: dto.monto_exceso.toFixed(2) as any,
        observacion_exceso: dto.observacion_exceso ?? null,
      });

      const saved = await excesoRepo.save(exceso);

      await logRepo.save(
        logRepo.create({
          usuario_id: ctx.usuario_id ?? null,
          categoria: 'OPERACIONES',
          tipo_evento: 'CREAR_EXCESO',
          entidad_esquema: 'operaciones',
          entidad_tabla: 'exceso',
          entidad_id: String(saved.exceso_id),
          descripcion: `Registro de exceso creado (afiliado_id=${saved.afiliado_id}, monto=${saved.monto_exceso}).`,
          datos_anteriores: null,
          datos_nuevos: JSON.stringify(saved),
          es_exitoso: true,
          ip_origen: ctx.ip_origen ?? null,
          user_agent: ctx.user_agent ?? null,
        }),
      );

      return saved;
    });
  }

  async eliminar(
    exceso_id: string,
    ctx: AuditoriaContext,
  ): Promise<{ eliminado: true }> {
    return this.dataSource.transaction(async (manager) => {
      const excesoRepo = manager.getRepository(Exceso);
      const logRepo = manager.getRepository(LogEvento);

      const existente = await excesoRepo.findOne({
        where: { exceso_id: exceso_id as any },
      });
      if (!existente) {
        throw new NotFoundException({
          status: 'error',
          message: 'El exceso no existe.',
        });
      }

      await excesoRepo.delete({ exceso_id: exceso_id as any });

      await logRepo.save(
        logRepo.create({
          usuario_id: ctx.usuario_id ?? null,
          categoria: 'OPERACIONES',
          tipo_evento: 'ELIMINAR_EXCESO',
          entidad_esquema: 'operaciones',
          entidad_tabla: 'exceso',
          entidad_id: String(exceso_id),
          descripcion: `Registro de exceso eliminado (afiliado_id=${existente.afiliado_id}, monto=${existente.monto_exceso}).`,
          datos_anteriores: JSON.stringify(existente),
          datos_nuevos: null,
          es_exitoso: true,
          ip_origen: ctx.ip_origen ?? null,
          user_agent: ctx.user_agent ?? null,
        }),
      );

      return { eliminado: true };
    });
  }
}
