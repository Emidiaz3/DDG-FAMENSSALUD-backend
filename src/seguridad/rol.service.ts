// src/seguridad/rol.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Rol } from './entities/rol.entity';
import { RolSimpleDto } from './dto/rol-simple.dto';

@Injectable()
export class RolService {
  constructor(
    @InjectRepository(Rol)
    private readonly rolRepo: Repository<Rol>,
  ) {}

  /**
   * Obtiene solo los roles permitidos para creación manual:
   * - ADMINISTRADOR (id: 1)
   * - OPERADOR (id: 3)
   * Excluye AFILIADO (id: 2) y MAESTRO (id: 4)
   */
  async listarRolesParaCreacion(): Promise<RolSimpleDto[]> {
    const roles = await this.rolRepo.find({
      where: [
        { rol_id: 1 }, // ADMINISTRADOR
        { rol_id: 3 }, // OPERADOR
      ],
      select: ['rol_id', 'nombre', 'descripcion'],
      order: { rol_id: 'ASC' },
    });

    return roles;
  }

  /**
   * Lista todos los roles activos (para filtros, etc.)
   */
  async listarTodos(): Promise<RolSimpleDto[]> {
    const roles = await this.rolRepo.find({
      where: { es_activo: true },
      select: ['rol_id', 'nombre', 'descripcion'],
      order: { rol_id: 'ASC' },
    });

    return roles;
  }

  /**
   * Obtiene un rol por ID
   */
  async obtenerPorId(id: number): Promise<Rol | null> {
    return this.rolRepo.findOne({
      where: { rol_id: id, es_activo: true },
    });
  }

  /**
   * Valida si un rol está permitido para creación manual
   */
  esRolPermitidoParaCreacion(rolId: number): boolean {
    return rolId === 1 || rolId === 3; // ADMINISTRADOR u OPERADOR
  }
}