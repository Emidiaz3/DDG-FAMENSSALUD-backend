// src/seguridad/usuario.service.ts
import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Usuario } from './entities/usuario.entity';
import { CrearUsuarioDto } from './dto/crear-usuario.dto';
import * as bcrypt from 'bcrypt';
import { generarUsernameBase } from 'src/afiliados/utils/username.util';
import { Afiliado } from 'src/afiliados/entities/afiliado.entity';
import { UsuarioListItemDto } from './dto/usuario-list-item.dto';
import { RolService } from './rol.service';
import { ActualizarUsuarioDto } from './dto/actualizar-usuario.dto';
import { CambiarContrasenaDto } from './dto/cambiar-contrasena.dto';

@Injectable()
export class UsuarioService {
  private readonly ROL_AFILIADO_ID = 2; // 👈 ajusta al ID real

  constructor(
    @InjectRepository(Usuario)
    private readonly usuarioRepo: Repository<Usuario>,
    private readonly rolService: RolService,
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
        'u.ultimo_login AS ultimo_login',
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

  async obtenerPorId(id: number): Promise<Usuario> {
    const usuario = await this.usuarioRepo.findOne({
      where: { usuario_id: id },
      relations: ['rol'],
    });

    if (!usuario) {
      throw new NotFoundException(`Usuario con ID ${id} no encontrado`);
    }

    return usuario;
  }
  
  async crear(dto: CrearUsuarioDto): Promise<Usuario> {

    const rol = await this.rolService.obtenerPorId(dto.rol_id);
    if (!rol) {
      throw new BadRequestException(`El rol con ID ${dto.rol_id} no existe`);
    }

    if (!this.rolService.esRolPermitidoParaCreacion(dto.rol_id)) {
      throw new BadRequestException(
        'Solo se permite crear usuarios con rol ADMINISTRADOR u OPERADOR',
      );
    }

    // Validar que el nombre de usuario no exista
    const existeUsuario = await this.existsByNombreUsuario(dto.nombre_usuario);
    if (existeUsuario) {
      throw new ConflictException(
        `Ya existe un usuario con el nombre "${dto.nombre_usuario}"`,
      );
    }

    // Validar que el correo no exista (si se proporciona)
    if (dto.correo) {
      const existeCorreo = await this.usuarioRepo.count({
        where: { correo: dto.correo },
      });
      if (existeCorreo > 0) {
        throw new ConflictException(
          `Ya existe un usuario con el correo "${dto.correo}"`,
        );
      }
    }

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


  async actualizar(id: number, dto: ActualizarUsuarioDto): Promise<Usuario> {
    const usuario = await this.obtenerPorId(id);

    // Validar que no se pueda editar usuarios con rol AFILIADO o MAESTRO
    if (usuario.rol_id === 2 || usuario.rol_id === 4) {
      throw new BadRequestException(
        'No se puede editar usuarios con rol AFILIADO o MAESTRO',
      );
    }

    // Si se cambia el nombre de usuario, validar que no exista
    if (dto.nombre_usuario && dto.nombre_usuario !== usuario.nombre_usuario) {
      const existeUsuario = await this.usuarioRepo.count({
        where: { nombre_usuario: dto.nombre_usuario },
      });
      if (existeUsuario > 0) {
        throw new ConflictException(
          `Ya existe un usuario con el nombre "${dto.nombre_usuario}"`,
        );
      }
    }

    // Si se cambia el correo, validar que no exista
    if (dto.correo && dto.correo !== usuario.correo) {
      const existeCorreo = await this.usuarioRepo.count({
        where: { correo: dto.correo },
      });
      if (existeCorreo > 0) {
        throw new ConflictException(
          `Ya existe un usuario con el correo "${dto.correo}"`,
        );
      }
    }

    // Si se cambia el rol, validar que sea permitido
    if (dto.rol_id && dto.rol_id !== usuario.rol_id) {
      const rol = await this.rolService.obtenerPorId(dto.rol_id);
      if (!rol) {
        throw new BadRequestException(`El rol con ID ${dto.rol_id} no existe`);
      }

      if (!this.rolService.esRolPermitidoParaCreacion(dto.rol_id)) {
        throw new BadRequestException(
          'Solo se permite asignar rol ADMINISTRADOR u OPERADOR',
        );
      }
    }

    

    // Actualizar campos
    Object.assign(usuario, dto);

    return this.usuarioRepo.save(usuario);
  }


  async anular(id: number): Promise<Usuario> {
    const usuario = await this.obtenerPorId(id);

    // Validar que no se pueda anular usuarios con rol AFILIADO o MAESTRO
    if (usuario.rol_id === 2 || usuario.rol_id === 4) {
      throw new BadRequestException(
        'No se puede anular usuarios con rol AFILIADO o MAESTRO',
      );
    }

    if (!usuario.es_activo) {
      throw new BadRequestException('El usuario ya está inactivo');
    }

    usuario.es_activo = false;
    return this.usuarioRepo.save(usuario);
  }

  async activar(id: number): Promise<Usuario> {
    const usuario = await this.obtenerPorId(id);

    if (usuario.es_activo) {
      throw new BadRequestException('El usuario ya está activo');
    }

    usuario.es_activo = true;
    return this.usuarioRepo.save(usuario);
  }

  async cambiarContrasena(
    id: number,
    dto: CambiarContrasenaDto,
  ): Promise<void> {
    const usuario = await this.obtenerPorId(id);

    // Validar contraseña actual
    const esValida = await bcrypt.compare(
      dto.contrasena_actual,
      usuario.contrasena_hash,
    );
    if (!esValida) {
      throw new BadRequestException('La contraseña actual es incorrecta');
    }

    // Validar que las nuevas contraseñas coincidan
    if (dto.contrasena_nueva !== dto.confirmar_contrasena) {
      throw new BadRequestException('Las contraseñas nuevas no coinciden');
    }

    // Hash de la nueva contraseña
    const hash = await bcrypt.hash(dto.contrasena_nueva, 10);
    usuario.contrasena_hash = hash;

    await this.usuarioRepo.save(usuario);
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
