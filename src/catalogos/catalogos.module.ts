// src/catalogos/catalogos.module.ts
import { Module } from '@nestjs/common';
import { UbigeoModule } from './ubigeo/ubigeo.module';
import { CatalogosBasicosModule } from './basicos/catalogos-basicos.module';
import { CatalogosAdminModule } from './admin/catalogos-admin.module';

@Module({
  imports: [UbigeoModule, CatalogosBasicosModule, CatalogosAdminModule],
})
export class CatalogosModule {}
