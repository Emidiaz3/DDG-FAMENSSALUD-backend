// src/catalogos/entities/moneda.entity.ts
import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity({ schema: 'catalogos', name: 'moneda' })
export class Moneda {
  @PrimaryGeneratedColumn()
  moneda_id: number;

  @Column({ type: 'varchar', length: 5 })
  codigo: string; // D / S

  @Column({ type: 'nvarchar', length: 80 })
  nombre: string; // DÓLARES AMERICANOS

  @Column({ type: 'varchar', length: 10, nullable: true })
  abreviatura?: string; // USD

  @Column({ type: 'varchar', length: 10, nullable: true })
  simbolo?: string; // US$.

  @Column({ type: 'nvarchar', length: 80, nullable: true })
  descripcion?: string; // DÓLAR / SOL
}
