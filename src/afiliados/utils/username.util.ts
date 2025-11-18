// src/nucleo/afiliados/utils/username.util.ts
export function generarUsernameBase(
  nombres: string,
  apPaterno: string,
  apMaterno?: string,
): string {
  const primerNombre = nombres.split(' ')[0] ?? '';
  const base = (primerNombre + apPaterno).toLowerCase();

  // Quitar espacios y caracteres raros
  return base
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // tildes
    .replace(/[^a-z0-9]/g, ''); // solo letras/números
}
