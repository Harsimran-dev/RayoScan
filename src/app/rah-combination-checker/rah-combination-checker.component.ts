import { Component } from '@angular/core';
import { CombinationResult, CombinationService } from '../combination-service.service';
import { CombinationThreeService } from '../combination-three-s.service';

@Component({
  selector: 'app-rah-combination-checker',
  templateUrl: './rah-combination-checker.component.html',
  styleUrls: ['./rah-combination-checker.component.scss']
})
export class RahCombinationCheckerComponent {
  // Patient Info
  patientName: string = '';
  dob: string = '';

  // For 2 RAH IDs
  rahId1 = '';
  rahId2 = '';
  resultTwo: CombinationResult | null = null;
  notFoundTwo = false;
  analysisTwo: string = '';
  potentialIndicationsTwo: string = '';
  recommendationTwo: string = '';
  potentialIndicationListTwo: string[] = [];
  firstName: string = '';
lastName: string = '';

get fullName(): string {
  return `${this.firstName} ${this.lastName}`.trim();
}



  // Track which 2 RAH checkboxes are checked
  selectedIndicationsTwo: string[] = [];

  // For 3 RAH IDs
  rahId3_1 = '';
  rahId3_2 = '';
  rahId3_3 = '';
  resultThree: CombinationResult | null = null;
  notFoundThree = false;
  analysisThree: string = '';
  potentialIndicationsThree: string = '';
  recommendationThree: string = '';
  potentialIndicationListThree: string[] = [];

  // Track which 3 RAH checkboxes are checked
  selectedIndicationsThree: string[] = [];

  constructor(
    private combinationService: CombinationService,
    private combinationThreeService: CombinationThreeService
  ) {}
generatedPIT: string = '';

generatePIT(): void {
  const randomSixDigit = Math.floor(Math.random() * 1_000_000); // 0 to 999999
  const paddedNumber = randomSixDigit.toString().padStart(6, '0'); // ensure 6 digits
  this.generatedPIT = `00${paddedNumber}`;
}


printPage(): void {
  if (!this.generatedPIT || this.generatedPIT.trim() === '') {
    alert('Please generate the PIT before printing.');
    return; // stop execution if PIT not generated
  }
  const printWindow = window.open('', '_blank');
  if (!printWindow) return;

  let html = `
    <html>
      <head>
       <title>${this.firstName}_${this.generatedPIT}</title>

        <style>
          body { font-family: Arial, sans-serif; padding: 20px; }
          h3 { margin-top: 30px; }
          .section { margin-bottom: 20px; }
          ul { list-style-type: disc; padding-left: 20px; }
        </style>
      </head>
      <body>
        <h2>RAH Combination Report</h2>
        <p><strong>PIT Number:</strong> ${this.generatedPIT}</p>
        <p><strong>Patient:</strong> ${this.firstName}${this.lastName}</p>
        <p><strong>Date of Birth:</strong> ${this.dob}</p>
  `;

  // 2 RAH Section
  if (this.resultTwo) {
    html += `
      <div class="section">
        <h3>2 RAH Combination: ${this.resultTwo.combination}</h3>
        <h4>Analysis</h4>
        <p>${this.analysisTwo}</p>

        <h4>Potential Indications</h4>
        <ul>
          ${this.selectedIndicationsTwo.map(line => `<li>${line}</li>`).join('')}
        </ul>

        <h4>Recommendations for Rebalancing</h4>
        <p>${this.recommendationTwo}</p>
      </div>
    `;
  }

  // 3 RAH Section
  if (this.resultThree) {
    html += `
      <div class="section">
        <h3>3 RAH Combination: ${this.resultThree.combination}</h3>
        <h4>Analysis</h4>
        <p>${this.analysisThree}</p>

        <h4>Potential Indications</h4>
        <ul>
          ${this.selectedIndicationsThree.map(line => `<li>${line}</li>`).join('')}
        </ul>

        <h4>Recommendations for Rebalancing</h4>
        <p>${this.recommendationThree}</p>
      </div>
    `;
  }

  html += `
      </body>
    </html>
  `;

  printWindow.document.write(html);
  printWindow.document.close();
  printWindow.print();
}


  checkCombinationTwo(): void {
    const trimmedId1 = this.rahId1.trim();
    const trimmedId2 = this.rahId2.trim();

    if (!trimmedId1 || !trimmedId2) {
      this.resultTwo = null;
      this.notFoundTwo = true;
      return;
    }

    const match = this.combinationService.getCombinationAndIndication(trimmedId1, trimmedId2);

    if (match) {
      const cleaned = this.cleanIndication(match.indication || '');
      this.resultTwo = {
        combination: match.combination || '',
        indication: cleaned,
      };

      this.analysisTwo = this.extractBeforeTwo(cleaned);
      this.potentialIndicationsTwo = this.extractBetweenTwo(cleaned);
      this.recommendationTwo = this.extractAfterTwo(cleaned);
      this.potentialIndicationListTwo = this.splitToLines(this.potentialIndicationsTwo);

      this.notFoundTwo = false;

      // Reset selected checkboxes on new result
      this.selectedIndicationsTwo = [];
    } else {
      this.resultTwo = null;
      this.notFoundTwo = true;
    }
  }

