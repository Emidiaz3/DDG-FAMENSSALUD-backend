// src/seguridad/dto/actualizar-usuario.dto.ts
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

export class ActualizarUsuarioDto {
  @IsOptional()
  @IsString()
  @MinLength(3, { message: 'El nombre de usuario debe tener al menos 3 caracteres' })
  nombre_usuario?: string;

  @IsOptional()
  @IsString()
  @MinLength(3, { message: 'El nombre completo debe tener al menos 3 caracteres' })
  nombre_completo?: string;

  @IsOptional()
  @IsEmail({}, { message: 'El correo electrónico no es válido' })
  correo?: string;

  @IsOptional()
  @IsString()
  telefono?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'El rol debe ser un número entero' })
  @IsIn([1, 3], {
    message: 'Solo se permite asignar rol ADMINISTRADOR (1) u OPERADOR (3)',
  })
  rol_id?: number;

  @IsOptional()
  @IsBoolean()
  es_activo?: boolean;
}