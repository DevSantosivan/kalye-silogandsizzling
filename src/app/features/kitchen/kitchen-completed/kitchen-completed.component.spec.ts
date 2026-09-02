import { ComponentFixture, TestBed } from '@angular/core/testing';

import { KitchenCompletedComponent } from './kitchen-completed.component';

describe('KitchenCompletedComponent', () => {
  let component: KitchenCompletedComponent;
  let fixture: ComponentFixture<KitchenCompletedComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [KitchenCompletedComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(KitchenCompletedComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
