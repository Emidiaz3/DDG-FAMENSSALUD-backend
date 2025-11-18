import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Afiliado } from './entities/afiliado.entity';
import { UsuarioService } from 'src/seguridad/usuario.service';
import { CrearAfiliadoDto } from './dto/crear-afiliado.dto';

@Injectable()
export class AfiliadosService {
  constructor(
    @InjectRepository(Afiliado)
    private readonly afiliadoRepo: Repository<Afiliado>,
    private readonly usuarioService: UsuarioService,
    private readonly dataSource: DataSource, // para transacción
  ) {}

  async listarTodos(): Promise<Afiliado[]> {
    return this.afiliadoRepo.find({
      where: { estado: 'ACTIVO' }, // Ejemplo: traer solo activos por defecto
      order: { ap_paterno: 'ASC' }, // Ordenar alfabéticamente
    });
  }

  async findById(id: number): Promise<Afiliado | null> {
    return this.afiliadoRepo.findOne({ where: { id } });
  }

  async crear(dto: CrearAfiliadoDto): Promise<Afiliado> {
    // Opcional pero recomendado: transacción
    return this.dataSource.transaction(async (manager) => {
      const afiliado = manager.create(Afiliado, {
        codigo_trabajador: dto.codigo_trabajador,
        doc_identidad: dto.doc_identidad,
        ap_paterno: dto.ap_paterno,
        ap_materno: dto.ap_materno,
        nombres: dto.nombres,
        direccion: dto.direccion,
        telefono: dto.telefono,
        email: dto.email,
        pais_id: dto.pais_id,
        departamento_id: dto.departamento_id,
        provincia_id: dto.provincia_id,
        distrito_id: dto.distrito_id,
        base_id: dto.base_id,
        fecha_ingreso: dto.fecha_ingreso,
        fecha_nacimiento: dto.fecha_nacimiento,
        estado: 'ACTIVO',
      });

      const afiliadoGuardado = await manager.save(afiliado);

      // Crear usuario para este afiliado
      const usuario =
        await this.usuarioService.crearUsuarioParaAfiliado(afiliadoGuardado);

      afiliadoGuardado.usuario_id = usuario.id;
      afiliadoGuardado.usuario = usuario;

      return manager.save(afiliadoGuardado);
    });
  }
}
