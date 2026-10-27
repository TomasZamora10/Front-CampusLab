import { Routes } from '@angular/router';
import { MsalGuard } from '@azure/msal-angular';
import { Login } from './pages/login/login';
import { rolGuard } from './core/guards/rol.guard';

// Las paginas se cargan bajo demanda (loadComponent): el bundle inicial
// quedaba a pocos kB del presupuesto de error de 1 MB de angular.json, y
// cada rol solo descarga las paginas que puede abrir.
export const routes: Routes = [
  { path: 'login', component: Login },
  {
    path: 'dashboard',
    loadComponent: () => import('./pages/dashboard/dashboard').then((m) => m.Dashboard),
    canActivate: [MsalGuard],
  },
  // Mismos roles que el BFF acepta en GET /api/bookings/** y /api/catalog/** (el Auditor no).
  {
    path: 'bookings',
    loadComponent: () => import('./pages/bookings/bookings').then((m) => m.Bookings),
    canActivate: [MsalGuard, rolGuard(['ADMIN', 'TECNICO', 'ESTUDIANTE'])],
  },
  {
    path: 'catalog',
    loadComponent: () => import('./pages/catalog/catalog').then((m) => m.Catalog),
    canActivate: [MsalGuard, rolGuard(['ADMIN', 'TECNICO', 'ESTUDIANTE'])],
  },
  {
    path: 'reports',
    loadComponent: () => import('./pages/reports/reports').then((m) => m.Reports),
    canActivate: [MsalGuard, rolGuard(['ADMIN'])],
  },
  {
    path: 'audit',
    loadComponent: () => import('./pages/audit/audit').then((m) => m.Audit),
    canActivate: [MsalGuard, rolGuard(['ADMIN', 'AUDITOR'])],
  },
  {
    path: 'admin/rabbitmq',
    loadComponent: () => import('./pages/rabbitmq/rabbitmq').then((m) => m.Rabbitmq),
    canActivate: [MsalGuard, rolGuard(['ADMIN'])],
  },
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: '**', redirectTo: 'login' },
];
