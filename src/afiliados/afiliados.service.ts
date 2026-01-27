import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Afiliado } from './entities/afiliado.entity';
import { UsuarioService } from 'src/seguridad/usuario.service';
import { GuardarAfiliadoDto } from './dto/crear-afiliado.dto';
import { Repository, Like, FindOptionsWhere, DataSource, Not } from 'typeorm';
import { AfiliadoCuentaBancaria } from './entities/afiliado-cuenta-bancaria.entity';
import { AfiliadoSobreBeneficiario } from './entities/afiliado-sobre-beneficiario.entity';
import { AfiliacionHistorial } from './entities/afiliacion-historial.entity';
import { RetirarAfiliadoDto } from './dto/retirar-afiliado.dto';
import { ModoAportes } from 'src/aportes/types/aportes.types';
import { Aporte } from 'src/aportes/entities/aporte.entity';
import { Prestamo } from 'src/prestamos/entities/prestamo.entity';
import { ListarAportesAfiliadoQueryDto } from './dto/listar-aportes-afiliado-query.dto';
import { toYmd } from 'src/common/utils/date.util';
import { Retiro } from './entities/retiro.entity';
import { Exceso } from 'src/operaciones/entities/exceso.entity';
import { Devolucion } from 'src/operaciones/entities/devolucion.entity';
import Decimal from 'decimal.js';
import { MotivoRetiro } from '../catalogos/entities/motivo-retiro.entity';
import { ParametrosGlobalesService } from 'src/configuracion/parametros-globales.service';

@Injectable()
export class AfiliadosService {
  constructor(
    @InjectRepository(Afiliado)
    private readonly afiliadoRepo: Repository<Afiliado>,

    @InjectRepository(Aporte)
    private readonly aporteRepo: Repository<Aporte>,

    @InjectRepository(AfiliacionHistorial)
    private readonly historialRepo: Repository<AfiliacionHistorial>,

    @InjectRepository(Prestamo)
    private readonly prestamoRepo: Repository<Prestamo>,

    private readonly usuarioService: UsuarioService,
    private readonly dataSource: DataSource, // para transacción
    private readonly parametrosGlobalesService: ParametrosGlobalesService,

    @InjectRepository(MotivoRetiro)
    private readonly motivoRetiroRepo: Repository<MotivoRetiro>,
  ) {}

