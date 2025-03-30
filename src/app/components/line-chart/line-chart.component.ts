import { Component } from '@angular/core';
import { ChartDataService } from '../chart-data.service';
import { ChartData } from 'chart.js';

@Component({
  selector: 'app-line-chart',
  templateUrl: './line-chart.component.html',
  styleUrls: ['./line-chart.component.scss']
})
export class LineChartComponent {
  programs: string[] = Object.values(this.chartDataService.getAvailablePrograms()); // List of programs
  selectedProgram: string | null = null; // Tracks selected program
  barChartData: ChartData<'bar'> = { labels: [], datasets: [] }; // Stores bar chart data

  constructor(private chartDataService: ChartDataService) {}

  // 🟢 When a program is clicked, update the bar chart
  showBarChart(program: string) {
    this.selectedProgram = program;
    const data = this.chartDataService.getProgramData(program);

    this.barChartData = {
      labels: Object.keys(data), // Dates
      datasets: [
        {
          label: program,
          data: Object.values(data),
          backgroundColor: '#36A2EB',
        }
      ]
    };
  }
}
