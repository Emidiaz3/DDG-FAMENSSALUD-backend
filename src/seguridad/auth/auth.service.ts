// src/seguridad/auth/auth.service.ts
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt'; // 👈 IMPORT CORRECTO
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';

import { UsuarioService } from '../usuario.service';
import { Usuario } from '../entities/usuario.entity';
import { LoginDto } from './dto/login.dto';
import { JwtPayload } from './jwt-payload.interface';
import { InjectRepository } from '@nestjs/typeorm';
import { Afiliado } from 'src/afiliados/entities/afiliado.entity';
import { Repository } from 'typeorm';

@Injectable()
export class AuthService {
  constructor(
    private readonly usuariosService: UsuarioService,
    private readonly jwtService: JwtService, // 👈 TIPO BIEN DEFINIDO
    private readonly configService: ConfigService,
    @InjectRepository(Afiliado)
    private readonly afiliadoRepo: Repository<Afiliado>,
  ) {}

  private buildPayload(
    usuario: Usuario,
    afiliadoId: number | null,
  ): JwtPayload {
    return {
      sub: usuario.usuario_id,
      username: usuario.nombre_usuario,
      rolId: usuario.rol_id,
      afiliadoId,
    };
  }

  private async getAfiliadoIdByUsuario(
    usuarioId: number,
  ): Promise<number | null> {
    const afiliado = await this.afiliadoRepo.findOne({
      where: { usuario_id: usuarioId },
      select: ['afiliado_id'],
    });

    return afiliado?.afiliado_id ?? null;
  }

  private async generateTokens(
    usuario: Usuario,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const afiliadoId = await this.getAfiliadoIdByUsuario(usuario.usuario_id);

    const payload = this.buildPayload(usuario, afiliadoId);

    const accessToken = await this.jwtService.signAsync(payload, {
      secret: this.configService.getOrThrow<string>('JWT_ACCESS_SECRET'),
      expiresIn: '60m', // 👈 1 minuto
    });

    const refreshToken = await this.jwtService.signAsync(payload, {
      secret: this.configService.getOrThrow<string>('JWT_REFRESH_SECRET'),
      expiresIn: '7d',
    });

    return { accessToken, refreshToken };
  }

  private async saveRefreshToken(usuario: Usuario, refreshToken: string) {
    const hash = await bcrypt.hash(refreshToken, 10);
    usuario.refresh_token_hash = hash;

    const exp = new Date();
    exp.setDate(exp.getDate() + 7);
    usuario.refresh_token_expira_en = exp;

    await this.usuariosService.save(usuario); // 👈 YA NO crear()
  }

  // auth.service.ts (fragmento)
  async login(dto: LoginDto): Promise<{
    accessToken: string;
    refreshToken: string;
    user: {
      id: number;
      nombre_usuario: string;
      nombre_completo: string;
      correo: string | null;
      telefono: string | null;
      rol_id: number;
      rol: any;
      es_activo: boolean;
      creado_en: Date;
      actualizado_en: Date;
    };
  }> {
    const usuario = await this.usuariosService.findByNombreUsuario(
      dto.nombre_usuario,
    );

    if (!usuario || !usuario.es_activo) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const passwordOk = await bcrypt.compare(
      dto.contrasena,
      usuario.contrasena_hash,
    );

    if (!passwordOk) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const { accessToken, refreshToken } = await this.generateTokens(usuario);
    await this.saveRefreshToken(usuario, refreshToken);

    usuario.ultimo_login = new Date();
    await this.usuariosService.save(usuario);

    const user = {
      id: usuario.usuario_id,
      nombre_usuario: usuario.nombre_usuario,
      nombre_completo: usuario.nombre_completo,
      correo: usuario.correo ?? null,
      telefono: usuario.telefono ?? null,
      rol_id: usuario.rol_id,
      rol: usuario.rol,
      es_activo: usuario.es_activo,
      creado_en: usuario.creado_en,
      actualizado_en: usuario.actualizado_en,
    };

    return { accessToken, refreshToken, user };
  }

  // Cambiamos refreshToken para recibir el token directo (vendrá de cookie)
  async refreshFromToken(
    refreshToken: string,
  ): Promise<{ accessToken: string; refreshToken: string; user: any }> {
    const payload = await this.jwtService.verifyAsync<JwtPayload>(
      refreshToken,
      {
        secret: this.configService.getOrThrow<string>('JWT_REFRESH_SECRET'),
      },
    );

    const usuario = await this.usuariosService.findById(payload.sub);
    if (!usuario || !usuario.refresh_token_hash) {
      throw new UnauthorizedException('Refresh token inválido');
    }

    const tokenOk = await bcrypt.compare(
      refreshToken,
      usuario.refresh_token_hash,
    );
    if (!tokenOk) {
      throw new UnauthorizedException('Refresh token inválido');
    }

    const { accessToken, refreshToken: newRefreshToken } =
      await this.generateTokens(usuario);
    await this.saveRefreshToken(usuario, newRefreshToken);

    const user = {
      id: usuario.usuario_id,
      nombre_usuario: usuario.nombre_usuario,
      nombre_completo: usuario.nombre_completo,
      correo: usuario.correo ?? null,
      telefono: usuario.telefono ?? null,
      rol_id: usuario.rol_id,
      rol: usuario.rol,
      es_activo: usuario.es_activo,
      creado_en: usuario.creado_en,
      actualizado_en: usuario.actualizado_en,
    };

    return { accessToken, refreshToken: newRefreshToken, user };
  }
}
