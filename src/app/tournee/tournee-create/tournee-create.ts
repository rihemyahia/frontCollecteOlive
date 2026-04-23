// src/app/tournee/tournee-create/tournee-create.ts
import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { TourneeService, TourneeRequest } from '../../services/tournee';
import { VergerService } from '../../services/verger';
import { UtilisateurService } from '../../services/utilisateur';
import { RessourceService } from '../../services/ressource';
import { SideBarResponsable } from '../../sidebar-responsable/sidebar-responsable';

@Component({
  selector: 'app-tournee-create',
  standalone: true,
  imports: [CommonModule, FormsModule, SideBarResponsable],
  templateUrl: './tournee-create.html',
  styleUrls: ['./tournee-create.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TourneeCreateComponent implements OnInit {
  isSidebarCollapsed = false;
  userRole = 'ADMIN';
  isSubmitting = false;
  errorMessage = '';
  successMessage = '';

  formData: TourneeRequest = {
    vergerId: '',
    benneId: '',
    tracteurId: '',
    travailleurIds: [],
    nbreArbre: 100,
    dateDebut: new Date(),
    dateFin: new Date(),
    distanceTotale: 0,
    observations: ''
  };

  vergers: any[] = [];
  bennes: any[] = [];
  tracteurs: any[] = [];
  travailleurs: any[] = [];
  selectedVerger: any = null;

  dateDebutStr: string = '';
  dateFinStr: string = '';

  constructor(
    private tourneeService: TourneeService,
    private vergerService: VergerService,
    private ressourceService: RessourceService,
    private utilisateurService: UtilisateurService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.loadData();
    this.initDates();
  }

  initDates() {
    const now = new Date();
    const start = new Date(now);
    start.setHours(8, 0, 0, 0);
    const end = new Date(now);
    end.setHours(12, 0, 0, 0);

    this.formData.dateDebut = start;
    this.formData.dateFin = end;
    this.dateDebutStr = this.formatDateForInput(start);
    this.dateFinStr = this.formatDateForInput(end);
  }

  formatDateForInput(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  }
  // Dans tournee-create.ts

getSpecialiteLabel(specialites: string[]): string {
  const specialite = specialites?.[0] || '';
  const labels: { [key: string]: string } = {
    'cueillette': '🌿 Cueillette',
    'tamisage': '🔍 Tamisage',
    'secouage': '🌳 Secouage',
    'ramassage': '✋ Ramassage',
    'tri': '📦 Tri'
  };
  return labels[specialite] || '👤 Ouvrier';
}

getSpecialiteIcon(specialites: string[]): string {
  const specialite = specialites?.[0] || '';
  const icons: { [key: string]: string } = {
    'cueillette': 'bi-tree-fill',
    'tamisage': 'bi-funnel-fill',
    'secouage': 'bi-arrow-repeat',
    'ramassage': 'bi-hand-index-thumb',
    'tri': 'bi-grid-3x3-gap-fill'
  };
  return icons[specialite] || 'bi-person-badge-fill';
}

getSpecialiteColor(specialites: string[]): string {
  const specialite = specialites?.[0] || '';
  const colors: { [key: string]: string } = {
    'cueillette': '#43e97b',
    'tamisage': '#f093fb',
    'secouage': '#4facfe',
    'ramassage': '#fa709a',
    'tri': '#ffd93d'
  };
  return colors[specialite] || '#A8B84B';
}

loadTravailleurs() {
  this.tourneeService.getTravailleurs().subscribe({
    next: (data: any[]) => {
      console.log('Travailleurs reçus:', data);

      this.travailleurs = (data || []).map((travailleur: any) => ({
        ...travailleur,
        // Utiliser specialites (liste) au lieu de specialite
        specialites: travailleur.specialites || [],
        specialitePrincipale: travailleur.specialites?.[0] || 'Non spécifié',
        nomComplet: `${travailleur.prenom || ''} ${travailleur.nom || ''}`.trim(),
        specialiteLabel: this.getSpecialiteLabel(travailleur.specialites),
        experienceFormatee: this.formatExperience(travailleur.anneesExperience)
      }));

      this.cdr.markForCheck();
    },
    error: (err) => {
      console.error('Erreur chargement travailleurs:', err);
      this.showError('Erreur lors du chargement des travailleurs');
    }
  });
}

  // FIXED: Accept event, not event.target.value
  onVergerChange(event: Event) {
    const selectElement = event.target as HTMLSelectElement;
    const vergerId = selectElement.value;

    if (vergerId) {
      this.selectedVerger = this.vergers.find(v => v.id === vergerId);
      if (this.selectedVerger) {
        this.formData.nbreArbre = Math.min(100, this.selectedVerger.nbArbre);
      }
    } else {
      this.selectedVerger = null;
    }
    this.cdr.markForCheck();
  }

  onDateDebutChange(event: Event) {
    const inputElement = event.target as HTMLInputElement;
    const value = inputElement.value;
    this.dateDebutStr = value;

    if (value) {
      const [datePart, timePart] = value.split('T');
      const [year, month, day] = datePart.split('-');
      const [hours, minutes] = timePart.split(':');
      this.formData.dateDebut = new Date(
        parseInt(year),
        parseInt(month) - 1,
        parseInt(day),
        parseInt(hours),
        parseInt(minutes)
      );
    }
    this.cdr.markForCheck();
  }

  onDateFinChange(event: Event) {
    const inputElement = event.target as HTMLInputElement;
    const value = inputElement.value;
    this.dateFinStr = value;

    if (value) {
      const [datePart, timePart] = value.split('T');
      const [year, month, day] = datePart.split('-');
      const [hours, minutes] = timePart.split(':');
      this.formData.dateFin = new Date(
        parseInt(year),
        parseInt(month) - 1,
        parseInt(day),
        parseInt(hours),
        parseInt(minutes)
      );
    }
    this.cdr.markForCheck();
  }

  // ADD THIS MISSING METHOD
  formatDateForDisplay(date: Date): string {
    if (!date) return 'Non récolté';
    const d = new Date(date);
    return d.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }

  loadData() {
    this.loadVergers();
    this.loadBennes();
    this.loadTracteurs();
    this.loadTravailleurs();
  }
loadVergers() {
  this.vergerService.getAll().subscribe({
    next: (data) => {
      this.vergers = (data || []).filter(v => !v.estSupprimer);
      this.cdr.detectChanges();
    },
    error: (err) => {
      console.error('Erreur chargement vergers:', err);
      this.showError('Erreur lors du chargement des vergers');
    }
  });
}

  loadBennes() {
    this.ressourceService.getBennes().subscribe({
      next: (data) => {
        this.bennes = data || [];
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Erreur chargement bennes:', err);
        this.showError('Erreur lors du chargement des bennes');
      }
    });
  }

  loadTracteurs() {
    this.ressourceService.getTracteurs().subscribe({
      next: (data) => {
        this.tracteurs = data || [];
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Erreur chargement tracteurs:', err);
        this.showError('Erreur lors du chargement des tracteurs');
      }
    });
  }


// Méthodes pour la sélection
toggleTravailleur(id: string): void {
  const index = this.formData.travailleurIds.indexOf(id);
  if (index === -1) {
    this.formData.travailleurIds.push(id);
  } else {
    this.formData.travailleurIds.splice(index, 1);
  }
  this.cdr.markForCheck();
  }

formatExperience(experience: number): string {
  if (!experience) return 'Débutant';
  if (experience === 1) return '1 an d\'expérience';
  return `${experience} ans d'expérience`;
}

isTravailleurSelected(id: string): boolean {
  return this.formData.travailleurIds.includes(id);
}
onSubmit() {
  this.errorMessage = '';
  this.successMessage = '';

  if (!this.formData.vergerId) {
    this.showError('Veuillez sélectionner un verger');
    return;
  }
  if (!this.formData.benneId) {
    this.showError('Veuillez sélectionner une benne');
    return;
  }
  if (!this.formData.tracteurId) {
    this.showError('Veuillez sélectionner un tracteur');
    return;
  }
  if (!this.formData.travailleurIds || this.formData.travailleurIds.length === 0) {
    this.showError('Veuillez sélectionner au moins un travailleur');
    return;
  }
  if (this.formData.dateDebut >= this.formData.dateFin) {
    this.showError('La date de fin doit être après la date de début');
    return;
  }

  this.isSubmitting = true;
  this.cdr.markForCheck();

  // Create UTC dates from local date
  const startDate = new Date(this.formData.dateDebut);
  const endDate = new Date(this.formData.dateFin);

  // Create UTC dates (remove timezone offset)
  const utcStart = new Date(Date.UTC(
    startDate.getFullYear(),
    startDate.getMonth(),
    startDate.getDate(),
    startDate.getHours(),
    startDate.getMinutes(),
    0
  ));

  const utcEnd = new Date(Date.UTC(
    endDate.getFullYear(),
    endDate.getMonth(),
    endDate.getDate(),
    endDate.getHours(),
    endDate.getMinutes(),
    0
  ));

  const requestData: TourneeRequest = {
    vergerId: this.formData.vergerId,
    benneId: this.formData.benneId,
    tracteurId: this.formData.tracteurId,
    travailleurIds: this.formData.travailleurIds,
    nbreArbre: this.formData.nbreArbre,
    dateDebut: this.formData.dateDebut,  // Envoyer directement
    dateFin: this.formData.dateFin,  // Envoyer directement
    distanceTotale: this.formData.distanceTotale,
    observations: this.formData.observations || ''
  };

  console.log('Local date:', this.formData.dateDebut);
  console.log('UTC date sent:', utcStart);

  this.tourneeService.create(requestData).subscribe({
    next: (response) => {
      console.log('Tournée créée:', response);
      this.successMessage = 'Tournée créée avec succès !';
      this.isSubmitting = false;
      this.cdr.markForCheck();

      setTimeout(() => {
        this.router.navigate(['/tournees']);
      }, 2000);
    },
    error: (err) => {
      console.error('Full error object:', err);

      let errorMsg = 'Erreur lors de la création de la tournée';

      // CORRECTION: Meilleure extraction du message d'erreur
      if (err.error) {
        // Si l'erreur est une chaîne
        if (typeof err.error === 'string') {
          errorMsg = err.error;
        }
        // Si l'erreur a une propriété 'error' (comme dans votre cas)
        else if (err.error.error && typeof err.error.error === 'string') {
          errorMsg = err.error.error;
        }
        // Si l'erreur a une propriété 'message'
        else if (err.error.message) {
          errorMsg = err.error.message;
        }
        // Si c'est un objet avec d'autres propriétés
        else if (typeof err.error === 'object') {
          errorMsg = JSON.stringify(err.error);
        }
      } else if (err.message) {
        errorMsg = err.message;
      }

      // Afficher l'erreur complète dans la console pour le débogage
      console.error('Extracted error message:', errorMsg);

      this.showError(errorMsg);
      this.isSubmitting = false;
      this.cdr.markForCheck();
    }
  });
}

  showError(message: string) {
    this.errorMessage = message;
    this.successMessage = '';
    this.cdr.markForCheck();
    setTimeout(() => {
      this.errorMessage = '';
      this.cdr.markForCheck();
    }, 5000);
  }

  onCancel() {
    this.router.navigate(['/tournees']);
  }

  toggleSidebar() {
    this.isSidebarCollapsed = !this.isSidebarCollapsed;
  }
}
