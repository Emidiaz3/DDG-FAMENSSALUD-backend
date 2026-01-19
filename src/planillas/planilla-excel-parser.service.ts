import { BadRequestException, Injectable } from '@nestjs/common';
import ExcelJS from 'exceljs';
import { PlanillaExcelRow } from './types/planilla.types';

@Injectable()
export class PlanillaExcelParserService {
  async parse(buffer: Buffer): Promise<PlanillaExcelRow[]> {
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.load(buffer as any);

    const ws = wb.worksheets[0];
    if (!ws) {
      throw new BadRequestException({
        status: 'error',
        message: 'El Excel no tiene hojas.',
      });
    }

    // Se espera: 3 columnas: codigo, nombres, monto
    // Primera fila puede ser cabecera.
    const rows: PlanillaExcelRow[] = [];

    ws.eachRow((row, rowNumber) => {
      const c1 = String(row.getCell(1).value ?? '').trim();
      const c2 = String(row.getCell(2).value ?? '').trim();
      const c3raw = row.getCell(3).value;

      // Saltar fila vacía
      if (!c1 && !c2 && (c3raw === null || c3raw === undefined || c3raw === ''))
        return;

      // Si es cabecera (fila 1) y coincide "codigo/nombres/monto"
      if (
        rowNumber === 1 &&
        c1.toLowerCase() === 'codigo' &&
        c2.toLowerCase() === 'nombres'
      ) {
        return;
      }

      const monto = this.toNumber(c3raw);

      rows.push({
        codigo_trabajador: c1,
        nombres: c2,
        monto,
      });
    });

    if (rows.length === 0) {
      throw new BadRequestException({
        status: 'error',
        message: 'El Excel no contiene registros válidos.',
      });
    }

    return rows;
  }

  private toNumber(v: any): number {
    if (v === null || v === undefined || v === '') return NaN;

    // exceljs puede traer number o object
    if (typeof v === 'number') return v;

    const s = String(v).trim().replace(',', '.'); // por si viene 53,50
    const n = Number(s);
    return n;
  }
}
