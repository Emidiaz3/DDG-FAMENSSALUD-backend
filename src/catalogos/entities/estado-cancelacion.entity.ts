// src/catalogos/entities/estado-cancelacion.entity.ts
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ schema: 'catalogos', name: 'estado_cancelacion' })
export class EstadoCancelacion {
  @PrimaryGeneratedColumn({ name: 'estado_cancelacion_id' })
  estado_cancelacion_id: number;

  @Column({ type: 'char', length: 1, nullable: true })
  codigo: string | null;

  @Column({ type: 'nvarchar', length: 50 })
  descripcion: string;
}
