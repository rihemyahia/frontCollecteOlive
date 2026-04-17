import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-event-detail-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="modal-overlay" *ngIf="isOpen" (click)="close()">
      <div class="modal-container" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h4 class="modal-title">
            <span class="event-icon">🫒</span>
            Détails de la collecte
          </h4>
          <button type="button" class="btn-close" (click)="close()">×</button>
        </div>
        <div class="modal-body">
          <!-- Statut Badge -->
          <div class="status-badge" [class]="getStatusClass(event?.statut)">
            {{ getStatusLabel(event?.statut) }}
          </div>

          <!-- Informations générales -->
          <div class="detail-section">
            <h5>📋 Informations générales</h5>
            <div class="detail-grid">
              <div class="detail-item">
                <label>Code tournée:</label>
                <span>{{ event?.collecteCode || event?.id }}</span>
              </div>
              <div class="detail-item">
                <label>Date début:</label>
                <span>{{ event?.debut | date:'dd/MM/yyyy HH:mm' }}</span>
              </div>
              <div class="detail-item" *ngIf="event?.fin">
                <label>Date fin:</label>
                <span>{{ event?.fin | date:'dd/MM/yyyy HH:mm' }}</span>
              </div>
              <div class="detail-item">
                <label>Statut:</label>
                <span>{{ getStatusLabel(event?.statut) }}</span>
              </div>
            </div>
          </div>

          <!-- Informations du verger -->
          <div class="detail-section">
            <h5>🌳 Informations du verger</h5>
            <div class="detail-grid">
              <div class="detail-item">
                <label>Type d'olive:</label>
                <span>{{ event?.vergerTypeOlive || event?.vergerNom }}</span>
              </div>
              <div class="detail-item" *ngIf="event?.vergerSuperficie && event?.vergerSuperficie !== 'N/A'">
                <label>Superficie:</label>
                <span>{{ event?.vergerSuperficie }} hectares</span>
              </div>
              <div class="detail-item" *ngIf="event?.vergerNbArbre && event?.vergerNbArbre !== 'N/A'">
                <label>Nombre d'arbres:</label>
                <span>{{ event?.vergerNbArbre }} arbres</span>
              </div>
              <div class="detail-item" *ngIf="event?.nbreArbre && event?.nbreArbre !== 0">
                <label>Arbres récoltés:</label>
                <span>{{ event?.nbreArbre }} arbres</span>
              </div>
              <div class="detail-item" *ngIf="event?.vergerStatut && event?.vergerStatut !== 'N/A'">
                <label>Statut verger:</label>
                <span>{{ getVergerStatusLabel(event?.vergerStatut) }}</span>
              </div>
              <div class="detail-item" *ngIf="event?.distanceTotale && event?.distanceTotale !== 0">
                <label>Distance parcourue:</label>
                <span>{{ event?.distanceTotale }} km</span>
              </div>
            </div>
          </div>

          <!-- Informations de l'agriculteur -->
          <div class="detail-section" *ngIf="(event?.agriculteurNom && event?.agriculteurNom !== 'N/A') || (event?.agriculteurPrenom && event?.agriculteurPrenom !== 'N/A')">
            <h5>👨‍🌾 Agriculteur</h5>
            <div class="detail-grid">
              <div class="detail-item" *ngIf="event?.agriculteurPrenom && event?.agriculteurPrenom !== 'N/A' || event?.agriculteurNom && event?.agriculteurNom !== 'N/A'">
                <label>Nom complet:</label>
                <span>{{ event?.agriculteurPrenom }} {{ event?.agriculteurNom }}</span>
              </div>
              <div class="detail-item" *ngIf="event?.agriculteurEmail && event?.agriculteurEmail !== 'N/A'">
                <label>Email:</label>
                <span>{{ event?.agriculteurEmail }}</span>
              </div>
              <div class="detail-item" *ngIf="event?.agriculteurTelephone && event?.agriculteurTelephone !== 'N/A'">
                <label>Téléphone:</label>
                <span>{{ event?.agriculteurTelephone }}</span>
              </div>
            </div>
          </div>

          <!-- Informations de collecte -->
          <div class="detail-section" *ngIf="event?.quantiteCollecteeKg && event?.quantiteCollecteeKg !== 0">
            <h5>📊 Données des collecte</h5>
            <div class="detail-grid">
              <div class="detail-item" *ngIf="event?.quantiteCollecteeKg && event?.quantiteCollecteeKg !== 0">
                <label>Quantité collectée:</label>
                <span>{{ event?.quantiteCollecteeKg }} kg</span>
              </div>
              <div class="detail-item" *ngIf="event?.quantiteCollecteeKg && event?.nbreArbre && event?.quantiteCollecteeKg !== 0 && event?.nbreArbre !== 0">
                <label>Rendement moyen:</label>
                <span>{{ (event?.quantiteCollecteeKg / event?.nbreArbre) | number:'1.0-0' }} kg/arbre</span>
              </div>
            </div>
          </div>

          <!-- Équipe de travailleurs -->
          <div class="detail-section" *ngIf="event?.travailleursNoms?.length > 0">
            <h5>👥 Équipe de collecte</h5>
            <div class="workers-list">
              <span *ngFor="let worker of event?.travailleursNoms" class="worker-tag">
                👤 {{ worker }}
              </span>
            </div>
          </div>

          <!-- Observations -->
          <div class="detail-section" *ngIf="event?.observations && event?.observations !== ''">
            <h5>💬 Observations</h5>
            <div class="observations">
              {{ event?.observations }}
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" (click)="close()">Fermer</button>
          <button *ngIf="isEditable" type="button" class="btn btn-primary" (click)="onEdit()">
            ✏️ Modifier
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.7);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      animation: fadeIn 0.3s ease-out;
    }

    .modal-container {
      background: white;
      border-radius: 12px;
      max-width: 650px;
      width: 90%;
      max-height: 85vh;
      overflow-y: auto;
      box-shadow: 0 20px 60px rgba(0,0,0,0.3);
      animation: slideIn 0.3s ease-out;
    }

    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    @keyframes slideIn {
      from {
        transform: translateY(-30px);
        opacity: 0;
      }
      to {
        transform: translateY(0);
        opacity: 1;
      }
    }

    .modal-header {
      background: linear-gradient(135deg, #2c5f2d 0%, #97bc62 100%);
      color: white;
      padding: 20px;
      border-radius: 12px 12px 0 0;
      display: flex;
      justify-content: space-between;
      align-items: center;
      position: sticky;
      top: 0;
      z-index: 1;
    }

    .modal-title {
      display: flex;
      align-items: center;
      gap: 10px;
      margin: 0;
      font-size: 1.25rem;
    }

    .event-icon {
      font-size: 24px;
    }

    .btn-close {
      background: none;
      border: none;
      font-size: 28px;
      color: white;
      cursor: pointer;
      opacity: 0.8;
      transition: opacity 0.2s;
    }

    .btn-close:hover {
      opacity: 1;
    }

    .modal-body {
      padding: 20px;
    }

    .status-badge {
      display: inline-block;
      padding: 6px 12px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 600;
      margin-bottom: 20px;
    }

    .status-planifiee { background: #3498db; color: white; }
    .status-en-cours { background: #f39c12; color: white; }
    .status-terminee { background: #27ae60; color: white; }
    .status-annulee { background: #e74c3c; color: white; }

    .detail-section {
      margin-bottom: 24px;
      padding-bottom: 16px;
      border-bottom: 1px solid #e9ecef;
    }

    .detail-section:last-child {
      border-bottom: none;
    }

    .detail-section h5 {
      font-size: 16px;
      font-weight: 600;
      margin-bottom: 12px;
      color: #2c5f2d;
      margin-top: 0;
    }

    .detail-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 12px;
    }

    .detail-item {
      display: flex;
      flex-direction: column;
    }

    .detail-item label {
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      color: #7f8c8d;
      margin-bottom: 4px;
    }

    .detail-item span {
      font-size: 14px;
      color: #2c3e50;
      font-weight: 500;
    }

    .workers-list {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }

    .worker-tag {
      background: #ecf0f1;
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 13px;
      color: #2c3e50;
    }

    .observations {
      background: #f8f9fa;
      padding: 12px;
      border-radius: 8px;
      font-size: 14px;
      color: #555;
      font-style: italic;
    }

    .modal-footer {
      border-top: 1px solid #e9ecef;
      padding: 15px 20px;
      display: flex;
      justify-content: flex-end;
      gap: 10px;
      background: white;
      border-radius: 0 0 12px 12px;
      position: sticky;
      bottom: 0;
    }

    .btn {
      padding: 8px 16px;
      border-radius: 6px;
      border: none;
      cursor: pointer;
      font-size: 14px;
      transition: all 0.2s;
    }

    .btn-secondary {
      background: #6c757d;
      color: white;
    }

    .btn-secondary:hover {
      background: #5a6268;
    }

    .btn-primary {
      background: #2c5f2d;
      color: white;
    }

    .btn-primary:hover {
      background: #1e3f1f;
    }
  `]
})
export class EventDetailModalComponent {
  @Input() event: any;
  @Input() isEditable: boolean = false;
  @Input() isOpen: boolean = false;
  @Output() closeModal = new EventEmitter<void>();
  @Output() editEvent = new EventEmitter<any>();

  close() {
    this.closeModal.emit();
  }

  onEdit() {
    this.editEvent.emit(this.event);
  }

  getStatusLabel(statut: string): string {
    const labels: { [key: string]: string } = {
      'PLANIFIEE': '📋 Planifiée',
      'EN_COURS': '🔄 En cours',
      'TERMINEE': '✅ Terminée',
      'ANNULEE': '❌ Annulée'
    };
    return labels[statut] || statut;
  }

  getVergerStatusLabel(statut: string): string {
    const labels: { [key: string]: string } = {
      'NON_RECOLTE': '🌱 Non récolté',
      'EN_COURS': '🔄 En cours de récolte',
      'RECOLTE': '✅ Récolté'
    };
    return labels[statut] || statut;
  }

  getStatusClass(statut: string): string {
    switch(statut) {
      case 'PLANIFIEE': return 'status-planifiee';
      case 'EN_COURS': return 'status-en-cours';
      case 'TERMINEE': return 'status-terminee';
      case 'ANNULEE': return 'status-annulee';
      default: return '';
    }
  }
}
