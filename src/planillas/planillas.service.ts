import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Afiliado } from 'src/afiliados/entities/afiliado.entity';
import { AfiliacionHistorial } from 'src/afiliados/entities/afiliacion-historial.entity';
import { Prestamo } from 'src/prestamos/entities/prestamo.entity';
import { Pago } from 'src/prestamos/entities/pago.entity';
import { Aporte } from 'src/aportes/entities/aporte.entity';
import {
  EstadoPrestamoEnum,
  TipoPagoPrestamoEnum,
} from 'src/prestamos/prestamos.constants';
import { ParametrosGlobalesService } from 'src/configuracion/parametros-globales.service';
import {
  AuditoriaService,
  AuditContext,
} from 'src/auditoria/auditoria.service';
import { PlanillaExcelParserService } from './planilla-excel-parser.service';
import { PlanillaDistribucionService } from './planilla-distribucion.service';
import {
  PlanillaPreviewItem,
  PlanillaPreviewResponse,
  PlanillaPreviewError,
  PlanillaExcelRow,
} from './types/planilla.types';
import { randomUUID } from 'crypto';
import { ConfirmarPlanillaDto } from './dto/confirmar-planilla.dto';
import { Planilla } from 'src/operaciones/entities/planilla.entity';

@Injectable()
export class PlanillasService {
  // Temporal: snapshot en memoria (ideal: tabla/redis)

  private readonly PREVIEW_TTL_MS = 6 * 60 * 60 * 1000; // 6 horas (ajusta)
  private previewStore = new Map<
    string,
    { snapshot: PlanillaPreviewResponse; expiresAt: number }
  >();

  constructor(
    private readonly dataSource: DataSource,

    @InjectRepository(Planilla)
    private readonly planillaRepo: Repository<Planilla>,

    @InjectRepository(Afiliado)
    private readonly afiliadoRepo: Repository<Afiliado>,

    @InjectRepository(AfiliacionHistorial)
    private readonly historialRepo: Repository<AfiliacionHistorial>,

    @InjectRepository(Prestamo)
    private readonly prestamoRepo: Repository<Prestamo>,

    @InjectRepository(Pago)
    private readonly pagoRepo: Repository<Pago>,

    @InjectRepository(Aporte)
    private readonly aporteRepo: Repository<Aporte>,

    private readonly parser: PlanillaExcelParserService,
    private readonly distribucion: PlanillaDistribucionService,
    private readonly params: ParametrosGlobalesService,
    private readonly auditoria: AuditoriaService,
  ) {
    setInterval(() => this.purgeExpiredPreviews(), 10 * 60 * 1000); // cada 10 min
  }

  private purgeExpiredPreviews() {
    const now = Date.now();
    for (const [token, entry] of this.previewStore.entries()) {
      if (entry.expiresAt <= now) this.previewStore.delete(token);
    }
  }

