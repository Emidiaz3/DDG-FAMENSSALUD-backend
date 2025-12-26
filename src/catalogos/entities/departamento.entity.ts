// catalogos/departamento.entity.ts
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { Pais } from './pais.entity';
import { Afiliado } from 'src/afiliados/entities/afiliado.entity';

@Entity({ schema: 'catalogos', name: 'departamento' })
export class Departamento {
  @PrimaryGeneratedColumn()
  departamento_id: number;

  @Column({ type: 'int' })
  pais_id: number;

  @ManyToOne(() => Pais)
  @JoinColumn({ name: 'pais_id' })
  pais: Pais;

  @Column({ type: 'nvarchar', length: 80 })
  nombre: string;

  @OneToMany(() => Afiliado, (a) => a.departamento)
  afiliados: Afiliado[];
}
