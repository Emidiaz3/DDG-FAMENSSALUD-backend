// src/catalogos/entities/estado-prestamo.entity.ts
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ schema: 'catalogos', name: 'estado_prestamo' })
export class EstadoPrestamo {
  @PrimaryGeneratedColumn({ name: 'estado_prestamo_id' })
  estado_prestamo_id: number;

  @Column({ type: 'char', length: 1, unique: true })
  codigo: string;

  @Column({ type: 'nvarchar', length: 50 })
  descripcion: string;
}
