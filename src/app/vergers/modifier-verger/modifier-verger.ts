// src/app/ressources/vergers/modifier-verger/modifier-verger.ts
import { Component, OnInit, HostListener, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { VergerService } from '../../services/verger';
import { StatutVerger } from '../../models/enums/statut-verger';
import { AuthService } from '../../services/auth';
import { SideBarResponsable } from '../../sidebar-responsable/sidebar-responsable';
import { Agriculteur, AgriculteurService } from '../../services/agriculteur';
import { VergerMapComponent } from '../../shared/verger-map/verger-map';
import { Utilisateur, UtilisateurService } from '../../services/utilisateur';

@Component({
  selector: 'app-modifier-verger',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, SideBarResponsable, VergerMapComponent],
  templateUrl: './modifier-verger.html',
  styleUrl: './modifier-verger.css'
})
export class ModifierVergerComponent implements OnInit {

  agriculteurs: Agriculteur[] = [];
  filteredAgriculteurs: Agriculteur[] = [];
  selectedAgriculteur: Agriculteur | null = null; 
  agriculteurSearch = '';
  showDropdown = false;

  vergerForm!: FormGroup;
  vergerId = '';
  isLoading = false;
  isLoadingData = true;
  successMessage = '';
  errorMessage = '';

  isSidebarCollapsed = false;
  isMobile = false;
  userRole = '';
  isAdmin = false;

  responsables: Utilisateur[] = [];

  statuts = Object.values(StatutVerger);
  typesOlive = ['Chemlali', 'Chétoui', 'Picholine', 'Arbequina', 'Koroneiki', 'Sigoise', 'Lucques'];

  currentStatutFromDb: StatutVerger = StatutVerger.NON_RECOLTE;

  // Variables pour la carte
  selectedLat: number | null = null;
  selectedLng: number | null = null;
  selectedAddress = '';

  constructor(
    private fb: FormBuilder,
    private vergerService: VergerService,
    private authService: AuthService,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef,
    public router: Router,
    private agriculteurService: AgriculteurService,
    private utilisateurService: UtilisateurService,
  ) {}

  @HostListener('window:resize')
  checkMobile(): void {
    this.isMobile = window.innerWidth <= 768;
    if (!this.isMobile) this.isSidebarCollapsed = false;
  }

  toggleSidebar(): void {
    this.isSidebarCollapsed = !this.isSidebarCollapsed;
  }

  ngOnInit(): void {
    this.userRole = this.authService.getUserRole();
    this.isAdmin = this.userRole === 'ADMIN';
    this.checkMobile();
    this.vergerId = this.route.snapshot.paramMap.get('id')!;

    this.vergerForm = this.fb.group({
      agriculteurId:    ['', Validators.required],
      responsableId:    [''],
      superficie:       [null, [Validators.required, Validators.min(0.01)]],
      typeOlive:        ['', Validators.required],
      nbArbre:          [null, [Validators.required, Validators.min(1)]],
      rendementEstime:  [null, [Validators.required, Validators.min(0)]],
      maturiteActuelle: [null, [Validators.required, Validators.min(0), Validators.max(100)]],
      statutOverride:   [''],
      statutOverrideReason: [''],
      latitude:         [null],
      longitude:        [null],
      adresseIndicative: ['']
    });

    if (this.isAdmin) {
      this.vergerForm.get('responsableId')?.setValidators([Validators.required]);
      this.vergerForm.get('responsableId')?.updateValueAndValidity();

      this.utilisateurService.getAll().subscribe(list => {
        this.responsables = (list || []).filter(u => (u.role || '').toUpperCase() === 'RESPONSABLE');
      });
    }

    this.agriculteurService.getAll().subscribe(list => {
      this.agriculteurs = list;
      this.loadVerger();
    });
  }

  loadVerger(): void {
    this.isLoadingData = true;
    this.cdr.detectChanges();

    this.vergerService.getById(this.vergerId).subscribe({
      next: (v: any) => {
        this.vergerForm.patchValue({
          agriculteurId:    v.agriculteurId,
          responsableId:    v.responsableId || '',
          superficie:       v.superficie,
          typeOlive:        v.typeOlive,
          nbArbre:          v.nbArbre,
          rendementEstime:  v.rendementEstime,
          maturiteActuelle: v.maturiteActuelle,
          statutOverride:   '',
          statutOverrideReason: '',
          latitude:         v.geolocalisation?.latitude || null,
          longitude:        v.geolocalisation?.longitude || null,
          adresseIndicative: v.geolocalisation?.adresseIndicative || ''
        });

        this.currentStatutFromDb = v.statut;

        // Charger la position sur la carte si elle existe
        if (v.geolocalisation?.latitude && v.geolocalisation?.longitude) {
          this.selectedLat = v.geolocalisation.latitude;
          this.selectedLng = v.geolocalisation.longitude;
          this.selectedAddress = v.geolocalisation.adresseIndicative || '';
        }

        // Match agriculteur
        const match = this.agriculteurs.find(a => a.id === v.agriculteurId);
        if (match) {
          this.selectedAgriculteur = match;
        } else {
          this.selectedAgriculteur = {
            ...({} as Agriculteur),
            id: v.agriculteurId,
            nom: v.agriculteurNom || '',
            email: v.agriculteurEmail || ''
          };
        }

        this.isLoadingData = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.errorMessage = 'Verger introuvable ou erreur de chargement.';
        this.isLoadingData = false;
        this.cdr.detectChanges();
      }
    });
  }

