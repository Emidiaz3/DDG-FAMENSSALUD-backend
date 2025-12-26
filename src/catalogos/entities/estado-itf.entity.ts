// src/catalogos/entities/estado-itf.entity.ts
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ schema: 'catalogos', name: 'estado_itf' })
export class EstadoItf {
  @PrimaryGeneratedColumn({ name: 'estado_itf_id' })
  estado_itf_id: number;

  @Column({ type: 'char', length: 1 })
  codigo: string; // 'S' | 'N'

  @Column({ type: 'nvarchar', length: 50 })
  descripcion: string;
}
