// pipes/progress.pipe.ts
import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'progress',
  standalone: true
})
export class ProgressPipe implements PipeTransform {

  transform(collecte: any): number {
    if (!collecte || collecte.nombreTournees === 0) return 0;
    return (collecte.nombreTourneesTerminees / collecte.nombreTournees) * 100;
  }
}
