import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [],
  template: ``,
})
export class Dashboard implements OnInit {

  constructor(private router: Router) {}

  ngOnInit(): void {
    const stored = localStorage.getItem('currentUser');

    if (!stored) {
      this.router.navigate(['/login']);
      return;
    }

    try {
      const user = JSON.parse(stored);
      const role = user?.role?.toUpperCase();

      if (role === 'ADMIN') {
        this.router.navigate(['/admin/dashboard']);
      } else if (role === 'RESPONSABLE') {
        this.router.navigate(['/responsable/dashboard']);
      } else if (role === 'AGRICULTEUR') {
        this.router.navigate(['/agriculteur/dashboard']);
      } else if (role === 'TRANSPORTEUR') {
        this.router.navigate(['/transporteur/dashboard']);
      } else if (role === 'RESPONSABLE_PRESSOIR') {
        this.router.navigate(['/pressoir/dashboard']);
      } else {
        // Unknown role — send back to login
        this.router.navigate(['/login']);
      }
    } catch (e) {
      console.error('Error parsing user data', e);
      this.router.navigate(['/login']);
    }
  }
}