  async obtenerDetalleAfiliado(
    afiliadoId: number,
    modo: ModoAportes = 'actual',
  ): Promise<{
    afiliado: Afiliado;
    aportes: Aporte[];
    totalAportes: number;
    prestamos: Prestamo[];
  }> {
    const afiliado = await this.afiliadoRepo.findOne({
      where: { afiliado_id: afiliadoId },
      relations: [
        'pais',
        'departamento',
        'provincia',
        'distrito',
        'base',
        'regimen_laboral',
        'cuentas_bancarias',
        'cuentas_bancarias.banco',
        'cuentas_bancarias.moneda',
        'sobres_beneficiario',
        'afiliaciones',
      ],
    });
    if (!afiliado) {
      throw new NotFoundException({
        status: 'error',
        message: 'El afiliado no existe.',
      });
    }
    const historialActivo = await this.historialRepo.findOne({
      where: { afiliado_id: afiliado.afiliado_id, es_activo: true },
      order: { fecha_inicio: 'DESC' },
    });
    let aportes: Aporte[] = [];
    if (modo === 'actual') {
      if (!historialActivo) {
        aportes = [];
      } else {
        aportes = await this.aporteRepo.find({
          where: {
            afiliado_id: afiliado.afiliado_id,
            afiliacion_historial_id: historialActivo.afiliacion_historial_id,
          },
          order: { fecha_aporte: 'ASC' },
        });
      }
    } else if (modo === 'historico') {
      if (historialActivo) {
        aportes = await this.aporteRepo
          .createQueryBuilder('a')
          .where('a.afiliado_id = :afiliadoId', {
            afiliadoId: afiliado.afiliado_id,
          })
          .andWhere(
            '(a.afiliacion_historial_id IS NULL OR a.afiliacion_historial_id <> :historialId)',
            { historialId: historialActivo.afiliacion_historial_id },
          )
          .orderBy('a.fecha_aporte', 'ASC')
          .getMany();
      } else {
        aportes = await this.aporteRepo.find({
          where: { afiliado_id: afiliado.afiliado_id },
          order: { fecha_aporte: 'ASC' },
        });
      }
    } else if (modo === 'todos') {
      aportes = await this.aporteRepo.find({
        where: { afiliado_id: afiliado.afiliado_id },
        order: { fecha_aporte: 'ASC' },
      });
    } else {
      throw new BadRequestException({
        status: 'error',
        message:
          "Modo inválido. Usa 'actual', 'historico' o 'todos' en el parámetro 'modo'.",
      });
    }
    const totalAportes = aportes.reduce((sum, aporte) => {
      const valor = parseFloat(aporte.monto_aporte as any);
      return sum + (isNaN(valor) ? 0 : valor);
    }, 0);
    const prestamos = await this.prestamoRepo.find({
      where: { afiliado_id: afiliado.afiliado_id },
      relations: ['tipo_prestamo', 'afiliacion_historial'],
      order: { fecha_prestamo: 'DESC' },
    });
    return { afiliado, aportes, totalAportes, prestamos };
  }
  async buscarPaginado(params: {
    page: number;
    limit: number;
    estado?: boolean;
    search?: string;
  }): Promise<{ items: Afiliado[]; total: number }> {
    const { page, limit, estado, search } = params;
    const skip = (page - 1) * limit;

    const baseWhere: FindOptionsWhere<Afiliado> = {};
    if (estado) {
      baseWhere.estado = estado;
    }

    let where: FindOptionsWhere<Afiliado> | FindOptionsWhere<Afiliado>[];

    if (search && search.trim() !== '') {
      const term = `%${search.trim()}%`;

      where = [
        { ...baseWhere, nombres: Like(term) },
        { ...baseWhere, ap_paterno: Like(term) },
        { ...baseWhere, doc_identidad: Like(term) },
      ];
    } else {
      where = baseWhere;
    }

    const [items, total] = await this.afiliadoRepo.findAndCount({
      where,
      skip,
      take: limit,
      order: { ap_paterno: 'ASC', nombres: 'ASC' },
      relations: ['cuentas_bancarias'],
    });

    return { items, total };
  }

  async findById(id: number): Promise<Afiliado | null> {
    return this.afiliadoRepo.findOne({
      where: { afiliado_id: id },
      relations: ['cuentas_bancarias', 'sobres_beneficiario'],
    });
  }

  async buscarRapido(term: string, limit = 5): Promise<Afiliado[]> {
    const trimmed = term.trim();

    if (!trimmed) {
      return [];
    }

    const likeTerm = `%${trimmed}%`;

    // Si quieres restringir solo a ACTIVO:
    const estadoFiltro = true;

    console.log(term);
    console.log(limit);

    return this.afiliadoRepo.find({
      where: [
        { codigo_trabajador: Like(likeTerm), estado: estadoFiltro },
        { doc_identidad: Like(likeTerm), estado: estadoFiltro },
        { ap_paterno: Like(likeTerm), estado: estadoFiltro },
        { ap_materno: Like(likeTerm), estado: estadoFiltro },
        { nombres: Like(likeTerm), estado: estadoFiltro },
      ],
      take: limit,
      order: {
        ap_paterno: 'ASC',
        ap_materno: 'ASC',
        nombres: 'ASC',
      },
    });
  }

