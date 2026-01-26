// src/prestamos/dto/prestamo-historial-item.dto.ts
import { EstadoCancelacion } from 'src/catalogos/entities/estado-cancelacion.entity';
import { EstadoItf } from 'src/catalogos/entities/estado-itf.entity';
import { TipoPrestamo } from '../entities/tipo-prestamo.entity';
import { EstadoPrestamo } from '../entities/estado-prestamo.entity';

export class PrestamoHistorialItemDto {
  prestamo_id: number;

  estado_prestamo_id: number;
  estado_prestamo: EstadoPrestamo;

  numero_prestamo: number;
  fecha_prestamo: string;

  tipo_prestamo_id: number;
  tipo_prestamo: TipoPrestamo;

  tasa_interes_mensual: number;

  numero_cuotas_pactadas: number;
  numero_cuotas_pagadas: number;

  monto_prestamo: number;
  cuota_mensual: number;

  cuota_mensual_capital: number;
  cuota_mensual_interes: number;

  monto_adeuda: number; // monto_saldo
  monto_pagado: number; // monto_total_pagado

  estado_cancelacion_id: number | null;
  estado_cancelacion: EstadoCancelacion | null;

  monto_gastos_operativos: number;

  estado_itf_id: number | null;
  estado_itf: EstadoItf | null; // para sacar S/N si quieres

  monto_capital_cuota: number;
  monto_interes_cuota: number;
  monto_gasto_adm_cuota: number;

  monto_exonerado: number;
  monto_interes_mora: number;
}
