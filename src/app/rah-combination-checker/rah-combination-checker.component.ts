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

      this.analysisTwo = this.extractBeforeTwo(cleaned);
      this.potentialIndicationsTwo = this.extractBetweenTwo(cleaned);
      this.recommendationTwo = this.extractAfterTwo(cleaned);
      this.potentialIndicationListTwo = this.splitToLines(this.potentialIndicationsTwo);

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

      this.analysisThree = this.extractBeforeThree(cleaned);
      this.potentialIndicationsThree = this.extractBetweenThree(cleaned);
      this.recommendationThree = this.extractAfterThree(cleaned);
      this.potentialIndicationListThree = this.splitToLines(this.potentialIndicationsThree);

      this.notFoundThree = false;
    } else {
      this.resultThree = null;
      this.notFoundThree = true;
    }
  }

  cleanIndication(text: string): string {
    if (!text) return '';
    return text
      .replace(/\*\*/g, '')
      .replace(/^- /gm, '- ') // ensure bullet points are consistent
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
