// src/afiliados/entities/retiro.entity.ts
import { Afiliado } from './afiliado.entity';
import { AfiliacionHistorial } from './afiliacion-historial.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ schema: 'nucleo', name: 'retiro' })
@Index('UX_retiro_afiliacion_historial', ['afiliacion_historial_id'], {
  unique: true,
})
@Index('IX_retiro_afiliado_fecha', ['afiliado_id', 'fecha_retiro'])
export class Retiro {
  @PrimaryGeneratedColumn({ type: 'int', name: 'retiro_id' })
  retiro_id: number;

  @Column({ type: 'int', name: 'afiliado_id' })
  afiliado_id: number;

  @Column({ type: 'int', name: 'afiliacion_historial_id' })
  afiliacion_historial_id: number;

  @Column({ type: 'datetime2', precision: 0, name: 'fecha_retiro' })
  fecha_retiro: Date;

  @Column({ type: 'nvarchar', length: 100, name: 'motivo_retiro' })
  motivo_retiro: string;

  @Column({
    type: 'nvarchar',
    length: 200,
    name: 'observacion',
    nullable: true,
  })
  observacion: string | null;

  // Snapshot cálculo (decimals como string recomendado)
  @Column({
    type: 'decimal',
    precision: 14,
    scale: 2,
    name: 'monto_aportes_acumulado',
  })
  monto_aportes_acumulado: string;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 4,
    name: 'factor_beneficio',
  })
  factor_beneficio: string;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 4,
    name: 'porcentaje_gastos_adm',
  })
  porcentaje_gastos_adm: string;

  @Column({
    type: 'decimal',
    precision: 14,
    scale: 2,
    name: 'monto_factor_beneficio',
  })
  monto_factor_beneficio: string;

  @Column({
    type: 'decimal',
    precision: 14,
    scale: 2,
    name: 'monto_gastos_adm',
  })
  monto_gastos_adm: string;

  @Column({ type: 'decimal', precision: 14, scale: 2, name: 'monto_retiro' })
  monto_retiro: string;

  @Column({ type: 'int', name: 'usuario_id', nullable: true })
  usuario_id: number | null;

  @CreateDateColumn({ type: 'datetime2', name: 'creado_en' })
  creado_en: Date;

  @UpdateDateColumn({
    type: 'datetime2',
    name: 'actualizado_en',
    nullable: true,
  })
  actualizado_en: Date | null;

  // Relaciones
  @ManyToOne(() => Afiliado, (a) => a.retiros, { onDelete: 'NO ACTION' })
  @JoinColumn({ name: 'afiliado_id', referencedColumnName: 'afiliado_id' })
  afiliado: Afiliado;

  @ManyToOne(() => AfiliacionHistorial, (h) => h.retiros, {
    onDelete: 'NO ACTION',
  })
  @JoinColumn({
    name: 'afiliacion_historial_id',
    referencedColumnName: 'afiliacion_historial_id',
  })
  afiliacion_historial: AfiliacionHistorial;
}
