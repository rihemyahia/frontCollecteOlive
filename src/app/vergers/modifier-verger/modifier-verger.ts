import { Component, OnInit, HostListener, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { VergerService } from '../../services/verger';
import { StatutVerger } from '../../models/enums/statut-verger';
import { AuthService } from '../../services/auth';
import { SideBarResponsable } from '../../sidebar-responsable/sidebar-responsable';
import { Agriculteur, AgriculteurService } from '../../services/agriculteur';

@Component({
  selector: 'app-modifier-verger',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, SideBarResponsable],
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

  statuts = Object.values(StatutVerger);
  typesOlive = ['Chemlali', 'Chétoui', 'Picholine', 'Arbequina', 'Koroneiki', 'Sigoise', 'Lucques'];

  showStatutPanel = false;
  selectedNewStatut: StatutVerger = StatutVerger.NON_RECOLTE;

  constructor(
    private fb: FormBuilder,
    private vergerService: VergerService,
    private authService: AuthService,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef,
    public router: Router,
    private agriculteurService: AgriculteurService,

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
  this.checkMobile();
  this.vergerId = this.route.snapshot.paramMap.get('id')!;

  this.vergerForm = this.fb.group({
    agriculteurId:    ['', Validators.required],
    superficie:       [null, [Validators.required, Validators.min(0.01)]],
    typeOlive:        ['', Validators.required],
    nbArbre:          [null, [Validators.required, Validators.min(1)]],
    rendementEstime:  [null, [Validators.required, Validators.min(0)]],
    maturiteActuelle: [null, [Validators.required, Validators.min(0), Validators.max(100)]],
    statut:           [StatutVerger.NON_RECOLTE]
  });

  // Load farmers first, THEN load the verger so find() can match
  this.agriculteurService.getAll().subscribe(list => {
    this.agriculteurs = list;
    this.loadVerger();
  });
}

  loadVerger(): void {
    this.isLoadingData = true;
    this.cdr.detectChanges();

    this.vergerService.getById(this.vergerId).subscribe({
      next: v => {
  this.vergerForm.patchValue({
    agriculteurId:    v.agriculteurId,
    superficie:       v.superficie,
    typeOlive:        v.typeOlive,
    nbArbre:          v.nbArbre,
    rendementEstime:  v.rendementEstime,
    maturiteActuelle: v.maturiteActuelle,
    statut:           v.statut
  });

  this.selectedNewStatut = v.statut;

  // Try to match from loaded list first
  const match = this.agriculteurs.find(a => a.id === v.agriculteurId);
  if (match) {
    this.selectedAgriculteur = match;
  } else {
    // Fallback using response fields — cast to satisfy the type
    this.selectedAgriculteur = {
      ...({} as Agriculteur),
      id: v.agriculteurId,
      nom: v.agriculteurNom,
      email: v.agriculteurEmail
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
onAgriculteurSearch(query: string): void {
  this.agriculteurSearch = query;
  const q = query.toLowerCase();
  this.filteredAgriculteurs = q.length < 2 ? [] :
    this.agriculteurs.filter(a =>
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

  getStatutLabel(s: string): string {
    if (s === 'NON_RECOLTE') return 'Non récolté';
    if (s === 'EN_COURS') return 'En cours';
    return 'Récolté';
  }

  onSubmit(): void {
    if (this.vergerForm.invalid) {
      this.vergerForm.markAllAsTouched();
      this.cdr.detectChanges();
      return;
    }
    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.vergerService.mettreAJour(this.vergerId, this.vergerForm.value).subscribe({
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

  onChangerStatut(): void {
    if (!this.selectedNewStatut) return;
    this.isLoading = true;

    this.vergerService.changerStatut(this.vergerId, this.selectedNewStatut).subscribe({
      next: () => {
        this.successMessage = 'Statut mis à jour avec succès !';
        this.isLoading = false;
        this.showStatutPanel = false;
        this.vergerForm.patchValue({ statut: this.selectedNewStatut });
        this.cdr.detectChanges();
      },
      error: err => {
        this.errorMessage = err?.error?.message ?? 'Erreur lors du changement de statut.';
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  isResponsableOrAdmin(): boolean {
    return this.userRole === 'RESPONSABLE' || this.userRole === 'ADMIN';
  }
}