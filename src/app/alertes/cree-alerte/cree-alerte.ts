import { Component, Input, Output, EventEmitter, OnInit, ChangeDetectorRef, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { AlerteService, AlerteResponse, TypeAlerte, AlerteRequest } from '../../services/alerte';
import { VergerService } from '../../services/verger';
import { VergerResponse } from '../../models/verger';
import { AuthService } from '../../services/auth';
import { SideBarResponsable } from '../../sidebar-responsable/sidebar-responsable';

@Component({
  selector: 'app-cree-alerte',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, SideBarResponsable],
  templateUrl: './cree-alerte.html',
  styleUrl: './cree-alerte.css'
})
export class CreeAlerte implements OnInit {

  @Input() agriculteurId: string = '';
  @Input() mesVergers: VergerResponse[] = [];
  @Output() alerteCreated = new EventEmitter<AlerteResponse>();
  @Output() formClosed = new EventEmitter<void>();

  alerteForm!: FormGroup;
  isSubmitting = false;
  formSuccess = '';
  formError = '';
  showUrgenceInfo = false;

  // Sidebar & Responsive
  isSidebarCollapsed = false;
  isMobile = false;
  userRole = '';

  readonly typesAlerte = [
    { value: 'MATURITE', label: '🫒 Problème de maturité' },
    { value: 'MATURITE_ACCELEREE', label: '⏱️ Maturité accélérée' },
    { value: 'MALADIE', label: '🐛 Maladie' },
    { value: 'METEO', label: '⛈️ Dégât météorologique' },
    { value: 'RECOLTE', label: '🧺 Problème de récolte' },
    { value: 'CHUTE_PREMATUREE', label: '📉 Chute prématurée' },
    { value: 'NUISIBLE', label: '🦗 Ravageur / Nuisible' },
    { value: 'IRRIGATION', label: '💧 Problème d\'irrigation' },
    { value: 'QUALITE_HUILE', label: '🫒 Qualité d\'huile' },
    { value: 'RENDEMENT_ANORMAL', label: '📊 Rendement anormal' },
    { value: 'LOGISTIQUE_MOULIN', label: '🏭 Logistique moulin' },
    { value: 'SECURITE_RECOLTE', label: '⚠️ Sécurité récolte' },
    { value: 'AUTRE', label: '📌 Autre problème' }
  ];

  constructor(
    private cdr: ChangeDetectorRef,
    private fb: FormBuilder,
    private alerteService: AlerteService,
    private vergerService: VergerService,
    private authService: AuthService,
    private route: ActivatedRoute
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
    this.agriculteurId = this.authService.getUserId();
    this.checkMobile();
    console.log("👤 agriculteurId:", this.agriculteurId);
    this.initForm();
    this.checkForPreSelectedVerger();
    this.loadVergers();
  }

  loadVergers(): void {
    if (!this.agriculteurId) {
      console.error('No agriculteurId, cannot load vergers');
      return;
    }
    this.vergerService.getByAgriculteur(this.agriculteurId).subscribe({
      next: (data: VergerResponse[]) => {
        this.mesVergers = data.filter((v: VergerResponse) => !v.estSupprimer);
        this.cdr.markForCheck();
        console.log('✅ Vergers loaded:', this.mesVergers.length);
      },
      error: (err: any) => {
        console.error('❌ Error loading vergers:', err);
      }
    });
  }

  initForm(): void {
    this.alerteForm = this.fb.group({
      vergerId: ['', Validators.required],
      type: ['', Validators.required],
      description: ['', [Validators.required, Validators.minLength(10)]],
      adresseIndicative: ['']
    });
  }

  checkForPreSelectedVerger(): void {
    // Check query parameters first (from mes-vergers navigation)
    this.route.queryParams.subscribe(params => {
      if (params['vergerId']) {
        console.log('🌳 Pre-selected verger from query params:', params['vergerId']);
        this.alerteForm.patchValue({ vergerId: params['vergerId'] });
        return;
      }

      // Fallback to sessionStorage (for backward compatibility)
      const preSelectedVergerId = sessionStorage.getItem('preSelectedVergerId');
      if (preSelectedVergerId) {
        console.log('🌳 Pre-selected verger from sessionStorage:', preSelectedVergerId);
        sessionStorage.removeItem('preSelectedVergerId');
        this.alerteForm.patchValue({ vergerId: preSelectedVergerId });
      }
    });
  }

  isInvalid(field: string): boolean {
    if (!this.alerteForm) return false;
    const ctrl = this.alerteForm.get(field);
    return !!(ctrl?.invalid && ctrl?.touched);
  }

  onSubmit(): void {
    if (this.alerteForm.invalid) {
      this.alerteForm.markAllAsTouched();
      this.formError = 'Veuillez remplir tous les champs obligatoires.';
      return;
    }

    this.isSubmitting = true;
    this.formError = '';
    this.formSuccess = '';

    // Build request matching backend DTO exactly
    const requestData: AlerteRequest = {
      agriculteurId: this.agriculteurId,
      vergerId: this.alerteForm.get('vergerId')?.value,
      type: this.alerteForm.get('type')?.value as TypeAlerte,
      description: this.alerteForm.get('description')?.value,
      adresseIndicative: this.alerteForm.get('adresseIndicative')?.value || ''
    };

    console.log('📤 Sending alert request:', JSON.stringify(requestData, null, 2));

    this.alerteService.signaler(requestData).subscribe({
      next: (created: AlerteResponse) => {
        console.log('✅ Alert created:', created);
        this.formSuccess = 'Alerte signalée avec succès !';
        this.isSubmitting = false;
        this.cdr.markForCheck();
        this.alerteCreated.emit(created);
        this.alerteForm.reset();
        setTimeout(() => {
          this.formClosed.emit();
          this.formSuccess = '';
          this.cdr.markForCheck();
        }, 2000);
      },
      error: (err: any) => {
        console.error('❌ Error submitting alert:', err);
        let errorMsg = 'Erreur lors de l\'envoi de l\'alerte.';
        if (err.error) {
          if (typeof err.error === 'string') {
            errorMsg = err.error;
          } else if (err.error.message) {
            errorMsg = err.error.message;
          } else if (err.error.error) {
            errorMsg = err.error.error;
          } else if (err.error.errors && Array.isArray(err.error.errors)) {
            errorMsg = err.error.errors.map((e: any) => e.message || e.defaultMessage).join(', ');
          }
        }
        this.formError = errorMsg;
        this.isSubmitting = false;
        this.cdr.markForCheck();
      }
    });
  }

  resetForm(): void {
    this.alerteForm.reset();
    this.alerteForm.markAsUntouched();
    this.formError = '';
  }

  onCancel(): void {
    this.resetForm();
    this.formClosed.emit();
  }

  openUrgenceInfo(): void {
    this.showUrgenceInfo = true;
  }

  closeUrgenceInfo(): void {
    this.showUrgenceInfo = false;
  }
}