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
import {
    AfterViewInit,
    Component,
    Inject,
    OnInit,
    Input,
    OnDestroy,
    QueryList,
    ViewChild,
    ViewChildren,
    ViewContainerRef
} from '@angular/core';

import * as L from 'leaflet'; // imported for use of DomUtil.enable/disableTextSelection
import { ActiveGridService } from './services/active-grid.service';
import { AddVisualizationComponent } from './components/add-visualization/add-visualization.component';
import { CustomConnectionComponent } from './components/custom-connection/custom-connection.component';
import { DashboardOptionsComponent } from './components/dashboard-options/dashboard-options.component';
import { Dataset } from './dataset';
import { DatasetService } from './services/dataset.service';
import { DomSanitizer } from '@angular/platform-browser';
import { FilterService } from '../app/services/filter.service';
import { FilterTrayComponent } from './components/filter-tray/filter-tray.component';
import { MatDialog, MatDialogConfig, MatDialogRef, MatSnackBar, MatToolbar, MatSidenav } from '@angular/material';
import { MatIconRegistry } from '@angular/material/icon';
import { NeonGridItem } from './neon-grid-item';
import { NeonGTDConfig } from './neon-gtd-config';
import { NgGrid, NgGridConfig } from 'angular2-grid';
import { SnackBarComponent } from './components/snack-bar/snack-bar.component';
import { ThemesService } from './services/themes.service';
import { VisualizationContainerComponent } from './components/visualization-container/visualization-container.component';

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

    @Input() sidenav = MatSidenav;
    // Used to determine which pane is show in the right sidenav

    public showAbout: boolean = true;
    public showAddVisualizationButton: boolean = false;
    public showFilterTrayButton: boolean = false;
    public showCustomConnectionButton: boolean = false;
    public showFilterBuilder: boolean = false;
    public createFilterBuilder: boolean = false; //This is used to create the Filter Builder later

    public gridItems: NeonGridItem[] = [];

    public datasets: Dataset[] = [];

    public gridConfig: NgGridConfig = {
        resizable: true,
        margins: [5, 5, 5, 5],
        min_cols: 1,
        max_cols: 12,
        min_rows: 0,
        max_rows: 0,
        min_width: 50,
        min_height: 50,
        row_height: 54,
        maintain_ratio: false, //NOTE!!!!! I changed this to false because it messes with the row height when it is true
        auto_style: true,
        auto_resize: true,
        cascade: 'up',
        fix_to_grid: true,
        limit_to_screen: true,
        resize_directions: ['bottomright', 'bottomleft', 'right', 'left', 'bottom']
    };

    public projectTitle: string = 'Neon';
    public projectIcon: string = 'assets/favicon.blue.ico?v=1';

    /* A reference to the dialog for adding visualizations. */
    private addVisDialogRef: MatDialogRef<AddVisualizationComponent>;

    /* A reference to the dialog for the filter tray. */
    private filterTrayDialogRef: MatDialogRef<FilterTrayComponent>;

    /* A reference to the dialog for the custom connection dialog. */
    private customConnectionDialogRef: MatDialogRef<CustomConnectionComponent>;

    public filterBuilderIcon;

    constructor(
        private activeGridService: ActiveGridService,
        public datasetService: DatasetService,
        public dialog: MatDialog,
        private domSanitizer: DomSanitizer,
        public filterService: FilterService,
        private matIconRegistry: MatIconRegistry,
        public snackBar: MatSnackBar,
        public themesService: ThemesService,
        public viewContainerRef: ViewContainerRef,
        @Inject('config') private neonConfig: NeonGTDConfig
    ) {
        // TODO: Default to false and set to true only after a dataset has been selected.
        this.showAddVisualizationButton = true;
        this.showFilterTrayButton = true;
        this.showCustomConnectionButton = true;
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

        if (this.datasets && this.datasets.length > 0) {
            this.projectTitle = this.datasets[0].title ? this.datasets[0].title : this.projectTitle;
            this.projectIcon = this.datasets[0].icon ? this.datasets[0].icon : this.projectIcon;
        }

        this.matIconRegistry.addSvgIcon(
            'filter_builder',
            this.domSanitizer.bypassSecurityTrustResourceUrl('../assets/icons/filter_builder.svg')
        );

        this.matIconRegistry.addSvgIcon(
            'filter_builder_active',
            this.domSanitizer.bypassSecurityTrustResourceUrl('../assets/icons/filter_builder_active.svg')
        );

        this.changeFavicon();
        this.filterBuilderIcon = 'filter_builder';

    }

    changeFavicon() {
        let favicon = document.createElement('link'),
            faviconShortcut = document.createElement('link'),
            title = document.createElement('title'),
            head = document.querySelector('head');

        favicon.setAttribute('rel', 'icon');
        favicon.setAttribute('type', 'image/x-icon');
        favicon.setAttribute('href', this.projectIcon);

        faviconShortcut.setAttribute('rel', 'shortcut icon');
        faviconShortcut.setAttribute('type', 'image/x-icon');
        faviconShortcut.setAttribute('href', this.projectIcon);

        title.innerText = this.projectTitle;

        head.appendChild(favicon);
        head.appendChild(faviconShortcut);
        head.appendChild(title);
    }

    changeFilterBuilderIcon() {
        let filters = this.filterService.getFilters();
        if (filters.length > 0) {
            this.filterBuilderIcon = 'filter_builder_active';
        } else {
            this.filterBuilderIcon = 'filter_builder';
        }
        return true;
    }

    gridItemsToString(): string {
        return JSON.stringify(this.gridItems);
    }

    getDatasets(): Dataset[] {
        return this.datasets;
    }

    ngAfterViewInit() {
        // child is set
        /* NOTE:
         * There was an issue with Angular Material beta 12 and angular2-grid,
         * where the grid would initially be multiple times larger than the rest of the page
         * until the window has been resized.
         * To work around this, trigger a resize event in the grid on page load so that it measures
         * correctly
         */
        this.activeGridService.triggerResize();
    }

    ngOnDestroy(): void {
        // Do nothing.
    }

    ngOnInit(): void {
        this.gridItems = this.activeGridService.getGridItems();
        this.activeGridService.setGrid(this.grid);
        this.activeGridService.setGridConfig(this.gridConfig);
    }

    onDragStop(i, event) {
        this.showItemLocation(event);
    }

    onResizeStart(i, event) {
        this.visualizations.toArray()[i].onResizeStart();
    }

    onResizeStop(i, event) {
        this.showItemLocation(event);
        this.visualizations.toArray()[i].onResizeStop();
    }

    openAddVisualizationDialog() {
        let config = new MatDialogConfig();
        config.viewContainerRef = this.viewContainerRef;

        this.addVisDialogRef = this.dialog.open(AddVisualizationComponent, config);
        L.DomUtil.disableTextSelection();
        this.addVisDialogRef.afterClosed().subscribe(() => {
            this.addVisDialogRef = null;
            L.DomUtil.enableTextSelection();
        });
    }

    openCustomConnectionDialog() {
        let config = new MatDialogConfig();
        config.viewContainerRef = this.viewContainerRef;

        this.customConnectionDialogRef = this.dialog.open(CustomConnectionComponent, config);
        this.customConnectionDialogRef.afterClosed().subscribe(() => {
            this.filterTrayDialogRef = null;
        });
    }

    openFilterBuilderDialog() {
        //Added this to create the filter builder at first click so it's after dataset initialization
        if (!this.createFilterBuilder) {
            this.createFilterBuilder = true;
        }
        this.showFilterBuilder = !this.showFilterBuilder;
        let filterBuilderContainer: HTMLElement = document.getElementById('filter.builder');
        if (this.showFilterBuilder) {
            filterBuilderContainer.setAttribute('style', 'display: show');
        } else {
            filterBuilderContainer.setAttribute('style', 'display: none');
        }
    }

    openFilterTrayDialog() {
        let config = new MatDialogConfig();
        config.viewContainerRef = this.viewContainerRef;

        this.filterTrayDialogRef = this.dialog.open(FilterTrayComponent, config);
        this.filterTrayDialogRef.afterClosed().subscribe(() => {
            this.filterTrayDialogRef = null;
        });
    }

    showItemLocation(event) {
        /**
         * COMMENTED OUT!  If you are debugging, you can uncomment this, and see what is going on
         * as you move grid items.  It should not be in production code.
         * if (event == null) {
         *   return;
         * }
         * let str = `row: ${event.row} col: ${event.col} sizex: ${event.sizex} sizey: ${event.sizey}`;
         * console.log(str);
         */
    }

    toggleDashboardOptions() {
        if (this.dashboardOptionsComponent) {
            this.dashboardOptionsComponent.loadStateNames();
        }
        this.showAbout = false;
    }

}
