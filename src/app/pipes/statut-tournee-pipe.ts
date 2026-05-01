import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'statutTournee',
  standalone: true
})
export class StatutTourneePipe implements PipeTransform {

  private readonly statutConfig: Record<string, { label: string; class: string; icon: string }> = {
    'PLANIFIEE': {
      label: 'Planifiée',
      class: 'bg-blue-100 text-blue-800',
      icon: 'bi-calendar-check'
    },
    'EN_COURS': {
      label: 'En cours',
      class: 'bg-yellow-100 text-yellow-800',
      icon: 'bi-play-circle'
    },
    'TERMINEE': {
      label: 'Terminée',
      class: 'bg-green-100 text-green-800',
      icon: 'bi-check-circle'
    },
    'EN_LIVRAISON': {
      label: 'En livraison',
      class: 'bg-amber-100 text-amber-900',
      icon: 'bi-truck'
    },
    'LIVREE': {
      label: 'Livrée',
      class: 'bg-emerald-100 text-emerald-900',
      icon: 'bi-check2-circle'
    },
    'ANNULEE': {
      label: 'Annulée',
      class: 'bg-red-100 text-red-800',
      icon: 'bi-x-circle'
    }
  };

  transform(statut: string, type: 'label' | 'class' | 'icon' = 'label'): string {
    const config = this.statutConfig[statut];
    if (!config) {
      return type === 'label' ? statut : '';
    }
    return config[type];
  }
}
