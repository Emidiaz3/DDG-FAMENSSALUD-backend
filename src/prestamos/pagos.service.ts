import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Repository } from 'typeorm';
import { Prestamo } from './entities/prestamo.entity';
import { Pago } from './entities/pago.entity';
import { AfiliacionHistorial } from '../afiliados/entities/afiliacion-historial.entity';
import { RegistrarPagoNormalDto } from './dto/registrar-pago-normal.dto';
import {
  EstadoPrestamoEnum,
  TipoPagoPrestamoEnum,
} from './prestamos.constants';
import { LogEvento } from 'src/auditoria/entities/log-event.entity';
import { RegistrarPagoCancelacionTotalDto } from './dto/registrar-pago-cancelacion.dto';
import { TipoPagoPrestamo } from './entities/tipo-pago-prestamo.entity';

@Injectable()
export class PagosService {
  constructor(
    @InjectRepository(Prestamo)
    private readonly prestamoRepo: Repository<Prestamo>,

    @InjectRepository(Pago)
    private readonly pagoRepo: Repository<Pago>,

    @InjectRepository(AfiliacionHistorial)
    private readonly afiliacionHistRepo: Repository<AfiliacionHistorial>,

    @InjectRepository(TipoPagoPrestamo)
    private readonly tipoPagoPrestamoRepo: Repository<TipoPagoPrestamo>,

    private readonly dataSource: DataSource,
  ) {}

  async listarTiposPagoPorCodigo(
    codigos: string[],
  ): Promise<TipoPagoPrestamo[]> {
    return this.tipoPagoPrestamoRepo.find({
      where: {
        codigo: In(codigos),
      },
      order: {
        tipo_pago_prestamo_id: 'ASC',
      },
    });
  }

