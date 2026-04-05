// src/app/travailleurs/modifier-travailleur/modifier-travailleur.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { TravailleurService } from '../../services/travailleur';

@Component({
  selector: 'app-modifier-travailleur',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './modifier-travailleur.html',
  styleUrls: ['./modifier-travailleur.css']
})
export class ModifierTravailleur implements OnInit {
  modificationForm: FormGroup;
  travailleurId: string = '';
  travailleurEmail: string = '';
  isLoading = true;
  saving = false;
  errorMessage = '';
  successMessage = '';

  specialitesOptions = ['cueillette', 'tamisage', 'secouage', 'ramassage', 'tri'];
  statutsEmploye = ['SAISONNIER', 'PERMANENT'];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private fb: FormBuilder,
    private travailleurService: TravailleurService
  ) {
    this.modificationForm = this.fb.group({
      prenom: ['', [Validators.required, Validators.minLength(2)]],
      nom: ['', [Validators.required, Validators.minLength(2)]],
      telephone: ['', [Validators.required, Validators.pattern('^[0-9]{8}$')]],
      adresse: ['', Validators.required],
      cin: ['', [Validators.required, Validators.pattern('^[0-9]{8}$')]],
      specialites: [[], Validators.required],
      dateEmbauche: ['', Validators.required],
      salaire: ['', [Validators.required, Validators.min(30), Validators.max(100)]],
      statutEmploye: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    this.travailleurId = this.route.snapshot.params['id'];
    this.loadTravailleur();
  }

  loadTravailleur(): void {
    this.isLoading = true;
    this.travailleurService.getById(this.travailleurId).subscribe({
      next: (travailleur) => {
        this.travailleurEmail = travailleur.email;
        this.modificationForm.patchValue({
          prenom: travailleur.prenom,
          nom: travailleur.nom,
          telephone: travailleur.telephone,
          adresse: travailleur.adresse,
          cin: travailleur.cin,
          specialites: travailleur.specialites,
          dateEmbauche: travailleur.dateEmbauche ? new Date(travailleur.dateEmbauche).toISOString().split('T')[0] : '',
          salaire: travailleur.salaire,
          statutEmploye: travailleur.statutEmploye
        });
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Erreur:', err);
        this.errorMessage = 'Erreur lors du chargement du travailleur';
        this.isLoading = false;
      }
    });
  }

  onSpecialiteChange(event: any, specialite: string): void {
    const currentSpecialites = this.modificationForm.get('specialites')?.value || [];
    if (event.target.checked) {
      this.modificationForm.patchValue({
        specialites: [...currentSpecialites, specialite]
      });
    } else {
      this.modificationForm.patchValue({
        specialites: currentSpecialites.filter((s: string) => s !== specialite)
      });
    }
  }

  isSpecialiteSelected(specialite: string): boolean {
    const specialites = this.modificationForm.get('specialites')?.value || [];
    return specialites.includes(specialite);
  }

  onSubmit(): void {
    if (this.modificationForm.invalid) {
      this.errorMessage = 'Veuillez remplir tous les champs correctement';
      return;
    }

    this.saving = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.travailleurService.update(this.travailleurId, this.modificationForm.value).subscribe({
      next: () => {
        this.successMessage = 'Travailleur modifié avec succès';
        this.saving = false;
        setTimeout(() => {
          this.router.navigate(['/travailleurs']);
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
    this.router.navigate(['/travailleurs']);
  }
}
