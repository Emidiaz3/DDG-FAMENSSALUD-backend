// src/afiliados/entities/afiliado-cuenta-bancaria.entity.ts
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Afiliado } from './afiliado.entity';
import { Banco } from 'src/catalogos/entities/banco.entity';
import { Moneda } from 'src/catalogos/entities/moneda.entity';

@Entity({ name: 'afiliado_cuenta_bancaria', schema: 'nucleo' })
export class AfiliadoCuentaBancaria {
  @PrimaryGeneratedColumn()
  afiliado_cuenta_id: number;

  // ------- Afiliado -------
  @ManyToOne(() => Afiliado, (a) => a.cuentas_bancarias, {
    onDelete: 'CASCADE', // si se borra el afiliado, se borran sus cuentas
  })
  @JoinColumn({ name: 'afiliado_id' })
  afiliado: Afiliado;

  @Column()
  afiliado_id: number;

  // ------- Banco -------
  @ManyToOne(() => Banco)
  @JoinColumn({ name: 'banco_id' })
  banco: Banco;

  @Column()
  banco_id: number;

  // ------- Moneda -------
  @ManyToOne(() => Moneda)
  @JoinColumn({ name: 'moneda_id' })
  moneda: Moneda;

  @Column()
  moneda_id: number;

  // ------- Datos de la cuenta -------
  @Column({ type: 'nvarchar', length: 50 })
  nro_cuenta: string;

  @Column({ type: 'bit', default: true })
  es_activa: boolean;
}