  // ---------- REGISTRAR PAGO NORMAL (tipo 2) ----------
  async registrarPagoNormal(dto: RegistrarPagoNormalDto): Promise<Pago> {
    return this.dataSource.transaction<Pago>(async (manager) => {
      const prestamoRepo = manager.getRepository(Prestamo);
      const pagoRepo = manager.getRepository(Pago);
      const afiliacionHistRepo = manager.getRepository(AfiliacionHistorial);

      // 1) Traer préstamo
      const prestamo = await prestamoRepo.findOne({
        where: { prestamo_id: dto.prestamo_id },
      });

      if (!prestamo) {
        throw new NotFoundException({
          status: 'error',
          message: 'El préstamo no existe.',
        });
      }

      // 2) Validar afiliado
      if (prestamo.afiliado_id !== dto.afiliado_id) {
        throw new BadRequestException({
          status: 'error',
          message:
            'El afiliado indicado no coincide con el afiliado del préstamo.',
        });
      }

      // 3) Afiliación activa
      const afiliacionActiva = await afiliacionHistRepo.findOne({
        where: { afiliado_id: dto.afiliado_id, es_activo: true },
        order: { fecha_inicio: 'DESC' },
      });

      if (!afiliacionActiva) {
        throw new BadRequestException({
          status: 'error',
          message:
            'El afiliado no tiene una afiliación activa para registrar el pago.',
        });
      }

      // 4) número_pago correlativo
      const result = await pagoRepo
        .createQueryBuilder('p')
        .select('MAX(p.numero_pago)', 'maxNumero')
        .where('p.prestamo_id = :prestamoId', {
          prestamoId: prestamo.prestamo_id,
        })
        .andWhere('p.es_anulado = 0')
        .getRawOne<{ maxNumero: number | null }>();

      const maxNumero = result?.maxNumero ?? 0;
      const siguienteNumero = maxNumero + 1;

      // 🔐 VALIDACIÓN: capital + interés = pago (con tolerancia)
      const cap = Number(dto.monto_capital);
      const inte = Number(dto.monto_interes);
      const pag = Number(dto.monto_pago);

      const suma = Number((cap + inte).toFixed(2));
      const pagoRedondeado = Number(pag.toFixed(2));
      const toleranciaMonto = 0.009;

      if (Math.abs(suma - pagoRedondeado) > toleranciaMonto) {
        throw new BadRequestException({
          status: 'error',
          message:
            'La suma de monto_capital y monto_interes no coincide con el monto_pago enviado.',
        });
      }

      // 5) Detectar si es la última cuota
      const esUltimaCuota =
        prestamo.numero_cuotas_pagadas + 1 === prestamo.numero_cuotas_pactadas;

      const saldoAntes = Number(prestamo.monto_saldo);

      let montoCapital = Number(dto.monto_capital);
      let montoInteres = Number(dto.monto_interes);
      let montoPago = Number(dto.monto_pago);

      // ✅ AJUSTE AUTOMÁTICO DE REDONDEO EN ÚLTIMA CUOTA
      if (esUltimaCuota) {
        // Usamos el saldo pendiente para cerrar exacto
        montoInteres = Number(prestamo.monto_interes_cuota); // p.e. 20.00
        montoPago = Number(saldoAntes.toFixed(2)); // p.e. 686.65
        montoCapital = Number((montoPago - montoInteres).toFixed(2)); // 666.65
      }

      // 6) Calcular saldo después (RESTANDO LA CUOTA COMPLETA)
      let saldoDespues = Number((saldoAntes - montoPago).toFixed(2));

      const tolerancia = 0.009;

      if (saldoDespues < -tolerancia) {
        throw new BadRequestException({
          status: 'error',
          message: 'El monto del pago excede el saldo permitido del préstamo.',
        });
      }

      if (Math.abs(saldoDespues) <= tolerancia) {
        saldoDespues = 0;
      }

      // 7) Crear el pago
      const nuevoPago = pagoRepo.create({
        prestamo_id: prestamo.prestamo_id,
        afiliado_id: dto.afiliado_id,
        afiliacion_historial_id: afiliacionActiva.afiliacion_historial_id,
        planilla_id: null,
        numero_pago: siguienteNumero,
        fecha_pago: dto.fecha_pago as any,
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

      const pagoGuardado = await pagoRepo.save(nuevoPago);

      // 8) Actualizar préstamo USANDO LOS MONTOS AJUSTADOS
      prestamo.monto_saldo = saldoDespues;
      prestamo.monto_total_pagado =
        Number(prestamo.monto_total_pagado) + montoPago;
      prestamo.monto_pagado_capital =
        Number(prestamo.monto_pagado_capital) + montoCapital;
      prestamo.monto_pagado_interes =
        Number(prestamo.monto_pagado_interes) + montoInteres;

      prestamo.numero_cuotas_pagadas =
        (prestamo.numero_cuotas_pagadas ?? 0) + 1;

      prestamo.fecha_ultima_amortizacion = dto.fecha_pago as any;

      if (saldoDespues === 0) {
        prestamo.estado_prestamo_id = EstadoPrestamoEnum.CANCELADO;
      }

      await prestamoRepo.save(prestamo);

      return pagoGuardado;
    });
  }

  async registrarPagoCancelacionTotal(
    dto: RegistrarPagoCancelacionTotalDto,
  ): Promise<Pago> {
    return this.dataSource.transaction<Pago>(async (manager) => {
      const prestamoRepo = manager.getRepository(Prestamo);
      const pagoRepo = manager.getRepository(Pago);
      const afiliacionHistRepo = manager.getRepository(AfiliacionHistorial);

      // 1) Traer préstamo
      const prestamo = await prestamoRepo.findOne({
        where: { prestamo_id: dto.prestamo_id },
      });

      if (!prestamo) {
        throw new NotFoundException({
          status: 'error',
          message: 'El préstamo no existe.',
        });
      }

      // 2) Validar afiliado
      if (prestamo.afiliado_id !== dto.afiliado_id) {
        throw new BadRequestException({
          status: 'error',
          message:
            'El afiliado indicado no coincide con el afiliado del préstamo.',
        });
      }

      // (Opcional, recomendado) No permitir si ya está cancelado
      if (prestamo.estado_prestamo_id === EstadoPrestamoEnum.CANCELADO) {
        throw new BadRequestException({
          status: 'error',
          message: 'El préstamo ya se encuentra cancelado.',
        });
      }

      // 3) Afiliación activa
      const afiliacionActiva = await afiliacionHistRepo.findOne({
        where: { afiliado_id: dto.afiliado_id, es_activo: true },
        order: { fecha_inicio: 'DESC' },
      });

      if (!afiliacionActiva) {
        throw new BadRequestException({
          status: 'error',
          message:
            'El afiliado no tiene una afiliación activa para registrar el pago.',
        });
      }

      // 4) número_pago correlativo (solo no anulados)
      const result = await pagoRepo
        .createQueryBuilder('p')
        .select('MAX(p.numero_pago)', 'maxNumero')
        .where('p.prestamo_id = :prestamoId', {
          prestamoId: prestamo.prestamo_id,
        })
        .andWhere('p.es_anulado = 0')
        .getRawOne<{ maxNumero: number | null }>();

      const maxNumero = result?.maxNumero ?? 0;
      const siguienteNumero = maxNumero + 1;

      // 5) Calcular capital amortizado (solo pagos NO anulados)
      //    OJO: aquí estamos siguiendo tu regla: solo capital, ignorar intereses.
      const capRes = await pagoRepo
        .createQueryBuilder('p')
        .select('COALESCE(SUM(p.monto_capital), 0)', 'sumCapital')
        .where('p.prestamo_id = :prestamoId', {
          prestamoId: prestamo.prestamo_id,
        })
        .andWhere('p.es_anulado = 0')
        .getRawOne<{ sumCapital: string }>();

      const capitalAmortizado = Number(capRes?.sumCapital ?? 0);

      // 6) Capital objetivo a cancelar = monto_prestamo - capital amortizado
      let capitalPendiente =
        Number(prestamo.monto_prestamo) - capitalAmortizado;

      // Normalizar redondeo
      capitalPendiente = Number(capitalPendiente.toFixed(2));

      const tolerancia = 0.009;

      if (capitalPendiente <= tolerancia) {
        // Ya está cubierto el capital (o muy cerca)
        capitalPendiente = 0;

        throw new BadRequestException({
          status: 'error',
          message:
            'No hay capital pendiente por cancelar. El préstamo ya no requiere cancelación total.',
        });
      }

      // 7) Construir pago de cancelación total:
      //    - interés = 0
      //    - pago = capital pendiente
      const montoCapital = capitalPendiente;
      const montoInteres = 0;
      const montoPago = capitalPendiente;
      const saldoDespuesPago = 0; // cerramos

      const nuevoPago = pagoRepo.create({
        prestamo_id: prestamo.prestamo_id,
        afiliado_id: dto.afiliado_id,
        afiliacion_historial_id: afiliacionActiva.afiliacion_historial_id,
        planilla_id: null,
        numero_pago: siguienteNumero,
        fecha_pago: dto.fecha_pago as any,
        tipo_pago_prestamo_id: TipoPagoPrestamoEnum.CANCELACION_TOTAL,
        tipo_pago_legacy: null,

        monto_pago: montoPago,
        monto_capital: montoCapital,
        monto_interes: montoInteres,

        monto_gastos_operativos: 0,
        monto_gasto_adm: 0,
        monto_exceso: 0,
        monto_mora: 0,
        saldo_despues_pago: saldoDespuesPago,

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

      const pagoGuardado = await pagoRepo.save(nuevoPago);

      // 8) Actualizar préstamo como cancelado (similar al normal cuando llega a 0)
      //    Aquí: saldo pasa a 0 porque estás cerrando por capital y perdonando interés futuro.
      prestamo.monto_saldo = 0;

      // acumulados
      prestamo.monto_total_pagado =
        Number(prestamo.monto_total_pagado) + montoPago;
      prestamo.monto_pagado_capital =
        Number(prestamo.monto_pagado_capital) + montoCapital;
      prestamo.monto_pagado_interes =
        Number(prestamo.monto_pagado_interes) + montoInteres;

      // cuotas_pagadas: en cancelación total NO es una cuota normal,
      // pero si quieres reflejar que terminó el préstamo, puedes setearlo a pactadas.
      prestamo.numero_cuotas_pagadas = prestamo.numero_cuotas_pactadas;

      prestamo.fecha_ultima_amortizacion = dto.fecha_pago as any;

      prestamo.estado_prestamo_id = EstadoPrestamoEnum.CANCELADO;

      await prestamoRepo.save(prestamo);

      return pagoGuardado;
    });
  }

  async anularPago(
    pagoId: number,
    motivo: string | undefined,
    usuarioId?: number,
    ipOrigen?: string,
    userAgent?: string,
  ): Promise<Pago> {
    return this.dataSource.transaction<Pago>(async (manager) => {
      const pagoRepo = manager.getRepository(Pago);
      const prestamoRepo = manager.getRepository(Prestamo);
      const logRepo = manager.getRepository(LogEvento);

      // 1) Traer pago
      const pago = await pagoRepo.findOne({
        where: { pago_id: pagoId },
      });

      if (!pago) {
        throw new NotFoundException({
          status: 'error',
          message: 'El pago no existe.',
        });
      }

      if (pago.es_anulado) {
        throw new BadRequestException({
          status: 'error',
          message: 'El pago ya se encuentra anulado.',
        });
      }

      if (pago.tipo_pago_prestamo_id !== TipoPagoPrestamoEnum.PAGO_NORMAL) {
        throw new BadRequestException({
          status: 'error',
          message:
            'Solo se permite anular pagos normales (tipo 2) en esta versión.',
        });
      }

      // 2) Traer préstamo asociado
      const prestamo = await prestamoRepo.findOne({
        where: { prestamo_id: pago.prestamo_id },
      });

      if (!prestamo) {
        throw new NotFoundException({
          status: 'error',
          message: 'El préstamo asociado al pago no existe.',
        });
      }

      // 3) Guardamos snapshot ANTES para la auditoría
      const datosAntes = {
        prestamo_id: prestamo.prestamo_id,
        monto_saldo: prestamo.monto_saldo,
        monto_total_pagado: prestamo.monto_total_pagado,
        monto_pagado_capital: prestamo.monto_pagado_capital,
        monto_pagado_interes: prestamo.monto_pagado_interes,
        pago: {
          pago_id: pago.pago_id,
          monto_pago: pago.monto_pago,
          monto_capital: pago.monto_capital,
          monto_interes: pago.monto_interes,
          es_anulado: pago.es_anulado,
        },
      };

      // 4) Marcar pago como anulado (solo el bit)
      pago.es_anulado = true;

      // 5) Revertir agregados del préstamo
      prestamo.monto_saldo =
        Number(prestamo.monto_saldo) + Number(pago.monto_pago);
      prestamo.monto_total_pagado =
        Number(prestamo.monto_total_pagado) - Number(pago.monto_pago);
      prestamo.monto_pagado_capital =
        Number(prestamo.monto_pagado_capital) - Number(pago.monto_capital);
      prestamo.monto_pagado_interes =
        Number(prestamo.monto_pagado_interes) - Number(pago.monto_interes);

      // 👇 NUEVO: disminuir número de cuotas pagadas
      prestamo.numero_cuotas_pagadas = Math.max(
        0,
        (prestamo.numero_cuotas_pagadas ?? 0) - 1,
      );

      // 👇 NUEVO: si el préstamo estaba cancelado y el saldo vuelve a ser >0, regresarlo a Pendiente
      const tolerancia = 0.009;
      if (
        prestamo.monto_saldo > tolerancia &&
        prestamo.estado_prestamo_id === EstadoPrestamoEnum.CANCELADO
      ) {
        prestamo.estado_prestamo_id = EstadoPrestamoEnum.PENDIENTE;
      }

      await prestamoRepo.save(prestamo);
      const pagoActualizado = await pagoRepo.save(pago);

      // 6) Registrar en auditoria.log_evento
      const log = logRepo.create({
        usuario_id: usuarioId ?? null,
        categoria: 'PRESTAMOS',
        tipo_evento: 'ANULACION_PAGO_PRESTAMO',
        entidad_esquema: 'prestamos',
        entidad_tabla: 'pago',
        entidad_id: String(pago.pago_id),
        descripcion:
          motivo ??
          `Se anuló el pago ${pago.pago_id} del préstamo ${pago.prestamo_id}.`,
        datos_anteriores: JSON.stringify(datosAntes),
        datos_nuevos: JSON.stringify({
          pago_id: pagoActualizado.pago_id,
          es_anulado: pagoActualizado.es_anulado,
          prestamo: {
            prestamo_id: prestamo.prestamo_id,
            monto_saldo: prestamo.monto_saldo,
            monto_total_pagado: prestamo.monto_total_pagado,
            monto_pagado_capital: prestamo.monto_pagado_capital,
            monto_pagado_interes: prestamo.monto_pagado_interes,
          },
        }),
        es_exitoso: true,
        ip_origen: ipOrigen ?? null,
        user_agent: userAgent ?? null,
      });

      await logRepo.save(log);

      return pagoActualizado;
    });
  }
}
