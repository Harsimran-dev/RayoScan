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
import { forkJoin } from 'rxjs';
import { GeminiService } from '../../gemini.service';


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
  levelGroups: { [level: string]: string[] } = {
    "VERY HIGH (80% - 100%)": [],
    "HIGH (50% - 79%)": [],
    "MODERATE (30% - 49%)": [],
    "LOW (0% - 29%)": []
  };
  pendingRequests: number = 0;
  causeGroups: any[] = [];
  patientName:string | null;
  expandedCauseGroup: boolean[] = [];
  showRootCauses = true; // default to visible
  rahHeaderSection: string = ""; 
  aminoAcidInsights: { name: string, response: string }[] = [];

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

  constructor(private geminiService:GeminiService,private excelService: ExcelServiceService,public dialog: MatDialog,  private cdRef: ChangeDetectorRef,private sanitizer: DomSanitizer,private cdr: ChangeDetectorRef) {}

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
  
    const highPercentageRahIds: { rahId: string, name: string, percentage: number, cause: string }[] = [];
    const categoryCounts: { [key: string]: number } = {};
    const categoryCodes: { [key: string]: { code: string, name: string, percentage: number, color: string }[] } = {};
  
    let match;
  
    // ✅ Smart clean: Start from first real data line
    const actualStartMatch = text.match(/(\d{2}\.\d{2})\s+[^\d%]+\s+(\d{1,3})%/);
  
    if (actualStartMatch && actualStartMatch.index !== undefined) {
      const headerPortion = text.substring(0, actualStartMatch.index);
  
      // Match RAH header
      const rahLineMatch = headerPortion.match(/RAH\s+\d{2}\.\d{2}\s+(.+?)\s+(No\.|Program name|$)/);
      if (rahLineMatch) {
        const rahCleaned = ` ${rahLineMatch[0].split("No.")[0].trim()}`;
        this.rahHeaderSection = rahCleaned;
        console.log(this.rahHeaderSection);
      }
  
      // Trim text to exclude header
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
  
      highPercentageRahIds.push({ rahId: code, name, percentage, cause });
    }
  
    // ✅ Assign to component properties
    this.causeCounts = categoryCounts;
    this.causeCodes = categoryCodes;
    this.countColors();
  
    const targetCauses = ["Acid-base balance", "Vital substances", "Harmful substances", "Enzymes", "Amino acids"];

    targetCauses.forEach(targetCause => {
      if (categoryCodes[targetCause]) {
        const relevantItems = categoryCodes[targetCause].filter(item =>
          item.percentage >= 60 && item.percentage <= 84
        );
    
        relevantItems.forEach(item => {
          this.processRecommendationFromExcel(item.code, item.name, targetCause); // 👈 now passes cause
        });
      }
    });
    
    
    
  
    // ✅ Fetch details for 100% entries
    highPercentageRahIds.forEach(record =>
      this.fetchExcelRecord(record.rahId, record.name, record.percentage, record.cause)
    );
  
    // ✅ Update Pie Chart
    this.pieChartData.labels = Object.keys(this.causeCounts);
    this.pieChartData.datasets[0].data = Object.values(this.causeCounts);
    this.legendColors = this.chartColors.slice(0, this.pieChartData.labels.length);
    this.pieChartData.datasets[0].backgroundColor = [...this.legendColors];
  
    this.showPieChart = true;
    this.updatePieChart();
  }
  
  processRecommendationFromExcel(rahId: string, name: string, cause: string): void {
    this.excelService.getRahDetails(rahId).subscribe({
      next: (data) => {
        const boldedName = this.toUnicodeBold(name);
        const boldedCause = this.toUnicodeBold(cause);
        const displayName = ` ${boldedCause} - ${boldedName}`;
  
        if (data) {
                

      
          const recommendation = data.recommendation || 'No specific recommendation.';
          const combined = `Description: ${description}\nRecommendation: ${recommendation}`;

          this.aminoAcidInsights.push({ name: displayName, response: combined });
        } else {
          this.aminoAcidInsights.push({ name: displayName, response: 'No Excel data found.' });
        }
  
        this.updateRecommendationText();
      },
      error: (err) => {
        console.error(`❌ Excel error for ${name}:`, err);
        const displayName = `𝗖𝗔𝗨𝗦𝗘: ${this.toUnicodeBold(cause)} - ${this.toUnicodeBold(name)}`;
        this.aminoAcidInsights.push({ name: displayName, response: 'Excel lookup failed.' });
      }
    });
  }
  
  
  

  public recommendationText: string = '';

