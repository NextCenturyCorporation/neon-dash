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

import { Color } from '../../color';

import { AbstractWidgetService } from '../../services/abstract.widget.service';
import { ConnectionService } from '../../services/connection.service';
import { DatasetService } from '../../services/dataset.service';
import { FilterService } from '../../services/filter.service';

import { BaseNeonComponent } from '../base-neon-component/base-neon.component';
import { FieldMetaData, DatabaseMetaData, TableMetaData } from '../../dataset';
import { neonMappings, neonUtilities, neonVariables } from '../../neon-namespaces';
import {
    OptionChoices,
    WidgetFieldArrayOption,
    WidgetFieldOption,
    WidgetFreeTextOption,
    WidgetOption,
    WidgetSelectOption
} from '../../widget-option';
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

export class Data {
    annotationStartIndex: any;
    annotationEndIndex: any;
    annotationTextList: any;
    annotationTypeList: any;
    documents: any;
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

    public annotations: Annotation[];
    public docCount: number;
    public data: Data[] = [];

    // The visualization filters.
    public filters: {
        id: string,
        field: string,
        prettyField: string,
        value: string
    }[] = [];

    public annotationVisible: boolean[] = [];

    // The data shown in the visualization (limited).
    public activeData: any[] = [];

    //Either documentTextField or linkField
    public displayField: string;

    // The data returned by the visualization query response (not limited).
    public responseData: any[] = [];

    public seenTypes: string[] = [];
    public disabledSet: [string[]] = [] as [string[]];
    public colorKeys: string[] = [];
    public indexInclusive: boolean;
    public offset = 0;
    public previousId: string = '';

    constructor(
        protected widgetService: AbstractWidgetService,
        connectionService: ConnectionService,
        datasetService: DatasetService,
        filterService: FilterService,
        injector: Injector,
        ref: ChangeDetectorRef
    ) {
        super(
            connectionService,
            datasetService,
            filterService,
            injector,
            ref
        );

        this.subscribeToSelectId(this.getSelectIdCallback());
    }

    /**
     * Creates and returns an array of field options for the visualization.
     *
     * @return {(WidgetFieldOption|WidgetFieldArrayOption)[]}
     * @override
     */
    createFieldOptions(): (WidgetFieldOption | WidgetFieldArrayOption)[] {
        return [
            new WidgetFieldOption('documentTextField', 'Document Text Field', false),
            new WidgetFieldOption('endCharacterField', 'End Character Field', false),
            new WidgetFieldOption('idField', 'ID Field', false),
            new WidgetFieldOption('linkField', 'Link Field', false),
            new WidgetFieldOption('startCharacterField', 'Start Character Field', false),
            new WidgetFieldOption('textField', 'Text Field', false),
            new WidgetFieldOption('typeField', 'Type Field', false)
        ];
    }

    /**
     * Creates and returns an array of non-field options for the visualization.
     *
     * @return {WidgetOption[]}
     * @override
     */
    createNonFieldOptions(): WidgetOption[] {
        return [
            // True if text should be highlighted on hover while responseMode is true, false otherwise.
            new WidgetSelectOption('highlightInRespondMode', 'Highlight in Respond Mode', false, OptionChoices.NoFalseYesTrue),
            new WidgetFreeTextOption('id', 'ID', ''),
            new WidgetSelectOption('respondMode', 'Respond Mode', false, OptionChoices.NoFalseYesTrue),
            new WidgetSelectOption('singleColor', 'Single Color', false, OptionChoices.NoFalseYesTrue)
        ];
    }

    /**
     * Returns the default limit for the visualization.
     *
     * @return {string}
     * @override
     */
    getVisualizationDefaultLimit(): number {
        return 50;
    }

    /**
     * Returns the default title for the visualization.
     *
     * @return {string}
     * @override
     */
    getVisualizationDefaultTitle(): string {
        return 'Annotation Viewer';
    }

