import { BrowserModule } from '@angular/platform-browser';
import { NgModule, ApplicationRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { MdButtonModule } from '@angular2-material/button';
import { MdCardModule } from '@angular2-material/card';
import { MdCheckboxModule } from '@angular2-material/checkbox';
import { MdIconModule } from '@angular2-material/icon';
import { MdInputModule } from '@angular2-material/input';
import { MdListModule } from '@angular2-material/list';
import { MdMenuModule } from '@angular2-material/menu';
import { MdProgressCircleModule } from '@angular2-material/progress-circle';
import { MdRadioModule } from '@angular2-material/radio';
import { MdSidenavModule } from '@angular2-material/sidenav';
import { MdTabsModule } from '@angular2-material/tabs';
import { MdToolbarModule } from '@angular2-material/toolbar';

import { NeonGTDConfig } from './neon-gtd-config';
import { Dataset } from './dataset';
import { DatasetService } from './services/dataset.service';

import { NeonGTDComponent } from './neon-gtd.component';

@NgModule({
  declarations: [
    NeonGTDComponent
  ],
  imports: [
    BrowserModule,
    CommonModule,
    FormsModule,
    MdButtonModule,
    MdCardModule,
    MdCheckboxModule,
    MdIconModule,
    MdInputModule,
    MdListModule,
    MdMenuModule,
    MdProgressCircleModule,
    MdRadioModule,
    MdSidenavModule,
    MdTabsModule,
    MdToolbarModule,
    NeonGTDConfig,
    Dataset,
    DatasetService
  ],
  providers: [],
  entryComponents: [NeonGTDComponent],
  bootstrap: [NeonGTDComponent]
})
export class NeonGTDModule { }