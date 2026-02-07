

import { bootstrapApplication } from '@angular/platform-browser';
import { provideHttpClient } from '@angular/common/http';
import { provideZonelessChangeDetection, ErrorHandler } from '@angular/core';
import { AppComponent } from './src/app.component';
import { GlobalErrorHandler } from './src/services/global-error-handler.service';

bootstrapApplication(AppComponent, {
  providers: [
    provideZonelessChangeDetection(),
    provideHttpClient(),
    { provide: ErrorHandler, useClass: GlobalErrorHandler }
  ],
}).catch((err) => console.error(err));

// AI Studio always uses an `index.tsx` file for all project types.
