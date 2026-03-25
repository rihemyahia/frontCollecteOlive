import '@angular/compiler';  // ← ADD THIS LINE AT THE VERY TOP
import { bootstrapApplication } from '@angular/platform-browser';
import {  App } from './app/app';
import { appConfig } from './app/app.config';

bootstrapApplication(App, appConfig)
  .catch((err) => console.error(err));
