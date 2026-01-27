import {
  Column,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Retiro } from 'src/afiliados/entities/retiro.entity';
import { AfiliacionHistorial } from 'src/afiliados/entities/afiliacion-historial.entity';

@Entity({ schema: 'catalogos', name: 'motivo_retiro' })
export class MotivoRetiro {
  @PrimaryGeneratedColumn({ type: 'int', name: 'motivo_retiro_id' })
  motivo_retiro_id: number;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 10, name: 'codigo' })
  codigo: string;

  @Index({ unique: true })
  @Column({ type: 'nvarchar', length: 100, name: 'nombre' })
  nombre: string;

  @Column({ type: 'bit', name: 'es_activo', default: () => '1' })
  es_activo: boolean;

  @Column({
    type: 'datetime2',
    name: 'fecha_creacion',
    default: () => 'SYSDATETIME()',
  })
  fecha_creacion: Date;

  @Column({ type: 'datetime2', name: 'fecha_modificacion', nullable: true })
  fecha_modificacion: Date | null;

  // Relaciones (opcionales pero útiles)
  @OneToMany(() => Retiro, (r) => r.motivo_retiro)
  retiros: Retiro[];

  @OneToMany(() => AfiliacionHistorial, (h) => h.motivo_retiro)
  afiliaciones_historial: AfiliacionHistorial[];
}