  async guardar(dto: GuardarAfiliadoDto): Promise<Afiliado> {
    const esUpdate = !!dto.id;

    // ⭐ Indicamos explícitamente que la transacción devuelve Afiliado
    return this.dataSource.transaction<Afiliado>(async (manager) => {
      const afiliadoRepo = manager.getRepository(Afiliado);
      const cuentaRepo = manager.getRepository(AfiliadoCuentaBancaria);
      const sobreRepo = manager.getRepository(AfiliadoSobreBeneficiario); // 👈 NUEVO
      const historialRepo = manager.getRepository(AfiliacionHistorial); // ⭐ NUEVO

      // ---------- VALIDACIONES DE UNICIDAD ----------
      if (dto.codigo_trabajador) {
        const existeCodigo = await afiliadoRepo.findOne({
          where: esUpdate
            ? {
                codigo_trabajador: dto.codigo_trabajador,
                afiliado_id: Not(dto.id!), // excluye el propio afiliado al actualizar
              }
            : { codigo_trabajador: dto.codigo_trabajador },
        });

        if (existeCodigo) {
          throw new BadRequestException({
            status: 'error',
            message:
              'Ya existe un afiliado registrado con el mismo código de trabajador.',
          });
        }
      }

      if (dto.doc_identidad) {
        const existeDoc = await afiliadoRepo.findOne({
          where: esUpdate
            ? {
                doc_identidad: dto.doc_identidad,
                afiliado_id: Not(dto.id!),
              }
            : { doc_identidad: dto.doc_identidad },
        });

        if (existeDoc) {
          throw new BadRequestException({
            status: 'error',
            message:
              'Ya existe un afiliado registrado con el mismo documento de identidad.',
          });
        }
      }

      // ---------- FLUJO DE ACTUALIZACIÓN ----------
      if (esUpdate) {
        const afiliadoExistente = await afiliadoRepo.findOne({
          where: { afiliado_id: dto.id },
        });

        if (!afiliadoExistente) {
          throw new NotFoundException({
            status: 'error',
            message: 'El afiliado que intenta actualizar no existe.',
          });
        }

        afiliadoExistente.codigo_trabajador = dto.codigo_trabajador;
        afiliadoExistente.doc_identidad = dto.doc_identidad;
        afiliadoExistente.ap_paterno = dto.ap_paterno;
        afiliadoExistente.ap_materno = dto.ap_materno;
        afiliadoExistente.nombres = dto.nombres;
        afiliadoExistente.direccion = dto.direccion;
        afiliadoExistente.telefono = dto.telefono;
        afiliadoExistente.email = dto.email;
        afiliadoExistente.pais_id = dto.pais_id;
        afiliadoExistente.departamento_id = dto.departamento_id;
        afiliadoExistente.provincia_id = dto.provincia_id;
        afiliadoExistente.distrito_id = dto.distrito_id;
        afiliadoExistente.base_id = dto.base_id;
        afiliadoExistente.regimen_laboral_id = dto.regimen_laboral_id;
        afiliadoExistente.fecha_ingreso = dto.fecha_ingreso as any;
        afiliadoExistente.fecha_nacimiento = dto.fecha_nacimiento as any;

        // ⭐ Aseguramos el tipo de retorno del save
        const afiliadoActualizado: Afiliado =
          await afiliadoRepo.save(afiliadoExistente);

        // ----- Cuenta bancaria (si viene en el DTO) -----
        if (dto.cuenta_bancaria) {
          // desactivar cuenta activa anterior
          await cuentaRepo.update(
            { afiliado_id: afiliadoActualizado.afiliado_id, es_activa: true },
            { es_activa: false },
          );

          // crear nueva cuenta activa
          const nuevaCuenta = cuentaRepo.create({
            afiliado_id: afiliadoActualizado.afiliado_id,
            banco_id: dto.cuenta_bancaria.banco_id,
            moneda_id: dto.cuenta_bancaria.moneda_id,
            nro_cuenta: dto.cuenta_bancaria.nro_cuenta,
            es_activa: true,
          });

          await cuentaRepo.save(nuevaCuenta);
        }

        // ----- SOBRE BENEFICIARIO 👇 -----
        if (dto.sobre_beneficiario) {
          // 1) Desactivar sobre activo previo
          await sobreRepo.update(
            { afiliado_id: afiliadoActualizado.afiliado_id, es_activo: true },
            { es_activo: false },
          );

          // 2) Crear nuevo sobre activo
          const nuevoSobre = sobreRepo.create({
            afiliado_id: afiliadoActualizado.afiliado_id,
            fecha_recepcion: dto.sobre_beneficiario.fecha_recepcion as any,
            en_buen_estado: dto.sobre_beneficiario.en_buen_estado,
            observacion: dto.sobre_beneficiario.observacion,
            es_activo: true,
          });

          await sobreRepo.save(nuevoSobre);
        }

        return afiliadoActualizado; // <- Afiliado
      }

      // ---------- FLUJO DE CREACIÓN ----------
      const afiliado = afiliadoRepo.create({
        codigo_trabajador: dto.codigo_trabajador,
        doc_identidad: dto.doc_identidad,
        ap_paterno: dto.ap_paterno,
        ap_materno: dto.ap_materno,
        nombres: dto.nombres,
        direccion: dto.direccion,
        telefono: dto.telefono,
        email: dto.email,
        pais_id: dto.pais_id,
        departamento_id: dto.departamento_id,
        provincia_id: dto.provincia_id,
        distrito_id: dto.distrito_id,
        base_id: dto.base_id,
        regimen_laboral_id: dto.regimen_laboral_id,
        fecha_ingreso: dto.fecha_ingreso,
        fecha_nacimiento: dto.fecha_nacimiento,
        estado: true,
      });

      // ⭐ Tipar explícitamente el guardado
      const afiliadoGuardado: Afiliado = await afiliadoRepo.save(afiliado);

      // ⭐ CREAR HISTORIAL DE AFILIACIÓN INICIAL
      const historial = historialRepo.create({
        afiliado_id: afiliadoGuardado.afiliado_id,
        fecha_inicio: dto.fecha_ingreso as any,
        fecha_fin: null,
        motivo_retiro_id: null,
        es_activo: true,
      });

      await historialRepo.save(historial);

      // Crear usuario para este afiliado SOLO AL CREAR
      const usuario =
        await this.usuarioService.crearUsuarioParaAfiliado(afiliadoGuardado);

      afiliadoGuardado.usuario_id = usuario.usuario_id;
      afiliadoGuardado.usuario = usuario;
      await afiliadoRepo.save(afiliadoGuardado);

      // ----- Crear cuenta bancaria inicial (si viene en el DTO) -----
      if (dto.cuenta_bancaria) {
        const nuevaCuenta = cuentaRepo.create({
          afiliado_id: afiliadoGuardado.afiliado_id,
          banco_id: dto.cuenta_bancaria.banco_id,
          moneda_id: dto.cuenta_bancaria.moneda_id,
          nro_cuenta: dto.cuenta_bancaria.nro_cuenta,
          es_activa: true,
        });

        await cuentaRepo.save(nuevaCuenta);
      }

      // Sobre beneficiario inicial (si viene)
      if (dto.sobre_beneficiario) {
        const nuevoSobre = sobreRepo.create({
          afiliado_id: afiliadoGuardado.afiliado_id,
          fecha_recepcion: dto.sobre_beneficiario.fecha_recepcion as any,
          en_buen_estado: dto.sobre_beneficiario.en_buen_estado,
          observacion: dto.sobre_beneficiario.observacion,
          es_activo: true,
        });

        await sobreRepo.save(nuevoSobre);
      }

      return afiliadoGuardado; // <- Afiliado
    });
  }

