import { Component, ViewChild, AfterViewInit, ChangeDetectorRef } from '@angular/core';
import { ChartOptions, ChartData } from 'chart.js';
import { MatDialog } from '@angular/material/dialog';
import * as pdfjsLib from 'pdfjs-dist';
import 'pdfjs-dist/build/pdf.worker.entry';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { CAUSES_MAPPING } from 'src/causes/causes-mapping';
import html2canvas from 'html2canvas';
import { ExcelServiceService } from '../../excel-service.service';
import { NgxSignaturePadComponent, SignaturePadOptions } from '@o.krucheniuk/ngx-signature-pad';


@Component({
  selector: 'app-word-reader',
  templateUrl: './word-reader.component.html',
  styleUrls: ['./word-reader.component.scss']
})
export class WordReaderComponent implements AfterViewInit {
  @ViewChild('testPad', { static: false }) signaturePadElement: NgxSignaturePadComponent;

  @ViewChild('pieChartCanvas') pieChartCanvas: any;
  colorCounts: { [color: string]: number } = {};
  clientData: any;
  showPieChart: boolean = false;
  rahIdNumber: string | undefined;
  showPdfPreview: boolean = false;
  causeGroups: any[] = [];
  patientName:string | null;
  expandedCauseGroup: boolean[] = [];
  showRootCauses = true; // default to visible
  rahHeaderSection: string = ""; 


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
  config: SignaturePadOptions = {
    minWidth: 1,
    maxWidth: 10,
    penColor: "blue"
  };
  public clear() {
    if (this.signaturePadElement) {
      this.signaturePadElement.clear();
    }
  }
  

  public getImage() {
    console.log(this.signaturePadElement.toDataURL());
  }

  public changeConfig() {
    this.config.penColor = Math.random() >= 0.5 ? "black" : "red";
    this.config.maxWidth = Math.random() * 10;
    this.config = Object.assign({}, this.config);
  }

  public isInValid(): boolean {
    return !(this.signaturePadElement && !this.signaturePadElement.isEmpty());
  }

  public forceReload() {
    this.signaturePadElement.forceUpdate();
  }
  
ngOnInit(): void {
  const causeCount = this.getSortedCauses().length;
  console.log(this.expandedCauseGroup)
  this.expandedCauseGroup = new Array(causeCount).fill(true);
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
    const causeCount = this.getSortedCauses().length;
    console.log(this.expandedCauseGroup)
    this.expandedCauseGroup = new Array(causeCount).fill(true);
  }

  extractClientData(text: string) {
    // Adjusted regex patterns
    const namePattern = /Rayoscan\s*-\s*RAH\s*Scan\s*-\s*([A-Za-z\s]+)\s*Client\s*data/;
    const surnamePattern = /Surname:\s*([A-Za-z\s\-]+)\s*First\s*name:\s*([A-Za-z\s\-]+)/;
    const dobPattern = /Date\s*of\s*birth:\s*(\d{1,2}\.\d{1,2}\.\d{4})/;
  
    // Test for matches
    const nameMatch = text.match(namePattern);
    const surnameFirstNameMatch = text.match(surnamePattern);
    const dobMatch = text.match(dobPattern);
  
    // Extract the values
    const fullName = nameMatch ? nameMatch[1].trim() : null;
    this.patientName=fullName;
    const surname = surnameFirstNameMatch ? surnameFirstNameMatch[1].trim() : null;
    const firstName = surnameFirstNameMatch ? surnameFirstNameMatch[2].trim() : null;
    const dateOfBirth = dobMatch ? dobMatch[1].trim() : null;
  
    // Helper function to format the date to yyyy-mm-dd (without time)
    const formatDate = (date: Date): string => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0'); // Ensure 2 digits
      const day = String(date.getDate()).padStart(2, '0'); // Ensure 2 digits
      return `${day}-${month}-${year}`;
    };
  
