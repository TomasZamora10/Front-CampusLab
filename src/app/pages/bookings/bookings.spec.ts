import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Bookings } from './bookings';
import { providersDePrueba } from '../../../testing/providers-de-prueba';
import { AuthService } from '../../core/services/auth.service';
import { Reserva } from '../../core/models/campuslab.models';

describe('Bookings', () => {
  let component: Bookings;
  let fixture: ComponentFixture<Bookings>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Bookings],
      providers: providersDePrueba(),
    }).compileComponents();

    fixture = TestBed.createComponent(Bookings);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('el estudiante solo puede cancelar, y con una justificacion de al menos 10 caracteres', () => {
    TestBed.inject(AuthService).roles.set(['ESTUDIANTE']);
    const c = component as any;
    const reserva = { id: 1, estado: 'APROBADA' } as Reserva;

    expect(c.transicionesDisponibles(reserva)).toEqual(['CANCELADA']);

    c.motivoCancelacion = 'no voy';
    expect(c.motivoValido()).toBe(false);
    c.motivoCancelacion = 'Se reprogramó la práctica';
    expect(c.motivoValido()).toBe(true);
  });

  it('el tecnico ve todas las transiciones validas', () => {
    TestBed.inject(AuthService).roles.set(['TECNICO']);
    expect((component as any).transicionesDisponibles({ id: 1, estado: 'APROBADA' } as Reserva))
      .toEqual(['EN_PREPARACION', 'CANCELADA']);
  });
});
