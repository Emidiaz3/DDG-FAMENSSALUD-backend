// catalogos/ubigeo.controller.ts
import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { UbigeoService } from './ubigeo.service';
import { JwtAuthGuard } from 'src/seguridad/auth/jwt-auth.guard';

@Controller('catalogos/ubigeo')
@UseGuards(JwtAuthGuard)
export class UbigeoController {
  constructor(private readonly ubigeoService: UbigeoService) {}

  // GET /catalogos/ubigeo/paises
  @Get('paises')
  getPaises() {
    return this.ubigeoService.getPaises();
  }

  // GET /catalogos/ubigeo/paises/1/departamentos
  @Get('paises/:paisId/departamentos')
  getDepartamentos(@Param('paisId', ParseIntPipe) paisId: number) {
    return this.ubigeoService.getDepartamentosPorPais(paisId);
  }

  // GET /catalogos/ubigeo/departamentos/15/provincias
  @Get('departamentos/:depId/provincias')
  getProvincias(@Param('depId', ParseIntPipe) depId: number) {
    return this.ubigeoService.getProvinciasPorDepartamento(depId);
  }

  // GET /catalogos/ubigeo/provincias/3/distritos
  @Get('provincias/:provId/distritos')
  getDistritos(@Param('provId', ParseIntPipe) provId: number) {
    return this.ubigeoService.getDistritosPorProvincia(provId);
  }
}
