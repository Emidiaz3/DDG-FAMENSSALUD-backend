export interface UsuarioListItemDto {
  usuario_id: number;
  nombre_usuario: string;
  nombre_completo: string;
  correo: string | null;
  telefono: string | null;
  rol_id: number;
  rol_nombre: string;
  es_activo: boolean;
  creado_en: string; // YYYY-MM-DD
}
