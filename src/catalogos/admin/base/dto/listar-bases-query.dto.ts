import { Type } from 'class-transformer';
import { IsInt, IsOptional, Min } from 'class-validator';
import { ListarCatalogoQueryDto } from 'src/catalogos/dto/listar-catalogo-query.dto';

export class ListarBasesQueryDto extends ListarCatalogoQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  departamento_id?: number;
}
