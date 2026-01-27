// src/catalogos/catalogos.module.ts
import { Module } from '@nestjs/common';
import { UbigeoModule } from './ubigeo/ubigeo.module';
import { CatalogosBasicosModule } from './basicos/catalogos-basicos.module';
import { CatalogosAdminModule } from './admin/catalogos-admin.module';
import { MotivoRetiroModule } from './motivo-retiro/motivo-retiro.module';

@Module({
  imports: [
    UbigeoModule,
    CatalogosBasicosModule,
    CatalogosAdminModule,
    MotivoRetiroModule,
  ],
})
export class CatalogosModule {}
