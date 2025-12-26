// src/catalogos/entities/regimen-laboral.entity.ts
import { Afiliado } from 'src/afiliados/entities/afiliado.entity';
import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';

@Entity({ schema: 'catalogos', name: 'regimen_laboral' })
export class RegimenLaboral {
  @PrimaryGeneratedColumn()
  regimen_laboral_id: number;

  @Column({ type: 'nvarchar', length: 100 })
  nombre: string;

  @OneToMany(() => Afiliado, (a) => a.regimen_laboral)
  afiliados: Afiliado[];
}
