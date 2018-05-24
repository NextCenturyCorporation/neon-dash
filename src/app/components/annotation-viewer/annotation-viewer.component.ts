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
import { Color, ColorSchemeService } from '../../services/color-scheme.service';
import { ConnectionService } from '../../services/connection.service';
import { DatasetService } from '../../services/dataset.service';
import { FilterService } from '../../services/filter.service';
import { ExportService } from '../../services/export.service';
import { ThemesService } from '../../services/themes.service';
import { VisualizationService } from '../../services/visualization.service';

import { BaseNeonComponent, BaseNeonOptions } from '../base-neon-component/base-neon.component';
import { FieldMetaData, DatabaseMetaData, TableMetaData } from '../../dataset';
import { neonMappings, neonUtilities, neonVariables } from '../../neon-namespaces';
import * as neon from 'neon-framework';
import { ANNOTATIONS } from '@angular/core/src/util/decorators';
import * as _ from 'lodash';

export class Annotation {
    annotationLabel: string;
    startField: number;
    endField: number;
    textField: string;
    typeField: string;
}

export class AnnotationFields {
    startCharacterField: FieldMetaData;
    endCharacterField: FieldMetaData;
    textField: FieldMetaData;
    typeField: FieldMetaData;
}

export class AnnotationViewerOptions extends BaseNeonOptions {
    annotations: Annotation[];
    annotationsInAnotherTable: boolean;
    annotationDatabase: FieldMetaData;
    annotationTable: FieldMetaData;
    annotationFields: AnnotationFields;

    docCount: number;
    documentIdFieldInAnnotationTable: {};
    documentIdFieldInDocumentTable: {};
    documentLimit: number;
    documentTextField: any;
    data: Data[] = [];
    details: FieldMetaData;

    errorMessage: string;

    singleColor: boolean;

    onInit() {
        this.annotationFields = this.injector.get('annotationFields', '');
        this.documentTextField = this.injector.get('documentTextField', '');
        this.singleColor = this.injector.get('singleColor', false);
    }

    updateFieldsOnTableChanged() {
        this.documentTextField = this.findFieldObject('documentTextField');

    }
}

export class Data {
    documents: any;
    annotations: any[];
    details: any;
    parts: Part[];
    validAnnotations: boolean;
}

export class Part {
    annotation: boolean;
    highlightColor: any;
    text: string;
    type: string;
}

export class Details {
    detailLabel: string;
    detailField: FieldMetaData;
}

