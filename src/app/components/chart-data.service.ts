
interface ExtractedData {
  [category: string]: {
    [date: string]: number;
  };
}

interface ChartDat {
  labels: string[];
  datasets: {
    label: string;
    data: (number | null)[];
    borderColor: string;
    fill: boolean;
  }[];
}



import { Injectable } from '@angular/core';
import { ChartData } from 'chart.js';
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf';
import * as pdfWorker from 'pdfjs-dist/legacy/build/pdf.worker.min.js';
import { CAUSES_MAPPING } from 'src/causes/causes-mapping';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

@Injectable({
  providedIn: 'root'
})
export class ChartDataService {
  extractedData: ExtractedData = {}; // Use the custom interface here
  chartData: ChartDat= { labels: [], datasets: [] };

  chartOptions = { responsive: true };

  constructor() {}

  // 🟢 Handle File Upload (PDF or DOCX)
  async processFile(file: File) {
    const fileType = file.name.split('.').pop()?.toLowerCase();
    if (!fileType) return;

    console.log(`📂 Processing file: ${file.name} (Type: ${fileType})`);

    if (fileType === 'docx') {
      await this.processDocx(file);
    } else if (fileType === 'pdf') {
      await this.processPdf(file);
    }
  }

  // 🟢 Process DOCX files using Mammoth
  async processDocx(file: File) {
    const reader = new FileReader();
    reader.onload = async (e: any) => {
      try {
        const mammoth = await import('mammoth');
        const result = await mammoth.extractRawText({ arrayBuffer: e.target.result });
        this.extractData(result.value, this.getDateFromFile(file.name));
      } catch (err) {
        console.error("❌ Error reading DOCX:", err);
      }
    };
    reader.readAsArrayBuffer(file);
  }

  getAvailablePrograms(): { [key: string]: string } {
    return CAUSES_MAPPING;
  }
  

  // 🔵 Process PDFs using pdf.js
  async processPdf(file: File) {
    const reader = new FileReader();
    reader.onload = async (e: any) => {
      try {
        const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(e.target.result) }).promise;
        let extractedText = '';

        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const textContent = await page.getTextContent();
          const pageText = textContent.items.map((item: any) => item.str).join(' ');
          extractedText += pageText + '\n';
        }

        this.extractData(extractedText, this.getDateFromFile(file.name));
      } catch (err) {
        console.error("❌ Error processing PDF:", err);
      }
    };
    reader.readAsArrayBuffer(file);
  }

  // 🟢 Extract percentages & map to fixed categories
  extractData(text: string, date: string) {
    console.log("Extracting data from text on:", date);
    
    const regex = /(\d{2}\.\d{2})\s+(.+?)\s+(\d{1,3})%/g;
    let match;
    
    while ((match = regex.exec(text)) !== null) {
        const [, code, name, percentage] = match;
        console.log(`Raw Match -> Code: ${code}, Name: ${name}, Percentage: ${percentage}`);
        
        const category = CAUSES_MAPPING[code.substring(0, 2)] || name.trim();
        console.log(`Mapped Category -> ${category} : ${percentage}%`);

        if (!this.extractedData[category]) {
            this.extractedData[category] = {};
        }
        this.extractedData[category][date] = Number(percentage);
    }
    
    console.log("Final Extracted Data:", this.extractedData);
    this.updateChart();
}

  // 🟢 Update Chart Data for Visualization
  updateChart() {
    const dates = new Set<string>();

    // Collect all unique dates from extracted data
    Object.values(this.extractedData).forEach((entry: { [date: string]: number }) =>
      Object.keys(entry).forEach((date: string) => dates.add(date as string))
    );

    // Ensure labels are always defined
    this.chartData.labels = Array.from(dates).sort() as string[];

    // Map each category to a dataset with its percentage data over time
    this.chartData.datasets = Object.keys(this.extractedData).map((category) => ({
      label: category,
      data: this.chartData.labels.map((date) =>
        this.extractedData[category]?.[date] ?? null
      ),
      borderColor: this.getRandomColor(),
      fill: false
    }));
  }

  // 🟢 Extract date from filename
  getDateFromFile(fileName: string): string {
    const match = fileName.match(/_(\d{6})/);
    return match
      ? `20${match[1].substring(0, 2)}-${match[1].substring(2, 4)}-${match[1].substring(4, 6)}`
      : new Date().toISOString().split('T')[0];
  }

  // 🟢 Random color generator for the chart lines
  getRandomColor(): string {
    return `#${Math.floor(Math.random() * 16777215).toString(16)}`;
  }

  // 🟢 Get data for a specific program
  getProgramData(category: string) {
    return this.extractedData[category] || {};
  }
}
