import { Component, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';  // ← NOT ListeTravailleurs
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,   // ← provides router-outlet and routerLink
    // ❌ Remove ListeTravailleurs from here
  ],
  styleUrl: './dashboard.css',
  templateUrl: './dashboard.html',
})
export class Dashboard implements OnInit {
  user: any;

  constructor(private router: Router) {}

  ngOnInit(): void {
    const stored = localStorage.getItem('user');
    if (stored) this.user = JSON.parse(stored);
  }

  goToTravailleurs(): void {
    this.router.navigate(['/travailleurs']);  // ← navigate, don't embed
  }

  logout(): void {
    localStorage.clear();
    this.router.navigate(['/login']);
  }
}
