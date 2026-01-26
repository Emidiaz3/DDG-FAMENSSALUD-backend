import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Param,
  Post,
  Req,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { PlanillasService } from './planillas.service';
import { ConfirmarPlanillaDto } from './dto/confirmar-planilla.dto';
import { getClientIp } from 'src/auditoria/utils/ip';

@Controller('planillas')
export class PlanillasController {
  constructor(private readonly service: PlanillasService) {}

  @Post('preview')
  @UseInterceptors(FileInterceptor('file'))
  async preview(@UploadedFile() file: Express.Multer.File) {
    if (!file?.buffer) {
      throw new BadRequestException({
        status: 'error',
        message: 'Debe enviar un archivo Excel en el campo "file".',
      });
    }

    const data = await this.service.previewExcel(file.buffer /*, ctx */);

    return {
      status: 'success',
      message: 'Previsualización de planilla',
      data,
    };
  }

  @Post('confirm')
  async confirm(@Body() dto: ConfirmarPlanillaDto) {
    return this.service.confirm(dto /*, ctx */);
  }

  @Delete('preview/:token')
  cancelPreview(@Param('token') token: string, @Req() req: any) {
    // arma ctx como tú lo haces en otros endpoints
    const ctx = {
      usuario_id: req.user?.id ?? null,
      ip_origen: getClientIp(req),
      user_agent: req.headers['user-agent'] ?? null,
    };

    return this.service.cancelPreview(token, ctx);
  }
}
