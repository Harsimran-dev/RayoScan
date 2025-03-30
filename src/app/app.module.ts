import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations'; // Required for Angular Material
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';

// Angular Material Modules
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialogModule } from '@angular/material/dialog'; // Import MatDialogModule

// Chart Module
import { NgChartsModule } from 'ng2-charts';

// Components
import { WordReaderComponent } from './components/word-reader/word-reader/word-reader.component';
import { CauseDialogComponent } from './components/cause-dialog/cause-dialog.component';
import { RayoScanComponent } from './components/rayo-scan/rayo-scan.component';
import { LineChartComponent } from './components/line-chart/line-chart.component';


@NgModule({
  declarations: [
    AppComponent,
    WordReaderComponent,
    CauseDialogComponent,
    RayoScanComponent,
    LineChartComponent
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule, // Required for Angular Material
    AppRoutingModule,
    MatButtonModule,
    MatCardModule,

    MatDialogModule, // Add MatDialogModule here
    NgChartsModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
