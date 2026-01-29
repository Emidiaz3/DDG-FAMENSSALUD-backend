// src/configuracion/empresa-config/entities/empresa-config.entity.ts
import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity({ schema: 'configuracion', name: 'empresa_config' })
export class EmpresaConfig {
  @PrimaryColumn({ name: 'empresa_config_id', type: 'int' })
  empresa_config_id: number; // siempre 1

  @Column({ type: 'nvarchar', length: 200 })
  razon_social: string;

  @Column({ type: 'nvarchar', length: 100 })
  titulo: string;

  @Column({ type: 'char', length: 11 })
  ruc: string;

  @Column({ type: 'nvarchar', length: 250, nullable: true })
  direccion?: string | null;

  @Column({ type: 'nvarchar', length: 20, nullable: true })
  numero?: string | null;

  @Column({ type: 'nvarchar', length: 30, nullable: true })
  telefono?: string | null;

  @Column({ type: 'nvarchar', length: 20, nullable: true })
  codigo_postal?: string | null;

  @Column({ type: 'nvarchar', length: 50, nullable: true })
  registro_patronal?: string | null;

  @Column({ type: 'int', nullable: true })
  departamento_id?: number | null;

  @Column({ type: 'int', nullable: true })
  provincia_id?: number | null;

  @Column({ type: 'int', nullable: true })
  distrito_id?: number | null;

  @Column({ type: 'nvarchar', length: 100, nullable: true })
  rep_apellido_paterno?: string | null;

  @Column({ type: 'nvarchar', length: 100, nullable: true })
  rep_apellido_materno?: string | null;

  @Column({ type: 'nvarchar', length: 150, nullable: true })
  rep_nombres?: string | null;

  @Column({ type: 'nvarchar', length: 500, nullable: true })
  logo_url?: string | null;

  @Column({ type: 'nvarchar', length: 500, nullable: true })
  caratula_url?: string | null;

  @Column({ type: 'datetime2', precision: 0 })
  creado_en: Date;

  @Column({ type: 'datetime2', precision: 0 })
  actualizado_en: Date;
}