@Component({
    selector: 'app-annotation-viewer',
    templateUrl: './annotation-viewer.component.html',
    styleUrls: ['./annotation-viewer.component.scss'],
    encapsulation: ViewEncapsulation.Emulated,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class AnnotationViewerComponent extends BaseNeonComponent implements OnInit, OnDestroy {
    // HTML element references used by the superclass for the resizing behavior.
    @ViewChild('visualization', { read: ElementRef }) visualization: ElementRef;
    @ViewChild('headerText') headerText: ElementRef;
    @ViewChild('infoText') infoText: ElementRef;

    // TODO Remove this property if you don't need a subcomponent.
    @ViewChild('subcomponent') subcomponentElementRef: ElementRef;

    public options: AnnotationViewerOptions;

    // The filter set in the config file.
    public configFilter: {
        lhs: string,
        operator: string,
        rhs: string
    };

    // The visualization filters.
    public filters: {
        id: string,
        field: string,
        prettyField: string,
        value: string
    }[] = [];

    // The data pagination properties.
    public lastPage: boolean = true;
    public page: number = 1;

    public annotationVisible: boolean[] = [];

    // The data shown in the visualization (limited).
    public activeData: any[] = [];

    // The data count used for the settings text and pagination.
    public docCount: number = 0;

    // The data returned by the visualization query response (not limited).
    public responseData: any[] = [];

    public colorList: any[] = [];

    public seenTypes: string[] = [];
    public disabledSet: [string[]] = [] as [string[]];
    public colorByFields: string[] = [];

    constructor(
        activeGridService: ActiveGridService,
        private colorSchemaService: ColorSchemeService,
        connectionService: ConnectionService,
        datasetService: DatasetService,
        filterService: FilterService,
        exportService: ExportService,
        injector: Injector,
        themesService: ThemesService,
        ref: ChangeDetectorRef,
        visualizationService: VisualizationService
    ) {
        super(
            activeGridService,
            connectionService,
            datasetService,
            filterService,
            exportService,
            injector,
            themesService,
            ref,
            visualizationService
        );

        // TODO Initialize properties as needed.  Use the injector to get options set in the config file.
        this.configFilter = this.injector.get('configFilter', null);

        this.options = new AnnotationViewerOptions(this.injector, this.datasetService, 'Annotation Viewer', 50);
    }

    getOptions(): BaseNeonOptions {
        return this.options;
    }

    onClick(item) {
        let filter = {
            id: undefined, // This will be set in the success callback of addNeonFilter.
            field: this.options.documentTextField.columnName,
            value: item.documents,
            prettyField: this.options.documentTextField.prettyName
        };
        if (this.filterIsUnique(filter)) {
            this.addLocalFilter(filter);
            let whereClause = neon.query.where(filter.field, '=', filter.value);
            this.addNeonFilter(true, filter, whereClause);
        }
    }

    onClickPart(part) {
        let filter = {
            id: undefined, // This will be set in the success callback of addNeonFilter.
            field: part.type,
            value: part.text,
            prettyField: part.type
        };
        if (this.filterIsUnique(filter)) {
            this.addLocalFilter(filter);
            let whereClause = neon.query.where(filter.field, '=', filter.value);
            this.addNeonFilter(true, filter, whereClause);
        }
    }

    createEmptyAnnotation() {
        this.options.annotations = [];
        this.options.annotations = [{
            annotationLabel: '',
            startField: 0,
            endField: 0,
            textField: '',
            typeField: ''
        }];
    }

    filterIsUnique(filter) {
        for (let existingFilter of this.filters) {
            if (existingFilter.value === filter.value && existingFilter.field === filter.field) {
                return false;
            }
        }
        return true;
    }
    addLocalFilter(filter) {
        this.filters = this.filters.filter((existingFilter) => {
            return existingFilter.id !== filter.id;
        }).concat([filter]);
    }

    /**
     * Returns the list of valid annotation definitions for this visualization.
     * @method getValidAnnotations
     * @return {Array}
     * @private m
     */
    getValidAnnotations() {
        //
    }

    getValidDetails() {
        return this.options.data.filter(function(detail) {
            return this.isFieldValid(detail.details);
        });
    }

    /**
     * Updates the annotation data for this visualization using the given query result data.
     * @method updateAnnotationData
     * @param {Array} data
     * @private
     */
    updateAnnotationData() {
        //
    }

    /**
     * Sets the default names for the unnamed annotation and detail definitions for this visualization.
     * @method setDefaultAnnotationAndDetailNames
     * @private
     */
    setDefaultAnnotationAndDetailsNames() {
        //
    }

    /**
     * Finds and returns the document from the global list of documents that matches the given data item
     * using the document text (or undefined if no such document exists).
     * @method findDocument
     * @param {Object} dataItem
     * @return {Object}
     * @private
     */
    findDocument(dataItem) { /*
        let document;

        if (!this.options.anootationsInAnotherTable) {
            let content = this.findDocumentContent(dataItem);
            document = _.find(this.options.documents, function(document) {
                return document.content === content;
            });
        }
        return document;*/
    }

    /**
     * Saves the annotations and mentions from the given data item in the given document object.
     * @method saveAnnotations
     * @param {Object} dataItem
     * @param {Object} document
     * @private
     */
    saveAnnotations(dataItem, document) {/*
        this.getValidAnnotations().forEach(function(annotation) {
            //
        });*/
    }

    addAnnotation(annotation) {
        //this.options.annotations
    }

    /**
     * Adds an annotation object for the given annotation definition to the given document object.
     * @method addAnnotationToDocument
     * @param {Object} annotation
     * @param {Object} document
     * @private
     */
    addAnnotationToDocument(annotation, document) {/*
        let index = _.findIndex(document.annotations, function(annotationItem) {
            return annotationItem.label === annotation.label;
        });

        if (index < 0) {
            // A document annotation object contains a label string, whether the annotation is shown,
            //and a list of type objects for each unique annotation value.

            document.annotations.push({
                label: annotation.label,
                shown: true,
                types: []
            });
            index = document.annotations.length -1;
        }
        return index;*/
    }

    /**
     * Adds the given annotation type to the given document annotation object.
     * @method addAnnotationTypeToDocumentAnnotation
     * @param {String} type
     * @param {Object} annotation
     * @private
     */
    addAnnotationTypeToDocumentAnnotation(type, annotation) {/*
        let index = _.findIndex(annotation.types, function(typeItem) {
            return typeItem.label === type;
        });*/
    }

    addEmptyAnnotation() {
        let annotation = new Annotation();

        this.options.annotations.push(annotation);
    }

    /**
     * Saves the details from the given data item in the given document object.
     * @method saveDetails
     * @param {Object} dataItem
     * @param {Object} document
     * @private
     */
    saveDetails(dataItem, document) {
        //TODO
    }

    /**
     * Creates the part objects shown in the display for the given document object
     * @method createDisplayObjects
     * @param {Object} data
     * @private
     */
    createDisplayObjects(data) {

        for (let document of data) {

            document.parts = [];

            let documentText = document.documents;
            let partMentions = [];
            let partHighlightColor;

            let annotationStartIndex = [];
            let annotationEndIndex = [];

            let annotationsList = document.annotations;
            let annotationsPartList = [];

            //console.log(document);

            if (!annotationsList.length) {
                let part = new Part();
                part.text = document.documents;
                part.annotation = false;
                document.parts.push(part);
            } else {
                //Breaks annotations into parts
                for (let annotation of annotationsList) {
                    let annotationStart = this.options.annotationFields.startCharacterField.toString();
                    //neonUtilities.deepFind(annotation, this.options.annotationFields.startCharacterField.columnName);
                    let annotationEnd = this.options.annotationFields.endCharacterField.toString();
                    let annotationText = this.options.annotationFields.textField.toString();
                    let annotationType = this.options.annotationFields.typeField.toString();

                    annotationStartIndex.push(annotation[annotationStart]);
                    annotationEndIndex.push(annotation[annotationEnd]);
                    //console.log(neonUtilities.deepFind(annotation, annotationStart));

                    let currentPart = new Part();
                    let highlightColor = this.colorSchemaService.getColorFor(annotation[annotationType],
                        annotation[annotationType]).toRgba(0.4);
                    currentPart.highlightColor = highlightColor;
                    currentPart.text = annotation[annotationText];
                    currentPart.annotation = true;
                    currentPart.type = annotation[annotationType];
                    annotationsPartList.push(currentPart);

                    if (!this.seenTypes.includes(currentPart.type)) {
                        let type: string;
                        type = currentPart.type;
                        this.seenTypes.push(type);
                    }
                }
                this.colorByFields = this.seenTypes;
            }

            for (let index = 0; index < annotationsPartList.length; index++) {
                //If the first annotation is the very first text
                //Add the first annotation to the data.parts
                if (annotationStartIndex[index] === 0 && index === 0) {
                    let part = new Part();
                    part.text = documentText.slice(annotationEndIndex[index], annotationStartIndex[index + 1]);
                    part.annotation = false;
                    document.parts.push(annotationsPartList[index]);
                    document.parts.push(part);
                    //If this is the last annotation in the text
                } else if (annotationEndIndex[index] + 1 === documentText.length) {
                    document.parts.push(annotationsPartList[index]);
                    //If the first annotation is not the first one in the text
                } else if (index === 0 && annotationStartIndex[index] !== 0) {
                    let innerPart = new Part();
                    let outerPart = new Part();
                    innerPart.text = documentText.slice(0, annotationStartIndex[index]);
                    innerPart.annotation = false;
                    outerPart.text = documentText.slice(annotationEndIndex[index], annotationStartIndex[index + 1]);
                    outerPart.annotation = false;

                    document.parts.push(innerPart);
                    document.parts.push(annotationsPartList[index]);
                    document.parts.push(outerPart);
                    //If there exists a normal part between annotation
                    // and this is not thel
                } else if (annotationEndIndex[index] !== annotationStartIndex[index + 1]
                    && annotationEndIndex[index] + 1 !== annotationsPartList.length) {
                    let partNormal = new Part();
                    let startIndex = annotationEndIndex[index];
                    let endIndex = annotationStartIndex[index + 1];

                    partNormal.text = documentText.slice(startIndex, endIndex);
                    partNormal.annotation = false;

                    document.parts.push(annotationsPartList[index]);
                    document.parts.push(partNormal);
                    //document.parts.push(annotationsPartList[index]);
                    //If this is the last annotation but there's more normal text
                } else if (annotationEndIndex[index] === annotationEndIndex[annotationsPartList.length] &&
                    annotationEndIndex[index] + 1 < documentText.length) {
                    let lastNormalPart = new Part();
                    lastNormalPart.text = documentText.slice(annotationEndIndex[index], annotationsPartList.length - 1);
                    lastNormalPart.annotation = false;
                }
            }

        }
    }

    annotationExists(data) {
        let exists: boolean;

        if (data.annotations.length) {
            exists = true;
        } else {
            exists = false;
        }

        return exists;
    }

    /**
     * Adds the given filter object to the visualization and removes any existing filter object with ID matching the given filter ID.
     *
     * @arg {object} filter
     */
    addVisualizationFilter(filter: any) {
        this.filters = this.filters.filter((existingFilter) => {
            return existingFilter.id !== filter.id;
        }).concat(filter);
    }

    /**
     * Creates and returns the Neon where clause for the visualization.
     *
     * @return {any}
     */
    createClause(): any {
        let clause = neon.query.where(this.options.documentTextField.columnName, '!=', null);

        if (this.hasUnsharedFilter()) {
            clause = neon.query.and(clause,
                neon.query.where(this.options.unsharedFilterField.columnName, '=', this.options.unsharedFilterValue));
        }

        return clause;
    }

    /**
     * Creates and returns the query for the visualization.
     *
     * @return {neon.query.Query}
     * @override
     */
    createQuery(): neon.query.Query {
        //let query = new neon.query.Query().selectFrom(this.options.database.name, this.options.table.name).where(this.createWhere());

        let aggregationFields = [this.options.documentTextField.columnName];
        let clause = neon.query.where(this.options.documentTextField.columnName, '!=', null);

        if (this.hasUnsharedFilter()) {
            clause = neon.query.and(clause,
                neon.query.where(this.options.unsharedFilterField.columnName, '=', this.options.unsharedFilterValue));
        }
        //return query.groupBy(aggregationFields).aggregate(neonVariables.COUNT, '*', 'count').sortBy('count', neonVariables.DESCENDING);
        let databaseName = this.options.database.name;
        let tableName = this.options.table.name;
        let limit = this.options.limit;
        let query = new neon.query.Query().selectFrom(databaseName, tableName);
        let whereClause = this.createClause();

        let annotations = this.getValidAnnotations();

        return query.where(whereClause);
    }

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
     * Creates and returns the where predicate for the visualization.
     *
     * @return {neon.query.WherePredicate}
     */
    createWhere(): neon.query.WherePredicate {
        // TODO Add or remove clauses as needed.
        let clauses: neon.query.WherePredicate[] = [neon.query.where(this.options.documentTextField.columnName, '!=', null)];

        // Only add the optional field if it is defined.
        /*if (this.options.annotationViewerOptionalField.columnName) {
            clauses.push(neon.query.where(this.options.annotationViewerOptionalField.columnName, '!=', null));
        }*/

        if (this.configFilter) {
            clauses.push(neon.query.where(this.configFilter.lhs, this.configFilter.operator, this.configFilter.rhs));
        }

        if (this.hasUnsharedFilter()) {
            clauses.push(neon.query.where(this.options.unsharedFilterField.columnName, '=', this.options.unsharedFilterValue));
        }

        return clauses.length > 1 ? neon.query.and.apply(neon.query, clauses) : clauses[0];
    }

    /**
     * Adds a filter for the given item both in neon and for the visualization or replaces all the existing filters if replaceAll is true.
     *
     * @arg {object} item
     * @arg {boolean} [replaceAll=false]
     */
    filterOnItem(item: any, replaceAll = false) {
        let filter = this.createVisualizationFilter(undefined, item.field, item.prettyField, item.value);
        let neonFilter = neon.query.where(filter.field, '=', filter.value);

        if (replaceAll) {
            if (this.filters.length === 1) {
                // If we have a single existing filter, keep the ID and replace the old filter with the new filter.
                filter.id = this.filters[0].id;
                this.filters = [filter];
                this.replaceNeonFilter(true, filter, neonFilter);
            } else if (this.filters.length > 1) {
                // If we have multiple existing filters, remove all the old filters and add the new filter once done.
                // Use concat to copy the filter list.
                this.removeAllFilters([].concat(this.filters), () => {
                    this.filters = [filter];
                    this.addNeonFilter(true, filter, neonFilter);
                });
            } else {
                // If we don't have an existing filter, add the new filter.
                this.filters = [filter];
                this.addNeonFilter(true, filter, neonFilter);
            }
        } else {
            // If the new filter is unique, add the filter to the existing filters in both neon and the visualization.
            if (this.isVisualizationFilterUnique(item.field, item.value)) {
                this.addNeonFilter(true, filter, neonFilter);
            }
        }
    }

    /**
     * Creates and returns the text for the settings button and menu.
     *
     * @return {string}
     * @override
     */
    getButtonText(): string {
        if (this.options.data.length) {
            return 'Total ' + this.options.data.length;
        }
        if (!this.responseData.length || !this.activeData.length) {
            return 'No Data';
        }
        if (this.activeData.length === this.responseData.length) {
            return 'Total ' + super.prettifyInteger(this.activeData.length);
        }
        let begin = super.prettifyInteger((this.page - 1) * this.options.limit + 1);
        let end = super.prettifyInteger(Math.min(this.page * this.options.limit, this.responseData.length));
        return (begin === end ? begin : (begin + ' - ' + end)) + ' of ' + super.prettifyInteger(this.responseData.length);
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

    // TODO Remove this function if the default limit for the visualization is 10.
    /**
     * Returns the default limit for the visualization.
     *
     * @return {number}
     * @override
     */
    getDefaultLimit(): number {
        return 50;
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
     * Returns the export fields for the visualization.
     *
     * @return {array}
     * @override
     */
    getExportFields(): any[] {
        return [{
            columnName: this.options.documentTextField.columnName,
            prettyName: this.options.documentTextField.prettyName
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
            [this.options.documentTextField.columnName]);

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

    /**
     * Returns the name for the visualization.
     *
     * @return {string}
     * @override
     */
    getVisualizationName(): string {
        return 'Annotation Viewer';
    }

    /**
     * Increases the page and updates the active data.
     */
    goToNextPage() {
        if (!this.lastPage) {
            this.page++;
            this.updateActiveData();
        }
    }

    /**
     * Decreases the page and updates the active data.
     */
    goToPreviousPage() {
        if (this.page !== 1) {
            this.page--;
            this.updateActiveData();
        }
    }

    // TODO If you don't need to do anything here (like update properties), just remove this function and use the superclass one!
    /**
     * Updates properties and/or sub-components whenever a config option is changed and reruns the visualization query.
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
        return !!(this.options.database.name && this.options.table.name && this.options.documentTextField.columnName);
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

    updateLegend() {
        //let seenTypes: string[] = [];
        //this.seenTypes = seenTypes;
        this.seenTypes.sort();
    }

    legendItemSelected(event: any) {
        let fieldName: string = event.fieldName;
        let value: string = event.value;
        let currentlyActive: boolean = event.currentlyActive;

        //console.log('Legend was clicked!');

        if (currentlyActive) {

            // Mark it as disabled
            this.disabledSet.push([fieldName, value]);
        } else {

            // Mark it as active again
            this.disabledSet = this.disabledSet.filter((set) => {
                return !(set[0] === fieldName && set[1] === value);
            }) as [string[]];
        }

        this.updateLegendColor();
    }

    updateLegendColor() {
        for (let data of this.activeData) {
            for (let part of data.parts) {

                let disabledValues = this.disabledSet.map((function(set) {
                    return set[1];
                }));

                if (disabledValues.includes(part.type)) {
                    part.highlightColor = 'rgb(255,255,255)';
                } else {
                    if (part.highlightColor && part.highlightColor.includes('rgb(255,255,255')) {
                        part.highlightColor = this.colorSchemaService.getColorFor(part.type, part.type).toRgba(0.4);
                    }
                }

            }
        }
    }

    /**
     * Handles the query results for the visualization; updates and/or redraws any properties and/or sub-components as needed.
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

        // TODO If you need to show an error message, set this.options.errorMessage as needed.

        // TODO Change this behavior as needed to handle your query results.

        // The aggregation query response data will have a count field and all visualization fields.
        this.responseData = response.data.map((item) => {
            let label = item[this.options.documentTextField.columnName] /*+
                (this.options.annotationViewerOptionalField.columnName ? ' - ' +
                    item[this.options.annotationViewerOptionalField.columnName] : '')*/;

            return {
                count: item.count,
                field: this.options.documentTextField.columnName,
                label: label,
                prettyField: this.options.documentTextField.prettyName,
                value: item[this.options.documentTextField.columnName]
            };
        });

        this.disabledSet = [] as [string[]];

        this.page = 1;
        this.updateDocuemnts(response);
        this.updateActiveData();

        // TODO Remove this part if you don't need a document count query.
        if (this.responseData.length) {
            this.runDocCountQuery();
        } else {
            this.docCount = 0;
        }
    }

    updateDocuemnts(response) {

        this.options.data = [];
        for (let document of response.data) {
            let data = {
                documents: null,
                annotations: [],
                details: null,
                parts: [],
                validAnnotations: null
            };
            if (document.annotations) {
                for (let annotation of document.annotations) {
                    data.annotations.push(annotation);
                }
            }
            data.documents = document[this.options.documentTextField.columnName];
            if (data.documents) {
                this.options.data.push(data);
            }
        }
        this.refreshVisualization();
    }

    /**
     * Handles any post-initialization behavior needed with properties or sub-components for the visualization.
     *
     * @override
     */
    postInit() {
        // Run the query to load the data.
        this.executeQueryChain();
    }

    /**
     * Updates any properties and/or sub-components as needed.
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
     * Creates and runs the document count query.
     */
    runDocCountQuery() {
        let query = new neon.query.Query().selectFrom(this.options.database.name, this.options.table.name).where(this.createWhere());

        let ignoreFilters = this.getFiltersToIgnore();
        if (ignoreFilters && ignoreFilters.length) {
            query.ignoreFilters(ignoreFilters);
        }

        // The document count query is a count aggregation for all the documents.
        query.aggregate(neonVariables.COUNT, '*', '_docCount');

        this.executeQuery(query);
    }

    /**
     * Updates the filters for the visualization on initialization or whenever filters are changed externally.
     *
     * @override
     */
    setupFilters() {
        // First reset the existing visualization filters.
        this.filters = [];

        // Get all the neon filters relevant to this visualization.
        let neonFilters = this.filterService.getFiltersForFields(this.options.database.name, this.options.table.name,
            [this.options.documentTextField.columnName]);

        for (let neonFilter of neonFilters) {
            // TODO Change as needed.  Do your filters have multiple clauses?  Do your filters have multiple keys (like begin/end dates)?

            // This will ignore a filter with multiple clauses.
            if (!neonFilter.filter.whereClause.whereClauses) {
                let field = this.options.findField(neonFilter.filter.whereClause.lhs);
                let value = neonFilter.filter.whereClause.rhs;
                if (this.isVisualizationFilterUnique(field.columnName, value)) {
                    this.addVisualizationFilter(this.createVisualizationFilter(neonFilter.id, field.columnName, field.prettyName, value));
                }
            }
        }

        this.executeQueryChain();
    }

    /**
     * Returns whether any components are shown in the filter-container.
     *
     * @return {boolean}
     */
    showFilterContainer(): boolean {
        return !!this.getCloseableFilters().length;
    }

    showLegendContainer(): boolean {
        let showLegend = false;
        if (!this.options.singleColor && this.colorByFields.length > 0) {
            showLegend = true;
        }
        return showLegend;
    }

    /**
     * Returns whether any components are shown in the footer-container.
     *
     * @return {boolean}
     */
    showFooterContainer(): boolean {
        return this.activeData.length < this.responseData.length;
    }

    /**
     * Sets the visualization fields and properties in the given bindings object needed to save layout states.
     *
     * @arg {object} bindings
     * @override
     */
    subGetBindings(bindings: any) {
        bindings.annotationViewerOptionalField = this.options.documentTextField.columnName;
    }

    // TODO If you don't need to do anything here (like update properties), just remove this function and use the superclass one!
    /**
     * Updates properties and/or sub-components whenever the limit is changed and reruns the visualization query.
     *
     * @override
     */
    subHandleChangeLimit() {
        super.subHandleChangeLimit();
    }

    /**
     * Deletes any properties and/or sub-components needed.
     *
     * @override
     */
    subNgOnDestroy() {
        //
    }

    /**
     * Initializes any properties and/or sub-components needed once databases, tables, fields, and other meta properties are set.
     *
     * @override
     */
    subNgOnInit() {
        this.executeQueryChain();
    }

    /**
     * Updates the pagination properties and the active data.
     */
    updateActiveData() {
        this.activeData = [];
        let offset = (this.page - 1) * this.options.limit;
        this.activeData = this.options.data.slice(offset, (offset + this.options.limit));
        this.lastPage = (this.options.data.length <= (offset + this.options.limit));
        this.createDisplayObjects(this.activeData);
        this.updateLegend();
        this.refreshVisualization();
    }
}
