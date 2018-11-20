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
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, Injector,
    ViewChild, OnInit } from '@angular/core';
import { FilterService } from '../../services/filter.service';
import { ThemesService } from '../../services/themes.service';
import { DatasetService } from '../../services/dataset.service';
import { FieldMetaData, SimpleFilter } from '../../dataset';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import * as neon from 'neon-framework';
import * as uuid from 'node-uuid';
import { FormControl } from '@angular/forms';
import { Observable } from 'rxjs/Observable';
import { map, startWith } from 'rxjs/operators';
import { BaseNeonComponent, BaseNeonOptions } from '../base-neon-component/base-neon.component';
import { neonUtilities, neonVariables } from '../../neon-namespaces';
import { ExportService } from '../../services/export.service';
import { ConnectionService } from '../../services/connection.service';
import { VisualizationService } from '../../services/visualization.service';
import { ActiveGridService } from '../../services/active-grid.service';
import WherePredicate = neon.query.WherePredicate;
import { Router } from '@angular/router';
import { DomSanitizer } from '@angular/platform-browser';

/**
 * Manages configurable options for the specific visualization.
 */
export class TabsOptions extends BaseNeonOptions {
    public routeLinks: any[];

    /**
     * Appends all the non-field bindings for the specific visualization to the given bindings object and returns the bindings object.
     *
     * @arg {any} bindings
     * @return {any}
     * @override
     */
    appendNonFieldBindings(bindings: any): any {
        bindings.routeLinks = this.routeLinks;
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
        this.routeLinks = this.injector.get('routeLinks', []);
    }
}

