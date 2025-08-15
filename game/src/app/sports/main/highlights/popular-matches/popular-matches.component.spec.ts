import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PopularMatchesComponent } from './popular-matches.component';

describe('PopularMatchesComponent', () => {
  let component: PopularMatchesComponent;
  let fixture: ComponentFixture<PopularMatchesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PopularMatchesComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PopularMatchesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
