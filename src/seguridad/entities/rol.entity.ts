import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ schema: 'seguridad', name: 'rol' })
export class Rol {
  @PrimaryGeneratedColumn()
  id: number; // INT IDENTITY

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
}
