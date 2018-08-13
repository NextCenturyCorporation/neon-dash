
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
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    Component,
    ElementRef,
    Injector,
    OnDestroy,
    OnInit,
    ViewChild,
    ViewEncapsulation
} from '@angular/core';

import { ActiveGridService } from '../../services/active-grid.service';
import { ColorSchemeService } from '../../services/color-scheme.service';
import { ConnectionService } from '../../services/connection.service';
import { DatasetService } from '../../services/dataset.service';
import { FilterService } from '../../services/filter.service';
import { ExportService } from '../../services/export.service';
import { ThemesService } from '../../services/themes.service';
import { VisualizationService } from '../../services/visualization.service';

import { BaseNeonComponent, BaseNeonOptions } from '../base-neon-component/base-neon.component';
import { EMPTY_FIELD, FieldMetaData } from '../../dataset';
import { neonUtilities, neonVariables } from '../../neon-namespaces';
import * as neon from 'neon-framework';
import { TreeModule } from 'angular-tree-component';

/**
 * Manages configurable options for the specific visualization.
 */
export class TaxonomyViewerOptions extends BaseNeonOptions {
    // TODO Add and remove properties as needed.  Do NOT assign defaults to fields or else they will override updateFieldsOnTableChanged.
    public sampleOptionalField: FieldMetaData;
    public sampleRequiredField: FieldMetaData;

    public ascending: boolean;
    public id: string;

    public categoryField: FieldMetaData;
    public displayField: FieldMetaData;
    public idField: FieldMetaData;
    public linkField: FieldMetaData;
    public showOnlyFiltered: boolean;
    public typeField: FieldMetaData;
    public subTypeField: FieldMetaData;

    /**
     * Initializes all the non-field options for the specific visualization.
     *
     * @override
     */
    onInit() {
        this.ascending = this.injector.get('ascending', false);
        this.id = this.injector.get('id', '');
        this.showOnlyFiltered = this.injector.get('showOnlyFiltered', false);
    }

    /**
     * Updates all the field options for the specific visualization.  Called on init and whenever the table is changed.
     *
     * @override
     */
    updateFieldsOnTableChanged() {
        this.sampleOptionalField = this.findFieldObject('sampleOptionalField');
        this.sampleRequiredField = this.findFieldObject('sampleRequiredField');

        this.categoryField = this.findFieldObject('categoryField');
        this.displayField = this.findFieldObject('displayField');
        this.idField = this.findFieldObject('idField');
        this.linkField = this.findFieldObject('linkField');
        this.typeField = this.findFieldObject('typeField');
        this.subTypeField = this.findFieldObject('subTypeField');

    }
}

