import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsInt,
  IsDateString,
  Length,
} from 'class-validator';

export class CrearAfiliadoDto {
  // --- Identificación ---
  @IsNotEmpty()
  @IsString()
  @Length(1, 10)
  codigo_trabajador: string;

  @IsOptional()
  @IsString()
  @Length(8, 20) // DNI normalmente 8, pero puede haber otros formatos
  doc_identidad?: string;

  @IsNotEmpty()
  @IsString()
  @Length(1, 50)
  ap_paterno: string;

  @IsOptional()
  @IsString()
  @Length(1, 50)
  ap_materno?: string;

  @IsNotEmpty()
  @IsString()
  @Length(1, 80)
  nombres: string;

  // --- Datos de contacto ---
  @IsOptional()
  @IsString()
  @Length(0, 200)
  direccion?: string;

  @IsOptional()
  @IsString()
  @Length(0, 20)
  telefono?: string;

  @IsOptional()
  @IsString()
  @Length(0, 120)
  email?: string;

  // --- Ubicación ---
  @IsOptional()
  @IsInt()
  pais_id?: number;

  @IsOptional()
  @IsInt()
  departamento_id?: number;

  @IsOptional()
  @IsInt()
  provincia_id?: number;

  @IsOptional()
  @IsInt()
  distrito_id?: number;

  // --- Información institucional ---
  @IsOptional()
  @IsInt()
  base_id?: number;

  @IsNotEmpty()
  @IsDateString()
  fecha_ingreso: string; // YYYY-MM-DD

  @IsNotEmpty()
  @IsDateString()
  fecha_nacimiento: string; // YYYY-MM-DD

  // --- Estado ---
  @IsOptional()
  @IsString()
  @Length(0, 20)
  estado?: string; // Se setea 'ACTIVO' por defecto si no se manda
}
