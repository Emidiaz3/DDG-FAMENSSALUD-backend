import {
  Column,
  Entity,
  ManyToOne,
  JoinColumn,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Rol } from './rol.entity';

@Entity({ schema: 'seguridad', name: 'usuario' })
export class Usuario {
  @PrimaryGeneratedColumn()
  usuario_id: number; // INT IDENTITY

  @Column({ length: 50, unique: true })
  nombre_usuario: string;

  @Column({ length: 150 })
  nombre_completo: string;

  @Column({ length: 120, nullable: true })
  correo?: string;

  @Column({ length: 50, nullable: true })
  telefono?: string;

  @ManyToOne(() => Rol)
  @JoinColumn({ name: 'rol_id' })
  rol: Rol;

  @Column({ type: 'int' })
  rol_id: number; // 👈 AHORA ES INT

  @Column({ length: 255 })
  contrasena_hash: string;

  @Column({ type: 'bit', default: true })
  es_activo: boolean;

  @Column({ type: 'datetime2', nullable: true })
  ultimo_login?: Date;

  @Column({ type: 'datetime2', default: () => 'SYSDATETIME()' })
  creado_en: Date;

  @Column({ type: 'datetime2', default: () => 'SYSDATETIME()' })
  actualizado_en: Date;

  // 👇 NUEVOS CAMPOS PARA REFRESH TOKEN
  @Column({ length: 255, nullable: true })
  refresh_token_hash?: string;

  @Column({ type: 'datetime2', nullable: true })
  refresh_token_expira_en?: Date;
}
