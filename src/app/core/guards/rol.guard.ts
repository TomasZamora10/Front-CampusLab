import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService, RolCampuslab } from '../services/auth.service';

/**
 * Oculta rutas segun rol (mejor UX: evita que un Estudiante llegue a
 * /reports y solo ahi se entere via un 403 del BFF). No es la autorizacion
 * real -- esa la hace el BFF/microservicio con el JWT en cada peticion,
 * pase lo que pase en el frontend.
 */
export function rolGuard(rolesPermitidos: RolCampuslab[]): CanActivateFn {
  return () => {
    const auth = inject(AuthService);
    const router = inject(Router);

    auth.sincronizarConMsal();
    if (auth.tieneAlgunRol(...rolesPermitidos)) {
      return true;
    }
    return router.parseUrl('/dashboard');
  };
}
