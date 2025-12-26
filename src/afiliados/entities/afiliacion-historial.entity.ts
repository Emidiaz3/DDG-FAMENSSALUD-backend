// src/afiliados/entities/afiliacion-historial.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { Afiliado } from './afiliado.entity';
import { Exceso } from 'src/operaciones/entities/exceso.entity';
import { Devolucion } from 'src/operaciones/entities/devolucion.entity';
import { Retiro } from './retiro.entity';

@Entity({ schema: 'nucleo', name: 'afiliacion_historial' })
export class AfiliacionHistorial {
  @PrimaryGeneratedColumn()
  afiliacion_historial_id: number;

  @Column({ type: 'int' })
  afiliado_id: number;

  @ManyToOne(() => Afiliado, (a) => a.afiliaciones)
  @JoinColumn({ name: 'afiliado_id' })
  afiliado: Afiliado;

  @Column({ type: 'date' })
  fecha_inicio: Date;

  @Column({ type: 'date', nullable: true })
  fecha_fin?: Date | null;

  @Column({ type: 'nvarchar', length: 100, nullable: true })
  motivo_retiro?: string | null;

  @Column({ type: 'bit' })
  es_activo: boolean;

  @OneToMany(() => Exceso, (e) => e.afiliacion_historial)
  excesos: Exceso[];

  @OneToMany(() => Devolucion, (d) => d.afiliacion_historial)
  devoluciones: Devolucion[];

  @OneToMany(() => Retiro, (r) => r.afiliacion_historial)
  retiros: Retiro[];
}
