
import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ schema: 'configuracion', name: 'parametro_global' })
export class ParametroGlobal {
  @PrimaryGeneratedColumn()
  parametro_global_id: number;

  @Column({ type: 'nvarchar', length: 100, unique: true })
  clave: string;

  @Column({ type: 'nvarchar', length: 20 })
  tipo: string; // 'number', 'text', 'percentage', 'currency'

  @Column({ type: 'nvarchar', length: 4000 })
  valor: string;

  @Column({ type: 'nvarchar', length: 300, nullable: true })
  descripcion?: string;

  @Column({ type: 'bit', default: true })
  es_activo: boolean;

  @Column({ type: 'nvarchar', length: 100, nullable: true })
  actualizado_por?: string;

  @CreateDateColumn({ type: 'datetime2' })
  creado_en: Date;

  @UpdateDateColumn({ type: 'datetime2' })
  actualizado_en: Date;
}