  checkCombinationThree(): void {
    const id1 = this.rahId3_1.trim();
    const id2 = this.rahId3_2.trim();
    const id3 = this.rahId3_3.trim();

    if (!id1 || !id2 || !id3) {
      this.resultThree = null;
      this.notFoundThree = true;
      return;
    }

    const match = this.combinationThreeService.getCombinationAndIndication(id1, id2, id3);

    if (match) {
      const cleaned = this.cleanIndication(match.indication || '');
      this.resultThree = {
        combination: match.combination || '',
        indication: cleaned,
      };

      this.analysisThree = this.extractBeforeThree(cleaned);
      this.potentialIndicationsThree = this.extractBetweenThree(cleaned);
      this.recommendationThree = this.extractAfterThree(cleaned);
      this.potentialIndicationListThree = this.splitToLines(this.potentialIndicationsThree);

      this.notFoundThree = false;

      // Reset selected checkboxes on new result
      this.selectedIndicationsThree = [];
    } else {
      this.resultThree = null;
      this.notFoundThree = true;
    }
  }

  cleanIndication(text: string): string {
    if (!text) return '';
    return text
      .replace(/\*\*/g, '')
      .replace(/^- /gm, '- ')
      .trim();
  }

  splitToLines(text: string): string[] {
    return text
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0);
  }

  findFirstIndex(text: string, headers: string[]): number {
    const lowerText = text.toLowerCase();
    let minIndex = -1;
    for (const header of headers) {
      const idx = lowerText.indexOf(header.toLowerCase());
      if (idx !== -1 && (minIndex === -1 || idx < minIndex)) {
        minIndex = idx;
      }
    }
    return minIndex;
  }

  extractBeforeTwo(text: string): string {
    const headers = ['potential indications', 'possible indications'];
    const idx = this.findFirstIndex(text, headers);
    return idx !== -1 ? text.slice(0, idx).trim() : text.trim();
  }

  extractBetweenTwo(text: string): string {
    const startHeaders = ['potential indications', 'possible indications'];
    const endHeaders = ['recommendation for rebalancing', 'recommendations for rebalancing'];

    const startIndex = this.findFirstIndex(text, startHeaders);
    const endIndex = this.findFirstIndex(text, endHeaders);

    if (startIndex !== -1 && endIndex !== -1 && startIndex < endIndex) {
      const lowerText = text.toLowerCase();
      const matchedStart = startHeaders.find(h => lowerText.indexOf(h) === startIndex)!;
      return text.slice(startIndex + matchedStart.length, endIndex).trim();
    }

    return '';
  }

  extractAfterTwo(text: string): string {
    const recHeaders = ['recommendation for rebalancing', 'recommendations for rebalancing'];
    const index = this.findFirstIndex(text, recHeaders);

    if (index !== -1) {
      const lowerText = text.toLowerCase();
      const matchedRec = recHeaders.find(h => lowerText.indexOf(h) === index)!;
      return text.slice(index + matchedRec.length).trim();
    }
    return '';
  }

  extractBeforeThree(text: string): string {
    const index = text.toLowerCase().indexOf('potential indications');
    return index !== -1 ? text.slice(0, index).trim() : text;
  }

  extractBetweenThree(text: string): string {
    const lower = text.toLowerCase();
    const start = 'potential indications';
    const end = 'recommendation';
    const startIndex = lower.indexOf(start);
    const endIndex = lower.indexOf(end);

    if (startIndex !== -1 && endIndex !== -1 && startIndex < endIndex) {
      return text.slice(startIndex + start.length, endIndex).trim();
    }
    return '';
  }

  extractAfterThree(text: string): string {
    const index = text.toLowerCase().indexOf('recommendation');
    return index !== -1 ? text.slice(index + 'recommendation'.length).trim() : '';
  }

  // Called when a 2 RAH checkbox changes
  onCheckboxChangeTwo(line: string, event: Event): void {
    const input = event.target as HTMLInputElement;
    const value = line.substring(2).trim();

    if (input.checked) {
      if (!this.selectedIndicationsTwo.includes(value)) {
        this.selectedIndicationsTwo.push(value);
      }
    } else {
      this.selectedIndicationsTwo = this.selectedIndicationsTwo.filter(i => i !== value);
    }
  }

  // Called when a 3 RAH checkbox changes
  onCheckboxChangeThree(line: string, event: Event): void {
    const input = event.target as HTMLInputElement;
    const value = line.substring(2).trim();

    if (input.checked) {
      if (!this.selectedIndicationsThree.includes(value)) {
        this.selectedIndicationsThree.push(value);
      }
    } else {
      this.selectedIndicationsThree = this.selectedIndicationsThree.filter(i => i !== value);
    }
  }

  formatNames(names: string): string {
    if (!names) return '';
    let trimmed = names.trim();
    if (trimmed.startsWith('(') && trimmed.endsWith(')')) {
      trimmed = trimmed.slice(1, -1);
    }
    const parts = trimmed.split(/',\s*/);
    for (let i = 0; i < parts.length - 1; i++) {
      parts[i] = parts[i] + "'";
    }
    if (!parts[0].startsWith("'")) {
      parts[0] = "'" + parts[0];
    }
    return parts.join(",<br>");
  }
}
