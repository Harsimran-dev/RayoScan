import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WordReaderComponent } from './word-reader.component';

describe('WordReaderComponent', () => {
  let component: WordReaderComponent;
  let fixture: ComponentFixture<WordReaderComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ WordReaderComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(WordReaderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
