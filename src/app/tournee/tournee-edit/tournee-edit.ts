// src/app/tournees/tournee-edit/tournee-edit.component.ts
import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { TourneeService, TourneeRequest } from '../../services/tournee';

@Component({
  selector: 'app-tournee-edit',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="edit-container">
      <div class="edit-card">
        <div class="edit-header">
          <h2>✏️ Modifier la tournée</h2>
          <button class="btn-back" (click)="goBack()">← Retour</button>
        </div>

        <div *ngIf="isLoading" class="loading">
          <div class="spinner"></div>
          Chargement...
        </div>

        <div *ngIf="errorMessage" class="error">{{ errorMessage }}</div>
        <div *ngIf="successMessage" class="success">{{ successMessage }}</div>

        <form *ngIf="!isLoading && tournee" (ngSubmit)="onSubmit()">
          <div class="form-group">
            <label>Code</label>
            <input type="text" [value]="tournee.code" class="form-control" disabled>
          </div>

          <div class="form-group">
            <label>Statut</label>
            <input type="text" [value]="tournee.statut" class="form-control" disabled>
          </div>

          <div class="form-group">
            <label>Verger</label>
            <input type="text" [value]="tournee.vergerTypeOlive" class="form-control" disabled>
          </div>

          <div class="form-group">
            <label>Agriculteur</label>
            <input type="text" [value]="tournee.vergerAgriculteurNom" class="form-control" disabled>
          </div>

          <div class="form-group">
            <label>Date début</label>
            <input type="datetime-local" [(ngModel)]="dateDebutStr" name="dateDebut" class="form-control" required>
          </div>

          <div class="form-group">
            <label>Date fin</label>
            <input type="datetime-local" [(ngModel)]="dateFinStr" name="dateFin" class="form-control" required>
          </div>

          <div class="form-group">
            <label>Benne</label>
            <input type="text" [value]="tournee.benneNom" class="form-control" disabled>
          </div>

          <div class="form-group">
            <label>Tracteur</label>
            <input type="text" [value]="tournee.tracteurNom" class="form-control" disabled>
          </div>

          <div class="form-group">
            <label>Distance totale (km)</label>
            <input type="number" [(ngModel)]="formData.distanceTotale" name="distanceTotale" class="form-control" step="0.1">
          </div>

          <div class="form-group">
            <label>Observations</label>
            <textarea [(ngModel)]="formData.observations" name="observations" class="form-control" rows="3"></textarea>
          </div>

          <div class="form-group">
            <label>Destination livraison</label>
            <input type="text" [(ngModel)]="formData.livraisonDestinationNom" name="livraisonDestinationNom" class="form-control">
          </div>

          <div class="form-group">
            <label>Adresse livraison</label>
            <input type="text" [(ngModel)]="formData.livraisonDestinationAdresse" name="livraisonDestinationAdresse" class="form-control">
          </div>

          <div class="form-actions">
            <button type="button" class="btn-cancel" (click)="goBack()">Annuler</button>
            <button type="submit" class="btn-save" [disabled]="isSaving">
              {{ isSaving ? 'Enregistrement...' : '💾 Enregistrer' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  `,
  styles: [`
    .edit-container {
      padding: 2rem;
      max-width: 800px;
      margin: 0 auto;
    }
    .edit-card {
      background: white;
      border-radius: 16px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.1);
      padding: 2rem;
    }
    .edit-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 2rem;
      padding-bottom: 1rem;
      border-bottom: 2px solid #e9ecef;
    }
    .edit-header h2 {
      margin: 0;
      color: #2d3e50;
    }
    .btn-back {
      background: #6c757d;
      color: white;
      border: none;
      padding: 8px 16px;
      border-radius: 8px;
      cursor: pointer;
    }
    .btn-back:hover {
      background: #5a6268;
    }
    .form-group {
      margin-bottom: 1.5rem;
    }
    label {
      display: block;
      margin-bottom: 0.5rem;
      font-weight: 500;
      color: #495057;
    }
    .form-control {
      width: 100%;
      padding: 10px 12px;
      border: 1px solid #ced4da;
      border-radius: 8px;
      font-size: 1rem;
    }
    textarea.form-control {
      resize: vertical;
    }
    .form-control:focus {
      outline: none;
      border-color: #80bdff;
      box-shadow: 0 0 0 2px rgba(0,123,255,0.25);
    }
    .form-actions {
      display: flex;
      gap: 1rem;
      justify-content: flex-end;
      margin-top: 2rem;
    }
    .btn-cancel {
      background: #e9ecef;
      color: #495057;
      border: none;
      padding: 10px 20px;
      border-radius: 8px;
      cursor: pointer;
    }
    .btn-cancel:hover {
      background: #dee2e6;
    }
    .btn-save {
      background: #28a745;
      color: white;
      border: none;
      padding: 10px 20px;
      border-radius: 8px;
      cursor: pointer;
    }
    .btn-save:hover {
      background: #218838;
    }
    .btn-save:disabled {
      background: #6c757d;
      cursor: not-allowed;
    }
    .loading, .error, .success {
      text-align: center;
      padding: 2rem;
    }
    .error {
      color: #dc3545;
      background: #f8d7da;
      border-radius: 8px;
    }
    .success {
      color: #28a745;
      background: #d4edda;
      border-radius: 8px;
    }
    .spinner {
      width: 40px;
      height: 40px;
      margin: 0 auto 1rem;
      border: 4px solid #e9ecef;
      border-top-color: #28a745;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  `]
})
export class TourneeEditComponent implements OnInit {
  tournee: any = null;
  formData: TourneeRequest = {
    vergerId: '',
    benneId: '',
    tracteurId: '',
    travailleurIds: [],
    dateDebut: new Date(),
    dateFin: new Date(),
    distanceTotale: undefined,
    observations: '',
    livraisonDestinationNom: '',
    livraisonDestinationAdresse: ''
  };
  dateDebutStr = '';
  dateFinStr = '';
  isLoading = true;
  isSaving = false;
  errorMessage = '';
  successMessage = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private tourneeService: TourneeService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadTournee(id);
    } else {
      this.errorMessage = 'ID de tournée non trouvé';
      this.isLoading = false;
      this.cdr.detectChanges();
    }
  }

  loadTournee(id: string) {
    this.isLoading = true;
    this.errorMessage = '';
    this.cdr.detectChanges();

    this.tourneeService.getById(id).subscribe({
      next: (data) => {
        console.log('Tournée chargée:', data);
        this.tournee = data;

        this.formData = {
          vergerId: data.vergerId || '',
          benneId: data.benneId || '',
          tracteurId: data.tracteurId || '',
          travailleurIds: data.travailleurIds || [],
          dateDebut: data.dateDebut ? new Date(data.dateDebut) : new Date(),
          dateFin: data.dateFin ? new Date(data.dateFin) : new Date(),
          distanceTotale: data.distanceTotale || undefined,
          observations: data.observations || '',
          livraisonDestinationNom: data.livraisonDestinationNom || '',
          livraisonDestinationAdresse: data.livraisonDestinationAdresse || ''
        };

        this.dateDebutStr = this.formatDateForInput(this.formData.dateDebut);
        this.dateFinStr = this.formatDateForInput(this.formData.dateFin);

        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Erreur:', err);
        this.errorMessage = err.error?.message || 'Erreur lors du chargement de la tournée';
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  formatDateForInput(date: Date): string {
    if (!date) return '';
    const d = new Date(date);
    if (isNaN(d.getTime())) return '';
    return d.toISOString().slice(0, 16);
  }

  onSubmit() {
    this.isSaving = true;
    this.errorMessage = '';
    this.successMessage = '';
    this.cdr.detectChanges();

    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.errorMessage = 'ID de tournée non trouvé';
      this.isSaving = false;
      this.cdr.detectChanges();
      return;
    }

    const updateData: TourneeRequest = {
      vergerId: this.formData.vergerId,
      benneId: this.formData.benneId,
      tracteurId: this.formData.tracteurId,
      travailleurIds: this.formData.travailleurIds,
      dateDebut: new Date(this.dateDebutStr),
      dateFin: new Date(this.dateFinStr),
      distanceTotale: this.formData.distanceTotale,
      observations: this.formData.observations,
      livraisonDestinationNom: this.formData.livraisonDestinationNom,
      livraisonDestinationAdresse: this.formData.livraisonDestinationAdresse
    };

    console.log('Update data:', updateData);

    this.tourneeService.update(id, updateData).subscribe({
      next: () => {
        this.successMessage = 'Tournée modifiée avec succès!';
        this.cdr.detectChanges();
        setTimeout(() => {
          this.router.navigate(['/tournees']);
        }, 1500);
      },
      error: (err) => {
        console.error('Erreur update:', err);
        this.errorMessage = err.error?.message || 'Erreur lors de la mise à jour';
        this.isSaving = false;
        this.cdr.detectChanges();
      }
    });
  }

  goBack() {
    this.router.navigate(['/tournees']);
  }
}
