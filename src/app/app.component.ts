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
    ChangeDetectorRef,
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
import * as uuidv4 from 'uuid/v4';

import { AbstractSearchService } from './services/abstract.search.service';
import { AbstractWidgetService } from './services/abstract.widget.service';
import { AddVisualizationComponent } from './components/add-visualization/add-visualization.component';
import { BaseNeonComponent } from './components/base-neon-component/base-neon.component';
import { CustomConnectionComponent } from './components/custom-connection/custom-connection.component';
import { Dashboard, Datastore } from './dataset';
import { DatasetService } from './services/dataset.service';
import { DomSanitizer } from '@angular/platform-browser';
import { FilterService } from '../app/services/filter.service';
import { MatDialog, MatDialogConfig, MatDialogRef, MatSnackBar, MatToolbar, MatSidenav, MatMenuTrigger } from '@angular/material';
import { MatIconRegistry } from '@angular/material/icon';
import { NeonGridItem } from './neon-grid-item';
import { NeonGTDConfig } from './neon-gtd-config';
import { neonEvents } from './neon-namespaces';
import { NgGrid, NgGridConfig } from 'angular2-grid';
import { ParameterService } from './services/parameter.service';
import { SaveStateComponent } from './components/save-state/save-state.component';
import { SimpleFilterComponent } from './components/simple-filter/simple-filter.component';
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
    @ViewChild('simpleFilter') simpleFilter: SimpleFilterComponent;
    @ViewChild('sideNavRight') sideNavRight: MatSidenav;

    public currentPanel: string = 'dashboardLayouts';
    public showCustomConnectionButton: boolean = false;
    public showFiltersComponent: boolean = false;
    public showFiltersComponentIcon: boolean = false;
    //Toolbar
    public showVisShortcut: boolean = true;
    public showDashboardSelector: boolean = false;
    public toggleGear: boolean = true;

    public rightPanelTitle: string = 'Dashboard Layouts';

    public createAboutNeon: boolean = false;
    public createAddVis: boolean = false;
    public createDashboardLayouts: boolean = true;
    public createGear: boolean = true;
    public createSavedState: boolean = false;
    public createSettings: boolean = false;
    public createFiltersComponent: boolean = false; //This is used to create the Filters Component later

    public dashboards: Dashboard;

    public widgetGridItems: NeonGridItem[] = [];
    public widgets: Map<string, BaseNeonComponent> = new Map();

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

    /* A reference to the dialog for the custom connection dialog. */
    private customConnectionDialogRef: MatDialogRef<CustomConnectionComponent>;

    public filtersIcon;

    // Use two messengers here because a single messager doesn't receive its own messages.
    public messageReceiver: neon.eventing.Messenger;
    public messageSender: neon.eventing.Messenger;

    constructor(
        public changeDetection: ChangeDetectorRef,
        public datasetService: DatasetService,
        public dialog: MatDialog,
        private domSanitizer: DomSanitizer,
        public filterService: FilterService,
        private matIconRegistry: MatIconRegistry,
        private parameterService: ParameterService,
        private searchService: AbstractSearchService,
        public snackBar: MatSnackBar,
        public widgetService: AbstractWidgetService,
        public viewContainerRef: ViewContainerRef,
        @Inject('config') private neonConfig: NeonGTDConfig
    ) {
        this.messageReceiver = new neon.eventing.Messenger();
        this.messageSender = new neon.eventing.Messenger();

        // The dashboards are read from the config file in the DatasetService's constructor.
        this.dashboards = this.datasetService.getDashboards();

        // TODO: Default to false and set to true only after a dataset has been selected.
        this.showFiltersComponentIcon = true;
        this.showCustomConnectionButton = true;
        this.neonConfig = neonConfig;
        this.snackBar = snackBar;

        if (neonConfig.errors && neonConfig.errors.length > 0) {
            let snackBarRef: any = this.snackBar.openFromComponent(SnackBarComponent, {
                viewContainerRef: this.viewContainerRef
            });
            snackBarRef.instance.snackBarRef = snackBarRef;
            snackBarRef.instance.addErrors('Configuration Errors', neonConfig.errors);
        }

        if (this.neonConfig) {
            this.projectTitle = this.neonConfig.projectTitle ? this.neonConfig.projectTitle : this.projectTitle;
            this.projectIcon = this.neonConfig.projectIcon ? this.neonConfig.projectIcon : this.projectIcon;
        }

        this.matIconRegistry.addSvgIcon(
            'filters',
            this.domSanitizer.bypassSecurityTrustResourceUrl('./assets/icons/filters.svg')
        );

        this.matIconRegistry.addSvgIcon(
            'filters_active',
            this.domSanitizer.bypassSecurityTrustResourceUrl('./assets/icons/filters_active.svg')
        );

        this.matIconRegistry.addSvgIcon(
            'dashboard_selector',
            this.domSanitizer.bypassSecurityTrustResourceUrl('./assets/icons/database_icon.svg')
        );

        this.changeFavicon();
        this.filtersIcon = 'filters';

        this.messageReceiver.subscribe(neonEvents.DASHBOARD_CLEAR, this.clearDashboard.bind(this));
        this.messageReceiver.subscribe(neonEvents.DASHBOARD_READY, this.showDashboardStateOnPageLoad.bind(this));
        this.messageReceiver.subscribe(neonEvents.DASHBOARD_REFRESH, this.refreshDashboard.bind(this));
        this.messageReceiver.subscribe(neonEvents.DASHBOARD_STATE, this.showDashboardState.bind(this));
        this.messageReceiver.subscribe(neonEvents.WIDGET_ADD, this.addWidget.bind(this));
        this.messageReceiver.subscribe(neonEvents.WIDGET_DELETE, this.deleteWidget.bind(this));
        this.messageReceiver.subscribe(neonEvents.WIDGET_CONTRACT, this.contractWidget.bind(this));
        this.messageReceiver.subscribe(neonEvents.WIDGET_EXPAND, this.expandWidget.bind(this));
        this.messageReceiver.subscribe(neonEvents.WIDGET_MOVE_TO_BOTTOM, this.moveWidgetToBottom.bind(this));
        this.messageReceiver.subscribe(neonEvents.WIDGET_MOVE_TO_TOP, this.moveWidgetToTop.bind(this));
        this.messageReceiver.subscribe(neonEvents.WIDGET_REGISTER, this.registerWidget.bind(this));
        this.messageReceiver.subscribe(neonEvents.WIDGET_UNREGISTER, this.unregisterWidget.bind(this));
        this.messageReceiver.subscribe(neonEvents.DASHBOARD_ERROR, this.handleDashboardError.bind(this));
    }

    /**
     * Adds the given widget to the grid in its specified column and row or in the first open space if no column and row are specified.
     *
     * @arg {{widgetGridItem:NeonGridItem}} eventMessage
     */
    addWidget(eventMessage: { widgetGridItem: NeonGridItem }) {
        let widgetGridItem: NeonGridItem = eventMessage.widgetGridItem;

        // Set default grid item config properties for the Neon dashboard.
        widgetGridItem.borderSize = widgetGridItem.borderSize || 10;
        widgetGridItem.dragHandle = widgetGridItem.dragHandle || '.drag-handle';
        widgetGridItem.id = widgetGridItem.id || uuidv4();

        // Move grid item config properties from the top-level into the config object.
        widgetGridItem.col = widgetGridItem.col || widgetGridItem.col;
        widgetGridItem.row = widgetGridItem.row || widgetGridItem.row;
        widgetGridItem.sizex = widgetGridItem.sizex || widgetGridItem.sizex || AppComponent.DEFAULT_SIZEX;
        widgetGridItem.sizey = widgetGridItem.sizey || widgetGridItem.sizey || AppComponent.DEFAULT_SIZEY;

        // If both col and row are set, add the widget to the grid.
        if (widgetGridItem.col && widgetGridItem.row) {
            this.widgetGridItems.push(widgetGridItem);
            return;
        }

        // Otherwise insert the widget into the first empty space in the grid.
        widgetGridItem.col = widgetGridItem.col || 1;
        widgetGridItem.row = widgetGridItem.row || 1;

        // Zero max rows or columns denotes unlimited.  Adjust the rows and columns for the widget size.
        let maxCol: number = (this.gridConfig.max_cols || Number.MAX_SAFE_INTEGER.valueOf()) - widgetGridItem.sizex + 1;
        let maxRow: number = (this.gridConfig.max_rows || Number.MAX_SAFE_INTEGER.valueOf()) - widgetGridItem.sizey + 1;

        // Find the first empty space for the widget.
        let x = 1;
        let y = 1;
        let found = false;
        while (y <= maxRow && !found) {
            x = 1;
            while (x <= maxCol && !found) {
                widgetGridItem.col = x;
                widgetGridItem.row = y;
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

    changeFiltersComponentIcon() {
        this.filtersIcon = this.isFiltered() ? 'filters_active' : 'filters';
        // TODO Does this function really have to return a boolean value?
        return true;
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
        eventMessage.widgetGridItem.sizex = eventMessage.widgetGridItem.previousConfig.sizex;
        eventMessage.widgetGridItem.sizey = eventMessage.widgetGridItem.previousConfig.sizey;
        eventMessage.widgetGridItem.row = eventMessage.widgetGridItem.previousConfig.row;
        eventMessage.widgetGridItem.col = eventMessage.widgetGridItem.previousConfig.col;
    }

    /**
     * Deletes the widget with the given ID from the grid.
     *
     * @arg {{id:string}} eventMessage
     */
    deleteWidget(eventMessage: { id: string }) {
        for (let i = 0; i < this.widgetGridItems.length; i++) {
            if (this.widgetGridItems[i].id === eventMessage.id) {
                // Update the grid item itself so that its status is saved within the dashboard's layoutObject.
                this.widgetGridItems[i].hide = true;
                this.widgetGridItems.splice(i, 1);
            }
        }
    }

    disableClose(): boolean {
        return this.currentPanel === 'gear';
    }

    /**
     * Expands the given widget to fill the width of the grid.
     *
     * @arg {{widgetGridItem:NeonGridItem}} eventMessage
     */
    expandWidget(eventMessage: { widgetGridItem: NeonGridItem }) {
        let visibleRowCount = this.getVisibleRowCount();
        eventMessage.widgetGridItem.previousConfig = {
            col: eventMessage.widgetGridItem.col,
            row: eventMessage.widgetGridItem.row,
            sizex: eventMessage.widgetGridItem.sizex,
            sizey: eventMessage.widgetGridItem.sizey
        };
        eventMessage.widgetGridItem.sizex = (this.gridConfig) ? this.gridConfig.max_cols : this.getMaxColInUse();
        eventMessage.widgetGridItem.col = 1;
        // TODO:  Puzzle out why this exceeds the visible space by a couple rows.
        eventMessage.widgetGridItem.sizey = (visibleRowCount > 0) ? visibleRowCount : eventMessage.widgetGridItem.sizex;
    }

    /**
     * Finds and returns the Dashboard to automatically show on page load, or null if no such dashboard exists.
     *
     * @arg {{ [key: string]: Dashboard }} dashboardChoices
     * @return {Dashboard}
     * @private
     */
    private findAutoShowDashboard(dashboardChoices: { [key: string]: Dashboard }): Dashboard {
        for (let choiceKey of Object.keys(dashboardChoices || {})) {
            let nestedChoiceKeys = Object.keys(dashboardChoices[choiceKey].choices || {});
            if (!nestedChoiceKeys.length) {
                if (dashboardChoices[choiceKey].options && dashboardChoices[choiceKey].options.connectOnLoad) {
                    return dashboardChoices[choiceKey];
                }
            } else {
                let nestedDashboard = this.findAutoShowDashboard(dashboardChoices[choiceKey].choices);
                if (nestedDashboard) {
                    return nestedDashboard;
                }
            }
        }
        return null;
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
            maxCol = Math.max(maxCol, (widgetGridItem.col + widgetGridItem.sizex - 1));
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
            maxRow = Math.max(maxRow, (widgetGridItem.row + widgetGridItem.sizey - 1));
        }
        return maxRow;
    }

    /**
     * Returns the visible row count.
     *
     * @return {number}
     */
    getVisibleRowCount(): number {
        let gridElement = this.getGridElement();
        if (this.grid && gridElement) {
            return Math.floor(gridElement.nativeElement.offsetParent.clientHeight / this.grid.rowHeight);
        }
        return 0;
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

    private isFiltered(): boolean {
        return !!this.filterService.getFilters().length;
    }

    /**
     * Moves the given widget to the bottom of the grid.
     *
     * @arg {{widgetGridItem:NeonGridItem}} eventMessage
     */
    moveWidgetToBottom(eventMessage: { widgetGridItem: NeonGridItem }) {
        eventMessage.widgetGridItem.row = this.getMaxRowInUse() + 1;
    }

    /**
     * Moves the given widget to the top of the grid.
     *
     * @arg {{widgetGridItem:NeonGridItem}} eventMessage
     */
    moveWidgetToTop(eventMessage: { widgetGridItem: NeonGridItem }) {
        eventMessage.widgetGridItem.row = 1;
    }

    ngAfterViewInit() {
        let gearContainer: HTMLElement = document.getElementById('gear');

        gearContainer.setAttribute('style', 'display: none');
        /* NOTE:
         * The gear component is created when the app component is created because if it is created when
         * a component sends its option object in the messenger channel, it is too late.
         * The gear component is created too late to receive the option object in the meseenger channel,
         * as a result you would have had to click the gear option in the component twice to see any
         * object values.
         * Another workaround might be sending the option object in the messenger channel after a feedback
         * from the app component after the toggleGear is received.
         */
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
        this.messageReceiver.subscribe('showVisShortcut', (message) => this.updateShowVisShortcut(message));
        this.messageReceiver.subscribe('showFiltersComponentIcon', (message) => this.updateShowFiltersComponentIcon(message));
        this.messageReceiver.subscribe('toggleGear', (message) => this.updateToggleGear(message));
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
        config.viewContainerRef = this.viewContainerRef;

        this.customConnectionDialogRef = this.dialog.open(CustomConnectionComponent, config);
        this.customConnectionDialogRef.afterClosed().subscribe(() => {
            this.customConnectionDialogRef = null;
        });
    }

    toggleFiltersDialog() {
        // Added this to create the filters component at first click so it's after dataset initialization
        if (!this.createFiltersComponent) {
            this.createFiltersComponent = true;
        }
        this.showFiltersComponent = !this.showFiltersComponent;
        let filtersContainer: HTMLElement = document.getElementById('filters');
        if (this.showFiltersComponent && filtersContainer) {
            filtersContainer.setAttribute('style', 'display: show');
        } else if (filtersContainer) {
            filtersContainer.setAttribute('style', 'display: none');
        }
    }

    toggleDashboardSelectorDialog(showSelector: boolean) {
        this.showDashboardSelector = showSelector;
        let dashboardSelectorContainer: HTMLElement = document.getElementById('dashboard.selector');
        if (this.showDashboardSelector && dashboardSelectorContainer) {
            dashboardSelectorContainer.setAttribute('style', 'display: show');
        } else if (dashboardSelectorContainer) {
            dashboardSelectorContainer.setAttribute('style', 'display: none');
        }
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
     * @arg {{id:string,widget:BaseNeonComponent}} eventMessage
     */
    registerWidget(eventMessage: { id: string, widget: BaseNeonComponent }) {
        if (this.widgets.get(eventMessage.id) === undefined) {
            this.widgets.set(eventMessage.id, eventMessage.widget);
        }
    }

    resetAllPanel() {
        let aboutNeonContainer: HTMLElement = document.getElementById('aboutNeon');
        let addVisContainer: HTMLElement = document.getElementById('addVis');
        let dashboardLayoutsContainer: HTMLElement = document.getElementById('dashboardLayouts');
        let gearContainer: HTMLElement = document.getElementById('gear');
        let savedStateContainer: HTMLElement = document.getElementById('savedState');
        let settingsContainer: HTMLElement = document.getElementById('settings');

        let containerList = [
            aboutNeonContainer,
            addVisContainer,
            dashboardLayoutsContainer,
            gearContainer,
            savedStateContainer,
            settingsContainer
        ];

        containerList.forEach((element) => {
            if (element) {
                element.setAttribute('style', 'display: none');
            }
        });
    }

    setPanel(newPanel: string, newTitle: string) {
        this.resetAllPanel();
        let rightPanelContainer: HTMLElement = document.getElementById(newPanel);

        if (newPanel === 'aboutNeon' && !this.createAboutNeon) {
            this.createAboutNeon = true;
        } else if (newPanel === 'addVis' && !this.createAddVis) {
            this.createAddVis = true;
        } else if (newPanel === 'savedState' && !this.createSavedState) {
            this.createSavedState = true;
        } else if (newPanel === 'settings' && !this.createSettings) {
            this.createSettings = true;
        }

        if (rightPanelContainer) {
            rightPanelContainer.setAttribute('style', 'display: show');
        }
        this.currentPanel = newPanel;
        this.rightPanelTitle = newTitle;
    }

    /**
     * Shows the given dashboard using the given datastores and the given layout.
     *
     * @arg {{dashboard:Dashboard,datastores:Datastore[],layout:any[]}} eventMessage
     * @private
     */
    private showDashboardState(eventMessage: { dashboard: Dashboard }) {
        // TODO THOR-1062 Permit multiple datastores.
        this.datasetService.setActiveDataset(eventMessage.dashboard.datastores[0]);
        this.datasetService.setCurrentDashboard(eventMessage.dashboard);

        this.messageSender.publish(neonEvents.DASHBOARD_CLEAR, {});

        this.filterService.setFiltersFromConfig(eventMessage.dashboard.filters || [], this.datasetService, this.searchService);

        for (let widgetGridItem of eventMessage.dashboard.layoutObject) {
            if (!widgetGridItem.hide) {
                this.messageSender.publish(neonEvents.WIDGET_ADD, {
                    widgetGridItem: widgetGridItem
                });
            }
        }

        this.simpleFilter.updateSimpleFilterConfig();
        this.toggleDashboardSelectorDialog(false);
    }

    /**
     * Shows the dashboard state on page load, if any.
     *
     * @private
     */
    private showDashboardStateOnPageLoad() {
        let parameterState: string = this.parameterService.findDashboardStateIdInUrl();

        if (parameterState) {
            this.parameterService.loadState(parameterState, this.parameterService.findFilterStateIdInUrl());
        }

        let parameterDataset: string = this.parameterService.findActiveDatasetInUrl();

        let dashboard: Dashboard = this.findAutoShowDashboard(this.dashboards.choices);

        if (dashboard && (!parameterDataset || parameterDataset === dashboard.datastores[0].name)) {
            this.messageSender.publish(neonEvents.DASHBOARD_STATE, {
                dashboard: dashboard
            });
        }
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
     * Updates the showVisShortcut boolean value from the messenger channel
     * @param message
     */
    updateShowVisShortcut(message) {
        this.showVisShortcut = message.showVisShortcut;
    }

    /**
     * Updates the showFiltersComponentIcon boolean value from the messenger channel
     * @param message
     */
    updateShowFiltersComponentIcon(message) {
        this.showFiltersComponentIcon = message.showFiltersComponentIcon;
    }

    updateToggleGear(message) {
        this.toggleGear = message.toggleGear;
        if (this.toggleGear) {
            this.setPanel('gear', 'Component Settings');
            this.sideNavRight.toggle();
        }
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
        if (one.col > (two.col + two.sizex - 1) || two.col > (one.col + one.sizex - 1)) {
            return false;
        }
        if (one.row > (two.row + two.sizey - 1) || two.row > (one.row + one.sizey - 1)) {
            return false;
        }
        return true;
    }
}
