// app.routes.ts
import { Routes } from '@angular/router';
import { Login } from './login/login';
import { Dashboard } from './dashboard/dashboard';
import { ListeTravailleurs } from './travailleurs/liste-travailleurs/liste-travailleurs';
import { CreerTravailleur } from './travailleurs/creer-travailleur/creer-travailleur';
import { ModifierTravailleur } from './travailleurs/modifier-travailleur/modifier-travailleur';
import { AuthGuard } from './guards/auth-guard';
import { roleGuard } from './guards/role-guard';

export const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'login', component: Login },
  { path: 'dashboard', component: Dashboard, canActivate: [AuthGuard] },
  { path: 'travailleurs', component: ListeTravailleurs, canActivate: [AuthGuard, roleGuard], data: { role: 'responsable' } },
  { path: 'travailleurs/creer', component: CreerTravailleur, canActivate: [AuthGuard, roleGuard], data: { role: 'responsable' } },
  { path: 'travailleurs/modifier/:id', component: ModifierTravailleur, canActivate: [AuthGuard, roleGuard], data: { role: 'responsable' } },
  { path: '**', redirectTo: '/login' }
];
