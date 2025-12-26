import { IsDateString, IsInt, IsNumber, Min } from 'class-validator';

export class RegistrarPagoNormalDto {
  @IsInt()
  prestamo_id: number;

  @IsInt()
  afiliado_id: number;

  @IsDateString()
  fecha_pago: string;

  @IsNumber()
  @Min(0.01)
  monto_pago: number;

  @IsNumber()
  @Min(0)
  monto_capital: number;

  @IsNumber()
  @Min(0)
  monto_interes: number;
}
