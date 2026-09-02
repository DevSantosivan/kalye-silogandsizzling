import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CashierLayoutComponent } from './cashier-layout.component';

describe('CashierLayoutComponent', () => {
  let component: CashierLayoutComponent;
  let fixture: ComponentFixture<CashierLayoutComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CashierLayoutComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CashierLayoutComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
