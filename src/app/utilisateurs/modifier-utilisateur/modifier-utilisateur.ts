import { Component, OnInit, HostListener, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { UtilisateurService, Utilisateur } from '../../services/utilisateur';
import { SideBarResponsable } from '../../sidebar-responsable/sidebar-responsable';

@Component({
  selector: 'app-modifier-utilisateur',
  standalone: true,
  imports: [CommonModule, FormsModule, SideBarResponsable],
  templateUrl: './modifier-utilisateur.html',
  styleUrls: ['./modifier-utilisateur.css']
})
export class ModifierUtilisateur implements OnInit {

  // Sidebar properties
  isSidebarCollapsed = false;
  isMobile = false;
  userRole = '';

  utilisateur: Utilisateur = {
    id: '',
    nom: '',
    prenom: '',
    telephone: '',
    adresse: '',
    email: '',
    role: 'AGRICULTEUR',
    estActif: true,
    compteActif: true
  };

  isLoading = true;
  isSaving = false;
  errorMessage = '';
  successMessage = '';
  id: string = '';

  showPasswordForm = false;
  passwordData = {
    nouveauMotDePasse: '',
    confirmMotDePasse: ''
  };
  isChangingPassword = false;

  // ========== TRANSPORTEUR: TOURNEES ASSIGNMENT ==========
  showTourneesPanel = false;
  isLoadingTournees = false;
  isSavingTournees = false;
  availableTournees: any[] = [];
  assignedTournees: any[] = [];
  selectedAvailableTourneeIds: Set<string> = new Set();
  availableSearch = '';
  assignedSearch = '';
  availablePage = 1;
  assignedPage = 1;
  readonly tourneesPageSize = 10;

  roles = ['ADMIN', 'RESPONSABLE', 'AGRICULTEUR', 'TRAVAILLEUR', 'TRANSPORTEUR'];

  constructor(
    private route: ActivatedRoute,
    public router: Router,
    private utilisateurService: UtilisateurService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.checkMobile();
    this.loadUserRole();

    this.route.params.subscribe(params => {
      this.id = params['id'];
      console.log('ID from route:', this.id);

      if (this.id && this.id !== 'undefined') {
        this.loadUtilisateur();
      } else {
        this.errorMessage = 'ID utilisateur invalide';
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  @HostListener('window:resize')
  checkMobile(): void {
    this.isMobile = window.innerWidth <= 768;
    if (!this.isMobile && this.isSidebarCollapsed) {
      this.isSidebarCollapsed = false;
    }
  }

  loadUserRole(): void {
    const userStr = localStorage.getItem('currentUser');
    if (userStr) {
      try {
        const userData = JSON.parse(userStr);
        this.userRole = userData.role?.toUpperCase() || 'ADMIN';
      } catch (e) {
        console.error('Error parsing user data', e);
      }
    }
  }

  loadUtilisateur(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.utilisateurService.getById(this.id).subscribe({
      next: (data) => {
        console.log('✅ User loaded successfully:', data);
        this.utilisateur = { ...this.utilisateur, ...data };
        if ((this.utilisateur.role || '').toUpperCase() === 'TRANSPORTEUR') {
          this.showTourneesPanel = true;
          this.refreshTourneesPanels();
        } else {
          this.showTourneesPanel = false;
        }
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('❌ Error loading user:', err);
        this.errorMessage = 'Erreur lors du chargement: ' + (err.error?.message || err.message || 'Erreur inconnue');
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }
onSubmit(): void {
  if (!this.utilisateur.nom || !this.utilisateur.prenom || !this.utilisateur.email) {
    this.errorMessage = 'Veuillez remplir tous les champs obligatoires';
    this.cdr.detectChanges();
    return;
  }

  this.isSaving = true;
  this.errorMessage = '';
  this.successMessage = '';

  // 1. D'abord, mettre à jour les informations de l'utilisateur
  this.utilisateurService.update(this.id, this.utilisateur).subscribe({
    next: () => {
      // 2. Si un nouveau mot de passe a été saisi, le changer aussi
      if (this.passwordData.nouveauMotDePasse && this.passwordData.nouveauMotDePasse.trim() !== '') {
        // Vérifier que les mots de passe correspondent
        if (this.passwordData.nouveauMotDePasse !== this.passwordData.confirmMotDePasse) {
          this.errorMessage = 'Les mots de passe ne correspondent pas';
          this.isSaving = false;
          this.cdr.detectChanges();
          return;
        }
        if (this.passwordData.nouveauMotDePasse.length < 6) {
          this.errorMessage = 'Le mot de passe doit contenir au moins 6 caractères';
          this.isSaving = false;
          this.cdr.detectChanges();
          return;
        }

        // Changer le mot de passe
        this.utilisateurService.changerMotDePasseAdmin(this.id, this.passwordData.nouveauMotDePasse)
          .subscribe({
            next: () => {
              this.successMessage = 'Utilisateur et mot de passe modifiés avec succès !';
              this.isSaving = false;
              this.showPasswordForm = false;
              this.passwordData = { nouveauMotDePasse: '', confirmMotDePasse: '' };
              this.cdr.detectChanges();
              setTimeout(() => {
                this.router.navigate(['/utilisateurs']);
              }, 1500);
            },
            error: (err) => {
              this.errorMessage = 'Erreur lors du changement de mot de passe: ' + (err.error?.message || 'Erreur inconnue');
              this.isSaving = false;
              this.cdr.detectChanges();
            }
          });
      } else {
        this.successMessage = 'Utilisateur modifié avec succès !';
        this.isSaving = false;
        this.cdr.detectChanges();
        setTimeout(() => {
          this.router.navigate(['/utilisateurs']);
        }, 1500);
      }
    },
    error: (err) => {
      this.errorMessage = err.error?.message || 'Erreur lors de la modification';
      this.isSaving = false;
      this.cdr.detectChanges();
    }
  });
}
changePassword(): void {
  console.log('🔑=== DÉBUT changePassword() ===');
  console.log('📝 ID utilisateur:', this.id);
  console.log('📝 Nouveau mot de passe:', this.passwordData.nouveauMotDePasse);
  console.log('📝 Confirmation:', this.passwordData.confirmMotDePasse);

  if (this.passwordData.nouveauMotDePasse !== this.passwordData.confirmMotDePasse) {
    console.log('❌ Erreur: mots de passe non correspondants');
    this.errorMessage = 'Les mots de passe ne correspondent pas';
    this.cdr.detectChanges();
    return;
  }
  if (this.passwordData.nouveauMotDePasse.length < 6) {
    console.log('❌ Erreur: mot de passe trop court');
    this.errorMessage = 'Le mot de passe doit contenir au moins 6 caractères';
    this.cdr.detectChanges();
    return;
  }

  this.isChangingPassword = true;
  this.errorMessage = '';

  console.log('📤 Appel du service changerMotDePasseAdmin...');
  console.log('🔗 URL appelée:', `${this.utilisateurService['apiUrl']}/admin/changer-mot-de-passe/${this.id}`);

  this.utilisateurService.changerMotDePasseAdmin(this.id, this.passwordData.nouveauMotDePasse)
    .subscribe({
      next: (response) => {
        console.log('✅ Succès! Réponse:', response);
        this.successMessage = 'Mot de passe changé avec succès !';
        this.isChangingPassword = false;
        this.showPasswordForm = false;
        this.passwordData = { nouveauMotDePasse: '', confirmMotDePasse: '' };
        this.cdr.detectChanges();
        setTimeout(() => this.successMessage = '', 3000);
      },
      error: (err) => {
        console.error('❌ Erreur complète:', err);
        console.error('❌ Statut:', err.status);
        console.error('❌ Message:', err.message);
        console.error('❌ Corps erreur:', err.error);
        this.errorMessage = err.error?.message || err.error?.error || 'Erreur lors du changement de mot de passe';
        this.isChangingPassword = false;
        this.cdr.detectChanges();
      }
    });
}

  cancelPasswordChange(): void {
    this.showPasswordForm = false;
    this.passwordData = { nouveauMotDePasse: '', confirmMotDePasse: '' };
    this.errorMessage = '';
    this.cdr.detectChanges();
  }

  toggleSidebar(): void {
    this.isSidebarCollapsed = !this.isSidebarCollapsed;
  }

  // ==================== TRANSPORTEUR TOURNEES UI ====================

  private refreshTourneesPanels(): void {
    if (!this.id) return;
    this.isLoadingTournees = true;
    this.errorMessage = '';
    this.selectedAvailableTourneeIds.clear();
    // Failsafe: never keep spinner forever if one request hangs.
    const loadingGuard = setTimeout(() => {
      if (this.isLoadingTournees) {
        this.isLoadingTournees = false;
        this.errorMessage = this.errorMessage || 'Chargement des tournées trop long. Vérifiez que le backend répond.';
        this.cdr.detectChanges();
      }
    }, 12000);

    // Load both lists in parallel (two independent calls)
    this.utilisateurService.getAvailableTourneesForTransporteurAdmin().subscribe({
      next: (response: any) => {
        const list = Array.isArray(response)
          ? response
          : (response?.content || response?.tournees || []);
        // Backend already returns only PLANIFIEE + transporteur null, oldest first.
        this.availableTournees = list;
        this.availablePage = 1;
        this.isLoadingTournees = false;
        clearTimeout(loadingGuard);
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.isLoadingTournees = false;
        clearTimeout(loadingGuard);
        this.errorMessage = err?.error?.error || err?.error?.message || 'Erreur chargement tournées disponibles';
        this.cdr.detectChanges();
      }
    });

    this.utilisateurService.getAssignedTourneesForTransporteurAdmin(this.id).subscribe({
      next: (response: any) => {
        // backend might return { tournees: [...] } or direct array
        const list = (response?.tournees || response?.tourneesAssigned || response) ?? [];
        this.assignedTournees = Array.isArray(list) ? list : [];
        this.assignedPage = 1;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.assignedTournees = [];
        this.errorMessage = err?.error?.error || err?.error?.message || 'Erreur chargement tournées assignées';
        this.cdr.detectChanges();
      }
    });
  }

  toggleAvailableSelection(tourneeId: string): void {
    if (!tourneeId) return;
    const t = this.availableTournees.find(x => (x?.id || x?._id) === tourneeId);
    if (t && this.isTourneeConflictingWithAssigned(t)) {
      this.errorMessage = 'Cette tournée entre en conflit avec une tournée déjà assignée au transporteur.';
      this.cdr.detectChanges();
      return;
    }
    if (this.selectedAvailableTourneeIds.has(tourneeId)) {
      this.selectedAvailableTourneeIds.delete(tourneeId);
    } else {
      this.selectedAvailableTourneeIds.add(tourneeId);
    }
  }

  toggleSelectAllAvailableOnPage(checked: boolean): void {
    this.availablePaged.forEach((t: any) => {
      const id = t?.id || t?._id;
      if (!id) return;
      if (checked) {
        this.selectedAvailableTourneeIds.add(id);
      } else {
        this.selectedAvailableTourneeIds.delete(id);
      }
    });
  }

  clearSelection(): void {
    this.selectedAvailableTourneeIds.clear();
  }

  areAllAvailableOnPageSelected(): boolean {
    const ids = this.availablePaged.map((t: any) => t?.id || t?._id).filter(Boolean);
    if (ids.length === 0) return false;
    return ids.every((id: string) => this.selectedAvailableTourneeIds.has(id));
  }

  // ======= Conflict helpers ========
  private asDate(d: any): Date | null {
    if (!d) return null;
    const date = new Date(d);
    return isNaN(date.getTime()) ? null : date;
  }

  private overlaps(aStart: any, aEnd: any, bStart: any, bEnd: any): boolean {
    const A1 = this.asDate(aStart);
    const A2 = this.asDate(aEnd);
    const B1 = this.asDate(bStart);
    const B2 = this.asDate(bEnd);
    if (!A1 || !A2 || !B1 || !B2) return false;
    return A1 < B2 && B1 < A2;
  }

  isTourneeConflictingWithAssigned(t: any): boolean {
    if (!t || !this.assignedTournees || this.assignedTournees.length === 0) return false;
    for (const a of this.assignedTournees) {
      if (this.overlaps(t.dateDebut, t.dateFin, a.dateDebut, a.dateFin)) return true;
      // also check resource conflicts: same benne or tracteur used in overlapping time
      if (t.benneId && a.benneId && t.benneId === a.benneId && this.overlaps(t.dateDebut, t.dateFin, a.dateDebut, a.dateFin)) return true;
      if (t.tracteurId && a.tracteurId && t.tracteurId === a.tracteurId && this.overlaps(t.dateDebut, t.dateFin, a.dateDebut, a.dateFin)) return true;
    }
    return false;
  }

  transporteurAvailableFlag(): boolean {
    // Prefer explicit flag if provided by server; otherwise compute from assigned tournees
    if (this.utilisateur && typeof this.utilisateur.disponibleTransport === 'boolean') return this.utilisateur.disponibleTransport;
    // compute: transporteur is available if no assigned future/present overlapping tournees
    return !(this.assignedTournees || []).some(a => {
      const now = new Date();
      const start = this.asDate(a.dateDebut);
      const end = this.asDate(a.dateFin);
      if (!start || !end) return false;
      // if assigned tour is not finished or delivered, consider unavailable
      const s = (a.statut || '').toUpperCase();
      return ['PLANIFIEE','EN_COURS','TERMINEE','EN_LIVRAISON'].includes(s) && end >= now;
    });
  }

  isAvailableSelected(tourneeId: string): boolean {
    return this.selectedAvailableTourneeIds.has(tourneeId);
  }

  assignSelectedTournees(): void {
    if (!this.id) return;
    const ids = Array.from(this.selectedAvailableTourneeIds);
    if (ids.length === 0) {
      this.errorMessage = 'Veuillez sélectionner au moins une tournée à assigner';
      this.cdr.detectChanges();
      return;
    }

    this.isSavingTournees = true;
    this.successMessage = '';
    this.errorMessage = '';

    // Merge: keep already assigned + newly selected
    const existingIds = new Set(this.assignedTournees.map(t => t?.id || t?._id).filter(Boolean));
    ids.forEach(x => existingIds.add(x));
    const payload = Array.from(existingIds);

    this.utilisateurService.assignTourneesToTransporteurAdmin(this.id, payload).subscribe({
      next: () => {
        this.successMessage = 'Tournées assignées avec succès';
        this.isSavingTournees = false;
        this.refreshTourneesPanels();
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.isSavingTournees = false;
        this.errorMessage = err?.error?.error || err?.error?.message || 'Erreur lors de l’assignation';
        this.cdr.detectChanges();
      }
    });
  }

  removeAssignedTournee(t: any): void {
    if (!this.id) return;
    const removeId = t?.id || t?._id;
    if (!removeId) return;

    this.isSavingTournees = true;
    this.successMessage = '';
    this.errorMessage = '';

    const remainingIds = this.assignedTournees
      .map(x => x?.id || x?._id)
      .filter((x: any) => !!x && x !== removeId);

    this.utilisateurService.assignTourneesToTransporteurAdmin(this.id, remainingIds).subscribe({
      next: () => {
        this.successMessage = 'Tournée retirée avec succès';
        this.isSavingTournees = false;
        this.refreshTourneesPanels();
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.isSavingTournees = false;
        this.errorMessage = err?.error?.error || err?.error?.message || 'Erreur lors du retrait';
        this.cdr.detectChanges();
      }
    });
  }

  formatTourneeDate(d: any): string {
    if (!d) return 'N/A';
    const date = new Date(d);
    if (isNaN(date.getTime())) return 'N/A';
    return date.toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  }

  getTourneeVergerName(t: any): string {
    return t?.vergerTypeOlive || t?.verger?.typeOlive || 'Verger';
  }

  getTourneeAgriculteurName(t: any): string {
    const flat = t?.vergerAgriculteurNom;
    if (flat) return flat;
    const prenom = t?.verger?.agriculteur?.prenom || '';
    const nom = t?.verger?.agriculteur?.nom || '';
    const full = `${prenom} ${nom}`.trim();
    return full || '—';
  }

  getStatusBadgeClass(statut: string): string {
    const s = (statut || '').toUpperCase();
    if (s === 'PLANIFIEE') return 'badge badge--blue';
    if (s === 'EN_COURS') return 'badge badge--yellow';
    if (s === 'TERMINEE') return 'badge badge--green';
    if (s === 'EN_LIVRAISON') return 'badge badge--cyan';
    if (s === 'LIVREE') return 'badge badge--green';
    if (s === 'ANNULEE') return 'badge badge--red';
    return 'badge';
  }

  get availableFiltered(): any[] {
    const term = this.availableSearch.trim().toLowerCase();
    const base = this.availableTournees;
    if (!term) return base;
    return base.filter(t =>
      this.getTourneeVergerName(t).toLowerCase().includes(term) ||
      this.getTourneeAgriculteurName(t).toLowerCase().includes(term)
    );
  }

  get assignedFiltered(): any[] {
    const term = this.assignedSearch.trim().toLowerCase();
    const base = this.assignedTournees;
    if (!term) return base;
    return base.filter(t =>
      this.getTourneeVergerName(t).toLowerCase().includes(term) ||
      this.getTourneeAgriculteurName(t).toLowerCase().includes(term)
    );
  }

  get availablePaged(): any[] {
    const start = (this.availablePage - 1) * this.tourneesPageSize;
    return this.availableFiltered.slice(start, start + this.tourneesPageSize);
  }

  get assignedPaged(): any[] {
    const start = (this.assignedPage - 1) * this.tourneesPageSize;
    return this.assignedFiltered.slice(start, start + this.tourneesPageSize);
  }

  get availableTotalPages(): number {
    return Math.max(1, Math.ceil(this.availableFiltered.length / this.tourneesPageSize));
  }

  get assignedTotalPages(): number {
    return Math.max(1, Math.ceil(this.assignedFiltered.length / this.tourneesPageSize));
  }

  nextAvailablePage(): void {
    if (this.availablePage < this.availableTotalPages) this.availablePage++;
  }
  prevAvailablePage(): void {
    if (this.availablePage > 1) this.availablePage--;
  }

  nextAssignedPage(): void {
    if (this.assignedPage < this.assignedTotalPages) this.assignedPage++;
  }
  prevAssignedPage(): void {
    if (this.assignedPage > 1) this.assignedPage--;
  }

  onAvailableSearchChange(): void {
    this.availablePage = 1;
  }

  onAssignedSearchChange(): void {
    this.assignedPage = 1;
  }
}
