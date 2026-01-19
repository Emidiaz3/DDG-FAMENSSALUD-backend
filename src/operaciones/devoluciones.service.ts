import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Devolucion } from './entities/devolucion.entity';
import { GuardarDevolucionDto } from './dto/guardar-devolucion.dto';
import { LogEvento } from 'src/auditoria/entities/log-event.entity';
import { Afiliado } from 'src/afiliados/entities/afiliado.entity';
import { AfiliacionHistorial } from 'src/afiliados/entities/afiliacion-historial.entity';

type AuditoriaContext = {
  usuario_id?: number | null;
  ip_origen?: string | null;
  user_agent?: string | null;
};

@Injectable()
export class DevolucionesService {
  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(Devolucion)
    private readonly devolucionRepo: Repository<Devolucion>,
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
  }): Promise<{ items: Devolucion[]; total: number }> {
    const { page, limit, fecha_desde, fecha_hasta } = params;

    const skip = (page - 1) * limit;

    const qb = this.devolucionRepo.createQueryBuilder('d');

    if (fecha_desde) {
      qb.andWhere('d.fecha_devolucion >= :desde', { desde: fecha_desde });
    }

    if (fecha_hasta) {
      qb.andWhere('d.fecha_devolucion <= :hasta', { hasta: fecha_hasta });
    }

    qb.orderBy('d.fecha_devolucion', 'DESC').offset(skip).limit(limit);

    const totalQb = qb.clone();
    totalQb
      .offset(undefined as any)
      .limit(undefined as any)
      .orderBy();

    const total = await totalQb.getCount();
    const items = await qb.getMany();

    return { items, total };
  }

  async listarPaginadoPorAfiliadoActual(params: {
    afiliado_id: number;
    page: number;
    limit: number;
    fecha_desde?: string;
    fecha_hasta?: string;
  }): Promise<{ items: Devolucion[]; total: number }> {
    const { afiliado_id, page, limit, fecha_desde, fecha_hasta } = params;

    // 1) Validar afiliado
    const afiliado = await this.afiliadoRepo.findOne({
      where: { afiliado_id },
    });

    if (!afiliado) {
      throw new NotFoundException({
        status: 'error',
        message: 'El afiliado no existe.',
      });
    }

    // 2) Historial activo
    const historialActivo = await this.historialRepo.findOne({
      where: { afiliado_id: afiliado.afiliado_id, es_activo: true },
      order: { fecha_inicio: 'DESC' },
    });

    if (!historialActivo) {
      return { items: [], total: 0 };
    }

    const skip = (page - 1) * limit;

    // 3) Query paginada (solo el historial activo)
    const qb = this.devolucionRepo
      .createQueryBuilder('d')
      .where('d.afiliado_id = :afiliadoId', {
        afiliadoId: afiliado.afiliado_id,
      })
      .andWhere('d.afiliacion_historial_id = :historialId', {
        historialId: historialActivo.afiliacion_historial_id,
      });

    if (fecha_desde) {
      qb.andWhere('d.fecha_devolucion >= :desde', { desde: fecha_desde });
    }

    if (fecha_hasta) {
      qb.andWhere('d.fecha_devolucion <= :hasta', { hasta: fecha_hasta });
    }

    qb.orderBy('d.fecha_devolucion', 'DESC').offset(skip).limit(limit);

    // total
    const totalQb = qb.clone();
    totalQb
      .offset(undefined as any)
      .limit(undefined as any)
      .orderBy();

    const total = await totalQb.getCount();
    const items = await qb.getMany();

    return { items, total };
  }

  async guardar(
    dto: GuardarDevolucionDto,
    ctx: AuditoriaContext,
  ): Promise<Devolucion> {
    return this.dataSource.transaction(async (manager) => {
      const devolucionRepo = manager.getRepository(Devolucion);
      const logRepo = manager.getRepository(LogEvento);
      const afiliadoRepo = manager.getRepository(Afiliado);
      const historialRepo = manager.getRepository(AfiliacionHistorial);

      // =========================
      // EDITAR
      // =========================
      if (dto.devolucion_id) {
        const existente = await devolucionRepo.findOne({
          where: { devolucion_id: dto.devolucion_id as any },
        });

        if (!existente) {
          throw new NotFoundException({
            status: 'error',
            message: 'La devolución no existe.',
          });
        }

        const anteriores = { ...existente };

        if (dto.fecha_devolucion)
          existente.fecha_devolucion = new Date(dto.fecha_devolucion);
        if (dto.monto_devolucion != null)
          existente.monto_devolucion = dto.monto_devolucion.toFixed(2) as any;
        if (dto.observacion_devolucion !== undefined)
          existente.observacion_devolucion = dto.observacion_devolucion ?? null;

        const saved = await devolucionRepo.save(existente);

        await logRepo.save(
          logRepo.create({
            usuario_id: ctx.usuario_id ?? null,
            categoria: 'OPERACIONES',
            tipo_evento: 'EDITAR_DEVOLUCION',
            entidad_esquema: 'operaciones',
            entidad_tabla: 'devolucion',
            entidad_id: String(saved.devolucion_id),
            descripcion: `Devolución editada (devolucion_id=${saved.devolucion_id}).`,
            datos_anteriores: JSON.stringify(anteriores),
            datos_nuevos: JSON.stringify(saved),
            es_exitoso: true,
            ip_origen: ctx.ip_origen ?? null,
            user_agent: ctx.user_agent ?? null,
          }),
        );

        return saved;
      }

      // =========================
      // CREAR
      // =========================
      if (!dto.afiliado_id) {
        throw new BadRequestException({
          status: 'error',
          message: 'afiliado_id es obligatorio para crear.',
        });
      }
      if (!dto.fecha_devolucion) {
        throw new BadRequestException({
          status: 'error',
          message: 'fecha_devolucion es obligatorio para crear.',
        });
      }
      if (dto.monto_devolucion == null) {
        throw new BadRequestException({
          status: 'error',
          message: 'monto_devolucion es obligatorio para crear.',
        });
      }

      const afiliado = await afiliadoRepo.findOne({
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
          message:
            'El afiliado no está ACTIVO y no puede registrar devoluciones.',
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

      const devolucion = devolucionRepo.create({
        afiliado_id: afiliado.afiliado_id,
        afiliacion_historial_id: historial.afiliacion_historial_id,
        fecha_devolucion: new Date(dto.fecha_devolucion),
        monto_devolucion: dto.monto_devolucion.toFixed(2) as any,
        observacion_devolucion: dto.observacion_devolucion ?? null,
      });

      const saved = await devolucionRepo.save(devolucion);

      await logRepo.save(
        logRepo.create({
          usuario_id: ctx.usuario_id ?? null,
          categoria: 'OPERACIONES',
          tipo_evento: 'CREAR_DEVOLUCION',
          entidad_esquema: 'operaciones',
          entidad_tabla: 'devolucion',
          entidad_id: String(saved.devolucion_id),
          descripcion: `Registro de devolución creado (afiliado_id=${saved.afiliado_id}, monto=${saved.monto_devolucion}).`,
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
    devolucion_id: string,
    ctx: AuditoriaContext,
  ): Promise<{ eliminado: true }> {
    return this.dataSource.transaction(async (manager) => {
      const devolucionRepo = manager.getRepository(Devolucion);
      const logRepo = manager.getRepository(LogEvento);

      const existente = await devolucionRepo.findOne({
        where: { devolucion_id: devolucion_id as any },
      });
      if (!existente) {
        throw new NotFoundException({
          status: 'error',
          message: 'La devolución no existe.',
        });
      }

      await devolucionRepo.delete({ devolucion_id: devolucion_id as any });

      await logRepo.save(
        logRepo.create({
          usuario_id: ctx.usuario_id ?? null,
          categoria: 'OPERACIONES',
          tipo_evento: 'ELIMINAR_DEVOLUCION',
          entidad_esquema: 'operaciones',
          entidad_tabla: 'devolucion',
          entidad_id: String(devolucion_id),
          descripcion: `Registro de devolución eliminado (afiliado_id=${existente.afiliado_id}, monto=${existente.monto_devolucion}).`,
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
