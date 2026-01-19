import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class ConfirmarPlanillaDto {
  @IsString()
  @IsNotEmpty()
  preview_token: string;

  @IsInt()
  @Min(2000)
  @Max(2100)
  anio: number;

  @IsInt()
  @Min(1)
  @Max(12)
  mes: number;

  @IsString()
  @IsNotEmpty()
  tipo: string;

  @IsOptional()
  @IsString()
  codigo?: string;

  @IsOptional()
  @IsString()
  observacion?: string;
}