    // Parse Date of Birth
    let parsedDateOfBirth: Date | null = null;
    let formattedDob: string | null = null;
    if (dateOfBirth) {
      const [day, month, year] = dateOfBirth.split('.');
      parsedDateOfBirth = new Date(Number(year), Number(month) - 1, Number(day)); // Properly create Date object
      formattedDob = formatDate(parsedDateOfBirth); // Format date to yyyy-mm-dd
    }
  
    // Store the extracted data
    this.clientData = {
      fullName,
      surname,
      firstName,
      dateOfBirth: formattedDob, // Only store formatted date as string
    };
  
    // Log for verification
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
    const regex = /(\d{2}\.\d{2})\s+([^\d%][^%]+?)\s+(\d{1,3})%/g;
  
    const highPercentageRahIds: { rahId: string, name: string }[] = [];
    const categoryCounts: { [key: string]: number } = {};
    const categoryCodes: { [key: string]: { code: string, name: string, percentage: number, color: string }[] } = {};
  
    let match;
  
    // ✅ Improved Smart Clean: Skip 'RAH 46.00...' header and start from first line with: XX.XX SomeName 100%
   // Match the actual start of useful data
// Match the actual start of useful data
const actualStartMatch = text.match(/(\d{2}\.\d{2})\s+[^\d%]+\s+(\d{1,3})%/);

if (actualStartMatch && actualStartMatch.index !== undefined) {
  const headerPortion = text.substring(0, actualStartMatch.index);

  // Match only the line that starts with "RAH" and ends before "No." or a newline
  const rahLineMatch = headerPortion.match(/RAH\s+\d{2}\.\d{2}\s+(.+?)\s+(No\.|Program name|$)/);
  if (rahLineMatch) {
    const rahCleaned = ` ${rahLineMatch[0].split("No.")[0].trim()}`;
    this.rahHeaderSection = rahCleaned;
    console.log( this.rahHeaderSection)
  }

  text = text.substring(actualStartMatch.index);
}



  
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
  
      categoryCounts[cause] += 1;
      categoryCodes[cause].push({ code, name, percentage, color });
  
