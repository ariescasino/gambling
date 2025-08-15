import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SportsSidebarComponent } from './sports-sidebar.component';

describe('SportsSidebarComponent', () => {
  let component: SportsSidebarComponent;
  let fixture: ComponentFixture<SportsSidebarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [SportsSidebarComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(SportsSidebarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
