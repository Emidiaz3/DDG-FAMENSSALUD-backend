// src/prestamos/dto/prestamo-list-item.dto.ts
export class PrestamoListItemDto {
  prestamo_id: number; // 👈 NUEVO

  codigo_trabajador: string;
  nombre_completo: string;
  departamento_base: string; // "Departamento / Base" (o solo lo que haya)

  numero_prestamo: number;
  tipo_prestamo: string;

  fecha_prestamo: string; // YYYY-MM-DD

  monto_seguro: number;
  monto_girado_banco: number;
  monto_prestamo: number;

  interes_mensual: number; // %
  estado_prestamo: string;

  numero_cuotas_pactadas: number;

  monto_pagado: number;
  monto_adeuda: number;
}
