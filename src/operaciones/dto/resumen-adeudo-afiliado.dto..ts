// src/operaciones/dto/resumen-adeudos-afiliado.dto.ts
export class ResumenAdeudosAfiliadoDto {
  afiliado_id: number;
  total_excesos: number;
  total_devoluciones: number;
  monto_adeuda: number; // excesos - devoluciones
}
