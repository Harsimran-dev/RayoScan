import { Component, ViewChild, AfterViewInit, ChangeDetectorRef } from '@angular/core';
import { ChartOptions, ChartData } from 'chart.js';
import { MatDialog } from '@angular/material/dialog';
import * as pdfjsLib from 'pdfjs-dist';
import 'pdfjs-dist/build/pdf.worker.entry';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { CAUSES_MAPPING } from 'src/causes/causes-mapping';
import html2canvas from 'html2canvas';
import { ExcelServiceService } from '../../excel-service.service';


@Component({
  selector: 'app-word-reader',
  templateUrl: './word-reader.component.html',
  styleUrls: ['./word-reader.component.scss']
})
export class WordReaderComponent implements AfterViewInit {
  @ViewChild('pieChartCanvas') pieChartCanvas: any;
  colorCounts: { [color: string]: number } = {};
  clientData: any;
  showPieChart: boolean = false;
  rahIdNumber: string | undefined;
  showPdfPreview: boolean = false;
  causeGroups: any[] = [];

  extractedCodes: string[] = [];
  causeCounts: { [key: string]: number } = {};
  causeCodes: { [key: string]: { code: string, name: string, percentage: number, color: string }[] } = {};  
  legendColors: string[] = [];

  causeDetailsVisibility: { [key: string]: boolean } = {};  
  selectedExcelRecord: any = null;  
  objectKeys = Object.keys;
  pdfSrc: SafeResourceUrl | null = null;
  private chartColors: string[] = [
    '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40',
    '#E7E9ED', '#8DD3C7', '#BEBADA', '#FB8072', '#80B1D3', '#FDB462'
  ];

  public pieChartData: ChartData<'pie'> = {
    labels: [],
    datasets: [
      {
        data: [],
        backgroundColor: [],
      }
    ]
  };

  public pieChartOptions: ChartOptions<'pie'> = {
    responsive: true,
    plugins: {
      legend: {
        display: false,
      },
    },
  };

  constructor(private excelService: ExcelServiceService,public dialog: MatDialog,  private cdRef: ChangeDetectorRef,private sanitizer: DomSanitizer,private cdr: ChangeDetectorRef) {}

