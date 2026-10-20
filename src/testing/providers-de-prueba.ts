import { Provider, EnvironmentProviders } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { MsalBroadcastService, MsalService } from '@azure/msal-angular';
import { InteractionStatus } from '@azure/msal-browser';
import { of } from 'rxjs';

/**
 * Providers comunes para los specs de componentes: reemplazan MSAL (que en
 * la app real necesita la configuracion de Azure AD de app.config.ts) por
 * un doble sin sesion, y HttpClient por el backend de pruebas de Angular,
 * para que ningun test haga peticiones reales al BFF.
 */
export function providersDePrueba(): (Provider | EnvironmentProviders)[] {
  const msalServiceFalso = {
    instance: {
      getAllAccounts: () => [],
      getActiveAccount: () => null,
      setActiveAccount: () => undefined,
    },
    handleRedirectObservable: () => of(null),
    loginRedirect: () => undefined,
    logoutRedirect: () => undefined,
  };

  return [
    provideRouter([]),
    provideHttpClient(),
    provideHttpClientTesting(),
    { provide: MsalService, useValue: msalServiceFalso },
    { provide: MsalBroadcastService, useValue: { inProgress$: of(InteractionStatus.None) } },
  ];
}
