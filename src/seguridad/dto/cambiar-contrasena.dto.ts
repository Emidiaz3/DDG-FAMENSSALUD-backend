// src/seguridad/dto/cambiar-contrasena.dto.ts
import { IsString, MinLength } from 'class-validator';

export class CambiarContrasenaDto {
  @IsString()
  @MinLength(6, { message: 'La contraseña debe tener al menos 6 caracteres' })
  contrasena_actual: string;

  @IsString()
  @MinLength(6, { message: 'La nueva contraseña debe tener al menos 6 caracteres' })
  contrasena_nueva: string;

  @IsString()
  @MinLength(6, { message: 'Debe confirmar la nueva contraseña' })
  confirmar_contrasena: string;
}