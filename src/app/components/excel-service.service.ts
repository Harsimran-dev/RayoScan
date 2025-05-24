import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import * as XLSX from 'xlsx';

interface RahRecord {
  description: string | null;
  image: string | null;
  recommendation?: string | null;
}

@Injectable({
  providedIn: 'root',
})
export class ExcelServiceService {
  private excelData: any[] = [];

  constructor() {
    this.loadExcelData();
  }

  // Load Excel file from assets folder
  private loadExcelData() {
    const filePath = 'assets/RAH List.xlsx';

    fetch(filePath)
      .then((response) => response.arrayBuffer())
      .then((data) => {
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        this.excelData = XLSX.utils.sheet_to_json(sheet);
      })
      .catch((error) => console.error('Error loading Excel file:', error));
  }

  // Search RAH ID and return description as an Observable
  searchRahId(rahId: string): Observable<string | null> {
    const record = this.excelData.find((row) => row['RAH ID'] === rahId);
    return of(record ? record['Description'] : null);
  }

   searchRahIdandImage(rahId: string): Observable<RahRecord | null> {
    const record = this.excelData.find((row) => row['RAH ID'] === rahId);

    if (record) {
      return of({
        description: record['Description'] || null,
        image: record['Image'] || null,  // Adjust this key based on your Excel column header
      });
    } else {
      return of(null);
    }
  }

  getRahDetails(rahId: string): Observable<RahRecord | null> {
    const record = this.excelData.find((row) => row['RAH ID'] === rahId);
  
    if (record) {
      return of({
        description: record['Description'] || null,
        image: record['Image'] || null,
        recommendation: record['Recommendation'] || null  // Adjust the key if your Excel column header differs
      });
    } else {
      return of(null);
    }
  }
  
}
