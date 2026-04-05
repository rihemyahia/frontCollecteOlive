import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AgriculteurService } from '../../services/agriculteur';

@Component({
  selector: 'app-modifier-agriculteur',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './modifier-agriculteur.html',
  styleUrls: ['./modifier-agriculteur.css']
})
export class ModifierAgriculteur implements OnInit {
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
    private agriculteurService: AgriculteurService
  ) {
    this.modificationForm = this.fb.group({
      prenom: ['', [Validators.required, Validators.minLength(2)]],
      nom: ['', [Validators.required, Validators.minLength(2)]],
      telephone: ['', [Validators.required, Validators.pattern('^[0-9]{8}$')]],
      adresse: ['', Validators.required],
      nomExploitation: ['', [Validators.required, Validators.minLength(3)]]
    });
  }

  ngOnInit(): void {
    this.agriculteurId = this.route.snapshot.params['id'];
    this.loadAgriculteur();
  }

  loadAgriculteur(): void {
    this.isLoading = true;
    this.agriculteurService.getById(this.agriculteurId).subscribe({
      next: (agriculteur) => {
        this.agriculteurEmail = agriculteur.email;
        this.modificationForm.patchValue({
          prenom: agriculteur.prenom,
          nom: agriculteur.nom,
          telephone: agriculteur.telephone,
          adresse: agriculteur.adresse,
          nomExploitation: agriculteur.nomExploitation
        });
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Erreur:', err);
        this.errorMessage = 'Erreur lors du chargement';
        this.isLoading = false;
      }
    });
  }

  onSubmit(): void {
    if (this.modificationForm.invalid) {
      this.errorMessage = 'Veuillez remplir tous les champs correctement';
      return;
    }

    this.saving = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.agriculteurService.update(this.agriculteurId, this.modificationForm.value).subscribe({
      next: () => {
        this.successMessage = 'Agriculteur modifié avec succès';
        this.saving = false;
        setTimeout(() => {
          this.router.navigate(['/agriculteurs']);
        }, 2000);
      },
      error: (err) => {
        console.error('Erreur:', err);
        this.errorMessage = err.error?.message || 'Erreur lors de la modification';
        this.saving = false;
      }
    });
  }

  cancel(): void {
    this.router.navigate(['/agriculteurs']);
  }
}
