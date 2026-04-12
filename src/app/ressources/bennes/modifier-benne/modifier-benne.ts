// src/app/ressources/bennes/modifier-benne/modifier-benne.ts
import { Component, OnInit, HostListener, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { BenneService } from '../../../services/benne';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { SideBarResponsable } from '../../../sidebar-responsable/sidebar-responsable';
import { Benne } from '../../../models/Benne';

@Component({
  selector: 'app-modifier-benne',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule, SideBarResponsable],
  templateUrl: './modifier-benne.html',
  styleUrls: ['./modifier-benne.css']
})
export class ModifierBenneComponent implements OnInit {
  benneForm: FormGroup;
  isLoading = true;
  isSaving = false;
  errorMessage = '';
  successMessage = '';
  benneId: string = '';

  isSidebarCollapsed = false;
  isMobile = false;
  userRole: string = '';

  constructor(
    private fb: FormBuilder,
    private benneService: BenneService,
    private route: ActivatedRoute,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {
    this.benneForm = this.fb.group({
      nom: ['', Validators.required],
      immatriculation: ['', Validators.required],
      capaciteKg: [0, [Validators.required, Validators.min(100)]],
      statut: ['DISPONIBLE', Validators.required]
    });
  }

  ngOnInit(): void {
    this.loadUserRole();
    this.checkMobile();
    this.benneId = this.route.snapshot.params['id'];
    this.loadBenne();
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

  loadBenne(): void {
    this.isLoading = true;
    this.benneService.getById(this.benneId).subscribe({
      next: (data: Benne) => {
        this.benneForm.patchValue({
          nom: data.nom,
          immatriculation: data.immatriculation,
          capaciteKg: data.capaciteKg,
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
    if (this.benneForm.invalid) {
      this.errorMessage = 'Veuillez remplir tous les champs obligatoires';
      return;
    }

    this.isSaving = true;
    this.errorMessage = '';
    this.successMessage = '';

    const benneData = {
      nom: this.benneForm.value.nom,
      immatriculation: this.benneForm.value.immatriculation,
      capaciteKg: this.benneForm.value.capaciteKg,
      statut: this.benneForm.value.statut
    };

    this.benneService.update(this.benneId, benneData).subscribe({
      next: () => {
        this.isSaving = false;
        this.successMessage = 'Benne modifiée avec succès !';
        this.cdr.detectChanges();
        setTimeout(() => this.router.navigate(['/ressources/bennes']), 1500);
      },
      error: (err: HttpErrorResponse) => {
        this.isSaving = false;
        this.errorMessage = err.message || 'Erreur lors de la modification';
        this.cdr.detectChanges();
      }
    });
  }

  cancel(): void {
    this.router.navigate(['/ressources/bennes']);
  }
}
