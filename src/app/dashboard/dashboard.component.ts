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
    ElementRef
} from '@angular/core';

import { eventing } from 'neon-framework';

import { InjectableColorThemeService } from '../services/injectable.color-theme.service';
import { VisualizationWidget } from '../models/visualization-widget';
import { DashboardService } from '../services/dashboard.service';
import { DomSanitizer } from '@angular/platform-browser';
import { InjectableFilterService } from '../services/injectable.filter.service';
import { MatSnackBar, MatSidenav } from '@angular/material';
import { MatIconRegistry } from '@angular/material/icon';
import { NeonGridItem } from '../models/neon-grid-item';
import { NeonConfig } from '../models/types';
import { neonEvents } from '../models/neon-namespaces';
import { NgGrid, NgGridConfig } from 'angular2-grid';
import { SimpleSearchFilterComponent } from '../components/simple-search-filter/simple-search-filter.component';
import { VisualizationContainerComponent } from '../components/visualization-container/visualization-container.component';
import { GridState } from '../models/grid-state';
import { ConfigurableWidget } from '../models/widget-option-collection';
import { DashboardState } from '../models/dashboard-state';
import { Router } from '@angular/router';
import { ConfigUtil } from '../util/config.util';
import { ContextMenuComponent } from 'ngx-contextmenu';
import { Subject, fromEvent } from 'rxjs';
import { Location } from '@angular/common';
import { distinctUntilKeyChanged, takeUntil } from 'rxjs/operators';
import { DateUtil } from 'nucleus/dist/core/date.util';

import * as _ from 'lodash';

