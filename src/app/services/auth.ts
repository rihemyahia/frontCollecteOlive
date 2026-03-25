import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';

export interface Utilisateur {
  id: string;
  email: string;
  prenom: string;
  nom: string;
  role: string;
  token: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'http://localhost:8080/api/auth';
  private currentUserSubject = new BehaviorSubject<Utilisateur | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(private http: HttpClient) {
    // Vérifier si on est dans le navigateur (et non sur le serveur)
    if (typeof window !== 'undefined' && localStorage) {
      const storedUser = localStorage.getItem('currentUser');
      if (storedUser) {
        this.currentUserSubject.next(JSON.parse(storedUser));
      }
    }
  }

  login(email: string, motDePasse: string): Observable<Utilisateur> {
    return this.http.post<Utilisateur>(`${this.apiUrl}/login`, { email, motDePasse })
      .pipe(
        tap(user => {
          // Vérifier si on est dans le navigateur
          if (typeof window !== 'undefined' && localStorage) {
            localStorage.setItem('currentUser', JSON.stringify(user));
            localStorage.setItem('token', user.token);
          }
          this.currentUserSubject.next(user);
        })
      );
  }

  logout(): void {
    // Vérifier si on est dans le navigateur
    if (typeof window !== 'undefined' && localStorage) {
      localStorage.removeItem('currentUser');
      localStorage.removeItem('token');
    }
    this.currentUserSubject.next(null);
  }

 // In auth-service.ts - Update the isLoggedIn method:

isLoggedIn(): boolean {
  // First check the BehaviorSubject
  if (this.currentUserSubject.value !== null) {
    return true;
  }

  // Also check localStorage directly (for page refresh scenarios)
  if (typeof window !== 'undefined' && localStorage) {
    const storedUser = localStorage.getItem('currentUser');
    const token = localStorage.getItem('token');

    if (storedUser && token) {
      // Restore the user to the BehaviorSubject
      this.currentUserSubject.next(JSON.parse(storedUser));
      return true;
    }
  }

  return false;
}
  getToken(): string | null {
    // Vérifier si on est dans le navigateur
    if (typeof window !== 'undefined' && localStorage) {
      return localStorage.getItem('token');
    }
    return null;
  }
}
