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

import { AbstractSearchService, FilterClause, QueryPayload } from '../../services/abstract.search.service';
import { AbstractWidgetService } from '../../services/abstract.widget.service';
import { DatasetService } from '../../services/dataset.service';
import { FilterBehavior, FilterDesign, FilterService, SimpleFilterDesign } from '../../services/filter.service';

import { BaseNeonComponent } from '../base-neon-component/base-neon.component';
import { FieldMetaData } from '../../dataset';
import { neonUtilities } from '../../neon-namespaces';
import {
    OptionChoices,
    WidgetFieldArrayOption,
    WidgetFieldOption,
    WidgetFreeTextOption,
    WidgetOption,
    WidgetSelectOption
} from '../../widget-option';
import { MatDialog } from '@angular/material';

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

    public data: Data[] = [];

    public annotationVisible: boolean[] = [];

    // Either documentTextField or linkField
    public displayField: string;

    public seenTypes: string[] = [];
    public disabledSet: [string[]] = [] as any;
    public colorKeys: string[] = [];
    public indexInclusive: boolean;
    public offset = 0;

    constructor(
        protected widgetService: AbstractWidgetService,
        datasetService: DatasetService,
        filterService: FilterService,
        searchService: AbstractSearchService,
        injector: Injector,
        ref: ChangeDetectorRef,
        dialog: MatDialog
    ) {
        super(
            datasetService,
            filterService,
            searchService,
            injector,
            ref,
            dialog
        );

        this.updateOnSelectId = true;
        this.visualizationQueryPaginates = true;
    }

    private createFilterDesignOnAnnotationText(value?: any): FilterDesign {
        return {
            datastore: '',
            database: this.options.database.name,
            table: this.options.table.name,
            field: this.options.documentTextField.columnName,
            operator: '=',
            value: value
        } as SimpleFilterDesign;
    }

    /**
     * Creates and returns an array of field options for the visualization.
     *
     * @return {(WidgetFieldOption|WidgetFieldArrayOption)[]}
     * @override
     */
    createFieldOptions(): (WidgetFieldOption | WidgetFieldArrayOption)[] {
        return [
            new WidgetFieldOption('documentTextField', 'Document Text Field', true),
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
     * Returns each type of filter made by this visualization as an object containing 1) a filter design with undefined values and 2) a
     * callback to redraw the filter.  This visualization will automatically update with compatible filters that were set externally.
     *
     * @return {FilterBehavior[]}
     * @override
     */
    protected designEachFilterWithNoValues(): FilterBehavior[] {
        let behaviors: FilterBehavior[] = [];

        if (this.options.documentTextField.columnName) {
            behaviors.push({
                filterDesign: this.createFilterDesignOnAnnotationText(),
                // TODO THOR-1099 Should filtered text have specific HTML styles?
                redrawCallback: () => { /* Do nothing */ }
            } as FilterBehavior);
        }

        // TODO THOR-1098 createFilterDesignOnAnnotationPart
        // behaviors.push({
        //     filterDesign: this.createFilterDesignOnAnnotationPart(),
        //     redrawCallback: () => {}
        // } as FilterBehavior);

        return behaviors;
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
        if (!this.options.respondMode) {
            this.toggleFilters([this.createFilterDesignOnAnnotationText(item.documents)]);
        }
    }

    onClickPart(part, item) {
        if (part.annotation) {
            // TODO THOR-1098
            // this.toggleFilters([this.createFilterDesignOnAnnotationPart(part.type, part.text)]);
        } else {
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

    /**
     * Returns the list of valid annotation definitions for this visualization.
     * @method getValidAnnotations
     * @return {Array}
     * @private m
     */
    getValidAnnotations(__data) {
        //
    }

    doesAnnotationExist(data) {
        let document = data;
        let isValid = false;
        let annotationStartIndex = data.annotationStartIndex;
        let annotationEndIndex = data.annotationEndIndex;
        let annotationTextList = data.annotationTextList;
        // Let annotationTypeList = data.annotationTypeList;
        // let documentText = data.documents;

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

        // IsAnnotation exclusive or inclusive?
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
        // TODO return this.data.filter((detail) => this.isFieldValid(detail.details));
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
    findDocument(__dataItem) { /*
        Let document;

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
    saveAnnotations(__dataItem, __document) { /*
        This.getValidAnnotations().forEach(function(annotation) {
            //
        });*/
    }

    addAnnotation(__annotation) {
        // This.annotations
    }

    /**
     * Adds an annotation object for the given annotation definition to the given document object.
     * @method addAnnotationToDocument
     * @param {Object} annotation
     * @param {Object} document
     * @private
     */
    addAnnotationToDocument(__annotation, __document) { /*
        Let index = _.findIndex(document.annotations, function(annotationItem) {
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
    addAnnotationTypeToDocumentAnnotation(__type, __annotation) { /*
        Let index = _.findIndex(annotation.types, function(typeItem) {
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
    saveDetails(__dataItem, __document) {
        // TODO
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
                // Breaks annotations into parts
                for (let index = 0; index < document.annotationStartIndex.length; index++) {
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
                // If the first annotation is the very first text
                // Add the first annotation to the data.parts
                if (document.annotationStartIndex[index] === 0 && index === 0) {
                    let part = new Part();
                    part.text = documentText.substring(
                        document.annotationEndIndex[index] + this.offset, document.annotationStartIndex[index + 1]
                    );
                    part.annotation = false;
                    document.parts.push(annotationsPartList[index]);
                    document.parts.push(part);
                    // If this is the last annotation in the text
                } else if (document.annotationEndIndex[index] + this.offset === documentText.length) {
                    document.parts.push(annotationsPartList[index]);
                    // If the first annotation is not the first one in the text
                } else if (index === 0 && document.annotationStartIndex[index] !== 0) {
                    let innerPart = new Part();
                    let outerPart = new Part();
                    innerPart.text = documentText.substring(0, document.annotationStartIndex[index]);
                    innerPart.annotation = false;
                    outerPart.text = documentText.substring(
                        document.annotationEndIndex[index] + this.offset, document.annotationStartIndex[index + 1]
                    );
                    outerPart.annotation = false;

                    document.parts.push(innerPart);
                    document.parts.push(annotationsPartList[index]);
                    document.parts.push(outerPart);
                    // If there exists a normal part between annotation
                    // and this is not the last
                } else if (document.annotationEndIndex[index] !== document.annotationStartIndex[index + 1] &&
                    document.annotationEndIndex[index] + 1 !== annotationsPartList.length) {
                    let partNormal = new Part();
                    let startIndex = document.annotationEndIndex[index];
                    let endIndex = document.annotationStartIndex[index + 1];

                    partNormal.text = documentText.substring(startIndex + this.offset, endIndex);
                    partNormal.annotation = false;

                    document.parts.push(annotationsPartList[index]);
                    document.parts.push(partNormal);
                    // Document.parts.push(annotationsPartList[index]);
                    // If this is the last annotation but there's more normal text
                } else if (document.annotationEndIndex[index] === document.annotationEndIndex[annotationsPartList.length] &&
                    document.annotationEndIndex[index] + 1 < documentText.length) {
                    let lastNormalPart = new Part();
                    lastNormalPart.text = documentText.substring(
                        document.annotationEndIndex[index] + this.offset, annotationsPartList.length - 1
                    );
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
     * Finalizes the given visualization query by adding the aggregations, filters, groups, and sort using the given options.
     *
     * @arg {any} options A WidgetOptionCollection object.
     * @arg {QueryPayload} queryPayload
     * @arg {FilterClause[]} sharedFilters
     * @return {QueryPayload}
     * @override
     */
    finalizeVisualizationQuery(options: any, query: QueryPayload, sharedFilters: FilterClause[]): QueryPayload {
        let filter: FilterClause = this.searchService.buildFilterClause(this.displayField, '!=', null);

        this.displayField = options.respondMode ? options.linkField.columnName : options.documentTextField.columnName;

        if (options.respondMode && options.idField && this.selectedDataId) {
            filter = this.searchService.buildFilterClause(options.idField.columnName, '=', options.id);
        }

        // Override the default query fields because we want to find all fields.
        this.searchService.updateFieldsToMatchAll(query)
            .updateFilter(query, this.searchService.buildCompoundFilterClause(sharedFilters.concat(filter)));

        return query;
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
     * Handles any needed behavior whenever a select_id event is observed that is relevant for the visualization.
     *
     * @arg {any} options A WidgetOptionCollection object.
     * @arg {any} id
     * @override
     */
    public onSelectId(options: any, id: any) {
        options.id = id;
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
     * Returns whether the visualization query created using the given options is valid.
     *
     * @arg {any} options A WidgetOptionCollection object.
     * @return {boolean}
     * @override
     */
    validateVisualizationQuery(options: any): boolean {
        return !!(options.database.name && options.table.name && (options.documentTextField.columnName || options.linkField.columnName) &&
            (!options.respondMode || this.selectedDataId));
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
            this.disabledSet = this.disabledSet.filter((set) => !(set[0] === fieldName && set[1] === value)) as [string[]];
        }

        this.updateLegendColor();
    }

    updateLegendColor() {
        for (let data of this.data) {
            for (let part of data.parts) {
                let disabledValues = this.disabledSet.map(((set) => set[1]));

                if (disabledValues.includes(part.type)) {
                    part.highlightColor = 'rgb(255,255,255)';
                } else if (part.highlightColor && part.highlightColor.includes('rgb(255,255,255')) {
                    part.highlightColor = this.widgetService.getColor(this.options.database.name, this.options.table.name, part.type,
                        part.type).getComputedCssTransparencyHigh(this.visualization);
                }
            }
        }
    }

    /**
     * Transforms the given array of query results using the given options into an array of objects to be shown in the visualization.
     * Returns the count of elements shown in the visualization.
     *
     * @arg {any} options A WidgetOptionCollection object.
     * @arg {any[]} results
     * @return {number}
     * @override
     */
    transformVisualizationQueryResults(options: any, results: any[]): number {
        this.displayField = options.respondMode ? options.linkField.columnName : options.documentTextField.columnName;

        this.disabledSet = [] as any;
        this.colorKeys = [];

        this.data = this.processResults(options, results);
        this.createDisplayObjects(this.data);
        this.updateLegend();

        return this.data.length;
    }

    processResults(options: any, results: any[]): Data[] {
        let dataList: Data[] = [];
        for (let result of results) {
            let dataItem = {
                annotationStartIndex: [],
                annotationEndIndex: [],
                annotationTextList: [],
                annotationTypeList: [],
                documents: null,
                details: null,
                parts: [],
                validAnnotations: null
            };
            dataItem.annotationStartIndex = neonUtilities.deepFind(result, options.startCharacterField.columnName);
            dataItem.annotationEndIndex = neonUtilities.deepFind(result, options.endCharacterField.columnName);
            dataItem.annotationTextList = neonUtilities.deepFind(result, options.textField.columnName);
            dataItem.annotationTypeList = neonUtilities.deepFind(result, options.typeField.columnName);

            dataItem.documents = result[this.displayField];
            if (dataItem.documents) {
                dataList.push(dataItem);
            }
        }
        return dataList;
    }

    /**
     * Initializes any visualization properties when the widget is created.
     *
     * @override
     */
    initializeProperties() {
        // Backwards compatibility (documentLimit deprecated due to its redundancy with limit).
        this.options.limit = this.injector.get('documentLimit', this.options.limit);
    }

    /**
     * Updates and redraws the elements and properties for the visualization.
     *
     * @override
     */
    refreshVisualization() {
        //
    }

    showLegendContainer(): boolean {
        return (!this.options.singleColor && this.colorKeys.length > 0);
    }
}
