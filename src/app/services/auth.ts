import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
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
getAuthHeaders(): HttpHeaders {
  const token = localStorage.getItem('token');
  return new HttpHeaders({
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  });
}
  login(email: string, motDePasse: string): Observable<Utilisateur> {
    return this.http.post<Utilisateur>(`${this.apiUrl}/login`, { email, motDePasse })
      .pipe(
        tap(user => {
          console.log('✅ Login response received:', user);
          // Vérifier si on est dans le navigateur
          if (typeof window !== 'undefined' && localStorage) {
            localStorage.setItem('currentUser', JSON.stringify(user));
            localStorage.setItem('token', user.token);
            console.log('✅ Saved to localStorage - currentUser:', user);
            console.log('✅ Saved to localStorage - id:', user.id);
            console.log('✅ localStorage.getItem("currentUser"):', localStorage.getItem('currentUser'));
          }
          this.currentUserSubject.next(user);
          console.log('✅ BehaviorSubject updated with user data');
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

  getUserRole(): string {
    // First try BehaviorSubject
    if (this.currentUserSubject.value?.role) {
      return this.currentUserSubject.value.role.toUpperCase();
    }

    // Fallback to localStorage
    if (typeof window !== 'undefined' && localStorage) {
      const storedUser = localStorage.getItem('currentUser');
      if (storedUser) {
        try {
          const user = JSON.parse(storedUser);
          return user.role?.toUpperCase() || '';
        } catch (e) {
          console.error('Error parsing currentUser from localStorage:', e);
        }
      }
    }

    return '';
  }

  getUserId(): string {
    // First try BehaviorSubject
    if (this.currentUserSubject.value?.id) {
      return this.currentUserSubject.value.id;
    }

    // Fallback to localStorage
    if (typeof window !== 'undefined' && localStorage) {
      const storedUser = localStorage.getItem('currentUser');
      if (storedUser) {
        try {
          const user = JSON.parse(storedUser);
          return user.id || '';
        } catch (e) {
          console.error('Error parsing currentUser from localStorage:', e);
        }
      }
    }

    return '';
  }

  // Debug method to check localStorage
  debugLocalStorage(): void {
    if (typeof window !== 'undefined' && localStorage) {
      console.log('=== localStorage Debug ===');
      console.log('currentUser:', localStorage.getItem('currentUser'));
      console.log('token:', localStorage.getItem('token'));

      const currentUser = localStorage.getItem('currentUser');
      if (currentUser) {
        try {
          const parsed = JSON.parse(currentUser);
          console.log('Parsed currentUser:', parsed);
          console.log('ID:', parsed.id);
          console.log('Role:', parsed.role);
          console.log('Email:', parsed.email);
        } catch (e) {
          console.error('Error parsing currentUser:', e);
        }
      }
    }
  }
}