  async previewExcel(
    fileBuffer: Buffer,
    ctx?: AuditContext,
  ): Promise<PlanillaPreviewResponse> {
    const rows = await this.parser.parse(fileBuffer);

    const aporteMensual = await this.params.getNumber(
      'CUOTA_APORTACION_MENSUAL',
    );

    const errores: PlanillaPreviewError[] = [];
    const general: PlanillaPreviewItem[] = [];

    const cleanRows = this.normalizeRows(rows, errores);

    for (const r of cleanRows) {
      const afiliado = await this.afiliadoRepo.findOne({
        where: { codigo_trabajador: r.codigo_trabajador },
      });

      if (!afiliado) {
        errores.push({
          codigo_trabajador: r.codigo_trabajador,
          nombres: r.nombres,
          motivo: 'No existe afiliado con ese código de trabajador.',
        });
        continue;
      }

      const prestamosPendientes = await this.prestamoRepo.find({
        where: {
          afiliado_id: afiliado.afiliado_id,
          estado_prestamo_id: EstadoPrestamoEnum.PENDIENTE,
        },
        relations: ['tipo_prestamo'],
        order: { numero_prestamo: 'ASC' },
      });

      const calc = this.distribucion.distribuir({
        montoPlanilla: r.monto,
        aporteMensual,
        prestamos: prestamosPendientes,
      });

      general.push({
        codigo_trabajador: r.codigo_trabajador,
        nombre:
          r.nombres?.trim() ||
          `${afiliado.ap_paterno} ${afiliado.ap_materno} ${afiliado.nombres}`.trim(),

        monto_planilla: this.r2(r.monto),
        monto_aporte_objetivo: calc.aporteObjetivo,
        monto_aporte_asignado: calc.aporteAsignado,

        prestamos: calc.prestamos,

        total_prestamos_objetivo: calc.totalPrestamosObjetivo,
        total_prestamos_asignado: calc.totalPrestamosAsignado,

        exceso: calc.exceso,
        resta_objetivo: calc.restaObjetivo,
        faltante_objetivo: calc.faltanteObjetivo,
        saldo_disponible_post_asignacion: calc.saldoPostAsignacion,
      });
    }

    const excesos = general
      .filter((g) => g.exceso > 0)
      .map((g) => ({
        codigo_trabajador: g.codigo_trabajador,
        nombre: g.nombre,
        monto_exceso: g.exceso,
      }));

    const resumen = {
      total_registros: rows.length,
      total_validos: general.length,
      total_errores: errores.length,
      total_monto_planilla: this.r2(
        general.reduce((acc, x) => acc + x.monto_planilla, 0),
      ),
      total_exceso: this.r2(
        excesos.reduce((acc, x) => acc + x.monto_exceso, 0),
      ),
      total_faltante_objetivo: this.r2(
        general.reduce((acc, x) => acc + x.faltante_objetivo, 0),
      ),
    };

    const preview_token = randomUUID();

    const response: PlanillaPreviewResponse = {
      preview_token,
      aporte_configurado: aporteMensual,
      general,
      excesos,
      errores,
      resumen,
    };

    this.previewStore.set(preview_token, {
      snapshot: response,
      expiresAt: Date.now() + this.PREVIEW_TTL_MS,
    });

    await this.auditoria.log({
      ctx,
      categoria: 'PLANILLAS',
      tipo_evento: 'PLANILLA_PREVIEW',
      entidad_esquema: 'operaciones',
      entidad_tabla: 'planilla_preview',
      entidad_id: preview_token,
      descripcion: 'Previsualización de planilla (sin persistir).',
      datos_anteriores: null,
      datos_nuevos: { resumen, aporteMensual },
      es_exitoso: true,
    });

    return response;
  }

