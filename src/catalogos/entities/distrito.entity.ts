// catalogos/distrito.entity.ts
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { Provincia } from './provincia.entity';
import { Afiliado } from 'src/afiliados/entities/afiliado.entity';

@Entity({ schema: 'catalogos', name: 'distrito' })
export class Distrito {
  @PrimaryGeneratedColumn()
  distrito_id: number;

  @Column({ type: 'int' })
  provincia_id: number;

  @ManyToOne(() => Provincia)
  @JoinColumn({ name: 'provincia_id' })
  provincia: Provincia;

  @Column({ type: 'nvarchar', length: 80 })
  nombre: string;

  @OneToMany(() => Afiliado, (a) => a.distrito)
  afiliados: Afiliado[];
}