  async retirarAfiliado(
    afiliadoId: number,
    dto: RetirarAfiliadoDto,
    usuarioId?: number,
  ): Promise<Retiro> {
    return this.dataSource.transaction(async (manager) => {
      const afiliadoRepo = manager.getRepository(Afiliado);
      const historialRepo = manager.getRepository(AfiliacionHistorial);
      const retiroRepo = manager.getRepository(Retiro);
      const prestamoRepo = manager.getRepository(Prestamo);
      const excesoRepo = manager.getRepository(Exceso);
      const devolucionRepo = manager.getRepository(Devolucion);
      const motivoRetiroRepo = manager.getRepository(MotivoRetiro);

      // 1) Afiliado existe?
      const afiliado = await afiliadoRepo.findOne({
        where: { afiliado_id: afiliadoId },
      });

      if (!afiliado) {
        throw new NotFoundException({
          status: 'error',
          message: 'El afiliado no existe.',
        });
      }

      // 2) Afiliación activa (lock)
      const historialActivo = await historialRepo
        .createQueryBuilder('h')
        .setLock('pessimistic_write')
        .where('h.afiliado_id = :afiliadoId', { afiliadoId })
        .andWhere('h.es_activo = 1')
        .getOne();

      if (!historialActivo) {
        throw new BadRequestException({
          status: 'error',
          message: 'El afiliado no tiene una afiliación activa para retirar.',
        });
      }

      const historialId = historialActivo.afiliacion_historial_id;

      // 2.1) Validar motivo retiro
      const motivo = await motivoRetiroRepo.findOne({
        where: { motivo_retiro_id: dto.motivo_retiro_id, es_activo: true },
      });

      if (!motivo) {
        throw new BadRequestException({
          status: 'error',
          message: 'Motivo de retiro inválido o inactivo.',
        });
      }

      // ✅ 2.2) Traer parámetros reales desde configuracion.parametro_global
      const factorBeneficio =
        await this.parametrosGlobalesService.getNumber('FACTOR_BENEFICIO');
      const porcentajeGastosAdm =
        await this.parametrosGlobalesService.getNumber(
          'GASTOS_ADMIN_RETIRO_PORC',
        );

      // 3) Validar préstamos cancelados
      const prestamosPendientes = await prestamoRepo
        .createQueryBuilder('p')
        .where('p.afiliado_id = :afiliadoId', { afiliadoId })
        .andWhere('p.afiliacion_historial_id = :historialId', { historialId })
        .andWhere('p.estado_prestamo_id <> :cancelado', { cancelado: 2 })
        .getCount();

      if (prestamosPendientes > 0) {
        throw new BadRequestException({
          status: 'error',
          message:
            'No se puede retirar: existen préstamos pendientes (no cancelados).',
        });
      }

      // 4) Validar saldos (exceso - devolución = 0)
      const rawExceso = await excesoRepo
        .createQueryBuilder('e')
        .select(
          'ISNULL(SUM(CAST(e.monto_exceso AS decimal(18,2))), 0)',
          'sumExceso',
        )
        .where('e.afiliado_id = :afiliadoId', { afiliadoId })
        .andWhere('e.afiliacion_historial_id = :historialId', { historialId })
        .getRawOne<{ sumExceso: string }>();

      const rawDevo = await devolucionRepo
        .createQueryBuilder('d')
        .select(
          'ISNULL(SUM(CAST(d.monto_devolucion AS decimal(18,2))), 0)',
          'sumDevolucion',
        )
        .where('d.afiliado_id = :afiliadoId', { afiliadoId })
        .andWhere('d.afiliacion_historial_id = :historialId', { historialId })
        .getRawOne<{ sumDevolucion: string }>();

      const excesoTotal = new Decimal(rawExceso?.sumExceso ?? '0');
      const devolucionTotal = new Decimal(rawDevo?.sumDevolucion ?? '0');
      const saldoDeuda = excesoTotal.minus(devolucionTotal);

      if (!saldoDeuda.equals(0)) {
        throw new BadRequestException({
          status: 'error',
          message:
            `No se puede retirar: existe saldo pendiente por devolver. ` +
            `Exceso=${excesoTotal.toFixed(2)} - Devolución=${devolucionTotal.toFixed(2)} = ${saldoDeuda.toFixed(2)}.`,
        });
      }

      // 5) Snapshot cálculo
      const fechaRetiro = dto.fecha_retiro
        ? new Date(dto.fecha_retiro)
        : new Date();

      const aportes = new Decimal(dto.monto_aportes_acumulado);
      const factor = new Decimal(factorBeneficio);
      const pctGastos = new Decimal(porcentajeGastosAdm);

      const montoFactor = aportes.mul(factor);
      const montoGastos = montoFactor.mul(pctGastos).div(100);
      const montoRetiro = montoFactor.minus(montoGastos);

      const aportes2 = aportes.toDecimalPlaces(2);
      const montoFactor2 = montoFactor.toDecimalPlaces(2);
      const montoGastos2 = montoGastos.toDecimalPlaces(2);
      const montoRetiro2 = montoRetiro.toDecimalPlaces(2);

      // 6) Insertar retiro
      const retiro = retiroRepo.create({
        afiliado_id: afiliadoId,
        afiliacion_historial_id: historialId,

        fecha_retiro: fechaRetiro,
        motivo_retiro_id: motivo.motivo_retiro_id,

        observacion: dto.observacion ?? null,

        monto_aportes_acumulado: aportes2.toFixed(2),
        factor_beneficio: factor.toFixed(4),
        porcentaje_gastos_adm: pctGastos.toFixed(4),
        monto_factor_beneficio: montoFactor2.toFixed(2),
        monto_gastos_adm: montoGastos2.toFixed(2),
        monto_retiro: montoRetiro2.toFixed(2),

        usuario_id: usuarioId ?? null,
        creado_en: new Date(),
      });

      const retiroGuardado = await retiroRepo.save(retiro);

      // 7) Cerrar afiliación activa
      historialActivo.fecha_fin = fechaRetiro;
      historialActivo.motivo_retiro_id = motivo.motivo_retiro_id;
      historialActivo.es_activo = false;
      await historialRepo.save(historialActivo);

      // 8) Update afiliado
      afiliado.estado = false;
      afiliado.fecha_inactivacion = fechaRetiro;
      afiliado.motivo_inactivacion =
        dto.observacion ?? `Retiro por: ${motivo.nombre}`;
      afiliado.retiro_actual_id = retiroGuardado.retiro_id;
      await afiliadoRepo.save(afiliado);

      return retiroGuardado;
    });
  }

