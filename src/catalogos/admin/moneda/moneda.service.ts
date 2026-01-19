import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Moneda } from '../../entities/moneda.entity';
import {
  AuditoriaService,
  AuditContext,
} from 'src/auditoria/auditoria.service';

type CrearMonedaDto = { nombre: string };
type ActualizarMonedaDto = { nombre?: string };

@Injectable()
export class MonedaService {
  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(Moneda)
    private readonly repo: Repository<Moneda>,
    private readonly auditoria: AuditoriaService,
  ) {}

  async listar() {
    const data = await this.repo.find({ order: { nombre: 'ASC' } });
    return { status: 'success', data };
  }

  async listarPaginado(params: {
    page: number;
    limit: number;
    search?: string;
  }): Promise<{ items: any[]; total: number }> {
    const { page, limit, search } = params;
    const skip = (page - 1) * limit;

    const qb = this.repo
      .createQueryBuilder('m')
      .select(['m.moneda_id AS moneda_id', 'm.nombre AS nombre']);

    if (search && search.trim() !== '') {
      const term = `%${search.trim()}%`;
      qb.andWhere('m.nombre LIKE :term', { term });
    }

    qb.orderBy('m.nombre', 'ASC').offset(skip).limit(limit);

    const totalQb = qb.clone();
    totalQb
      .offset(undefined as any)
      .limit(undefined as any)
      .orderBy();
    const total = await totalQb.getCount();

    const rows = await qb.getRawMany();
    const items = rows.map((r) => ({
      moneda_id: Number(r.moneda_id),
      nombre: r.nombre,
    }));

    return { items, total };
  }

  async crear(dto: CrearMonedaDto, ctx?: AuditContext) {
    return this.dataSource.transaction(async (manager) => {
      const repo = manager.getRepository(Moneda);
      try {
        if (!dto.nombre?.trim())
          throw new BadRequestException('nombre es requerido');

        const saved = await repo.save(
          repo.create({ nombre: dto.nombre.trim() }),
        );

        await this.auditoria.log({
          ctx,
          categoria: 'CATALOGOS',
          tipo_evento: 'CREAR',
          entidad_esquema: 'catalogos',
          entidad_tabla: 'moneda',
          entidad_id: String((saved as any).moneda_id),
          descripcion: `Se creó la moneda "${saved.nombre}"`,
          datos_anteriores: null,
          datos_nuevos: saved,
          es_exitoso: true,
        });

        return { status: 'success', data: saved };
      } catch (error) {
        await this.auditoria.log({
          ctx,
          categoria: 'CATALOGOS',
          tipo_evento: 'CREAR',
          entidad_esquema: 'catalogos',
          entidad_tabla: 'moneda',
          entidad_id: null,
          descripcion: `Error al crear moneda`,
          datos_anteriores: null,
          datos_nuevos: dto,
          es_exitoso: false,
        });
        throw error;
      }
    });
  }

  async actualizar(id: number, dto: ActualizarMonedaDto, ctx?: AuditContext) {
    return this.dataSource.transaction(async (manager) => {
      const repo = manager.getRepository(Moneda);
      const entity = await repo.findOne({ where: { moneda_id: id } as any });
      if (!entity) throw new NotFoundException('Moneda no existe');

      const antes = JSON.parse(JSON.stringify(entity));

      try {
        if (dto.nombre !== undefined) {
          const nombre = dto.nombre.trim();
          if (!nombre)
            throw new BadRequestException('nombre no puede estar vacío');
          entity.nombre = nombre;
        }

        const saved = await repo.save(entity);

        await this.auditoria.log({
          ctx,
          categoria: 'CATALOGOS',
          tipo_evento: 'ACTUALIZAR',
          entidad_esquema: 'catalogos',
          entidad_tabla: 'moneda',
          entidad_id: String(id),
          descripcion: `Se actualizó la moneda`,
          datos_anteriores: antes,
          datos_nuevos: saved,
          es_exitoso: true,
        });

        return { status: 'success', data: saved };
      } catch (error) {
        await this.auditoria.log({
          ctx,
          categoria: 'CATALOGOS',
          tipo_evento: 'ACTUALIZAR',
          entidad_esquema: 'catalogos',
          entidad_tabla: 'moneda',
          entidad_id: String(id),
          descripcion: `Error al actualizar moneda`,
          datos_anteriores: antes,
          datos_nuevos: dto,
          es_exitoso: false,
        });
        throw error;
      }
    });
  }

  async eliminar(id: number, ctx?: AuditContext) {
    return this.dataSource.transaction(async (manager) => {
      const repo = manager.getRepository(Moneda);
      const entity = await repo.findOne({ where: { moneda_id: id } as any });
      if (!entity) throw new NotFoundException('Moneda no existe');

      try {
        await repo.remove(entity);

        await this.auditoria.log({
          ctx,
          categoria: 'CATALOGOS',
          tipo_evento: 'ELIMINAR',
          entidad_esquema: 'catalogos',
          entidad_tabla: 'moneda',
          entidad_id: String(id),
          descripcion: `Se eliminó la moneda "${entity.nombre}"`,
          datos_anteriores: entity,
          datos_nuevos: null,
          es_exitoso: true,
        });

        return { status: 'success', message: 'Moneda eliminada' };
      } catch (error) {
        await this.auditoria.log({
          ctx,
          categoria: 'CATALOGOS',
          tipo_evento: 'ELIMINAR',
          entidad_esquema: 'catalogos',
          entidad_tabla: 'moneda',
          entidad_id: String(id),
          descripcion: `Error al eliminar moneda`,
          datos_anteriores: entity,
          datos_nuevos: null,
          es_exitoso: false,
        });
        throw error;
      }
    });
  }
}
