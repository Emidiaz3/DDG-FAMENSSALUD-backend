// src/ajustes/dto/actualizar-multiples-parametros.dto.ts
import { IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ActualizarParametroDto } from './actualizar-parametro.dto';

export class ActualizarMultiplesParametrosDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ActualizarParametroDto)
  parametros: ActualizarParametroDto[];
}