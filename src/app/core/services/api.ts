import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

/**
 * Wrapper delgado sobre HttpClient apuntando siempre al BFF
 * (environment.apiConfig.uri). MsalInterceptor adjunta el Bearer token de
 * forma automatica a toda peticion que matchee el protectedResourceMap
 * (ver app.config.ts), asi que los servicios de dominio no necesitan
 * preocuparse por la autenticacion.
 */
@Injectable({ providedIn: 'root' })
export class Api {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiConfig.uri;

  get<T>(path: string, params?: Record<string, string | number | boolean | undefined>): Observable<T> {
    return this.http.get<T>(`${this.baseUrl}${path}`, { params: this.aHttpParams(params) });
  }

  post<T>(path: string, body: unknown): Observable<T> {
    return this.http.post<T>(`${this.baseUrl}${path}`, body);
  }

  put<T>(path: string, body: unknown): Observable<T> {
    return this.http.put<T>(`${this.baseUrl}${path}`, body);
  }

  delete<T>(path: string, params?: Record<string, string | number | boolean | undefined>): Observable<T> {
    return this.http.delete<T>(`${this.baseUrl}${path}`, { params: this.aHttpParams(params) });
  }

  private aHttpParams(params?: Record<string, string | number | boolean | undefined>): HttpParams {
    let httpParams = new HttpParams();
    if (!params) {
      return httpParams;
    }
    for (const [clave, valor] of Object.entries(params)) {
      if (valor !== undefined && valor !== null && valor !== '') {
        httpParams = httpParams.set(clave, String(valor));
      }
    }
    return httpParams;
  }
}
