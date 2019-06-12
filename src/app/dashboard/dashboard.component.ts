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
import { GridState } from '../model/grid-state';
import { ConfigurableWidget } from '../model/widget-option';
import { DashboardState } from '../model/dashboard-state';

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

    updatedData = 0;

    configurableComponent: ConfigurableWidget;

    currentPanel: string;
    showCustomConnectionButton: boolean = false;
    showFiltersComponent: boolean = false;
    showFilterTray: boolean = false;

    // Toolbar
    showVisualizationsShortcut: boolean = true;
    showDashboardSelector: boolean = false;

    rightPanelTitle: string;

    createFiltersComponent: boolean = false; // This is used to create the Filters Component later

    pendingInitialRegistrations = 0;

    widgets: Map<string, BaseNeonComponent> = new Map();

    gridConfig: NgGridConfig = {
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

    filtersIcon: string;

    // Use two messengers here because a single messager doesn't receive its own messages.
    messageReceiver: eventing.Messenger;
    messageSender: eventing.Messenger;

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
        public snackBar: MatSnackBar,
        public widgetService: AbstractWidgetService,
        public viewContainerRef: ViewContainerRef
    ) {
        this.messageReceiver = new eventing.Messenger();
        this.messageSender = new eventing.Messenger();

        this.matIconRegistry.addSvgIcon(
            'filters',
            this.domSanitizer.bypassSecurityTrustResourceUrl('./assets/icons/dashboard/filters.svg')
        );

        this.matIconRegistry.addSvgIcon(
            'filters_active',
            this.domSanitizer.bypassSecurityTrustResourceUrl('./assets/icons/dashboard/filters_active.svg')
        );

        this.matIconRegistry.addSvgIcon(
            'dashboard_selector',
            this.domSanitizer.bypassSecurityTrustResourceUrl('./assets/icons/dashboard/database_icon.svg')
        );

        this.filtersIcon = 'filters';
        this.showFilterTray = true;
        this.showCustomConnectionButton = true;
        this.snackBar = snackBar;

        this.dashboardService.configSource.subscribe((config) => this.onConfigChange(config));
        this.dashboardService.stateSource.subscribe((state) => this.onDashboardStateChange(state));
    }


    get currentDashboard() {
        return this.dashboardService.state.dashboard;
    }

    get gridState() {
        return this.dashboardService.gridState;
    }

    /**
     * Fires whenever config changes
     */
    private onConfigChange(config: NeonConfig) {
        if (config.errors && config.errors.length > 0) {
            let snackBarRef = this.snackBar.openFromComponent(SnackBarComponent, {
                viewContainerRef: this.viewContainerRef
            });
            snackBarRef.instance.snackBarRef = snackBarRef;
            snackBarRef.instance.addErrors('Configuration Errors', config.errors);
        }

        this.setTitleAndIcon(
            config.projectTitle || 'Neon',
            config.projectIcon || 'assets/favicon.blue.ico?v=1'
        );

        const dashboard = DashboardComponent.findAutoShowDashboard(config.dashboards) as NeonDashboardLeafConfig;

        if (dashboard) {
            this.dashboardService.setActiveDashboard(dashboard);
        } else {
            this.toggleDashboardSelectorDialog(true);
        }
    }

    /**
     * Fires whenever a dashboard state changes
     */
    private onDashboardStateChange(state: DashboardState) {
        this.gridState.clear();
        this.widgets.clear();
        this.changeDetection.detectChanges();

        this.pendingInitialRegistrations = 0;

        const layout = this.dashboardService.config.layouts[state.getLayout()];

        const pairs = GridState.getAllGridItems(layout);
        this.pendingInitialRegistrations = pairs.length;

        for (const pair of pairs) {
            this.messageSender.publish(neonEvents.WIDGET_ADD, pair);
        }

        this.simpleFilter.updateSimpleFilterConfig();
        this.toggleDashboardSelectorDialog(false);

        this.refreshDashboard();
    }

    setTitleAndIcon(titleText: string, icon: string) {
        document.title = titleText;

        let head = document.querySelector('head');

        head.querySelectorAll('link[type="image/x-icon"]').forEach((link: HTMLLinkElement) => {
            link.parentNode.removeChild(link); // Remove all favicons
        });

        for (const rel of ['icon', 'shortcut icon']) {
            let favicon = document.createElement('link');
            favicon.setAttribute('rel', rel);
            favicon.setAttribute('type', 'image/x-icon');
            favicon.setAttribute('href', icon);
            head.appendChild(favicon);
        }
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
        this.messageReceiver.subscribe(neonEvents.SHOW_OPTION_MENU, (comp: ConfigurableWidget) => {
            this.setPanel('gear', 'Component Settings');
            this.configurableComponent = comp;
        });
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
    refreshDashboard() {
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
