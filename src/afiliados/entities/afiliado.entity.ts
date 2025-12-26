// src/nucleo/afiliados/entities/afiliado.entity.ts
import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
  OneToOne,
  JoinColumn,
  UpdateDateColumn,
  OneToMany,
  ManyToOne,
} from 'typeorm';
import { Usuario } from '../../seguridad/entities/usuario.entity'; // ajusta la ruta real
import { AfiliadoCuentaBancaria } from './afiliado-cuenta-bancaria.entity';
import { AfiliadoSobreBeneficiario } from './afiliado-sobre-beneficiario.entity';
import { AfiliacionHistorial } from './afiliacion-historial.entity';
import { Pais } from 'src/catalogos/entities/pais.entity';
import { Departamento } from 'src/catalogos/entities/departamento.entity';
import { Provincia } from 'src/catalogos/entities/provincia.entity';
import { Distrito } from 'src/catalogos/entities/distrito.entity';
import { Base } from 'src/catalogos/entities/base.entity';
import { RegimenLaboral } from 'src/catalogos/entities/regimen-laboral.entity';
import { Exceso } from 'src/operaciones/entities/exceso.entity';
import { Devolucion } from 'src/operaciones/entities/devolucion.entity';
import { Retiro } from './retiro.entity';

@Entity({ schema: 'nucleo', name: 'afiliado' })
export class Afiliado {
  @PrimaryGeneratedColumn()
  afiliado_id: number;

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

  @Column({ type: 'int', nullable: true })
  regimen_laboral_id?: number;

  @Column({ type: 'date' })
  fecha_ingreso: Date;

  @Column({ type: 'date' })
  fecha_nacimiento: Date;

  // --- Estado ---
  @Column({ type: 'bit' })
  estado: boolean;

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

  @UpdateDateColumn({ type: 'datetime2', nullable: true })
  actualizado_en?: Date;

  // 👇 HISTÓRICO DE CUENTAS BANCARIAS
  @OneToMany(() => AfiliadoCuentaBancaria, (cb) => cb.afiliado)
  cuentas_bancarias: AfiliadoCuentaBancaria[];

  @OneToMany(() => AfiliadoSobreBeneficiario, (s) => s.afiliado)
  sobres_beneficiario: AfiliadoSobreBeneficiario[];

  @OneToMany(() => AfiliacionHistorial, (h) => h.afiliado)
  afiliaciones?: AfiliacionHistorial[];

  // ------------------------
  // Relaciones a catálogos
  // ------------------------
  @ManyToOne(() => Pais, (p) => p.afiliados, { nullable: true })
  @JoinColumn({ name: 'pais_id' })
  pais: Pais;

  @ManyToOne(() => Departamento, (d) => d.afiliados, { nullable: true })
  @JoinColumn({ name: 'departamento_id' })
  departamento: Departamento;

  @ManyToOne(() => Provincia, (p) => p.afiliados, { nullable: true })
  @JoinColumn({ name: 'provincia_id' })
  provincia: Provincia;

  @ManyToOne(() => Distrito, (d) => d.afiliados, { nullable: true })
  @JoinColumn({ name: 'distrito_id' })
  distrito: Distrito;

  @ManyToOne(() => Base, (b) => b.afiliados, { nullable: true })
  @JoinColumn({ name: 'base_id' })
  base: Base;

  @ManyToOne(() => RegimenLaboral, (r) => r.afiliados, { nullable: true })
  @JoinColumn({ name: 'regimen_laboral_id' })
  regimen_laboral: RegimenLaboral;

  @OneToMany(() => Exceso, (e) => e.afiliado)
  excesos: Exceso[];

  @OneToMany(() => Devolucion, (d) => d.afiliado)
  devoluciones: Devolucion[];

  @OneToMany(() => Retiro, (r) => r.afiliado)
  retiros: Retiro[];
}
