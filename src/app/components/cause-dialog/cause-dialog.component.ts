import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-cause-dialog',
  template: `
    <h2 mat-dialog-title>{{ data.cause }}</h2>
    <mat-dialog-content>
      <p><strong>Extracted Causes:</strong></p>
      <ul>
        <li *ngFor="let item of data.codes">
          {{ item.code }} - {{ item.name }} - {{ item.percentage }}%
        </li>
      </ul>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="close()">Close</button>
    </mat-dialog-actions>
  `
})
export class CauseDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<CauseDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { cause: string; codes: { code: string, name: string, percentage: number }[] }
  ) {}

  close() {
    this.dialogRef.close();
  }
}