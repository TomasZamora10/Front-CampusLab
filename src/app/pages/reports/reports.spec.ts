import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Reports } from './reports';
import { providersDePrueba } from '../../../testing/providers-de-prueba';

describe('Reports', () => {
  let component: Reports;
  let fixture: ComponentFixture<Reports>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Reports],
      providers: providersDePrueba(),
    }).compileComponents();

    fixture = TestBed.createComponent(Reports);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
