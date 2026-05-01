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
  /** Créneau livraison estimé (optionnel), par id tournée — permet plusieurs livraisons le même jour. */
  deliveryEstimates: Record<string, { debut: string; fin: string; notes: string }> = {};
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
        console.log('[FRONTEND DEBUG] getAvailableTourneesForTransporteurAdmin response:', response);
        
        const list = Array.isArray(response)
          ? response
          : (response?.content || response?.tournees || []);
        
        console.log('[FRONTEND DEBUG] Extracted availableTournees list:', list);
        console.log('[FRONTEND DEBUG] List length:', list?.length);
        if (list && list.length > 0) {
          console.log('[FRONTEND DEBUG] First 3 tournees FULL OBJECTS:');
          for (let i = 0; i < Math.min(3, list.length); i++) {
            console.log(`  [${i}]:`, JSON.stringify(list[i], null, 2));
          }
          console.log('[FRONTEND DEBUG] All tournee IDs:', list.map((t: any) => t?.id || t?._id));
          console.log('[FRONTEND DEBUG] All tournee statuts:', list.map((t: any) => t?.statut));
        }
        
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
        console.error('[FRONTEND ERROR] getAvailableTourneesForTransporteurAdmin error:', err);
        this.cdr.detectChanges();
      }
    });

    this.utilisateurService.getAssignedTourneesForTransporteurAdmin(this.id).subscribe({
      next: (response: any) => {
        console.log('[FRONTEND DEBUG] getAssignedTourneesForTransporteurAdmin response:', response);
        
        // backend might return { tournees: [...] } or direct array
        const list = (response?.tournees || response?.tourneesAssigned || response) ?? [];
        console.log('[FRONTEND DEBUG] Extracted assignedTournees list:', list);
        console.log('[FRONTEND DEBUG] List length:', Array.isArray(list) ? list.length : 'NOT AN ARRAY');
        
        // Align with backend: keep EN_LIVRAISON for conflict checks and UI; drop LIVREE/ANNULEE if ever present.
        const panelList = Array.isArray(list) ? list.filter(t => {
          const s = (t?.statut || '').toString();
          return s !== 'LIVREE' && s !== 'ANNULEE';
        }) : [];
        console.log('[FRONTEND DEBUG] Assigned panel list length:', panelList.length);

        this.assignedTournees = panelList;
        this.assignedPage = 1;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.assignedTournees = [];
        this.errorMessage = err?.error?.error || err?.error?.message || 'Erreur chargement tournées assignées';
        console.error('[FRONTEND ERROR] getAssignedTourneesForTransporteurAdmin error:', err);
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
      delete this.deliveryEstimates[tourneeId];
    } else {
      this.selectedAvailableTourneeIds.add(tourneeId);
    }
  }

  ensureDeliveryEstimate(tourneeId: string): { debut: string; fin: string; notes: string } {
    if (!this.deliveryEstimates[tourneeId]) {
      this.deliveryEstimates[tourneeId] = { debut: '', fin: '', notes: '' };
    }
    return this.deliveryEstimates[tourneeId];
  }

  onDeliveryFieldChange(tourneeId: string, field: 'debut' | 'fin' | 'notes', value: string): void {
    const row = this.ensureDeliveryEstimate(tourneeId);
    row[field] = value ?? '';
    this.cdr.detectChanges();
  }

  toggleSelectAllAvailableOnPage(checked: boolean): void {
    this.availablePaged.forEach((t: any) => {
      const id = t?.id || t?._id;
      if (!id) return;
      if (checked) {
        if (!this.isTourneeConflictingWithAssigned(t)) {
          this.selectedAvailableTourneeIds.add(id);
        }
      } else {
        this.selectedAvailableTourneeIds.delete(id);
        delete this.deliveryEstimates[id];
      }
    });
  }

  clearSelection(): void {
    for (const id of this.selectedAvailableTourneeIds) {
      delete this.deliveryEstimates[id];
    }
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

  /** Fenêtre utilisée pour conflit livraison transporteur (créneau estimé si renseigné, sinon période tournée). */
  private deliveryWindowStart(t: any): Date | null {
    const le = this.asDate(t?.livraisonEstimeDebut);
    const lf = this.asDate(t?.livraisonEstimeFin);
    if (le && lf) return le;
    return this.asDate(t?.dateDebut);
  }

  private deliveryWindowEnd(t: any): Date | null {
    const le = this.asDate(t?.livraisonEstimeDebut);
    const lf = this.asDate(t?.livraisonEstimeFin);
    if (le && lf) return lf;
    return this.asDate(t?.dateFin);
  }

  private pendingDeliveryWindow(t: any): { start: Date; end: Date } | null {
    const id = t?.id || t?._id;
    if (!id) return null;
    const p = this.deliveryEstimates[id];
    if (!p?.debut?.trim() || !p?.fin?.trim()) return null;
    const s = new Date(p.debut);
    const e = new Date(p.fin);
    if (isNaN(s.getTime()) || isNaN(e.getTime()) || e <= s) return null;
    return { start: s, end: e };
  }

  isTourneeConflictingWithAssigned(t: any): boolean {
    if (!t || !this.assignedTournees || this.assignedTournees.length === 0) return false;
    const tid = t?.id || t?._id;
    const pending = tid ? this.pendingDeliveryWindow(t) : null;
    const tLivStart = pending ? pending.start : this.deliveryWindowStart(t);
    const tLivEnd = pending ? pending.end : this.deliveryWindowEnd(t);
    if (!tLivStart || !tLivEnd) return false;

    for (const a of this.assignedTournees) {
      const aStart = this.deliveryWindowStart(a);
      const aEnd = this.deliveryWindowEnd(a);
      if (aStart && aEnd && tLivStart < aEnd && aStart < tLivEnd) return true;
      if (t.benneId && a.benneId && t.benneId === a.benneId
          && this.overlaps(t.dateDebut, t.dateFin, a.dateDebut, a.dateFin)) return true;
      if (t.tracteurId && a.tracteurId && t.tracteurId === a.tracteurId
          && this.overlaps(t.dateDebut, t.dateFin, a.dateDebut, a.dateFin)) return true;
    }
    return false;
  }

  /** True if the transporteur has at least one tour in active delivery (for KPI / hints only). */
  transporteurHasActiveDelivery(): boolean {
    return (this.assignedTournees || []).some(a => (a?.statut || '').toString().toUpperCase() === 'EN_LIVRAISON');
  }

  /** Block unassigning while a delivery is in progress for that tour. */
  canRemoveAssignedTournee(t: any): boolean {
    const s = (t?.statut || '').toString().toUpperCase();
    return s !== 'EN_LIVRAISON';
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
    
    // Safety check: ensure all tournees in payload are assignable (defensive)
    const allTournees = [...this.availableTournees, ...this.assignedTournees];
    const nonAssignableInPayload = payload.filter(pid => {
      const t = allTournees.find(tt => (tt?.id || tt?._id) === pid);
      return t && (t.statut === 'EN_LIVRAISON' || t.statut === 'LIVREE' || t.statut === 'ANNULEE');
    });
    
    if (nonAssignableInPayload.length > 0) {
      console.warn('[FRONTEND WARNING] Non-assignable tournees in payload:', nonAssignableInPayload);
      this.errorMessage = 'Erreur: Certaines tournées ne peuvent pas être assignées (livrées, en livraison, ou annulées).';
      this.cdr.detectChanges();
      return;
    }
    
    console.log('[DEBUG] Selected IDs for assignment:', ids);
    console.log('[DEBUG] Final payload:', payload);

    const livraisonEstimations = payload
      .map((pid: string) => {
        const est = this.deliveryEstimates[pid];
        if (!est?.debut?.trim() || !est?.fin?.trim()) return null;
        const d0 = new Date(est.debut);
        const d1 = new Date(est.fin);
        if (isNaN(d0.getTime()) || isNaN(d1.getTime()) || d1 <= d0) return null;
        const item: { tourneeId: string; livraisonEstimeDebut: string; livraisonEstimeFin: string; livraisonNotes?: string } = {
          tourneeId: pid,
          livraisonEstimeDebut: d0.toISOString(),
          livraisonEstimeFin: d1.toISOString()
        };
        if (est.notes?.trim()) item.livraisonNotes = est.notes.trim();
        return item;
      })
      .filter((x): x is NonNullable<typeof x> => x != null);

    this.utilisateurService.assignTourneesToTransporteurAdmin(
      this.id,
      payload,
      livraisonEstimations.length > 0 ? livraisonEstimations : undefined
    ).subscribe({
      next: () => {
        this.successMessage = 'Tournées assignées avec succès';
        this.isSavingTournees = false;
        this.refreshTourneesPanels();
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('[DEBUG] Backend assignment error:', err);
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
    if (!this.canRemoveAssignedTournee(t)) {
      this.errorMessage = 'Impossible de retirer une tournée pendant la livraison. Terminez la livraison côté transporteur d’abord.';
      this.cdr.detectChanges();
      return;
    }

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

  /** Affichage créneau livraison estimé (tournée déjà assignée). */
  formatLivraisonEstimee(t: any): string {
    const d0 = t?.livraisonEstimeDebut;
    const d1 = t?.livraisonEstimeFin;
    if (!d0 || !d1) return '—';
    return `${this.formatTourneeDate(d0)} → ${this.formatTourneeDate(d1)}`;
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
