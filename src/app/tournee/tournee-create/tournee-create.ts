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

  loadTravailleurs() {
    this.utilisateurService.getTravailleurs().subscribe({
      next: (data) => {
        this.travailleurs = data || [];
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Erreur chargement travailleurs:', err);
        this.showError('Erreur lors du chargement des travailleurs');
      }
    });
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

  // FIX: Create UTC dates from local date
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
    dateDebut: utcStart,
    dateFin: utcEnd,
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
      console.error('Error:', err);
      let errorMsg = 'Erreur lors de la création de la tournée';
      if (err.error?.message) errorMsg = err.error.message;
      else if (err.message) errorMsg = err.message;
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
