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

import { BaseNeonComponent } from '../base-neon-component/base-neon.component';
import { FieldMetaData } from '../../dataset';
import { neonUtilities, neonVariables } from '../../neon-namespaces';
import * as neon from 'neon-framework';
import { Annotation, AnnotationViewerOptions } from './annotationViewerOption';
import { ANNOTATIONS } from '@angular/core/src/util/decorators';

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

    constructor(
        activeGridService: ActiveGridService,
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

        this.options = {
            documentTextField: this.injector.get('documentTextField', new FieldMetaData()),
            annotations: [{
                annotationLabel: '',
                startCharacterField: '',
                endCharacterField: '',
                textField: new FieldMetaData(),
                typeField: new FieldMetaData()
            }],
            anootationsInAnotherTable: false,
            annotationDatabase: new FieldMetaData(),
            annotationTable: new FieldMetaData(),
            annotationFields: [],
            docCount: 0,
            documentIdFieldInAnnotationTable: {},
            documentIdFieldInDocumentTable: {},
            documentLimit: 50,
            documents: [],
            details: [],
            annotationViewerRequiredField: new FieldMetaData(),
            annotationViewerOptionalField: new FieldMetaData()
        };

    }

    onClick(item) {
        let filter = {
            id: undefined, // This will be set in the success callback of addNeonFilter.
            field: this.options.documentTextField.columnName,
            value: item,
            prettyField: this.options.documentTextField.prettyName
        };
        if (this.filterIsUnique(filter)) {
            this.addLocalFilter(filter);
            let whereClause = neon.query.where(filter.field, '=', filter.value);
            this.addNeonFilter(true, filter, whereClause);
        }
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
     * @private
     */
    getValidAnnotations() {
        //return this.options.filter( function
    }

    getValidDetails() {
        return this.options.details.filter(function(detail) {
            return this.isFieldValid(detail.field);
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
     * Updates the colors for the types in the given document annotation object
     * and the mentions in the given list of document letter objects.
     * @method updateDocumentAnnotationColors
     * @param {Object} typeField
     * @param {Object} annotation
     * @param {Array} letters
     * @private
     */
    updateDocumentAnnotationColors(typeField, annotation, letters) {
        //
    }

    /**
     * Saves the details from the given data item in the given document object.
     * @method saveDetails
     * @param {Object} dataItem
     * @param {Object} document
     * @private
     */
    saveDetails(dataItem, document) {
        /*
        this.getValidDetails().forEach(function(detail) {
            //
            let value = neon.helpers.getNestedValue(dataItem, [detail.field.columnName]).map(function(value) {
                return value[detail].label === detail.label;
            }).join(',');

            let index = _.findIndex(document.details, function(documentDetail) {
                return documentDetail.label === detail.label;
            });
            if(index < 0) {
                document.details.push({
                    label: detail.label,
                    valuesToCOunts: {},
                    values: []
                });
                index = document.details.length - 1;
            }
            document.details[index].valuesToCounts[value] = (document.details[index].valuesToCounts[value] || 0) + 1;
            // Save the values from the values-to-counts mapping in another property so angular can iterate over them with ng-repeat.
            document.details[index].values = Object.keys(document.details[index].valuesToCounts).sort();
        });*/
    }

    /**
     * Creates the part objects shown in the display for the given document object using the mention objects
     * from its list of letter objects.
     * @method createDisplayObjects
     * @param {Object} document
     * @private
     */
    createDisplayObjects(document) {
        document.parts = [];

        let endIndex;
        let partText: '';
        let partMentions = [];
        let partHighlightColor;
        /*
        document.letters.forEach(function(letter, letterIndex) {
            // Filter out the mentions with annotation types that are hidden by the user for this document.
            let mentions = letter.mentions.filter(function(mention) {
                let annotationItem = _.find(document.annotations, function(annotationItem) {
                    return annotationItem.label === mention.label;
                });
                let typeItem = _.find(annotationItem.types, function(typeItem) {
                    return typeItem.label === mention.type;
                });
                return annotationItem && annotationItem.shown && typeItem && typeItem.shown;
            });

            if(mentions.length) {
                if (!partMentions.length) {
                    this.addPart();
                }
                let letterEndIndex = Math.max.apply(null, mentions.map(function(mention) {
                    return mention.end;
                }));
                // End the part at the highest character end index of any annotation type from any letter.
                endIndex = endIndex ? Math.max(endIndex, letterEndIndex) : letterEndIndex;
                partText += letter.letter;
                // Add all unique (and shown) annotation types to the list of types represented by this part.
                mentions.forEach(function(mention) {
                    let index = _.findIndex(partMentions, function(partMention) {
                        return partMention.label === mention.label &&
                        partMention.field === mention.field && partMention.text === mention.text && partMention.type === mention.type;
                    });
                    if(index < 0) {
                        partMentions.push(mention);
                        // If this part is already using a different highlight color,
                        //use the "other" highlight color instead; otherwise use the highlight color for this mention.
                        partHighlightColor = partHighlightColor ?
                        (partHighlightColor === mention.color ? partHighlightColor : OTHER_HIGHLIGHT_COLOR) : mention.color;
                    }
                });
            } else {
                partText += letter.letter;
                // Note that the start and end character index are both inclusive.
                if (letterIndex === endIndex) {
                    this.addPart();
                    endIndex = undefined;
                }
            }
        });

        // Add the last part to the list.
        this.addPart();*/
    }

    addParts(document, partText, partMentions, partHighlightColor) {
        /*
        if (partText) {
            // A part object contains a text string, a description string, a highlight color, and a list of mentions.
            document.parts.push({
                text: _.escape(partText),
                desc: partMentions.map(function(partMention) {
                    return (partMention.text || partText) + ' ( '
                    + partMention.label + (partMention.type ? ' ' + partMention.type : '') + ')';
                }).join(', '),
                highlightColor: partHighlightColor,
                mentions: partMentions
            });
            partText = '';
            partHighlightColor = undefined;
            // Always create a reference to a new (empty) list.
            partMentions = [];
        }*/
    }

    /**
     * Adds the given filter object to the visualization and removes any existing filter object with ID matching the given filter ID.
     *
     * @arg {object} filter
     */
    addVisualizationFilter(filter: any) {
        /*
        this.filters = this.filters.filter((existingFilter) => {
            return existingFilter.id !== filter.id;
        }).concat(filter);*/
    }

    /**
     * Creates and returns the Neon where clause for the visualization.
     *
     * @return {any}
     */
    createClause(): any {
        let clause = neon.query.where(this.options.documentTextField.columnName, '!=', null);

        if (this.hasUnsharedFilter()) {
            clause = neon.query.and(clause, neon.query.where(this.meta.unsharedFilterField.columnName, '=', this.meta.unsharedFilterValue));
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
        //let query = new neon.query.Query().selectFrom(this.meta.database.name, this.meta.table.name).where(this.createWhere());

        let aggregationFields = [this.options.documentTextField.columnName];
        let clause = neon.query.where(this.options.documentTextField.columnName, '!=', null);

        if (this.hasUnsharedFilter()) {
            clause = neon.query.and(clause, neon.query.where(this.meta.unsharedFilterField.columnName, '=', this.meta.unsharedFilterValue));
        }
        //return query.groupBy(aggregationFields).aggregate(neonVariables.COUNT, '*', 'count').sortBy('count', neonVariables.DESCENDING);
        let databaseName = this.meta.database.name;
        let tableName = this.meta.table.name;
        let limit = this.meta.limit;
        let query = new neon.query.Query().selectFrom(databaseName, tableName);
        let whereClause = this.createClause();

        return query.where(whereClause);
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
     * Creates and returns the where predicate for the visualization.
     *
     * @return {neon.query.WherePredicate}
     */
    createWhere(): neon.query.WherePredicate {
        // TODO Add or remove clauses as needed.
        let clauses: neon.query.WherePredicate[] = [neon.query.where(this.options.annotationViewerRequiredField.columnName, '!=', null)];

        // Only add the optional field if it is defined.
        if (this.options.annotationViewerOptionalField.columnName) {
            clauses.push(neon.query.where(this.options.annotationViewerOptionalField.columnName, '!=', null));
        }

        if (this.configFilter) {
            clauses.push(neon.query.where(this.configFilter.lhs, this.configFilter.operator, this.configFilter.rhs));
        }

        if (this.hasUnsharedFilter()) {
            clauses.push(neon.query.where(this.meta.unsharedFilterField.columnName, '=', this.meta.unsharedFilterValue));
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
                this.addVisualizationFilter(filter);
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
        if (this.options.documents.length) {
            return 'Total ' + this.options.documents.length;
        }
        if (!this.responseData.length || !this.activeData.length) {
            return 'No Data';
        }
        if (this.activeData.length === this.responseData.length) {
            return 'Total ' + super.prettifyInteger(this.activeData.length);
        }
        let begin = super.prettifyInteger((this.page - 1) * this.meta.limit + 1);
        let end = super.prettifyInteger(Math.min(this.page * this.meta.limit, this.responseData.length));
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
        // TODO Add or remove fields and properties as needed.
        return [{
            columnName: this.options.annotationViewerOptionalField.columnName,
            prettyName: this.options.annotationViewerOptionalField.prettyName
        }, {
            columnName: this.options.annotationViewerRequiredField.columnName,
            prettyName: this.options.annotationViewerRequiredField.prettyName
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
        let neonFilters = this.filterService.getFiltersForFields(this.meta.database.name, this.meta.table.name,
            [this.options.annotationViewerRequiredField.columnName]);

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
        // TODO Update!
        return 'Annotation Viewer';
    }

    // TODO Remove this function if you don't need pagination.
    /**
     * Increases the page and updates the active data.
     */
    goToNextPage() {
        if (!this.lastPage) {
            this.page++;
            this.updateActiveData();
        }
    }

    // TODO Remove this function if you don't need pagination.
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
        return !!(this.meta.database.name && this.meta.table.name && this.options.documentTextField.columnName);
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

        // TODO If you need to show an error message, set this.meta.errorMessage as needed.

        // TODO Change this behavior as needed to handle your query results.

        // The aggregation query response data will have a count field and all visualization fields.
        this.responseData = response.data.map((item) => {
            let label = item[this.options.annotationViewerRequiredField.columnName] +
                (this.options.annotationViewerOptionalField.columnName ? ' - ' +
                    item[this.options.annotationViewerOptionalField.columnName] : '');

            return {
                count: item.count,
                field: this.options.annotationViewerRequiredField.columnName,
                label: label,
                prettyField: this.options.annotationViewerRequiredField.prettyName,
                value: item[this.options.annotationViewerRequiredField.columnName]
            };
        });

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
        this.options.documents = [];
        for (let document of response.data) {
            this.options.documents.push(document[this.options.documentTextField.columnName]);
        }
        this.refreshVisualization();
    }

    /**
     * Updates the fields for the visualization once databases and tables are set.
     *
     * @override
     */
    onUpdateFields() {
        // Read the config bindings for the visualization.
        this.options.documentTextField = this.findFieldObject('documentTextField');
        // TODO Add or remove fields and properties as needed.
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

    // TODO Remove this function if you don't need a document count query.
    /**
     * Creates and runs the document count query.
     */
    runDocCountQuery() {
        let query = new neon.query.Query().selectFrom(this.meta.database.name, this.meta.table.name).where(this.createWhere());

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

        // TODO Change the list of filter fields here as needed.
        // Get all the neon filters relevant to this visualization.
        let neonFilters = this.filterService.getFiltersForFields(this.meta.database.name, this.meta.table.name,
            [this.options.annotationViewerRequiredField.columnName]);

        for (let neonFilter of neonFilters) {
            // TODO Change as needed.  Do your filters have multiple clauses?  Do your filters have multiple keys (like begin/end dates)?

            // This will ignore a filter with multiple clauses.
            if (!neonFilter.filter.whereClause.whereClauses) {
                let field = this.findField(this.meta.fields, neonFilter.filter.whereClause.lhs);
                let value = neonFilter.filter.whereClause.rhs;
                if (this.isVisualizationFilterUnique(field.columnName, value)) {
                    this.addVisualizationFilter(this.createVisualizationFilter(neonFilter.id, field.columnName, field.prettyName, value));
                }
            }
        }

        this.executeQueryChain();
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

    // TODO Remove this function if you don't need a footer-container.
    /**
     * Returns whether any components are shown in the footer-container.
     *
     * @return {boolean}
     */
    showFooterContainer(): boolean {
        // TODO Check for any other components.
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
        let offset = (this.page - 1) * this.meta.limit;
        this.activeData = this.options.documents.slice(offset, (offset + this.meta.limit));
        this.lastPage = (this.options.documents.length <= (offset + this.meta.limit));
        this.refreshVisualization();
    }
}
