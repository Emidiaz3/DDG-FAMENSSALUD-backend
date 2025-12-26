// src/catalogos/entities/banco.entity.ts
import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity({ schema: 'catalogos', name: 'banco' })
export class Banco {
  @PrimaryGeneratedColumn()
  banco_id: number;

  @Column({ type: 'nvarchar', length: 80 })
  nombre: string;
}
