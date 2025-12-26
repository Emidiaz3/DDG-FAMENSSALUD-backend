import { IsInt, IsNotEmpty, IsDateString } from 'class-validator';

export class RegistrarPagoCancelacionTotalDto {
  @IsInt()
  prestamo_id: number;

  @IsInt()
  afiliado_id: number;

  @IsNotEmpty()
  @IsDateString()
  fecha_pago: string;
}
