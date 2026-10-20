import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Login } from './login';
import { providersDePrueba } from '../../../testing/providers-de-prueba';

describe('Login', () => {
  let component: Login;
  let fixture: ComponentFixture<Login>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Login],
      providers: providersDePrueba(),
    }).compileComponents();

    fixture = TestBed.createComponent(Login);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
