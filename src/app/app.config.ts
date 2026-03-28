import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http'; // ← withInterceptors
import { routes } from './app.routes';
import { authInterceptor } from './interceptors/auth-interceptor'; // ← import your interceptor

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    // ❌ removed: provideClientHydration(withEventReplay())
    provideHttpClient(
      withInterceptors([authInterceptor])  // ← functional interceptor registered correctly
    ),
  ]
};
