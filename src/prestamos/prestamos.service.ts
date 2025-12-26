import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Like, Repository } from 'typeorm';
import { Prestamo } from './entities/prestamo.entity';
import { CrearPrestamoDto } from './dto/crear-prestamo.dto';
import { Afiliado } from '../afiliados/entities/afiliado.entity';
import { TipoPrestamo } from './entities/tipo-prestamo.entity';
import {
  EstadoCancelacionEnum,
  EstadoPrestamoEnum,
  TipoPagoPrestamoEnum,
  TipoPrestamoEnum,
} from './prestamos.constants';
import { AfiliacionHistorial } from 'src/afiliados/entities/afiliacion-historial.entity';
import { Pago } from './entities/pago.entity';
import { PrestamoListItemDto } from './dto/prestamo-list-item.dto';
import { ListarPagosPrestamoQueryDto } from './dto/listar-pagos-prestamo-query.dto';
import { ListarPrestamosAfiliadoQueryDto } from './dto/listar-prestamos-afiliado-query.dto';
import { PagoListItemDto } from './dto/pago-list-item.dto';
import { PrestamoHistorialItemDto } from './dto/prestamo-historial-item.dto';
import { toYmd } from 'src/common/utils/date.util';

@Injectable()
export class PrestamosService {
  constructor(
    private readonly dataSource: DataSource,

    @InjectRepository(Prestamo)
    private readonly prestamoRepo: Repository<Prestamo>,

    @InjectRepository(Pago)
    private readonly pagoRepo: Repository<Pago>,

    @InjectRepository(Afiliado)
    private readonly afiliadoRepo: Repository<Afiliado>,

    @InjectRepository(AfiliacionHistorial)
    private readonly historialRepo: Repository<AfiliacionHistorial>,

    @InjectRepository(TipoPrestamo)
    private readonly tipoPrestamoRepo: Repository<TipoPrestamo>,
  ) {}

