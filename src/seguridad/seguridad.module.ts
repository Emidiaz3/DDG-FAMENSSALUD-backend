// src/seguridad/seguridad.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PassportModule } from '@nestjs/passport'; // 👈 IMPORTANTE

import { Usuario } from './entities/usuario.entity';
import { Rol } from './entities/rol.entity';

import { UsuarioService } from './usuario.service';
import { UsuarioController } from './usuario.controller';

import { AuthService } from './auth/auth.service';
import { AuthController } from './auth/auth.controller';
import { JwtStrategy } from './auth/jwt.strategy';
import { JwtAuthGuard } from './auth/jwt-auth.guard';
import { Afiliado } from 'src/afiliados/entities/afiliado.entity';

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([Usuario, Rol, Afiliado]),
    PassportModule.register({ defaultStrategy: 'jwt' }), // 👈 AÑADIR ESTO
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_ACCESS_SECRET'),
        signOptions: { expiresIn: '60s' }, // 1 minuto
      }),
    }),
  ],
  controllers: [UsuarioController, AuthController],
  providers: [UsuarioService, AuthService, JwtStrategy, JwtAuthGuard],
  exports: [UsuarioService],
})
export class SeguridadModule {}
