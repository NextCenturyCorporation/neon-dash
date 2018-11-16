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

import * as _ from 'lodash';
import * as neon from 'neon-framework';
import * as L from 'leaflet'; // imported for use of DomUtil.enable/disableTextSelection
import * as uuid from 'node-uuid';

import { AbstractWidgetService } from './services/abstract.widget.service';
import { AddVisualizationComponent } from './components/add-visualization/add-visualization.component';
import { BaseNeonComponent } from './components/base-neon-component/base-neon.component';
import { BaseLayeredNeonComponent } from './components/base-neon-component/base-layered-neon.component';
import { CustomConnectionComponent } from './components/custom-connection/custom-connection.component';
import { Dataset } from './dataset';
import { DatasetService } from './services/dataset.service';
import { DomSanitizer } from '@angular/platform-browser';
import { FilterService } from '../app/services/filter.service';
import { FilterTrayComponent } from './components/filter-tray/filter-tray.component';
import { MatDialog, MatDialogConfig, MatDialogRef, MatSnackBar, MatToolbar, MatSidenav, MatMenuTrigger } from '@angular/material';
import { MatIconRegistry } from '@angular/material/icon';
import { NeonGridItem } from './neon-grid-item';
import { NeonGTDConfig } from './neon-gtd-config';
import { neonEvents } from './neon-namespaces';
import { NgGrid, NgGridConfig } from 'angular2-grid';
import { SaveStateComponent } from './components/save-state/save-state.component';
import { SnackBarComponent } from './components/snack-bar/snack-bar.component';
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
    private static DEFAULT_SIZEX = 4;
    private static DEFAULT_SIZEY = 4;

    @ViewChild(NgGrid) grid: NgGrid;
    @ViewChildren(VisualizationContainerComponent) visualizations: QueryList<VisualizationContainerComponent>;

    @Input() sidenav = MatSidenav;
    // Used to determine which pane is show in the right sidenav

    public currentPanel: string = 'dashboardLayouts';
    public showCustomConnectionButton: boolean = false;
    public showFilterBuilder: boolean = false;
    public showFilterTrayButton: boolean = false;
    //Toolbar
    public showSimpleSearch: boolean = false;
    public showVisShortcut: boolean = true;

    public rightPanelTitle: string = 'Dashboard Layouts';

    public createFilterBuilder: boolean = false; //This is used to create the Filter Builder later

    public widgetGridItems: NeonGridItem[] = [];
    public widgets: Map<string, BaseNeonComponent | BaseLayeredNeonComponent> = new Map();

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

    private messenger: neon.eventing.Messenger;

    constructor(
        public datasetService: DatasetService,
        public dialog: MatDialog,
        private domSanitizer: DomSanitizer,
        public filterService: FilterService,
        private matIconRegistry: MatIconRegistry,
        public snackBar: MatSnackBar,
        public widgetService: AbstractWidgetService,
        public viewContainerRef: ViewContainerRef,
        @Inject('config') private neonConfig: NeonGTDConfig
    ) {
        this.messenger = new neon.eventing.Messenger();

        // TODO: Default to false and set to true only after a dataset has been selected.
        this.showFilterTrayButton = true;
        this.showCustomConnectionButton = true;
        this.datasets = this.datasetService.getDatasets();

        if (neonConfig.errors && neonConfig.errors.length > 0) {
            let snackBarRef: any = this.snackBar.openFromComponent(SnackBarComponent, {
                panelClass: this.widgetService.getTheme(),
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

        this.messenger.subscribe(neonEvents.DASHBOARD_CLEAR, this.clearDashboard.bind(this));
        this.messenger.subscribe(neonEvents.DASHBOARD_REFRESH, this.refreshDashboard.bind(this));
        this.messenger.subscribe(neonEvents.WIDGET_ADD, this.addWidget.bind(this));
        this.messenger.subscribe(neonEvents.WIDGET_DELETE, this.deleteWidget.bind(this));
        this.messenger.subscribe(neonEvents.WIDGET_CONTRACT, this.contractWidget.bind(this));
        this.messenger.subscribe(neonEvents.WIDGET_EXPAND, this.expandWidget.bind(this));
        this.messenger.subscribe(neonEvents.WIDGET_MOVE_TO_BOTTOM, this.moveWidgetToBottom.bind(this));
        this.messenger.subscribe(neonEvents.WIDGET_MOVE_TO_TOP, this.moveWidgetToTop.bind(this));
        this.messenger.subscribe(neonEvents.WIDGET_REGISTER, this.registerWidget.bind(this));
        this.messenger.subscribe(neonEvents.WIDGET_UNREGISTER, this.unregisterWidget.bind(this));
        this.messenger.subscribe(neonEvents.DASHBOARD_ERROR, this.handleDashboardError.bind(this));
    }

    /**
     * Adds the given widget to the grid in its specified column and row or in the first open space if no column and row are specified.
     *
     * @arg {{widgetGridItem:NeonGridItem}} eventMessage
     */
    addWidget(eventMessage: { widgetGridItem: NeonGridItem }) {
        let widgetGridItem: NeonGridItem = eventMessage.widgetGridItem;

        // Set default grid item config properties for the Neon dashboard.
        widgetGridItem.config = widgetGridItem.config || {};
        widgetGridItem.config.borderSize = widgetGridItem.config.borderSize || 10;
        widgetGridItem.config.dragHandle = widgetGridItem.config.dragHandle || '.drag-handle';
        widgetGridItem.id = widgetGridItem.id || uuid.v4();

        // Move grid item config properties from the top-level into the config object.
        widgetGridItem.config.col = widgetGridItem.config.col || widgetGridItem.col;
        widgetGridItem.config.row = widgetGridItem.config.row || widgetGridItem.row;
        widgetGridItem.config.sizex = widgetGridItem.config.sizex || widgetGridItem.sizex || AppComponent.DEFAULT_SIZEX;
        widgetGridItem.config.sizey = widgetGridItem.config.sizey || widgetGridItem.sizey || AppComponent.DEFAULT_SIZEY;

        // If both col and row are set, add the widget to the grid.
        if (widgetGridItem.config.col && widgetGridItem.config.row) {
            this.widgetGridItems.push(widgetGridItem);
            return;
        }

        // Otherwise insert the widget into the first empty space in the grid.
        widgetGridItem.config.col = widgetGridItem.config.col || 1;
        widgetGridItem.config.row = widgetGridItem.config.row || 1;

        // Zero max rows or columns denotes unlimited.  Adjust the rows and columns for the widget size.
        let maxCol: number = (this.gridConfig.max_cols || Number.MAX_SAFE_INTEGER.valueOf()) - widgetGridItem.config.sizex + 1;
        let maxRow: number = (this.gridConfig.max_rows || Number.MAX_SAFE_INTEGER.valueOf()) - widgetGridItem.config.sizey + 1;

        // Find the first empty space for the widget.
        let x = 1;
        let y = 1;
        let found = false;
        while (y <= maxRow && !found) {
            x = 1;
            while (x <= maxCol && !found) {
                widgetGridItem.config.col = x;
                widgetGridItem.config.row = y;
                found = this.widgetFits(widgetGridItem);
                x++;
            }
            y++;
        }

        this.widgetGridItems.push(widgetGridItem);
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

    checkPanel(panel: string) {
        return this.currentPanel === panel;
    }

    /**
     * Clears the grid.
     */
    clearDashboard() {
        this.widgetGridItems = [];
    }

    /**
     * Contracts the given widget to its previous size.
     *
     * @arg {{widgetGridItem:NeonGridItem}} eventMessage
     */
    contractWidget(eventMessage: { widgetGridItem: NeonGridItem }) {
        eventMessage.widgetGridItem.config.sizex = eventMessage.widgetGridItem.previousConfig.sizex;
        eventMessage.widgetGridItem.config.sizey = eventMessage.widgetGridItem.previousConfig.sizey;
        eventMessage.widgetGridItem.config.row = eventMessage.widgetGridItem.previousConfig.row;
        eventMessage.widgetGridItem.config.col = eventMessage.widgetGridItem.previousConfig.col;
    }

    /**
     * Deletes the widget with the given ID from the grid.
     *
     * @arg {{id:string}} eventMessage
     */
    deleteWidget(eventMessage: { id: string }) {
        for (let i = 0; i < this.widgetGridItems.length; i++) {
            if (this.widgetGridItems[i].id === eventMessage.id) {
                this.widgetGridItems.splice(i, 1);
            }
        }
    }

    /**
     * Expands the given widget to fill the width of the grid.
     *
     * @arg {{widgetGridItem:NeonGridItem}} eventMessage
     */
    expandWidget(eventMessage: { widgetGridItem: NeonGridItem }) {
        let visibleRows = 0;
        let gridElement = this.getGridElement();
        if (this.grid && gridElement) {
            visibleRows = Math.floor(gridElement.nativeElement.offsetParent.clientHeight /
                this.grid.rowHeight);
        }

        eventMessage.widgetGridItem.previousConfig = {
            col: eventMessage.widgetGridItem.config.col,
            row: eventMessage.widgetGridItem.config.row,
            sizex: eventMessage.widgetGridItem.config.sizex,
            sizey: eventMessage.widgetGridItem.config.sizey
        };
        eventMessage.widgetGridItem.config.sizex = (this.gridConfig) ? this.gridConfig.max_cols : this.getMaxColInUse();
        eventMessage.widgetGridItem.config.col = 1;
        // TODO:  Puzzle out why this exceeds the visible space by a couple rows.
        eventMessage.widgetGridItem.config.sizey = (visibleRows > 0) ? visibleRows : eventMessage.widgetGridItem.config.sizex;
    }

    getDatasets(): Dataset[] {
        return this.datasets;
    }

    /**
     * Returns the grid element.
     *
     * @return {object}
     * @private
     */
    private getGridElement() {
        /* tslint:disable:no-string-literal */
        return this.grid['_ngEl'];
        /* tslint:enable:no-string-literal */
    }

    /**
     * Returns the 1-based index of the last column occupied.  Thus, for a 10 column grid, 10 would be the
     * largest possble max column in use.  If no columns are filled (i.e., an empty grid), 0 is returned.
     */
    getMaxColInUse(): number {
        let maxCol = 0;

        for (let widgetGridItem of this.widgetGridItems) {
            maxCol = Math.max(maxCol, (widgetGridItem.config.col + widgetGridItem.config.sizex - 1));
        }
        return maxCol;
    }

    /**
     * Returns the 1-based index of the last row occupied.  Thus, for a 10 row grid, 10 would be the
     * largest possble max row in use.  If no rows are filled (i.e., an empty grid), 0 is returned.
     */
    getMaxRowInUse(): number {
        let maxRow = 0;

        for (let widgetGridItem of this.widgetGridItems) {
            maxRow = Math.max(maxRow, (widgetGridItem.config.row + widgetGridItem.config.sizey - 1));
        }
        return maxRow;
    }

    /**
     * Handles the given error and message.
     *
     * @arg {{error:Error|ExceptionInformation,message:string}} eventMessage
     */
    handleDashboardError(eventMessage: { error: Error | ExceptionInformation, message: string }) {
        // TODO THOR-916
        console.error('An error occured: ' + eventMessage.message + '\n' + eventMessage.error);
    }

    /**
     * Moves the given widget to the bottom of the grid.
     *
     * @arg {{widgetGridItem:NeonGridItem}} eventMessage
     */
    moveWidgetToBottom(eventMessage: { widgetGridItem: NeonGridItem }) {
        eventMessage.widgetGridItem.config.row = this.getMaxRowInUse() + 1;
    }

    /**
     * Moves the given widget to the top of the grid.
     *
     * @arg {{widgetGridItem:NeonGridItem}} eventMessage
     */
    moveWidgetToTop(eventMessage: { widgetGridItem: NeonGridItem }) {
        eventMessage.widgetGridItem.config.row = 0;
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
        this.refreshDashboard();
    }

    ngOnDestroy(): void {
        // Do nothing.
    }

    ngOnInit(): void {
        this.messenger.subscribe('showSimpleSearch', (message) => {
            this.showSimpleSearch = message.showSimpleSearch;
        });
        this.messenger.subscribe('showVisShortcut', (message) => {
            this.showVisShortcut = message.showVisShortcut;
        });
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

    openCustomConnectionDialog() {
        let config = new MatDialogConfig();
        config.panelClass = this.widgetService.getTheme();
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
        if (this.showFilterBuilder && filterBuilderContainer) {
            filterBuilderContainer.setAttribute('style', 'display: show');
        } else if (filterBuilderContainer) {
            filterBuilderContainer.setAttribute('style', 'display: none');
        }
    }

    openFilterTrayDialog() {
        let config = new MatDialogConfig();
        config.panelClass = this.widgetService.getTheme();
        config.viewContainerRef = this.viewContainerRef;
        config.data = this.widgets;

        this.filterTrayDialogRef = this.dialog.open(FilterTrayComponent, config);
        this.filterTrayDialogRef.afterClosed().subscribe(() => {
            this.filterTrayDialogRef = null;
        });
    }

    /**
     * Refreshes the grid.
     */
    refreshDashboard() {
        this.grid.triggerResize();
    }

    /**
     * Registers the given widget with the given ID.
     *
     * @arg {{id:string,widget:BaseNeonComponent|BaseLayeredNeonComponent}} eventMessage
     */
    registerWidget(eventMessage: { id: string, widget: BaseNeonComponent | BaseLayeredNeonComponent }) {
        if (this.widgets.get(eventMessage.id) === undefined) {
            this.widgets.set(eventMessage.id, eventMessage.widget);
        }
    }

    setPanel(newPanel: string, newTitle: string) {
        this.currentPanel = newPanel;
        this.rightPanelTitle = newTitle;
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

    /**
     * Unregisters the widget with the given ID.
     *
     * @arg {{id:string}} eventMessage
     */
    unregisterWidget(eventMessage: { id: string }) {
        this.widgets.delete(eventMessage.id);
    }

    /**
     * This function determines if a widget will overlap any existing grid items if placed
     * at the given row and column.  This function assumes the given widget has valid sizes.
     * @arg widgetGridItem The widget to place
     */
    widgetFits(widgetGridItem: NeonGridItem) {
        for (let existingWidgetGridItem of this.widgetGridItems) {
            if (this.widgetOverlaps(widgetGridItem, existingWidgetGridItem)) {
                return false;
            }
        }

        return true;
    }

    /**
     * This function uses a simple Axis-Aligned Bounding Box (AABB)
     * calculation to check for overlap of two items.  This function assumes the given items have valid sizes.
     * @arg one the first widget
     * @arg two the second widget
     */
    widgetOverlaps(one: NeonGridItem, two: NeonGridItem) {
        if (one.config.col > (two.config.col + two.config.sizex - 1) ||
            two.config.col > (one.config.col + one.config.sizex - 1)) {
            return false;
        }
        if (one.config.row > (two.config.row + two.config.sizey - 1) ||
            two.config.row > (one.config.row + one.config.sizey - 1)) {
            return false;
        }

        return true;
    }
}
