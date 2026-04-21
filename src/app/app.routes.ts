// app.routes.ts - COMPLETE FIXED VERSION
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
import { ListeTracteursComponent } from './ressources/tracteurs/liste-tracteurs/liste-tracteurs';
import { AjouterTracteurComponent } from './ressources/tracteurs/ajouter-tracteur/ajouter-tracteur';
import { ModifierTracteurComponent } from './ressources/tracteurs/modifier-tracteur/modifier-tracteur';
import { ListeBennesComponent } from './ressources/bennes/liste-bennes/liste-bennes';
import { AjouterBenneComponent } from './ressources/bennes/ajouter-benne/ajouter-benne';
import { ModifierBenneComponent } from './ressources/bennes/modifier-benne/modifier-benne';
import { ProfilComponent } from './profile/profile/profile';
import { ModifierUtilisateur } from './utilisateurs/modifier-utilisateur/modifier-utilisateur';
import { ListeVergersComponent } from './vergers/liste-vergers/liste-vergers';
import { CreerVergerComponent } from './vergers/creer-verger/creer-verger';
import { ModifierVergerComponent } from './vergers/modifier-verger/modifier-verger';
import { MesVergersComponent } from './vergers/mes-vergers/mes-vergers';
import { MesAlertesComponent } from './alertes/mes-alertes/mes-alertes';
import { CalendrierComponent } from './calendrier/calendrier/calendrier';
import { CreeAlerte } from './alertes/cree-alerte/cree-alerte';
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
    data: { role: ['RESPONSABLE', 'ADMIN'] }
  },
  {
    path: 'travailleurs/creer',
    component: CreerTravailleur,
    canActivate: [AuthGuard, roleGuard],
    data: { role: ['RESPONSABLE', 'ADMIN'] }
  },
  {
    path: 'travailleurs/modifier/:id',
    component: ModifierTravailleur,
    canActivate: [AuthGuard, roleGuard],
    data: { role: ['RESPONSABLE', 'ADMIN'] }
  },
  {
    path: 'utilisateurs/modifier/:id',
    component: ModifierUtilisateur,
    canActivate: [AuthGuard, roleGuard],
    data: { role: ['ADMIN'] }
  },

  // Routes Agriculteurs
  {
    path: 'agriculteurs',
    component: ListeAgriculteurs,
    canActivate: [AuthGuard, roleGuard],
    data: { role: ['RESPONSABLE', 'ADMIN'] }
  },
  {
    path: 'agriculteurs/creer',
    component: CreerAgriculteur,
    canActivate: [AuthGuard, roleGuard],
    data: { role: ['RESPONSABLE', 'ADMIN'] }
  },
  {
    path: 'agriculteurs/modifier/:id',
    component: ModifierAgriculteur,
    canActivate: [AuthGuard, roleGuard],
    data: { role: ['RESPONSABLE', 'ADMIN'] }
  },

  // Routes Utilisateurs
  {
    path: 'utilisateurs',
    component: ListeUtilisateurs,
    canActivate: [AuthGuard, roleGuard],
    data: { role: ['ADMIN'] }
  },
  {
    path: 'utilisateurs/creer',
    component: CreerUtilisateur,
    canActivate: [AuthGuard, roleGuard],
    data: { role: ['ADMIN'] }
  },

  // Routes Tournées
  {
    path: 'tournees',
    component: TourneeListComponent,
    canActivate: [AuthGuard, roleGuard],
    data: { role: ['ADMIN', 'RESPONSABLE'] }
  },
  {
    path: 'tournees/create',
    component: TourneeCreateComponent,
    canActivate: [AuthGuard, roleGuard],
    data: { role: ['ADMIN', 'RESPONSABLE'] }
  },
  {
    path: 'tournees/:id',
    component: TourneeDetailComponent,
    canActivate: [AuthGuard, roleGuard],
    data: { role: ['ADMIN', 'RESPONSABLE'] }
  },

  // ⭐⭐⭐ COLLECTES ROUTES - MUST BE AFTER TOURNEES ROUTES ⭐⭐⭐
  {
    path: 'collectes',
    component: CollecteListComponent,
    canActivate: [AuthGuard, roleGuard],
    data: { role: ['ADMIN', 'RESPONSABLE'] }
  },
  {
    path: 'collectes/:id',
    component: CollecteDetailComponent,
    canActivate: [AuthGuard, roleGuard],
    data: { role: ['ADMIN', 'RESPONSABLE'] }
  },

  // Routes Admin (Activation)
  {
    path: 'admin/activation',
    component: ActivationComptes,
    canActivate: [AuthGuard, roleGuard],
    data: { role: ['ADMIN'] }
  },

  // Routes Ressources (Bennes)
  {
    path: 'ressources/bennes',
    component: ListeBennesComponent,
    canActivate: [AuthGuard, roleGuard],
    data: { role: ['RESPONSABLE', 'ADMIN'] }
  },
  {
    path: 'ressources/bennes/ajouter',
    component: AjouterBenneComponent,
    canActivate: [AuthGuard, roleGuard],
    data: { role: ['RESPONSABLE', 'ADMIN'] }
  },
  {
    path: 'ressources/bennes/modifier/:id',
    component: ModifierBenneComponent,
    canActivate: [AuthGuard, roleGuard],
    data: { role: ['RESPONSABLE', 'ADMIN'] }
  },

  // Routes Ressources (Tracteurs)
  {
    path: 'ressources/tracteurs',
    component: ListeTracteursComponent,
    canActivate: [AuthGuard, roleGuard],
    data: { role: ['RESPONSABLE', 'ADMIN'] }
  },
  {
    path: 'ressources/tracteurs/ajouter',
    component: AjouterTracteurComponent,
    canActivate: [AuthGuard, roleGuard],
    data: { role: ['RESPONSABLE', 'ADMIN'] }
  },
  {
    path: 'ressources/tracteurs/modifier/:id',
    component: ModifierTracteurComponent,
    canActivate: [AuthGuard, roleGuard],
    data: { role: ['RESPONSABLE', 'ADMIN'] }
  },

  // Profile Routes
  {
    path: 'profile',
    component: ProfilComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'profil',
    component: ProfilComponent,
    canActivate: [AuthGuard]
  },

{path: 'mes-vergers', component: MesVergersComponent, canActivate: [AuthGuard, roleGuard], data: { role: ['AGRICULTEUR'] } },
{ path: 'mes-alertes', component: MesAlertesComponent, canActivate: [AuthGuard, roleGuard], data: { role: ['AGRICULTEUR'] } },
{
  path: 'cree-alerte',
  component: CreeAlerte
},
{ path: '**', redirectTo: '/login' },

  // Vergers
  {
    path: 'vergers',
    canActivate: [AuthGuard, roleGuard],
    data: { role: ['ADMIN', 'RESPONSABLE', 'AGRICULTEUR'] },
    children: [
      { path: '', component: ListeVergersComponent },
      { path: 'creer', component: CreerVergerComponent },
      { path: 'modifier/:id', component: ModifierVergerComponent }
    ]
  },
  {
    path: 'mes-vergers',
    component: MesVergersComponent,
    canActivate: [AuthGuard, roleGuard],
    data: { role: ['AGRICULTEUR'] }
  },
  {
    path: 'mes-alertes',
    component: MesAlertesComponent,
    canActivate: [AuthGuard, roleGuard],
    data: { role: ['AGRICULTEUR'] }
  },

  // Default redirect - MUST BE LAST
  { path: '**', redirectTo: '/login' }
];
