import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Prestamo } from './prestamo.entity';
import { Afiliado } from '../../afiliados/entities/afiliado.entity';
import { AfiliacionHistorial } from '../../afiliados/entities/afiliacion-historial.entity';
import { TipoPagoPrestamoEnum } from '../prestamos.constants';
import { Planilla } from 'src/operaciones/entities/planilla.entity';
import { TipoPagoPrestamo } from './tipo-pago-prestamo.entity';

@Entity({ schema: 'prestamos', name: 'pago' })
export class Pago {
  @PrimaryGeneratedColumn({ name: 'pago_id', type: 'bigint' })
  pago_id: number;

  @Column({ type: 'bigint' })
  prestamo_id: number;

  @ManyToOne(() => Prestamo)
  @JoinColumn({ name: 'prestamo_id' })
  prestamo: Prestamo;

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

  @Column({ type: 'int', nullable: true })
  planilla_id: number | null;

  @ManyToOne(() => Planilla, { nullable: true })
  @JoinColumn({ name: 'planilla_id' })
  planilla?: Planilla | null;

  @Column({ type: 'int' })
  numero_pago: number;

  @Column({ type: 'datetime2', precision: 0 })
  fecha_pago: Date;

  @Column({ type: 'int' })
  tipo_pago_prestamo_id: number;

  @ManyToOne(() => TipoPagoPrestamo, { nullable: true })
  @JoinColumn({ name: 'tipo_pago_prestamo_id' })
  tipo_pago_prestamo?: TipoPagoPrestamo | null;

  @Column({ type: 'char', length: 1, nullable: true })
  tipo_pago_legacy: string | null;

  @Column({ type: 'decimal', precision: 14, scale: 2 })
  monto_pago: number;

  @Column({ type: 'decimal', precision: 14, scale: 2 })
  monto_capital: number;

  @Column({ type: 'decimal', precision: 14, scale: 2 })
  monto_interes: number;

  @Column({ type: 'decimal', precision: 14, scale: 2, default: 0 })
  monto_gastos_operativos: number;

  @Column({ type: 'decimal', precision: 14, scale: 2, default: 0 })
  monto_gasto_adm: number;

  @Column({ type: 'decimal', precision: 14, scale: 2, default: 0 })
  monto_exceso: number;

  @Column({ type: 'decimal', precision: 14, scale: 2, default: 0 })
  monto_mora: number;

  @Column({ type: 'decimal', precision: 14, scale: 2 })
  saldo_despues_pago: number;

  @Column({ type: 'decimal', precision: 14, scale: 2, default: 0 })
  monto_extra_capital: number;

  @Column({ type: 'decimal', precision: 14, scale: 2, default: 0 })
  monto_extra_interes: number;

  @Column({ type: 'decimal', precision: 14, scale: 2, default: 0 })
  monto_extra_gasto_adm: number;

  @Column({ type: 'decimal', precision: 14, scale: 2, default: 0 })
  diferencia_interes_condonado: number;

  // Legacy
  @Column({ type: 'int', nullable: true })
  numero_prestamo_legacy: number | null;

  @Column({ type: 'varchar', length: 8, nullable: true })
  codigo_trabajador_legacy: string | null;

  @Column({ type: 'varchar', length: 7, nullable: true })
  codigo_afiliado_simple_legacy: string | null;

  @Column({ type: 'varchar', length: 7, nullable: true })
  codigo_retiro_legacy: string | null;

  @Column({ type: 'varchar', length: 11, nullable: true })
  codigo_afiliado_compuesto_legacy: string | null;

  @Column({ type: 'char', length: 1, nullable: true })
  estado_afiliado_legacy: string | null;

  @Column({ type: 'char', length: 1, nullable: true })
  indicador_legacy: string | null;

  // Anulación
  @Column({ type: 'bit', default: false })
  es_anulado: boolean;

  @CreateDateColumn({ name: 'creado_en', type: 'datetime2' })
  creado_en: Date;

  @UpdateDateColumn({
    name: 'actualizado_en',
    type: 'datetime2',
    nullable: true,
  })
  actualizado_en: Date | null;
}
