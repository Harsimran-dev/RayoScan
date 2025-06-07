import { Component } from '@angular/core';
import { CombinationResult, CombinationService } from '../combination-service.service';
import { CombinationThreeService } from '../combination-three-s.service';

@Component({
  selector: 'app-rah-combination-checker',
  templateUrl: './rah-combination-checker.component.html',
  styleUrls: ['./rah-combination-checker.component.scss']
})
export class RahCombinationCheckerComponent {
  // For 2 RAH IDs
  rahId1 = '';
  rahId2 = '';
  resultTwo: CombinationResult | null = null;
  notFoundTwo = false;
  patientName: string = '';
  dob: string = '';
  analysisTwo: string = '';
  potentialIndicationsTwo: string = '';
  recommendationTwo: string = '';

  // For 3 RAH IDs
  rahId3_1 = '';
  rahId3_2 = '';
  rahId3_3 = '';
  resultThree: CombinationResult | null = null;
  notFoundThree = false;
  analysisThree: string = '';
  potentialIndicationsThree: string = '';
  recommendationThree: string = '';

  constructor(
    private combinationService: CombinationService,
    private combinationThreeService: CombinationThreeService
  ) {}

  printPage(): void {
    window.print();
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

      // Use 2-combination extractors
      this.analysisTwo = this.extractBeforeTwo(cleaned);
      this.potentialIndicationsTwo = this.extractBetweenTwo(cleaned);
      this.recommendationTwo = this.extractAfterTwo(cleaned);

      this.notFoundTwo = false;
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

      // Use 3-combination extractors
      this.analysisThree = this.extractBeforeThree(cleaned);
      this.potentialIndicationsThree = this.extractBetweenThree(cleaned);
      this.recommendationThree = this.extractAfterThree(cleaned);

      this.notFoundThree = false;
    } else {
      this.resultThree = null;
      this.notFoundThree = true;
    }
  }

  cleanIndication(text: string): string {
    if (!text) return '';
    return text
      .replace(/\*\*/g, '') // remove ** styling
      .replace(/^- /gm, '• ') // replace '- ' with bullet
      .trim();
  }


  // --- Extractors for 2-combination ---
// --- Extractors for 2-combination ---
// Utility to find first occurring index of any given keywords in text (case-insensitive)
// Utility to find the first occurrence of any header variant in text
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
    // Find matched header length to slice after header text
    const lowerText = text.toLowerCase();

    const matchedStart = startHeaders.find(h => lowerText.indexOf(h) === startIndex)!;
    return text.slice(startIndex + matchedStart.length).slice(0, endIndex - (startIndex + matchedStart.length)).trim();
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






  // --- Extractors for 3-combination ---
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
}
