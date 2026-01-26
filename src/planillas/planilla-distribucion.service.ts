import { Injectable } from '@nestjs/common';
import { Prestamo } from 'src/prestamos/entities/prestamo.entity';
import { PlanillaPreviewPrestamo } from './types/planilla.types';

@Injectable()
export class PlanillaDistribucionService {
  distribuir(params: {
    montoPlanilla: number;
    aporteMensual: number;
    prestamos: Prestamo[]; // pendientes, ordenados
  }) {
    const montoPlanilla = this.r2(params.montoPlanilla);
    const aporteObjetivo = this.r2(params.aporteMensual);

    let saldo = montoPlanilla;

    // 1) aporte primero
    const aporteAsignado = this.r2(Math.min(saldo, aporteObjetivo));
    saldo = this.r2(saldo - aporteAsignado);

    // 2) préstamos en orden: interés primero dentro de cuota
    const detalles: PlanillaPreviewPrestamo[] = [];

    for (const p of params.prestamos) {
      if (saldo <= 0) {
        detalles.push({
          prestamo_id: p.prestamo_id,
          tipo_prestamo_id: p.tipo_prestamo_id,
          tipo_prestamo: p.tipo_prestamo,
          numero_prestamo: p.numero_prestamo,
          cuota_objetivo: this.r2(Number(p.cuota_mensual)),
          interes_objetivo: this.r2(Number(p.monto_interes_cuota)),
          capital_objetivo: this.r2(Number(p.monto_capital_cuota)),
          asignado_total: 0,
          asignado_interes: 0,
          asignado_capital: 0,
        });
        continue;
      }

      const cuotaObjetivo = this.r2(Number(p.cuota_mensual));
      const interesObj = this.r2(Number(p.monto_interes_cuota));
      const capitalObj = this.r2(Number(p.monto_capital_cuota));

      const asignadoTotal = this.r2(Math.min(saldo, cuotaObjetivo));

      const asignadoInteres = this.r2(Math.min(asignadoTotal, interesObj));
      const asignadoCapital = this.r2(
        Math.min(this.r2(asignadoTotal - asignadoInteres), capitalObj),
      );

      saldo = this.r2(saldo - asignadoTotal);

      detalles.push({
        prestamo_id: p.prestamo_id,
        tipo_prestamo_id: p.tipo_prestamo_id,
        tipo_prestamo: p.tipo_prestamo,
        numero_prestamo: p.numero_prestamo,
        cuota_objetivo: cuotaObjetivo,
        interes_objetivo: interesObj,
        capital_objetivo: capitalObj,
        asignado_total: asignadoTotal,
        asignado_interes: asignadoInteres,
        asignado_capital: asignadoCapital,
      });
    }

    const totalPrestamosObjetivo = this.r2(
      detalles.reduce((acc, x) => acc + x.cuota_objetivo, 0),
    );
    const totalPrestamosAsignado = this.r2(
      detalles.reduce((acc, x) => acc + x.asignado_total, 0),
    );

    const objetivoTotal = this.r2(aporteObjetivo + totalPrestamosObjetivo);

    const restaObjetivo = this.r2(montoPlanilla - objetivoTotal);

    const faltanteObjetivo =
      restaObjetivo < 0 ? this.r2(Math.abs(restaObjetivo)) : 0;
    const exceso = restaObjetivo > 0 ? this.r2(restaObjetivo) : 0;

    return {
      aporteObjetivo,
      aporteAsignado,
      prestamos: detalles,
      totalPrestamosObjetivo,
      totalPrestamosAsignado,
      exceso,
      restaObjetivo,
      faltanteObjetivo,
      saldoPostAsignacion: this.r2(saldo), // debería ser = exceso o 0
    };
  }

  private r2(n: number) {
    return Number((Number(n) || 0).toFixed(2));
  }
}
