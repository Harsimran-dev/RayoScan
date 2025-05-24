import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RahSearchComponent } from './rah-search.component';

describe('RahSearchComponent', () => {
  let component: RahSearchComponent;
  let fixture: ComponentFixture<RahSearchComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ RahSearchComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RahSearchComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
