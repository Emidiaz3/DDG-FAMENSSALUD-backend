import {
  BadRequestException,
  Body,
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { PlanillasService } from './planillas.service';
import { ConfirmarPlanillaDto } from './dto/confirmar-planilla.dto';

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
}
