import { IsString, MinLength } from 'class-validator';

export class LoginDto {
  @IsString()
  nombre_usuario: string;

  @IsString()
  @MinLength(4)
  contrasena: string;
}
