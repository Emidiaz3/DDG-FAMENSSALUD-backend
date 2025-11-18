// src/seguridad/usuario.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Usuario } from './entities/usuario.entity';
import { CrearUsuarioDto } from './dto/crear-usuario.dto';
import * as bcrypt from 'bcrypt';
import { generarUsernameBase } from 'src/afiliados/utils/username.util';
import { Afiliado } from 'src/afiliados/entities/afiliado.entity';

@Injectable()
export class UsuarioService {
  private readonly ROL_AFILIADO_ID = 2; // 👈 ajusta al ID real

  constructor(
    @InjectRepository(Usuario)
    private readonly usuarioRepo: Repository<Usuario>,
  ) {}

  async listarTodos(): Promise<Usuario[]> {
    return this.usuarioRepo.find({
      relations: ['rol'],
      where: { es_activo: true },
    });
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
    return this.usuarioRepo.findOne({ where: { id } });
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
