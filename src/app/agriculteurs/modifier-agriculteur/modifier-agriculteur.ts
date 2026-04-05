import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AgriculteurService } from '../../services/agriculteur';
import { SideBarResponsable } from '../../sidebar-responsable/sidebar-responsable';
import { HostListener } from '@angular/core';

@Component({
  selector: 'app-modifier-agriculteur',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule,SideBarResponsable],
  templateUrl: './modifier-agriculteur.html',
  styleUrls: ['./modifier-agriculteur.css']
})
export class ModifierAgriculteur implements OnInit {
  isSidebarCollapsed = false;
  isMobile = false;
  userRole: string = '';

  modificationForm: FormGroup;
  agriculteurId: string = '';
  agriculteurEmail: string = '';
  isLoading = true;
  saving = false;
  errorMessage = '';
  successMessage = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private fb: FormBuilder,
    private agriculteurService: AgriculteurService,
    private cdr: ChangeDetectorRef          // ← Important pour résoudre le problème de chargement
  ) {
    this.modificationForm = this.fb.group({
      prenom: ['', [Validators.required, Validators.minLength(2)]],
      nom: ['', [Validators.required, Validators.minLength(2)]],
      telephone: ['', [Validators.required, Validators.pattern('^[0-9]{8}$')]],
      adresse: ['', Validators.required],
      nomExploitation: ['', [Validators.minLength(3)]]   // required retiré pour éviter le blocage avec null
    });
  }
  @HostListener('window:resize')
  checkMobile(): void {
    this.isMobile = window.innerWidth <= 768;
    if (!this.isMobile) {
      this.isSidebarCollapsed = false;
    }
  }

  toggleSidebar(): void {
    this.isSidebarCollapsed = !this.isSidebarCollapsed;
  }

  ngOnInit(): void {
    this.agriculteurId = this.route.snapshot.params['id'];

    if (!this.agriculteurId) {
      this.errorMessage = 'ID de l\'agriculteur non trouvé dans l\'URL';
      this.isLoading = false;
      this.cdr.detectChanges();
      return;
    }

    this.loadAgriculteur();
  }

  loadAgriculteur(): void {
    this.isLoading = true;
    this.errorMessage = '';

    console.log('🔍 Chargement agriculteur ID:', this.agriculteurId);

    this.agriculteurService.getById(this.agriculteurId).subscribe({
      next: (agriculteur) => {
        console.log('✅ Agriculteur chargé:', agriculteur);

        this.agriculteurEmail = agriculteur.email || '';

        // Patch sécurisé contre les valeurs null
        this.modificationForm.patchValue({
          prenom: agriculteur.prenom || '',
          nom: agriculteur.nom || '',
          telephone: agriculteur.telephone || '',
          adresse: agriculteur.adresse || '',
          nomExploitation: agriculteur.nomExploitation || ''
        });

        this.isLoading = false;
        this.cdr.detectChanges();        // ← Force l'affichage du formulaire
      },
      error: (err) => {
        console.error('❌ Erreur lors du chargement:', err);

        if (err.status === 404) {
          this.errorMessage = 'Agriculteur non trouvé.';
        } else if (err.status === 401 || err.status === 403) {
          this.errorMessage = 'Session expirée. Veuillez vous reconnecter.';
          setTimeout(() => this.router.navigate(['/login']), 2000);
        } else {
          this.errorMessage = 'Erreur lors du chargement des données.';
        }

        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  onSubmit(): void {
    if (this.modificationForm.invalid) {
      this.errorMessage = 'Veuillez remplir tous les champs correctement';
      this.cdr.detectChanges();
      return;
    }

    this.saving = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.agriculteurService.update(this.agriculteurId, this.modificationForm.value).subscribe({
      next: () => {
        this.successMessage = 'Agriculteur modifié avec succès';
        this.saving = false;
        this.cdr.detectChanges();

        setTimeout(() => {
          this.router.navigate(['/agriculteurs']);
        }, 2000);
      },
      error: (err) => {
        console.error('❌ Erreur lors de la modification:', err);
        this.errorMessage = err.error?.message || 'Erreur lors de la modification';
        this.saving = false;
        this.cdr.detectChanges();
      }
    });
  }

  cancel(): void {
    this.router.navigate(['/agriculteurs']);
  }
}
