import { Injectable, inject, signal } from '@angular/core';
import { MsalBroadcastService, MsalService } from '@azure/msal-angular';
import { InteractionStatus } from '@azure/msal-browser';
import { filter } from 'rxjs/operators';

/**
 * Roles del App Registration de Azure AD que reconoce CampusLab.
 * Deben coincidir exactamente con los App Roles configurados alla y con los
 * que validan por rol tanto el BFF (SecurityConfig) como cada microservicio.
 */
export type RolCampuslab = 'ADMIN' | 'TECNICO' | 'ESTUDIANTE' | 'AUDITOR';

/**
 * Punto unico de lectura de sesion/roles para toda la app: evita que cada
 * pagina tenga que hablar con MsalService directamente para saber quien es
 * el usuario o que puede ver. Los roles se usan solo para mostrar/ocultar
 * UI (mejor experiencia) -- la autorizacion real la hacen el BFF y cada
 * microservicio con el JWT, esto no reemplaza esa validacion de backend.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  readonly isLoggedIn = signal(false);
  readonly roles = signal<RolCampuslab[]>([]);
  readonly nombreUsuario = signal<string | null>(null);

  private readonly msalService = inject(MsalService);
  private readonly msalBroadcastService = inject(MsalBroadcastService);
  private inicializado = false;

  /** Se llama una sola vez desde el componente raiz (App). */
  inicializar(): void {
    if (this.inicializado) {
      return;
    }
    this.inicializado = true;

    this.msalBroadcastService.inProgress$
      .pipe(filter((status) => status === InteractionStatus.None))
      .subscribe(() => {
        const cuentas = this.msalService.instance.getAllAccounts();
        this.isLoggedIn.set(cuentas.length > 0);

        if (cuentas.length > 0 && !this.msalService.instance.getActiveAccount()) {
          this.msalService.instance.setActiveAccount(cuentas[0]);
        }

        const cuentaActiva = this.msalService.instance.getActiveAccount() ?? cuentas[0] ?? null;
        this.nombreUsuario.set((cuentaActiva?.name as string) ?? cuentaActiva?.username ?? null);
        this.roles.set(this.leerRolesDeLaCuentaActiva());
      });
  }

  tieneAlgunRol(...rolesPermitidos: RolCampuslab[]): boolean {
    const rolesActuales = this.roles();
    return rolesPermitidos.some((r) => rolesActuales.includes(r));
  }

  logout(): void {
    this.msalService.logoutRedirect();
  }

  private leerRolesDeLaCuentaActiva(): RolCampuslab[] {
    const cuenta = this.msalService.instance.getActiveAccount()
      ?? this.msalService.instance.getAllAccounts()[0];
    const roles = cuenta?.idTokenClaims?.['roles'];
    if (!Array.isArray(roles)) {
      return [];
    }
    // Azure AD entrega los App Roles tal como se definieron ("Admin",
    // "Tecnico", ...): se normalizan igual que en el BFF (mayusculas, sin
    // acentos) para que coincidan con RolCampuslab.
    return roles.map((r) => normalizarRol(String(r)) as RolCampuslab);
  }
}

export function normalizarRol(rol: string): string {
  return rol.trim().normalize('NFD').replace(/\p{M}/gu, '').toUpperCase();
}
