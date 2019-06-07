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
    OnInit,
    OnDestroy,
    QueryList,
    ViewChild,
    ViewChildren,
    ViewContainerRef
} from '@angular/core';

import { eventing } from 'neon-framework';
import * as uuidv4 from 'uuid/v4';

import { AbstractSearchService } from '../services/abstract.search.service';
import { AbstractWidgetService } from '../services/abstract.widget.service';
import { BaseNeonComponent } from '../components/base-neon-component/base-neon.component';
import { DashboardService } from '../services/dashboard.service';
import { DomSanitizer } from '@angular/platform-browser';
import { FilterService } from '../services/filter.service';
import { MatSnackBar, MatSidenav } from '@angular/material';
import { MatIconRegistry } from '@angular/material/icon';
import { NeonGridItem } from '../neon-grid-item';
import { NeonDashboardConfig, NeonConfig } from '../types';
import { neonEvents } from '../neon-namespaces';
import { NgGrid, NgGridConfig } from 'angular2-grid';
import { ParameterService } from '../services/parameter.service';
import { SimpleFilterComponent } from '../components/simple-filter/simple-filter.component';
import { SnackBarComponent } from '../components/snack-bar/snack-bar.component';
import { VisualizationContainerComponent } from '../components/visualization-container/visualization-container.component';
import { ConfigService } from '../services/config.service';

export function DashboardModified() {
    return (__inst: any, __prop: string | symbol, descriptor) => {
        const fn = descriptor.value;
        descriptor.value = function(this: DashboardComponent, ...args: any[]) {
            if (!this.pendingInitialRegistrations && this.currentDashboard) {
                this.currentDashboard['modified'] = true; // TODO : resolve
            }
            return fn.call(this, ...args);
        };
    };
}

@Component({
    selector: 'app-dashboard',
    templateUrl: './dashboard.component.html',
    styleUrls: [
        '../../../node_modules/angular2-grid/NgGrid.css',
        './dashboard.component.scss'
    ]
})
export class DashboardComponent implements AfterViewInit, OnInit, OnDestroy {
    private static DEFAULT_SIZEX = 4;
    private static DEFAULT_SIZEY = 4;

    @ViewChild(NgGrid) grid: NgGrid;
    @ViewChildren(VisualizationContainerComponent) visualizations: QueryList<VisualizationContainerComponent>;
    @ViewChild('simpleFilter') simpleFilter: SimpleFilterComponent;
    @ViewChild('sideNavRight') sideNavRight: MatSidenav;

    public updatedData = 0;

    public currentPanel: string = 'dashboardLayouts';
    public showCustomConnectionButton: boolean = false;
    public showFiltersComponent: boolean = false;
    public showFilterTray: boolean = false;

    // Toolbar
    public showVisualizationsShortcut: boolean = true;
    public showDashboardSelector: boolean = false;

    public rightPanelTitle: string = 'Dashboard Layouts';

    public createAboutNeon: boolean = false;
    public createAddVis: boolean = false;
    public createCustomConnection: boolean = false;
    public createDashboardLayouts: boolean = true;
    public createGear: boolean = true;
    public createSavedState: boolean = false;
    public createSettings: boolean = false;
    public createFiltersComponent: boolean = false; // This is used to create the Filters Component later

    public dashboards: NeonDashboardConfig;
    public currentDashboard: NeonDashboardConfig;
    public pendingInitialRegistrations = 0;

