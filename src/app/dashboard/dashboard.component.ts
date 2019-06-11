/**
 * Copyright 2019 Next Century Corporation
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

import { AbstractSearchService } from '../services/abstract.search.service';
import { AbstractWidgetService } from '../services/abstract.widget.service';
import { BaseNeonComponent } from '../components/base-neon-component/base-neon.component';
import { DashboardService } from '../services/dashboard.service';
import { DomSanitizer } from '@angular/platform-browser';
import { FilterService } from '../services/filter.service';
import { MatSnackBar, MatSidenav } from '@angular/material';
import { MatIconRegistry } from '@angular/material/icon';
import { NeonGridItem } from '../model/neon-grid-item';
import { NeonDashboardConfig, NeonConfig, NeonDashboardLeafConfig } from '../model/types';
import { neonEvents } from '../model/neon-namespaces';
import { NgGrid, NgGridConfig } from 'angular2-grid';
import { SimpleFilterComponent } from '../components/simple-filter/simple-filter.component';
import { SnackBarComponent } from '../components/snack-bar/snack-bar.component';
import { VisualizationContainerComponent } from '../components/visualization-container/visualization-container.component';
import { ConfigService } from '../services/config.service';
import { GridState } from '../model/grid-state';

export function DashboardModified() {
    return (__inst: any, __prop: string | symbol, descriptor) => {
        const fn = descriptor.value;
        descriptor.value = function(this: DashboardComponent, ...args: any[]) {
            if (!this.pendingInitialRegistrations) {
                this.dashboardService.state.modified = true;
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
    @ViewChild(NgGrid) grid: NgGrid;
    @ViewChildren(VisualizationContainerComponent) visualizations: QueryList<VisualizationContainerComponent>;
    @ViewChild(SimpleFilterComponent) simpleFilter: SimpleFilterComponent;
    @ViewChild(MatSidenav) sideNavRight: MatSidenav;

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
    public currentDashboard: NeonDashboardLeafConfig;
    public pendingInitialRegistrations = 0;

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

    /**
     * Finds and returns the Dashboard to automatically show on page load, or null if no such dashboard exists.
     */
    static findAutoShowDashboard(dashboard: NeonDashboardConfig): NeonDashboardConfig {
        if ('options' in dashboard && dashboard.options.connectOnLoad) {
            return dashboard;
        }
        const choices = ('choices' in dashboard ? dashboard.choices : {}) || {};
        for (let choiceKey of Object.keys(choices)) {
            let nestedDashboard = this.findAutoShowDashboard(choices[choiceKey]);
            if (nestedDashboard) {
                return nestedDashboard;
            }
        }
    }

    constructor(
        public changeDetection: ChangeDetectorRef,
        public dashboardService: DashboardService,
        private domSanitizer: DomSanitizer,
        public filterService: FilterService,
        private matIconRegistry: MatIconRegistry,
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

        let first = true;

        this.configService.getActive().subscribe((neonConfig) => {
            // TODO: Default to false and set to true only after a dataset has been selected.

            this.dashboardService.state.modified = false;

            if (!first) {
                this.gridState.clear();
                this.widgets.clear();
                this.changeDetection.detectChanges();
            } else {
                first = false;
            }

            const config = neonConfig;
            this.messageSender.publish(neonEvents.DASHBOARD_REFRESH, {});

            // The dashboards are read from the config file in the DashboardService's constructor.
            this.dashboards = this.dashboardService.config.dashboards;
            this.dashboardVersion = config.version || '';

            if (config) {
                if (config.errors && config.errors.length > 0) {
                    let snackBarRef = this.snackBar.openFromComponent(SnackBarComponent, {
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

    public get gridState() {
        return this.dashboardService.gridState;
    }

    @DashboardModified()
    private generalChange() {
        // Do nothing
    }

    /**
     * Adds the given widget to the grid in its specified column and row or in the first open space if no column and row are specified.
     */
    @DashboardModified()
    private addWidget(eventMessage: { gridName?: string, widgetGridItem: NeonGridItem }) {
        this.gridState.add(eventMessage.widgetGridItem, eventMessage.gridName);
    }

    changeFavicon() {
        let favicon = document.createElement('link');
        let faviconShortcut = document.createElement('link');
        let title = document.createElement('title');
        let head = document.querySelector('head');

        head.querySelectorAll('link[type="image/x-icon"]').forEach((link: HTMLLinkElement) => {
            link.parentNode.removeChild(link); // Remove all favicons
        });

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
     * Contracts the given widget to its previous size.
     */
    @DashboardModified()
    private contractWidget(eventMessage: { widgetGridItem: NeonGridItem }) {
        this.gridState.contract(eventMessage.widgetGridItem);
    }

    /**
     * Deletes the widget with the given ID from the grid.
     */
    @DashboardModified()
    private deleteWidget(eventMessage: { id: string }) {
        this.gridState.delete(eventMessage.id);
    }

    @DashboardModified()
    private clearDashboard() {
        this.gridState.clear();
    }

    disableClose(): boolean {
        return this.currentPanel === 'gear';
    }

    /**
     * Expands the given widget to fill the width of the grid.
     */
    @DashboardModified()
    private expandWidget(eventMessage: { widgetGridItem: NeonGridItem }) {
        this.gridState.expand(eventMessage.widgetGridItem, this.getVisibleRowCount());
    }

    /**
     * Returns the grid element.
     */
    private getGridElement() {
        /* eslint-disable-next-line dot-notation */
        return this.grid['_ngEl'];
    }

    /**
     * Returns the visible row count.
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
     */
    private handleDashboardError(eventMessage: { error: Error | ExceptionInformation, message: string }) {
        // TODO THOR-916
        console.error('An error occured: ' + eventMessage.message + '\n' + eventMessage.error);
        this.snackBar.open(eventMessage.message, 'Ok');
    }

    private isFiltered(): boolean {
        return !!this.filterService.getFilters().length;
    }

    /**
     * Moves the given widget to the bottom of the grid.
     */
    @DashboardModified()
    private moveWidgetToBottom(eventMessage: { widgetGridItem: NeonGridItem }) {
        this.gridState.moveToBottom(eventMessage.widgetGridItem);
    }

    /**
     * Moves the given widget to the top of the grid.
     */
    @DashboardModified()
    private moveWidgetToTop(eventMessage: { widgetGridItem: NeonGridItem }) {
        this.gridState.moveToTop(eventMessage.widgetGridItem);
    }

    ngAfterViewInit() {
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
        this.messageReceiver.subscribe(
            neonEvents.SHOW_OPTION_MENU,
            this.setPanel.bind(this, 'gear', 'Component Settings')
        );
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

    toggleFiltersDialog() {
        // Added this to create the filters component at first click so it's after dataset initialization
        if (!this.createFiltersComponent) {
            this.createFiltersComponent = true;
        }
        this.showFiltersComponent = !this.showFiltersComponent;
        let filtersContainer: HTMLElement = document.getElementById('filters');
        if (this.showFiltersComponent && filtersContainer) {
            filtersContainer.setAttribute('style', 'display: show'); // FIXME: Display show is not valid
        } else if (filtersContainer) {
            filtersContainer.setAttribute('style', 'display: none');
        }
    }

    toggleDashboardSelectorDialog(showSelector: boolean) {
        this.showDashboardSelector = showSelector;
        let dashboardSelectorContainer: HTMLElement = document.getElementById('dashboard.selector');
        if (this.showDashboardSelector && dashboardSelectorContainer) {
            dashboardSelectorContainer.setAttribute('style', 'display: show'); // FIXME: Display show is not valid
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
     */
    @DashboardModified()
    private registerWidget(eventMessage: { id: string, widget: BaseNeonComponent }) {
        if (!this.widgets.has(eventMessage.id)) {
            if (this.pendingInitialRegistrations > 0) {
                this.pendingInitialRegistrations -= 1;
            }
            this.widgets.set(eventMessage.id, eventMessage.widget);
        }
    }

    setPanel(newPanel: string, newTitle: string) {
        this.currentPanel = newPanel;
        this.rightPanelTitle = newTitle;
        this.sideNavRight.open();
    }

    /**
     * Shows the given dashboard using the given datastores and the given layout.
     */
    private showDashboardState(eventMessage: { dashboard: NeonDashboardLeafConfig }) {
        this.currentDashboard = eventMessage.dashboard;

        // TODO THOR-1062 Permit multiple datastores.
        const firstName = Object.keys(this.dashboardService.config.datastores).sort((ds1, ds2) => ds1.localeCompare(ds2))[0];
        this.dashboardService.setActiveDatastore(this.dashboardService.config.datastores[firstName]);
        this.dashboardService.setActiveDashboard(this.currentDashboard);

        this.messageSender.publish(neonEvents.DASHBOARD_RESET, {});

        this.filterService.setFiltersFromConfig(this.currentDashboard.filters || [], this.dashboardService.state, this.searchService);

        this.pendingInitialRegistrations = 0;

        const layout = this.dashboardService.config.layouts[this.dashboardService.state.getLayout()];

        const pairs = GridState.getAllGridItems(layout);
        this.pendingInitialRegistrations = pairs.length;

        for (const pair of pairs) {
            this.messageSender.publish(neonEvents.WIDGET_ADD, pair);
        }

        this.simpleFilter.updateSimpleFilterConfig();
        this.toggleDashboardSelectorDialog(false);
    }

    /**
     * Shows the dashboard state on page load, if any.
     */
    private showDashboardStateOnPageLoad() {
        let dashboard = DashboardComponent.findAutoShowDashboard(this.dashboards);

        const firstDataStore = dashboard && Object.values(this.dashboardService.config.datastores)
            .sort((ds1, ds2) => ds1.name.localeCompare(ds2.name))[0];

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
     */
    @DashboardModified()
    private unregisterWidget(eventMessage: { id: string }) {
        this.widgets.delete(eventMessage.id);
    }

    /**
     * Updates the showVisualizationsShortcut boolean value from the messenger channel
     */
    private updateShowVisualizationsShortcut(eventMessage: { show: boolean }) {
        this.showVisualizationsShortcut = eventMessage.show;
    }

    /**
     * Updates the showFilterTray boolean value from the messenger channel
     */
    private updateShowFilterTray(eventMessage: { show: boolean }) {
        this.showFilterTray = eventMessage.show;
    }
}