  async obtenerDetalleAfiliadoSolo(afiliadoId: number): Promise<Afiliado> {
    const afiliado = await this.afiliadoRepo.findOne({
      where: { afiliado_id: afiliadoId },
      relations: [
        'pais',
        'departamento',
        'provincia',
        'distrito',
        'base',
        'regimen_laboral',
        'cuentas_bancarias',
        'cuentas_bancarias.banco',
        'cuentas_bancarias.moneda',
        'sobres_beneficiario',
        'afiliaciones',
      ],
    });

    if (!afiliado) {
      throw new NotFoundException({
        status: 'error',
        message: 'El afiliado no existe.',
      });
    }

    return afiliado;
  }

  async obtenerKpisAportes(afiliadoId: number): Promise<{
    total_aportes: number;
    monto_total_aportes: number;
    fecha_ultimo_aporte: string | null;
  }> {
    const existe = await this.afiliadoRepo.exist({
      where: { afiliado_id: afiliadoId },
    });
    if (!existe) {
      throw new NotFoundException({
        status: 'error',
        message: 'El afiliado no existe.',
      });
    }

    // total_aportes + monto_total_aportes
    const agg = await this.aporteRepo
      .createQueryBuilder('a')
      .select('COUNT(1)', 'total_aportes')
      .addSelect('COALESCE(SUM(a.monto_aporte), 0)', 'monto_total_aportes')
      .where('a.afiliado_id = :afiliadoId', { afiliadoId })
      .getRawOne<{ total_aportes: string; monto_total_aportes: string }>();

    // ultimo aporte
    const last = await this.aporteRepo
      .createQueryBuilder('a')
      .select('MAX(a.fecha_aporte)', 'fecha_ultimo_aporte')
      .where('a.afiliado_id = :afiliadoId', { afiliadoId })
      .getRawOne<{ fecha_ultimo_aporte: string | null }>();

    return {
      total_aportes: Number(agg?.total_aportes ?? 0),
      monto_total_aportes: Number(agg?.monto_total_aportes ?? 0),
      fecha_ultimo_aporte: last?.fecha_ultimo_aporte
        ? toYmd(last.fecha_ultimo_aporte)
        : null,
    };
  }

