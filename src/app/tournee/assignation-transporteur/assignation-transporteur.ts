import { Component, OnInit, HostListener, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { UtilisateurService, Utilisateur } from '../../services/utilisateur';
import { AuthService } from '../../services/auth';
import { SideBarResponsable } from '../../sidebar-responsable/sidebar-responsable';

@Component({
  selector: 'app-assignation-transporteur',
  standalone: true,
  imports: [CommonModule, FormsModule, SideBarResponsable],
  templateUrl: './assignation-transporteur.html',
  styleUrls: ['./assignation-transporteur.css']
})
export class AssignationTransporteurComponent implements OnInit {
  isSidebarCollapsed = false;
  isMobile = false;
  userRole = '';

  transporteurs: Utilisateur[] = [];
  selectedTransporteurId = '';
  isLoadingTransporteurs = false;

  isLoadingTournees = false;
  isSavingTournees = false;
  availableTournees: any[] = [];
  assignedTournees: any[] = [];
  selectedAvailableTourneeIds = new Set<string>();
  deliveryEstimates: Record<string, { debut: string; fin: string; notes: string }> = {};
  /** Filtre serveur (disponibles) — relance l’API après debounce */
  disponiblesSearchText = '';
  assignedSearch = '';
  assignedPage = 1;
  readonly tourneesPageSize = 10;
  readonly disponiblesPageSize = 25;
  disponiblesServerPage = 0;
  disponiblesTotalPages = 1;
  disponiblesTotalElements = 0;
  /** Année sur dateDebut ; 0 = toutes les années */
  filterYear = new Date().getFullYear();
  yearOptions: number[] = [];
  private disponiblesSearchTimer: ReturnType<typeof setTimeout> | null = null;

  successMessage = '';
  errorMessage = '';

  constructor(
    private utilisateurService: UtilisateurService,
    private authService: AuthService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.checkMobile();
    this.loadUserRole();
    const cy = new Date().getFullYear();
    this.yearOptions = [cy, cy - 1, cy - 2, cy - 3, cy - 4, 0];
    this.loadTransporteurs();
  }

  @HostListener('window:resize')
  checkMobile(): void {
    this.isMobile = window.innerWidth <= 768;
    if (!this.isMobile && this.isSidebarCollapsed) {
      this.isSidebarCollapsed = false;
    }
  }

  toggleSidebar(): void {
    this.isSidebarCollapsed = !this.isSidebarCollapsed;
  }

  loadUserRole(): void {
    this.userRole = this.authService.getUserRole();
  }

  loadTransporteurs(): void {
    this.isLoadingTransporteurs = true;
    this.errorMessage = '';
    this.utilisateurService.getTransporteursPourAssignation().subscribe({
      next: (list) => {
        this.transporteurs = (list || []).slice().sort((a, b) => {
          const na = `${a.prenom || ''} ${a.nom || ''}`.trim().toLowerCase();
          const nb = `${b.prenom || ''} ${b.nom || ''}`.trim().toLowerCase();
          return na.localeCompare(nb, 'fr');
        });
        this.isLoadingTransporteurs = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.isLoadingTransporteurs = false;
        this.errorMessage = err?.error?.error || err?.error?.message || 'Impossible de charger les transporteurs.';
        this.cdr.detectChanges();
      }
    });
  }

  onTransporteurChange(): void {
    this.successMessage = '';
    this.errorMessage = '';
    this.selectedAvailableTourneeIds.clear();
    this.deliveryEstimates = {};
    this.disponiblesSearchText = '';
    if (!this.selectedTransporteurId) {
      this.availableTournees = [];
      this.assignedTournees = [];
      return;
    }
    this.refreshTourneesPanels();
  }

  canManageTournee(t: any): boolean {
    if ((this.userRole || '').toUpperCase() === 'ADMIN') return true;
    const rid = this.authService.getUserId();
    return !!(rid && (t?.vergerResponsableId || '') === rid);
  }

  assignedLocked(): any[] {
    return (this.assignedTournees || []).filter((x) => !this.canManageTournee(x));
  }

  assignedManageable(): any[] {
    return (this.assignedTournees || []).filter((x) => this.canManageTournee(x));
  }

  private sortDisponibles(list: any[]): any[] {
    const rank: Record<string, number> = { PLANIFIEE: 0, EN_COURS: 1, TERMINEE: 2 };
    return [...list].sort((a, b) => {
      const sa = (a?.statut || '').toString().toUpperCase();
      const sb = (b?.statut || '').toString().toUpperCase();
      const ra = rank[sa] ?? 50;
      const rb = rank[sb] ?? 50;
      if (ra !== rb) return ra - rb;
      return new Date(a?.dateDebut || 0).getTime() - new Date(b?.dateDebut || 0).getTime();
    });
  }

  private loadDisponiblesPage(): Observable<any[]> {
    return this.utilisateurService
      .getAvailableTourneesForTransporteurAdmin(
        this.disponiblesServerPage,
        this.disponiblesPageSize,
        this.filterYear,
        this.disponiblesSearchText.trim() || undefined
      )
      .pipe(
        map((resp: any) => {
          const raw = resp?.content ?? resp?.tournees ?? [];
          this.disponiblesTotalPages = Math.max(1, Number(resp?.totalPages) || 1);
          this.disponiblesTotalElements = Number(resp?.totalElements ?? (Array.isArray(raw) ? raw.length : 0));
          this.availableTournees = this.sortDisponibles(Array.isArray(raw) ? raw : []);
          return this.availableTournees;
        })
      );
  }

  private reloadDisponiblesOnly(): void {
    if (!this.selectedTransporteurId) return;
    this.isLoadingTournees = true;
    this.loadDisponiblesPage().subscribe({
      next: () => {
        this.isLoadingTournees = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.isLoadingTournees = false;
        this.availableTournees = [];
        this.errorMessage =
          err?.error?.error || err?.error?.message || 'Erreur lors du chargement des tournées disponibles.';
        this.cdr.detectChanges();
      }
    });
  }

  onFilterYearChange(): void {
    if (!this.selectedTransporteurId) return;
    this.disponiblesServerPage = 0;
    this.assignedPage = 1;
    this.reloadDisponiblesOnly();
  }

  onDisponiblesSearchInput(): void {
    if (this.disponiblesSearchTimer) clearTimeout(this.disponiblesSearchTimer);
    this.disponiblesSearchTimer = setTimeout(() => {
      if (!this.selectedTransporteurId) return;
      this.disponiblesServerPage = 0;
      this.reloadDisponiblesOnly();
    }, 400);
  }

  nextDisponiblesServerPage(): void {
    if (this.disponiblesServerPage >= this.disponiblesTotalPages - 1) return;
    this.disponiblesServerPage++;
    this.reloadDisponiblesOnly();
  }

  prevDisponiblesServerPage(): void {
    if (this.disponiblesServerPage <= 0) return;
    this.disponiblesServerPage--;
    this.reloadDisponiblesOnly();
  }

  refreshTourneesPanels(): void {
    const tid = this.selectedTransporteurId;
    if (!tid) return;
    this.isLoadingTournees = true;
    this.errorMessage = '';
    this.disponiblesServerPage = 0;
    const loadingGuard = setTimeout(() => {
      if (this.isLoadingTournees) {
        this.isLoadingTournees = false;
        this.errorMessage = this.errorMessage || 'Chargement trop long — vérifiez le backend.';
        this.cdr.detectChanges();
      }
    }, 12000);

    const assigned$ = this.utilisateurService.getAssignedTourneesForTransporteurAdmin(tid).pipe(
      map((response: any) => {
        const list = (response?.tournees || response?.tourneesAssigned || response) ?? [];
        if (!Array.isArray(list)) return [];
        return list.filter((t: any) => {
          const s = (t?.statut || '').toString();
          return s !==  'ANNULEE';
        });
      })
    );

    forkJoin({ disponibles: this.loadDisponiblesPage(), assignees: assigned$ }).subscribe({
      next: ({ disponibles, assignees }) => {
        void disponibles;
        this.assignedTournees = assignees;
        this.assignedPage = 1;
        this.isLoadingTournees = false;
        clearTimeout(loadingGuard);
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.isLoadingTournees = false;
        clearTimeout(loadingGuard);
        this.availableTournees = [];
        this.assignedTournees = [];
        this.errorMessage =
          err?.error?.error || err?.error?.message || 'Erreur lors du chargement des tournées.';
        this.cdr.detectChanges();
      }
    });
  }

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
    if (!t || !this.assignedTournees?.length) return false;
    const tid = t?.id || t?._id;
    const pending = tid ? this.pendingDeliveryWindow(t) : null;
    const tLivStart = pending ? pending.start : this.deliveryWindowStart(t);
    const tLivEnd = pending ? pending.end : this.deliveryWindowEnd(t);
    if (!tLivStart || !tLivEnd) return false;

    for (const a of this.assignedTournees) {
      const aStart = this.deliveryWindowStart(a);
      const aEnd = this.deliveryWindowEnd(a);
      if (aStart && aEnd && tLivStart < aEnd && aStart < tLivEnd) return true;
      if (
        t.benneId &&
        a.benneId &&
        t.benneId === a.benneId &&
        this.overlaps(t.dateDebut, t.dateFin, a.dateDebut, a.dateFin)
      )
        return true;
      if (
        t.tracteurId &&
        a.tracteurId &&
        t.tracteurId === a.tracteurId &&
        this.overlaps(t.dateDebut, t.dateFin, a.dateDebut, a.dateFin)
      )
        return true;
    }
    return false;
  }

  transporteurHasActiveDelivery(): boolean {
    return (this.assignedTournees || []).some(
      (a) => (a?.statut || '').toString().toUpperCase() === 'EN_LIVRAISON'
    );
  }

  canRemoveAssignedTournee(t: any): boolean {
    const s = (t?.statut || '').toString().toUpperCase();
    return s !== 'EN_LIVRAISON';
  }

  toggleAvailableSelection(tourneeId: string): void {
    if (!tourneeId) return;
    const t = this.availableTournees.find((x) => (x?.id || x?._id) === tourneeId);
    if (t && this.isTourneeConflictingWithAssigned(t)) {
      this.errorMessage =
        'Cette tournée entre en conflit (créneau de livraison ou ressource) avec une tournée déjà assignée.';
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
    this.availableTournees.forEach((t: any) => {
      const id = t?.id || t?._id;
      if (!id) return;
      if (checked) {
        if (!this.isTourneeConflictingWithAssigned(t)) this.selectedAvailableTourneeIds.add(id);
      } else {
        this.selectedAvailableTourneeIds.delete(id);
        delete this.deliveryEstimates[id];
      }
    });
  }

  clearSelection(): void {
    for (const id of this.selectedAvailableTourneeIds) delete this.deliveryEstimates[id];
    this.selectedAvailableTourneeIds.clear();
  }

  areAllAvailableOnPageSelected(): boolean {
    const ids = this.availableTournees.map((t: any) => t?.id || t?._id).filter(Boolean);
    if (!ids.length) return false;
    return ids.every((id: string) => this.selectedAvailableTourneeIds.has(id));
  }

  isAvailableSelected(tourneeId: string): boolean {
    return this.selectedAvailableTourneeIds.has(tourneeId);
  }

  private buildPayloadIds(selectedNew: string[]): string[] {
    const merged = new Set<string>();
    if ((this.userRole || '').toUpperCase() === 'ADMIN') {
      this.assignedTournees.forEach((t) => {
        const id = t?.id || t?._id;
        if (id) merged.add(id);
      });
    } else {
      this.assignedManageable().forEach((t) => {
        const id = t?.id || t?._id;
        if (id) merged.add(id);
      });
    }
    selectedNew.forEach((id) => merged.add(id));
    return Array.from(merged);
  }

  private tourneeIdEquals(a: any, b: any): boolean {
    if (a == null || b == null) return false;
    return String(a) === String(b);
  }

  private findTourneeByIdInPanels(pid: string): any | undefined {
    const key = String(pid);
    return [...this.availableTournees, ...this.assignedTournees].find((tt) =>
      this.tourneeIdEquals(tt?.id || tt?._id, key)
    );
  }

  private normalizeTourneeStatut(statut: any): string {
    return (statut ?? '').toString().trim().toUpperCase();
  }

  /** Statuts bloqués seulement pour les tournées nouvellement cochées dans « disponibles ». */
  private buildNewSelectionStatutError(newIds: string[]): string | null {
    const blocked = new Set(['EN_LIVRAISON', 'LIVREE', 'ANNULEE']);
    const allTournees = [...this.availableTournees, ...this.assignedTournees];
    const lines: string[] = [];
    for (const pid of newIds) {
      const t = allTournees.find((tt) => this.tourneeIdEquals(tt?.id || tt?._id, pid));
      if (!t) {
        lines.push(`• ID « ${pid} » : tournée introuvable dans les listes affichées (actualisez la page).`);
        continue;
      }
      const st = this.normalizeTourneeStatut(t.statut);
      if (!blocked.has(st)) continue;
      const label = this.planificationLabel(t);
      if (st === 'EN_LIVRAISON') {
        lines.push(
          `• ${label} : EN_LIVRAISON — cette tournée est déjà en cours de livraison ; impossible de l’ajouter comme nouvelle assignation.`
        );
      } else if (st === 'LIVREE') {
        lines.push(`• ${label} : LIVRÉE — une tournée déjà livrée ne peut pas être assignée.`);
      } else if (st === 'ANNULEE') {
        lines.push(`• ${label} : ANNULÉE — une tournée annulée ne peut pas être assignée.`);
      }
    }
    if (lines.length === 0) return null;
    return 'Impossible d’assigner cette sélection :\n' + lines.join('\n');
  }

  private resolveLivraisonWindowForPayload(pid: string): { start: Date; end: Date } | null {
    const est = this.deliveryEstimates[pid];
    if (est?.debut?.trim() && est?.fin?.trim()) {
      const s = new Date(est.debut);
      const e = new Date(est.fin);
      if (!isNaN(s.getTime()) && !isNaN(e.getTime()) && e > s) return { start: s, end: e };
    }
    const t = this.findTourneeByIdInPanels(pid);
    if (!t) return null;
    const ls = this.asDate(t?.livraisonEstimeDebut);
    const lf = this.asDate(t?.livraisonEstimeFin);
    if (ls && lf && lf > ls) return { start: ls, end: lf };
    const ds = this.asDate(t?.dateDebut);
    const df = this.asDate(t?.dateFin);
    if (ds && df && df > ds) return { start: ds, end: df };
    return null;
  }

  private findLivraisonOverlapMessage(payloadIds: string[]): string | null {
    const rows: Array<{ code: string; start: Date; end: Date }> = [];
    for (const pid of payloadIds) {
      const w = this.resolveLivraisonWindowForPayload(pid);
        if (!w) {
        const t = this.findTourneeByIdInPanels(pid);
        return `Impossible de vérifier les chevauchements : créneau ou dates manquants pour ${t ? this.planificationLabel(t) : pid}.`;
      }
      const t = this.findTourneeByIdInPanels(pid);
      rows.push({ code: (t ? this.planificationLabel(t) : pid) as string, ...w });
    }
    for (let i = 0; i < rows.length; i++) {
      for (let j = i + 1; j < rows.length; j++) {
        const a = rows[i];
        const b = rows[j];
        if (a.start < b.end && b.start < a.end) {
          return (
            `Chevauchement des créneaux de livraison pour ce transporteur : ${a.code} (${this.formatTourneeDate(a.start)} → ${this.formatTourneeDate(a.end)}) et ${b.code} (${this.formatTourneeDate(b.start)} → ${this.formatTourneeDate(b.end)}). Modifiez les horaires du créneau.`
          );
        }
      }
    }
    return null;
  }

  assignSelectedTournees(): void {
    const tid = this.selectedTransporteurId;
    if (!tid) {
      this.errorMessage = 'Choisissez un transporteur.';
      this.cdr.detectChanges();
      return;
    }
    const ids = Array.from(this.selectedAvailableTourneeIds);
    if (!ids.length) {
      this.errorMessage = 'Sélectionnez au moins une tournée à assigner.';
      this.cdr.detectChanges();
      return;
    }

    this.isSavingTournees = true;
    this.successMessage = '';
    this.errorMessage = '';

    const payload = this.buildPayloadIds(ids);

    const statutErr = this.buildNewSelectionStatutError(ids);
    if (statutErr) {
      this.errorMessage = statutErr;
      this.isSavingTournees = false;
      this.cdr.detectChanges();
      return;
    }

    for (const pid of ids) {
      const est = this.deliveryEstimates[pid];
      if (!est?.debut?.trim() || !est?.fin?.trim()) {
        this.errorMessage =
          'Chaque nouvelle tournée doit avoir un créneau de livraison (début et fin), utilisé pour détecter les chevauchements.';
        this.isSavingTournees = false;
        this.cdr.detectChanges();
        return;
      }
      const d0 = new Date(est.debut);
      const d1 = new Date(est.fin);
      if (isNaN(d0.getTime()) || isNaN(d1.getTime()) || d1 <= d0) {
        this.errorMessage = 'Créneau invalide : la fin doit être après le début.';
        this.isSavingTournees = false;
        this.cdr.detectChanges();
        return;
      }
    }

    const overlapErr = this.findLivraisonOverlapMessage(payload);
    if (overlapErr) {
      this.errorMessage = overlapErr;
      this.isSavingTournees = false;
      this.cdr.detectChanges();
      return;
    }

    const livraisonEstimations = payload
      .map((pid: string) => {
        const est = this.deliveryEstimates[pid];
        if (!est?.debut?.trim() || !est?.fin?.trim()) return null;
        const d0 = new Date(est.debut);
        const d1 = new Date(est.fin);
        if (isNaN(d0.getTime()) || isNaN(d1.getTime()) || d1 <= d0) return null;
        const item: {
          tourneeId: string;
          livraisonEstimeDebut: string;
          livraisonEstimeFin: string;
          livraisonNotes?: string;
        } = {
          tourneeId: pid,
          livraisonEstimeDebut: d0.toISOString(),
          livraisonEstimeFin: d1.toISOString()
        };
        if (est.notes?.trim()) item.livraisonNotes = est.notes.trim();
        return item;
      })
      .filter((x): x is NonNullable<typeof x> => x != null);

    this.utilisateurService.assignTourneesToTransporteurAdmin(tid, payload, livraisonEstimations).subscribe({
      next: () => {
        this.successMessage = 'Tournées assignées avec succès.';
        this.isSavingTournees = false;
        this.selectedAvailableTourneeIds.clear();
        this.refreshTourneesPanels();
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.isSavingTournees = false;
        this.errorMessage = err?.error?.error || err?.error?.message || 'Erreur lors de l’assignation.';
        this.cdr.detectChanges();
      }
    });
  }

  removeAssignedTournee(t: any): void {
    const tid = this.selectedTransporteurId;
    const removeId = t?.id || t?._id;
    if (!tid || !removeId) return;
    if (!this.canManageTournee(t)) {
      this.errorMessage = 'Vous ne pouvez pas retirer cette tournée (hors de votre périmètre ou verrouillée).';
      this.cdr.detectChanges();
      return;
    }
    if (!this.canRemoveAssignedTournee(t)) {
      this.errorMessage =
        'Impossible de retirer une tournée pendant la livraison. Terminez la livraison côté transporteur.';
      this.cdr.detectChanges();
      return;
    }

    this.isSavingTournees = true;
    this.successMessage = '';
    this.errorMessage = '';

    let payload: string[];
    if ((this.userRole || '').toUpperCase() === 'ADMIN') {
      payload = this.assignedTournees
        .map((x) => x?.id || x?._id)
        .filter((x: any) => !!x && x !== removeId);
    } else {
      const remainingScoped = this.assignedManageable()
        .map((x) => x?.id || x?._id)
        .filter((x: any) => !!x && x !== removeId);
      const lockedIds = this.assignedLocked()
        .map((x) => x?.id || x?._id)
        .filter(Boolean);
      payload = Array.from(new Set([...remainingScoped, ...lockedIds]));
    }

    this.utilisateurService.assignTourneesToTransporteurAdmin(tid, payload).subscribe({
      next: () => {
        this.successMessage = 'Tournée retirée.';
        this.isSavingTournees = false;
        this.refreshTourneesPanels();
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.isSavingTournees = false;
        this.errorMessage = err?.error?.error || err?.error?.message || 'Erreur lors du retrait.';
        this.cdr.detectChanges();
      }
    });
  }

  formatTourneeDate(d: any): string {
    if (!d) return '—';
    const date = new Date(d);
    if (isNaN(date.getTime())) return '—';
    return date.toLocaleString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  formatLivraisonEstimee(t: any): string {
    const d0 = t?.livraisonEstimeDebut;
    const d1 = t?.livraisonEstimeFin;
    if (!d0 || !d1) return '—';
    return `${this.formatTourneeDate(d0)} → ${this.formatTourneeDate(d1)}`;
  }

  placementLine(t: any): string {
    const nom = (t?.livraisonDestinationNom || '').trim();
    const adr = (t?.livraisonDestinationAdresse || '').trim();
    if (nom && adr) return `${nom} — ${adr}`;
    return nom || adr || '—';
  }

  /** Affichage liste : date de planification (dateDebut), pas le code métier. */
  planificationLabel(t: any): string {
    const d = this.asDate(t?.dateDebut) || this.asDate(t?.dateCreation);
    if (!d) return 'Planification inconnue';
    return d.toLocaleString('fr-FR', {
      weekday: 'short',
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  private tourneeYear(t: any): number {
    const d = this.asDate(t?.dateDebut) || this.asDate(t?.dateCreation);
    return d ? d.getFullYear() : 0;
  }

  pressoirLine(t: any): string {
    const nom = (t?.pressoirNom || '').trim();
    const adr = (t?.pressoirAdresse || '').trim();
    const resp = (t?.responsablePressoirNom || '').trim();
    if (nom && adr) return resp ? `${nom} — ${adr} (${resp})` : `${nom} — ${adr}`;
    if (nom) return resp ? `${nom} (${resp})` : nom;
    if (adr) return adr;
    const dest = (t?.livraisonDestinationNom || '').trim();
    if (dest) return dest;
    return '—';
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

  get assignedFiltered(): any[] {
    let base = this.assignedTournees;
    if (this.filterYear > 0) {
      base = base.filter((t) => this.tourneeYear(t) === this.filterYear);
    }
    const term = this.assignedSearch.trim().toLowerCase();
    if (!term) return base;
    return base.filter(
      (t) =>
        this.placementLine(t).toLowerCase().includes(term) ||
        this.pressoirLine(t).toLowerCase().includes(term) ||
        this.planificationLabel(t).toLowerCase().includes(term) ||
        (t?.responsablePressoirNom || '').toLowerCase().includes(term)
    );
  }

  get assignedPaged(): any[] {
    const start = (this.assignedPage - 1) * this.tourneesPageSize;
    return this.assignedFiltered.slice(start, start + this.tourneesPageSize);
  }

  get assignedTotalPages(): number {
    return Math.max(1, Math.ceil(this.assignedFiltered.length / this.tourneesPageSize));
  }

  nextAssignedPage(): void {
    if (this.assignedPage < this.assignedTotalPages) this.assignedPage++;
  }
  prevAssignedPage(): void {
    if (this.assignedPage > 1) this.assignedPage--;
  }
  onAssignedSearchChange(): void {
    this.assignedPage = 1;
  }

  transporteurLabel(u: Utilisateur): string {
    return `${u.prenom || ''} ${u.nom || ''}`.trim() || u.email || u.id || '';
  }
}
