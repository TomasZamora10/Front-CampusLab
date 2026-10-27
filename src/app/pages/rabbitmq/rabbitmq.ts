import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Observable } from 'rxjs';
import { RabbitmqAdminService } from '../../core/services/rabbitmq-admin.service';
import {
  BindingRequest,
  ExchangeRequest,
  QueueRequest,
  RabbitBinding,
  RabbitExchange,
  RabbitOverview,
  RabbitQueue,
} from '../../core/models/campuslab.models';

type Pestana = 'colas' | 'exchanges' | 'bindings';

/**
 * Panel de administracion de RabbitMQ (solo ADMIN). Consume
 * ms-campuslab-rabbitmq-admin a traves del BFF. Las reglas de negocio
 * (recursos protegidos, no recrear colas con mensajes, validacion de
 * nombres) las aplica el backend; aqui solo se muestran sus mensajes.
 */
@Component({
  imports: [FormsModule],
  selector: 'app-rabbitmq',
  styleUrl: './rabbitmq.scss',
  templateUrl: './rabbitmq.html',
})
export class Rabbitmq implements OnInit {
  private readonly rabbit = inject(RabbitmqAdminService);

  protected readonly pestana = signal<Pestana>('colas');
  protected readonly overview = signal<RabbitOverview | null>(null);
  protected readonly colas = signal<RabbitQueue[]>([]);
  protected readonly exchanges = signal<RabbitExchange[]>([]);
  protected readonly bindings = signal<RabbitBinding[]>([]);
  protected readonly cargando = signal(false);
  protected readonly guardando = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly exito = signal<string | null>(null);
  /** Clave del elemento cuyo boton "Eliminar" espera confirmacion. */
  protected readonly confirmando = signal<string | null>(null);

  // Estado de formularios: propiedades simples para [(ngModel)].
  protected nuevaCola: QueueRequest = this.colaVacia();
  protected nuevoExchange: ExchangeRequest = this.exchangeVacio();
  protected nuevoBinding: BindingRequest = this.bindingVacio();

  ngOnInit(): void {
    this.cargar();
  }

  cambiarPestana(pestana: Pestana): void {
    this.pestana.set(pestana);
    this.confirmando.set(null);
  }

  cargar(): void {
    this.cargando.set(true);
    this.error.set(null);
    this.rabbit.overview().subscribe({
      next: (o) => this.overview.set(o),
      error: (err) => this.error.set(this.mensajeError(err)),
    });
    this.rabbit.colas().subscribe({
      next: (c) => {
        this.colas.set(c);
        this.cargando.set(false);
      },
      error: (err) => {
        this.error.set(this.mensajeError(err));
        this.cargando.set(false);
      },
    });
    this.rabbit.exchanges().subscribe({
      // Los exchanges internos del broker (amq.*, default "") no se administran
      next: (e) => this.exchanges.set(e.filter((x) => x.name && !x.name.startsWith('amq.'))),
    });
    this.rabbit.bindings().subscribe({
      // El binding implicito al default exchange lo crea RabbitMQ solo
      next: (b) => this.bindings.set(b.filter((x) => x.source)),
    });
  }

  crearCola(): void {
    const cola: QueueRequest = {
      ...this.nuevaCola,
      deadLetterExchange: this.nuevaCola.deadLetterExchange || undefined,
      deadLetterRoutingKey: this.nuevaCola.deadLetterRoutingKey || undefined,
      messageTtl: this.nuevaCola.messageTtl || undefined,
    };
    this.ejecutar(this.rabbit.crearCola(cola), `Cola ${cola.name} creada.`, () => {
      this.nuevaCola = this.colaVacia();
    });
  }

  crearExchange(): void {
    this.ejecutar(this.rabbit.crearExchange(this.nuevoExchange), `Exchange ${this.nuevoExchange.name} creado.`, () => {
      this.nuevoExchange = this.exchangeVacio();
    });
  }

