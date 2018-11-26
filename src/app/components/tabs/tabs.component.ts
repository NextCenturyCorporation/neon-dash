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
    ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, Injector,
    ViewChild, OnInit, OnDestroy
} from '@angular/core';
import { FilterService } from '../../services/filter.service';
import { ThemesService } from '../../services/themes.service';
import { DatasetService } from '../../services/dataset.service';
import * as neon from 'neon-framework';
import {  BaseNeonOptions } from '../base-neon-component/base-neon.component';
import { ExportService } from '../../services/export.service';

/**
 * Manages configurable options for the specific visualization.
 */
export class TabsOptions extends BaseNeonOptions {
    public tabLinks: any[];
    public network: {};
    public map: {};
    public events: {};
    public people: {};
    public showOnlyFiltered: boolean;
    public startTab: any;
    public filterFields: string[];

    /**
     * Appends all the non-field bindings for the specific visualization to the given bindings object and returns the bindings object.
     *
     * @arg {any} bindings
     * @return {any}
     * @override
     */
    appendNonFieldBindings(bindings: any): any {
        return bindings;
    }

    /**
     * Returns the list of field properties for the specific visualization.
     *
     * @return {string[]}
     * @override
     */
    getFieldProperties(): string[] {
        return [];
    }

    /**
     * Returns the list of field array properties for the specific visualization.
     *
     * @return {string[]}
     * @override
     */
    getFieldArrayProperties(): string[] {
        return [];
    }

    /**
     * Initializes all the non-field bindings for the specific visualization.
     *
     * @override
     */
    initializeNonFieldBindings() {
        this.tabLinks = this.injector.get('tabLinks', []);
        this.network = this.injector.get('network', {});
        this.map = this.injector.get('map', {});
        this.events = this.injector.get('events', {});
        this.people = this.injector.get('people', {});
        this.showOnlyFiltered = this.injector.get('showOnlyFiltered', false);
        this.startTab = this.injector.get('startTab', {name : 'network', index : 0});
        this.filterFields = this.injector.get('filterFields', []);
    }
}

@Component({
    selector: 'app-tabs',
    templateUrl: './tabs.component.html',
    styleUrls: ['./tabs.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class TabsComponent implements OnInit, OnDestroy {
    @ViewChild('visualization', {read: ElementRef}) visualization: ElementRef;
    @ViewChild('tabs')tabs: ElementRef;

    public options: TabsOptions;
    readonly injector: Injector;
    readonly datasetService: DatasetService;
    private themesService: ThemesService;
    public displayTabs: boolean;
    private currentTab: any;
    private currentTabIndex = 0;
    public messenger: neon.eventing.Messenger;
    protected filterService: FilterService;
    public changeDetection: ChangeDetectorRef;
    public neonFilters: any[] = [];

    constructor(datasetService: DatasetService,
                filterService: FilterService, exportService: ExportService, injector: Injector, themesService: ThemesService,
                ref: ChangeDetectorRef) {

        this.injector = injector;
        this.datasetService = datasetService;
        this.themesService = themesService;
        this.filterService = filterService;
        this.changeDetection = ref;

        this.options = new TabsOptions(this.injector, this.datasetService, 'Tabs');
        this.currentTab = { config: this.options.tabLinks[this.options.startTab].config };
        this.messenger = new neon.eventing.Messenger();
        this.displayTabs = !this.options.showOnlyFiltered;
    }

    selectionChange(event) {
        window.dispatchEvent(new Event('resize')); //needed for map tiles to display correctly
        this.currentTabIndex = event.index;
        this.currentTab = this.options.tabLinks[event.index];
    }

    trackByFunction(index, item) {
        return item ? item.id : undefined;
    }

    /**
     * Returns an object containing the ElementRef objects for the visualization.
     *
     * @return {any} Object containing:  {ElementRef} headerText, {ElementRef} infoText, {ElementRef} visualization
     * @override
     */
    getElementRefs() {
        return {
            visualization: this.visualization,
            headerText: this.tabs
        };
    }

    /**
     * Returns the options for the specific visualization.
     *
     * @return {BaseNeonOptions}
     * @override
     */
    getOptions(): BaseNeonOptions {
        return this.options;
    }

    /**
     * Creates and returns the text for the settings button.
     *
     * @return {string}
     * @override
     */
    getButtonText() {
        if (this.options.showOnlyFiltered && !this.neonFilters.length) {
            return 'No Filter Selected';
        }

        return '';
    }

    /**
     * Initializes any Query Bar sub-components if needed.
     *
     * @override
     */
    ngOnInit() {
        this.messenger.events({ filtersChanged: this.handleChange.bind(this) });
    }

    handleChange() {
        //if there is a filter turn display on else off
        this.neonFilters = this.filterService.getFiltersForFields(this.options.database.name,
            this.options.table.name, this.options.filterFields);

        if (this.neonFilters.length > 0) {
            this.displayTabs = true;
        } else {
            this.displayTabs = false;
        }

        this.changeDetection.detectChanges();
    }

    ngOnDestroy() {
        this.messenger.unsubscribeAll();
        this.changeDetection.detach();
    }

    onResizeStart() {
        //Needed for component resizing
    }

    onResizeStop() {
        //Needed for component resizing
    }
}
