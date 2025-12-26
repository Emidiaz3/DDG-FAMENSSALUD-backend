// src/catalogos/entities/base.entity.ts
import { Afiliado } from 'src/afiliados/entities/afiliado.entity';
import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';

@Entity({ schema: 'catalogos', name: 'base' })
export class Base {
  @PrimaryGeneratedColumn()
  base_id: number;

  @Column({ type: 'nvarchar', length: 100 })
  nombre: string;

  @Column({ type: 'varchar', length: 10, nullable: true })
  codigo?: string | null;

  @Column({ type: 'int', nullable: true })
  departamento_id?: number | null;

  @OneToMany(() => Afiliado, (a) => a.base)
  afiliados: Afiliado[];
}
