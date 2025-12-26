export enum TipoPagoPrestamoEnum {
  SIN_DEFINIR = 1, // legacy
  PAGO_NORMAL = 2, // N
  CANCELACION_TOTAL = 3, // C
  REENGANCHE = 4, // R
  EFECTIVO_OTRO = 5, // E
}

export enum TipoPrestamoEnum {
  NORMAL = 1,
  EMERGENCIA = 2,
  LUTO = 3,
  REENGANCHE = 4,
  CREDITO_ESPECIAL = 5,
}
export enum EstadoPrestamoEnum {
  PENDIENTE = 1,
  CANCELADO = 2,
  ANULADO = 3,
}

export enum EstadoCancelacionEnum {
  SIN_DEFINIR = 1,
  REENGANCHE = 2,
  CANCELACION = 3,
  EFECTIVO = 4,
}
