import { Component, OnInit, ChangeDetectorRef, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AlerteService, AlerteResponse, StatutAlerte } from '../../services/alerte';
import { AuthService } from '../../services/auth';
import { SideBarResponsable } from '../../sidebar-responsable/sidebar-responsable';

interface Comment {
  id: string;
  texte: string;
  auteur: string;
  dateCreation: Date;
  type?: string;
}

interface StatusTransition {
  statut: StatutAlerte;
  label: string;
}

@Component({
  selector: 'app-alert-detail',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, SideBarResponsable],
  templateUrl: './alert-detail.html',
  styleUrl: './alert-detail.css'
})
export class AlertDetailComponent implements OnInit {
  alert: AlerteResponse | null = null;
  comments: Comment[] = [];
  statusHistory: any[] = [];
  availableTransitions: StatusTransition[] = [];

  // UI State
  isLoading = true;
  isSaving = false;
  errorMessage = '';
  successMessage = '';
  isSidebarCollapsed = false;
  isMobile = false;

  // Comment form
  newComment = '';
  showCommentForm = false;

  // Status change
  newStatus: StatutAlerte | '' = '';
  statusNotes = '';
  showStatusForm = false;

  userRole = '';
  currentUserId = '';

  constructor(
    private route: ActivatedRoute,
    private alerteService: AlerteService,
    private authService: AuthService,
    public router: Router,
    private cdr: ChangeDetectorRef
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
    this.currentUserId = this.authService.getUserId();
    this.checkMobile();
    this.loadAlertDetail();
  }

  loadAlertDetail(): void {
    this.isLoading = true;
    this.route.params.subscribe((params) => {
      const id = params['id'];
      if (!id) return;

      // Load alert
      this.alerteService.getById(id).subscribe({
        next: (data) => {
          this.alert = data;
          this.isLoading = false;
          this.cdr.detectChanges();
          
          // Load optional data in background (don't block on these)
          this.loadComments();
          this.loadStatusHistory();
          this.loadAvailableTransitions();
        },
        error: () => {
          this.errorMessage = 'Erreur lors du chargement de l\'alerte.';
          this.isLoading = false;
          this.cdr.detectChanges();
        }
      });
    });
  }

  private loadComments(): void {
    if (!this.alert) return;
    this.alerteService.getComments(this.alert.id).subscribe({
      next: (data) => {
        this.comments = data || [];
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.comments = [];
        console.warn('Commentaires non disponibles:', {
          status: err.status,
          message: err.message,
          url: err.url
        });
      }
    });
  }

  private loadStatusHistory(): void {
    if (!this.alert) return;
    this.alerteService.getStatusHistory(this.alert.id).subscribe({
      next: (data) => {
        this.statusHistory = data || [];
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.statusHistory = [];
        console.warn('Historique des statuts non disponible:', {
          status: err.status,
          message: err.message,
          url: err.url
        });
      }
    });
  }

  private loadAvailableTransitions(): void {
    if (!this.alert) return;
    this.alerteService.getAvailableTransitions(this.alert.id).subscribe({
      next: (data) => {
        this.availableTransitions = data || [];
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.availableTransitions = [];
        console.warn('Transitions de statut non disponibles:', {
          status: err.status,
          message: err.message,
          url: err.url
        });
      }
    });
  }

  toggleCommentForm(): void {
    this.showCommentForm = !this.showCommentForm;
  }

  toggleStatusForm(): void {
    this.showStatusForm = !this.showStatusForm;
  }

  addComment(): void {
    if (!this.alert || !this.newComment.trim()) return;

    this.isSaving = true;
    this.alerteService.addComment(this.alert.id, this.newComment).subscribe({
      next: () => {
        this.newComment = '';
        this.showCommentForm = false;
        this.isSaving = false;
        this.successMessage = 'Commentaire ajouté avec succès!';
        this.loadComments();
        setTimeout(() => this.successMessage = '', 3000);
        this.cdr.detectChanges();
      },
      error: () => {
        this.errorMessage = 'Erreur lors de l\'ajout du commentaire.';
        this.isSaving = false;
        this.cdr.detectChanges();
      }
    });
  }

  deleteComment(commentId: string): void {
    if (!this.alert || !confirm('Êtes-vous sûr de vouloir supprimer ce commentaire?')) return;

    this.alerteService.deleteComment(this.alert.id, commentId).subscribe({
      next: () => {
        this.successMessage = 'Commentaire supprimé avec succès!';
        this.loadComments();
        setTimeout(() => this.successMessage = '', 3000);
        this.cdr.detectChanges();
      },
      error: () => {
        this.errorMessage = 'Erreur lors de la suppression du commentaire.';
        this.cdr.detectChanges();
      }
    });
  }

  changeStatus(): void {
    if (!this.alert || !this.newStatus) return;

    this.isSaving = true;
    this.alerteService.changeStatusWithValidation(this.alert.id, this.newStatus as StatutAlerte, this.statusNotes).subscribe({
      next: (updatedAlert) => {
        this.alert = updatedAlert;
        this.newStatus = '';
        this.statusNotes = '';
        this.showStatusForm = false;
        this.isSaving = false;
        this.successMessage = 'Statut mis à jour avec succès!';
        this.loadStatusHistory();
        this.loadAvailableTransitions();
        setTimeout(() => this.successMessage = '', 3000);
        this.cdr.detectChanges();
      },
      error: () => {
        this.errorMessage = 'Erreur lors de la mise à jour du statut.';
        this.isSaving = false;
        this.cdr.detectChanges();
      }
    });
  }

  canChangeStatus(): boolean {
    return this.userRole === 'ADMIN' || this.userRole === 'RESPONSABLE';
  }

  canDeleteComment(comment: Comment): boolean {
    return this.userRole === 'ADMIN';
  }

  goBack(): void {
    this.router.navigate(['/alertes/gestion']);
  }

  getStatutLabel(statut: StatutAlerte): string {
    const labels: { [key in StatutAlerte]: string } = {
      'EN_ATTENTE': 'En attente',
      'TRAITEE': 'Traitée',
      'IGNOREE': 'Ignorée'
    };
    return labels[statut];
  }

  getStatusBadgeClass(statut: StatutAlerte): string {
    const classes: { [key in StatutAlerte]: string } = {
      'EN_ATTENTE': 'badge-warning',
      'TRAITEE': 'badge-success',
      'IGNOREE': 'badge-secondary'
    };
    return classes[statut];
  }

  getUrgenceColor(urgence: string): string {
    const colors: { [key: string]: string } = {
      'CRITIQUE': '#D32F2F',
      'ELEVEE': '#F57C00',
      'MOYENNE': '#FBC02D',
      'FAIBLE': '#388E3C'
    };
    return colors[urgence] || '#999';
  }

  getPhaseLabel(phase: string): string {
    const labels: { [key: string]: string } = {
      'FLORAISON': '🌸 Floraison',
      'NOUAISON': '🫒 Nouaison',
      'VERDAISON': '🌿 Verdaison',
      'PRE_RECOLTE': '⏰ Pré-récolte',
      'RECOLTE': '🧺 Récolte',
      'INCONNUE': '❓ Inconnue'
    };
    return labels[phase] || phase;
  }
}