      if (percentage === 100) {
        highPercentageRahIds.push({ rahId: code, name });
      }
    }
  
    // Assign to component properties
    this.causeCounts = categoryCounts;
    this.causeCodes = categoryCodes;
    this.countColors();
  
    // Fetch details for 100% entries
    highPercentageRahIds.forEach(record => this.fetchExcelRecord(record.rahId, record.name));
  
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
  
    if (printContent && printWindow) {
      const textareas = printContent.querySelectorAll('textarea');
      const replacements: { original: HTMLTextAreaElement; replacement: HTMLDivElement }[] = [];
  
      textareas.forEach((textarea) => {
        const div = document.createElement('div');
        div.textContent = textarea.value;
        div.style.cssText = window.getComputedStyle(textarea).cssText;
        div.style.whiteSpace = 'pre-wrap';
  
        textarea.parentNode?.replaceChild(div, textarea);
        replacements.push({ original: textarea, replacement: div });
      });
  
      // Use rahIdNumber as title if available
      const rahId = this.rahIdNumber || 'RAHID';
      const patientName = this.patientName || 'Patient';
      const pdfTitle = `${patientName}_${rahId}_Rayoscan_Report`;
  
      printWindow.document.write(`<html><head><title>${pdfTitle}</title><style>`);
      printWindow.document.write('body { font-family: Arial, sans-serif; margin: 20px; }');
      printWindow.document.write('h5 { color: #333; }');
      printWindow.document.write('</style></head><body>');
      printWindow.document.write(printContent.innerHTML);
      printWindow.document.write('</body></html>');
      printWindow.document.close();
  
      // Restore original textareas
      replacements.forEach(({ original, replacement }) => {
        replacement.parentNode?.replaceChild(original, replacement);
      });
  
      setTimeout(() => {
        printWindow.print();
      }, 500);
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
  
  


  

  toggleCauseDetails(index: number) {
    // Toggle the expanded state for the given index
    this.expandedCauseGroup[index] = !this.expandedCauseGroup[index];
    console.log('Toggled cause group details:', this.expandedCauseGroup[index]);
    this.cdr.detectChanges(); // Ensure changes are reflected in the UI
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

  fetchExcelRecord(rahId: string, name: string) {
    this.excelService.searchRahId(rahId).subscribe(
      (description: string | null) => {
     
          console.log("🚀 Fetched Description:", description);
  
          // 🧠 Sort colors by count in descending order
          const sortedColors = Object.entries(this.colorCounts)
            .sort((a, b) => b[1] - a[1])
            .map(entry => entry[0]);
  
          const dominantColor = sortedColors[0] || '';
          const secondDominantColor = sortedColors[1] || '';
  
          // 📌 Helper function to get causes for a color
          const getCausesForColor = (color: string): string[] => {
            return Object.entries(this.causeCodes)
              .filter(([cause, items]) => items.some(item => item.color === color))
              .map(([cause]) => cause);
          };
  
          const dominantCauses = getCausesForColor(dominantColor);
          const secondDominantCauses = getCausesForColor(secondDominantColor);
  
          // 🎨 Color summary block
          const colorBlock =
          `There is also an energy imbalance in the following area:\n\n` +
          ` ${dominantColor.toUpperCase()}\n` +  // Bold "Most Dominant Color"
          `𝗥𝗲𝗹𝗮𝘁𝗲𝗱 𝗖𝗮𝘂𝘀𝗲𝘀: ${dominantCauses.join(', ') || 'N/A'}\n\n` +  // Bold "Related Causes"
          ` ${secondDominantColor.toUpperCase()}\n` +  // Bold "Second Most Dominant Color"
          `𝗥𝗲𝗹𝗮𝘁𝗲𝗱 𝗖𝗮𝘂𝘀𝗲𝘀: ${secondDominantCauses.join(', ') || 'N/A'}\n\n`;  // Bold "Related Causes"
        
  
          // 🧾 Description entry
          const newEntry =
          `The detailed scan shows 𝗵𝗶𝗴𝗵 𝗲𝗻𝗲𝗿𝗴𝗲𝘁𝗶𝗰 𝗶𝗺𝗯𝗮𝗹𝗮𝗻𝗰𝗲𝘀 in:\n\n` +
          `𝗖𝗔𝗨𝗦𝗘: ${name.toUpperCase()}\n` +  // Bold "CAUSE"
          ` Description: ${description}\n=========================\n\n`;
        
        
        
  
          // 📦 Append to selected record
          if (this.selectedExcelRecord) {
            // 🧹 Remove previous color block if already present
            const colorBlockStart = 'There is also an energy imbalance in the following area:';
            this.selectedExcelRecord.fullDescription = this.selectedExcelRecord.fullDescription
              .split(colorBlockStart)[0]
              .trim();
  
            // ➕ Add new cause description
            this.selectedExcelRecord.fullDescription += `\n\n${newEntry}`;
          } else {
            this.selectedExcelRecord = {
              rahId,
              name,
              description,
              fullDescription: newEntry
            };
          }
  
          // ✅ Add color block at the very end
          this.selectedExcelRecord.fullDescription += `\n\n${colorBlock}`;
  
          this.cdRef.detectChanges();
        
      },
      (error: any) => {
        console.error("❌ Error fetching record:", error);
      }
    );
  }

  fetchExcelRecordPopup(rahId: string, name: string) {
    this.excelService.searchRahId(rahId).subscribe(
      (description: string | null) => {
        if (description) {
          const message =
  `The detailed scan shows high energetic imbalances in:
  
  CAUSE: ${name.toUpperCase()}
  Description: ${description}`;
  
          alert(message);
        } else {
          alert("No description found for RAH ID: " + rahId);
        }
      },
      (error: any) => {
        console.error("❌ Error fetching record:", error);
        alert("Something went wrong. Please try again.");
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