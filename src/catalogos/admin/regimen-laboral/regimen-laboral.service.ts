import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import {
  AuditoriaService,
  AuditContext,
} from 'src/auditoria/auditoria.service';
import { RegimenLaboral } from 'src/catalogos/entities/regimen-laboral.entity';

type CrearRegimenDto = { nombre: string };
type ActualizarRegimenDto = { nombre?: string };

@Injectable()
export class RegimenLaboralService {
  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(RegimenLaboral)
    private readonly repo: Repository<RegimenLaboral>,
    private readonly auditoria: AuditoriaService,
  ) {}

  async listar() {
    const data = await this.repo.find({ order: { nombre: 'ASC' } });
    return { status: 'success', data };
  }

  async crear(dto: CrearRegimenDto, ctx?: AuditContext) {
    return this.dataSource.transaction(async (manager) => {
      const repo = manager.getRepository(RegimenLaboral);
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
          entidad_tabla: 'regimen_laboral',
          entidad_id: String(saved.regimen_laboral_id),
          descripcion: `Se creó el régimen laboral "${saved.nombre}"`,
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
          entidad_tabla: 'regimen_laboral',
          entidad_id: null,
          descripcion: `Error al crear régimen laboral`,
          datos_anteriores: null,
          datos_nuevos: dto,
          es_exitoso: false,
        });
        throw error;
      }
    });
  }

  async actualizar(id: number, dto: ActualizarRegimenDto, ctx?: AuditContext) {
    return this.dataSource.transaction(async (manager) => {
      const repo = manager.getRepository(RegimenLaboral);
      const entity = await repo.findOne({ where: { regimen_laboral_id: id } });
      if (!entity) throw new NotFoundException('Régimen laboral no existe');

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
          entidad_tabla: 'regimen_laboral',
          entidad_id: String(id),
          descripcion: `Se actualizó el régimen laboral`,
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
          entidad_tabla: 'regimen_laboral',
          entidad_id: String(id),
          descripcion: `Error al actualizar régimen laboral`,
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
      const repo = manager.getRepository(RegimenLaboral);
      const entity = await repo.findOne({ where: { regimen_laboral_id: id } });
      if (!entity) throw new NotFoundException('Régimen laboral no existe');

      try {
        await repo.remove(entity);

        await this.auditoria.log({
          ctx,
          categoria: 'CATALOGOS',
          tipo_evento: 'ELIMINAR',
          entidad_esquema: 'catalogos',
          entidad_tabla: 'regimen_laboral',
          entidad_id: String(id),
          descripcion: `Se eliminó el régimen laboral "${entity.nombre}"`,
          datos_anteriores: entity,
          datos_nuevos: null,
          es_exitoso: true,
        });

        return { status: 'success', message: 'Régimen laboral eliminado' };
      } catch (error) {
        await this.auditoria.log({
          ctx,
          categoria: 'CATALOGOS',
          tipo_evento: 'ELIMINAR',
          entidad_esquema: 'catalogos',
          entidad_tabla: 'regimen_laboral',
          entidad_id: String(id),
          descripcion: `Error al eliminar régimen laboral`,
          datos_anteriores: entity,
          datos_nuevos: null,
          es_exitoso: false,
        });
        throw error;
      }
    });
  }
}