updateRecommendationText(): void {
  let insightsText = this.aminoAcidInsights.map(insight =>
    ` ${insight.name}\n${insight.response}\n`
  ).join('\n');

  const staticRecommendations = `
I would recommend that the client takes the supplements as stated and also regular treatments so that the issues highlighted by the scan be addressed energetically:

• 𝗥𝗔𝗬𝗢𝗣𝗨𝗥𝗘 – This helps with removing harmful substances and parasites  
Recommended intake: 1 capsule per day for 2 weeks, can be taken first thing in morning, 30 min before breakfast. Recommended to drink plenty of water during the day

• 𝗥𝗔𝗬𝗢𝗕𝗔𝗦𝗘 – This helps with controlling the acid levels (pH levels)  
Recommended intake: 1 capsule per day for 2 weeks, can be taken before breakfast

• 𝗥𝗔𝗬𝗢𝗩𝗜𝗧𝗔 – This helps support the vitamins trace element  
Recommended intake: 1 Sachet per day for 1 week, can be taken before lunch mixed in any drink

• 𝗥𝗔𝗬𝗢𝗙𝗟𝗢𝗥𝗔 – This helps by providing 13 different live good bacteria strands  
Recommended intake: 1 Sachet per day for 1 week, needs to be mixed in lukewarm water 30 mins before bed time

• 𝗥𝗔𝗬𝗢𝗦𝗢𝗟𝗘 – This helps promote detoxification in the body  
Recommended: 1 Tablespoon per foot spa, ideally 2 foot spas per week
`;

  this.recommendationText = insightsText + '\n' + staticRecommendations;
}

  
  
  
  
  
  toggleCause(index: number) {
    this.causeGroups[index].showDetails = !this.causeGroups[index].showDetails;
  }
  printPage() {
    const printContent = document.getElementById('printSection');
    const printWindow = window.open('', '', 'height=800,width=1000');
  
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
  
      const rahId = this.rahIdNumber || 'RAHID';
      const patientName = this.clientData?.fullName || 'Patient';
      const pdfTitle = `${patientName}_${rahId}_Rayoscan_Report`;
  
      printWindow.document.write(`
        <html>
          <head>
            <title>${pdfTitle}</title>
            <link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/bootstrap/4.0.0/css/bootstrap.min.css">
            <style>
             body {
  font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen,
    Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
  margin: 20px;
  background-color: #f8f9fa;
  color: #333;
  font-size: 14px;
}

.report-section {
  background-color: white;
  padding: 20px;
  border-radius: 10px;
  box-shadow: 0 4px 8px rgba(0,0,0,0.1);
  margin-bottom: 30px;
}

.section-title {
  font-weight: 600;
  font-size: 18px;
  margin-bottom: 15px;
  border-bottom: 2px solid #ccc;
  padding-bottom: 5px;
  text-align: center;
  text-transform: uppercase;
  color: #222;
}

.color-counts ul {
  list-style: none;
  padding-left: 0;
  margin: 0;
}

.color-counts li {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
}

.color-counts span {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  display: inline-block;
  margin-right: 10px;
}

.cause-card {
  border: none;
  padding: 10px;
  margin-bottom: 10px;
  border-radius: 8px;
  background-color: #fdfdfd;
  box-shadow: inset 0 0 0 1px #e0e0e0;
}

.cause-card ul {
  padding-left: 15px;
  margin: 0;
}

.causes-box {
  border: 1px solid #bbb;
  border-radius: 10px;
  padding: 20px;
  margin-bottom: 30px;
  background-color: #fdfdfd;
  box-shadow: none;
}

.edit-description-container {
  background-color: #fff;
  border: none;
  padding: 20px;
  border-radius: 10px;
}

.edit-description-container h5 {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 12px;
  text-decoration: underline;
}

.info-box {
  border: 1px solid #ccc;
  border-radius: 10px;
  padding: 16px;
  background-color: #f9f9f9;
  margin-top: 16px;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
  width: 100%;
  max-width: 600px;
  margin: 0 auto;
}

.info-box h5 {
  margin-top: 0;
  color: #333;
  text-align: center;
  font-weight: bold;
}

.info-row {
  margin-bottom: 8px;
}

.signature {
  margin-top: 20px;
}
  /* Remove height limits for printing */
.causes-wrapper {
  max-height: none !important;
  overflow: visible !important;
}


.note {
  font-size: 12px;
  color: #777;
  font-style: italic;
  text-align: center;
  margin-top: 30px;
}
            </style>
          </head>
          <body>
            <div class="report-section">
              ${printContent.innerHTML}
            </div>
          </body>
        </html>
      `);
  
      printWindow.document.close();
  
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

  fetchExcelRecord(rahId: string, name: string, percentage: number, cause: string) {
    this.pendingRequests++;
  
    this.excelService.searchRahId(rahId).subscribe(
      (description: string | null) => {
        console.log("🚀 Fetched Description:", description);
  
        const sortedColors = Object.entries(this.colorCounts)
          .sort((a, b) => b[1] - a[1])
          .map(entry => entry[0]);
  
        const dominantColor = sortedColors[0] || '';
        const secondDominantColor = sortedColors[1] || '';
  
        const getCausesForColor = (color: string): string[] => {
          return Object.entries(this.causeCodes)
            .filter(([cause, items]) => items.some(item => item.color === color))
            .map(([cause]) => cause);
        };
  
        const dominantCauses = getCausesForColor(dominantColor);
        const secondDominantCauses = getCausesForColor(secondDominantColor);
  
        let imbalanceLevel = '';
        let percentageRange = '';
        if (percentage >= 90) {
          imbalanceLevel = 'VERY HIGH';
          percentageRange = '90% - 100%';
        } else if (percentage >= 75) {
          imbalanceLevel = 'HIGH';
          percentageRange = '75% - 89%';
        } else {
          this.pendingRequests--;
          return; // Skip if outside required range
        }
  
        const levelKey = percentageRange;
  
        if (!this.levelGroups[levelKey]) {
          this.levelGroups[levelKey] = [];
        }
  
        const entry =
          `𝗖𝗔𝗨𝗦𝗘: ${cause.toUpperCase()}\n` + // Display cause
          `𝗡𝗔𝗠𝗘: ${name.toUpperCase()}\n` +   // Display name
          `𝗟𝗘𝗩𝗘𝗟: ${imbalanceLevel} (${percentageRange})\n` +
          `Description: ${description}\n=========================\n\n`;
  
        this.levelGroups[levelKey].push(entry);
  
        this.pendingRequests--;
  
        if (this.pendingRequests === 0) {
          this.assembleFullDescription(dominantColor, dominantCauses, secondDominantColor, secondDominantCauses);
        }
      },
      (error: any) => {
        console.error("❌ Error fetching record:", error);
        this.pendingRequests--;
  
        if (this.pendingRequests === 0) {
          this.assembleFullDescription('', [], '', []);
        }
      }
    );
  }
  toUnicodeBold(text: string): string {
    const offsetMap: { [key: string]: number } = {
      'lower': 0x1D41A - 'a'.charCodeAt(0), // a-z
      'upper': 0x1D400 - 'A'.charCodeAt(0), // A-Z
      'digit': 0x1D7CE - '0'.charCodeAt(0)  // 0-9
    };
  
    return text.split('').map(char => {
      const code = char.charCodeAt(0);
      if (char >= 'a' && char <= 'z') {
        return String.fromCodePoint(code + offsetMap['lower']);
      } else if (char >= 'A' && char <= 'Z') {
        return String.fromCodePoint(code + offsetMap['upper']);
      } else if (char >= '0' && char <= '9') {
        return String.fromCodePoint(code + offsetMap['digit']);
      } else {
        return char; // keep punctuation and spaces as is
      }
    }).join('');
  }
  
  
  
  
  assembleFullDescription(
    dominantColor: string,
    dominantCauses: string[],
    secondDominantColor: string,
    secondDominantCauses: string[]
  ) {
    let finalDescription = '';
    let veryHighIntroAdded = false;
    let highIntroAdded = false;
  
    const levelsOrder = ["90% - 100%", "75% - 89%"];
  
    for (const level of levelsOrder) {
      const entries = this.levelGroups[level];
      if (entries && entries.length > 0) {
        if (level === "90% - 100%" && !veryHighIntroAdded) {
          finalDescription += `The detailed scan shows 𝗩𝗘𝗥𝗬 𝗵𝗶𝗴𝗵 𝗲𝗻𝗲𝗿𝗴𝗲𝘁𝗶𝗰 𝗶𝗺𝗯𝗮𝗹𝗮𝗻𝗰𝗲𝘀 90%-100% in:\n\n\n`;
          veryHighIntroAdded = true;
        } else if (level === "75% - 89%" && !highIntroAdded) {
          finalDescription += `\n----------------------------------------\n\n`;
          finalDescription += `The detailed scan shows 𝗵𝗶𝗴𝗵 𝗲𝗻𝗲𝗿𝗴𝗲𝘁𝗶𝗰 𝗶𝗺𝗯𝗮𝗹𝗮𝗻𝗰𝗲𝘀 89% -75% in:\n\n\n`;
          highIntroAdded = true;
        }
  
        entries.forEach(entry => {
          const lines = entry.split('\n');
          const causeLine = lines.find(line => line.startsWith('𝗖𝗔𝗨𝗦𝗘:')) || '';
          const nameLine = lines.find(line => line.startsWith('𝗡𝗔𝗠𝗘:')) || '';
          const startIndex = lines.findIndex(line => line.trim().startsWith('Description:'));
          let descriptionBlock = '';
          
          if (startIndex !== -1) {
            for (let i = startIndex; i < lines.length; i++) {
              if (lines[i].trim().startsWith('Recommendation:') || lines[i].includes('====')) break;
              descriptionBlock += lines[i] + '\n';
            }
          }
          
  
          const name = nameLine.replace('𝗡𝗔𝗠𝗘:', '').trim();
          const cause = causeLine.replace('𝗖𝗔𝗨𝗦𝗘:', '').trim();
  
          const formattedName = name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
          const formattedCause = cause.toLowerCase();
  
          if (level === "90% - 100%") {
            const rawName = nameLine.replace('𝗡𝗔𝗠𝗘:', '').trim();
            const boldName = this.toUnicodeBold(rawName);
            finalDescription += `${boldName} (${causeLine.replace('𝗖𝗔𝗨𝗦𝗘:', '').trim().toLowerCase()})\n\n${descriptionBlock}\n`;
            finalDescription += `\n----------------------------------------\n\n`;

          } else {
            finalDescription += `${formattedName} (${formattedCause})\n`;
          }
       
        });
      }
    }
  
    if (this.selectedExcelRecord) {
      this.selectedExcelRecord.fullDescription = finalDescription;
    } else {
      this.selectedExcelRecord = {
        rahId: '',
        name: '',
        description: '',
        fullDescription: finalDescription
      };
    }
  
    this.cdRef.detectChanges();
  }
  
  
  
  showModal = false;
  modalCauseName = '';
  modalDescription = '';
  modalImageUrl?: string;
  
  fetchExcelRecordPopup(rahId: string, name: string) {
    console.log("yes" + rahId);
    this.excelService.searchRahIdandImage(rahId).subscribe(
      (record: any) => {
        console.log(record);
        if (record && record.description) {
          this.modalCauseName = name.toUpperCase();
          this.modalDescription = record.description;
          // Only set modalImageUrl if image is not null or empty
          if (record.image) {
            this.modalImageUrl = record.image;
          } else {
            this.modalImageUrl = ''; // or '' to clear previous image
          }
          this.showModal = true;
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