import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AgriculteurDashboardComponent } from './agriculteur-dashboard';

describe('AgriculteurDashboardComponent', () => {
  let component: AgriculteurDashboardComponent;
  let fixture: ComponentFixture<AgriculteurDashboardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AgriculteurDashboardComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AgriculteurDashboardComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});