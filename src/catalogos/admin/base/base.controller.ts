// src/catalogos/base/base.controller.ts
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from 'src/seguridad/auth/jwt-auth.guard';
import { getClientIp } from 'src/auditoria/utils/ip';
import { ok } from 'src/common/utils/api-response.util';
import { BaseService } from './base.service';
import { ListarBasesQueryDto } from './dto/listar-bases-query.dto';
import { PaginatedResponse } from 'src/common/interfaces/api-response.interface';
import { okPaginated } from 'src/common/utils/pagination.util';

type CrearBaseDto = {
  nombre: string;
  codigo?: string;
  departamento_id?: number;
};
type ActualizarBaseDto = Partial<CrearBaseDto>;

@UseGuards(JwtAuthGuard)
@Controller('catalogos/bases')
export class BaseController {
  constructor(private readonly service: BaseService) {}

  @Get()
  async listar(@Query('departamento_id') departamento_id?: string) {
    const depId = departamento_id ? Number(departamento_id) : undefined;
    const data = await this.service.listar(depId);
    return ok(data.data, 'Lista de bases recuperada exitosamente');
  }

  @Get('paginado')
  async listarPaginado(
    @Query() query: ListarBasesQueryDto,
  ): Promise<PaginatedResponse<any>> {
    const page = Number(query.page ?? 1);
    const limit = Number(query.limit ?? 25);
    const safePage = Number.isFinite(page) && page > 0 ? page : 1;
    const safeLimit = Number.isFinite(limit) && limit > 0 ? limit : 25;

    const { items, total } = await this.service.listarPaginado({
      page: safePage,
      limit: safeLimit,
      search: query.search,
      departamento_id: query.departamento_id,
    });

    return okPaginated(
      items,
      total,
      safePage,
      safeLimit,
      'Lista paginada de bases recuperada exitosamente',
    );
  }

  @Post()
  async crear(@Body() dto: CrearBaseDto, @Req() req: any) {
    const ctx = {
      usuario_id: req?.user?.id ?? null,
      ip_origen: getClientIp(req),
      user_agent: req?.headers?.['user-agent'] ?? null,
    };
    const result = await this.service.crear(dto, ctx);
    return ok(result.data, 'Base creada exitosamente');
  }

  @Post(':id')
  async actualizar(
    @Param('id') id: string,
    @Body() dto: ActualizarBaseDto,
    @Req() req: any,
  ) {
    const ctx = {
      usuario_id: req?.user?.id ?? null,
      ip_origen: getClientIp(req),
      user_agent: req?.headers?.['user-agent'] ?? null,
    };
    const result = await this.service.actualizar(Number(id), dto, ctx);
    return ok(result.data, 'Base actualizada exitosamente');
  }

  @Delete(':id')
  async eliminar(@Param('id') id: string, @Req() req: any) {
    const ctx = {
      usuario_id: req?.user?.id ?? null,
      ip_origen: getClientIp(req),
      user_agent: req?.headers?.['user-agent'] ?? null,
    };
    const result = await this.service.eliminar(Number(id), ctx);
    return ok(result, 'Base eliminada exitosamente');
  }
}
