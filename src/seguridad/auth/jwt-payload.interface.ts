// src/seguridad/auth/jwt-payload.interface.ts
export interface JwtPayload {
  sub: number;
  username: string;
  rolId: number;
  afiliadoId?: number | null;
}
