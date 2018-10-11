/*
 * Copyright 2017 Next Century Corporation
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 */
import { Component, Input, OnInit } from '@angular/core';
import { MatDialogRef, MatSnackBar } from '@angular/material';

import { ActiveGridService } from '../../services/active-grid.service';
import { ThemesService } from '../../services/themes.service';
import { neonVisualizations } from '../../neon-namespaces';

@Component({
  selector: 'app-add-visualization-dialog',
  templateUrl: './add-visualization.component.html',
  styleUrls: ['./add-visualization.component.scss']
})
export class AddVisualizationComponent implements OnInit {

    public visualizations: any[];
    public selectedIndex: number = -1;

    constructor(private activeGridService: ActiveGridService, public themesService: ThemesService,
        public dialogRef: MatDialogRef<AddVisualizationComponent>, public snackBar: MatSnackBar) {
        this.themesService = themesService;
    }

    ngOnInit() {
        // Ignore the sample visualization.
        this.visualizations = neonVisualizations.filter((visualization) => {
            return visualization.type !== 'sample';
        });
    }

    public onItemSelected(shiftKey: boolean, index: number) {
        if (this.selectedIndex !== -1) {
            this.visualizations[this.selectedIndex].selected = false;
        }
        this.visualizations[index].selected = true;
        this.selectedIndex = index;

        this.activeGridService.addItemInFirstFit(this.visualizations[index]);

        if (!shiftKey) {
            this.dialogRef.close();
        }

         this.snackBar.open('Visualization Added', 'x', {
            duration: 5000,
            verticalPosition: 'top',
            panelClass: ['simpleSnackBar']
         });
    }
}
