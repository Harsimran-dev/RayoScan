import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CauseDialogComponent } from './cause-dialog.component';

describe('CauseDialogComponent', () => {
  let component: CauseDialogComponent;
  let fixture: ComponentFixture<CauseDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CauseDialogComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CauseDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