  async confirm(dto: ConfirmarPlanillaDto, ctx?: AuditContext) {
    const entry = this.previewStore.get(dto.preview_token);

    if (!entry) {
      throw new NotFoundException({
        status: 'error',
        message: 'El preview_token no existe o expiró. Vuelva a previsualizar.',
      });
    }

    if (Date.now() > entry.expiresAt) {
      this.previewStore.delete(dto.preview_token);
      throw new NotFoundException({
        status: 'error',
        message: 'El preview_token expiró. Vuelva a previsualizar.',
      });
    }

    const snapshot = entry.snapshot;

    if (!snapshot) {
      throw new NotFoundException({
        status: 'error',
        message: 'El preview_token no existe o expiró. Vuelva a previsualizar.',
      });
    }

    // Validaciones básicas
    if (dto.mes < 1 || dto.mes > 12) {
      throw new BadRequestException({
        status: 'error',
        message: 'Mes inválido.',
      });
    }

    return this.dataSource.transaction(async (manager) => {
      const planillaRepo = manager.getRepository(Planilla);
      const afiliadoRepo = manager.getRepository(Afiliado);
      const historialRepo = manager.getRepository(AfiliacionHistorial);
      const prestamoRepo = manager.getRepository(Prestamo);
      const pagoRepo = manager.getRepository(Pago);
      const aporteRepo = manager.getRepository(Aporte);

      // 1) Crear registro en operaciones.planilla
      const codigoPlanilla =
        dto.codigo?.trim() ||
        this.generarCodigoPlanilla(dto.anio, dto.mes, dto.tipo);

      const planilla = planillaRepo.create(<Partial<Planilla>>{
        codigo: codigoPlanilla,
        anio: dto.anio,
        mes: dto.mes,
        tipo: dto.tipo,
        fecha_carga: new Date(),
        usuario_carga: String(ctx?.usuario_id ?? ''), // tu columna es nvarchar
        observacion: dto.observacion,
      });

      const planillaGuardada = await planillaRepo.save(planilla);

      const resultados: Array<any> = [];
      const errores: Array<any> = [];

      // 2) Procesar cada afiliado del snapshot
      for (const item of snapshot.general) {
        // 2.1) Resolver afiliado
        const afiliado = await afiliadoRepo.findOne({
          where: { codigo_trabajador: item.codigo_trabajador },
        });

        if (!afiliado) {
          errores.push({
            codigo_trabajador: item.codigo_trabajador,
            motivo: 'Afiliado no existe al confirmar.',
          });
          continue;
        }

        // 2.2) Historial activo para aportes y pagos
        const historialActivo = await historialRepo.findOne({
          where: { afiliado_id: afiliado.afiliado_id, es_activo: true },
          order: { fecha_inicio: 'DESC' },
        });

        if (!historialActivo) {
          errores.push({
            codigo_trabajador: item.codigo_trabajador,
            motivo:
              'Afiliado no tiene afiliación activa para registrar aportes/pagos.',
          });
          continue;
        }

        const sub = {
          codigo_trabajador: item.codigo_trabajador,
          afiliado_id: afiliado.afiliado_id,
          aporte_id: null as number | null,
          pagos_creados: [] as Array<{
            pago_id: number;
            prestamo_id: number;
            monto_pago: number;
          }>,
          exceso: item.exceso, // solo informativo
        };

        // 3) Registrar APORTE (parcial o completo) si asignado > 0
        if (this.r2(item.monto_aporte_asignado) > 0) {
          const aporte = aporteRepo.create({
            afiliado_id: afiliado.afiliado_id,
            afiliacion_historial_id: historialActivo.afiliacion_historial_id,
            planilla_id: planillaGuardada.planilla_id, // ✅ FK
            fecha_aporte: new Date(), // o la fecha de planilla si manejas
            monto_aporte: this.r2(item.monto_aporte_asignado) as any,
            origen: 'PLANILLA',
            referencia_lote: planillaGuardada.codigo,
            observacion: dto.observacion ?? null,
            // legacy opcional null
            codtra_legacy: null,
            codafi2_legacy: null,
            codafi_legacy: null,
            codret_legacy: null,
            estafi_legacy: null,
            ind_legacy: null,
          });

          const aporteGuardado = await aporteRepo.save(aporte);
          sub.aporte_id = aporteGuardado.aporte_id;
        }

        // 4) Pagos por préstamo según snapshot (interés primero ya viene asignado)
        for (const pr of item.prestamos) {
          const montoPago = this.r2(pr.asignado_total);
          if (montoPago <= 0) continue;

          // 4.1) Releer préstamo actual (lock lógico: dentro tx)
          const prestamo = await prestamoRepo.findOne({
            where: { prestamo_id: pr.prestamo_id },
          });

          if (!prestamo) {
            throw new NotFoundException({
              status: 'error',
              message: `Préstamo ${pr.prestamo_id} no existe al confirmar.`,
            });
          }

          // Solo permitimos pagos si sigue pendiente (si cambió a cancelado, esto debería abortar por consistencia)
          if (prestamo.estado_prestamo_id !== EstadoPrestamoEnum.PENDIENTE) {
            throw new BadRequestException({
              status: 'error',
              message: `El préstamo ${prestamo.prestamo_id} ya no está pendiente. Re-previsualiza la planilla.`,
            });
          }

          const saldoAntes = this.r2(Number(prestamo.monto_saldo));
          const saldoDespues = this.normalizeSaldo(saldoAntes - montoPago);

          // Validar no exceder saldo permitido
          if (saldoDespues < -0.009) {
            throw new BadRequestException({
              status: 'error',
              message: `El pago ${montoPago} excede el saldo del préstamo ${prestamo.prestamo_id}. Re-previsualiza.`,
            });
          }

          // 4.2) Correlativo numero_pago
          const rawMax = await pagoRepo
            .createQueryBuilder('p')
            .select('MAX(p.numero_pago)', 'maxNumero')
            .where('p.prestamo_id = :prestamoId', {
              prestamoId: prestamo.prestamo_id,
            })
            .andWhere('p.es_anulado = 0')
            .getRawOne<{ maxNumero: number | null }>();

          const siguienteNumero = (rawMax?.maxNumero ?? 0) + 1;

          const montoInteres = this.r2(pr.asignado_interes);
          const montoCapital = this.r2(pr.asignado_capital);

          // Validación fuerte: interes+capital = pago (tolerancia)
          const suma = this.r2(montoInteres + montoCapital);
          if (Math.abs(suma - montoPago) > 0.01) {
            throw new BadRequestException({
              status: 'error',
              message: `Inconsistencia en distribución para préstamo ${prestamo.prestamo_id}. (interés+capital != pago)`,
            });
          }

          // 4.3) Crear pago
          const pago = pagoRepo.create({
            prestamo_id: prestamo.prestamo_id,
            afiliado_id: afiliado.afiliado_id,
            afiliacion_historial_id: historialActivo.afiliacion_historial_id,
            planilla_id: planillaGuardada.planilla_id, // ✅ FK
            numero_pago: siguienteNumero,
            fecha_pago: new Date(), // o fecha de planilla
            tipo_pago_prestamo_id: TipoPagoPrestamoEnum.PAGO_NORMAL,

            tipo_pago_legacy: null,
            monto_pago: montoPago,
            monto_capital: montoCapital,
            monto_interes: montoInteres,

            monto_gastos_operativos: 0,
            monto_gasto_adm: 0,
            monto_exceso: 0,
            monto_mora: 0,
            saldo_despues_pago: saldoDespues,

            monto_extra_capital: 0,
            monto_extra_interes: 0,
            monto_extra_gasto_adm: 0,
            diferencia_interes_condonado: 0,

            numero_prestamo_legacy: null,
            codigo_trabajador_legacy: null,
            codigo_afiliado_simple_legacy: null,
            codigo_retiro_legacy: null,
            codigo_afiliado_compuesto_legacy: null,
            estado_afiliado_legacy: null,
            indicador_legacy: null,

            es_anulado: false,
          });

          const pagoGuardado = await pagoRepo.save(pago);

          // 4.4) Actualizar préstamo (igual a tu registrarPagoNormal, pero con monto parcial)
          prestamo.monto_saldo = saldoDespues as any;
          prestamo.monto_total_pagado = this.r2(
            Number(prestamo.monto_total_pagado) + montoPago,
          ) as any;
          prestamo.monto_pagado_capital = this.r2(
            Number(prestamo.monto_pagado_capital) + montoCapital,
          ) as any;
          prestamo.monto_pagado_interes = this.r2(
            Number(prestamo.monto_pagado_interes) + montoInteres,
          ) as any;

          prestamo.numero_cuotas_pagadas = Math.max(
            0,
            (prestamo.numero_cuotas_pagadas ?? 0) + 1,
          );
          prestamo.fecha_ultima_amortizacion = new Date() as any;

          if (saldoDespues === 0) {
            prestamo.estado_prestamo_id = EstadoPrestamoEnum.CANCELADO;
          }

          await prestamoRepo.save(prestamo);

          sub.pagos_creados.push({
            pago_id: pagoGuardado.pago_id,
            prestamo_id: prestamo.prestamo_id,
            monto_pago: montoPago,
          });
        }

        // 5) Excesos: NO insertar, solo informativo en respuesta
        resultados.push(sub);
      }

      // 6) Auditoría
      await this.auditoria.log({
        ctx,
        categoria: 'PLANILLAS',
        tipo_evento: 'PLANILLA_CONFIRM',
        entidad_esquema: 'operaciones',
        entidad_tabla: 'planilla',
        entidad_id: String(planillaGuardada.planilla_id),
        descripcion: `Confirmación y ejecución de planilla ${planillaGuardada.codigo}.`,
        datos_anteriores: { preview_token: dto.preview_token },
        datos_nuevos: {
          planilla_id: planillaGuardada.planilla_id,
          codigo: planillaGuardada.codigo,
          anio: planillaGuardada.anio,
          mes: planillaGuardada.mes,
          tipo: planillaGuardada.tipo,
          resumen: snapshot.resumen,
          resultados: { ok: resultados.length, errores: errores.length },
        },
        es_exitoso: true,
      });

      // (opcional) invalidar token (para no re-confirmar)
      this.previewStore.delete(dto.preview_token);

      return {
        status: 'success',
        message: 'Planilla confirmada y procesada.',
        data: {
          planilla_id: planillaGuardada.planilla_id,
          codigo: planillaGuardada.codigo,
          anio: planillaGuardada.anio,
          mes: planillaGuardada.mes,
          tipo: planillaGuardada.tipo,
          resumen: snapshot.resumen,
          resultados,
          errores,
          excesos_informativos: snapshot.excesos, // ✅ no se insertan, solo se devuelven
        },
      };
    });
  }

