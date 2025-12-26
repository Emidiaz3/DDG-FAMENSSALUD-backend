// src/nucleo/afiliados/dto/listar-afiliados-query.dto.ts
import { IsOptional, IsString } from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

export class ListarAfiliadosQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsString()
  estado?: boolean;

  @IsOptional()
  @IsString()
  search?: string;
}
