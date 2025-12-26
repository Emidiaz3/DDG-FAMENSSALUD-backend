import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Departamento } from '../../entities/departamento.entity';
import {
  AuditoriaService,
  AuditContext,
} from 'src/auditoria/auditoria.service';

type CrearDepartamentoDto = { pais_id: number; nombre: string };
type ActualizarDepartamentoDto = { pais_id?: number; nombre?: string };

@Injectable()
export class DepartamentoService {
  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(Departamento)
    private readonly repo: Repository<Departamento>,
    private readonly auditoria: AuditoriaService,
  ) {}

  async listar(paisId?: number) {
    const where = paisId ? { pais_id: paisId } : {};
    const data = await this.repo.find({ where, order: { nombre: 'ASC' } });
    return { status: 'success', data };
  }

  async crear(dto: CrearDepartamentoDto, ctx?: AuditContext) {
    return this.dataSource.transaction(async (manager) => {
      const repo = manager.getRepository(Departamento);
      try {
        if (!dto.pais_id) throw new BadRequestException('pais_id es requerido');
        if (!dto.nombre?.trim())
          throw new BadRequestException('nombre es requerido');

        const saved = await repo.save(
          repo.create({ pais_id: dto.pais_id, nombre: dto.nombre.trim() }),
        );

        await this.auditoria.log({
          ctx,
          categoria: 'CATALOGOS',
          tipo_evento: 'CREAR',
          entidad_esquema: 'catalogos',
          entidad_tabla: 'departamento',
          entidad_id: String(saved.departamento_id),
          descripcion: `Se creó el departamento "${saved.nombre}"`,
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
          entidad_tabla: 'departamento',
          entidad_id: null,
          descripcion: `Error al crear departamento`,
          datos_anteriores: null,
          datos_nuevos: dto,
          es_exitoso: false,
        });
        throw error;
      }
    });
  }

  async actualizar(
    id: number,
    dto: ActualizarDepartamentoDto,
    ctx?: AuditContext,
  ) {
    return this.dataSource.transaction(async (manager) => {
      const repo = manager.getRepository(Departamento);
      const entity = await repo.findOne({ where: { departamento_id: id } });
      if (!entity) throw new NotFoundException('Departamento no existe');

      const antes = JSON.parse(JSON.stringify(entity));

      try {
        if (dto.pais_id !== undefined) {
          if (!dto.pais_id) throw new BadRequestException('pais_id inválido');
          entity.pais_id = dto.pais_id;
        }
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
          entidad_tabla: 'departamento',
          entidad_id: String(id),
          descripcion: `Se actualizó el departamento`,
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
          entidad_tabla: 'departamento',
          entidad_id: String(id),
          descripcion: `Error al actualizar departamento`,
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
      const repo = manager.getRepository(Departamento);
      const entity = await repo.findOne({ where: { departamento_id: id } });
      if (!entity) throw new NotFoundException('Departamento no existe');

      try {
        await repo.remove(entity);

        await this.auditoria.log({
          ctx,
          categoria: 'CATALOGOS',
          tipo_evento: 'ELIMINAR',
          entidad_esquema: 'catalogos',
          entidad_tabla: 'departamento',
          entidad_id: String(id),
          descripcion: `Se eliminó el departamento "${entity.nombre}"`,
          datos_anteriores: entity,
          datos_nuevos: null,
          es_exitoso: true,
        });

        return { status: 'success', message: 'Departamento eliminado' };
      } catch (error) {
        await this.auditoria.log({
          ctx,
          categoria: 'CATALOGOS',
          tipo_evento: 'ELIMINAR',
          entidad_esquema: 'catalogos',
          entidad_tabla: 'departamento',
          entidad_id: String(id),
          descripcion: `Error al eliminar departamento`,
          datos_anteriores: entity,
          datos_nuevos: null,
          es_exitoso: false,
        });
        throw error;
      }
    });
  }
}