  async cancelPreview(previewToken: string, ctx?: AuditContext) {
    const entry = this.previewStore.get(previewToken);

    if (!entry) {
      throw new NotFoundException({
        status: 'error',
        message: 'El preview_token no existe o ya expiró.',
      });
    }

    this.previewStore.delete(previewToken);

    await this.auditoria.log({
      ctx,
      categoria: 'PLANILLAS',
      tipo_evento: 'PLANILLA_PREVIEW_CANCEL',
      entidad_esquema: 'operaciones',
      entidad_tabla: 'planilla_preview',
      entidad_id: previewToken,
      descripcion:
        'Se canceló la previsualización de planilla (snapshot eliminado).',
      datos_anteriores: { expiresAt: new Date(entry.expiresAt).toISOString() },
      datos_nuevos: null,
      es_exitoso: true,
    });

    return {
      status: 'success',
      message: 'Previsualización cancelada. El snapshot fue eliminado.',
    };
  }

  /* ==========================
     Helpers
     ========================== */

  private normalizeRows(
    rows: PlanillaExcelRow[],
    errores: PlanillaPreviewError[],
  ) {
    const out: PlanillaExcelRow[] = [];

    for (const r of rows) {
      const codigo = (r.codigo_trabajador ?? '').trim();
      const nombres = (r.nombres ?? '').trim();
      const monto = Number(r.monto);

      if (!codigo) {
        errores.push({ nombres, motivo: 'Código vacío.' });
        continue;
      }

      if (!Number.isFinite(monto) || monto < 0) {
        errores.push({
          codigo_trabajador: codigo,
          nombres,
          motivo: 'Monto inválido o negativo.',
        });
        continue;
      }

      out.push({ codigo_trabajador: codigo, nombres, monto: this.r2(monto) });
    }

    return out;
  }

  private generarCodigoPlanilla(anio: number, mes: number, tipo: string) {
    const mm = String(mes).padStart(2, '0');
    return `R${anio}-${mm}`;
  }

  private r2(n: number) {
    return Number((Number(n) || 0).toFixed(2));
  }

  private normalizeSaldo(n: number) {
    const v = this.r2(n);
    if (Math.abs(v) <= 0.009) return 0;
    return v;
  }
}