export function DashboardModified() {
    return (__inst: any, __prop: string | symbol, descriptor) => {
        const fn = descriptor.value;
        descriptor.value = function(this: DashboardComponent, ...args: any[]) {
            this.trackDashboardModify();
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
    @ViewChild(NgGrid, { static: true }) grid: NgGrid;
    @ViewChildren(VisualizationContainerComponent) visualizations: QueryList<VisualizationContainerComponent>;
    @ViewChild(SimpleSearchFilterComponent, { static: true }) simpleFilter: SimpleSearchFilterComponent;
    @ViewChild(MatSidenav, { static: true }) sideNavRight: MatSidenav;
    @ViewChild('scrollable', { static: true }) scrollArea: ElementRef;

    @ViewChild(ContextMenuComponent, { static: true }) contextMenu: ContextMenuComponent;

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

    widgets: Map<string, VisualizationWidget> = new Map();

    movingWidgets = false;
    globalMoveWidgets = false;

    destroy = new Subject();

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

    // Use two messengers here because a single messager doesn't receive its own messages.
    messageReceiver: eventing.Messenger;
    messageSender: eventing.Messenger;

    private currentDashboardId: string[];

    private _filterChangeData: {
        callerId: string;
    };

    constructor(
        public changeDetection: ChangeDetectorRef,
        public dashboardService: DashboardService,
        private domSanitizer: DomSanitizer,
        public filterService: InjectableFilterService,
        private matIconRegistry: MatIconRegistry,
        public snackBar: MatSnackBar,
        public colorThemeService: InjectableColorThemeService,
        public router: Router,
        public location: Location
    ) {
        this.messageReceiver = new eventing.Messenger();
        this.messageSender = new eventing.Messenger();

        this.matIconRegistry.addSvgIcon(
            'neon_filter',
            this.domSanitizer.bypassSecurityTrustResourceUrl('./assets/icons/dashboard/create_filter.svg')
        );

        this.matIconRegistry.addSvgIcon(
            'neon_data',
            this.domSanitizer.bypassSecurityTrustResourceUrl('./assets/icons/dashboard/database_icon.svg')
        );

        this.showFilterTray = true;
        this.showCustomConnectionButton = true;

        this.dashboardService.configSource
            .subscribe((config) => this.onConfigChange(config));
        this.dashboardService.stateSource
            .subscribe((state) => this.onDashboardStateChange(state));
        this.dashboardService.configSource
            .pipe(distinctUntilKeyChanged('fileName'))
            .subscribe((config) => {
                this.setTitleAndIcon(
                    config.projectTitle || 'Neon',
                    config.projectIcon || 'assets/favicon.blue.ico?v=1'
                );
            });
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
            config.errors.forEach((error) => {
                this.handleDashboardMessage({
                    error: error,
                    message: 'Configuration Error'
                });
            });
            config.errors = [];
        }
    }

    /**
     * Fires whenever a dashboard state changes
     */
    private onDashboardStateChange(state: DashboardState) {
        // Validate url first
        const currentFilter = this.dashboardService.getFiltersToSaveInURL();
        const { dashboard, filters, paths } = ConfigUtil.getUrlState(window.location);
        if ((!filters && currentFilter) || !dashboard) {
            this.location.replaceState('?dashboard=' + paths.join('/') + '#' + currentFilter);
        }

        // Clean on different dashboard
        if (!_.isEqual(this.currentDashboardId, state.id)) {
            this.dashboardService.state.modified = false;

            this.pendingInitialRegistrations = this.widgets.size;

            this.gridState.clear();
            this.widgets.clear();
            this.changeDetection.detectChanges();

            this.colorThemeService.initializeColors(state.getOptions().colorMaps);

            const layout = this.dashboardService.config.layouts[state.getLayout()];

            const pairs = GridState.getAllGridItems(layout);
            this.pendingInitialRegistrations = pairs.length;

            for (const pair of pairs) {
                this.messageSender.publish(neonEvents.WIDGET_ADD, pair);
            }

            this.simpleFilter.updateSimpleFilterDesign();
            this.showDashboardSelector = false;
            this.refreshDashboard();
        } else if (this._filterChangeData) {
            this.filterService.notifyFilterChangeListeners(this._filterChangeData.callerId);
            this._filterChangeData = null;
        }

        this.currentDashboardId = state.id;
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

    trackDashboardModify() {
        if (!this.pendingInitialRegistrations) {
            this.dashboardService.state.modified = true;
        }
        setTimeout(() => this.enforceScrollingState(), 100);
    }

    enforceScrollingState() {
        // Track scrolling state for dashboard
        const scrollNode = this.scrollArea.nativeElement as HTMLDivElement;
        const isScrolling = (scrollNode.scrollHeight > scrollNode.clientHeight);

        if (
            (isScrolling && !scrollNode.classList.contains('scrolling')) ||
            (!isScrolling && scrollNode.classList.contains('scrolling'))
        ) {
            scrollNode.classList.toggle('scrolling');
            this.grid.triggerResize();
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
    private addWidget(event: { gridName?: string, widgetGridItem: NeonGridItem }) {
        this.gridState.add(event.widgetGridItem, event.gridName);
    }

    /**
     * Contracts the given widget to its previous size.
     */
    @DashboardModified()
    private contractWidget(event: { widgetGridItem: NeonGridItem }) {
        this.gridState.contract(event.widgetGridItem);
    }

    /**
     * Deletes the widget with the given ID from the grid.
     */
    @DashboardModified()
    public deleteWidget(event: { id: string }) {
        this.gridState.delete(event.id);
    }

    disableClose(): boolean {
        return this.currentPanel === 'gear';
    }

    /**
     * Expands the given widget to fill the width of the grid.
     */
    @DashboardModified()
    private expandWidget(event: { widgetGridItem: NeonGridItem }) {
        this.gridState.expand(event.widgetGridItem, this.getVisibleRowCount());
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
    private handleDashboardMessage(event: { error?: any, message: string }) {
        // Errors may be strings or objects.  NUCLEUS Server errors have a responseJSON property.  JS Error objects have a message property.
        let errorLabel = !event.error ? '' : (typeof event.error === 'string' ? event.error : (event.error.responseJSON ?
            (event.error.responseJSON.status + ' ' + event.error.responseJSON.error + ' ' + event.error.responseJSON.trace[0]) :
            (event.error.message || '')));
        let errorTrace = (event.error && event.error.responseJSON) ? event.error.responseJSON.trace : event.error;

        let wholeMessage = event.message + (errorLabel ? (': ' + errorLabel) : '');

        if (event.error) {
            console.error('[DASHBOARD ERROR] ' + wholeMessage, errorTrace);
        } else {
            console.warn('[DASHBOARD MESSAGE] ' + wholeMessage);
        }

        setTimeout(() => {
            this.snackBar.open(wholeMessage, 'OK', {
                verticalPosition: 'top'
            });
        });
    }

    /**
     * Moves the given widget to the bottom of the grid.
     */
    @DashboardModified()
    private moveWidgetToBottom(event: { widgetGridItem: NeonGridItem }) {
        this.gridState.moveToBottom(event.widgetGridItem);
    }

    /**
     * Moves the given widget to the top of the grid.
     */
    @DashboardModified()
    private moveWidgetToTop(event: { widgetGridItem: NeonGridItem }) {
        this.gridState.moveToTop(event.widgetGridItem);
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

    get menuRoot(): HTMLElement {
        const root: HTMLElement = document.querySelector('context-menu-content');
        return root && !root.hidden ? root : undefined;
    }

    ngOnDestroy(): void {
        this.messageReceiver.unsubscribeAll();
        this.destroy.next();
    }

    ngOnInit(): void {
        fromEvent(document, 'mousemove')
            .pipe(takeUntil(this.destroy))
            .subscribe((ev: MouseEvent) => {
                this.movingWidgets = this.globalMoveWidgets || (ev.metaKey || ev.altKey) && ev.shiftKey;
            });

        fromEvent(document, 'keydown')
            .pipe(takeUntil(this.destroy))
            .subscribe((ev: KeyboardEvent) => {
                if ((ev.key === 'Shift' && (ev.metaKey || ev.altKey) || (ev.key === 'Meta' || ev.key === 'Alt') && ev.shiftKey) &&
                    !(ev.target instanceof HTMLInputElement || ev.target instanceof HTMLTextAreaElement)) {
                    this.movingWidgets = this.globalMoveWidgets || true;
                }
            });

        fromEvent(document, 'keyup')
            .pipe(takeUntil(this.destroy))
            .subscribe((ev: KeyboardEvent) => {
                if (ev.key === 'Shift' || ev.key === 'Alt' || ev.key === 'Meta') {
                    this.movingWidgets = this.globalMoveWidgets || false;
                }
            });

        this.contextMenu.open
            .pipe(takeUntil(this.destroy))
            .subscribe(() => {
                // eslint-disable-next-line @typescript-eslint/unbound-method
                fromEvent(document, 'mousedown')
                    .pipe(
                        takeUntil(this.destroy),
                        takeUntil(this.contextMenu.close)
                    )
                    .subscribe((ev: MouseEvent) => {
                        const root = this.menuRoot;
                        if (root && !root.contains(ev.target as HTMLElement)) {
                            document.dispatchEvent(new MouseEvent('click'));
                        }
                    });
            });

        this.filterService.overrideFilterChangeNotifier(this.onFiltersChanged.bind(this));
        this.messageReceiver.subscribe(eventing.channels.DATASET_UPDATED, this.dataAvailableDashboard.bind(this));
        this.messageReceiver.subscribe(neonEvents.DASHBOARD_MESSAGE, this.handleDashboardMessage.bind(this));
        this.messageReceiver.subscribe(neonEvents.TOGGLE_FILTER_TRAY, this.updateShowFilterTray.bind(this));
        this.messageReceiver.subscribe(neonEvents.TOGGLE_VISUALIZATIONS_SHORTCUT, this.updateShowVisualizationsShortcut.bind(this));
        this.messageReceiver.subscribe(neonEvents.TOGGLE_LOCAL_TIMES, this.updateShowLocalTimes.bind(this));
        this.messageReceiver.subscribe(neonEvents.WIDGET_ADD, this.addWidget.bind(this));
        this.messageReceiver.subscribe(neonEvents.WIDGET_DELETE, this.deleteWidget.bind(this));
        this.messageReceiver.subscribe(neonEvents.WIDGET_CONTRACT, this.contractWidget.bind(this));
        this.messageReceiver.subscribe(neonEvents.WIDGET_EXPAND, this.expandWidget.bind(this));
        this.messageReceiver.subscribe(neonEvents.WIDGET_MOVE_TO_BOTTOM, this.moveWidgetToBottom.bind(this));
        this.messageReceiver.subscribe(neonEvents.WIDGET_MOVE_TO_TOP, this.moveWidgetToTop.bind(this));
        this.messageReceiver.subscribe(neonEvents.WIDGET_REGISTER, this.registerWidget.bind(this));
        this.messageReceiver.subscribe(neonEvents.WIDGET_UNREGISTER, this.unregisterWidget.bind(this));
        this.messageReceiver.subscribe(neonEvents.SHOW_OPTION_MENU, this.showVizSettings.bind(this));
        this.messageReceiver.subscribe(neonEvents.WIDGET_CONFIGURED, this.generalChange.bind(this));

        this.onDashboardStateChange(this.dashboardService.state);
    }

    toggleGlobalMoving() {
        this.globalMoveWidgets = !this.globalMoveWidgets;
    }

    @DashboardModified()
    onFiltersChanged(callerId: string) {
        this._filterChangeData = {
            callerId: callerId
        };
        const { paths } = ConfigUtil.getUrlState(window.location);
        this.router.navigate(['/'], {
            fragment: this.dashboardService.getFiltersToSaveInURL(),
            queryParams: {
                dashboard: paths.join('/')
            },
            relativeTo: this.router.routerState.root
        });
    }

    @DashboardModified()
    onDragStop(__index, __event) {
        // Do nothing.
    }

    onResizeStart(index, __event) {
        this.visualizations.toArray()[index].onResizeStart();
    }

    onResize(index, __event) {
        this.visualizations.toArray()[index].onResize();
    }

    @DashboardModified()
    onResizeStop(index, __event) {
        this.visualizations.toArray()[index].onResizeStop();
    }

    toggleFiltersDialog() {
        this.showFiltersComponent = !this.showFiltersComponent;
        this.showDashboardSelector = false;
    }

    toggleDashboardSelectorDialog() {
        this.showDashboardSelector = !this.showDashboardSelector;
        this.showFiltersComponent = false;
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
     * Returns the configured (or default) display label for the custom requests navbar menu item.
     */
    public retrieveCustomRequestsDisplayLabel(): string {
        return ((this.dashboardService.state.getOptions() || {}).customRequestsDisplayLabel || 'Custom Requests');
    }

    /**
     * Returns the full dashboard title to show in the navbar.
     */
    public retrieveFullDashboardTitle(fullTitle: string[]): string {
        return (fullTitle || []).slice(1, fullTitle.length).join(' / ');
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
    private registerWidget(event: { id: string, widget: VisualizationWidget }) {
        if (!this.widgets.has(event.id)) {
            if (this.pendingInitialRegistrations > 0) {
                this.pendingInitialRegistrations -= 1;
            }
            this.widgets.set(event.id, event.widget);
        }
    }

    setPanel(newPanel: string, newTitle: string) {
        this.currentPanel = newPanel;
        this.rightPanelTitle = newPanel === 'customRequests' ? this.retrieveCustomRequestsDisplayLabel() : newTitle;
        this.sideNavRight.open();
    }

    /**
     * Returns whether to show the custom requests navbar menu item.
     */
    public showCustomRequestsMenuItem(): boolean {
        return !!((this.dashboardService.state.getOptions() || {}).customRequests || []).length;
    }

    showVizSettings(cmp: NeonGridItem) {
        this.configurableComponent = this.widgets.get(cmp.id).getWidgetOptionMenuCallbacks();
        this.setPanel('gear', 'Widget Settings');
    }

    refreshViz(item: NeonGridItem) {
        const cmp = this.widgets.get(item.id).getWidgetOptionMenuCallbacks();
        cmp.changeOptions(undefined, false);
    }

    /**
     * Unregisters the widget with the given ID.
     */
    @DashboardModified()
    private unregisterWidget(event: { id: string }) {
        this.widgets.delete(event.id);
    }

    /**
     * Updates the showVisualizationsShortcut boolean value from the messenger channel
     */
    private updateShowVisualizationsShortcut(event: { show: boolean }) {
        this.showVisualizationsShortcut = event.show;
    }

    /**
     * Updates the showLocalTimes boolean value from the messenger channel
     */
    private updateShowLocalTimes(event: { show: boolean }) {
        DateUtil.USE_LOCAL_TIME = event.show;
        this.refreshDashboard();
    }

    /**
     * Updates the showFilterTray boolean value from the messenger channel
     */
    private updateShowFilterTray(event: { show: boolean }) {
        this.showFilterTray = event.show;
    }
}
