import { Routes } from '@angular/router';
import { MsalGuard } from '@azure/msal-angular';
import { Login } from './pages/login/login';
import { Dashboard } from './pages/dashboard/dashboard';
import { Bookings } from './pages/bookings/bookings';
import { Catalog } from './pages/catalog/catalog';
import { Reports } from './pages/reports/reports';
import { Audit } from './pages/audit/audit';
import { Rabbitmq } from './pages/rabbitmq/rabbitmq';
import { rolGuard } from './core/guards/rol.guard';

export const routes: Routes = [
  { path: 'login', component: Login },
  { path: 'dashboard', component: Dashboard, canActivate: [MsalGuard] },
  { path: 'bookings', component: Bookings, canActivate: [MsalGuard] },
  { path: 'catalog', component: Catalog, canActivate: [MsalGuard] },
  {
    path: 'reports',
    component: Reports,
    canActivate: [MsalGuard, rolGuard(['ADMIN'])],
  },
  {
    path: 'audit',
    component: Audit,
    canActivate: [MsalGuard, rolGuard(['ADMIN', 'AUDITOR'])],
  },
  {
    path: 'admin/rabbitmq',
    component: Rabbitmq,
    canActivate: [MsalGuard, rolGuard(['ADMIN'])],
  },
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: '**', redirectTo: 'login' },
];
