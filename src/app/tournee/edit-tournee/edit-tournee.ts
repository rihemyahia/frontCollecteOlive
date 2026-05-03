// src/app/tournees/tournee-edit/tournee-edit.component.ts
import { Component, OnInit, ChangeDetectorRef, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ResponsablePressoirDisponible, TourneeService } from '../../services/tournee';
import { SideBarResponsable } from '../../sidebar-responsable/sidebar-responsable';
import { AuthService } from '../../services/auth';
import { RessourceService } from '../../services/ressource';
import { UtilisateurService } from '../../services/utilisateur';

@Component({
  selector: 'app-tournee-edit',
  standalone: true,
  imports: [CommonModule, FormsModule, SideBarResponsable],
  templateUrl: './edit-tournee.html',
  styleUrls: ['./edit-tournee.css']
})
export class TourneeEditComponent implements OnInit {
  isSidebarCollapsed = false;
  isMobile = false;
  userRole = '';
  isLoading = false;
  isSaving = false;
  errorMessage = '';
  successMessage = '';

  tournee: any = null;

  // Editable fields
  editData = {
    dateDebut: '',
    dateFin: '',
    distanceTotale: null as number | null,
    observations: '',
    livraisonDestinationNom: '',
    livraisonDestinationAdresse: '',
    benneId: '',
    tracteurId: '',
    responsablePressoirId: '',
    travailleurIds: [] as string[]
  };

  dateDebutStr = '';
  dateFinStr = '';

  // Available resources for selection
  bennes: any[] = [];
  tracteurs: any[] = [];
  travailleurs: any[] = [];
  responsablesPressoir: ResponsablePressoirDisponible[] = [];
  
