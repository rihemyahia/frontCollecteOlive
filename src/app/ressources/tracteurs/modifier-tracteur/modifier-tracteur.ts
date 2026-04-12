// src/app/ressources/tracteurs/modifier-tracteur/modifier-tracteur.ts
import { Component, OnInit, HostListener, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ReactiveFormsModule, FormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { TracteurService } from '../../../services/tracteur';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { SideBarResponsable } from '../../../sidebar-responsable/sidebar-responsable';
import { Tracteur } from '../../../models/Tracteur';

@Component({
  selector: 'app-modifier-tracteur',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule, FormsModule, SideBarResponsable],
  templateUrl: './modifier-tracteur.html',
  styleUrls: ['./modifier-tracteur.css']
})
export class ModifierTracteurComponent implements OnInit {
  tracteurForm: FormGroup;
  isLoading = true;
  isSaving = false;
  errorMessage = '';
  successMessage = '';
  tracteurId: string = '';

  isSidebarCollapsed = false;
  isMobile = false;
  userRole: string = '';

  constructor(
    private fb: FormBuilder,
    private tracteurService: TracteurService,
    private route: ActivatedRoute,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {
    this.tracteurForm = this.fb.group({
      nom: ['', Validators.required],
      immatriculation: ['', Validators.required],
      puissance: ['', Validators.required],
      carburant: ['', Validators.required],
      consommationHoraire: [0],
      kilometrage: [0],
      aRemorque: [false],
      statut: ['DISPONIBLE', Validators.required]
    });
  }

  ngOnInit(): void {
    this.loadUserRole();
    this.checkMobile();
    this.tracteurId = this.route.snapshot.params['id'];
    this.loadTracteur();
  }

  loadUserRole(): void {
    const userStr = localStorage.getItem('currentUser');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        this.userRole = user.role?.toUpperCase() || '';
      } catch (e) { console.error(e); }
    }
  }

  @HostListener('window:resize')
  checkMobile(): void {
    this.isMobile = window.innerWidth <= 768;
    if (!this.isMobile) this.isSidebarCollapsed = false;
  }

  toggleSidebar(): void {
    this.isSidebarCollapsed = !this.isSidebarCollapsed;
  }

  loadTracteur(): void {
    this.isLoading = true;
    this.tracteurService.getById(this.tracteurId).subscribe({
      next: (data: Tracteur) => {
        this.tracteurForm.patchValue({
          nom: data.nom,
          immatriculation: data.immatriculation,
          puissance: data.puissance,
          carburant: data.carburant,
          consommationHoraire: data.consommationHoraire || 0,
          kilometrage: data.kilometrage || 0,
          aRemorque: data.aRemorque || false,
          statut: data.statut || 'DISPONIBLE'
        });
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err: HttpErrorResponse) => {
        this.errorMessage = err.message || 'Erreur lors du chargement';
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  onSubmit(): void {
    if (this.tracteurForm.invalid) {
      this.errorMessage = 'Veuillez remplir tous les champs obligatoires';
      return;
    }

    this.isSaving = true;
    this.errorMessage = '';
    this.successMessage = '';

    const tracteurData = {
      nom: this.tracteurForm.value.nom,
      immatriculation: this.tracteurForm.value.immatriculation,
      puissance: this.tracteurForm.value.puissance,
      carburant: this.tracteurForm.value.carburant,
      consommationHoraire: this.tracteurForm.value.consommationHoraire,
      kilometrage: this.tracteurForm.value.kilometrage,
      aRemorque: this.tracteurForm.value.aRemorque,
      statut: this.tracteurForm.value.statut
    };

    this.tracteurService.update(this.tracteurId, tracteurData).subscribe({
      next: () => {
        this.isSaving = false;
        this.successMessage = 'Tracteur modifié avec succès !';
        this.cdr.detectChanges();
        setTimeout(() => this.router.navigate(['/ressources/tracteurs']), 1500);
      },
      error: (err: HttpErrorResponse) => {
        this.isSaving = false;
        this.errorMessage = err.message || 'Erreur lors de la modification';
        this.cdr.detectChanges();
      }
    });
  }

  cancel(): void {
    this.router.navigate(['/ressources/tracteurs']);
  }
}
