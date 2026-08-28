export type Modo = "bloque" | "libre";
export type EstadoSesion = "activa" | "cobrada" | "cancelada";

export interface Mesa {
  id: number;
  nombre: string;
  historico_total: number;
}

export interface Sesion {
  id: string;
  mesa_id: number;
  modo: Modo;
  inicio: string;
  fin: string | null;
  minutos: number | null;
  minutos_asignados: number | null;
  monto: number | null;
  estado: EstadoSesion;
  fecha: string;
  created_at: string;
}

export interface CierreCaja {
  id: string;
  fecha: string;
  total: number;
  cantidad_cobros: number;
  closed_at: string;
}
