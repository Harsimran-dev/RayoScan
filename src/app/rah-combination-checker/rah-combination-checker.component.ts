import { Component } from '@angular/core';
import { CombinationResult, CombinationService } from '../combination-service.service';
import { CombinationThreeService } from '../combination-three-s.service';
 // import new service

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

  // For 3 RAH IDs
  rahId3_1 = '';
  rahId3_2 = '';
  rahId3_3 = '';
  resultThree: CombinationResult | null = null;
  notFoundThree = false;

  constructor(
    private combinationService: CombinationService,
    private combinationThreeService: CombinationThreeService
  ) {}

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
      this.resultTwo = {
        combination: match.combination || '',
        indication: this.cleanIndication(match.indication || ''),
      };
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
      this.resultThree = {
        combination: match.combination || '',
        indication: this.cleanIndication(match.indication || ''),
      };
      this.notFoundThree = false;
    } else {
      this.resultThree = null;
      this.notFoundThree = true;
    }
  }

  cleanIndication(text: string): string {
    if (!text) return '';
    return text
      .replace(/\*\*/g, '') // remove **
      .replace(/^- /gm, '• ') // replace '- ' at line start with bullet
      .trim();
  }
}
