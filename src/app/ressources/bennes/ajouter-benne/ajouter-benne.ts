// src/app/ressources/bennes/ajouter-benne/ajouter-benne.ts
import { Component, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { BenneService } from '../../../services/benne';
import { Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { BenneCreation } from '../../../models/benne';
import { SideBarResponsable } from '../../../sidebar-responsable/sidebar-responsable';

@Component({
  selector: 'app-ajouter-benne',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule, SideBarResponsable],
  templateUrl: './ajouter-benne.html',
  styleUrls: ['./ajouter-benne.css']
})
export class AjouterBenneComponent implements OnInit {
  benneForm: FormGroup;
  isLoading = false;
  errorMessage = '';
  successMessage = '';

  isSidebarCollapsed = false;
  isMobile = false;
  userRole: string = '';

  constructor(
    private fb: FormBuilder,
    private benneService: BenneService,
    private router: Router
  ) {
    this.benneForm = this.fb.group({
      nom: ['', Validators.required],
      immatriculation: ['', Validators.required],
      capaciteKg: ['', [Validators.required, Validators.min(100)]],
      quantiteChargeeActuelle: [0],
      tauxRemplissage: [0],
      estPleine: [false]
    });
  }

  ngOnInit(): void {
    this.loadUserRole();
    this.checkMobile();
  }

  loadUserRole(): void {
    const userStr = localStorage.getItem('currentUser');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        this.userRole = user.role?.toUpperCase() || '';
      } catch (e) {
        console.error('Error parsing user data', e);
      }
    }
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

  onSubmit(): void {
    if (this.benneForm.invalid) {
      this.errorMessage = 'Veuillez remplir tous les champs obligatoires';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    // Envoyer TOUS les champs comme dans le backend
    const benneData = {
      nom: this.benneForm.value.nom,
      immatriculation: this.benneForm.value.immatriculation,
      capaciteKg: Number(this.benneForm.value.capaciteKg),
      quantiteChargeeActuelle: this.benneForm.value.quantiteChargeeActuelle || 0,
      tauxRemplissage: this.benneForm.value.tauxRemplissage || 0,
      estPleine: this.benneForm.value.estPleine || false,
      type: 'BENNE',
      statut: 'DISPONIBLE'
    };

    this.benneService.create(benneData).subscribe({
      next: (response) => {
        this.isLoading = false;
        this.successMessage = 'Benne ajoutée avec succès !';
        setTimeout(() => {
          this.router.navigate(['/ressources/bennes']);
        }, 1500);
      },
      error: (err: HttpErrorResponse) => {
        this.isLoading = false;
        this.errorMessage = err.message || 'Erreur lors de l\'ajout de la benne';
        console.error('Erreur:', err);
      }
    });
  }

  cancel(): void {
    this.router.navigate(['/ressources/bennes']);
  }
}