  // ====================== GESTION CARTE ======================
  onLocationSelected(event: { lat: number; lng: number; address?: string }) {
    this.selectedLat = event.lat;
    this.selectedLng = event.lng;
    this.selectedAddress = event.address || '';

    this.vergerForm.patchValue({
      latitude: event.lat,
      longitude: event.lng,
      adresseIndicative: event.address
    });
    this.cdr.detectChanges();
  }

  // ====================== RECHERCHE AGRICULTEUR ======================
  onAgriculteurSearch(query: string): void {
    this.agriculteurSearch = query;
    const q = query.toLowerCase();
    if (q.length < 2) {
      this.filteredAgriculteurs = [];
      this.showDropdown = false;
      return;
    }
    this.filteredAgriculteurs = this.agriculteurs.filter(a =>
      a.nom.toLowerCase().includes(q) || a.email.toLowerCase().includes(q)
    );
    this.showDropdown = this.filteredAgriculteurs.length > 0;
  }

  selectAgriculteur(a: Agriculteur): void {
    this.selectedAgriculteur = a;
    this.vergerForm.patchValue({ agriculteurId: a.id });
    this.agriculteurSearch = '';
    this.showDropdown = false;
  }

  clearAgriculteur(): void {
    this.selectedAgriculteur = null;
    this.vergerForm.patchValue({ agriculteurId: '' });
  }

  hideDropdown(): void {
    setTimeout(() => { this.showDropdown = false; }, 200);
  }

  // ====================== VALIDATION ======================
  isInvalid(field: string): boolean {
    const ctrl = this.vergerForm.get(field);
    return !!(ctrl?.invalid && ctrl?.touched);
  }

  get maturiteValue(): number {
    return this.vergerForm.get('maturiteActuelle')?.value ?? 0;
  }

  getMaturiteColor(val: number): string {
    if (val < 40) return '#E8A838';
    if (val < 75) return '#A8B84B';
    return '#4A7A2A';
  }

  // ====================== STATUT METHODS ======================
  getStatutClass(statut: string): string {
    switch(statut) {
      case 'NON_RECOLTE': return 'badge-warning';
      case 'EN_COURS': return 'badge-info';
      case 'RECOLTE': return 'badge-success';
      default: return '';
    }
  }

  getStatutLabel(statut: string): string {
    switch(statut) {
      case 'NON_RECOLTE': return 'Non récolté';
      case 'EN_COURS': return 'En cours';
      case 'RECOLTE': return 'Récolté';
      default: return statut;
    }
  }

  // ====================== SOUMISSION ======================
  onSubmit(): void {
    if (this.vergerForm.invalid) {
      this.vergerForm.markAllAsTouched();
      this.cdr.detectChanges();
      return;
    }

    if (!this.selectedLat || !this.selectedLng) {
      this.errorMessage = 'Veuillez sélectionner la localisation du verger sur la carte.';
      this.cdr.detectChanges();
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    const payload = {
      ...this.vergerForm.value,
      latitude: this.selectedLat,
      longitude: this.selectedLng,
      adresseIndicative: this.selectedAddress
    };
    
    const overrideStatut = this.vergerForm.get('statutOverride')?.value as string;
    const overrideReason = (this.vergerForm.get('statutOverrideReason')?.value || '').trim();
    
    if (overrideStatut) {
      if (!overrideReason) {
        this.errorMessage = 'La raison est obligatoire pour modifier le statut.';
        this.isLoading = false;
        this.cdr.detectChanges();
        return;
      }
      (payload as any).statut = overrideStatut;
      (payload as any).statutOverrideReason = overrideReason;
    }
    delete (payload as any).statutOverride;

    const endpoint$ = this.isAdmin
      ? this.vergerService.mettreAJourAdmin(this.vergerId, payload)
      : this.vergerService.mettreAJour(this.vergerId, payload);

    endpoint$.subscribe({
      next: () => {
        this.successMessage = 'Verger mis à jour avec succès !';
        this.isLoading = false;
        this.cdr.detectChanges();
        setTimeout(() => this.router.navigate(['/vergers']), 1500);
      },
      error: err => {
        this.errorMessage = err?.error?.message ?? 'Erreur lors de la mise à jour.';
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  isResponsableOrAdmin(): boolean {
    return this.userRole === 'RESPONSABLE' || this.userRole === 'ADMIN';
  }
}