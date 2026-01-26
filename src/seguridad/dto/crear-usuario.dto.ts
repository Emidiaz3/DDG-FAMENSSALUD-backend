// src/seguridad/dto/crear-usuario.dto.ts
import {
  IsBoolean,
  IsEmail,
  IsInt,
  IsOptional,
  IsString,
  MinLength,
  IsIn,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CrearUsuarioDto {
  @IsString()
  nombre_usuario: string;

  @IsString()
  nombre_completo: string;

  @IsOptional()
  @IsEmail()
  correo?: string;

  @IsOptional()
  @IsString()
  telefono?: string;

  @Type(() => Number) // 👈 transforma el JSON a number
  @IsInt()
  @IsIn([1, 3], {
    message: 'Solo se permite crear usuarios con rol ADMINISTRADOR (1) u OPERADOR (3)',
  })
  rol_id: number; // 👈 ahora es number

  @IsString()
  @MinLength(6)
  contrasena: string;

  @IsOptional()
  @IsBoolean()
  es_activo?: boolean;
}
