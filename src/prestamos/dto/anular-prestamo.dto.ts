import { IsOptional, IsString, MaxLength } from 'class-validator';

export class AnularPrestamoDto {
  @IsOptional()
  @IsString()
  @MaxLength(200)
  motivo?: string;
}