    onClick(item) {
        let filter = {
            id: undefined, // This will be set in the success callback of addNeonFilter.
            field: this.options.documentTextField.columnName,
            value: item.documents,
            prettyField: this.options.documentTextField.prettyName
        };
        if (this.filterIsUnique(filter) && !this.options.respondMode) {
            this.addLocalFilter(filter);
            let whereClause = neon.query.where(filter.field, '=', filter.value);
            this.addNeonFilter(this.options, true, filter, whereClause);
        }
    }

    onClickPart(part, item) {
        let filter = {
            id: undefined, // This will be set in the success callback of addNeonFilter.
            field: part.type,
            value: part.text,
            prettyField: part.type
        };
        if (this.filterIsUnique(filter) && part.annotation) {
            this.addLocalFilter(filter);
            let whereClause = neon.query.where(filter.field, '=', filter.value);
            this.addNeonFilter(this.options, true, filter, whereClause);
        }
        if (!part.annotation) {
            this.onClick(item);
        }
    }

    createEmptyAnnotation() {
        this.annotations = [];
        this.annotations = [{
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
    getValidAnnotations(data) {
        //
    }

    doesAnnotationExist(data) {
        let document = data;
        let isValid = false;
        let annotationStartIndex = data.annotationStartIndex;
        let annotationEndIndex = data.annotationEndIndex;
        let annotationTextList = data.annotationTextList;
        let annotationTypeList = data.annotationTypeList;
        let documentText = data.documents;

        if (!annotationStartIndex || annotationStartIndex.length < 1) {
            isValid = false;
        } else {
            let text = document.documents;
            if (text instanceof Array) {
                isValid = this.isValid(text[0], annotationTextList[0], annotationStartIndex[0], annotationEndIndex[0]);
            } else if (text) {
                isValid = this.isValid(text, annotationTextList[0], annotationStartIndex[0], annotationEndIndex[0]);
            }
        }
        return isValid;
    }

    isValid(text: string, annotationText: string, startIndex: number, endIndex: number): boolean {
        let inclusiveText;
        let exclusiveText;

        if ((typeof text) === 'string') {
            inclusiveText = text.substring(startIndex, (endIndex + 1));
            exclusiveText = text.substring(startIndex, endIndex);
        }
        let isValid = false;

        //isAnnotation exclusive or inclusive?
        if (exclusiveText && annotationText && exclusiveText.includes(annotationText)) {
            this.offset = 0;
            isValid = true;
        } else if (inclusiveText && annotationText && inclusiveText.includes(annotationText)) {
            this.offset = 1;
            isValid = true;
        }
        return isValid;
    }

    getValidDetails() {
        return this.data.filter(function(detail) {
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
        //this.annotations
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

        this.annotations.push(annotation);
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
            let annotationsPartList = [];

            if (!this.doesAnnotationExist(document)) {
                let part = new Part();
                part.text = document.documents;
                part.annotation = false;
                document.parts.push(part);
            } else {
                //Breaks annotations into parts
                for (let index = 0; index < document.annotationStartIndex.length; index ++) {
                    let currentPart = new Part();
                    let currentText = document.annotationTextList[index];
                    let currentType = document.annotationTypeList[index];
                    let highlightColor = this.widgetService.getColor(this.options.database.name, this.options.table.name, currentType,
                        currentType).getComputedCssTransparencyHigh(this.visualization);

                    currentPart.highlightColor = highlightColor;
                    currentPart.text = currentText;
                    currentPart.annotation = true;
                    currentPart.type = currentType;
                    annotationsPartList.push(currentPart);

                    if (!this.seenTypes.includes(currentPart.type)) {
                        let type: string;
                        type = currentPart.type;
                        this.seenTypes.push(type);
                    }
                }
                this.colorKeys = this.seenTypes.map((type) => this.widgetService.getColorKey(this.options.database.name,
                    this.options.table.name, type));
            }

            for (let index = 0; index < annotationsPartList.length; index++) {
                //If the first annotation is the very first text
                //Add the first annotation to the data.parts
                if (document.annotationStartIndex[index] === 0 && index === 0) {
                    let part = new Part();
                    part.text = documentText.substring(
                        document.annotationEndIndex[index] + this.offset, document.annotationStartIndex[index + 1]);
                    part.annotation = false;
                    document.parts.push(annotationsPartList[index]);
                    document.parts.push(part);
                    //If this is the last annotation in the text
                } else if (document.annotationEndIndex[index] + this.offset === documentText.length) {
                    document.parts.push(annotationsPartList[index]);
                    //If the first annotation is not the first one in the text
                } else if (index === 0 && document.annotationStartIndex[index] !== 0) {
                    let innerPart = new Part();
                    let outerPart = new Part();
                    innerPart.text = documentText.substring(0, document.annotationStartIndex[index]);
                    innerPart.annotation = false;
                    outerPart.text = documentText.substring(
                        document.annotationEndIndex[index] + this.offset, document.annotationStartIndex[index + 1]);
                    outerPart.annotation = false;

                    document.parts.push(innerPart);
                    document.parts.push(annotationsPartList[index]);
                    document.parts.push(outerPart);
                    //If there exists a normal part between annotation
                    // and this is not the last
                } else if (document.annotationEndIndex[index] !== document.annotationStartIndex[index + 1]
                    && document.annotationEndIndex[index] + 1 !== annotationsPartList.length) {
                    let partNormal = new Part();
                    let startIndex = document.annotationEndIndex[index];
                    let endIndex = document.annotationStartIndex[index + 1];

                    partNormal.text = documentText.substring(startIndex + this.offset, endIndex);
                    partNormal.annotation = false;

                    document.parts.push(annotationsPartList[index]);
                    document.parts.push(partNormal);
                    //document.parts.push(annotationsPartList[index]);
                    //If this is the last annotation but there's more normal text
                } else if (document.annotationEndIndex[index] === document.annotationEndIndex[annotationsPartList.length] &&
                    document.annotationEndIndex[index] + 1 < documentText.length) {
                    let lastNormalPart = new Part();
                    lastNormalPart.text = documentText.substring(
                        document.annotationEndIndex[index] + this.offset, annotationsPartList.length - 1);
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
        let clause = neon.query.where(this.displayField, '!=', null);

        if (this.hasUnsharedFilter()) {
            clause = neon.query.and(clause,
                neon.query.where(this.options.unsharedFilterField.columnName, '=', this.options.unsharedFilterValue));
        }

        return clause;
    }

    /**
     * Creates and returns the visualization data query using the given options.
     *
     * @arg {any} options A WidgetOptionCollection object.
     * @return {neon.query.Query}
     * @override
     */
    createQuery(options: any): neon.query.Query {

        let aggregationFields = [this.displayField];
        let clause = neon.query.where(this.displayField, '!=', null);
        let databaseName = options.database.name;
        let tableName = options.table.name;
        let limit = options.limit;
        let query = new neon.query.Query().selectFrom(databaseName, tableName);
        this.displayField = options.respondMode ? options.linkField.columnName : options.documentTextField.columnName;

        if (this.hasUnsharedFilter()) {
            clause = neon.query.and(clause,
                neon.query.where(options.unsharedFilterField.columnName, '=', options.unsharedFilterValue));
        }

        if (options.respondMode && options.idField && this.previousId) {
            let fields = [options.idField.columnName, options.linkField.columnName];

            let whereClauses = [
                neon.query.where(options.idField.columnName, '=', options.id)
            ];

            return query.withFields(fields).where(neon.query.and.apply(query, whereClauses));
        }

        let whereClause = this.createClause();

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
        let clauses: neon.query.WherePredicate[] = [neon.query.where(this.displayField, '!=', null)];

        // Only add the optional field if it is defined.
        /*if (this.options.annotationViewerOptionalField.columnName) {
            clauses.push(neon.query.where(this.options.annotationViewerOptionalField.columnName, '!=', null));
        }*/

        if (this.options.filter) {
            clauses.push(neon.query.where(this.options.filter.lhs, this.options.filter.operator, this.options.filter.rhs));
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
                this.replaceNeonFilter(this.options, true, filter, neonFilter);
            } else if (this.filters.length > 1) {
                // If we have multiple existing filters, remove all the old filters and add the new filter once done.
                // Use concat to copy the filter list.
                this.removeAllFilters(this.options, [].concat(this.filters), () => {
                    this.filters = [filter];
                    this.addNeonFilter(this.options, true, filter, neonFilter);
                });
            } else {
                // If we don't have an existing filter, add the new filter.
                this.filters = [filter];
                this.addNeonFilter(this.options, true, filter, neonFilter);
            }
        } else {
            // If the new filter is unique, add the filter to the existing filters in both neon and the visualization.
            if (this.isVisualizationFilterUnique(item.field, item.value)) {
                this.addNeonFilter(this.options, true, filter, neonFilter);
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
        if (this.options.respondMode) {
            return '';
        }
        return super.getButtonText();
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
     * Returns the list of filter IDs for the visualization to ignore.
     *
     * @return {array}
     * @override
     */
    getFiltersToIgnore(): string[] {
        let neonFilters = this.filterService.getFiltersForFields(this.options.database.name, this.options.table.name,
            [this.displayField]);

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
        return filter.prettyField + ' = ' + filter.value;
    }

    /**
     * Creates and returns the callback function for a select_id event.
     *
     * @return {function}
     * @private
     */
    private getSelectIdCallback() {
        return (message) => {
            if (message.database === this.options.database.name && message.table === this.options.table.name) {
                this.options.id = Array.isArray(message.id) ? message.id[0] : message.id;
                if (this.options.id !== this.previousId) {
                    this.activeData = [];
                    this.previousId = this.options.id;
                    this.executeQueryChain();
                }
            }
        };
    }

    /**
     * Returns the array of data items that are currently shown in the visualization, or undefined if it has not yet run its data query.
     *
     * @return {any[]}
     * @override
     */
    public getShownDataArray(): any[] {
        return this.activeData;
    }

    /**
     * Returns the count of data items that an unlimited query for the visualization would contain.
     *
     * @return {number}
     * @override
     */
    public getTotalDataCount(): number {
        return this.docCount;
    }

    /**
     * Returns the default title for the visualization.
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

    /**
     * Updates properties and/or sub-components whenever a config option is changed and reruns the visualization query.
     *
     * @override
     */
    handleChangeData() {
        super.handleChangeData();
    }

    /**
     * Returns whether the visualization data query created using the given options is valid.
     *
     * @arg {any} options A WidgetOptionCollection object.
     * @return {boolean}
     * @override
     */
    isValidQuery(options: any): boolean {
        return !!(options.database.name && options.table.name && (options.documentTextField.columnName || options.linkField.columnName) &&
            (!options.respondMode || this.previousId));
    }

    /**
     * Returns whether a visualization filter object in the filter list matching the given properties exists.
     *
     * @arg {string} field
     * @arg {string} value
     * @return {boolean}
     */
    isVisualizationFilterUnique(field: string, value: string): boolean {
        return !this.filters.some((existingFilter) => {
            return existingFilter.field === field && existingFilter.value === value;
        });
    }

    updateLegend() {
        this.colorKeys.sort();
    }

    legendItemSelected(event: any) {
        let fieldName: string = event.fieldName;
        let value: string = event.value;
        let currentlyActive: boolean = event.currentlyActive;

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
                        part.highlightColor = this.widgetService.getColor(this.options.database.name, this.options.table.name, part.type,
                            part.type).getComputedCssTransparencyHigh(this.visualization);
                    }
                }

            }
        }
    }

    /**
     * Handles the given response data for a successful visualization data query created using the given options.
     *
     * @arg {any} options A WidgetOptionCollection object.
     * @arg {any} response
     * @override
     */
    onQuerySuccess(options: any, response: any) {
        // Check for undefined because the count may be zero.
        if (response && response.data && response.data.length && response.data[0]._docCount !== undefined) {
            this.docCount = response.data[0]._docCount;
            return;
        }
        this.displayField = options.respondMode ? options.linkField.columnName : options.documentTextField.columnName;
        // The aggregation query response data will have a count field and all visualization fields.
        this.responseData = response.data.map((item) => {
            let label = item[this.displayField];

            return {
                count: item.count,
                field: this.displayField,
                label: label,
                prettyField: this.displayField,
                value: item[this.displayField]
            };
        });

        this.disabledSet = [] as [string[]];
        this.colorKeys = [];

        this.page = 1;
        this.updateDocuemnts(response);
        this.updateActiveData();

        if (this.responseData.length) {
            this.runDocCountQuery();
        } else {
            this.docCount = 0;
        }
    }

    updateDocuemnts(response) {
        this.data = [];
        for (let document of response.data) {
            let data = {
                annotationStartIndex: [],
                annotationEndIndex: [],
                annotationTextList: [],
                annotationTypeList: [],
                documents: null,
                details: null,
                parts: [],
                validAnnotations: null
            };
            data.annotationStartIndex = neonUtilities.deepFind(document, this.options.startCharacterField.columnName);
            data.annotationEndIndex = neonUtilities.deepFind(document, this.options.endCharacterField.columnName);
            data.annotationTextList = neonUtilities.deepFind(document, this.options.textField.columnName);
            data.annotationTypeList = neonUtilities.deepFind(document, this.options.typeField.columnName);

            data.documents = document[this.displayField];
            if (data.documents) {
                this.data.push(data);
            }
        }
    }

    /**
     * Handles any post-initialization behavior needed with properties or sub-components for the visualization.
     *
     * @override
     */
    postInit() {
        // Backwards compatibility (documentLimit deprecated due to its redundancy with limit).
        this.options.limit = this.injector.get('documentLimit', this.options.limit);

        // Run the query to load the data.
        this.executeQueryChain();
    }

    /**
     * Updates any properties and/or sub-components as needed.
     *
     * @override
     */
    refreshVisualization() {
        //
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
        let query = new neon.query.Query().selectFrom(this.options.database.name, this.options.table.name).where(this.createWhere())
        .aggregate(neonVariables.COUNT, '*', '_docCount');

        let ignoreFilters = this.getFiltersToIgnore();
        if (ignoreFilters && ignoreFilters.length) {
            query.ignoreFilters(ignoreFilters);
        }

        this.executeQuery(this.options, query);
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
            [this.displayField]);

        for (let neonFilter of neonFilters) {

            // This will ignore a filter with multiple clauses.
            if (!neonFilter.filter.whereClause.whereClauses) {
                let field = this.findField(this.options.fields, neonFilter.filter.whereClause.lhs);
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
        return !!this.getCloseableFilters().length || this.showLegendContainer();
    }

    showLegendContainer(): boolean {
        let showLegend = false;
        if (!this.options.singleColor && this.colorKeys.length > 0) {
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
        return (this.activeData.length < this.responseData.length) && (this.activeData.length > 1);
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
        // Do nothing.
    }

    /**
     * Updates the pagination properties and the active data.
     */
    updateActiveData() {
        this.activeData = [];
        let offset = (this.page - 1) * this.options.limit;
        this.activeData = this.data.slice(offset, (offset + this.options.limit));
        this.lastPage = (this.data.length <= (offset + this.options.limit));
        this.createDisplayObjects(this.activeData);
        this.updateLegend();
    }

    /**
     * Checks the footer for a single annotation in the viewer and the conditions for the pagination(Prev/Next) bar
     */
    checkFooter() {
        return (this.docCount > this.options.limit) && (this.showFooterContainer());
    }
}
