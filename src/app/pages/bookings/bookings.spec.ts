import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Bookings } from './bookings';
import { providersDePrueba } from '../../../testing/providers-de-prueba';

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
});
