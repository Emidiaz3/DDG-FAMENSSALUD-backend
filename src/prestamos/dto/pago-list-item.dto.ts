// src/prestamos/dto/pago-list-item.dto.ts
import { Planilla } from 'src/operaciones/entities/planilla.entity';

export class PagoListItemDto {
  pago_id: number;

  numero_pago: number;
  fecha_pago: string | null;

  tipo_pago_prestamo_id: number;
  tipo_pago_prestamo: {
    tipo_pago_prestamo_id: number;
    codigo: string | null;
    descripcion: string;
  } | null;

  monto: number; // monto_pago
  capital: number; // monto_capital
  interes: number; // monto_interes

  monto_gastos_operativos: number;
  monto_gasto_adm: number;
  monto_exceso: number;
  monto_mora: number;

  saldo_despues_pago: number;

  planilla_id: number | null;
  planilla: Pick<
    Planilla,
    'planilla_id' | 'codigo' | 'anio' | 'mes' | 'tipo'
  > | null;
}
