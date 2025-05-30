import { Injectable } from '@angular/core';
import * as XLSX from 'xlsx';

export interface CombinationResult {
  combination: string;
  indication: string;
}

@Injectable({
  providedIn: 'root',
})
export class CombinationThreeService {
  private combinationData: any[] = [];

  constructor() {
    this.loadCombinationExcel();
  }

  private loadCombinationExcel(): void {
    const filePath = 'assets/comb.xlsx';

    fetch(filePath)
      .then((response) => response.arrayBuffer())
      .then((data) => {
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        this.combinationData = XLSX.utils.sheet_to_json(sheet);
      })
      .catch((error) =>
        console.error('Error loading combination Excel file:', error)
      );
  }

  getCombinationAndIndication(
    rahId1: string,
    rahId2: string,
    rahId3: string
  ): CombinationResult | null {
    if (!this.combinationData || this.combinationData.length === 0) {
      console.warn('Combination data not loaded yet.');
      return null;
    }

    const inputIds = [rahId1, rahId2, rahId3].sort();

    const match = this.combinationData.find((row) => {
      const idsText = row['RAH IDs'] || '';
      const matchRegex = /\('(\d+\.\d+)',\s*'(\d+\.\d+)',\s*'(\d+\.\d+)'\)/;
      const match = idsText.match(matchRegex);

      if (match) {
        const ids = [match[1], match[2], match[3]].sort();

        return (
          ids.length === inputIds.length &&
          ids.every((val, i) => val === inputIds[i])
        );
      }
      return false;
    });

    if (match) {
      return {
        combination: match['combination'] || '',
        indication: match['indication'] || '',
      };
    }
    return null;
  }
}
