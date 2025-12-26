// catalogos/pais.entity.ts
import { Afiliado } from 'src/afiliados/entities/afiliado.entity';
import { Entity, Column, PrimaryGeneratedColumn, OneToMany } from 'typeorm';

@Entity({ schema: 'catalogos', name: 'pais' })
export class Pais {
  @PrimaryGeneratedColumn()
  pais_id: number;

  @Column({ type: 'nvarchar', length: 80 })
  nombre: string;

  @OneToMany(() => Afiliado, (a) => a.pais)
  afiliados: Afiliado[];
}
