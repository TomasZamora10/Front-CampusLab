export type ResourceType = 'LABORATORIO' | 'EQUIPO' | 'INSUMO';

export interface CatalogResource {
  id?: number;
  name: string;
  resourceType: ResourceType;
  description?: string;
  location?: string;
  stockCupo: number;
  createdAt?: string;
  updatedAt?: string;
}

export type EstadoReserva =
  | 'SOLICITADA'
  | 'APROBADA'
  | 'EN_PREPARACION'
  | 'EN_USO'
  | 'DEVUELTA'
  | 'CANCELADA';

export interface Reserva {
  id: number;
  recursoId: number;
  usuarioSolicitanteId: number;
  estado: EstadoReserva;
  fechaInicio: string;
  fechaFin: string;
  observaciones?: string;
  aprobadoPor?: number;
  fechaAprobacion?: string;
  motivoCancelacion?: string;
  fechaCreacion: string;
  fechaActualizacion?: string;
}

export interface ReservaRequest {
  recursoId: number;
  fechaInicio: string;
  fechaFin: string;
  observaciones?: string;
}

export interface CambioEstadoRequest {
  nuevoEstado: EstadoReserva;
  motivoCancelacion?: string;
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

export interface AuditEntry {
  id: number;
  eventId: string;
  eventType: string;
  reservaId: number;
  recursoId?: number;
  usuarioId?: number;
  estado?: string;
  traceId?: string;
  correlationId?: string;
  eventTimestamp: string;
  recibidoEn: string;
  /** Payload del evento: aprobadoPor, fechaAprobacion, motivoCancelacion, fechas de la reserva... */
  detalle?: Record<string, unknown>;
}

export interface ResumenAuditoria {
  desde: string;
  hasta: string;
  totalEventos: number;
  reservasInvolucradas: number;
  eventosPorTipo: Record<string, number>;
}

export type CategoriaSolicitud = 'RESERVAS' | 'CANCELACIONES' | 'APROBACIONES' | 'INVENTARIO' | 'ACCESOS' | 'OTRO';
export type EstadoSolicitud = 'PENDIENTE' | 'RESPONDIDA' | 'RECHAZADA';

export interface SolicitudInformacionRequest {
  categoria: CategoriaSolicitud | '';
  asunto: string;
  descripcion: string;
  reservaId?: number | null;
  periodoDesde?: string;
  periodoHasta?: string;
}

export interface SolicitudInformacion {
  id: number;
  solicitanteNombre?: string;
  categoria: CategoriaSolicitud;
  asunto: string;
  descripcion: string;
  reservaId?: number;
  periodoDesde?: string;
  periodoHasta?: string;
  estado: EstadoSolicitud;
  respuesta?: string;
  respondidaPor?: string;
  creadaEn: string;
  respondidaEn?: string;
}

export interface RespuestaSolicitud {
  estado: Exclude<EstadoSolicitud, 'PENDIENTE'>;
  respuesta: string;
}

export interface Kpis {
  totalReservas: number;
  porEstado: Record<string, number>;
  tasaAprobacion: number;
  tasaCancelacion: number;
}

export interface TopResource {
  recursoId: number;
  cantidadReservas: number;
}

// --- Administracion de RabbitMQ (ms-campuslab-rabbitmq-admin) ---
// Los campos de respuesta usan snake_case tal como los entrega la
// Management API de RabbitMQ (el microservicio los reenvia sin renombrar).

export interface RabbitOverview {
  rabbitmq_version: string;
  cluster_name: string;
  queue_totals?: { messages: number; messages_ready: number; messages_unacknowledged: number };
  object_totals?: { queues: number; exchanges: number; connections: number; consumers: number };
}

export interface RabbitQueue {
  name: string;
  state?: string;
  messages?: number;
  messages_ready?: number;
  messages_unacknowledged?: number;
  consumers?: number;
  durable?: boolean;
  auto_delete?: boolean;
  arguments?: Record<string, unknown>;
}

export interface RabbitExchange {
  name: string;
  type: string;
  durable?: boolean;
  auto_delete?: boolean;
  internal?: boolean;
}

export interface RabbitBinding {
  source: string;
  destination: string;
  destination_type: string;
  routing_key: string;
  properties_key?: string;
}

export type RabbitExchangeType = 'direct' | 'fanout' | 'topic' | 'headers';

export interface QueueRequest {
  name: string;
  durable: boolean;
  autoDelete?: boolean;
  deadLetterExchange?: string;
  deadLetterRoutingKey?: string;
  messageTtl?: number;
  maxLength?: number;
}

export interface ExchangeRequest {
  name: string;
  type: RabbitExchangeType;
  durable: boolean;
  autoDelete?: boolean;
  internal?: boolean;
}

export interface BindingRequest {
  exchange: string;
  queue: string;
  routingKey: string;
}
