import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { Rabbitmq } from './rabbitmq';
import { RabbitmqAdminService } from '../../core/services/rabbitmq-admin.service';

describe('Rabbitmq', () => {
  const servicio = {
    overview: () => of({ rabbitmq_version: '3.13.0', cluster_name: 'campuslab' }),
    colas: () => of([{ name: 'q.cmd.email', messages: 0 }]),
    exchanges: () => of([{ name: 'cmd.direct', type: 'direct' }, { name: 'amq.topic', type: 'topic' }, { name: '', type: 'direct' }]),
    bindings: () => of([{ source: '', destination: 'q.cmd.email', destination_type: 'queue', routing_key: 'q.cmd.email' }]),
    crearCola: () => throwError(() => ({
      status: 400,
      error: { message: 'Solicitud invalida', errores: { name: 'el nombre de la cola es obligatorio' } },
    })),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Rabbitmq],
      providers: [{ provide: RabbitmqAdminService, useValue: servicio }],
    }).compileComponents();
  });

  it('carga colas y oculta exchanges internos y bindings implicitos', async () => {
    const fixture = TestBed.createComponent(Rabbitmq);
    fixture.detectChanges();
    await fixture.whenStable();
    const c = fixture.componentInstance as unknown as Record<string, () => unknown[]>;

    expect(c['colas']().length).toBe(1);
    expect(c['exchanges']().length).toBe(1);
    expect(c['bindings']().length).toBe(0);
  });

  it('muestra el detalle de validacion que devuelve el backend', async () => {
    const fixture = TestBed.createComponent(Rabbitmq);
    fixture.detectChanges();
    const c = fixture.componentInstance as unknown as { crearCola(): void; error(): string | null };

    c.crearCola();

    expect(c.error()).toContain('el nombre de la cola es obligatorio');
  });
});
