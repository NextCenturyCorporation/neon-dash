import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NeonToolsComponent } from './neon-tools.component';

@NgModule({
  declarations: [NeonToolsComponent],
  imports: [
    CommonModule
  ],
  exports: [NeonToolsComponent]
})
export class NeonToolsModule { }