  async listarAportesDeAfiliadoPaginado(
    afiliadoId: number,
    query: ListarAportesAfiliadoQueryDto,
  ): Promise<{ items: any[]; total: number }> {
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

    const qb = this.aporteRepo
      .createQueryBuilder('a')
      .leftJoinAndSelect('a.planilla', 'pl') // si ya hiciste entity/relación
      .where('a.afiliado_id = :afiliadoId', { afiliadoId });

    if (query.fecha_desde)
      qb.andWhere('a.fecha_aporte >= :desde', { desde: query.fecha_desde });
    if (query.fecha_hasta)
      qb.andWhere('a.fecha_aporte <= :hasta', { hasta: query.fecha_hasta });

    qb.orderBy('a.fecha_aporte', 'DESC').addOrderBy('a.aporte_id', 'DESC');
    qb.skip(skip).take(safeLimit);

    const [aportes, total] = await qb.getManyAndCount();

    // salida limpia (fechas como YYYY-MM-DD)
    const items = aportes.map((a) => ({
      aporte_id: a.aporte_id,
      fecha_aporte: String(a.fecha_aporte),
      monto_aporte: Number(a.monto_aporte),
      planilla_id: a.planilla_id ?? null,
      planilla: a.planilla
        ? {
            planilla_id: a.planilla.planilla_id,
            codigo: a.planilla.codigo,
            anio: a.planilla.anio,
            mes: a.planilla.mes,
            tipo: a.planilla.tipo,
            observacion: a.planilla.observacion,
          }
        : null,
    }));

    return { items, total };
  }
}
