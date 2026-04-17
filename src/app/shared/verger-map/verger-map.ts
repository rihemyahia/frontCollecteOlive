import { Component, EventEmitter, Input, OnInit, Output, AfterViewInit, OnDestroy, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import * as L from 'leaflet';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-verger-map',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './verger-map.html',
  styleUrl: './verger-map.css'
})
export class VergerMapComponent implements OnInit, AfterViewInit, OnDestroy {

  @Input() latitude?: number;
  @Input() longitude?: number;
  @Input() editable: boolean = true;
  @Input() height: string = '420px';

  @Output() locationSelected = new EventEmitter<{ lat: number; lng: number; address?: string }>();

  searchInput = '';

  private map!: L.Map;
  private marker?: L.Marker;
  private isBrowser: boolean;

  // Custom pin icon (vert olive comme ton thème)
  private customIcon = L.icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
  });

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  ngOnInit() {}

  ngAfterViewInit() {
    if (this.isBrowser) {
      setTimeout(() => this.initMap(), 100);
    }
  }

  ngOnDestroy() {
    if (this.isBrowser && this.map) this.map.remove();
  }

  private initMap() {
    this.map = L.map('verger-map', {
      center: [34.0, 9.5],
      zoom: 7,
      zoomControl: true
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(this.map);

    // Si position déjà existante (modification)
    if (this.latitude && this.longitude) {
      this.map.setView([this.latitude, this.longitude], 14);
      this.placeMarker(this.latitude, this.longitude);
    }

    if (this.editable) {
      this.map.on('click', (e: L.LeafletMouseEvent) => {
        this.placeMarker(e.latlng.lat, e.latlng.lng);
        this.reverseGeocode(e.latlng.lat, e.latlng.lng);
      });
    }
  }

  private placeMarker(lat: number, lng: number) {
    if (this.marker) this.marker.remove();

    this.marker = L.marker([lat, lng], { 
      draggable: this.editable,
      icon: this.customIcon 
    }).addTo(this.map);

    if (this.editable) {
      this.marker.on('dragend', () => {
        const pos = this.marker!.getLatLng();
        this.reverseGeocode(pos.lat, pos.lng);
      });
    }
  }

  private reverseGeocode(lat: number, lng: number) {
    fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`)
      .then(res => res.json())
      .then(data => {
        const address = data.display_name || `Lat: ${lat.toFixed(5)}, Lng: ${lng.toFixed(5)}`;
        this.locationSelected.emit({ lat, lng, address });
      })
      .catch(() => {
        this.locationSelected.emit({ lat, lng, address: '' });
      });
  }

  // Recherche avancée (comme Google Maps)
  searchAddress() {
    if (!this.searchInput.trim()) return;

    fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(this.searchInput)}&limit=5&addressdetails=1`)
      .then(res => res.json())
      .then(data => {
        if (data && data.length > 0) {
          const result = data[0];
          const lat = parseFloat(result.lat);
          const lng = parseFloat(result.lon);
          const address = result.display_name;

          this.map.flyTo([lat, lng], 15, { duration: 1.5 });
          this.placeMarker(lat, lng);
          this.locationSelected.emit({ lat, lng, address });
        }
      })
      .catch(err => console.error('Search error:', err));
  }
}