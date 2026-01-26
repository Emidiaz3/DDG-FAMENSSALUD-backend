// src/app.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SeguridadModule } from './seguridad/seguridad.module';
import { AfiliadosModule } from './afiliados/afiliados.module';
import { CatalogosModule } from './catalogos/catalogos.module';
import { AportesModule } from './aportes/aportes.module';
import { PrestamosModule } from './prestamos/prestamos.module';
import { MobileModule } from './mobile/mobile.module';
import { OperacionesModule } from './operaciones/operaciones.module';
import { PlanillasModule } from './planillas/planillas.module';
import { ValoresModule } from './ajustes/valores.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRoot({
      type: 'mssql',
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT) || 1433,
      username: process.env.DB_USER,
      password: process.env.DB_PASS,
      database: process.env.DB_NAME,
      entities: [__dirname + '/**/*.entity{.ts,.js}'],
      synchronize: false, // MUY IMPORTANTE: false en producción
      options: {
        encrypt: false, // ajusta según tu servidor
      },
    }),
    SeguridadModule,
    AfiliadosModule,
    CatalogosModule,
    AportesModule,
    PrestamosModule,
    MobileModule,
    OperacionesModule,
    PlanillasModule,
    ValoresModule,
  ],
})
export class AppModule {}
