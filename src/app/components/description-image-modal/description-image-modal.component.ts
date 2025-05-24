// description-image-modal.component.ts
import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-description-image-modal',
  templateUrl: './description-image-modal.component.html',
  styleUrls: ['./description-image-modal.component.scss']
})
export class DescriptionImageModalComponent {
  @Input() causeName = '';
  @Input() description = '';
  @Input() imageUrl?: string;
  @Output() closed = new EventEmitter<void>();

  close() {
    this.closed.emit();
  }
}
