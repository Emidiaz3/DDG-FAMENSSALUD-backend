
import { IsNotEmpty, IsString, IsOptional } from 'class-validator';

export class ActualizarParametroDto {
  @IsNotEmpty()
  @IsString()
  clave: string;

  @IsNotEmpty()
  @IsString()
  valor: string;

  @IsOptional()
  @IsString()
  actualizado_por?: string;
}