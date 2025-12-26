// catalogos/provincia.entity.ts
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { Departamento } from './departamento.entity';
import { Afiliado } from 'src/afiliados/entities/afiliado.entity';

@Entity({ schema: 'catalogos', name: 'provincia' })
export class Provincia {
  @PrimaryGeneratedColumn()
  provincia_id: number;

  @Column({ type: 'int' })
  departamento_id: number;

  @ManyToOne(() => Departamento)
  @JoinColumn({ name: 'departamento_id' })
  departamento: Departamento;

  @Column({ type: 'nvarchar', length: 80 })
  nombre: string;

  @OneToMany(() => Afiliado, (a) => a.provincia)
  afiliados: Afiliado[];
}