@Component({
    selector: 'app-taxonomy-viewer',
    templateUrl: './taxonomy-viewer.component.html',
    styleUrls: ['./taxonomy-viewer.component.scss'],
    encapsulation: ViewEncapsulation.Emulated,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class TaxonomyViewerComponent extends BaseNeonComponent implements OnInit, OnDestroy {

    //HTML element references used by the superclass for the resizing behavior.
    @ViewChild('visualization', { read: ElementRef }) visualization: ElementRef;
    @ViewChild('headerText') headerText: ElementRef;
    @ViewChild('infoText') infoText: ElementRef;
    @ViewChild('taxonomyViewer') taxonomyViewer: ElementRef;

    //TODO Define properties as needed.  Made public so they can be used by unit tests.

    //The visualization filters.
    public filters: {
        id: string,
        field: string,
        prettyField: string,
        value: string
    }[] = [];

    public options: TaxonomyViewerOptions;

    public activeData: any[] = [];
    public docCount: number = 0;
    public responseData: any[] = [];
    public nodeCategories: string[] = [];
    public nodeTypes: string[] = [];
    public nodeSubTypes: string[] = [];

    constructor(
        activeGridService: ActiveGridService, connectionService: ConnectionService, datasetService: DatasetService,
        filterService: FilterService, exportService: ExportService, injector: Injector, themesService: ThemesService,
        ref: ChangeDetectorRef, visualizationService: VisualizationService
    ) {

        super(
            activeGridService, connectionService, datasetService, filterService,
            exportService, injector, themesService, ref, visualizationService
        );

        this.options = new TaxonomyViewerOptions(this.injector, this.datasetService, 'Taxonomy Viewer');
    }

    /**
     * Creates and returns the query for the taxonomy viewer
     *
     * @return {neon.query.Query}
     * @override
     */
    createQuery(): neon.query.Query {
        let query = new neon.query.Query().selectFrom(this.options.database.name, this.options.table.name);

        let fields = [this.options.linkField.columnName];

        if (this.options.categoryField.columnName) {
            fields.push(this.options.categoryField.columnName);
        }

        if (this.options.displayField.columnName) {
            fields.push(this.options.displayField.columnName);
        }

        if (this.options.idField.columnName) {
            fields.push(this.options.idField.columnName);
        }

        if (this.options.linkField.columnName) {
            fields.push(this.options.linkField.columnName);
        }

        if (this.options.typeField.columnName) {
            fields.push(this.options.typeField.columnName);
        }

        if (this.options.subTypeField.columnName) {
            fields.push(this.options.subTypeField.columnName);
        }

        let whereClauses = [
            neon.query.where(this.options.linkField.columnName, '!=', null),
            neon.query.where(this.options.linkField.columnName, '!=', '')
        ];

        return query.withFields(fields).where(neon.query.and.apply(query, whereClauses));
    }

    createTaxonomy(chategories: string[], types: string[], subTypes: string[]) {
    //Todo: firgure our a way to take nodeType, nodeSubTypes, and nodeCategories
    //and turn them into a tree strucutere

    //What way can we assign specific types to categories and subtypes to types?

    }

    // TODO Change arguments as needed.
    /**
     * Creates and returns a filter object for the visualization.
     *
     * @arg {string} id
     * @arg {string} field
     * @arg {string} prettyField
     * @arg {string} value
     * @return {object}
     */
    createVisualizationFilter(id: string, field: string, prettyField: string, value: string): any {
        return {
            id: id,
            field: field,
            prettyField: prettyField,
            value: value
        };
    }

    /**
     * Creates and returns the text for the settings button and menu.
     *
     * @return {string}
     * @override
     */
    getButtonText(): string {
        return null;
        //ToDo figure out what should go in the settings button
    }

    /**
     * Returns the filter list for the visualization.
     *
     * @return {array}
     * @override
     */
    getCloseableFilters(): any[] {
        return this.filters;
    }

    /**
     * Returns an object containing the ElementRef objects for the visualization needed for the resizing behavior.
     *
     * @return {object} Object containing:  {ElementRef} headerText, {ElementRef} infoText, {ElementRef} visualization
     * @override
     */
    getElementRefs(): any {
        return {
            visualization: this.visualization,
            headerText: this.headerText,
            infoText: this.infoText
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
     * Returns the export fields for the visualization.
     *
     * @return {array}
     * @override
     */
    getExportFields(): any[] {
        // TODO Add or remove fields and properties as needed.
        return [{
            columnName: this.options.sampleOptionalField.columnName,
            prettyName: this.options.sampleOptionalField.prettyName
        }, {
            columnName: this.options.sampleRequiredField.columnName,
            prettyName: this.options.sampleRequiredField.prettyName
        }];
    }

    /**
     * Returns the list of filter IDs for the visualization to ignore.
     *
     * @return {array}
     * @override
     */
    getFiltersToIgnore(): string[] {
        // TODO Do you want the visualization to ignore its own filters?  If not, just return null.

        // TODO Change the list of filter fields here as needed.
        // Get all the neon filters relevant to this visualization.
        let neonFilters = this.filterService.getFiltersForFields(this.options.database.name, this.options.table.name,
            [this.options.sampleRequiredField.columnName]);

        let filterIdsToIgnore = [];
        for (let neonFilter of neonFilters) {
            if (!neonFilter.filter.whereClause.whereClauses) {
                filterIdsToIgnore.push(neonFilter.id);
            }
        }

        return filterIdsToIgnore.length ? filterIdsToIgnore : null;
    }

    /**
     * Returns the filter text for the given visualization filter object.
     *
     * @arg {any} filter
     * @return {string}
     * @override
     */
    getFilterText(filter: any): string {
        // TODO Update as needed.  Do you want to use an equals sign?
        return filter.prettyField + ' = ' + filter.value;
    }

    // TODO If you don't need to do anything here (like update properties), just remove this function and use the superclass one!
    /**
     * Updates properties whenever a config option is changed and reruns the visualization query.
     *
     * @override
     */
    handleChangeData() {
        super.handleChangeData();
    }

    /**
     * Returns whether the data and fields for the visualization are valid.
     *
     * @return {boolean}
     * @override
     */
    isValidQuery(): boolean {
        // TODO Add or remove fields and properties as needed.
        return !!(this.options.database.name && this.options.table.name && this.options.sampleRequiredField.columnName);
    }

    // TODO Change arguments as needed.
    /**
     * Returns whether a visualization filter object in the filter list matching the given properties exists.
     *
     * @arg {string} field
     * @arg {string} value
     * @return {boolean}
     */
    isVisualizationFilterUnique(field: string, value: string): boolean {
        // TODO What filters do you need to de-duplicate?  Is it OK to have multiple filters with matching values?
        return !this.filters.some((existingFilter) => {
            return existingFilter.field === field && existingFilter.value === value;
        });
    }

    /**
     * TODO create description
     * @param array
     * @param value
     */
    flattenArray(array, value) {
        return array.concat(value);
     }

    /**
     * Handles the query results for the visualization; updates and/or redraws any properties as needed.
     *
     * @arg {object} response
     * @override
     */
    onQuerySuccess(response: any) {
        // TODO Remove this part if you don't need a document count query.
        // Check for undefined because the count may be zero.
        if (response && response.data && response.data.length && response.data[0]._docCount !== undefined) {
            this.docCount = response.data[0]._docCount;
            return;
        }

        this.nodeCategories = [];
        this.nodeTypes = [];
        this.nodeSubTypes = [];
        this.activeData = response.data;
        this.activeData.forEach((d) => {
            for (let field of this.options.fields) {
                if (field.columnName === this.options.categoryField.columnName) {
                    this.nodeCategories.push(neonUtilities.deepFind(d, this.options.categoryField.columnName));
                }
                if (field.columnName === this.options.typeField.columnName) {
                    let types = neonUtilities.deepFind(d, this.options.typeField.columnName);
                    for (let value of types) {
                        let type = value.includes('.') ? value.split('.')[0] : value;
                        this.nodeTypes.push(type);
                    }
                }
                if (field.columnName === this.options.subTypeField.columnName) {
                    let types = neonUtilities.deepFind(d, this.options.subTypeField.columnName);
                    for (let value of types) {
                        let type = value.includes('.') ? value.slice(value.indexOf('.')) : null;
                        this.nodeTypes.push(type);
                    }
                }
            }
        });
         this.nodeCategories = this.nodeCategories.reduce(this.flattenArray, [])
            .filter((value, index, array) => array.indexOf(value) === index).sort();
        this.nodeTypes = this.nodeTypes.reduce(this.flattenArray, [])
            .filter((value, index, array) => array.indexOf(value) === index).sort();
        this.nodeSubTypes = this.nodeSubTypes.reduce(this.flattenArray, [])
            .filter((value, index, array) => array.indexOf(value) === index).sort();

        // The aggregation query response data will have a count field and all visualization fields.
        this.responseData = response.data.map((item) => {
            let label = item[this.options.sampleRequiredField.columnName] + (this.options.sampleOptionalField.columnName ? ' - ' +
                item[this.options.sampleOptionalField.columnName] : '');

            return {
                count: item.count,
                field: this.options.sampleRequiredField.columnName,
                label: label,
                prettyField: this.options.sampleRequiredField.prettyName,
                value: item[this.options.sampleRequiredField.columnName]
            };
        });

    }

    /**
     * Handles any post-initialization behavior needed with properties for the visualization.
     *
     * @override
     */
    postInit() {
        // Run the query to load the data.
        this.executeQueryChain();
    }

    /**
     * Updates any properties as needed.
     *
     * @override
     */
    refreshVisualization() {
        // TODO Do you need to update and properties or redraw any sub-components?
    }

    /**
     * Removes the given visualization filter object from this visualization.
     *
     * @arg {object} filter
     * @override
     */
    removeFilter(filter: any) {
        this.filters = this.filters.filter((existingFilter) => {
            return existingFilter.id !== filter.id;
        });
    }

    /**
     * Updates the filters for the visualization on initialization or whenever filters are changed externally.
     *
     * @override
     */
    setupFilters() {
        //do nothing

    }

    // TODO Remove this function if you don't need a filter-container.
    /**
     * Returns whether any components are shown in the filter-container.
     *
     * @return {boolean}
     */
    showFilterContainer(): boolean {
        // TODO Check for any other components (like a legend).
        return !!this.getCloseableFilters().length;
    }

    /**
     * Sets the visualization fields and properties in the given bindings object needed to save layout states.
     *
     * @arg {object} bindings
     * @override
     */
    subGetBindings(bindings: any) {
        // TODO Add or remove fields and properties as needed.
        bindings.sampleOptionalField = this.options.sampleOptionalField.columnName;
        bindings.sampleRequiredField = this.options.sampleRequiredField.columnName;

    }

    /**
     * Destroys any media viewer sub-components if needed.
     *
     * @override
     */
    subNgOnDestroy() {
        // Do nothing.
    }

    /**
     * Initializes any media viewer sub-components if needed.
     *
     * @override
     */
    subNgOnInit() {
        //
    }
}
