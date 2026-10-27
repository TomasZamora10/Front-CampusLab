import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpTestingController } from '@angular/common/http/testing';
import { Audit } from './audit';
import { AuthService } from '../../core/services/auth.service';
import { providersDePrueba } from '../../../testing/providers-de-prueba';

describe('Audit (panel del auditor)', () => {
  let fixture: ComponentFixture<Audit>;
  let component: Audit;
  let http: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Audit],
      providers: providersDePrueba(),
    }).compileComponents();

    TestBed.inject(AuthService).roles.set(['AUDITOR']);
    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(Audit);
    component = fixture.componentInstance;
    fixture.detectChanges();
    http.expectOne((r) => r.url.endsWith('/api/audit/resumen')).flush({
      desde: '2026-10-01T00:00:00Z', hasta: '2026-10-31T00:00:00Z',
      totalEventos: 3, reservasInvolucradas: 2, eventosPorTipo: { RESERVA_CANCELADA: 1, RESERVA_CREADA: 2 },
    });
  });

  it('muestra el resumen del periodo', () => {
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Reservas involucradas');
  });

  it('no envia el formulario si faltan datos y marca cada campo', () => {
    const c = component as any;
    c.cambiarPestana('solicitudes');
    http.expectOne((r) => r.url.endsWith('/api/audit/solicitudes')).flush({ content: [] });

    c.enviarSolicitud();

    expect(Object.keys(c.erroresFormulario())).toEqual(['categoria', 'asunto', 'descripcion']);
    http.expectNone((r) => r.method === 'POST');
  });

  it('envia la solicitud valida al microservicio de auditoria', () => {
    const c = component as any;
    c.cambiarPestana('solicitudes');
    http.expectOne((r) => r.url.endsWith('/api/audit/solicitudes')).flush({ content: [] });

    c.nuevaSolicitud = {
      categoria: 'CANCELACIONES', asunto: 'Cancelaciones de octubre',
      descripcion: 'Necesito saber quien cancelo cada reserva y por que.', reservaId: null,
      periodoDesde: '2026-10-01', periodoHasta: '2026-10-31',
    };
    c.enviarSolicitud();

    const req = http.expectOne((r) => r.method === 'POST' && r.url.endsWith('/api/audit/solicitudes'));
    expect(req.request.body.categoria).toBe('CANCELACIONES');
    req.flush({ id: 7, estado: 'PENDIENTE' });
    http.expectOne((r) => r.method === 'GET' && r.url.endsWith('/api/audit/solicitudes')).flush({ content: [] });
    expect(c.exito()).toContain('#7');
  });
});