    public selectedTabIndex = 0;
    public tabbedGrid: {
        list: NeonGridItem[];
        name: string;
    }[] = [{
        list: [],
        name: ''
    }];

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
        maintain_ratio: false, // NOTE!!!!! I changed this to false because it messes with the row height when it is true
        auto_style: true,
        auto_resize: true,
        cascade: 'up',
        fix_to_grid: true,
        limit_to_screen: true,
        resize_directions: ['bottomright', 'bottomleft', 'right', 'left', 'bottom']
    };

    public projectTitle: string = 'Neon';
    public projectIcon: string = 'assets/favicon.blue.ico?v=1';
    public dashboardVersion: string = '';
    public filtersIcon: string;

    // Use two messengers here because a single messager doesn't receive its own messages.
    public messageReceiver: eventing.Messenger;
    public messageSender: eventing.Messenger;

    neonConfig: NeonConfig;

    constructor(
        public changeDetection: ChangeDetectorRef,
        public dashboardService: DashboardService,
        private domSanitizer: DomSanitizer,
        public filterService: FilterService,
        private matIconRegistry: MatIconRegistry,
        private parameterService: ParameterService,
        private searchService: AbstractSearchService,
        public snackBar: MatSnackBar,
        public widgetService: AbstractWidgetService,
        public viewContainerRef: ViewContainerRef,
        private configService: ConfigService
    ) {
        this.messageReceiver = new eventing.Messenger();
        this.messageSender = new eventing.Messenger();

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

        this.filtersIcon = 'filters';
        this.showFilterTray = true;
        this.showCustomConnectionButton = true;
        this.snackBar = snackBar;

        this.configService.get().subscribe((neonConfig) => {
            // TODO: Default to false and set to true only after a dataset has been selected.

            const config = neonConfig;
            this.messageSender.publish(neonEvents.DASHBOARD_REFRESH, {});

            // The dashboards are read from the config file in the DashboardService's constructor.
            this.dashboards = this.dashboardService.dashboards;
            this.dashboardVersion = config.version || '';

            if (config) {
                if (config.errors && config.errors.length > 0) {
                    let snackBarRef: any = this.snackBar.openFromComponent(SnackBarComponent, {
                        viewContainerRef: this.viewContainerRef
                    });
                    snackBarRef.instance.snackBarRef = snackBarRef;
                    snackBarRef.instance.addErrors('Configuration Errors', config.errors);
                }

                this.projectTitle = config.projectTitle ? config.projectTitle : this.projectTitle;
                this.projectIcon = config.projectIcon ? config.projectIcon : this.projectIcon;
                this.changeFavicon();
            }
        });
    }

    @DashboardModified()
    private generalChange() {
        // Do nothing
    }

    /**
     * Adds the given widget to the grid in its specified column and row or in the first open space if no column and row are specified.
     *
     * @arg {{widgetGridItem:NeonGridItem}} eventMessage
     */
    @DashboardModified()
    private addWidget(eventMessage: { gridName?: string, widgetGridItem: NeonGridItem }) {
        let widgetGridItem: NeonGridItem = eventMessage.widgetGridItem;

        // Set default grid item config properties for the Neon dashboard.
        widgetGridItem.borderSize = widgetGridItem.borderSize || 10;
        widgetGridItem.dragHandle = widgetGridItem.dragHandle || '.drag-handle';
        widgetGridItem.id = widgetGridItem.id || uuidv4();

        // Move grid item config properties from the top-level into the config object.
        widgetGridItem.col = widgetGridItem.col || widgetGridItem.col;
        widgetGridItem.row = widgetGridItem.row || widgetGridItem.row;
        widgetGridItem.sizex = widgetGridItem.sizex || widgetGridItem.sizex || DashboardComponent.DEFAULT_SIZEX;
        widgetGridItem.sizey = widgetGridItem.sizey || widgetGridItem.sizey || DashboardComponent.DEFAULT_SIZEY;

        let index = eventMessage.gridName ? -1 : this.selectedTabIndex;
        if (eventMessage.gridName) {
            // Find the correct tab, or create a new one if needed.
            this.tabbedGrid.forEach((grid, gridIndex) => {
                if (grid.name === eventMessage.gridName) {
                    index = gridIndex;
                }
            });

            if (index < 0) {
                // Rename the default tab if it is empty.
                if (!this.tabbedGrid[0].name && !this.tabbedGrid[0].list.length) {
                    this.tabbedGrid[0].name = eventMessage.gridName;
                    index = 0;
                } else {
                    this.tabbedGrid.push({
                        list: [],
                        name: eventMessage.gridName
                    });
                    index = this.tabbedGrid.length - 1;
                }
            }
        }

        // If both col and row are set, add the widget to the grid.
        if (widgetGridItem.col && widgetGridItem.row) {
            this.tabbedGrid[index].list.push(widgetGridItem);
            return;
        }

        // Otherwise insert the widget into the first empty space in the grid.
        widgetGridItem.col = widgetGridItem.col || 1;
        widgetGridItem.row = widgetGridItem.row || 1;

        // Zero max rows or columns denotes unlimited.  Adjust the rows and columns for the widget size.
        let maxCol: number = (this.gridConfig.max_cols || Number.MAX_SAFE_INTEGER.valueOf()) - widgetGridItem.sizex + 1;
        let maxRow: number = (this.gridConfig.max_rows || Number.MAX_SAFE_INTEGER.valueOf()) - widgetGridItem.sizey + 1;

        // Find the first empty space for the widget.
        let xValue = 1;
        let yValue = 1;
        let found = false;
        while (yValue <= maxRow && !found) {
            xValue = 1;
            while (xValue <= maxCol && !found) {
                widgetGridItem.col = xValue;
                widgetGridItem.row = yValue;
                found = this.widgetFits(widgetGridItem);
                xValue++;
            }
            yValue++;
        }

        this.tabbedGrid[index].list.push(widgetGridItem);
    }

    changeFavicon() {
        let favicon = document.createElement('link');
        let faviconShortcut = document.createElement('link');
        let title = document.createElement('title');
        let head = document.querySelector('head');

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

    changeFilterTrayIcon() {
        this.filtersIcon = this.isFiltered() ? 'filters_active' : 'filters';
        // TODO Does this function really have to return a boolean value?
        return true;
    }

    /**
     * Clears the grid.
     */
    private clearDashboard() {
        this.selectedTabIndex = 0;
        this.tabbedGrid = [{
            list: [],
            name: ''
        }];
    }

    /**
     * Contracts the given widget to its previous size.
     *
     * @arg {{widgetGridItem:NeonGridItem}} eventMessage
     */
    @DashboardModified()
    private contractWidget(eventMessage: { widgetGridItem: NeonGridItem }) {
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
    @DashboardModified()
    private deleteWidget(eventMessage: { id: string }) {
        for (let index = 0; index < this.tabbedGrid[this.selectedTabIndex].list.length; index++) {
            if (this.tabbedGrid[this.selectedTabIndex].list[index].id === eventMessage.id) {
                // Update the grid item itself so that its status is saved within the dashboard's layoutObject.
                this.tabbedGrid[this.selectedTabIndex].list[index].hide = true;
                this.tabbedGrid[this.selectedTabIndex].list.splice(index, 1);
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
    @DashboardModified()
    private expandWidget(eventMessage: { widgetGridItem: NeonGridItem }) {
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
     * @private
     */
    private findAutoShowDashboard(dashboard: NeonDashboardConfig): NeonDashboardConfig {
        if (dashboard.options && dashboard.options.connectOnLoad) {
            return dashboard;
        } else {
            const choices = dashboard.choices || {};
            for (let choiceKey of Object.keys(choices)) {
                let nestedDashboard = this.findAutoShowDashboard(choices[choiceKey]);
                if (nestedDashboard) {
                    return nestedDashboard;
                }
            }
        }
    }

    /**
     * Returns the grid element.
     *
     * @return {object}
     * @private
     */
    private getGridElement() {
        /* eslint-disable-next-line dot-notation */
        return this.grid['_ngEl'];
    }

    /**
     * Returns the 1-based index of the last column occupied.  Thus, for a 10 column grid, 10 would be the
     * largest possble max column in use.  If no columns are filled (i.e., an empty grid), 0 is returned.
     */
    private getMaxColInUse(): number {
        let maxCol = 0;

        for (let widgetGridItem of this.tabbedGrid[this.selectedTabIndex].list) {
            maxCol = Math.max(maxCol, (widgetGridItem.col + widgetGridItem.sizex - 1));
        }
        return maxCol;
    }

    /**
     * Returns the 1-based index of the last row occupied.  Thus, for a 10 row grid, 10 would be the
     * largest possble max row in use.  If no rows are filled (i.e., an empty grid), 0 is returned.
     */
    private getMaxRowInUse(): number {
        let maxRow = 0;

        for (let widgetGridItem of this.tabbedGrid[this.selectedTabIndex].list) {
            maxRow = Math.max(maxRow, (widgetGridItem.row + widgetGridItem.sizey - 1));
        }
        return maxRow;
    }

    /**
     * Returns the visible row count.
     *
     * @return {number}
     */
    private getVisibleRowCount(): number {
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
    private handleDashboardError(eventMessage: { error: Error | ExceptionInformation, message: string }) {
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
    @DashboardModified()
    private moveWidgetToBottom(eventMessage: { widgetGridItem: NeonGridItem }) {
        eventMessage.widgetGridItem.row = this.getMaxRowInUse() + 1;
    }

    /**
     * Moves the given widget to the top of the grid.
     *
     * @arg {{widgetGridItem:NeonGridItem}} eventMessage
     */
    @DashboardModified()
    private moveWidgetToTop(eventMessage: { widgetGridItem: NeonGridItem }) {
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
        this.resizeGrid();
    }

    ngOnDestroy(): void {
        this.messageReceiver.unsubscribeAll();
    }

    ngOnInit(): void {
        this.messageReceiver.subscribe(eventing.channels.DATASET_UPDATED, this.dataAvailableDashboard.bind(this));
        this.messageReceiver.subscribe(neonEvents.DASHBOARD_ERROR, this.handleDashboardError.bind(this));
        this.messageReceiver.subscribe(neonEvents.DASHBOARD_READY, this.showDashboardStateOnPageLoad.bind(this));
        this.messageReceiver.subscribe(neonEvents.DASHBOARD_RESET, this.clearDashboard.bind(this));
        this.messageReceiver.subscribe(neonEvents.DASHBOARD_STATE, this.showDashboardState.bind(this));
        this.messageReceiver.subscribe(neonEvents.SHOW_OPTION_MENU, this.openOptionMenu.bind(this));
        this.messageReceiver.subscribe(neonEvents.TOGGLE_FILTER_TRAY, this.updateShowFilterTray.bind(this));
        this.messageReceiver.subscribe(neonEvents.TOGGLE_VISUALIZATIONS_SHORTCUT, this.updateShowVisualizationsShortcut.bind(this));
        this.messageReceiver.subscribe(neonEvents.WIDGET_ADD, this.addWidget.bind(this));
        this.messageReceiver.subscribe(neonEvents.WIDGET_DELETE, this.deleteWidget.bind(this));
        this.messageReceiver.subscribe(neonEvents.WIDGET_CONTRACT, this.contractWidget.bind(this));
        this.messageReceiver.subscribe(neonEvents.WIDGET_EXPAND, this.expandWidget.bind(this));
        this.messageReceiver.subscribe(neonEvents.WIDGET_MOVE_TO_BOTTOM, this.moveWidgetToBottom.bind(this));
        this.messageReceiver.subscribe(neonEvents.WIDGET_MOVE_TO_TOP, this.moveWidgetToTop.bind(this));
        this.messageReceiver.subscribe(neonEvents.WIDGET_REGISTER, this.registerWidget.bind(this));
        this.messageReceiver.subscribe(neonEvents.WIDGET_UNREGISTER, this.unregisterWidget.bind(this));
        this.messageReceiver.subscribe(neonEvents.FILTERS_CHANGED, this.generalChange.bind(this));
        this.messageReceiver.subscribe(neonEvents.WIDGET_CONFIGURED, this.generalChange.bind(this));
    }

    @DashboardModified()
    onDragStop(__index, __event) {
        // Do nothing.
    }

    onResizeStart(index, __event) {
        this.visualizations.toArray()[index].onResizeStart();
    }

    @DashboardModified()
    onResizeStop(index, __event) {
        this.visualizations.toArray()[index].onResizeStop();
    }

    /**
     * Opens the option menu.
     *
     * @private
     */
    private openOptionMenu() {
        this.setPanel('gear', 'Component Settings');
        this.sideNavRight.toggle();
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
     * Refreshes all of the visualizations in the dashboard.
     */
    public refreshDashboard() {
        this.updatedData = 0;
        this.messageSender.publish(neonEvents.DASHBOARD_REFRESH, {});
    }

    /**
     * Resizes the grid.
     */
    private resizeGrid() {
        this.grid.triggerResize();
    }

    /**
     * Indicates to the dashboard that there is new data available
     */
    dataAvailableDashboard(event: { message: MessageEvent }) {
        this.updatedData += (JSON.parse(event.message.data).count || 1);
    }

    /**
     * Registers the given widget with the given ID.
     *
     * @arg {{id:string,widget:BaseNeonComponent}} eventMessage
     */
    @DashboardModified()
    private registerWidget(eventMessage: { id: string, widget: BaseNeonComponent }) {
        if (this.widgets.get(eventMessage.id) === undefined) {
            if (this.pendingInitialRegistrations > 0) {
                this.pendingInitialRegistrations -= 1;
            }
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
        } else if (newPanel === 'customConnection' && !this.createCustomConnection) {
            this.createCustomConnection = true;
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
     * @private
     */
    private showDashboardState(eventMessage: { dashboard: NeonDashboardConfig }) {
        this.currentDashboard = eventMessage.dashboard;

        // TODO THOR-1062 Permit multiple datastores.
        const firstName = Object.keys(this.dashboardService.datastores)[0];
        this.dashboardService.setActiveDatastore(this.dashboardService.datastores[firstName]);

        this.dashboardService.state.dashboard = eventMessage.dashboard;

        this.messageSender.publish(neonEvents.DASHBOARD_RESET, {});

        this.filterService.setFiltersFromConfig(eventMessage.dashboard.filters || [], this.dashboardService.state, this.searchService);

        this.pendingInitialRegistrations = 0;

        const layout = this.dashboardService.layouts[this.dashboardService.state.getLayout()];

        // Should map the grid name to the layout list.
        let gridNameToLayout = !Array.isArray(layout) ? layout : { '': layout };

        Object.keys(gridNameToLayout).forEach((gridName) => {
            let layout = gridNameToLayout[gridName] || [];
            layout.forEach((widgetGridItem) => {
                if (!widgetGridItem.hide) {
                    this.pendingInitialRegistrations += 1;
                    this.messageSender.publish(neonEvents.WIDGET_ADD, {
                        gridName: gridName,
                        widgetGridItem: widgetGridItem
                    });
                }
            });
        });

        this.simpleFilter.updateSimpleFilterConfig();
        this.toggleDashboardSelectorDialog(false);
    }

    /**
     * Shows the dashboard state on page load, if any.
     *
     * @private
     */
    private showDashboardStateOnPageLoad() {
        let dashboard = this.findAutoShowDashboard(this.dashboards);

        const firstDataStore = dashboard && Object.values(this.dashboardService.datastores)[0];

        if (dashboard && firstDataStore) {
            this.messageSender.publish(neonEvents.DASHBOARD_STATE, {
                dashboard
            });
        } else {
            this.toggleDashboardSelectorDialog(true);
        }
    }

    /**
     * Unregisters the widget with the given ID.
     *
     * @arg {{id:string}} eventMessage
     */
    @DashboardModified()
    private unregisterWidget(eventMessage: { id: string }) {
        this.widgets.delete(eventMessage.id);
    }

    /**
     * Updates the showVisualizationsShortcut boolean value from the messenger channel
     *
     * @arg {{show:boolean}} eventMessage
     */
    private updateShowVisualizationsShortcut(eventMessage: { show: boolean }) {
        this.showVisualizationsShortcut = eventMessage.show;
    }

    /**
     * Updates the showFilterTray boolean value from the messenger channel
     *
     * @arg {{show:boolean}} eventMessage
     */
    private updateShowFilterTray(eventMessage: { show: boolean }) {
        this.showFilterTray = eventMessage.show;
    }

    /**
     * This function determines if a widget will overlap any existing grid items if placed
     * at the given row and column.  This function assumes the given widget has valid sizes.
     * @arg widgetGridItem The widget to place
     */
    private widgetFits(widgetGridItem: NeonGridItem) {
        for (let existingWidgetGridItem of this.tabbedGrid[this.selectedTabIndex].list) {
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
    private widgetOverlaps(one: NeonGridItem, two: NeonGridItem) {
        if (one.col > (two.col + two.sizex - 1) || two.col > (one.col + one.sizex - 1)) {
            return false;
        }
        if (one.row > (two.row + two.sizey - 1) || two.row > (one.row + one.sizey - 1)) {
            return false;
        }
        return true;
    }
}