  async crear(dto: CrearPrestamoDto): Promise<Prestamo> {
    return this.dataSource.transaction<Prestamo>(async (manager) => {
      const afiliadoRepo = manager.getRepository(Afiliado);
      const historialRepo = manager.getRepository(AfiliacionHistorial);
      const prestamoRepo = manager.getRepository(Prestamo);
      const tipoPrestamoRepo = manager.getRepository(TipoPrestamo);
      const pagoRepo = manager.getRepository(Pago);

      // 1) Validar afiliado
      const afiliado = await afiliadoRepo.findOne({
        where: { afiliado_id: dto.afiliado_id },
      });

      if (!afiliado) {
        throw new NotFoundException({
          status: 'error',
          message: 'El afiliado no existe.',
        });
      }

      if (!afiliado.estado) {
        throw new BadRequestException({
          status: 'error',
          message: 'El afiliado no está ACTIVO y no puede registrar préstamos.',
        });
      }

      // 2) Historial de afiliación ACTIVO
      const historialActivo = await historialRepo.findOne({
        where: {
          afiliado_id: afiliado.afiliado_id,
          es_activo: true,
        },
      });

      if (!historialActivo) {
        throw new BadRequestException({
          status: 'error',
          message:
            'No existe historial de afiliación activo para este afiliado.',
        });
      }

      // 3) Validar tipo de préstamo y tasa
      const tipoPrestamo = await tipoPrestamoRepo.findOne({
        where: { tipo_prestamo_id: dto.tipo_prestamo_id },
      });

      if (!tipoPrestamo) {
        throw new NotFoundException({
          status: 'error',
          message: 'El tipo de préstamo no existe.',
        });
      }

      const tasaCatalogo = Number(tipoPrestamo.tasa_interes_mensual);
      const tasaDto = Number(dto.tasa_interes_mensual);

      if (Number(tasaCatalogo.toFixed(2)) !== Number(tasaDto.toFixed(2))) {
        throw new BadRequestException({
          status: 'error',
          message:
            'La tasa de interés mensual no coincide con la del tipo de préstamo.',
        });
      }

      // 4) CORRELATIVO numero_prestamo POR AFILIADO
      const ultimoPrestamo = await prestamoRepo
        .createQueryBuilder('p')
        .where('p.afiliado_id = :id', { id: afiliado.afiliado_id })
        .orderBy('p.numero_prestamo', 'DESC')
        .getOne();

      const siguienteNumeroPrestamo =
        (ultimoPrestamo?.numero_prestamo ?? 0) + 1;

      // 5) Si es REENGANCHE, cerrar préstamo origen
      let capitalPendienteReenganche = 0;

      if (dto.tipo_prestamo_id === TipoPrestamoEnum.REENGANCHE) {
        // 5.1) Validar que venga préstamo origen
        if (!dto.prestamo_origen_id) {
          throw new BadRequestException({
            status: 'error',
            message:
              'Debe enviar "prestamo_origen_id" para registrar un préstamo de reenganche.',
          });
        }

        const prestamoOrigen = await prestamoRepo.findOne({
          where: { prestamo_id: dto.prestamo_origen_id },
        });

        if (!prestamoOrigen) {
          throw new NotFoundException({
            status: 'error',
            message: 'El préstamo a reenganchar no existe.',
          });
        }

        // Debe ser del mismo afiliado
        if (prestamoOrigen.afiliado_id !== afiliado.afiliado_id) {
          throw new BadRequestException({
            status: 'error',
            message: 'El préstamo a reenganchar pertenece a otro afiliado.',
          });
        }

        // Debe estar PENDIENTE
        if (
          prestamoOrigen.estado_prestamo_id !== EstadoPrestamoEnum.PENDIENTE
        ) {
          throw new BadRequestException({
            status: 'error',
            message:
              'Solo se puede reenganchar un préstamo que esté PENDIENTE.',
          });
        }

        // ✅ 5.2bis) Validar mínimo de amortizaciones (pagos no anulados)
        const MIN_PAGOS_PARA_REENGANCHE = 4;

        const pagosValidosCount = await pagoRepo
          .createQueryBuilder('pg')
          .where('pg.prestamo_id = :prestamoId', {
            prestamoId: prestamoOrigen.prestamo_id,
          })
          .andWhere('pg.es_anulado = 0')
          // si quieres contar SOLO pagos normales (cuotas):
          // .andWhere('pg.tipo_pago_prestamo_id = :tipo', { tipo: TipoPagoPrestamoEnum.PAGO_NORMAL })
          .getCount();

        if (pagosValidosCount < MIN_PAGOS_PARA_REENGANCHE) {
          throw new BadRequestException({
            status: 'error',
            message: `No se puede reenganchar: el préstamo origen debe tener al menos ${MIN_PAGOS_PARA_REENGANCHE} amortizaciones/pagos registrados.`,
          });
        }

        // 5.2) Calcular capital pendiente (sin tomar en cuenta interés)
        capitalPendienteReenganche =
          Number(prestamoOrigen.monto_prestamo) -
          Number(prestamoOrigen.monto_pagado_capital ?? 0);

        capitalPendienteReenganche = Number(
          capitalPendienteReenganche.toFixed(2),
        );

        if (capitalPendienteReenganche <= 0) {
          throw new BadRequestException({
            status: 'error',
            message:
              'El préstamo origen no tiene capital pendiente para reenganchar.',
          });
        }

        // 5.3) Validar que el nuevo préstamo cubra al menos ese capital
        if (dto.monto_prestamo < capitalPendienteReenganche) {
          throw new BadRequestException({
            status: 'error',
            message:
              'El monto del nuevo préstamo de reenganche no cubre el capital pendiente del préstamo origen.',
          });
        }

        // 5.4) Validar (opcional, pero recomendable) monto_girado_banco
        const montoPrestamoNuevo = Number(dto.monto_prestamo);
        const porcentajeSeguro = Number(dto.porcentaje_seguro); // 1.00 = 1%
        const montoSeguroCalculado = Number(
          ((montoPrestamoNuevo * porcentajeSeguro) / 100).toFixed(2),
        );

        const montoSegEnviado = Number(dto.monto_seguro);

        if (
          Number(montoSeguroCalculado.toFixed(2)) !==
          Number(montoSegEnviado.toFixed(2))
        ) {
          throw new BadRequestException({
            status: 'error',
            message:
              'El monto de seguro no coincide con el porcentaje de seguro y el monto del préstamo.',
          });
        }

        // Netos: lo que realmente se gira por banco = nuevo préstamo - seguro - capital pendiente
        const montoGiradoEsperado = Number(
          (
            montoPrestamoNuevo -
            montoSeguroCalculado -
            capitalPendienteReenganche
          ).toFixed(2),
        );

        if (
          Number(montoGiradoEsperado.toFixed(2)) !==
          Number(Number(dto.monto_girado_banco).toFixed(2))
        ) {
          throw new BadRequestException({
            status: 'error',
            message:
              'El monto girado por banco no es consistente con el monto del préstamo, seguro y capital pendiente del préstamo origen.',
          });
        }

        // 5.5) Cerrar préstamo origen (estado, montos)
        // Buscar el correlativo de número de pago
        const rawMax = await pagoRepo
          .createQueryBuilder('p')
          .select('MAX(p.numero_pago)', 'maxNumero')
          .where('p.prestamo_id = :prestamoId', {
            prestamoId: prestamoOrigen.prestamo_id,
          })
          .andWhere('p.es_anulado = 0')
          .getRawOne<{ maxNumero: number | null }>();

        const maxNumero = rawMax?.maxNumero ?? 0;
        const siguienteNumeroPago = maxNumero + 1;

        // Crear el pago de reenganche (solo capital)
        const pagoReenganche = pagoRepo.create({
          prestamo_id: prestamoOrigen.prestamo_id,
          afiliado_id: afiliado.afiliado_id,
          afiliacion_historial_id: historialActivo.afiliacion_historial_id,
          planilla_id: null,
          numero_pago: siguienteNumeroPago,
          fecha_pago: new Date(dto.fecha_prestamo), // 👈 datetime2 => Date, sin any
          tipo_pago_prestamo_id: TipoPagoPrestamoEnum.REENGANCHE, // 👈 mismo enum que usas en PagosService
          tipo_pago_legacy: null,

          monto_pago: capitalPendienteReenganche,
          monto_capital: capitalPendienteReenganche,
          monto_interes: 0,
          monto_gastos_operativos: 0,
          monto_gasto_adm: 0,
          monto_exceso: 0,
          monto_mora: 0,
          saldo_despues_pago: 0,

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

        await pagoRepo.save(pagoReenganche);

        // Actualizar préstamo origen
        prestamoOrigen.estado_prestamo_id = EstadoPrestamoEnum.CANCELADO;
        prestamoOrigen.estado_cancelacion_id = EstadoCancelacionEnum.REENGANCHE;
        prestamoOrigen.monto_saldo = 0;
        prestamoOrigen.monto_total_pagado = Number(
          (
            Number(prestamoOrigen.monto_total_pagado ?? 0) +
            capitalPendienteReenganche
          ).toFixed(2),
        );
        prestamoOrigen.monto_pagado_capital = Number(
          (
            Number(prestamoOrigen.monto_pagado_capital ?? 0) +
            capitalPendienteReenganche
          ).toFixed(2),
        );
        // Interés no cambia
        prestamoOrigen.numero_cuotas_pagadas =
          (prestamoOrigen.numero_cuotas_pagadas ?? 0) + 1;
        prestamoOrigen.fecha_ultima_amortizacion = dto.fecha_prestamo as any;

        await prestamoRepo.save(prestamoOrigen);
      }

      // 6) CÁLCULOS DEL NUEVO PRÉSTAMO (igual para normal / reenganche)
      const montoPrestamo = Number(dto.monto_prestamo); // ej. 4000
      const cuotas = dto.numero_cuotas_pactadas; // ej. 6
      const tasaMensual = tasaDto; // ej. 0.5 ó 1 (porcentaje)

      // Interés por cuota (redondeado)
      const montoInteresCuota = Number(
        ((montoPrestamo * tasaMensual) / 100).toFixed(2),
      );

      // Interés total del préstamo
      const interesTotal = Number((montoInteresCuota * cuotas).toFixed(2));

      // Deuda total real = capital + interés total
      const montoDeudaTotal = Number((montoPrestamo + interesTotal).toFixed(2));

      // Cuota mensual referencial
      const cuotaMensual = Number((montoDeudaTotal / cuotas).toFixed(2));

      const montoGastoAdmCuota = 0;

      // Capital por cuota referencial
      const montoCapitalCuota = Number(
        (cuotaMensual - montoInteresCuota - montoGastoAdmCuota).toFixed(2),
      );

      const montoSaldoInicial = montoDeudaTotal;

      // 7) CREAR NUEVO PRÉSTAMO (normal o reenganche)
      const prestamoNuevo = prestamoRepo.create({
        afiliado_id: afiliado.afiliado_id,
        afiliacion_historial_id: historialActivo.afiliacion_historial_id,
        tipo_prestamo_id: tipoPrestamo.tipo_prestamo_id,

        estado_prestamo_id: EstadoPrestamoEnum.PENDIENTE,
        estado_cancelacion_id: null,
        estado_itf_id: 2, // No aplica ITF (como tenías)

        numero_prestamo: siguienteNumeroPrestamo,
        fecha_prestamo: dto.fecha_prestamo as any,
        tasa_interes_mensual: tasaMensual,

        numero_cuotas_pactadas: cuotas,
        numero_cuotas_pagadas: 0,

        monto_prestamo: montoPrestamo,
        cuota_mensual: cuotaMensual,
        monto_saldo: montoSaldoInicial,
        monto_total_pagado: 0,

        monto_capital_cuota: montoCapitalCuota,
        monto_interes_cuota: montoInteresCuota,
        monto_gasto_adm_cuota: montoGastoAdmCuota,

        monto_pagado_capital: 0,
        monto_pagado_interes: 0,
        monto_pagado_gasto_adm: 0,

        monto_extra_capital: 0,
        monto_extra_interes: 0,
        monto_extra_gasto_adm: 0,

        monto_exonerado: 0,
        monto_interes_mora: 0,
        gasto_adm_configurado: 0,

        porcentaje_seguro: dto.porcentaje_seguro,
        monto_seguro: dto.monto_seguro,

        monto_deuda_total: montoDeudaTotal,
        monto_girado_banco: dto.monto_girado_banco,
        monto_gastos_operativos: 0,

        fecha_ultima_amortizacion: null,

        observacion_prestamo: dto.observacion_prestamo ?? null,
      });

      return await prestamoRepo.save(prestamoNuevo);
    });
  }

  // ============================================================
  // 🟥 ANULAR PRÉSTAMO (NO DELETE)
  // ============================================================
  async anular(prestamoId: number, motivo?: string): Promise<Prestamo> {
    const prestamo = await this.prestamoRepo.findOne({
      where: { prestamo_id: prestamoId },
    });

    if (!prestamo) {
      throw new NotFoundException({
        status: 'error',
        message: 'El préstamo no existe.',
      });
    }

    // ⚠️ Si ya está anulado, no repetir
    if (prestamo.estado_prestamo_id === EstadoPrestamoEnum.ANULADO) {
      throw new BadRequestException({
        status: 'error',
        message: 'El préstamo ya está anulado.',
      });
    }

    // ✅ Validar que NO existan pagos (amortizaciones) asociados
    const tienePagos = await this.pagoRepo.exist({
      where: { prestamo_id: prestamoId },
    });

    if (tienePagos) {
      throw new BadRequestException({
        status: 'error',
        message:
          'No se puede anular un préstamo que ya tiene pagos (amortizaciones) registrados.',
      });
    }

    prestamo.estado_prestamo_id = EstadoPrestamoEnum.ANULADO;

    if (motivo) {
      prestamo.observacion_prestamo = motivo;
    }

    return this.prestamoRepo.save(prestamo);
  }

  async listarPaginado(params: {
    page: number;
    limit: number;
    search?: string;
    fecha_desde?: string;
    fecha_hasta?: string;
    departamento_id?: number;
    base_id?: number;
    tipo_prestamo_id?: number;
    estado_prestamo_id?: number;
  }): Promise<{ items: PrestamoListItemDto[]; total: number }> {
    const {
      page,
      limit,
      search,
      fecha_desde,
      fecha_hasta,
      departamento_id,
      base_id,
      tipo_prestamo_id,
      estado_prestamo_id,
    } = params;

    const skip = (page - 1) * limit;

    const qb = this.prestamoRepo
      .createQueryBuilder('p')
      .innerJoin('p.afiliado', 'a')
      .leftJoin('a.departamento', 'dep')
      .leftJoin('a.base', 'b')
      .innerJoin('p.tipo_prestamo', 'tp')
      .innerJoin('p.estado_prestamo', 'ep')
      .select([
        'p.prestamo_id AS prestamo_id',
        'a.codigo_trabajador AS codigo_trabajador',
        `CONCAT(a.ap_paterno, ' ', a.ap_materno, ' ', a.nombres) AS nombre_completo`,
        `LTRIM(RTRIM(
  CONCAT(
    ISNULL(dep.nombre, ''),
    CASE WHEN dep.nombre IS NOT NULL AND b.nombre IS NOT NULL THEN ' / ' ELSE '' END,
    ISNULL(b.nombre, '')
  )
)) AS departamento_base`,
        'p.numero_prestamo AS numero_prestamo',
        'tp.descripcion AS tipo_prestamo',
        'CONVERT(varchar(10), p.fecha_prestamo, 23) AS fecha_prestamo',
        'p.monto_seguro AS monto_seguro',
        'p.monto_girado_banco AS monto_girado_banco',
        'p.monto_prestamo AS monto_prestamo',
        'p.tasa_interes_mensual AS interes_mensual',
        'ep.descripcion AS estado_prestamo',
        'p.numero_cuotas_pactadas AS numero_cuotas_pactadas',
        'p.monto_total_pagado AS monto_pagado',
        'p.monto_saldo AS monto_adeuda',
      ]);

    // ---- filtros por préstamo
    if (tipo_prestamo_id) {
      qb.andWhere('p.tipo_prestamo_id = :tipo', { tipo: tipo_prestamo_id });
    }

    if (estado_prestamo_id) {
      qb.andWhere('p.estado_prestamo_id = :estado', {
        estado: estado_prestamo_id,
      });
    }

    // fechas
    if (fecha_desde) {
      qb.andWhere('p.fecha_prestamo >= :desde', { desde: fecha_desde });
    }

    if (fecha_hasta) {
      qb.andWhere('p.fecha_prestamo <= :hasta', { hasta: fecha_hasta });
    }

    // ---- filtros por afiliado
    if (departamento_id) {
      qb.andWhere('a.departamento_id = :depId', { depId: departamento_id });
    }

    if (base_id) {
      qb.andWhere('a.base_id = :baseId', { baseId: base_id });
    }

    // búsqueda texto (como “filtrar afiliados y traer sus préstamos”)
    if (search && search.trim() !== '') {
      const term = `%${search.trim()}%`;

      qb.andWhere(
        `(a.codigo_trabajador LIKE :term
          OR a.doc_identidad LIKE :term
          OR a.ap_paterno LIKE :term
          OR a.ap_materno LIKE :term
          OR a.nombres LIKE :term
          OR CONCAT(a.ap_paterno, ' ', a.ap_materno, ' ', a.nombres) LIKE :term)`,
        { term },
      );
    }

    // orden: últimos primero (puedes cambiar)
    qb.orderBy('p.fecha_prestamo', 'DESC')
      .addOrderBy('p.numero_prestamo', 'DESC')
      .offset(skip)
      .limit(limit);

    // count total (sin paginado)
    const totalQb = qb.clone();
    totalQb
      .offset(undefined as any)
      .limit(undefined as any)
      .orderBy(); // limpia order by para count

    const total = await totalQb.getCount();

    const rows = await qb.getRawMany<PrestamoListItemDto>();

    // asegurar tipos numéricos (SQL Server a veces retorna string en decimals)
    const items = rows.map((r) => ({
      ...r,
      prestamo_id: Number(r.prestamo_id),
      numero_prestamo: Number(r.numero_prestamo),
      monto_seguro: Number(r.monto_seguro),
      monto_girado_banco: Number(r.monto_girado_banco),
      monto_prestamo: Number(r.monto_prestamo),
      interes_mensual: Number(r.interes_mensual),
      numero_cuotas_pactadas: Number(r.numero_cuotas_pactadas),
      monto_pagado: Number(r.monto_pagado),
      monto_adeuda: Number(r.monto_adeuda),
    }));

    return { items, total };
  }

  async listarTipoPrestamoPaginado(params: {
    page: number;
    limit: number;
    search?: string;
  }): Promise<{ items: TipoPrestamo[]; total: number }> {
    const { page, limit, search } = params;
    const skip = (page - 1) * limit;

    const where =
      search && search.trim()
        ? [
            { codigo: Like(`%${search.trim()}%`) },
            { descripcion: Like(`%${search.trim()}%`) },
          ]
        : undefined;

    const [items, total] = await this.tipoPrestamoRepo.findAndCount({
      where,
      skip,
      take: limit,
      order: { tipo_prestamo_id: 'ASC' },
    });

    return { items, total };
  }

  // ============================================================
  // (A) Resumen afiliado + deuda activa total + desglose por tipo
  // ============================================================
  // (A) Resumen afiliado + deuda activa total + desglose por tipo (SIEMPRE TODOS LOS TIPOS)
  async resumenPrestamosPorAfiliado(afiliadoId: number) {
    const afiliado = await this.afiliadoRepo.findOne({
      where: { afiliado_id: afiliadoId },
      relations: ['departamento', 'base'],
    });

    if (!afiliado) {
      throw new NotFoundException({
        status: 'error',
        message: 'El afiliado no existe.',
      });
    }

    const nombreCompleto =
      `${afiliado.ap_paterno} ${afiliado.ap_materno} ${afiliado.nombres}`.trim();

    const departamentoBase = `${afiliado.departamento?.nombre ?? ''}${
      afiliado.base?.nombre ? ` / ${afiliado.base.nombre}` : ''
    }`.trim();

    // Fecha de afiliación + estado de afiliación (desde historial activo)
    const historialActivo = await this.historialRepo.findOne({
      where: { afiliado_id: afiliadoId, es_activo: true },
      order: { fecha_inicio: 'DESC' },
    });

    const fechaAfiliacion =
      historialActivo?.fecha_inicio ?? afiliado.fecha_ingreso;

    // Años de aporte (aprox, por fechaAfiliacion)
    const hoy = new Date();
    const f = new Date(fechaAfiliacion as any);
    const aniosAporte = Math.max(
      0,
      Math.floor(
        (hoy.getTime() - f.getTime()) / (1000 * 60 * 60 * 24 * 365.25),
      ),
    );

    // 1) Traer TODOS los tipos de préstamo (para que siempre vengan en el response)
    const tiposPrestamo = await this.tipoPrestamoRepo.find({
      order: { tipo_prestamo_id: 'ASC' },
    });

    // 2) Resumen real de préstamos activos: agrupar por tipo_prestamo_id (solo PENDIENTE)
    const rows = await this.prestamoRepo
      .createQueryBuilder('p')
      .select('p.tipo_prestamo_id', 'tipo_prestamo_id')
      .addSelect('COUNT(1)', 'cantidad')
      .addSelect('SUM(p.monto_saldo)', 'monto_saldo')
      .where('p.afiliado_id = :afiliadoId', { afiliadoId })
      .andWhere('p.estado_prestamo_id = :estado', {
        estado: EstadoPrestamoEnum.PENDIENTE,
      })
      .groupBy('p.tipo_prestamo_id')
      .getRawMany<{
        tipo_prestamo_id: string;
        cantidad: string;
        monto_saldo: string;
      }>();

    // 3) Map para cruzar tipos vs resumen real
    const resumenPorTipoMap = new Map<
      number,
      { cantidad: number; monto_saldo: number }
    >();

    for (const r of rows) {
      resumenPorTipoMap.set(Number(r.tipo_prestamo_id), {
        cantidad: Number(r.cantidad),
        monto_saldo: Number(Number(r.monto_saldo ?? 0).toFixed(2)),
      });
    }

    // 4) Construir por_tipo SIEMPRE con todos los tipos (cero si no existe)
    const porTipo = tiposPrestamo.map((tp) => {
      const resumen = resumenPorTipoMap.get(tp.tipo_prestamo_id);

      return {
        tipo_prestamo_id: tp.tipo_prestamo_id,
        tipo_prestamo: {
          tipo_prestamo_id: tp.tipo_prestamo_id,
          codigo: tp.codigo,
          descripcion: tp.descripcion,
          // en tu entity decimal viene como string
          tasa_interes_mensual: Number(tp.tasa_interes_mensual),
        },
        cantidad: resumen?.cantidad ?? 0,
        monto_saldo: resumen?.monto_saldo ?? 0.0,
      };
    });

    // 5) Deuda total (sumando lo devuelto)
    const deudaTotal = Number(
      porTipo.reduce((acc, x) => acc + Number(x.monto_saldo), 0).toFixed(2),
    );

    return {
      afiliado: {
        afiliado_id: afiliado.afiliado_id,
        codigo_trabajador: afiliado.codigo_trabajador,
        nombre_completo: nombreCompleto,
        departamento_base: departamentoBase,
        fecha_afiliacion: String(fechaAfiliacion),
        anios_aporte: aniosAporte,
        estado_afiliacion: afiliado.estado,
      },
      prestamos_activos: {
        deuda_total: deudaTotal,
        por_tipo: porTipo,
      },
    };
  }

  // ============================================================
  // (B) Historial de préstamos del afiliado (PAGINADO)
  // ============================================================
  async listarPrestamosDeAfiliadoPaginado(
    afiliadoId: number,
    query: ListarPrestamosAfiliadoQueryDto,
  ): Promise<{ items: PrestamoHistorialItemDto[]; total: number }> {
    const existe = await this.afiliadoRepo.exist({
      where: { afiliado_id: afiliadoId },
    });
    if (!existe) {
      throw new NotFoundException({
        status: 'error',
        message: 'El afiliado no existe.',
      });
    }

    const page = Number(query.page ?? 1);
    const limit = Number(query.limit ?? 10);
    const safePage = Number.isFinite(page) && page > 0 ? page : 1;
    const safeLimit = Number.isFinite(limit) && limit > 0 ? limit : 10;
    const skip = (safePage - 1) * safeLimit;

    const qb = this.prestamoRepo
      .createQueryBuilder('p')
      .leftJoinAndSelect('p.tipo_prestamo', 'tp')
      .leftJoinAndSelect('p.estado_prestamo', 'ep')
      .leftJoinAndSelect('p.estado_cancelacion', 'ec')
      .leftJoinAndSelect('p.estado_itf', 'itf')
      .where('p.afiliado_id = :afiliadoId', { afiliadoId });

    if (query.tipo_prestamo_id)
      qb.andWhere('p.tipo_prestamo_id = :tipo', {
        tipo: query.tipo_prestamo_id,
      });
    if (query.estado_prestamo_id)
      qb.andWhere('p.estado_prestamo_id = :estado', {
        estado: query.estado_prestamo_id,
      });
    if (query.fecha_desde)
      qb.andWhere('p.fecha_prestamo >= :desde', { desde: query.fecha_desde });
    if (query.fecha_hasta)
      qb.andWhere('p.fecha_prestamo <= :hasta', { hasta: query.fecha_hasta });

    qb.orderBy('p.fecha_prestamo', 'DESC').addOrderBy(
      'p.numero_prestamo',
      'DESC',
    );
    qb.skip(skip).take(safeLimit);

    const [prestamos, total] = await qb.getManyAndCount();

    const items: PrestamoHistorialItemDto[] = prestamos.map((p) => ({
      prestamo_id: p.prestamo_id,

      estado_prestamo_id: p.estado_prestamo_id,
      estado_prestamo: p.estado_prestamo,

      numero_prestamo: p.numero_prestamo,
      fecha_prestamo: String(p.fecha_prestamo),

      tipo_prestamo_id: p.tipo_prestamo_id,
      tipo_prestamo: p.tipo_prestamo,

      tasa_interes_mensual: Number(p.tasa_interes_mensual),

      numero_cuotas_pactadas: p.numero_cuotas_pactadas,
      numero_cuotas_pagadas: p.numero_cuotas_pagadas,

      monto_prestamo: Number(p.monto_prestamo),
      cuota_mensual: Number(p.cuota_mensual),

      monto_adeuda: Number(p.monto_saldo),
      monto_pagado: Number(p.monto_total_pagado),

      estado_cancelacion_id: p.estado_cancelacion_id,
      estado_cancelacion: p.estado_cancelacion ?? null,

      monto_gastos_operativos: Number(p.monto_gastos_operativos),

      estado_itf_id: p.estado_itf_id,
      estado_itf: p.estado_itf ?? null,

      monto_capital_cuota: Number(p.monto_capital_cuota),
      monto_interes_cuota: Number(p.monto_interes_cuota),
      monto_gasto_adm_cuota: Number(p.monto_gasto_adm_cuota),

      monto_exonerado: Number(p.monto_exonerado),
      monto_interes_mora: Number(p.monto_interes_mora),
    }));

    return { items, total };
  }

  // ============================================================
  // (C) Pagos/Amortizaciones por préstamo (PAGINADO)
  // ============================================================
  async listarPagosDePrestamoPaginado(
    prestamoId: number,
    query: ListarPagosPrestamoQueryDto,
  ): Promise<{ items: PagoListItemDto[]; total: number }> {
    const prestamoExiste = await this.prestamoRepo.exist({
      where: { prestamo_id: prestamoId },
    });
    if (!prestamoExiste) {
      throw new NotFoundException({
        status: 'error',
        message: 'El préstamo no existe.',
      });
    }

    const page = Number(query.page ?? 1);
    const limit = Number(query.limit ?? 10);
    const safePage = Number.isFinite(page) && page > 0 ? page : 1;
    const safeLimit = Number.isFinite(limit) && limit > 0 ? limit : 10;
    const skip = (safePage - 1) * safeLimit;

    const qb = this.pagoRepo
      .createQueryBuilder('pg')
      .leftJoinAndSelect('pg.planilla', 'pl')
      .leftJoinAndSelect('pg.tipo_pago_prestamo', 'tpp')
      .where('pg.prestamo_id = :prestamoId', { prestamoId })
      .andWhere('pg.es_anulado = 0');

    if (query.tipo_pago_prestamo_id) {
      qb.andWhere('pg.tipo_pago_prestamo_id = :tipo', {
        tipo: query.tipo_pago_prestamo_id,
      });
    }

    // Para datetime2, filtrar por DATE (ignorar hora) con SQL Server:
    if (query.fecha_desde) {
      qb.andWhere('CONVERT(date, pg.fecha_pago) >= :desde', {
        desde: query.fecha_desde,
      });
    }
    if (query.fecha_hasta) {
      qb.andWhere('CONVERT(date, pg.fecha_pago) <= :hasta', {
        hasta: query.fecha_hasta,
      });
    }

    qb.orderBy('pg.numero_pago', 'ASC').skip(skip).take(safeLimit);

    const [pagos, total] = await qb.getManyAndCount();

    const items: PagoListItemDto[] = pagos.map((pg) => ({
      pago_id: pg.pago_id,

      numero_pago: pg.numero_pago,
      fecha_pago: toYmd(pg.fecha_pago),

      tipo_pago_prestamo_id: pg.tipo_pago_prestamo_id,
      tipo_pago_prestamo: pg.tipo_pago_prestamo
        ? {
            tipo_pago_prestamo_id: pg.tipo_pago_prestamo.tipo_pago_prestamo_id,
            codigo: pg.tipo_pago_prestamo.codigo,
            descripcion: pg.tipo_pago_prestamo.descripcion,
          }
        : null,

      monto: Number(pg.monto_pago),
      capital: Number(pg.monto_capital),
      interes: Number(pg.monto_interes),

      monto_gastos_operativos: Number(pg.monto_gastos_operativos),
      monto_gasto_adm: Number(pg.monto_gasto_adm),
      monto_exceso: Number(pg.monto_exceso),
      monto_mora: Number(pg.monto_mora),

      saldo_despues_pago: Number(pg.saldo_despues_pago),

      planilla_id: pg.planilla_id ?? null,
      planilla: pg.planilla
        ? {
            planilla_id: pg.planilla.planilla_id,
            codigo: pg.planilla.codigo,
            anio: pg.planilla.anio,
            mes: pg.planilla.mes,
            tipo: pg.planilla.tipo,
          }
        : null,
    }));

    return { items, total };
  }

  async obtenerInfoPrestamoModal(prestamoId: number): Promise<{
    solicitante: {
      codigo_trabajador: string;
      nombre_completo: string;
      estado: 'ACTIVO' | 'INACTIVO';
      departamento_base: string;
      fecha_afiliacion: string | null;
    };
    montos_cuota: {
      cuota_mensual: number;
      monto_capital_cuota: number;
      monto_interes_cuota: number;
      monto_gastos_operativos: number;
      monto_gasto_adm_cuota: number;
    };
    detalle_prestamo: {
      fecha_prestamo: string;
      tipo_prestamo_id: number;
      tipo_prestamo: any;
      interes_mensual: number;

      monto_prestamo: number;
      numero_cuotas_pactadas: number;

      monto_gastos_operativos: number;
      monto_gasto_adm_cuota: number;

      monto_girado_banco: number;
      porcentaje_seguro: number;
      monto_seguro: number;
    };
    kpis_amortizaciones: {
      monto_prestado: number;
      deuda_total: number;
      monto_girado_banco: number;
    };
    acumulados_amortizados: {
      monto_amortizado_total: number;
      capital_total: number;
      interes_total: number;
      gastos_adm_total: number;
      exceso_total: number;
      mora_total: number;
    };
  }> {
    // 1) Traer préstamo + relaciones necesarias
    const prestamo = await this.prestamoRepo.findOne({
      where: { prestamo_id: prestamoId },
      relations: [
        'tipo_prestamo',
        'afiliado',
        'afiliado.departamento',
        'afiliado.base',
      ],
    });

    if (!prestamo) {
      throw new NotFoundException({
        status: 'error',
        message: 'El préstamo no existe.',
      });
    }

    const a = prestamo.afiliado;

    // 2) Fecha de afiliación: uso afiliado.fecha_ingreso (más estable)
    const fechaAfiliacion = a?.fecha_ingreso ? toYmd(a.fecha_ingreso) : null;

    const departamentoBase = `${a?.departamento?.nombre ?? ''}${
      a?.departamento?.nombre && a?.base?.nombre ? ' / ' : ''
    }${a?.base?.nombre ?? ''}`.trim();

    const nombreCompleto =
      `${a.ap_paterno} ${a.ap_materno} ${a.nombres}`.trim();

    // 3) Acumulados amortizados (sumatoria de pagos NO anulados)
    const sums = await this.pagoRepo
      .createQueryBuilder('pg')
      .select('COALESCE(SUM(pg.monto_pago), 0)', 'monto_amortizado_total')
      .addSelect('COALESCE(SUM(pg.monto_capital), 0)', 'capital_total')
      .addSelect('COALESCE(SUM(pg.monto_interes), 0)', 'interes_total')
      .addSelect('COALESCE(SUM(pg.monto_gasto_adm), 0)', 'gastos_adm_total')
      .addSelect('COALESCE(SUM(pg.monto_exceso), 0)', 'exceso_total')
      .addSelect('COALESCE(SUM(pg.monto_mora), 0)', 'mora_total')
      .where('pg.prestamo_id = :prestamoId', { prestamoId })
      .andWhere('pg.es_anulado = 0')
      .getRawOne<{
        monto_amortizado_total: string;
        capital_total: string;
        interes_total: string;
        gastos_adm_total: string;
        exceso_total: string;
        mora_total: string;
      }>();

    return {
      solicitante: {
        codigo_trabajador: a.codigo_trabajador,
        nombre_completo: nombreCompleto,
        estado: a.estado ? 'ACTIVO' : 'INACTIVO',
        departamento_base: departamentoBase,
        fecha_afiliacion: fechaAfiliacion,
      },

      montos_cuota: {
        cuota_mensual: Number(prestamo.cuota_mensual),
        monto_capital_cuota: Number(prestamo.monto_capital_cuota),
        monto_interes_cuota: Number(prestamo.monto_interes_cuota),

        // En tu modelo: monto_gastos_operativos es del préstamo
        monto_gastos_operativos: Number(prestamo.monto_gastos_operativos),

        // gasto admin por cuota configurado en préstamo
        monto_gasto_adm_cuota: Number(prestamo.monto_gasto_adm_cuota),
      },

      detalle_prestamo: {
        fecha_prestamo: toYmd(prestamo.fecha_prestamo)!,

        tipo_prestamo_id: prestamo.tipo_prestamo_id,
        tipo_prestamo: prestamo.tipo_prestamo,

        interes_mensual: Number(prestamo.tasa_interes_mensual),

        monto_prestamo: Number(prestamo.monto_prestamo),
        numero_cuotas_pactadas: prestamo.numero_cuotas_pactadas,

        monto_gastos_operativos: Number(prestamo.monto_gastos_operativos),
        monto_gasto_adm_cuota: Number(prestamo.monto_gasto_adm_cuota),

        monto_girado_banco: Number(prestamo.monto_girado_banco),
        porcentaje_seguro: Number(prestamo.porcentaje_seguro),
        monto_seguro: Number(prestamo.monto_seguro),
      },

      kpis_amortizaciones: {
        monto_prestado: Number(prestamo.monto_prestamo),
        deuda_total: Number(prestamo.monto_saldo), // va bajando con pagos
        monto_girado_banco: Number(prestamo.monto_girado_banco),
      },

      acumulados_amortizados: {
        monto_amortizado_total: Number(sums?.monto_amortizado_total ?? 0),
        capital_total: Number(sums?.capital_total ?? 0),
        interes_total: Number(sums?.interes_total ?? 0),
        gastos_adm_total: Number(sums?.gastos_adm_total ?? 0),
        exceso_total: Number(sums?.exceso_total ?? 0),
        mora_total: Number(sums?.mora_total ?? 0),
      },
    };
  }
}
