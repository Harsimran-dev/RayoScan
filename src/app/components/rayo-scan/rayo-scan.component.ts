import { Component } from '@angular/core';
import { ChartDataService } from '../chart-data.service';

@Component({
  selector: 'app-rayo-scan',
  templateUrl: './rayo-scan.component.html',
  styleUrls: ['./rayo-scan.component.scss']
})
export class RayoScanComponent {

  constructor(private chartDataService: ChartDataService) {}

  async readFile(event: any) {
    const files: FileList = event.target.files;
    if (!files.length) return;

    for (let i = 0; i < files.length; i++) {
      await this.chartDataService.processFile(files[i]);
    }
  }
}
