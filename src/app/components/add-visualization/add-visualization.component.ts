import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MaterialModule, MdDialogRef } from '@angular/material';

import { ActiveGridService } from '../../services/active-grid.service';
import { neonVisualizations } from '../../neon-namespaces';

@Component({
  selector: 'app-add-visualization-dialog',
  templateUrl: './add-visualization.component.html',
  styleUrls: ['./add-visualization.component.scss']
})
export class AddVisualizationComponent implements OnInit {

    private visualizations: any[];

    constructor(public dialogRef: MdDialogRef<AddVisualizationComponent>) { }

    ngOnInit() {
        this.visualizations = neonVisualizations;
    }

}
