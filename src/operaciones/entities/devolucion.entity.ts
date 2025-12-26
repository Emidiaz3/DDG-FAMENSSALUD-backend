import { AfiliacionHistorial } from 'src/afiliados/entities/afiliacion-historial.entity';
import { Afiliado } from 'src/afiliados/entities/afiliado.entity';
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

@Entity({ schema: 'operaciones', name: 'devolucion' })
@Index('IX_devolucion_afiliado_fecha', ['afiliado_id', 'fecha_devolucion'])
@Index('IX_devolucion_historial_fecha', [
  'afiliacion_historial_id',
  'fecha_devolucion',
])
export class Devolucion {
  @PrimaryGeneratedColumn({ type: 'bigint', name: 'devolucion_id' })
  devolucion_id: string; // bigint => string

  @Column({ type: 'int', name: 'afiliado_id' })
  afiliado_id: number;

  @Column({ type: 'int', name: 'afiliacion_historial_id', nullable: true })
  afiliacion_historial_id: number | null;

  @Column({ type: 'datetime2', precision: 0, name: 'fecha_devolucion' })
  fecha_devolucion: Date;

  @Column({
    type: 'decimal',
    precision: 14,
    scale: 2,
    name: 'monto_devolucion',
  })
  monto_devolucion: string;

  @Column({
    type: 'nvarchar',
    length: 200,
    name: 'observacion_devolucion',
    nullable: true,
  })
  observacion_devolucion: string | null;

  // Legacy
  @Column({
    type: 'char',
    length: 8,
    name: 'codigo_trabajador_legacy',
    nullable: true,
  })
  codigo_trabajador_legacy: string | null;

  @Column({
    type: 'char',
    length: 7,
    name: 'codigo_afiliado_simple_legacy',
    nullable: true,
  })
  codigo_afiliado_simple_legacy: string | null;

  @Column({
    type: 'char',
    length: 7,
    name: 'codigo_retiro_legacy',
    nullable: true,
  })
  codigo_retiro_legacy: string | null;

  @Column({
    type: 'char',
    length: 15,
    name: 'codigo_afiliado_compuesto_legacy',
    nullable: true,
  })
  codigo_afiliado_compuesto_legacy: string | null;

  @Column({
    type: 'char',
    length: 1,
    name: 'estado_afiliado_legacy',
    nullable: true,
  })
  estado_afiliado_legacy: string | null;

  @CreateDateColumn({ type: 'datetime2', name: 'creado_en' })
  creado_en: Date;

  @UpdateDateColumn({
    type: 'datetime2',
    name: 'actualizado_en',
    nullable: true,
  })
  actualizado_en: Date | null;

  // Relaciones
  @ManyToOne(() => Afiliado, (a) => a.devoluciones, { onDelete: 'NO ACTION' })
  @JoinColumn({ name: 'afiliado_id', referencedColumnName: 'afiliado_id' })
  afiliado: Afiliado;

  @ManyToOne(() => AfiliacionHistorial, (h) => h.devoluciones, {
    nullable: true,
    onDelete: 'NO ACTION',
  })
  @JoinColumn({
    name: 'afiliacion_historial_id',
    referencedColumnName: 'afiliacion_historial_id',
  })
  afiliacion_historial: AfiliacionHistorial | null;
}
