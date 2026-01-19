import {
  Column,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ schema: 'configuracion', name: 'parametro_global' })
@Index('IX_parametro_global_clave', ['clave'])
export class ParametroGlobal {
  @PrimaryGeneratedColumn()
  parametro_global_id: number;

  @Column({ type: 'nvarchar', length: 100, unique: true })
  clave: string;

  @Column({ type: 'nvarchar', length: 20 })
  tipo: 'number' | 'string' | 'boolean' | 'json' | 'date';

  @Column({ type: 'nvarchar', length: 4000 })
  valor: string;

  @Column({ type: 'nvarchar', length: 300, nullable: true })
  descripcion: string | null;

  @Column({ type: 'bit', default: true })
  es_activo: boolean;

  @Column({ type: 'nvarchar', length: 100, nullable: true })
  actualizado_por: string | null;

  @CreateDateColumn({ type: 'datetime2', name: 'creado_en' })
  creado_en: Date;

  @UpdateDateColumn({ type: 'datetime2', name: 'actualizado_en' })
  actualizado_en: Date;
}
