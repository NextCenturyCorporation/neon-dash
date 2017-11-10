/*
 * Copyright 2016 Next Century Corporation
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
import { AfterViewInit, Component, Inject, OnInit, OnDestroy, QueryList, ViewChild, ViewChildren, ViewContainerRef } from '@angular/core';

import { DashboardOptionsComponent } from './components/dashboard-options/dashboard-options.component';
import { Dataset } from './dataset';

import { NeonGTDConfig } from './neon-gtd-config';
import { MatDialog, MatDialogConfig, MatDialogRef, MatSnackBar, MatToolbar } from '@angular/material';
import { ActiveGridService } from './services/active-grid.service';
import { DatasetService } from './services/dataset.service';
import { ThemesService } from './services/themes.service';
import { NgGrid, NgGridConfig } from 'angular2-grid';
import { NeonGridItem } from './neon-grid-item';
import { VisualizationContainerComponent } from './components/visualization-container/visualization-container.component';
import { AddVisualizationComponent } from './components/add-visualization/add-visualization.component';
import { FilterTrayComponent } from './components/filter-tray/filter-tray.component';
import { SnackBarComponent } from './components/snack-bar/snack-bar.component';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: [
        '../../node_modules/angular2-grid/NgGrid.css',
        './app.component.scss'
    ]
})
export class AppComponent implements AfterViewInit, OnInit, OnDestroy {
    @ViewChild(DashboardOptionsComponent) dashboardOptionsComponent: DashboardOptionsComponent;
    @ViewChild(NgGrid) grid: NgGrid;
    @ViewChildren(VisualizationContainerComponent) visualizations: QueryList<VisualizationContainerComponent>;

    // Used to determine which pane is show in the right sidenav
    public showAbout: boolean = true;
    public showAddVisualizationButton: boolean = false;
    public showFilterTrayButton: boolean = false;

    public gridItems: NeonGridItem[] = [];

    public datasets: Dataset[] = [];

    public gridConfig: NgGridConfig = {
        resizable: true,
        margins: [0, 0, 10, 10],
        min_cols: 1,
        max_cols: 24,
        min_rows: 0,
        max_rows: 0,
        min_width: 50,
        min_height: 50,
        maintain_ratio: true,
        auto_style: true,
        auto_resize: true,
        cascade: 'up',
        fix_to_grid: true
    };

    /* A reference to the dialog for adding visualizations. */
    private addVisDialogRef: MatDialogRef<AddVisualizationComponent>;

    /* A reference to the dialog for the filter tray. */
    private filterTrayDialogRef: MatDialogRef<FilterTrayComponent>;

    constructor(public datasetService: DatasetService, public themesService: ThemesService,
        private activeGridService: ActiveGridService, public dialog: MatDialog,
        public viewContainerRef: ViewContainerRef, @Inject('config') private neonConfig: NeonGTDConfig, public snackBar: MatSnackBar) {
        // TODO: Default to false and set to true only after a dataset has been selected.
        this.showAddVisualizationButton = true;
        this.showFilterTrayButton = true;
        this.datasets = this.datasetService.getDatasets();
        this.themesService = themesService;
        this.neonConfig = neonConfig;
        this.snackBar = snackBar;

        if (neonConfig.errors && neonConfig.errors.length > 0) {
            let snackBarRef: any = this.snackBar.openFromComponent(SnackBarComponent, {
                viewContainerRef: this.viewContainerRef
            });
            snackBarRef.instance.snackBarRef = snackBarRef;
            snackBarRef.instance.addErrors('Configuration Errors', neonConfig.errors);
        }
    }

    gridItemsToString(): string {
        return JSON.stringify(this.gridItems);
    }

    getDatasets(): Dataset[] {
        return this.datasets;
    }

    openAddVisualizationDialog() {
        let config = new MatDialogConfig();
        config.viewContainerRef = this.viewContainerRef;

        this.addVisDialogRef = this.dialog.open(AddVisualizationComponent, config);
        this.addVisDialogRef.afterClosed().subscribe(() => {
            this.addVisDialogRef = null;
        });
    }

    openFilterTrayDialog() {
        let config = new MatDialogConfig();
        config.viewContainerRef = this.viewContainerRef;

        this.filterTrayDialogRef = this.dialog.open(FilterTrayComponent, config);
        this.filterTrayDialogRef.afterClosed().subscribe(() => {
            this.filterTrayDialogRef = null;
        });
    }

    onResizeStop(i, event) {
        this.visualizations.toArray()[i].onResizeStop();
    }

    ngAfterViewInit() {
        // child is set
    }

    ngOnInit(): void {
        this.gridItems = this.activeGridService.getGridItems();
        this.activeGridService.setGrid(this.grid);
        this.activeGridService.setGridConfig(this.gridConfig);
    }

    ngOnDestroy(): void {
        // Do nothing.
    }

    toggleDashboardOptions() {
        if (this.dashboardOptionsComponent) {
            this.dashboardOptionsComponent.loadStateNames();
        }
        this.showAbout = false;
    }
}
