// src/valores/valores.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ParametroGlobal } from './entities/parametro-global.entity';
import { ActualizarParametroDto } from './dto/actualizar-parametro.dto';

@Injectable()
export class ValoresService {
  constructor(
    @InjectRepository(ParametroGlobal)
    private readonly parametroRepo: Repository<ParametroGlobal>,
  ) {}

  async listarTodos(): Promise<ParametroGlobal[]> {
    return await this.parametroRepo.find({
      where: { es_activo: true },
      order: { clave: 'ASC' },
    });
  }

  async obtenerPorClave(clave: string): Promise<ParametroGlobal> {
    const parametro = await this.parametroRepo.findOne({
      where: { clave, es_activo: true },
    });

    if (!parametro) {
      throw new NotFoundException(
        `Parámetro con clave "${clave}" no encontrado`,
      );
    }

    return parametro;
  }

  async actualizar(
    clave: string,
    dto: ActualizarParametroDto,
  ): Promise<ParametroGlobal> {
    const parametro = await this.obtenerPorClave(clave);

    // Actualizar valores
    parametro.valor = dto.valor;
    if (dto.actualizado_por) {
      parametro.actualizado_por = dto.actualizado_por;
    }

    return await this.parametroRepo.save(parametro);
  }

  async actualizarMultiples(
    parametros: ActualizarParametroDto[],
  ): Promise<{ actualizados: number; errores: string[] }> {
    const errores: string[] = [];
    let actualizados = 0;

    for (const dto of parametros) {
      try {
        await this.actualizar(dto.clave, dto);
        actualizados++;
      } catch (error) {
        errores.push(`Error al actualizar "${dto.clave}": ${error.message}`);
      }
    }

    return { actualizados, errores };
  }

  // Métodos helper para obtener valores específicos
  async obtenerValor(clave: string): Promise<string> {
    const parametro = await this.obtenerPorClave(clave);
    return parametro.valor;
  }

  async obtenerValorNumerico(clave: string): Promise<number> {
    const valor = await this.obtenerValor(clave);
    return parseFloat(valor);
  }

  // Método para obtener valores agrupados por categoría (para el frontend)
  async obtenerValoresAgrupados(): Promise<{
    ajusteGeneral: Record<string, any>;
    parametrosAfiliacion: Record<string, any>;
    parametrosPrestamosRetiro: Record<string, any>;
  }> {
    const todos = await this.listarTodos();

    const ajusteGeneral = {};
    const parametrosAfiliacion = {};
    const parametrosPrestamosRetiro = {};

    todos.forEach((param) => {
      const clave = param.clave;
      const valor = param.valor;

      // Categorizar según la clave
      if (clave.includes('IGV') || clave.includes('UIT')) {
        ajusteGeneral[clave] = { ...param };
      } else if (clave.includes('EDAD')) {
        parametrosAfiliacion[clave] = { ...param };
      } else {
        parametrosPrestamosRetiro[clave] = { ...param };
      }
    });

    return {
      ajusteGeneral,
      parametrosAfiliacion,
      parametrosPrestamosRetiro,
    };
  }
}