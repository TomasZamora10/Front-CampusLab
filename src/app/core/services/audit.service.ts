import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { Api } from './api';
import {
  AuditEntry,
  EstadoSolicitud,
  PageResponse,
  RespuestaSolicitud,
  ResumenAuditoria,
  SolicitudInformacion,
  SolicitudInformacionRequest,
} from '../models/campuslab.models';

@Injectable({ providedIn: 'root' })
export class AuditService {
  private readonly api = inject(Api);

  listar(filtros?: { eventType?: string; reservaId?: number; desde?: string; hasta?: string; page?: number; size?: number }):
    Observable<PageResponse<AuditEntry>> {
    return this.api.get<PageResponse<AuditEntry>>('/audit', {
      eventType: filtros?.eventType,
      reservaId: filtros?.reservaId,
      desde: filtros?.desde,
      hasta: filtros?.hasta,
      page: filtros?.page ?? 0,
      size: filtros?.size ?? 20,
      sort: 'eventTimestamp,desc',
    });
  }

  timelineDeReserva(reservaId: number): Observable<PageResponse<AuditEntry>> {
    return this.api.get<PageResponse<AuditEntry>>(`/audit/reservas/${reservaId}`, {
      size: 100,
      sort: 'eventTimestamp,asc',
    });
  }

  resumen(desde?: string, hasta?: string): Observable<ResumenAuditoria> {
    return this.api.get<ResumenAuditoria>('/audit/resumen', { desde, hasta });
  }

  /** Auditor: solo las suyas. Admin: todas (opcionalmente por estado). */
  listarSolicitudes(estado?: EstadoSolicitud): Observable<PageResponse<SolicitudInformacion>> {
    return this.api.get<PageResponse<SolicitudInformacion>>('/audit/solicitudes', { estado, size: 50 });
  }

  crearSolicitud(solicitud: SolicitudInformacionRequest): Observable<SolicitudInformacion> {
    return this.api.post<SolicitudInformacion>('/audit/solicitudes', solicitud);
  }

  responderSolicitud(id: number, respuesta: RespuestaSolicitud): Observable<SolicitudInformacion> {
    return this.api.put<SolicitudInformacion>(`/audit/solicitudes/${id}/respuesta`, respuesta);
  }
}
