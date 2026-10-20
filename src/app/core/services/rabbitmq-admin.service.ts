import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { Api } from './api';
import {
  BindingRequest,
  ExchangeRequest,
  QueueRequest,
  RabbitBinding,
  RabbitExchange,
  RabbitOverview,
  RabbitQueue,
} from '../models/campuslab.models';

/** Cliente de ms-campuslab-rabbitmq-admin (via BFF: /api/admin/rabbitmq/**, solo ADMIN). */
@Injectable({ providedIn: 'root' })
export class RabbitmqAdminService {
  private readonly api = inject(Api);
  private readonly base = '/admin/rabbitmq';

  overview(): Observable<RabbitOverview> {
    return this.api.get<RabbitOverview>(`${this.base}/overview`);
  }

  colas(): Observable<RabbitQueue[]> {
    return this.api.get<RabbitQueue[]>(`${this.base}/queues`);
  }

  crearCola(cola: QueueRequest): Observable<RabbitQueue> {
    return this.api.post<RabbitQueue>(`${this.base}/queues`, cola);
  }

  eliminarCola(nombre: string, soloSiEstaVacia: boolean): Observable<void> {
    return this.api.delete<void>(`${this.base}/queues/${encodeURIComponent(nombre)}`, { ifEmpty: soloSiEstaVacia });
  }

  exchanges(): Observable<RabbitExchange[]> {
    return this.api.get<RabbitExchange[]>(`${this.base}/exchanges`);
  }

  crearExchange(exchange: ExchangeRequest): Observable<RabbitExchange> {
    return this.api.post<RabbitExchange>(`${this.base}/exchanges`, exchange);
  }

  eliminarExchange(nombre: string, soloSiNoSeUsa: boolean): Observable<void> {
    return this.api.delete<void>(`${this.base}/exchanges/${encodeURIComponent(nombre)}`, { ifUnused: soloSiNoSeUsa });
  }

  bindings(): Observable<RabbitBinding[]> {
    return this.api.get<RabbitBinding[]>(`${this.base}/bindings`);
  }

  crearBinding(binding: BindingRequest): Observable<RabbitBinding> {
    return this.api.post<RabbitBinding>(`${this.base}/bindings`, binding);
  }

  eliminarBinding(binding: BindingRequest): Observable<void> {
    return this.api.delete<void>(`${this.base}/bindings`, {
      exchange: binding.exchange,
      queue: binding.queue,
      routingKey: binding.routingKey,
    });
  }
}
