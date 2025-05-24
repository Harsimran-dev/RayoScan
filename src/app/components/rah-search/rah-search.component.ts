import { Component } from '@angular/core';
import { FormControl } from '@angular/forms';

import { debounceTime } from 'rxjs/operators';
import { ExcelServiceService } from '../excel-service.service';

@Component({
  selector: 'app-rah-search',
  templateUrl: './rah-search.component.html',
  styleUrls: ['./rah-search.component.scss']
})
export class RahSearchComponent {
  rahIdControl = new FormControl('');
  result: any = null;
  loading = false;

  constructor(private excelService: ExcelServiceService) {
    this.rahIdControl.valueChanges.pipe(debounceTime(300)).subscribe((rahId) => {
      if (rahId) this.searchRah(rahId);
    });
  }

  searchRah(rahId: string) {
    this.loading = true;
    this.excelService.getRahDetails(rahId.trim()).subscribe((data) => {
      this.result = data;
      this.loading = false;
    });
  }
}
