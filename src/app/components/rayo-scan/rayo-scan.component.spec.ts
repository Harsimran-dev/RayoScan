import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RayoScanComponent } from './rayo-scan.component';

describe('RayoScanComponent', () => {
  let component: RayoScanComponent;
  let fixture: ComponentFixture<RayoScanComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ RayoScanComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RayoScanComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
