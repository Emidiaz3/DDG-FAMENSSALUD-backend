// src/configuracion/empresa-config/empresa-config.controller.ts
import { Body, Controller, Get, Put, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../seguridad/auth/jwt-auth.guard';
import { ApiResponse } from 'src/common/decorator/custom-api-response.decorator';
import { EmpresaConfigService } from './empresa-config.service';
import { UpdateEmpresaConfigDto } from './dto/update-empresa-config.dto';

@Controller('empresa-config')
@UseGuards(JwtAuthGuard)
export class EmpresaConfigController {
  constructor(private readonly service: EmpresaConfigService) {}

  @Get()
  @ApiResponse()
  async get() {
    const data = await this.service.get();
    return { status: 'success', data };
  }

  @Put()
  @ApiResponse()
  async update(@Body() dto: UpdateEmpresaConfigDto) {
    const data = await this.service.update(dto);
    return {
      status: 'success',
      data,
      message: 'Datos de la empresa actualizados correctamente',
    };
  }
}
