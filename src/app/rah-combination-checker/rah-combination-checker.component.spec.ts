import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RahCombinationCheckerComponent } from './rah-combination-checker.component';

describe('RahCombinationCheckerComponent', () => {
  let component: RahCombinationCheckerComponent;
  let fixture: ComponentFixture<RahCombinationCheckerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ RahCombinationCheckerComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RahCombinationCheckerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
