import {
  Component, EventEmitter, Input, OnInit, Output,
  AfterViewInit, OnDestroy, Inject, PLATFORM_ID, OnChanges, SimpleChanges
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import * as L from 'leaflet';
import 'leaflet.markercluster';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-verger-map',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './verger-map.html',
  styleUrls: ['./verger-map.css']
})
export class VergerMapComponent implements OnInit, AfterViewInit, OnDestroy, OnChanges {

  @Input() latitude?: number;
  @Input() longitude?: number;
  @Input() editable: boolean = true;
  @Input() height: string = '420px';

  @Input() vergers: any[] = [];
  @Input() mode: 'single' | 'multiple' = 'single';

  // ✅ selection from parent
  @Input() selectedIds: string[] = [];

  @Output() locationSelected =
    new EventEmitter<{ lat: number; lng: number; address?: string }>();

  searchInput = '';

  private map!: L.Map;
  private marker?: L.Marker;
  private markerCluster!: L.MarkerClusterGroup;
  private isBrowser: boolean;

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
      setTimeout(() => this.initMap(), 150);
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    if (!this.map || this.mode !== 'multiple') return;

    if (changes['vergers']) {
      this.renderMarkers();
    }

    if (changes['selectedIds']) {
      this.zoomToSelection();
    }
  }

  ngOnDestroy() {
    if (this.map) this.map.remove();
  }

  // ======================
  // INIT MAP
  // ======================
  private initMap() {
    this.map = L.map('verger-map', {
      center: [34, 9.5],
      zoom: 7
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png')
      .addTo(this.map);

    this.markerCluster = L.markerClusterGroup();
    this.map.addLayer(this.markerCluster);

    this.renderMarkers();

    if (this.latitude && this.longitude && this.mode === 'single') {
      this.map.setView([this.latitude, this.longitude], 14);
      this.placeMarker(this.latitude, this.longitude);
    }

    if (this.editable && this.mode === 'single') {
      this.map.on('click', (e: any) => {
        this.placeMarker(e.latlng.lat, e.latlng.lng);
        this.reverseGeocode(e.latlng.lat, e.latlng.lng);
      });
    }
  }

  // ======================
  // MARKERS
  // ======================
  private renderMarkers() {
    if (!this.markerCluster) return;

    this.markerCluster.clearLayers();

    this.vergers.forEach(v => {
      const geo = v.geolocalisation;
      if (!geo?.latitude || !geo?.longitude) return;

      const id = v.id || v._id;

      const marker = L.marker([geo.latitude, geo.longitude], {
        icon: this.customIcon
      });

      marker.bindPopup(`
        <b>${v.typeOlive}</b><br>
        ${v.superficie} ha<br>
        ${v.nbArbre} arbres
      `);

      this.markerCluster.addLayer(marker);
    });

    this.zoomToSelection();
  }

  // ======================
  // ZOOM LOGIC (FIXED)
  // ======================
  private zoomToSelection() {

    const list = (!this.selectedIds || this.selectedIds.length === 0)
      ? this.vergers
      : this.vergers.filter(v =>
          this.selectedIds.includes(v.id || v._id)
        );

    const coords = list
      .map(v => v.geolocalisation)
      .filter(g => g?.latitude && g?.longitude);

    if (!coords.length) return;

    const bounds = L.latLngBounds(
      coords.map(c => [c.latitude, c.longitude])
    );

    this.map.fitBounds(bounds, { padding: [80, 80] });
  }

  // ======================
  // SINGLE MARKER
  // ======================
  private placeMarker(lat: number, lng: number) {
    if (this.marker) this.marker.remove();

    this.marker = L.marker([lat, lng], {
      draggable: this.editable,
      icon: this.customIcon
    }).addTo(this.map);

    this.marker.on('dragend', (e: any) => {
      const pos = e.target.getLatLng();
      this.reverseGeocode(pos.lat, pos.lng);
    });
  }

  // ======================
  // GEO
  // ======================
  private reverseGeocode(lat: number, lng: number) {
    fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`)
      .then(res => res.json())
      .then(data =>
        this.locationSelected.emit({
          lat,
          lng,
          address: data.display_name
        })
      )
      .catch(() =>
        this.locationSelected.emit({ lat, lng })
      );
  }

  // ======================
  // SEARCH
  // ======================
  searchAddress() {
    if (!this.searchInput.trim()) return;

    fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${this.searchInput}`)
      .then(res => res.json())
      .then(data => {
        if (!data.length) return;

        const lat = +data[0].lat;
        const lng = +data[0].lon;

        this.map.setView([lat, lng], 14);
        this.placeMarker(lat, lng);
      });
  }
}