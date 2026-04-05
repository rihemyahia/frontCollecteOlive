// app.routes.ts
import { Routes } from '@angular/router';
import { Login } from './login/login';
import { Dashboard } from './dashboard/dashboard';
import { ListeTravailleurs } from './travailleurs/liste-travailleurs/liste-travailleurs';
import { CreerTravailleur } from './travailleurs/creer-travailleur/creer-travailleur';
import { ModifierTravailleur } from './travailleurs/modifier-travailleur/modifier-travailleur';
import { ListeAgriculteurs } from './agriculteurs/liste-agriculteurs/liste-agriculteurs';
import { CreerAgriculteur } from './agriculteurs/creer-agriculteur/creer-agriculteur';
import { ModifierAgriculteur } from './agriculteurs/modifier-agriculteur/modifier-agriculteur';
import { ListeUtilisateurs } from './utilisateurs/liste-utilisateurs/liste-utilisateurs';
import { ActivationComptes } from './admin/activation-comptes/activation-comptes';
import { AuthGuard } from './guards/auth-guard';
import { roleGuard } from './guards/role-guard';
import { CreerUtilisateur } from './utilisateurs/creer-utilisateur/creer-utilisateur';

export const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'login', component: Login },

  // Dashboard
  { path: 'dashboard', component: Dashboard, canActivate: [AuthGuard] },

  // Routes Travailleurs
  {
    path: 'travailleurs',
    component: ListeTravailleurs,
    canActivate: [AuthGuard, roleGuard],
    data: { role: 'responsable' }
  },
  {
    path: 'travailleurs/creer',
    component: CreerTravailleur,
    canActivate: [AuthGuard, roleGuard],
    data: { role: 'responsable' }
  },
  {
    path: 'travailleurs/modifier/:id',
    component: ModifierTravailleur,
    canActivate: [AuthGuard, roleGuard],
    data: { role: 'responsable' }
  },

  // Routes Agriculteurs
  {
    path: 'agriculteurs',
    component: ListeAgriculteurs,
    canActivate: [AuthGuard, roleGuard],
    data: { role: 'responsable' }
  },
  {
    path: 'agriculteurs/creer',
    component: CreerAgriculteur,
    canActivate: [AuthGuard, roleGuard],
    data: { role: 'responsable' }
  },
  {
    path: 'agriculteurs/modifier/:id',
    component: ModifierAgriculteur,
    canActivate: [AuthGuard, roleGuard],
    data: { role: 'responsable' }
  },
  {
    path: 'utilisateurs/creer',
    component: CreerUtilisateur,
    canActivate: [AuthGuard, roleGuard],
    data: { role: 'admin' }
  },

  // Routes Utilisateurs (Admin)
  {
    path: 'utilisateurs',
    component: ListeUtilisateurs,
    canActivate: [AuthGuard, roleGuard],
    data: { role: 'admin' }
  },

  // Routes Admin (Activation)
  {
    path: 'admin/activation',
    component: ActivationComptes,
    canActivate: [AuthGuard, roleGuard],
    data: { role: 'admin' }
  },

  { path: '**', redirectTo: '/login' }
];
