import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';

@Entity({ schema: 'seguridad', name: 'modulo' })
export class Modulo {
  @PrimaryGeneratedColumn()
  modulo_id: number; // INT

  @Column({ length: 100 })
  nombre: string;

  @Column({ length: 255, nullable: true })
  descripcion?: string;

  @ManyToOne(() => Modulo, { nullable: true })
  @JoinColumn({ name: 'modulo_padre_id' })
  modulo_padre?: Modulo;

  @Column({ type: 'int', nullable: true })
  modulo_padre_id?: number | null;

  @Column({ type: 'tinyint', default: 1 })
  nivel: number;

  @Column({ length: 200, nullable: true })
  ruta?: string;

  @Column({ length: 50, nullable: true })
  icono?: string;

  @Column({ type: 'smallint', nullable: true })
  orden?: number;

  @Column({ type: 'bit', default: true })
  es_activo: boolean;

  @Column({ type: 'datetime2', default: () => 'SYSDATETIME()' })
  creado_en: Date;

  @Column({ type: 'datetime2', default: () => 'SYSDATETIME()' })
  actualizado_en: Date;
}
