// src/aportes/entities/aporte.entity.ts
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
import { Planilla } from 'src/operaciones/entities/planilla.entity';

@Entity({ schema: 'operaciones', name: 'aporte' })
export class Aporte {
  @PrimaryGeneratedColumn()
  aporte_id: number;

  @Column({ type: 'int' })
  afiliado_id: number;

  @ManyToOne(() => Afiliado)
  @JoinColumn({ name: 'afiliado_id' })
  afiliado: Afiliado;

  // ✅ NUEVO
  @Column({ type: 'int', nullable: true })
  planilla_id?: number | null;

  // ✅ NUEVO
  @ManyToOne(() => Planilla, { nullable: true })
  @JoinColumn({ name: 'planilla_id' })
  planilla?: Planilla | null;

  @Column({ type: 'date' })
  fecha_aporte: Date;

  @Column({ type: 'decimal', precision: 14, scale: 2 })
  monto_aporte: number;

  @Column({ type: 'nvarchar', length: 20, nullable: true })
  origen?: string | null;

  @Column({ type: 'nvarchar', length: 30, nullable: true })
  referencia_lote?: string | null;

  @Column({ type: 'nvarchar', length: 200, nullable: true })
  observacion?: string | null;

  @Column({ type: 'varchar', length: 8, nullable: true })
  codtra_legacy?: string | null;

  @Column({ type: 'varchar', length: 7, nullable: true })
  codafi2_legacy?: string | null;

  @Column({ type: 'varchar', length: 11, nullable: true })
  codafi_legacy?: string | null;

  @Column({ type: 'varchar', length: 7, nullable: true })
  codret_legacy?: string | null;

  @Column({ type: 'char', length: 1, nullable: true })
  estafi_legacy?: string | null;

  @Column({ type: 'varchar', length: 20, nullable: true })
  ind_legacy?: string | null;

  @CreateDateColumn({ name: 'creado_en', type: 'datetime2' })
  creado_en: Date;

  @UpdateDateColumn({
    name: 'actualizado_en',
    type: 'datetime2',
    nullable: true,
  })
  actualizado_en?: Date | null;

  @Column({ type: 'int', nullable: true })
  afiliacion_historial_id?: number | null;

  @ManyToOne(() => AfiliacionHistorial)
  @JoinColumn({ name: 'afiliacion_historial_id' })
  afiliacion_historial?: AfiliacionHistorial | null;
}
