import { DatePipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { AuditService } from '../../core/services/audit.service';
import {
  AuditEntry,
  CategoriaSolicitud,
  EstadoSolicitud,
  RespuestaSolicitud,
  ResumenAuditoria,
  SolicitudInformacion,
  SolicitudInformacionRequest,
} from '../../core/models/campuslab.models';

type Pestana = 'resumen' | 'eventos' | 'cancelaciones' | 'solicitudes';

export const TIPOS_DE_EVENTO: Record<string, string> = {
  RESERVA_CREADA: 'Reserva creada',
  RESERVA_APROBADA: 'Reserva aprobada',
  RESERVA_EN_PREPARACION: 'En preparación',
  RESERVA_EN_USO: 'En uso (entregada)',
  RESERVA_DEVUELTA: 'Devuelta',
  RESERVA_CANCELADA: 'Cancelada',
};

export const CATEGORIAS: Record<CategoriaSolicitud, string> = {
  RESERVAS: 'Reservas',
  CANCELACIONES: 'Cancelaciones',
  APROBACIONES: 'Aprobaciones',
  INVENTARIO: 'Inventario / stock',
  ACCESOS: 'Accesos y usuarios',
  OTRO: 'Otro',
};

/**
 * Panel del Auditor (y Admin): resumen del periodo, timeline de eventos
 * con su detalle, cancelaciones con su justificacion y un formulario para
 * pedir informacion que falte. El Admin ve y responde esas solicitudes.
 */
@Component({
  imports: [DatePipe, FormsModule],
  selector: 'app-audit',
  styleUrl: './audit.scss',
  templateUrl: './audit.html',
})
export class Audit implements OnInit {
  protected readonly auth = inject(AuthService);
  private readonly auditService = inject(AuditService);

  readonly TIPOS_DE_EVENTO = TIPOS_DE_EVENTO;
  readonly CATEGORIAS = CATEGORIAS;
  readonly tiposDeEvento = Object.keys(TIPOS_DE_EVENTO);
  readonly categorias = Object.keys(CATEGORIAS) as CategoriaSolicitud[];

  protected readonly pestana = signal<Pestana>('resumen');
  protected readonly error = signal<string | null>(null);
  protected readonly exito = signal<string | null>(null);

  // --- Resumen
  protected readonly resumen = signal<ResumenAuditoria | null>(null);
  protected readonly diasResumen = signal(30);

  // --- Eventos / cancelaciones
  protected readonly entradas = signal<AuditEntry[]>([]);
  protected readonly cancelaciones = signal<AuditEntry[]>([]);
  protected readonly cargando = signal(false);
  protected readonly pagina = signal(0);
  protected readonly totalPaginas = signal(0);
  protected filtros = { eventType: '', reservaId: '', desde: '', hasta: '' };

  // --- Solicitudes de informacion
  protected readonly solicitudes = signal<SolicitudInformacion[]>([]);
  protected readonly enviando = signal(false);
  protected readonly erroresFormulario = signal<Record<string, string>>({});
  protected readonly filtroEstadoSolicitud = signal<EstadoSolicitud | ''>('PENDIENTE');
  protected readonly respondiendoId = signal<number | null>(null);
  protected nuevaSolicitud: SolicitudInformacionRequest = this.solicitudVacia();
  protected respuesta: RespuestaSolicitud = { estado: 'RESPONDIDA', respuesta: '' };

  ngOnInit(): void {
    this.cargarResumen();
  }

  esAdmin(): boolean {
    return this.auth.tieneAlgunRol('ADMIN');
  }

  cambiarPestana(pestana: Pestana): void {
    this.pestana.set(pestana);
    this.error.set(null);
    this.exito.set(null);
    if (pestana === 'resumen') this.cargarResumen();
    if (pestana === 'eventos') this.buscarEventos(0);
    if (pestana === 'cancelaciones') this.cargarCancelaciones();
    if (pestana === 'solicitudes') this.cargarSolicitudes();
  }

  /** Lleva a "Solicitudes" con el formulario precargado (desde un evento o el resumen). */
  pedirInformacionSobre(categoria: CategoriaSolicitud, reservaId?: number): void {
    this.nuevaSolicitud = { ...this.solicitudVacia(), categoria, reservaId: reservaId ?? null };
    if (reservaId) {
      this.nuevaSolicitud.asunto = `Información adicional de la reserva #${reservaId}`;
    }
    this.cambiarPestana('solicitudes');
  }

  // ------------------------------------------------------------- resumen

  cambiarDiasResumen(dias: number): void {
    this.diasResumen.set(dias);
    this.cargarResumen();
  }

  cargarResumen(): void {
    const desde = new Date(Date.now() - this.diasResumen() * 24 * 3600 * 1000).toISOString();
    this.auditService.resumen(desde).subscribe({
      next: (r) => this.resumen.set(r),
      error: (err) => this.error.set(this.mensajeError(err)),
    });
  }

  tiposDelResumen(): { tipo: string; cantidad: number }[] {
    const porTipo = this.resumen()?.eventosPorTipo ?? {};
    return Object.entries(porTipo).map(([tipo, cantidad]) => ({ tipo, cantidad }));
  }

  cantidadDe(tipo: string): number {
    return this.resumen()?.eventosPorTipo?.[tipo] ?? 0;
  }

  // ------------------------------------------------------------- eventos

  buscarEventos(pagina = 0): void {
    this.cargando.set(true);
    this.error.set(null);
    const reservaId = Number(this.filtros.reservaId);
    this.auditService.listar({
      eventType: this.filtros.eventType || undefined,
      reservaId: reservaId > 0 ? reservaId : undefined,
      desde: this.filtros.desde ? `${this.filtros.desde}T00:00:00Z` : undefined,
      hasta: this.filtros.hasta ? `${this.filtros.hasta}T23:59:59Z` : undefined,
      page: pagina,
      size: 25,
    }).subscribe({
      next: (p) => {
        this.entradas.set(p.content);
        this.pagina.set(p.number);
        this.totalPaginas.set(p.totalPages);
        this.cargando.set(false);
      },
      error: (err) => {
        this.error.set(this.mensajeError(err));
        this.cargando.set(false);
      },
    });
  }

  limpiarFiltros(): void {
    this.filtros = { eventType: '', reservaId: '', desde: '', hasta: '' };
    this.buscarEventos(0);
  }

  verTimeline(reservaId: number): void {
    this.filtros = { eventType: '', reservaId: String(reservaId), desde: '', hasta: '' };
    this.cambiarPestana('eventos');
  }

  /** Datos del payload que importan al auditor, en texto corto. */
  resumenDetalle(entrada: AuditEntry): string {
    const d = entrada.detalle ?? {};
    const partes: string[] = [];
    if (d['aprobadoPor']) partes.push(`aprobada por usuario #${d['aprobadoPor']}`);
    if (d['motivoCancelacion']) partes.push(`motivo: “${d['motivoCancelacion']}”`);
    if (d['usuarioSolicitanteId']) partes.push(`solicitante #${d['usuarioSolicitanteId']}`);
    return partes.join(' · ') || '—';
  }

  /** Descarga en CSV las filas que se estan viendo (eventos o cancelaciones). */
  exportarCsv(filas: AuditEntry[], nombre: string): void {
    const columnas = ['fecha', 'evento', 'reserva', 'recurso', 'usuario', 'estado', 'aprobadoPor', 'motivoCancelacion', 'eventId'];
    const escapar = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const lineas = filas.map((e) => [
      e.eventTimestamp, e.eventType, e.reservaId, e.recursoId, e.usuarioId, e.estado,
      e.detalle?.['aprobadoPor'], e.detalle?.['motivoCancelacion'], e.eventId,
    ].map(escapar).join(','));
    const blob = new Blob(['﻿' + [columnas.join(','), ...lineas].join('\n')], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${nombre}-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  cargarCancelaciones(): void {
    this.cargando.set(true);
    this.auditService.listar({ eventType: 'RESERVA_CANCELADA', size: 100 }).subscribe({
      next: (p) => {
        this.cancelaciones.set(p.content);
        this.cargando.set(false);
      },
      error: (err) => {
        this.error.set(this.mensajeError(err));
        this.cargando.set(false);
      },
    });
  }

  // --------------------------------------------------------- solicitudes

  cargarSolicitudes(): void {
    const estado = this.esAdmin() ? this.filtroEstadoSolicitud() || undefined : undefined;
    this.auditService.listarSolicitudes(estado).subscribe({
      next: (p) => this.solicitudes.set(p.content),
      error: (err) => this.error.set(this.mensajeError(err)),
    });
  }

  cambiarFiltroSolicitudes(estado: EstadoSolicitud | ''): void {
    this.filtroEstadoSolicitud.set(estado);
    this.cargarSolicitudes();
  }

  enviarSolicitud(): void {
    const errores = this.validarSolicitud(this.nuevaSolicitud);
    this.erroresFormulario.set(errores);
    if (Object.keys(errores).length) {
      return;
    }
    this.enviando.set(true);
    this.error.set(null);
    this.exito.set(null);
    const s = this.nuevaSolicitud;
    this.auditService.crearSolicitud({
      ...s,
      asunto: s.asunto.trim(),
      descripcion: s.descripcion.trim(),
      reservaId: s.reservaId ? Number(s.reservaId) : null,
      periodoDesde: s.periodoDesde || undefined,
      periodoHasta: s.periodoHasta || undefined,
    }).subscribe({
      next: (creada) => {
        this.enviando.set(false);
        this.exito.set(`Solicitud #${creada.id} enviada. Verás la respuesta aquí cuando un administrador la atienda.`);
        this.nuevaSolicitud = this.solicitudVacia();
        this.cargarSolicitudes();
      },
      error: (err) => {
        this.enviando.set(false);
        const errores = (err as { error?: { errores?: Record<string, string> } })?.error?.errores;
        if (errores) this.erroresFormulario.set(errores);
        this.error.set(this.mensajeError(err));
      },
    });
  }

  abrirRespuesta(solicitud: SolicitudInformacion): void {
    this.respondiendoId.set(solicitud.id);
    this.respuesta = { estado: 'RESPONDIDA', respuesta: '' };
  }

  cancelarRespuesta(): void {
    this.respondiendoId.set(null);
  }

  enviarRespuesta(solicitud: SolicitudInformacion): void {
    if (!this.respuesta.respuesta.trim()) {
      return;
    }
    this.auditService.responderSolicitud(solicitud.id, {
      ...this.respuesta,
      respuesta: this.respuesta.respuesta.trim(),
    }).subscribe({
      next: () => {
        this.respondiendoId.set(null);
        this.exito.set(`Solicitud #${solicitud.id} ${this.respuesta.estado === 'RESPONDIDA' ? 'respondida' : 'rechazada'}.`);
        this.cargarSolicitudes();
      },
      error: (err) => this.error.set(this.mensajeError(err)),
    });
  }

  claseEstado(estado: EstadoSolicitud): string {
    return estado === 'PENDIENTE' ? 'text-bg-warning' : estado === 'RESPONDIDA' ? 'text-bg-success' : 'text-bg-secondary';
  }

  private validarSolicitud(s: SolicitudInformacionRequest): Record<string, string> {
    const errores: Record<string, string> = {};
    if (!s.categoria) errores['categoria'] = 'elige una categoría';
    if (s.asunto.trim().length < 5) errores['asunto'] = 'el asunto debe tener al menos 5 caracteres';
    if (s.descripcion.trim().length < 20) errores['descripcion'] = 'describe lo que necesitas (mínimo 20 caracteres)';
    if (s.periodoDesde && s.periodoHasta && s.periodoHasta < s.periodoDesde) {
      errores['periodoHasta'] = 'no puede ser anterior a la fecha "desde"';
    }
    return errores;
  }

  private solicitudVacia(): SolicitudInformacionRequest {
    return { categoria: '', asunto: '', descripcion: '', reservaId: null, periodoDesde: '', periodoHasta: '' };
  }

  private mensajeError(err: unknown): string {
    const e = err as { status?: number; error?: { mensaje?: string; message?: string } };
    if (e?.status === 401) return 'Sesión expirada, vuelve a iniciar sesión.';
    if (e?.status === 403) return 'La auditoría es solo para Admin/Auditor.';
    return e?.error?.mensaje ?? e?.error?.message ?? 'No fue posible completar la operación.';
  }
}
