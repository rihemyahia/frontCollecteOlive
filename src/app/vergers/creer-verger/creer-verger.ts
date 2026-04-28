import { Component, OnInit, HostListener, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { VergerService } from '../../services/verger';
import { StatutVerger } from '../../models/enums/statut-verger';
import { AuthService } from '../../services/auth';
import { SideBarResponsable } from '../../sidebar-responsable/sidebar-responsable';
import { Agriculteur, AgriculteurService } from '../../services/agriculteur';
import { VergerMapComponent } from '../../shared/verger-map/verger-map';   // ← AJOUTÉ
import { Utilisateur, UtilisateurService } from '../../services/utilisateur';

@Component({
  selector: 'app-creer-verger',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, SideBarResponsable, VergerMapComponent],  // ← AJOUTÉ VergerMapComponent
  templateUrl: './creer-verger.html',
  styleUrl: './creer-verger.css'
})
export class CreerVergerComponent implements OnInit {

  vergerForm!: FormGroup;
  isLoading = false;
  successMessage = '';
  errorMessage = '';

  isSidebarCollapsed = false;
  isMobile = false;
  userRole = '';
  isAdmin = false;

  typesOlive = ['Chemlali', 'Chétoui', 'Picholine', 'Arbequina', 'Koroneiki', 'Sigoise', 'Lucques'];

  agriculteurs: Agriculteur[] = [];
  filteredAgriculteurs: Agriculteur[] = [];
  selectedAgriculteur: Agriculteur | null = null; 
  agriculteurSearch = '';
  showDropdown = false;

  // === Variables pour la carte ===
  selectedLat: number | null = null;
  selectedLng: number | null = null;
  selectedAddress = '';

  responsables: Utilisateur[] = [];

  constructor(
    private fb: FormBuilder,
    private vergerService: VergerService,
    private authService: AuthService,
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

    this.agriculteurService.getAll().subscribe(list => {
      this.agriculteurs = list;
    });

    if (this.isAdmin) {
      this.utilisateurService.getAll().subscribe(list => {
        this.responsables = (list || []).filter(u => (u.role || '').toUpperCase() === 'RESPONSABLE');
      });
    }

    this.vergerForm = this.fb.group({
      agriculteurId:    ['', Validators.required],
      responsableId:    [''],
      superficie:       [null, [Validators.required, Validators.min(0.01)]],
      typeOlive:        ['', Validators.required],
      nbArbre:          [null, [Validators.required, Validators.min(1)]],
      rendementEstime:  [null, [Validators.required, Validators.min(0)]],
      maturiteActuelle: [null, [Validators.required, Validators.min(0), Validators.max(100)]],
      latitude:         [null],
      longitude:        [null],
      adresseIndicative: ['']
    });

    if (this.isAdmin) {
      this.vergerForm.get('responsableId')?.setValidators([Validators.required]);
      this.vergerForm.get('responsableId')?.updateValueAndValidity();
    }
  }

  // ====================== GESTION DE LA CARTE ======================
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

  // ====================== SOUMISSION ======================
  onSubmit(): void {
    if (this.vergerForm.invalid) {
      this.vergerForm.markAllAsTouched();
      this.cdr.detectChanges();
      return;
    }

    // Vérification obligatoire de la localisation
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

    this.vergerService.creer(payload).subscribe({
      next: () => {
        this.successMessage = 'Verger créé avec succès !';
        this.isLoading = false;
        this.cdr.detectChanges();
        setTimeout(() => this.router.navigate(['/vergers']), 1500);
      },
      error: err => {
        this.errorMessage = err?.error?.message ?? 'Erreur lors de la création du verger.';
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  // ====================== RECHERCHE AGRICULTEUR (inchangé) ======================
  onFocusSearch(): void {
    if (this.filteredAgriculteurs.length > 0) {
      this.showDropdown = true;
    }
  }

  hideDropdown(): void {
    setTimeout(() => { this.showDropdown = false; }, 300);
  }

  onAgriculteurSearch(query: string): void {
    this.agriculteurSearch = query;
    const q = query.toLowerCase().trim();
    if (q.length < 2) {
      this.filteredAgriculteurs = [];
      this.showDropdown = false;
      return;
    }
    this.filteredAgriculteurs = this.agriculteurs.filter(a =>
      a.nom.toLowerCase().includes(q) || a.email.toLowerCase().includes(q)
    );
    this.showDropdown = this.filteredAgriculteurs.length > 0;
    this.cdr.detectChanges();
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

  onReset(): void {
    this.vergerForm.reset();
    this.selectedLat = null;
    this.selectedLng = null;
    this.selectedAddress = '';
    this.errorMessage = '';
    this.successMessage = '';
    this.cdr.detectChanges();
  }
}