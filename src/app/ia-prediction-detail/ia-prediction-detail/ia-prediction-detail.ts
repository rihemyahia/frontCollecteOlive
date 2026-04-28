import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AIPredictionService } from '../../services/ai-prediction';

@Component({
  selector: 'app-ia-prediction-detail',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './ia-prediction-detail.html',
  styleUrls: ['./ia-prediction-detail.css']
})
export class IaPredictionDetailComponent implements OnInit {

  prediction: any = null;
  isLoading = true;
  vergerId: string = '';
  errorMessage = '';

  constructor(
    private route: ActivatedRoute,
    private aiPredictionService: AIPredictionService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.vergerId = this.route.snapshot.paramMap.get('id') || '';
    if (this.vergerId) {
      this.loadPrediction();
    }
  }

  loadPrediction(): void {
    this.isLoading = true;
    this.aiPredictionService.getPredictionByVerger(this.vergerId).subscribe({
      next: (data) => {
        this.prediction = data;
        this.isLoading = false;
      },
      error: (err) => {
        this.errorMessage = 'Erreur lors du chargement de la prédiction IA';
        this.isLoading = false;
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/vergers']);
  }

  getUrgenceClass(urgence: string): string {
    switch(urgence) {
      case 'ELEVEE': return 'urgent';
      case 'MOYENNE': return 'warning';
      default: return 'normal';
    }
  }
}
