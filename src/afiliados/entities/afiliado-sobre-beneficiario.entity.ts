// src/afiliados/entities/afiliado-sobre-beneficiario.entity.ts
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Afiliado } from './afiliado.entity';

@Entity({ name: 'afiliado_sobre_beneficiario', schema: 'nucleo' })
export class AfiliadoSobreBeneficiario {
  @PrimaryGeneratedColumn()
  afiliado_sobre_id: number;

  @ManyToOne(() => Afiliado, (a) => a.sobres_beneficiario, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'afiliado_id' })
  afiliado: Afiliado;

  @Column()
  afiliado_id: number;

  @Column({ type: 'date' })
  fecha_recepcion: Date;

  @Column({ type: 'bit' })
  en_buen_estado: boolean;

  @Column({ type: 'nvarchar', length: 255, nullable: true })
  observacion?: string;

  @Column({ type: 'bit', default: true })
  es_activo: boolean;
}
