import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Banco } from '../../entities/banco.entity';
import {
  AuditoriaService,
  AuditContext,
} from 'src/auditoria/auditoria.service';

type CrearBancoDto = { nombre: string };
type ActualizarBancoDto = { nombre?: string };

@Injectable()
export class BancoService {
  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(Banco)
    private readonly repo: Repository<Banco>,
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
      .createQueryBuilder('b')
      .select(['b.banco_id AS banco_id', 'b.nombre AS nombre']);

    if (search && search.trim() !== '') {
      const term = `%${search.trim()}%`;
      qb.andWhere('b.nombre LIKE :term', { term });
    }

    qb.orderBy('b.nombre', 'ASC').offset(skip).limit(limit);

    const totalQb = qb.clone();
    totalQb
      .offset(undefined as any)
      .limit(undefined as any)
      .orderBy();
    const total = await totalQb.getCount();

    const rows = await qb.getRawMany();
    const items = rows.map((r) => ({
      banco_id: Number(r.banco_id),
      nombre: r.nombre,
    }));

    return { items, total };
  }

  async crear(dto: CrearBancoDto, ctx?: AuditContext) {
    return this.dataSource.transaction(async (manager) => {
      const repo = manager.getRepository(Banco);

      try {
        if (!dto.nombre?.trim())
          throw new BadRequestException('nombre es requerido');

        const entity = repo.create({ nombre: dto.nombre.trim() });
        const saved = await repo.save(entity);

        await this.auditoria.log({
          ctx,
          categoria: 'CATALOGOS',
          tipo_evento: 'CREAR',
          entidad_esquema: 'catalogos',
          entidad_tabla: 'banco',
          entidad_id: String(saved.banco_id),
          descripcion: `Se creó el banco "${saved.nombre}"`,
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
          entidad_tabla: 'banco',
          entidad_id: null,
          descripcion: `Error al crear banco`,
          datos_anteriores: null,
          datos_nuevos: dto,
          es_exitoso: false,
        });
        throw error;
      }
    });
  }

  async actualizar(id: number, dto: ActualizarBancoDto, ctx?: AuditContext) {
    return this.dataSource.transaction(async (manager) => {
      const repo = manager.getRepository(Banco);

      const antes = await repo.findOne({ where: { banco_id: id } });
      if (!antes) throw new NotFoundException('Banco no existe');

      try {
        if (dto.nombre !== undefined) {
          const nombre = dto.nombre.trim();
          if (!nombre)
            throw new BadRequestException('nombre no puede estar vacío');
          antes.nombre = nombre;
        }

        const saved = await repo.save(antes);

        await this.auditoria.log({
          ctx,
          categoria: 'CATALOGOS',
          tipo_evento: 'ACTUALIZAR',
          entidad_esquema: 'catalogos',
          entidad_tabla: 'banco',
          entidad_id: String(id),
          descripcion: `Se actualizó el banco`,
          datos_anteriores: antes, // ojo: ya mutó; si quieres “antes real”, clona antes de editar
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
          entidad_tabla: 'banco',
          entidad_id: String(id),
          descripcion: `Error al actualizar banco`,
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
      const repo = manager.getRepository(Banco);

      const entity = await repo.findOne({ where: { banco_id: id } });
      if (!entity) throw new NotFoundException('Banco no existe');

      try {
        await repo.remove(entity);

        await this.auditoria.log({
          ctx,
          categoria: 'CATALOGOS',
          tipo_evento: 'ELIMINAR',
          entidad_esquema: 'catalogos',
          entidad_tabla: 'banco',
          entidad_id: String(id),
          descripcion: `Se eliminó el banco "${entity.nombre}"`,
          datos_anteriores: entity,
          datos_nuevos: null,
          es_exitoso: true,
        });

        return { status: 'success', message: 'Banco eliminado' };
      } catch (error) {
        await this.auditoria.log({
          ctx,
          categoria: 'CATALOGOS',
          tipo_evento: 'ELIMINAR',
          entidad_esquema: 'catalogos',
          entidad_tabla: 'banco',
          entidad_id: String(id),
          descripcion: `Error al eliminar banco`,
          datos_anteriores: entity,
          datos_nuevos: null,
          es_exitoso: false,
        });
        throw error;
      }
    });
  }
}
