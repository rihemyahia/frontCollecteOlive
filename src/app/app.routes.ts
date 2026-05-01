import { Routes } from '@angular/router';
import { Login } from './login/login';
import { Dashboard } from './dashboard/dashboard';
import { AdminDashboardComponent } from './dashboard/admin-dashboard/admin-dashboard';
import { ResponsableDashboardComponent } from './dashboard/responsable-dashboard/responsable-dashboard';
import { AgriculteurDashboardComponent } from './dashboard/agriculteur-dashboard/agriculteur-dashboard';
import { TransporteurDashboardComponent } from './dashboard/transporteur-dashboard/transporteur-dashboard';
import { ListeUtilisateurs } from './utilisateurs/liste-utilisateurs/liste-utilisateurs';
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
import { AlertesListComponent } from './alertes/alertes-list/alertes-list';
import { AlertDetailComponent } from './alertes/alert-detail/alert-detail';
import { CalendrierComponent } from './calendrier/calendrier/calendrier';
import { TourneeListComponent } from './tournee/tournee-list/tournee-list';
import { TourneeCreateComponent } from './tournee/tournee-create/tournee-create';
import { TourneeDetailComponent } from './tournee/tournee-detail/tournee-detail';
import { CollecteListComponent } from './collecte/collecte-list/collecte-list';
import { CollecteDetailComponent } from './collecte/collecte-detail/collecte-detail';
import { CreeAlerte } from './alertes/cree-alerte/cree-alerte';
import { GestionAlertesComponent } from './alertes/gestion-alertes/gestion-alertes';
import { ModifierAlerteComponent } from './alertes/modifier-alerte/modifier-alerte';
import { IaPredictionDetailComponent } from './ia-prediction-detail/ia-prediction-detail/ia-prediction-detail';
import { MaladieDetectionComponent } from './maladie-detection/maladie-detection';
import { TransporteurTourneesComponent } from './tournee/transporteur-tournees/transporteur-tournees';

export const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'login', component: Login },

  // ── Dashboard router (redirects by role) ──────────────────────────────────
  { path: 'dashboard', component: Dashboard, canActivate: [AuthGuard] },

  // ── Role-specific dashboards ──────────────────────────────────────────────
  {
    path: 'admin/dashboard',
    component: AdminDashboardComponent,
    canActivate: [AuthGuard, roleGuard],
    data: { role: ['ADMIN'] }
  },
  {
    path: 'responsable/dashboard',
    component: ResponsableDashboardComponent,
    canActivate: [AuthGuard, roleGuard],
    data: { role: ['RESPONSABLE'] }
  },
  {
    path: 'agriculteur/dashboard',
    component: AgriculteurDashboardComponent,
    canActivate: [AuthGuard, roleGuard],
    data: { role: ['AGRICULTEUR'] }
  },
  {
    path: 'transporteur/dashboard',
    component: TransporteurDashboardComponent,
    canActivate: [AuthGuard, roleGuard],
    data: { role: ['TRANSPORTEUR'] }
  },

  // ── Calendrier ────────────────────────────────────────────────────────────
  {
    path: 'calendrier',
    component: CalendrierComponent,
    canActivate: [AuthGuard, roleGuard],
    data: { role: ['ADMIN', 'RESPONSABLE', 'AGRICULTEUR'] }
  },

  // ── Utilisateurs ──────────────────────────────────────────────────────────
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
  {
    path: 'utilisateurs/modifier/:id',
    component: ModifierUtilisateur,
    canActivate: [AuthGuard, roleGuard],
    data: { role: ['ADMIN'] }
  },

  // ── Tournées ──────────────────────────────────────────────────────────────
  {
    path: 'tournees',
    component: TourneeListComponent,
    canActivate: [AuthGuard, roleGuard],
    data: { role: ['ADMIN', 'RESPONSABLE', 'TRANSPORTEUR'] }
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
    data: { role: ['ADMIN', 'RESPONSABLE', 'TRANSPORTEUR'] }
  },
  {
  path: 'transporteur/tournees',
  component: TransporteurTourneesComponent,
  canActivate: [AuthGuard, roleGuard],
  data: { role: ['TRANSPORTEUR'] }
},

  // ── Collectes ─────────────────────────────────────────────────────────────
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

  // ── Ressources — Bennes ───────────────────────────────────────────────────
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

  // ── Ressources — Tracteurs ────────────────────────────────────────────────
  {
    path: 'ressources/tracteurs',
    component: ListeTracteursComponent,
    canActivate: [AuthGuard, roleGuard],
    data: { role: ['RESPONSABLE', 'ADMIN'] }
  },

  // Routes Ressources (Tracteurs)
  {
    path: 'ia/prediction/:id',
    component: IaPredictionDetailComponent,
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

  // ── Profile ───────────────────────────────────────────────────────────────
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

  // ── Vergers ───────────────────────────────────────────────────────────────
  {
    path: 'mes-vergers',
    component: MesVergersComponent,
    canActivate: [AuthGuard, roleGuard],
    data: { role: ['AGRICULTEUR'] }
  },
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

  // ── Alertes ───────────────────────────────────────────────────────────────
  {
    path: 'alertes',
    canActivate: [AuthGuard],
    children: [
      {
        path: 'mes-alertes',
        component: MesAlertesComponent,
        data: { role: ['AGRICULTEUR'] }
      },
      {
        path: 'creer',
        component: CreeAlerte,
        data: { role: ['AGRICULTEUR'] }
      },
      {
        path: 'gestion',
        component: GestionAlertesComponent,
        canActivate: [AuthGuard, roleGuard],
        data: { role: ['ADMIN', 'RESPONSABLE'] }
      },
      {
        path: 'modifier/:id',
        component: ModifierAlerteComponent,
        canActivate: [AuthGuard, roleGuard],
        data: { role: ['ADMIN', 'RESPONSABLE'] }
      },
      {
        path: 'detail/:id',
        component: AlertDetailComponent,
        data: { role: ['ADMIN', 'RESPONSABLE'] }
      }
    ]
  },
  {
    path: 'cree-alerte',
    component: CreeAlerte
  },
  // ── Vergers ───────────────────────────────────────────────────────────────
  {
    path: 'diagnostic',
    component: MaladieDetectionComponent,
    canActivate: [AuthGuard, roleGuard],
    data: { role: ['AGRICULTEUR'] }
  },

  // ── Catch-all ─────────────────────────────────────────────────────────────
  { path: '**', redirectTo: '/login' }
];
