// src/auditoria/entities/log-evento.entity.ts
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Usuario } from 'src/seguridad/entities/usuario.entity';

@Entity({ schema: 'auditoria', name: 'log_evento' })
export class LogEvento {
  @PrimaryGeneratedColumn()
  id: number;

  @CreateDateColumn({ name: 'fecha_hora', type: 'datetime2' })
  fecha_hora: Date;

  @ManyToOne(() => Usuario, { nullable: true })
  @JoinColumn({ name: 'usuario_id' })
  usuario?: Usuario;

  @Column({ name: 'usuario_id', type: 'int', nullable: true })
  usuario_id?: number | null;

  @Column({ type: 'nvarchar', length: 30 })
  categoria: string;

  @Column({ type: 'nvarchar', length: 50 })
  tipo_evento: string;

  @Column({ type: 'nvarchar', length: 50, nullable: true })
  entidad_esquema?: string | null;

  @Column({ type: 'nvarchar', length: 50, nullable: true })
  entidad_tabla?: string | null;

  @Column({ type: 'nvarchar', length: 100, nullable: true })
  entidad_id?: string | null;

  @Column({ type: 'nvarchar', length: 2000, nullable: true })
  descripcion?: string | null;

  @Column({ type: 'nvarchar', nullable: true })
  datos_anteriores?: string | null;

  @Column({ type: 'nvarchar', nullable: true })
  datos_nuevos?: string | null;

  @Column({ type: 'bit' })
  es_exitoso: boolean;

  @Column({ type: 'nvarchar', length: 50, nullable: true })
  ip_origen?: string | null;

  @Column({ type: 'nvarchar', length: 200, nullable: true })
  user_agent?: string | null;
}
