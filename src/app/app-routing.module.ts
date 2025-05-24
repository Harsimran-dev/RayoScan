import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { WordReaderComponent } from './components/word-reader/word-reader/word-reader.component';
import { CauseDialogComponent } from './components/cause-dialog/cause-dialog.component';
import { RayoScanComponent } from './components/rayo-scan/rayo-scan.component';
import { LineChartComponent } from './components/line-chart/line-chart.component';
import { RahSearchComponent } from './components/rah-search/rah-search.component';

const routes: Routes = [
  { path: 'word-reader', component: WordReaderComponent }, 
  { path: 'cause-dialog', component: CauseDialogComponent },
  { path: 'rayo-scan', component: RayoScanComponent },
  { path: 'line-chart', component: LineChartComponent },
  { path: 'search', component: RahSearchComponent },

  // Redirect to Word Reader as default route



];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
