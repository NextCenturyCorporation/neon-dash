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
    EventEmitter,
    Injector,
    OnDestroy,
    OnInit,
    Output,
    Renderer2,
    ViewChild,
    ViewEncapsulation
} from '@angular/core';

import { ActiveGridService } from '../../services/active-grid.service';
import { ConnectionService } from '../../services/connection.service';
import { DatasetService } from '../../services/dataset.service';
import { FilterService } from '../../services/filter.service';
import { ExportService } from '../../services/export.service';
import { ThemesService } from '../../services/themes.service';
import { VisualizationService } from '../../services/visualization.service';
import { KEYS, TREE_ACTIONS } from 'angular-tree-component';
import { BaseNeonComponent, BaseNeonOptions } from '../base-neon-component/base-neon.component';
import { FieldMetaData } from '../../dataset';
import { neonUtilities, neonVariables } from '../../neon-namespaces';
import * as neon from 'neon-framework';
import { current } from 'codelyzer/util/syntaxKind';

/**
 * Manages configurable options for the specific visualization.
 */
export class TaxonomyViewerOptions extends BaseNeonOptions {
    public ascending: boolean;
    public id: string;
    public categoryField: FieldMetaData;
    public idField: FieldMetaData;
    public typeField: FieldMetaData;
    public subTypeField: FieldMetaData;
    public filterFields: string[];
    public ignoreSelf: boolean;

    /**
     * Appends all the non-field bindings for the specific visualization to the given bindings object and returns the bindings object.
     *
     * @arg {any} bindings
     * @return {any}
     * @override
     */
    appendNonFieldBindings(bindings: any): any {
        bindings.ascending = this.ascending;
        bindings.id = this.id;
        bindings.filterFields = this.filterFields;
        bindings.ignoreSelf = this.ignoreSelf;

        return bindings;
    }

