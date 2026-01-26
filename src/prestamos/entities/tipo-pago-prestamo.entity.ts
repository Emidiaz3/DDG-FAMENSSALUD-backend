// src/catalogos/entities/tipo-pago-prestamo.entity.ts
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ schema: 'catalogos', name: 'tipo_pago_prestamo' })
export class TipoPagoPrestamo {
  @PrimaryGeneratedColumn({ name: 'tipo_pago_prestamo_id' })
  tipo_pago_prestamo_id: number;

  @Column({ type: 'char', length: 1, nullable: true })
  codigo: string | null;

  @Column({ type: 'nvarchar', length: 50 })
  nombre: string;

  @Column({ type: 'nvarchar', length: 80 })
  descripcion: string;
}
