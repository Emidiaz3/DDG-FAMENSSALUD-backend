import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Rol } from './rol.entity';
import { Modulo } from './modulo.entity';

@Entity({ schema: 'seguridad', name: 'rol_modulo_permiso' })
export class RolModuloPermiso {
  @PrimaryGeneratedColumn()
  id: number; // INT

  @ManyToOne(() => Rol)
  @JoinColumn({ name: 'rol_id' })
  rol: Rol;

  @Column({ type: 'int' })
  rol_id: number;

  @ManyToOne(() => Modulo)
  @JoinColumn({ name: 'modulo_id' })
  modulo: Modulo;

  @Column({ type: 'int' })
  modulo_id: number;

  @Column({ type: 'bit', default: false })
  puede_ver: boolean;

  @Column({ type: 'bit', default: false })
  puede_crear: boolean;

  @Column({ type: 'bit', default: false })
  puede_editar: boolean;

  @Column({ type: 'bit', default: false })
  puede_eliminar: boolean;

  @Column({ type: 'bit', default: true })
  es_activo: boolean;

  @Column({ type: 'datetime2', default: () => 'SYSDATETIME()' })
  creado_en: Date;

  @Column({ type: 'datetime2', default: () => 'SYSDATETIME()' })
  actualizado_en: Date;
}
