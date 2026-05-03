import { Component, OnInit, ViewChild, ChangeDetectorRef, HostListener, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FullCalendarModule, FullCalendarComponent } from '@fullcalendar/angular';
import { CalendarOptions, EventClickArg, EventDropArg, DatesSetArg } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';

import { CalendrierService } from '../../services/calendrier';
import { VergerService } from '../../services/verger';
import { UtilisateurService } from '../../services/utilisateur';
import { AuthService } from '../../services/auth';
import { SideBarResponsable } from '../../sidebar-responsable/sidebar-responsable';
import { EventDetailModalComponent } from '../../event-detail-modal/event-detail-modal/event-detail-modal';

@Component({
  selector: 'app-calendrier',
  standalone: true,
  imports: [CommonModule, FormsModule, FullCalendarModule, SideBarResponsable, EventDetailModalComponent],
  templateUrl: './calendrier.html',
  styleUrls: ['./calendrier.css']
})
export class CalendrierComponent implements OnInit, AfterViewInit {

  @ViewChild('calendar') calendarComponent!: FullCalendarComponent;

  // Sidebar
  isSidebarCollapsed = false;
  isMobile = false;
  userRole: string = '';
  isAdminOrResponsable: boolean = false;

  // Modal
  showModal: boolean = false;
  selectedEvent: any = null;
  errorMessage: string = '';

  calendarOptions: CalendarOptions = {
    plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin],
    headerToolbar: {
      left: 'prev,next today',
      center: 'title',
      right: 'dayGridMonth,timeGridWeek,timeGridDay'
    },
    initialView: 'dayGridMonth',
    editable: true,
    selectable: true,
    events: [],
    themeSystem: 'standard',
    height: 'auto',
    buttonText: {
      today: "Aujourd'hui",
      month: 'Mois',
      week: 'Semaine',
      day: 'Jour'
    },
    // CRITICAL: Bind handlers with arrow functions to preserve 'this'
    eventClick: (clickInfo: EventClickArg) => {
      console.log('Event clicked:', clickInfo.event.title);
      this.handleEventClick(clickInfo);
    },
    eventDrop: (dropInfo: EventDropArg) => {
      console.log('Event dropped:', dropInfo.event.title);
      this.handleEventDrop(dropInfo);
    },
    datesSet: (dateInfo: DatesSetArg) => {
      console.log('Dates set:', dateInfo.start, dateInfo.end);
      this.handleDatesSetDebounced(dateInfo);
    }
  };

  isLoading = false;
  currentDateRange = { debut: new Date(), fin: new Date() };
  selectedVergerId = '';
  selectedTravailleurId = '';
  private loadTimeout: any = null;

  vergers: any[] = [];
  travailleurs: any[] = [];

  constructor(
    private calendrierService: CalendrierService,
    private vergerService: VergerService,
    private utilisateurService: UtilisateurService,
    private authService: AuthService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.loadUserRole();
    this.checkMobile();

    if (this.isAdminOrResponsable) {
      this.loadVergers();
      this.loadTravailleurs();
    }

    const now = new Date();
    this.currentDateRange = {
      debut: new Date(now.getFullYear(), now.getMonth(), 1),
      fin: new Date(now.getFullYear(), now.getMonth() + 1, 0)
    };

    this.loadEvents();
  }

  ngAfterViewInit() {
    console.log('View initialized, calendar component:', this.calendarComponent);
    setTimeout(() => {
      if (this.calendarComponent && this.calendarComponent.getApi()) {
        console.log('✅ Calendar API ready');
      } else {
        console.warn('⚠️ Calendar API not ready yet');
      }
    }, 500);
  }

  loadUserRole(): void {
    const userStr = localStorage.getItem('currentUser');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        this.userRole = user.role?.toUpperCase() || '';
        this.isAdminOrResponsable = this.userRole === 'ADMIN' || this.userRole === 'RESPONSABLE';
        console.log('User role:', this.userRole, 'Is admin/responsable:', this.isAdminOrResponsable);
      } catch (e) {
        console.error('Error parsing user data', e);
      }
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

  loadVergers() {
    this.vergerService.getAll().subscribe({
      next: (data) => {
        this.vergers = data;
        console.log('Vergers loaded:', data.length);
      },
      error: (err) => {
        console.error('Erreur vergers:', err);
        this.errorMessage = 'Impossible de charger les vergers';
      }
    });
  }

