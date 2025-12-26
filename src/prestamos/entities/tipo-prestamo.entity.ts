import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ schema: 'catalogos', name: 'tipo_prestamo' })
export class TipoPrestamo {
  @PrimaryGeneratedColumn({ name: 'tipo_prestamo_id' })
  tipo_prestamo_id: number; // 👈 coincide con la BD exacto

  @Column({ type: 'char', length: 1 })
  codigo: string;

  @Column({ type: 'nvarchar', length: 50 })
  descripcion: string;

  @Column({ type: 'decimal', precision: 5, scale: 2 })
  tasa_interes_mensual: string; // TypeORM maneja decimal como string
}
