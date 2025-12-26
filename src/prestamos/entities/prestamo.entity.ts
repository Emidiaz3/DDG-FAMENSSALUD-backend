import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Afiliado } from '../../afiliados/entities/afiliado.entity';
import { AfiliacionHistorial } from '../../afiliados/entities/afiliacion-historial.entity';
import { TipoPrestamo } from './tipo-prestamo.entity';
import { EstadoPrestamoEnum } from '../prestamos.constants';
import { EstadoPrestamo } from './estado-prestamo.entity';
import { EstadoItf } from 'src/catalogos/entities/estado-itf.entity';
import { EstadoCancelacion } from 'src/catalogos/entities/estado-cancelacion.entity';

@Entity({ schema: 'prestamos', name: 'prestamo' })
export class Prestamo {
  @PrimaryGeneratedColumn({ name: 'prestamo_id', type: 'bigint' })
  prestamo_id: number;

  @Column({ type: 'int' })
  afiliado_id: number;

  @ManyToOne(() => Afiliado)
  @JoinColumn({ name: 'afiliado_id' })
  afiliado: Afiliado;

  @Column({ type: 'int', nullable: true })
  afiliacion_historial_id: number | null;

  @ManyToOne(() => AfiliacionHistorial, { nullable: true })
  @JoinColumn({ name: 'afiliacion_historial_id' })
  afiliacion_historial: AfiliacionHistorial | null;

  @Column({ type: 'int' })
  tipo_prestamo_id: number;

  @ManyToOne(() => TipoPrestamo)
  @JoinColumn({ name: 'tipo_prestamo_id' })
  tipo_prestamo: TipoPrestamo;

  @Column({ type: 'int' })
  estado_prestamo_id: EstadoPrestamoEnum;

  @ManyToOne(() => EstadoPrestamo)
  @JoinColumn({ name: 'estado_prestamo_id' })
  estado_prestamo: EstadoPrestamo;

  @Column({ type: 'int', nullable: true })
  estado_cancelacion_id: number | null;

  @ManyToOne(() => EstadoCancelacion, { nullable: true })
  @JoinColumn({ name: 'estado_cancelacion_id' })
  estado_cancelacion?: EstadoCancelacion | null;

  @Column({ type: 'int', nullable: true })
  estado_itf_id: number | null;

  @ManyToOne(() => EstadoItf, { nullable: true })
  @JoinColumn({ name: 'estado_itf_id' })
  estado_itf?: EstadoItf | null;

  @Column({ type: 'int' })
  numero_prestamo: number;

  @Column({ type: 'date' })
  fecha_prestamo: Date;

  @Column({ type: 'decimal', precision: 5, scale: 2 })
  tasa_interes_mensual: number;

  @Column({ type: 'int' })
  numero_cuotas_pactadas: number;

  @Column({ type: 'int' })
  numero_cuotas_pagadas: number;

  @Column({ type: 'decimal', precision: 14, scale: 2 })
  monto_prestamo: number;

  @Column({ type: 'decimal', precision: 14, scale: 2 })
  cuota_mensual: number;

  @Column({ type: 'decimal', precision: 14, scale: 2 })
  monto_saldo: number;

  @Column({ type: 'decimal', precision: 14, scale: 2 })
  monto_total_pagado: number;

  @Column({ type: 'decimal', precision: 14, scale: 2 })
  monto_capital_cuota: number;

  @Column({ type: 'decimal', precision: 14, scale: 2 })
  monto_interes_cuota: number;

  @Column({ type: 'decimal', precision: 14, scale: 2 })
  monto_gasto_adm_cuota: number;

  @Column({ type: 'decimal', precision: 14, scale: 2 })
  monto_pagado_capital: number;

  @Column({ type: 'decimal', precision: 14, scale: 2 })
  monto_pagado_interes: number;

  @Column({ type: 'decimal', precision: 14, scale: 2 })
  monto_pagado_gasto_adm: number;

  @Column({ type: 'decimal', precision: 14, scale: 2 })
  monto_exonerado: number;

  @Column({ type: 'decimal', precision: 14, scale: 2 })
  monto_interes_mora: number;

  @Column({ type: 'decimal', precision: 14, scale: 2 })
  monto_extra_capital: number;

  @Column({ type: 'decimal', precision: 14, scale: 2 })
  monto_extra_interes: number;

  @Column({ type: 'decimal', precision: 14, scale: 2 })
  monto_extra_gasto_adm: number;

  @Column({ type: 'decimal', precision: 14, scale: 2 })
  gasto_adm_configurado: number;

  @Column({ type: 'decimal', precision: 7, scale: 4 })
  porcentaje_seguro: number;

  @Column({ type: 'decimal', precision: 14, scale: 2 })
  monto_seguro: number;

  @Column({ type: 'decimal', precision: 14, scale: 2 })
  monto_deuda_total: number;

  @Column({ type: 'decimal', precision: 14, scale: 2 })
  monto_girado_banco: number;

  @Column({ type: 'decimal', precision: 14, scale: 2 })
  monto_gastos_operativos: number;

  @Column({ type: 'date', nullable: true })
  fecha_ultima_amortizacion: Date | null;

  @Column({ type: 'varchar', length: 8, nullable: true })
  codigo_trabajador_legacy: string | null;

  @Column({ type: 'varchar', length: 7, nullable: true })
  codigo_afiliado_simple: string | null;

  @Column({ type: 'varchar', length: 6, nullable: true })
  codigo_base_legacy: string | null;

  @Column({ type: 'varchar', length: 7, nullable: true })
  codigo_retiro_legacy: string | null;

  @Column({ type: 'varchar', length: 11, nullable: true })
  codigo_afiliado_compuesto: string | null;

  @Column({ type: 'char', length: 1, nullable: true })
  estado_afiliado_legacy: string | null;

  @Column({ type: 'char', length: 1, nullable: true })
  tipo_prestamo_legacy: string | null;

  @Column({ type: 'char', length: 1, nullable: true })
  estado_prestamo_legacy: string | null;

  @Column({ type: 'char', length: 1, nullable: true })
  estado_cancelacion_legacy: string | null;

  @Column({ type: 'char', length: 1, nullable: true })
  estado_itf_legacy: string | null;

  @Column({ type: 'nvarchar', length: 200, nullable: true })
  observacion_prestamo: string | null;

  @CreateDateColumn({ name: 'creado_en', type: 'datetime2' })
  creado_en: Date;

  @UpdateDateColumn({
    name: 'actualizado_en',
    type: 'datetime2',
    nullable: true,
  })
  actualizado_en: Date | null;
}
