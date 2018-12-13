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
import { KEYS, TREE_ACTIONS, TreeNode } from 'angular-tree-component';
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
    public deletedFilter: any;

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
            lineage: nodeData.lineage,
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
        let counter = 0;
        this.taxonomyGroups = [];

        try {
            if (response && response.data && response.data.length && response.data[0]) {
                this.isLoading = true;

                response.data.forEach((d) => {

                    let categories: string[],
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
                        let foundCategory = this.getTaxonomyObject(this.taxonomyGroups, category);

                        //If the parent(category) node does not exist in the tree, add it
                        if (!foundCategory.object) {
                            let parent = {
                                id: counter++, name: category, children: [],
                                description: this.options.categoryField.columnName, checked: true
                            };

                            this.taxonomyGroups.push(parent);
                            foundCategory.object = this.taxonomyGroups[this.taxonomyGroups.length - 1];
                            foundCategory.index = this.taxonomyGroups.length - 1;
                        }

                        if (types) {
                            for (let type of types) {
                                //checks if a subChild node will be needed based on if dot notation exists
                                // within the child node string
                                let subTypeNeeded = type.includes('.') || (subTypes && types !== subTypes),
                                    foundType = null;

                                //checks if child(type) node exists in the tree and if not, adds it
                                if (foundCategory.object.children) {
                                    foundType = this.getTaxonomyObject(foundCategory.object.children,
                                        type.includes('.') ? type.split('.')[0] : type);
                                }

                                if (foundType && foundType.object) {
                                    if (subTypeNeeded) {
                                        let foundSubType = this.getTaxonomyObject(foundType.object.children, type);

                                        if (!foundSubType.object) {
                                            let subTypeObject = {
                                                id: counter++, name: type, lineage: category,
                                                description: this.options.subTypeField.columnName, checked: true
                                            };

                                            this.taxonomyGroups[foundCategory.index].children[foundType.index]
                                                .children.push(subTypeObject);
                                        }
                                    }
                                } else {
                                    let setType = type.includes('.') ? type.split('.')[0] : type,
                                        typeObject = {
                                            id: counter++, name: setType, children: [], lineage: category,
                                            description: this.options.typeField.columnName, checked: true
                                        };

                                    foundType.index = 0;
                                    this.taxonomyGroups[foundCategory.index].children.push(typeObject);

                                    if (this.taxonomyGroups[foundCategory.index].children &&
                                        this.taxonomyGroups[foundCategory.index].children.length > 1) {
                                        for (let i = 0; i < this.taxonomyGroups[foundCategory.index].children.length; i++) {
                                            if (type.includes(this.taxonomyGroups[foundCategory.index].children[i].name)) {
                                                foundType.index = i;
                                            }
                                        }
                                    }

                                    if (subTypeNeeded) {
                                        let subTypeObject = {
                                            id: counter++, name: type, lineage: category,
                                            description: this.options.subTypeField.columnName, checked: true
                                        };

                                        this.taxonomyGroups[foundCategory.index].children[foundType.index].children.push(subTypeObject);
                                    }
                                }
                                this.sortTaxonomyArrays(this.taxonomyGroups[foundCategory.index].children[foundType.index].children);
                            }//end types loop
                        }
                        this.sortTaxonomyArrays(this.taxonomyGroups[foundCategory.index].children);
                    }   //end categories loop

                });

                this.addCountsToTaxonomy(response.data, this.taxonomyGroups);
                this.sortTaxonomyArrays(this.taxonomyGroups);
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

    /**
     * This is needed to capture the double click event defined in the taxonomy options.
     * Without it, the double click event does not work.
     *
     */
    onEvent = ($event) => {
        //Intentionally empty
    }

    addCountsToTaxonomy(data: any, groups: any[]) {
        for (let group of groups) {
            let count = 0;
            group.nodeIds = [];
            data.forEach((d) => {
                let id = neonUtilities.deepFind(d, this.options.idField.columnName);
                if (neonUtilities.deepFind(d, group.description).includes(group.name) && !group.nodeIds.includes(id)) {
                    group.nodeIds.push(id);
                    count++;
                }
            });

            group.nodeCount = count;

            if (group.hasOwnProperty('children')) {
                this.addCountsToTaxonomy(data, group.children);
                let childCount = 0;
                for (let child of group.children) {
                    childCount += child.nodeCount;
                }

                if (!group.nodeCount) {
                    group.nodeCount = childCount;
                }

            }
        }
    }

    /**
     * Alphabetize the values added to the taxonomy
     *
     * @arg {any[]} array
     * @return {array}
     */
    sortTaxonomyArrays(array: any[]) {
        if (this.options.ascending) {
            neonUtilities.sortArrayOfObjects(array, 'name');
        } else {
            neonUtilities.sortArrayOfObjects(array, 'name', neonVariables.DESCENDING);
        }
    }

    getTaxonomyObject(group: any[], name: string) {
        let foundIndex = 0,
            foundObject = group.find((item, index) => {
                let found = item.name === name;
                foundIndex = index;
                return found;
            });

        return {
            index: foundIndex,
            object: foundObject
        };
    }

    checkRelatedNodes(node: TreeNode, $event: any) {
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

    updateChildNodesCheckBox(node: TreeNode, checked: boolean) {
        let setNode = node.data || node;
        setNode.checked = checked;

        if (setNode.children) {
            setNode.children.forEach((child) => this.updateChildNodesCheckBox(child, checked));
        }
    }

    updateParentNodesCheckBox(node: TreeNode) {
        if (node && node.level > 0 && node.children) {
            let setNode = node.data || node,
                allChildChecked = true,
                noChildChecked = true;

            for (let child of node.children) {
                let setChild = child.data || child;
                if (!setChild.checked) {
                    allChildChecked = false;
                } else if (setChild.checked) {
                    noChildChecked = false;
                }
            }

//todo: toggling children causes indeterminate to turn into checked AIDA-403
            if (allChildChecked) {
                setNode.checked = true;
                setNode.indeterminate = false;
            } else if (noChildChecked) {
                setNode.checked = false;
                setNode.indeterminate = false;
            } else {
                setNode.checked = true;
                setNode.indeterminate = true;
            }

            if (setNode.parent) {
                this.updateParentNodesCheckBox(setNode.parent);
            }
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
        this.getElementRefs().treeRoot.treeModel.update();
    }

    /**
     * Removes the given visualization filter object from this visualization.
     *
     * @arg {object} filter
     * @override
     */
    removeFilter(filter: any) {
        for (let i = 0; i < this.filters.length; i++) {
            if (this.filters[i].id === filter.id) {
                this.deletedFilter = this.filters[i];
                this.filters.splice(i, 1);
                break;
            }
        }
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
    handleFiltersChangedEvent($event): void {
        if ($event[0].whereClause) {
            for (let filter of this.filters) {
                if (filter.value === $event[0].whereClause.rhs) {
                    this.removeFilter(filter);
                    break;
                }
            }
        }

        for (let node of this.getElementRefs().treeRoot.treeModel.nodes) {
            if (this.deletedFilter && (this.deletedFilter.lineage === node.name ||
                this.deletedFilter.value === node.name)) {
                node.checked = true;
                this.updateChildNodesCheckBox(node, true);
                this.updateParentNodesCheckBox(node.parent);
            }
        }

        this.refreshVisualization();
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
