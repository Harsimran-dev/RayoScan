import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DescriptionImageModalComponent } from './description-image-modal.component';

describe('DescriptionImageModalComponent', () => {
  let component: DescriptionImageModalComponent;
  let fixture: ComponentFixture<DescriptionImageModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DescriptionImageModalComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DescriptionImageModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
