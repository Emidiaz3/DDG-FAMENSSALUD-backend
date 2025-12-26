import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Usuario } from './usuario.entity';

@Entity({ schema: 'seguridad', name: 'rol' })
export class Rol {
  @PrimaryGeneratedColumn()
  rol_id: number; // INT IDENTITY

  @Column({ length: 100 })
  nombre: string;

  @Column({ length: 255, nullable: true })
  descripcion?: string;

  @Column({ type: 'bit', default: true })
  es_activo: boolean;

  @Column({ type: 'datetime2', default: () => 'SYSDATETIME()' })
  creado_en: Date;

  @Column({ type: 'datetime2', default: () => 'SYSDATETIME()' })
  actualizado_en: Date;

  @OneToMany(() => Usuario, (u) => u.rol)
  usuarios: Usuario[];
}
