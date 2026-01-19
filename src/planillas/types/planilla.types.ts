export type PlanillaExcelRow = {
  codigo_trabajador: string;
  nombres: string;
  monto: number;
};

export type PlanillaPreviewPrestamo = {
  prestamo_id: number;
  numero_prestamo: number;
  cuota_objetivo: number;

  interes_objetivo: number; // monto_interes_cuota
  capital_objetivo: number; // monto_capital_cuota

  asignado_total: number;
  asignado_interes: number;
  asignado_capital: number;
};

export type PlanillaPreviewItem = {
  codigo_trabajador: string;
  nombre: string;

  monto_planilla: number;
  monto_aporte_objetivo: number;
  monto_aporte_asignado: number;

  prestamos: PlanillaPreviewPrestamo[];

  total_prestamos_objetivo: number;
  total_prestamos_asignado: number;

  exceso: number;
  resta_objetivo: number; // monto_planilla - (aporte_objetivo + total_prestamos_objetivo)
  faltante_objetivo: number; // >0 si falta
  saldo_disponible_post_asignacion: number; // debería ser exceso o 0
};

export type PlanillaPreviewError = {
  codigo_trabajador?: string;
  nombres?: string;
  motivo: string;
};

export type PlanillaPreviewResponse = {
  preview_token: string;
  aporte_configurado: number;
  general: PlanillaPreviewItem[];
  excesos: Array<{
    codigo_trabajador: string;
    nombre: string;
    monto_exceso: number;
  }>;
  errores: PlanillaPreviewError[];
  resumen: {
    total_registros: number;
    total_validos: number;
    total_errores: number;
    total_monto_planilla: number;
    total_exceso: number;
    total_faltante_objetivo: number;
  };
};
