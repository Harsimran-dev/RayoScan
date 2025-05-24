import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations'; // Required for Angular Material
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';

// Angular Material Modules
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialogModule } from '@angular/material/dialog'; // Import MatDialogModule
import { MatFormFieldModule } from '@angular/material/form-field'; // Import MatFormFieldModule
import { MatInputModule } from '@angular/material/input'; // Import MatInputModule
import { NgxSignaturePadModule } from "@o.krucheniuk/ngx-signature-pad";
import { HttpClientModule } from '@angular/common/http';


// Chart Module
import { NgChartsModule } from 'ng2-charts';
import { FormsModule } from '@angular/forms'; 
import { ReactiveFormsModule } from '@angular/forms'; // ✅ Import this

// Components
import { WordReaderComponent } from './components/word-reader/word-reader/word-reader.component';
import { CauseDialogComponent } from './components/cause-dialog/cause-dialog.component';
import { RayoScanComponent } from './components/rayo-scan/rayo-scan.component';
import { LineChartComponent } from './components/line-chart/line-chart.component';
import { MatIconModule } from '@angular/material/icon';
import { MatExpansionModule } from '@angular/material/expansion';
import { DescriptionImageModalComponent } from './components/description-image-modal/description-image-modal.component';
import { RahSearchComponent } from './components/rah-search/rah-search.component';  // For accordion and expansion panel



@NgModule({
  declarations: [
    AppComponent,
    WordReaderComponent,
    CauseDialogComponent,
    RayoScanComponent,
    LineChartComponent,
    DescriptionImageModalComponent,
    RahSearchComponent
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule, // Required for Angular Material
    AppRoutingModule,
    MatButtonModule,
    HttpClientModule,
    MatCardModule,
    MatIconModule,
    MatExpansionModule,
    MatFormFieldModule,
    ReactiveFormsModule,
    NgxSignaturePadModule,
 
    MatInputModule,
    FormsModule,
    

    MatDialogModule, // Add MatDialogModule here
    NgChartsModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