@Component({
    selector: 'app-tabs',
    templateUrl: './tabs.component.html',
    styleUrls: ['./tabs.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class TabsComponent  /*extends BaseNeonComponent*/ {
    @ViewChild('visualization', {read: ElementRef}) visualization: ElementRef;
    @ViewChild('tabs')tabs: ElementRef;

    public options: TabsOptions;
    //private routeLinks: any[];
    private activeLinkIndex = -1;
    private injector: Injector;
    private datasetService: DatasetService;
    private themesService: ThemesService;

    render = {};
    currentTabIndex = 0;
    currentTab = { label: 'None' };
    url = this.sanitizer.bypassSecurityTrustResourceUrl('https://www.youtube.com/embed/cChkPnpN15c');

    constructor(activeGridService: ActiveGridService, connectionService: ConnectionService, datasetService: DatasetService,
                filterService: FilterService, exportService: ExportService, injector: Injector, themesService: ThemesService,
                ref: ChangeDetectorRef, visualizationService: VisualizationService,
                private sanitizer: DomSanitizer) {

        this.injector = injector;
        this.datasetService = datasetService;
        this.themesService = themesService;

        this.options = new TabsOptions(this.injector, this.datasetService, 'Tabs');

    }

    selectionChange(event) {
        //console.log(event.index);
        this.currentTabIndex = event.index;
        this.currentTab = this.options.routeLinks[event.index];
        //console.log('Current tab set', this.currentTab);
    }

    setCurrentTab(tab) {
        //console.log('Set current tab to', tab, this.currentTab);
        this.currentTab = tab;
    }

    trackByFunction(index, item) {
        return item ? item.id : undefined;
    }
    sanitize(url) {
        return this.sanitizer.bypassSecurityTrustResourceUrl(url);
    }

/*    createQuery(): neon.query.Query  {
        let query = new neon.query.Query().selectFrom(this.options.database.name, this.options.table.name);

        let fields = [this.options.idField.columnName, this.options.filterField.columnName];
        let whereClauses = [
            neon.query.where(this.options.filterField.columnName, '!=', null)
        ];

        return query.withFields(fields).where(neon.query.and.apply(query, whereClauses))
            .sortBy(this.options.filterField.columnName, neonVariables.ASCENDING);
    }*/
/*    /!**
     * Returns whether the query bar using the active data config is valid.
     *
     * @return {boolean}
     * @override
     *!/
    isValidQuery(): boolean {
       /!* return !!(this.options.database && this.options.database.name && this.options.table && this.options.table.name &&
            this.options.idField && this.options.idField.columnName && this.options.filterField && this.options.filterField.columnName);*!/
       return true;
    }

    onQuerySuccess(response) {
/!*        this.queryArray = [];

        let setValues = true;
        if (this.queryValues && this.queryValues.length) {
            setValues = false;
        }*!/

        try {
            if (response && response.data && response.data.length) {
/!*                this.errorMessage = '';

                response.data.forEach((d) => {
                    let item = {};
                    for (let field of this.options.fields) {
                        if (field.columnName === this.options.filterField.columnName && setValues) {
                            this.queryValues.push(neonUtilities.deepFind(d, this.options.filterField.columnName));
                        }
                        if (field.type || field.columnName === '_id') {
                            let value = neonUtilities.deepFind(d, field.columnName);
                            if (typeof value !== 'undefined') {
                                item[field.columnName] = value;
                            }
                        }
                    }
                    this.queryArray.push(item);
                });

                if (setValues) {
                    this.queryValues = this.queryValues.filter((value, index, array) => array.indexOf(value) === index).sort();
                }

                this.queryBarSetup();*!/

            } else {
                this.errorMessage = 'No Data';
                this.refreshVisualization();
            }
        } catch (e) {
            this.errorMessage = 'Error';
            this.refreshVisualization();
        }
    }*/

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

/*
    /!**
     * Refreshes the Tabs.
     *
     * @override
     *!/
    refreshVisualization() {
        this.changeDetection.detectChanges();
    }

    /!**
     * Returns the list filters for the visualization to ignore.
     *
     * @return {array|null}
     * @override
     *!/
    getFiltersToIgnore() {
        // Ignore all the filters for the database and the table so it always shows the selected items.
        let neonFilters = this.filterService.getFiltersForFields(this.options.database.name, this.options.table.name);

        let ignoredFilterIds = neonFilters.filter((neonFilter) => {
            return !neonFilter.filter.whereClause.whereClauses;
        }).map((neonFilter) => {
            return neonFilter.id;
        });

        return ignoredFilterIds.length ? ignoredFilterIds : null;
    }
*/

    /**
     * Returns the text for the given filter object.
     *
     * @arg {object} filter
     * @return {string}
     * @override
     */
    getFilterText(filter: any): string {
        return filter.prettyField + ' = ' + filter.value;
    }

    /**
     * Returns the list of filter objects.
     *
     * @return {array}
     * @override
     */
    getCloseableFilters(): any[] {
        return [];
    }

/*    getActiveClass(indexOfRouteLink) {
        let tabsclass = 'mat-tab-link';
        if (this.activeLinkIndex === indexOfRouteLink) {
            tabsclass = 'mat-tab-link mat-tab-label-active';
        }

        return tabsclass;
    }*/

/*    /!**
     * Creates a standard filter for the visualization.
     *
     * @arg {string} text
     *!/
    createFilter(text: string) {
        if (text && text.length === 0) {
            this.removeFilter();
            return;
        }

        //filters query text
        if (text && text !== this.currentFilter) {
            let values = this.queryArray.filter((value) =>
                value[this.options.filterField.columnName].toLowerCase() === text.toLowerCase()),
                clause: WherePredicate;

            if (values.length) {
                clause = neon.query.where(this.options.filterField.columnName, '=', text);

                if (this.currentFilter && this.filterIds) {
                    this.removeAllFilters(this.filterService.getFilters());
                }

                this.addFilter(text, clause, this.options.filterField.columnName);
                this.currentFilter = text;
                //gathers ids from the filtered query text in order to extend filtering to the other components
                if (this.options.extendedFilter) {
                    for (let ef of this.options.extensionFields) {
                        this.extensionFilter(text, ef, values);
                    }
                }
            } else {
                this.removeAllFilters(this.filterService.getFilters());
            }
        }
    }*/
/*
    /!**
     * Extends filtering across databases/indices that do not have related fields. Executes a query if necessary.
     *
     * @arg {string} text
     * @arg {any} fields
     * @arg {any} array
     *
     * @private
     *!/
    private extensionFilter(text: string, fields: any, array: any[]) {
        if (fields.database !== this.options.database.name && fields.table !== this.options.table.name) {
            let query = new neon.query.Query().selectFrom(fields.database, fields.table),
                queryFields = [fields.idField, fields.filterField],
                connection = this.connectionService.getActiveConnection(),
                execute = connection.executeQuery(query, null),
                tempArray = [],
                queryClauses = [];
            for (let value of array) {
                queryClauses.push(neon.query.where(fields.filterField, '=', value[this.options.idField.columnName]));
            }

            query.withFields(queryFields).where(neon.query.or.apply(query, queryClauses));
            execute.done((response) => {
                if (response && response.data && response.data.length) {
                    response.data.forEach((d) => {
                        let value = neonUtilities.deepFind(d, fields.idField);
                        if (typeof value !== 'undefined') {
                            if (value instanceof Array) {
                                for (let values of value) {
                                    tempArray.push(values);
                                }
                            } else {
                                tempArray.push(value);
                            }
                        }
                    });
                }

                tempArray = tempArray.filter((value, index, items) => items.indexOf(value) === index);
                this.extensionAddFilter(text, fields, tempArray);
            });
        }

        this.extensionAddFilter(text, fields, array);
    }*/

 /*   /!**
     * Adds or replaces a filter for the visualization
     *
     * @arg {string} text
     * @arg {WherePredicate} clause
     * @arg {string} field
     * @arg {string} database?
     * @arg {string} table?
     *!/
    addFilter(text: string, clause: WherePredicate, field: string, database?: string, table?: string) {
        let db = database ? database : this.options.database.name,
            tb = table ? table : this.options.table.name,
            filterName = ` ${this.options.title} - ${db} - ${tb} - ${field}`,
            filterId = this.filterId.getValue(),
            noOp = () => { /!*no op*!/ };

        if (filterId) {
            this.filterService.replaceFilter(
                this.messenger, filterId, this.id,
                db, tb, clause,
                filterName,
                (id) => {
                    this.filterIds.push(id);
                }, noOp
            );
        } else {
            this.filterService.addFilter(
                this.messenger, this.id,
                db, tb, clause,
                filterName,
                (id) => {
                    this.filterIds.push(id);
                    this.filterId.next(typeof id === 'string' ? id : null);
                },
                noOp
            );
        }
    }*/

/*    /!**
     * Creates and returns the text for the settings button.
     *
     * @return {string}
     * @override
     *!/
    getButtonText() {
            return 'No Data';
    }*/

    /**
     * Called when a filter has been removed
     *
     */
    removeFilter() {
/*        if (this.filterIds) {
            this.removeAllFilters(this.filterService.getFilters());
            this.filterIds = [];
            this.currentFilter = '';
        }*/

        //this.executeQueryChain();
    }

    /**
     * Sets filters for the visualization.
     *
     * @override
     */
    setupFilters() {
        //
    }

    /**
     * Initializes the Query Bar.
     *
     * @override
     */
    postInit() {
        this.removeFilter();
    }

    /**
     * Initializes any Query Bar sub-components if needed.
     *
     * @override
     */
    subNgOnInit() {

        this.url = this.sanitizer.bypassSecurityTrustResourceUrl('https://www.youtube.com/embed/cChkPnpN15c');
/*        console.log(this.router.url)
        this.router.events.subscribe((res) => {
            this.activeLinkIndex = this.options.routeLinks.indexOf(
                this.options.routeLinks.find((tab) => tab.link === '.' + this.router.url)
            );
        }, (error: any) => this.handleError(error));*/
    }

/*    handleError(event: any) {
        console.log(event);
    }*/
    /**
     * Destroys any Query Bar sub-components if needed.
     *
     * @override
     */
    subNgOnDestroy() {
        // Do nothing.
    }

}
