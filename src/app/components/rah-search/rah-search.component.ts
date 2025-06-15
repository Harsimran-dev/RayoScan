import { Component } from '@angular/core';
import { FormControl } from '@angular/forms';

import { debounceTime } from 'rxjs/operators';
import { ExcelServiceService } from '../excel-service.service';

@Component({
  selector: 'app-rah-search',
  templateUrl: './rah-search.component.html',
  styleUrls: ['./rah-search.component.scss']
})
export class RahSearchComponent {
  rahIdControl = new FormControl('');
  result: any = null;
  loading = false;
zoomLevel: number = 1;
translateX: number = 0;
translateY: number = 0;

private isDragging: boolean = false;
private startX: number = 0;
private startY: number = 0;
private initialX: number = 0;
private initialY: number = 0;

zoomIn(): void {
  this.zoomLevel += 0.2;
}

zoomOut(): void {
  if (this.zoomLevel > 0.4) this.zoomLevel -= 0.2;
}

resetZoom(): void {
  this.zoomLevel = 1;
  this.translateX = 0;
  this.translateY = 0;
}

startDragging(event: MouseEvent): void {
  if (this.zoomLevel <= 1) return;
  this.isDragging = true;
  this.startX = event.clientX;
  this.startY = event.clientY;
  this.initialX = this.translateX;
  this.initialY = this.translateY;
}

stopDragging(): void {
  this.isDragging = false;
}

onDrag(event: MouseEvent): void {
  if (!this.isDragging) return;
  const dx = event.clientX - this.startX;
  const dy = event.clientY - this.startY;
  this.translateX = this.initialX + dx;
  this.translateY = this.initialY + dy;
}

  constructor(private excelService: ExcelServiceService) {
    this.rahIdControl.valueChanges.pipe(debounceTime(300)).subscribe((rahId) => {
      if (rahId) this.searchRah(rahId);
    });
  }

  searchRah(rahId: string) {
    this.loading = true;
    this.excelService.getRahDetails(rahId.trim()).subscribe((data) => {
      this.result = data;
      console.log(this.result)
      this.loading = false;
    });
  }
}