    /**
     * Returns the list of field properties for the specific visualization.
     *
     * @return {string[]}
     * @override
     */
    getFieldProperties(): string[] {
        return [
            'categoryField',
            'idField',
            'linkField',
            'typeField',
            'subTypeField'
        ];
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
     * Initializes all the non-field options for the specific visualization.
     *
     * @override
     */
    initializeNonFieldBindings() {
        this.ascending = this.injector.get('ascending', false);
        this.id = this.injector.get('id', '');
        this.ignoreSelf = this.injector.get('ignoreSelf', false);
        this.filterFields = this.injector.get('filterFields', []);
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
    @ViewChild('visualization', {read: ElementRef}) visualization: ElementRef;
    @ViewChild('headerText') headerText: ElementRef;
    @ViewChild('infoText') infoText: ElementRef;
    @ViewChild('treeRoot') treeRoot: ElementRef;

    //The visualization filters.
    public filters: {
        id: string,
        field: string,
        prettyField: string,
        value: string
    }[] = [];

    public options: TaxonomyViewerOptions;
    public taxonomyGroups: any[] = [];

    public testOptions = {
        actionMapping: {
            mouse: {
                dblClick: (tree, node, $event) => {
                    if (node.hasChildren) {
                        TREE_ACTIONS.TOGGLE_EXPANDED(tree, node, $event);
                    }
                }
            },
            keys: {
                [KEYS.ENTER]: (tree, node) => {
                    node.expandAll();
                }
            }
        }
    };

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

        let fields = [this.options.idField.columnName].concat(this.options.filterFields);

        if (this.options.categoryField.columnName) {
            fields.push(this.options.categoryField.columnName);
        }

        if (this.options.typeField.columnName) {
            fields.push(this.options.typeField.columnName);
        }

        if (this.options.subTypeField.columnName) {
            fields.push(this.options.subTypeField.columnName);
        }

        let whereClauses = [
            neon.query.where(this.options.idField.columnName, '!=', null),
            neon.query.where(this.options.idField.columnName, '!=', '')
        ];

        return query.withFields(fields).where(neon.query.and.apply(query, whereClauses)).sortBy(
            this.options.categoryField.columnName, this.options.ascending ? neonVariables.ASCENDING : neonVariables.DESCENDING);
    }

    /**
     * Creates and returns the text for the settings button and menu.
     *
     * @return {string}
     * @override
     */
    getButtonText(): string {
        return null;
    }

    /**
     * The taxonomy is a filter so no filters need to be returned
     *
     * @return {array}
     * @override
     */
    getCloseableFilters(): any[] {
        return null;
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
            infoText: this.infoText,
            treeRoot: this.treeRoot
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
            columnName: this.options.categoryField.columnName,
            prettyName: this.options.categoryField.prettyName
        }, {
            columnName: this.options.typeField.columnName,
            prettyName: this.options.typeField.prettyName
        }, {
            columnName: this.options.idField.columnName,
            prettyName: this.options.idField.prettyName
        }, {
            columnName: this.options.subTypeField.columnName,
            prettyName: this.options.subTypeField.prettyName
        }];
    }

    /**
     * Returns the list of filter IDs for the visualization to ignore.
     *
     * @return {array}
     * @override
     */
    getFiltersToIgnore() {
        return null;
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
     * Returns whether a visualization filter object with the given field and value strings exists in the list of visualization filters.
     *
     * @arg {string} field
     * @arg {string} value
     * @return {boolean}
     * @private
     */
    filterExists(field: string, value: string) {
        return this.filters.some((existingFilter) => {
            return field === existingFilter.field && value === existingFilter.value;
        });
    }

    /**
     * Creates Neon and visualization filter objects for the given text.
     *
     * @arg {string} text
     */
    createFilter(nodeData: any, relativeData?: any[]) {
        if (!this.options.filterFields) {
            return;
        }

        let clause: any;
        let runQuery = !this.options.ignoreSelf;

        let filter = {
            id: undefined,
            field: nodeData.description,
            prettyField: 'Tree Node',
            value: ''
        };

        if (relativeData.length) {
            let clauses = [];

            for (let node of relativeData) {
                clauses.push(neon.query.where(filter.field, '!=', node.name));
            }

            filter.value = nodeData.lineage + ' ' + nodeData.description;
            clause = neon.query.and.apply(neon.query, clauses);

        } else {
            filter.value = nodeData.name;
            clause = neon.query.where(filter.field, '!=', nodeData.name);
        }

        if (!this.filterExists(filter.field, filter.value)) {
            this.filters.push(filter);
            this.addNeonFilter(runQuery, filter, clause);
        }

    }

    /**
     * Returns whether the data and fields for the visualization are valid.
     *
     * @return {boolean}
     * @override
     */
    isValidQuery(): boolean {
        return !!(this.options.database && this.options.database.name && this.options.table && this.options.table.name &&
            this.options.idField && this.options.idField.columnName && this.options.categoryField &&
            this.options.categoryField.columnName);
    }

    /**
     * Handles the query results for the visualization; updates and/or redraws any properties as needed.
     *
     * @arg {object} response
     * @override
     */
    onQuerySuccess(response: any) {
        let groups = [];
        let counter = 0;
        this.taxonomyGroups = [];

        try {
            if (response && response.data && response.data.length && response.data[0]) {
                this.isLoading = true;

                response.data.forEach((d) => {

                    let categoryIndex = -1,
                        typeIndex = -1,
                        subTypeIndex = -1,
                        categories: string[],
                        types: string[],
                        subTypes: string[];

                    categories = neonUtilities.deepFind(d, this.options.categoryField.columnName);

                    if (this.options.typeField.columnName) {
                        types = neonUtilities.deepFind(d, this.options.typeField.columnName);
                    }

                    //TODO: Not fully implemented because subTypes do not currently exist, but might need to be in the future THOR-908
                    if (this.options.subTypeField.columnName) {
                        subTypes = neonUtilities.deepFind(d, this.options.typeField.columnName);
                    }

                    for (let category of categories) {
                        //checks if there are any parent(category) nodes in the tree
                        let foundCategory = groups.find((item, index) => {
                            let found = item.name === category;
                            categoryIndex = index;
                            return found;
                        });

                        //If the parent(category) node does not exist in the tree, add it
                        if (!foundCategory) {
                            let parent = {
                                id: counter++,
                                name: category,
                                children: [],
                                description: this.options.categoryField.columnName,
                                checked: true
                            };

                            groups.push(parent);
                            foundCategory = groups[groups.length - 1];
                            categoryIndex = groups.length - 1;
                        }

                        if (types) {
                            for (let type of types) {
                                //checks if a subChild node will be needed based on if dot notation exists
                                // within the child node string
                                let subTypeNeeded = type.includes('.') || (subTypes && types !== subTypes);

                                //checks if child(type) node exists in the tree and if not, adds it
                                let foundType = null;
                                if (foundCategory.children) {
                                    foundType = foundCategory.children.find((typeItem, index) => {
                                        let setType = type.includes('.') ? type.split('.')[0] : type;
                                        let found = typeItem.name === setType;
                                        typeIndex = index;
                                        return found;
                                    });
                                }

                                if (foundType) {
                                    if (subTypeNeeded) {

                                        let foundSubType = foundType.children.find((subType, index) => {
                                            subTypeIndex = index;
                                            let found = subType.name === type;
                                            return found;
                                        });

                                        if (!foundSubType) {
                                            let subTypeObject = {
                                                id: counter++,
                                                name: type,
                                                lineage: category,
                                                description: this.options.subTypeField.columnName,
                                                checked: true
                                            };
                                            //Alphabetize all values added to the taxonomy
                                            groups[categoryIndex].children[typeIndex].children.push(subTypeObject);
                                            if (this.options.ascending) {
                                                neonUtilities.sortArrayOfObjects(groups[categoryIndex]
                                                    .children[typeIndex].children, 'name');
                                            } else {
                                                neonUtilities.sortArrayOfObjects(groups[categoryIndex]
                                                    .children[typeIndex].children, 'name', neonVariables.DESCENDING);
                                            }

                                        }
                                    }
                                } else {
                                    let setType = type.includes('.') ? type.split('.')[0] : type;
                                    let typeObject = {
                                        id: counter++,
                                        name: setType,
                                        children: [],
                                        lineage: category,
                                        description: this.options.typeField.columnName,
                                        checked: true
                                    };

                                    typeIndex = 0;

                                    //Alphabetize all values added to the taxonomy
                                    groups[categoryIndex].children.push(typeObject);
                                    if (this.options.ascending) {
                                        neonUtilities.sortArrayOfObjects(groups[categoryIndex].children, 'name');
                                    } else {
                                        neonUtilities.sortArrayOfObjects(groups[categoryIndex].children, 'name', neonVariables.DESCENDING);
                                    }

                                    if (groups[categoryIndex].children && groups[categoryIndex].children.length > 1) {
                                        for (let i = 0; i < groups[categoryIndex].children.length; i++) {
                                            if (type.includes(groups[categoryIndex].children[i].name)) {
                                                typeIndex = i;
                                            }
                                        }
                                    }

                                    if (subTypeNeeded) {
                                        let subTypeObject = {
                                            id: counter++,
                                            name: type,
                                            lineage: category,
                                            description: this.options.subTypeField.columnName,
                                            checked: true,
                                            expanded: false
                                        };

                                        groups[categoryIndex].children[typeIndex].children.push(subTypeObject);
                                        if (this.options.ascending) {
                                            neonUtilities.sortArrayOfObjects(groups[categoryIndex]
                                                .children[typeIndex].children, 'name');
                                        } else {
                                            neonUtilities.sortArrayOfObjects(groups[categoryIndex]
                                                .children[typeIndex].children, 'name', neonVariables.DESCENDING);
                                        }
                                    }
                                }
                            }
                        }
                    }

                });

                this.taxonomyGroups = groups;
                this.refreshVisualization();

            } else {
                this.errorMessage = 'No Data';
                this.refreshVisualization();
            }
        } catch (e) {
            console.error(this.options.title + ' Error: ' + e);
            this.errorMessage = 'Error';
            this.refreshVisualization();
        }

    }

    /**
     * Handles any post-initialization behavior needed with properties for the visualization.
     *
     * @override
     */
    postInit() {
        this.executeQueryChain();
    }

    onEvent = () => {
        /* This is needed to capture the double click event defined in the taxonomy options.
           Without it, the double click event does not work.*/
    }

    checkRelatedNodes(node, $event) {

        let relatives = [];
        this.updateChildNodesCheckBox(node, $event.target.checked);
        this.updateParentNodesCheckBox(node.parent);
        for (let filter of this.filters) {
            //If the filter value includes this node data and if the filter has a valid filter field
            if (filter.value.includes(node.data.lineage) || filter.value.includes(node.data.name)) {
                this.removeLocalFilterFromLocalAndNeon(filter, false, true);
                this.removeFilter(filter);
            }
        }

        if (node.parent.level === 0 && $event.target.checked === false) {
            this.createFilter(node.data, []);
        } else if (node.parent.level > 0) {
            //Add parents' siblings if they exist
            if (node.parent.parent && !node.parent.parent.data.virtual) {
                relatives = this.retrieveUnselectedNodes(node.parent.parent.data.children);
            }

            //Add siblings if they exist
            if (relatives.length) {
                relatives.concat(this.retrieveUnselectedNodes(node.parent.data.children));
            } else {
                relatives = this.retrieveUnselectedNodes(node.parent.data.children);
            }
            this.createFilter(node.data, relatives);
        }

    }

    updateChildNodesCheckBox(node, checked) {
        node.data.checked = checked;
        if (node.children) {
            node.children.forEach((child) => this.updateChildNodesCheckBox(child, checked));
        }
    }

    updateParentNodesCheckBox(node) {
        if (node && node.level > 0 && node.children) {
            let allChildChecked = true,
                noChildChecked = true;

            for (let child of node.children) {
                if (!child.data.checked) {
                    allChildChecked = false;
                } else if (child.data.checked) {
                    noChildChecked = false;
                }
            }

//todo: toggling children causes indeterminate to turn into checked AIDA-403
            if (allChildChecked) {
                node.data.checked = true;
                node.data.indeterminate = false;
            } else if (noChildChecked) {
                node.data.checked = false;
                node.data.indeterminate = false;
            } else {
                node.data.checked = true;
                node.data.indeterminate = true;
            }
            this.updateParentNodesCheckBox(node.parent);
        }
    }

    retrieveUnselectedNodes(nodeArray: any[]) {
        let relatives = [];

        for (let node of nodeArray) {
            if (node.children && node.children.length) {
                for (let child of node.children) {
                    if (child.checked === false) {
                        relatives.push(child);
                    }
                }
            } else {
                if (node.checked === false) {
                    relatives.push(node);
                }
            }
        }

        return relatives;
    }

    /**
     * Updates any properties as needed.
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
        //TODO:Update Taxonomy when filter from filter tray is deleted AIDA-390

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
        let neonFilters = this.filterService.getFiltersForFields(this.options.database.name,
            this.options.table.name, this.options.filterFields);
        this.filters = [];
        for (let neonFilter of neonFilters) {
            if (!neonFilter.filter.whereClause.whereClauses) {
                let field = this.options.findField(neonFilter.filter.whereClause.lhs);
                let value = neonFilter.filter.whereClause.rhs;
                let myFilter = {
                    id: neonFilter.id,
                    field: field.columnName,
                    prettyField: field.prettyName,
                    value: value,
                    nodeIds: value
                };
                if (!this.filterExists(myFilter.field, myFilter.value)) {
                    this.filters.push(myFilter);
                }
            }
        }
    }

    /**
     * Called after the filters in the filter service have changed.
     * Defaults to calling setupFilters() then executeQueryChain()
     */
    handleFiltersChangedEvent(): void {
        //TODO:Update Taxonomy when filter from filter tray is deleted AIDA-390
        /*        console.log(this.getElementRefs().treeRoot.treeModel.nodes);
                console.log(this.treeRoot.treeModel.nodes);*/
    }

    /**
     * Sets the visualization fields and properties in the given bindings object needed to save layout states.
     *
     * @arg {object} bindings
     * @override
     */
    subGetBindings(bindings: any) {
        bindings.idField = this.options.idField.columnName;
        bindings.categoryField = this.options.categoryField.columnName;
        bindings.typeField = this.options.typeField.columnName;
        bindings.subTypeField = this.options.subTypeField.columnName;
    }

    /**
     * Destroys any taxonomy sub-components if needed.
     *
     * @override
     */
    subNgOnDestroy() {
        // Do nothing.
    }

    /**
     * Initializes any taxonomy sub-components if needed.
     *
     * @override
     */
    subNgOnInit() {
        //
    }
}
