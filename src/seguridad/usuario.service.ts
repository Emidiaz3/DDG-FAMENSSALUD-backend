// src/seguridad/usuario.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Usuario } from './entities/usuario.entity';
import { CrearUsuarioDto } from './dto/crear-usuario.dto';
import * as bcrypt from 'bcrypt';
import { generarUsernameBase } from 'src/afiliados/utils/username.util';
import { Afiliado } from 'src/afiliados/entities/afiliado.entity';
import { UsuarioListItemDto } from './dto/usuario-list-item.dto';

@Injectable()
export class UsuarioService {
  private readonly ROL_AFILIADO_ID = 2; // 👈 ajusta al ID real

  constructor(
    @InjectRepository(Usuario)
    private readonly usuarioRepo: Repository<Usuario>,
  ) {}

  async listarPaginado(params: {
    page: number;
    limit: number;
    search?: string;
    rol_id?: number;
    fecha_desde?: string;
    fecha_hasta?: string;
  }): Promise<{ items: UsuarioListItemDto[]; total: number }> {
    const { page, limit, search, rol_id, fecha_desde, fecha_hasta } = params;

    const skip = (page - 1) * limit;

    const qb = this.usuarioRepo
      .createQueryBuilder('u')
      .innerJoin('u.rol', 'r')
      .select([
        'u.usuario_id AS usuario_id',
        'u.nombre_usuario AS nombre_usuario',
        'u.nombre_completo AS nombre_completo',
        'u.correo AS correo',
        'u.telefono AS telefono',
        'u.rol_id AS rol_id',
        'r.nombre AS rol_nombre',
        'u.es_activo AS es_activo',
        'CONVERT(varchar(10), u.creado_en, 23) AS creado_en',
      ])
      .where('u.es_activo = 1');

    // filtro rol
    if (rol_id) {
      qb.andWhere('u.rol_id = :rolId', { rolId: rol_id });
    }

    // filtro fechas (por creado_en)
    if (fecha_desde) {
      qb.andWhere('u.creado_en >= :desde', { desde: fecha_desde });
    }
    if (fecha_hasta) {
      // opcional: si quieres incluir todo el día, puedes mandar fecha_hasta como YYYY-MM-DDT23:59:59
      qb.andWhere('u.creado_en <= :hasta', { hasta: fecha_hasta });
    }

    // búsqueda
    if (search && search.trim() !== '') {
      const term = `%${search.trim()}%`;
      qb.andWhere(
        `(u.nombre_usuario LIKE :term
          OR u.nombre_completo LIKE :term)`,
        { term },
      );
    }

    // orden
    qb.orderBy('u.creado_en', 'DESC')
      .addOrderBy('u.usuario_id', 'DESC')
      .offset(skip)
      .limit(limit);

    // count total (sin paginado)
    const totalQb = qb.clone();
    totalQb
      .offset(undefined as any)
      .limit(undefined as any)
      .orderBy();

    const total = await totalQb.getCount();

    const rows = await qb.getRawMany<UsuarioListItemDto>();

    const items = rows.map((r) => ({
      ...r,
      usuario_id: Number(r.usuario_id),
      rol_id: Number(r.rol_id),
      es_activo: Boolean(r.es_activo),
    }));

    return { items, total };
  }

  async crear(dto: CrearUsuarioDto): Promise<Usuario> {
    const hash = await bcrypt.hash(dto.contrasena, 10);

    const usuario = this.usuarioRepo.create({
      nombre_usuario: dto.nombre_usuario,
      nombre_completo: dto.nombre_completo,
      correo: dto.correo,
      telefono: dto.telefono,
      rol_id: dto.rol_id,
      contrasena_hash: hash,
      es_activo: dto.es_activo ?? true,
    });

    return this.usuarioRepo.save(usuario);
  }

  // 👇 para login / refresh / updates genéricos
  async save(usuario: Usuario): Promise<Usuario> {
    return this.usuarioRepo.save(usuario);
  }

  // 👇 estos dos son CLAVE para que no haya any
  async findByNombreUsuario(nombre_usuario: string): Promise<Usuario | null> {
    return this.usuarioRepo.findOne({ where: { nombre_usuario } });
  }

  async findById(id: number): Promise<Usuario | null> {
    return this.usuarioRepo.findOne({ where: { usuario_id: id } });
  }

  // Para afiliado
  async existsByNombreUsuario(nombre_usuario: string): Promise<boolean> {
    const count = await this.usuarioRepo.count({ where: { nombre_usuario } });
    return count > 0;
  }

  async crearUsuarioParaAfiliado(afiliado: Afiliado): Promise<Usuario> {
    // 1. Generar base de username
    const base = generarUsernameBase(
      afiliado.nombres,
      afiliado.ap_paterno,
      afiliado.ap_materno,
    );

    let username = base;
    let intento = 1;
    while (await this.existsByNombreUsuario(username)) {
      // ejemplo: danielrojas, danielrojas1, danielrojas2, ...
      username = `${base}${intento}`;
      intento++;
    }

    // 2. Contraseña inicial: DNI
    const contrasenaPlano = afiliado.doc_identidad;
    if (!contrasenaPlano) {
      throw new Error(
        'El afiliado no tiene doc_identidad (DNI) para generar contraseña inicial',
      );
    }

    const hash = await bcrypt.hash(contrasenaPlano, 10);

    // 3. Crear usuario
    const usuario = this.usuarioRepo.create({
      nombre_usuario: username,
      nombre_completo: `${afiliado.ap_paterno} ${afiliado.ap_materno} ${afiliado.nombres}`,
      correo: afiliado.email,
      telefono: afiliado.telefono,
      rol_id: this.ROL_AFILIADO_ID,
      contrasena_hash: hash,
      es_activo: true,
    });

    return this.usuarioRepo.save(usuario);
  }
}