  crearBinding(): void {
    const b = this.nuevoBinding;
    this.ejecutar(this.rabbit.crearBinding(b), `Binding ${b.exchange} → ${b.queue} creado.`, () => {
      this.nuevoBinding = this.bindingVacio();
    });
  }

  pedirConfirmacion(clave: string): void {
    this.confirmando.set(clave);
  }

  cancelarConfirmacion(): void {
    this.confirmando.set(null);
  }

  eliminarCola(cola: RabbitQueue): void {
    this.ejecutar(this.rabbit.eliminarCola(cola.name, true), `Cola ${cola.name} eliminada.`);
  }

  /** Devuelve los mensajes de una DLQ a su cola de origen (una vez corregida la causa del fallo). */
  reprocesarDlq(cola: RabbitQueue): void {
    this.guardando.set(true);
    this.error.set(null);
    this.exito.set(null);
    this.rabbit.reprocesarDlq(cola.name).subscribe({
      next: (r) => {
        this.guardando.set(false);
        this.exito.set(r.devueltosALaDlq
          ? `${r.reprocesados} mensajes reenviados; ${r.devueltosALaDlq} volvió a ${cola.name} porque su cola de origen no lo aceptó.`
          : `${r.reprocesados} mensajes de ${cola.name} reenviados a su cola de origen.`);
        this.cargar();
      },
      error: (err) => {
        this.guardando.set(false);
        this.error.set(this.mensajeError(err));
      },
    });
  }

  eliminarExchange(exchange: RabbitExchange): void {
    this.ejecutar(this.rabbit.eliminarExchange(exchange.name, true), `Exchange ${exchange.name} eliminado.`);
  }

  eliminarBinding(binding: RabbitBinding): void {
    const request: BindingRequest = {
      exchange: binding.source,
      queue: binding.destination,
      routingKey: binding.routing_key,
    };
    this.ejecutar(this.rabbit.eliminarBinding(request),
      `Binding ${binding.source} → ${binding.destination} eliminado.`);
  }

  claveBinding(b: RabbitBinding): string {
    return `binding:${b.source}|${b.destination}|${b.routing_key}`;
  }

  /** Ejecuta una operacion de escritura, muestra su resultado y recarga las tablas. */
  private ejecutar(operacion: Observable<unknown>, mensajeExito: string, alTerminar?: () => void): void {
    this.guardando.set(true);
    this.error.set(null);
    this.exito.set(null);
    operacion.subscribe({
      next: () => {
        this.guardando.set(false);
        this.confirmando.set(null);
        this.exito.set(mensajeExito);
        alTerminar?.();
        this.cargar();
      },
      error: (err) => {
        this.guardando.set(false);
        this.confirmando.set(null);
        this.error.set(this.mensajeError(err));
      },
    });
  }

  private colaVacia(): QueueRequest {
    return { name: '', durable: true, deadLetterExchange: '', deadLetterRoutingKey: '' };
  }

  private exchangeVacio(): ExchangeRequest {
    return { name: '', type: 'direct', durable: true };
  }

  private bindingVacio(): BindingRequest {
    return { exchange: '', queue: '', routingKey: '' };
  }

  private mensajeError(err: unknown): string {
    const e = err as { status?: number; error?: { message?: string; errores?: Record<string, string> | string[] } };
    if (e?.status === 401) return 'Sesión expirada, vuelve a iniciar sesión.';
    if (e?.status === 403) return 'La administración de RabbitMQ es solo para Admin.';
    if (e?.status === 502) return 'RabbitMQ no está disponible en este momento.';
    const errores = e?.error?.errores;
    if (errores) {
      const detalle = Array.isArray(errores)
        ? errores
        : Object.entries(errores).map(([campo, msg]) => `${campo}: ${msg}`);
      return `${e.error?.message ?? 'Solicitud inválida'} — ${detalle.join('; ')}`;
    }
    return e?.error?.message ?? 'No fue posible completar la operación.';
  }
}
