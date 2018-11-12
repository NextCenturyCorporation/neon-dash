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
    private static DEFAULT_SIZEX = 4;
    private static DEFAULT_SIZEY = 4;

    @ViewChild(NgGrid) grid: NgGrid;
    @ViewChildren(VisualizationContainerComponent) visualizations: QueryList<VisualizationContainerComponent>;

    @Input() sidenav = MatSidenav;
    // Used to determine which pane is show in the right sidenav

    public currentPanel: string = '';
    public showCustomConnectionButton: boolean = false;
    public showFilterBuilder: boolean = false;
    public showFilterTrayButton: boolean = false;
    //Toolbar
    public showSimpleSearch: boolean = false;
    public showVisShortcut: boolean = true;

    public rightPanelTitle: string = '';

    public createFilterBuilder: boolean = false; //This is used to create the Filter Builder later

    public gridItems: NeonGridItem[] = [];
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
        public themesService: ThemesService,
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
                panelClass: this.themesService.getCurrentTheme(),
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
    }

    /**
     * Adds the given widget to the grid in its specified column and row or in the first open space if no column and row are specified.
     *
     * @arg {{widget:NeonGridItem}} eventMessage
     */
    addWidget(eventMessage: { widget: NeonGridItem }) {
        if (eventMessage.widget.col && eventMessage.widget.row) {
            eventMessage.widget.sizex = eventMessage.widget.sizex || AppComponent.DEFAULT_SIZEX;
            eventMessage.widget.sizey = eventMessage.widget.sizey || AppComponent.DEFAULT_SIZEY;
            this.gridItems.push(eventMessage.widget);
            return;
        }

        let widgetCopy: NeonGridItem = _.cloneDeep(eventMessage.widget);
        widgetCopy.gridItemConfig = {
            col: eventMessage.widget.col || 1,
            row: eventMessage.widget.row || 1,
            sizex: eventMessage.widget.sizex || AppComponent.DEFAULT_SIZEX,
            sizey: eventMessage.widget.sizey || AppComponent.DEFAULT_SIZEY,
            dragHandle: '.drag-handle'
        };

        // Zero max rows or columns denotes unlimited.  Adjust the rows and columns for the widget size.
        let maxCol: number = (this.gridConfig.max_cols || Number.MAX_SAFE_INTEGER.valueOf()) - widgetCopy.gridItemConfig.sizex + 1;
        let maxRow: number = (this.gridConfig.max_rows || Number.MAX_SAFE_INTEGER.valueOf()) - widgetCopy.gridItemConfig.sizey + 1;

        // Find the first spot in which the visualization fits.
        let x = 1;
        let y = 1;
        let found = false;
        while (y <= maxRow && !found) {
            x = 1;
            while (x <= maxCol && !found) {
                widgetCopy.gridItemConfig.col = x;
                widgetCopy.gridItemConfig.row = y;
                found = this.widgetFits(widgetCopy);
                x++;
            }
            y++;
        }

        this.gridItems.push(widgetCopy);
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
        this.gridItems = [];
    }

    /**
     * Contracts the given widget to its previous size.
     *
     * @arg {{widget:NeonGridItem}} eventMessage
     */
    contractWidget(eventMessage: { widget: NeonGridItem }) {
        eventMessage.widget.gridItemConfig.sizex = eventMessage.widget.lastGridItemConfig.sizex;
        eventMessage.widget.gridItemConfig.sizey = eventMessage.widget.lastGridItemConfig.sizey;
        eventMessage.widget.gridItemConfig.row = eventMessage.widget.lastGridItemConfig.row;
        eventMessage.widget.gridItemConfig.col = eventMessage.widget.lastGridItemConfig.col;
    }

    /**
     * Deletes the widget with the given ID from the grid.
     *
     * @arg {{id:string}} eventMessage
     */
    deleteWidget(eventMessage: { id: string }) {
        for (let i = 0; i < this.gridItems.length; i++) {
            if (this.gridItems[i].id === eventMessage.id) {
                this.gridItems.splice(i, 1);
            }
        }
    }

    /**
     * Expands the given widget to fill the width of the grid.
     *
     * @arg {{widget:NeonGridItem}} eventMessage
     */
    expandWidget(eventMessage: { widget: NeonGridItem }) {
        let visibleRows = 0;
        let gridElement = this.getGridElement();
        if (this.grid && gridElement) {
            visibleRows = Math.floor(gridElement.nativeElement.offsetParent.clientHeight /
                this.grid.rowHeight);
        }

        eventMessage.widget.lastGridItemConfig  = _.clone(eventMessage.widget.gridItemConfig);
        eventMessage.widget.gridItemConfig.sizex = (this.gridConfig) ? this.gridConfig.max_cols : this.getMaxColInUse();
        eventMessage.widget.gridItemConfig.col = 1;
        // TODO:  Puzzle out why this exceeds the visible space by a couple rows.
        eventMessage.widget.gridItemConfig.sizey = (visibleRows > 0) ? visibleRows : eventMessage.widget.gridItemConfig.sizex;
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

        for (let gridItem of this.gridItems) {
            maxCol = Math.max(maxCol, (gridItem.gridItemConfig.col + gridItem.gridItemConfig.sizex - 1));
        }
        return maxCol;
    }

    /**
     * Returns the 1-based index of the last row occupied.  Thus, for a 10 row grid, 10 would be the
     * largest possble max row in use.  If no rows are filled (i.e., an empty grid), 0 is returned.
     */
    getMaxRowInUse(): number {
        let maxRow = 0;

        for (let gridItem of this.gridItems) {
            maxRow = Math.max(maxRow, (gridItem.gridItemConfig.row + gridItem.gridItemConfig.sizey - 1));
        }
        return maxRow;
    }

    /**
     * Moves the given widget to the bottom of the grid.
     *
     * @arg {{widget:NeonGridItem}} eventMessage
     */
    moveWidgetToBottom(eventMessage: { widget: NeonGridItem }) {
        eventMessage.widget.gridItemConfig.row = this.getMaxRowInUse() + 1;
    }

    /**
     * Moves the given widget to the top of the grid.
     *
     * @arg {{widget:NeonGridItem}} eventMessage
     */
    moveWidgetToTop(eventMessage: { widget: NeonGridItem }) {
        eventMessage.widget.gridItemConfig.row = 0;
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
        config.panelClass = this.themesService.getCurrentTheme();
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
        config.panelClass = this.themesService.getCurrentTheme();
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
     * @arg {{id:string,widget:NeonGridItem}} eventMessage
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
     * @arg widget The widget to place
     * @arg col the column in which to place the widget's top-left corner
     * @arg row the row in which to place the widget's top-left corner
     */
    widgetFits(widget: NeonGridItem) {
        for (let gridItem of this.gridItems) {
            if (this.widgetOverlaps(widget, gridItem)) {
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
        if (one.gridItemConfig.col > (two.gridItemConfig.col + two.gridItemConfig.sizex - 1) ||
            two.gridItemConfig.col > (one.gridItemConfig.col + one.gridItemConfig.sizex - 1)) {
            return false;
        }
        if (one.gridItemConfig.row > (two.gridItemConfig.row + two.gridItemConfig.sizey - 1) ||
            two.gridItemConfig.row > (one.gridItemConfig.row + one.gridItemConfig.sizey - 1)) {
            return false;
        }

        return true;
    }
}
