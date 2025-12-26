// src/operaciones/entities/planilla.entity.ts
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ schema: 'operaciones', name: 'planilla' })
export class Planilla {
  @PrimaryGeneratedColumn({ name: 'planilla_id' })
  planilla_id: number;

  @Column({ type: 'nvarchar', length: 20 })
  codigo: string;

  @Column({ type: 'smallint' })
  anio: number;

  @Column({ type: 'tinyint' })
  mes: number;

  @Column({ type: 'nvarchar', length: 30, default: () => "'RECAUDACION'" })
  tipo: string;

  @Column({ type: 'datetime2', default: () => 'SYSDATETIME()' })
  fecha_carga: Date;

  @Column({ type: 'nvarchar', length: 100, nullable: true })
  usuario_carga?: string;

  @Column({ type: 'nvarchar', length: 200, nullable: true })
  observacion?: string;
}