  // Worker selection
  selectedTravailleurId: string = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private tourneeService: TourneeService,
    private authService: AuthService,
    private ressourceService: RessourceService,
    private utilisateurService: UtilisateurService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.userRole = this.authService.getUserRole();
    this.checkMobile();
    this.loadResources();
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadTournee(id);
    } else {
      this.errorMessage = 'ID de tournée non trouvé';
    }
  }

  @HostListener('window:resize')
  checkMobile() {
    this.isMobile = window.innerWidth < 768;
    if (!this.isMobile && this.isSidebarCollapsed) {
      this.isSidebarCollapsed = false;
    }
  }

  toggleSidebar() {
    this.isSidebarCollapsed = !this.isSidebarCollapsed;
  }

  loadResources() {
    // Load bennes
    this.ressourceService.getBennes().subscribe({
      next: (data) => {
        this.bennes = data || [];
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Erreur chargement bennes:', err)
    });

    // Load tracteurs
    this.ressourceService.getTracteurs().subscribe({
      next: (data) => {
        this.tracteurs = data || [];
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Erreur chargement tracteurs:', err)
    });

    // Load workers - FILTER ONLY TRAVAILLEUR ROLE
    this.utilisateurService.getTravailleurs().subscribe({
      next: (data) => {
        this.travailleurs = (data || []).filter(user => user.role?.toUpperCase() === 'TRAVAILLEUR');
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Erreur chargement travailleurs:', err)
    });

    this.tourneeService.getResponsablesPressoirDisponibles().subscribe({
      next: (data) => {
        this.responsablesPressoir = data || [];
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Erreur chargement responsables pressoir:', err)
    });
  }

  loadTournee(id: string) {
    this.isLoading = true;
    this.errorMessage = '';

    this.tourneeService.getById(id).subscribe({
      next: (data) => {
        console.log('Tournée chargée:', data);
        this.tournee = data;

        this.dateDebutStr = this.formatDateForInput(data.dateDebut);
        this.dateFinStr = this.formatDateForInput(data.dateFin);

        this.editData = {
          dateDebut: this.dateDebutStr,
          dateFin: this.dateFinStr,
          distanceTotale: data.distanceTotale || null,
          observations: data.observations || '',
          livraisonDestinationNom: data.livraisonDestinationNom || '',
          livraisonDestinationAdresse: data.livraisonDestinationAdresse || '',
          benneId: data.benneId || '',
          tracteurId: data.tracteurId || '',
          responsablePressoirId: data.responsablePressoirId || '',
          travailleurIds: data.travailleurIds || []
        };

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

  formatDateForInput(date: string | Date): string {
    if (!date) return '';
    const d = new Date(date);
    if (isNaN(d.getTime())) return '';

    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');

    return `${year}-${month}-${day}T${hours}:${minutes}`;
  }

  onDateDebutChange(event: Event) {
    const input = event.target as HTMLInputElement;
    this.dateDebutStr = input.value;
    this.editData.dateDebut = input.value;
    this.cdr.detectChanges();
  }

  onDateFinChange(event: Event) {
    const input = event.target as HTMLInputElement;
    this.dateFinStr = input.value;
    this.editData.dateFin = input.value;
    this.cdr.detectChanges();
  }

  onBenneChange(event: Event) {
    const select = event.target as HTMLSelectElement;
    this.editData.benneId = select.value;
    this.cdr.detectChanges();
  }

  onTracteurChange(event: Event) {
    const select = event.target as HTMLSelectElement;
    this.editData.tracteurId = select.value;
    this.cdr.detectChanges();
  }

  onResponsablePressoirChange(event: Event) {
    const select = event.target as HTMLSelectElement;
    this.editData.responsablePressoirId = select.value;
    this.cdr.detectChanges();
  }

  getResponsablePressoirLabel(responsable: ResponsablePressoirDisponible): string {
    const name = `${responsable.prenom || ''} ${responsable.nom || ''}`.trim() || responsable.email || 'Responsable pressoir';
    const pressoir = responsable.pressoir?.nom || 'Pressoir non renseigne';
    const address = responsable.pressoir?.adresse || 'Adresse non renseignee';
    const capacity = responsable.pressoir?.capaciteJournaliere || 'Capacite non renseignee';
    const availability = responsable.disponible === false ? 'Indisponible' : 'Disponible';
    return `${name} - ${pressoir} - ${address} - ${availability} - ${capacity}`;
  }

  // ==================== WORKER SELECTION METHODS ====================
  
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

  getWorkerName(workerId: string): string {
    const worker = this.travailleurs.find(w => w.id === workerId);
    if (worker) {
      return `${worker.prenom} ${worker.nom}`;
    }
    return 'Travailleur';
  }

  getWorkerSpecialites(workerId: string): string[] {
    const worker = this.travailleurs.find(w => w.id === workerId);
    return worker?.specialites || [];
  }

  addTravailleur(): void {
    if (!this.selectedTravailleurId) return;
    
    if (!this.editData.travailleurIds.includes(this.selectedTravailleurId)) {
      this.editData.travailleurIds.push(this.selectedTravailleurId);
      this.cdr.detectChanges();
    }
    
    this.selectedTravailleurId = '';
  }

  removeTravailleur(workerId: string): void {
    const index = this.editData.travailleurIds.indexOf(workerId);
    if (index !== -1) {
      this.editData.travailleurIds.splice(index, 1);
      this.cdr.detectChanges();
    }
  }

  isTravailleurSelected(workerId: string): boolean {
    return this.editData.travailleurIds.includes(workerId);
  }

  getStatutClass(statut: string): string {
    const classes: Record<string, string> = {
      'PLANIFIEE': 'statut-planifiee',
      'EN_COURS': 'statut-en-cours',
      'TERMINEE': 'statut-terminee',
      'EN_LIVRAISON': 'statut-en-cours',
      'LIVREE': 'statut-terminee',
      'ANNULEE': 'statut-annulee'
    };
    return classes[statut] || '';
  }

  canEdit(): boolean {
    return this.tournee?.statut === 'PLANIFIEE';
  }

  onSubmit() {
    if (!this.canEdit()) {
      this.errorMessage = 'Cette tournée ne peut pas être modifiée car elle n\'est pas planifiée';
      return;
    }

    // Validate dates
    if (!this.dateDebutStr || !this.dateFinStr) {
      this.errorMessage = 'Les dates de début et de fin sont obligatoires';
      return;
    }

    const startDate = new Date(this.dateDebutStr);
    const endDate = new Date(this.dateFinStr);

    if (startDate >= endDate) {
      this.errorMessage = 'La date de fin doit être après la date de début';
      return;
    }

    // Validate at least one worker
    if (this.editData.travailleurIds.length === 0) {
      this.errorMessage = 'Veuillez sélectionner au moins un travailleur';
      return;
    }

    this.isSaving = true;
    this.errorMessage = '';
    this.successMessage = '';

    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.errorMessage = 'ID de tournée non trouvé';
      this.isSaving = false;
      return;
    }

    const updateData: any = {
      vergerId: this.tournee?.vergerId,
      dateDebut: startDate.toISOString(),
      dateFin: endDate.toISOString(),
      distanceTotale: this.editData.distanceTotale,
      observations: this.editData.observations,
      benneId: this.editData.benneId,
      tracteurId: this.editData.tracteurId,
      responsablePressoirId: this.editData.responsablePressoirId || undefined,
      travailleurIds: this.editData.travailleurIds
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

        let errorMsg = 'Erreur lors de la mise à jour';
        if (err.error?.error) {
          errorMsg = err.error.error;
        } else if (err.error?.message) {
          errorMsg = err.error.message;
        }

        this.errorMessage = errorMsg;
        this.isSaving = false;
        this.cdr.detectChanges();
      }
    });
  }

  goBack() {
    this.router.navigate(['/tournees']);
  }
}