  async readFile(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.resetData();
      console.log("📂 File selected:", file.name);
  
      if (file.type === "application/pdf") {
        const objectURL = URL.createObjectURL(file);
        this.pdfSrc = this.sanitizer.bypassSecurityTrustResourceUrl(objectURL); // Sanitize URL
        await this.readPDF(file);
      } else {
        console.warn("⚠️ Unsupported file format. Please upload a PDF.");
      }
    }
  }
  
  

  resetData() {
    this.extractedCodes = [];
    this.causeCounts = {};
    this.causeCodes = {}; 
    this.pieChartData.labels = [];
    this.pieChartData.datasets[0].data = [];
    this.legendColors = [];
    this.showPieChart = false;
  }

  async readPDF(file: File) {
    const reader = new FileReader();
    const arrayBuffer = await new Promise<ArrayBuffer>((resolve, reject) => {
      reader.onload = () => resolve(reader.result as ArrayBuffer);
      reader.onerror = reject;
      reader.readAsArrayBuffer(file);
    });

    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    let extractedText = "";

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      extractedText += textContent.items.map((item: any) => item.str).join(" ") + "\n";
    }

    console.log("📖 Extracted Text:", extractedText);
    this.processExtractedText(extractedText);
    const clientData = this.extractClientData(extractedText);
    console.log("Client Data:", clientData);
    const fileName = file.name;
    const rahIdMatch = fileName.match(/(\d{6}-\d{6})/); // Match pattern for numbers like 250202-180916
  
    if (rahIdMatch) {
      const rahId = rahIdMatch[0]; // Extracted RAH ID
      console.log("Extracted RAH ID:", rahId);
      this.rahIdNumber = rahId; // Store the extracted RAH ID number in the variable
    }
  }

  extractClientData(text: string) {
    // Adjusted regex patterns
    const namePattern = /Rayoscan\s*-\s*RAH\s*Scan\s*-\s*([A-Za-z\s]+)\s*Client\s*data/;
    const surnamePattern = /Surname:\s*([A-Za-z\s\-]+)\s*First\s*name:\s*([A-Za-z\s\-]+)/;
    const dobPattern = /Date\s*of\s*birth:\s*(\d{2}\.\d{2}\.\d{4})/;
  
    // Test for matches based on the adjusted pattern
    const nameMatch = text.match(namePattern);
    const surnameFirstNameMatch = text.match(surnamePattern);
    const dobMatch = text.match(dobPattern);
  
    // Extract the values if available
    const fullName = nameMatch ? nameMatch[1].trim() : null;
    const surname = surnameFirstNameMatch ? surnameFirstNameMatch[1].trim() : null;
    const firstName = surnameFirstNameMatch ? surnameFirstNameMatch[2].trim() : null;
    const dateOfBirth = dobMatch ? dobMatch[1].trim() : null;
  
    // Parse Date of Birth into a Date object, if available
    let parsedDateOfBirth = null;
    if (dateOfBirth) {
      const [day, month, year] = dateOfBirth.split('.'); // Split the date string
      parsedDateOfBirth = new Date(`${year}-${month}-${day}`); // Convert to Date format (yyyy-MM-dd)
    }
  
    // Store the extracted data into clientData
    this.clientData = {
      fullName,
      surname,
      firstName,
      dateOfBirth: parsedDateOfBirth, // Return parsed Date object
    };

    // Log the final extracted values
    console.log("Extracted Client Data:", this.clientData);
  }
  
  
  countColors() {
    this.colorCounts = {};

    // Iterate through causeCodes and count occurrences of each color
    for (const cause in this.causeCodes) {
      if (this.causeCodes.hasOwnProperty(cause)) {
        this.causeCodes[cause].forEach(item => {
          const color = item.color;
          this.colorCounts[color] = (this.colorCounts[color] || 0) + 1;
        });
      }
    }
  }
  calculatePercentage(colorCount: number): number {
    const totalCount = 40; // As mentioned, the total is 40
    return parseFloat(((colorCount / totalCount) * 100).toFixed(2)); // Converts the string back to a number
  }
  
  processExtractedText(text: string) {
    const regex = /(\d{2}\.\d{2})\s+([\w\s,()\-\–]+?)\s+(\d{1,3})%/g;


    let match;
    const categoryCounts: { [key: string]: number } = {};
    const categoryCodes: { [key: string]: { code: string, name: string, percentage: number, color: string }[] } = {};
  
    console.log("📖 Extracted Text:\n", text); // Debugging: See full extracted text
  
    while ((match = regex.exec(text)) !== null) {
      const code = match[1]?.trim();  
      const name = match[2]?.trim();  
      const percentage = parseInt(match[3]);  
      const prefix = code.substring(0, 2);
  
      const cause = CAUSES_MAPPING[prefix] || "Unknown cause";
      const color = this.getColorForFrequency(code);
  
      console.log(`🔍 Processing: Code=${code}, Name=${name}, Percentage=${percentage}, Cause=${cause}, Color=${color}`);
  
      if (!categoryCounts.hasOwnProperty(cause)) {
        categoryCounts[cause] = 0;
        categoryCodes[cause] = [];
      }
      
      // 🔥 Ensure correct counting
      categoryCounts[cause] += 1;
      categoryCodes[cause].push({ code, name, percentage, color });
    }
  
    console.log("✅ Final Cause Counts:", JSON.stringify(categoryCounts, null, 2)); // Debugging: Ensure "Harmful substances" is counted
  
    this.causeCounts = categoryCounts;
    this.causeCodes = categoryCodes;
    this.countColors();
  
    // Update Pie Chart
    this.pieChartData.labels = Object.keys(this.causeCounts);
    this.pieChartData.datasets[0].data = Object.values(this.causeCounts);
    this.legendColors = this.chartColors.slice(0, this.pieChartData.labels.length);
    this.pieChartData.datasets[0].backgroundColor = [...this.legendColors];
  
    this.showPieChart = true;
    this.updatePieChart();
  }
  toggleCause(index: number) {
    this.causeGroups[index].showDetails = !this.causeGroups[index].showDetails;
  }
  printPage() {
    const printContent = document.getElementById('printSection');
    const printWindow = window.open('', '', 'height=600,width=800');

    if (printContent) {
      // Capture the pie chart canvas as an image using html2canvas
      html2canvas(printContent).then((canvas) => {
        // Convert canvas to image
        const image = canvas.toDataURL('image/png');

        // Open the print window and add the content
        printWindow?.document.write('<html><head><title>Print</title><style>');
        printWindow?.document.write('body { font-family: Arial, sans-serif; margin: 20px; }');
        printWindow?.document.write('h5 { color: #333; }');
        printWindow?.document.write('</style></head><body>');
        
        // Write the pie chart as an image
        printWindow?.document.write('<img src="' + image + '" alt="Pie Chart" style="width: 100%; max-width: 600px; margin-bottom: 20px;" />');
        
        // Write the rest of the content
        printWindow?.document.write(printContent.innerHTML || '');
        printWindow?.document.write('</body></html>');
        
        printWindow?.document.close();
        printWindow?.print();
      });
    }
  }
  
  
  
  getColorForFrequency(code: string): string {
    const frequency = parseFloat(code);
  
    if ((frequency >= 20.05 && frequency <= 27.05) || (frequency >= 8.0 && frequency <= 8.99)) {
      return 'red';
  }

  // Blue: Frequency between 6.00 and 10.95 (inclusive)
  if (frequency >= 6.00 && frequency <= 10.95) {
      return 'blue';
  }

  // Green: Frequency between 2.00 and 5.00 (inclusive)
  if (frequency >= 2.00 && frequency <= 5.00) {
      return 'green';
  }

  // Orange: Frequency between 30.00 and 77.00 (inclusive)
  if (frequency >= 30.00 && frequency <= 77.00) {
      return 'orange';
  }

  return 'black';  // Default color for frequencies outside the specified ranges
  }
  
  


  

  toggleCauseDetails(causeGroup: any) {
    // Toggle the showDetails property for the clicked cause group
    causeGroup.showDetails = !causeGroup.showDetails;
    console.log(causeGroup.showDetails);
    console.log("Toggled cause group details:", causeGroup); // Debugging
    this.cdr.detectChanges();

  }
  
  getSortedCauses(): { cause: string, items: any[], showDetails: boolean }[] {
    const colorTotals: { [color: string]: number } = { red: 0, blue: 0, green: 0, orange: 0 };
  
    // Calculate total percentage per color
    for (const cause in this.causeCodes) {
      this.causeCodes[cause].forEach(item => {
        colorTotals[item.color] = (colorTotals[item.color] || 0) + item.percentage;
      });
    }
  
    // Sort colors by total percentage in descending order
    const sortedColors = Object.entries(colorTotals)
      .sort(([, totalA], [, totalB]) => totalB - totalA)
      .map(([color]) => color);
  
    // Group causes by color
    const colorGroupedCauses: { [color: string]: { cause: string, items: any[], showDetails: boolean }[] } = {};
    const seenCauses = new Set();
  
    for (const cause in this.causeCodes) {
      if (!seenCauses.has(cause)) {
        const causeItems = this.causeCodes[cause];
        const firstItemColor = causeItems[0]?.color;
  
        if (!colorGroupedCauses[firstItemColor]) {
          colorGroupedCauses[firstItemColor] = [];
        }
  
        // Initialize showDetails for each cause group
        colorGroupedCauses[firstItemColor].push({ cause, items: causeItems, showDetails: false });
        seenCauses.add(cause);
      }
    }
  
    // Sort causes by color and return them
    const sortedCauses: { cause: string, items: any[], showDetails: boolean }[] = [];
    sortedColors.forEach(color => {
      if (colorGroupedCauses[color]) {
        sortedCauses.push(...colorGroupedCauses[color]);
      }
    });
  
    return sortedCauses;
  }
  trackByCause(index: number, causeGroup: any) {
    return causeGroup.cause;  // Track by unique cause
  }
  
  



  togglePdfPreview() {
    this.showPdfPreview = !this.showPdfPreview;
  }

  fetchExcelRecord(rahId: string) {
    this.excelService.searchRahId(rahId).subscribe(
      (description: string | null) => { // Explicitly type 'description'
        if (description) {
          console.log("🚀 Fetched Description:", description);
          
          // Append new description to the previous one
          if (this.selectedExcelRecord) {
            this.selectedExcelRecord.description += `\n\n${description}`; // Add new description below the previous one
          } else {
            this.selectedExcelRecord = { rahId, description }; // For the first cause, store it normally
          }
  
          this.cdRef.detectChanges(); // Force UI update
        } else {
          console.warn("⚠️ No record found for RAH ID:", rahId);
          this.selectedExcelRecord = null;
        }
      },
      (error: any) => { // Explicitly type 'error' as 'any'
        console.error("❌ Error fetching record:", error);
      }
    );
  }
  
  
  
  
  

  updatePieChart() {
    if (this.pieChartCanvas?.chart) {
      this.pieChartCanvas.chart.update();  
    } else {
      console.log("⚠️ Chart not initialized yet.");
    }
  }

  togglePieChart() {
    this.showPieChart = !this.showPieChart;
    if (this.showPieChart) {
      this.updatePieChart();
    }
  }


  

  ngAfterViewInit() {
    this.cdRef.detectChanges();  
    this.updatePieChart();
  }
}