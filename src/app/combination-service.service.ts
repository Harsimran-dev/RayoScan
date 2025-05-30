import { Injectable } from '@angular/core';
import * as XLSX from 'xlsx';

export interface CombinationResult {
  combination: string;
  indication: string;
}

@Injectable({
  providedIn: 'root',
})
export class CombinationService {
  private combinationData: any[] = [];

  constructor() {
    this.loadCombinationExcel();
  }

  private loadCombinationExcel(): void {
    const filePath = 'assets/comb2.xlsx'; // Update to your actual file path

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

  /**
   * Get combination and indication for a pair of RAH IDs (order-insensitive)
   */
getCombinationAndIndication(rahId1: string, rahId2: string): CombinationResult | null {
  if (!this.combinationData || this.combinationData.length === 0) {
    console.warn('Combination data not loaded yet.');
    return null;
  }

  console.log('Searching for:', rahId1, rahId2);
  console.log('Combination data sample:', this.combinationData.slice(0, 5)); // Log first few rows for debugging

  const match = this.combinationData.find((row, index) => {
    const idsText = row['RAH IDs'] || '';
    console.log(`Row ${index} RAH IDs raw:`, idsText);

    const matchRegex = /\('(\d+\.\d+)',\s*'(\d+\.\d+)'\)/;
    const match = idsText.match(matchRegex);

    if (match) {
      const [idA, idB] = [match[1], match[2]];
      console.log(`Parsed: [${idA}, ${idB}]`);

      return (
        (idA === rahId1 && idB === rahId2) ||
        (idA === rahId2 && idB === rahId1)
      );
    } else {
      console.warn(`No match regex found for row:`, idsText);
    }

    return false;
  });

 if (match) {
  console.log('Match found:', match);
  return {
    combination: match['combination'] || '',
    indication: match['indication'] || '',
  };
} else {
  console.warn('No matching RAH ID pair found.');
  return null;
}

}

}
