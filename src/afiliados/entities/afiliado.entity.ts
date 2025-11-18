// src/nucleo/afiliados/entities/afiliado.entity.ts
import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { Usuario } from '../../seguridad/entities/usuario.entity'; // ajusta la ruta real

@Entity({ schema: 'nucleo', name: 'afiliado' })
export class Afiliado {
  @PrimaryGeneratedColumn()
  id: number;

  // --- Identificación ---
  @Column({ length: 10 })
  codigo_trabajador: string;

  @Column({ length: 20, nullable: true })
  doc_identidad?: string; // ← DNI aquí

  @Column({ length: 50 })
  ap_paterno: string;

  @Column({ length: 50 })
  ap_materno: string;

  @Column({ length: 80 })
  nombres: string;

  // --- Datos de contacto ---
  @Column({ length: 200, nullable: true })
  direccion?: string;

  @Column({ length: 20, nullable: true })
  telefono?: string;

  @Column({ length: 120, nullable: true })
  email?: string;

  // --- Ubicación ---
  @Column({ type: 'int', nullable: true })
  pais_id?: number;

  @Column({ type: 'int', nullable: true })
  departamento_id?: number;

  @Column({ type: 'int', nullable: true })
  provincia_id?: number;

  @Column({ type: 'int', nullable: true })
  distrito_id?: number;

  // --- Info institucional ---
  @Column({ type: 'int', nullable: true })
  base_id?: number;

  @Column({ type: 'date' })
  fecha_ingreso: Date;

  @Column({ type: 'date' })
  fecha_nacimiento: Date;

  // --- Estado ---
  @Column({ length: 20, default: 'ACTIVO' })
  estado: string;

  @Column({ type: 'date', nullable: true })
  fecha_inactivacion?: Date;

  @Column({ length: 100, nullable: true })
  motivo_inactivacion?: string;

  // --- Enlace a usuario ---
  @OneToOne(() => Usuario, { nullable: true })
  @JoinColumn({ name: 'usuario_id' })
  usuario?: Usuario;

  @Column({ type: 'int', nullable: true })
  usuario_id?: number;

  // --- Legacy ---
  @Column({ type: 'int', nullable: true })
  retiro_actual_id?: number;

  // --- Auditoría ---
  @Column({ type: 'datetime2', default: () => 'SYSDATETIME()' })
  creado_en: Date;

  @Column({ type: 'datetime2', nullable: true })
  actualizado_en?: Date;
}