loadTravailleurs() {
  // Alternative : utiliser la méthode dédiée
  this.utilisateurService.getTravailleursPourResponsable().subscribe({
    next: (data: any[]) => {
      this.travailleurs = data;
      console.log('Travailleurs loaded:', this.travailleurs.length);
    },
    error: (err) => {
      console.error('Erreur travailleurs:', err);
      // Fallback pour ADMIN
      if (this.userRole === 'ADMIN') {
        this.utilisateurService.getAll().subscribe({
          next: (adminData: any[]) => {
            this.travailleurs = adminData.filter((u: any) => u.role === 'TRAVAILLEUR');
          }
        });
      } else {
        this.errorMessage = 'Impossible de charger les travailleurs';
      }
    }
  });
}

  handleDatesSetDebounced = (dateInfo: DatesSetArg) => {
    console.log('Dates set debounced called');
    if (this.loadTimeout) clearTimeout(this.loadTimeout);
    this.loadTimeout = setTimeout(() => {
      this.currentDateRange = { debut: dateInfo.start, fin: dateInfo.end };
      this.loadEvents();
    }, 400);
  };

  loadEvents() {
    if (this.isLoading) return;
    this.isLoading = true;
    this.errorMessage = '';

    console.log('Loading events for period:', this.currentDateRange);

    let request: any;

    if (this.isAdminOrResponsable) {
      if (this.selectedVergerId && this.selectedTravailleurId) {
        request = this.calendrierService.getEvenementsByVergerAndTravailleur(
          this.selectedVergerId, this.selectedTravailleurId,
          this.currentDateRange.debut, this.currentDateRange.fin
        );
      } else if (this.selectedTravailleurId) {
        request = this.calendrierService.getEvenementsByTravailleur(
          this.selectedTravailleurId, this.currentDateRange.debut, this.currentDateRange.fin
        );
      } else if (this.selectedVergerId) {
        request = this.calendrierService.getEvenementsByVerger(
          this.selectedVergerId, this.currentDateRange.debut, this.currentDateRange.fin
        );
      } else {
        request = this.calendrierService.getEvenements(
          this.currentDateRange.debut, this.currentDateRange.fin
        );
      }
    } else if (this.userRole === 'AGRICULTEUR' || this.userRole === 'TRAVAILLEUR') {
      request = this.calendrierService.getMonPlanning(
        this.currentDateRange.debut,
        this.currentDateRange.fin
      );
    } else {
      request = this.calendrierService.getEvenements(this.currentDateRange.debut, this.currentDateRange.fin);
    }

    request.subscribe({
      next: (events: any[]) => {
        console.log('Events received:', events.length);

        const calendarApi = this.calendarComponent?.getApi();
        const formattedEvents = events.map(event => ({
          id: event.id,
          title: `🫒 ${event.titre || 'Collecte'}`,
          start: event.debut,
          end: event.fin,
          backgroundColor: event.couleur || '#4CAF50',
          borderColor: event.couleur || '#4CAF50',
          extendedProps: event
        }));

        if (calendarApi) {
          calendarApi.removeAllEvents();
          calendarApi.addEventSource(formattedEvents);
          console.log('✅ Events added to calendar via API');
        } else {
          this.calendarOptions.events = formattedEvents;
          console.log('⚠️ Events stored in options');
        }

        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        console.error('❌ Error loading events:', err);
        this.errorMessage = 'Erreur lors du chargement des collectes';
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

 handleEventClick(clickInfo: EventClickArg): void {
  console.log('handleEventClick called with:', clickInfo.event.title);

  const event = clickInfo.event;
  const extendedProps = event.extendedProps || {};

  // Debug: Log all extendedProps
  console.log('Full extendedProps:', extendedProps);
  console.log('travailleursNoms:', extendedProps['travailleursNoms']);
  console.log('travailleurs:', extendedProps['travailleurs']);

  // Also log the raw event data
  console.log('Raw event data:', event);

  this.selectedEvent = {
    id: event.id,
    titre: event.title ? event.title.replace('🫒 ', '') : '',
    debut: event.start,
    fin: event.end,
    vergerNom: extendedProps['vergerNom'] || extendedProps['verger']?.nom || 'N/A',
    vergerTypeOlive: extendedProps['vergerTypeOlive'] || extendedProps['verger']?.typeOlive || 'N/A',
    vergerSuperficie: extendedProps['vergerSuperficie'] || extendedProps['verger']?.superficie || 'N/A',
    vergerNbArbre: extendedProps['vergerNbArbre'] || extendedProps['verger']?.nbArbre || 'N/A',
    vergerStatut: extendedProps['vergerStatut'] || extendedProps['verger']?.statut || 'N/A',
    agriculteurNom: extendedProps['agriculteurNom'] || extendedProps['agriculteur']?.nom || 'N/A',
    agriculteurPrenom: extendedProps['agriculteurPrenom'] || extendedProps['agriculteur']?.prenom || 'N/A',
    agriculteurEmail: extendedProps['agriculteurEmail'] || extendedProps['agriculteur']?.email || 'N/A',
    agriculteurTelephone: extendedProps['agriculteurTelephone'] || extendedProps['agriculteur']?.telephone || 'N/A',
    travailleursNoms: extendedProps['travailleursNoms'] || extendedProps['travailleurs'] || [],
    statut: extendedProps['statut'] || 'PLANIFIEE',
    quantiteCollecteeKg: extendedProps['quantiteCollecteeKg'] || extendedProps['quantite'] || 0,
    nbreArbre: extendedProps['nbreArbre'] || 0,
    distanceTotale: extendedProps['distanceTotale'] || 0,
    collecteCode: extendedProps['collecteCode'] || '',
    observations: extendedProps['observations'] || ''
  };

  console.log('Selected event travailleursNoms:', this.selectedEvent.travailleursNoms);

  this.showModal = true;
  this.cdr.detectChanges();
}

  handleEventDrop(eventDropInfo: EventDropArg): void {
    console.log('handleEventDrop called');

    if (!this.isAdminOrResponsable) {
      alert('Vous n\'avez pas les droits pour reprogrammer une collecte');
      eventDropInfo.revert();
      return;
    }

    const event = eventDropInfo.event;
    const newDate = event.start?.toLocaleDateString();

    if (confirm(`Déplacer ${event.title} au ${newDate} ?`)) {
      this.calendrierService.reprogrammer(event.id, event.start!, 'Déplacement par glisser-déposer')
        .subscribe({
          next: () => {
            alert('✅ Collecte reprogrammée avec succès !');
            this.loadEvents();
          },
          error: (err) => {
            console.error('Erreur reprogrammation:', err);
            alert('❌ Erreur lors du déplacement');
            eventDropInfo.revert();
          }
        });
    } else {
      eventDropInfo.revert();
    }
  }

  closeModal() {
    console.log('Closing modal');
    this.showModal = false;
    this.selectedEvent = null;
    this.cdr.detectChanges();
  }

  handleEditEvent(event: any) {
    console.log('Edit event requested:', event);
    this.closeModal();
  }

  onVergerChange() {
    console.log('Verger changed:', this.selectedVergerId);
    this.loadEvents();
  }

  onTravailleurChange() {
    console.log('Travailleur changed:', this.selectedTravailleurId);
    this.loadEvents();
  }

  resetFilters() {
    console.log('Resetting filters');
    this.selectedVergerId = '';
    this.selectedTravailleurId = '';
    this.loadEvents();
  }

  getStatusLabel(statut: string): string {
    const labels: { [key: string]: string } = {
      'PLANIFIEE': '📋 Planifiée',
      'EN_COURS': '🔄 En cours',
      'TERMINEE': '✅ Terminée',
      'ANNULEE': '❌ Annulée'
    };
    return labels[statut] || statut;
  }
}
