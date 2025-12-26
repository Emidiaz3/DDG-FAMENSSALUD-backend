import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Base } from '../../entities/base.entity';
import {
  AuditoriaService,
  AuditContext,
} from 'src/auditoria/auditoria.service';

type CrearBaseDto = {
  nombre: string;
  codigo?: string | null;
  departamento_id?: number | null;
};

type ActualizarBaseDto = Partial<CrearBaseDto>;

@Injectable()
export class BaseService {
  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(Base)
    private readonly repo: Repository<Base>,
    private readonly auditoria: AuditoriaService,
  ) {}

  async listar(departamentoId?: number) {
    const where = departamentoId ? { departamento_id: departamentoId } : {};
    const data = await this.repo.find({ where, order: { nombre: 'ASC' } });
    return { status: 'success', data };
  }

  async crear(dto: CrearBaseDto, ctx?: AuditContext) {
    return this.dataSource.transaction(async (manager) => {
      const repo = manager.getRepository(Base);

      try {
        if (!dto.nombre?.trim())
          throw new BadRequestException('nombre es requerido');

        const entity = repo.create({
          nombre: dto.nombre.trim(),
          codigo: dto.codigo ?? null,
          departamento_id: dto.departamento_id ?? null,
        });

        const saved = await repo.save(entity);

        await this.auditoria.log({
          ctx,
          categoria: 'CATALOGOS',
          tipo_evento: 'CREAR',
          entidad_esquema: 'catalogos',
          entidad_tabla: 'base',
          entidad_id: String(saved.base_id),
          descripcion: `Se creó la base "${saved.nombre}"`,
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
          entidad_tabla: 'base',
          entidad_id: null,
          descripcion: `Error al crear base`,
          datos_anteriores: null,
          datos_nuevos: dto,
          es_exitoso: false,
        });
        throw error;
      }
    });
  }

  async actualizar(id: number, dto: ActualizarBaseDto, ctx?: AuditContext) {
    return this.dataSource.transaction(async (manager) => {
      const repo = manager.getRepository(Base);

      const entity = await repo.findOne({ where: { base_id: id } });
      if (!entity) throw new NotFoundException('Base no existe');

      const antes = JSON.parse(JSON.stringify(entity));

      try {
        if (dto.nombre !== undefined) {
          const nombre = dto.nombre.trim();
          if (!nombre)
            throw new BadRequestException('nombre no puede estar vacío');
          entity.nombre = nombre;
        }
        if (dto.codigo !== undefined) entity.codigo = dto.codigo ?? null;
        if (dto.departamento_id !== undefined)
          entity.departamento_id = dto.departamento_id ?? null;

        const saved = await repo.save(entity);

        await this.auditoria.log({
          ctx,
          categoria: 'CATALOGOS',
          tipo_evento: 'ACTUALIZAR',
          entidad_esquema: 'catalogos',
          entidad_tabla: 'base',
          entidad_id: String(id),
          descripcion: `Se actualizó la base`,
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
          entidad_tabla: 'base',
          entidad_id: String(id),
          descripcion: `Error al actualizar base`,
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
      const repo = manager.getRepository(Base);

      const entity = await repo.findOne({ where: { base_id: id } });
      if (!entity) throw new NotFoundException('Base no existe');

      try {
        await repo.remove(entity);

        await this.auditoria.log({
          ctx,
          categoria: 'CATALOGOS',
          tipo_evento: 'ELIMINAR',
          entidad_esquema: 'catalogos',
          entidad_tabla: 'base',
          entidad_id: String(id),
          descripcion: `Se eliminó la base "${entity.nombre}"`,
          datos_anteriores: entity,
          datos_nuevos: null,
          es_exitoso: true,
        });

        return { status: 'success', message: 'Base eliminada' };
      } catch (error) {
        await this.auditoria.log({
          ctx,
          categoria: 'CATALOGOS',
          tipo_evento: 'ELIMINAR',
          entidad_esquema: 'catalogos',
          entidad_tabla: 'base',
          entidad_id: String(id),
          descripcion: `Error al eliminar base`,
          datos_anteriores: entity,
          datos_nuevos: null,
          es_exitoso: false,
        });
        throw error;
      }
    });
  }
}
