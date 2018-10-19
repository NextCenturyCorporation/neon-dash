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
    // TODO Add and remove properties as needed.  Do NOT assign defaults to fields or else they will override updateFieldsOnTableChanged.

    public ascending: boolean;
    public id: string;

    public categoryField: FieldMetaData;
    public displayField: FieldMetaData;
    public idField: FieldMetaData;
    public linkField: FieldMetaData;
    public typeField: FieldMetaData;
    public subTypeField: FieldMetaData;
    public nodeNameField: FieldMetaData;
    public filterFields: string[];
    public showOnlyFiltered: boolean;
    public ignoreSelf: boolean;

    /**
     * Initializes all the non-field options for the specific visualization.
     *
     * @override
     */
    onInit() {
        this.ascending = this.injector.get('ascending', false);
        this.id = this.injector.get('id', '');
        this.showOnlyFiltered = this.injector.get('showOnlyFiltered', false);
        this.ignoreSelf = this.injector.get('ignoreSelf', false);
        this.filterFields = this.injector.get('filterFields', []);
    }

    /**
     * Updates all the field options for the specific visualization.  Called on init and whenever the table is changed.
     *
     * @override
     */
    updateFieldsOnTableChanged() {
        this.categoryField = this.findFieldObject('categoryField');
        this.displayField = this.findFieldObject('displayField');
        this.idField = this.findFieldObject('idField');
        this.linkField = this.findFieldObject('linkField');
        this.typeField = this.findFieldObject('typeField');
        this.subTypeField = this.findFieldObject('subTypeField');
        this.nodeNameField = this.findFieldObject('nodeNameField');
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
    @ViewChild('treeNodeTemplate') taxonomyTemplate: ElementRef;
    @ViewChild('treeNodeCheckboxes') taxonomyCheckboxes: ElementRef;

    @Output() clickNode = new EventEmitter<Node>();

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
    public taxonomyGroups: any[] = [];
    public renderer: Renderer2;

    //todo: remove once real data gets mapped
    public testOptions = {
        actionMapping: {
            mouse: {
                dblClick: (tree, node, $event) => {
                    if (node.hasChildren) { TREE_ACTIONS.TOGGLE_EXPANDED(tree, node, $event); }
                }/*,
                click: (tree, node, $event) => {
                    console.log(node)
                    console.log(tree)
                }*/
            },
            keys: {
                [KEYS.ENTER]: (tree, node, $event) => {
                    node.expandAll();
                }
            }
        },
        isExpandedField: 'expanded'

        /*
                loadingComponent: 'loading, please wait...'
        displayField: 'name',
                //isExpandedField: 'expanded',
                idField: 'id',
                hasChildrenField: 'children',
        ,
                nodeHeight: 23,
                allowDrag: (node) => {
                    return true;
                },
                allowDrop: (node) => {
                    return true;
                },
                levelPadding: 10,
                useVirtualScroll: true,
                animateExpand: true,
                scrollOnActivate: true,
                animateSpeed: 30,
                animateAcceleration: 1.2,*/
       // scrollContainer: document.documentElement//html
    };

    constructor(
        activeGridService: ActiveGridService, connectionService: ConnectionService, datasetService: DatasetService,
        filterService: FilterService, exportService: ExportService, injector: Injector, themesService: ThemesService,
        ref: ChangeDetectorRef, visualizationService: VisualizationService, private renderer2: Renderer2
    ) {

        super(
            activeGridService, connectionService, datasetService, filterService,
            exportService, injector, themesService, ref, visualizationService
        );

        this.options = new TaxonomyViewerOptions(this.injector, this.datasetService, 'Taxonomy Viewer');
        this.renderer = renderer2;
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

        if (this.options.displayField.columnName) {
            fields.push(this.options.displayField.columnName);
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

        if (this.options.nodeNameField.columnName) {
            fields.push(this.options.nodeNameField.columnName);
        }

        let whereClauses = [
            neon.query.where(this.options.idField.columnName, '!=', null),
            neon.query.where(this.options.idField.columnName, '!=', '')
        ];

        let ignoreFilters = this.getFiltersToIgnore();
        if (ignoreFilters && ignoreFilters.length) {
            query.ignoreFilters(ignoreFilters);
        }

        return query.withFields(fields).where(neon.query.and.apply(query, whereClauses)).sortBy(
            this.options.categoryField.columnName, neonVariables.ASCENDING);
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
            columnName: this.options.categoryField.columnName,
            prettyName: this.options.categoryField.prettyName
        }, {
            columnName: this.options.typeField.columnName,
            prettyName: this.options.typeField.prettyName
        }, {
            columnName: this.options.idField.columnName,
            prettyName: this.options.idField.prettyName
        }, {
            columnName: this.options.displayField.columnName,
            prettyName: this.options.displayField.prettyName
        }, {
            columnName: this.options.linkField.columnName,
            prettyName: this.options.linkField.prettyName
        }, {
            columnName: this.options.subTypeField.columnName,
            prettyName: this.options.subTypeField.prettyName
        }, {
            columnName: this.options.nodeNameField.columnName,
            prettyName: this.options.nodeNameField.prettyName
        }];
    }

    /**
     * Returns the list of filter IDs for the visualization to ignore.
     *
     * @return {array}
     * @override
     */
    getFiltersToIgnore(): string[] {
        if (!this.options.ignoreSelf) {
            return null;
        }

        // Get all the neon filters relevant to this visualization.
        let neonFilters = this.filterService.getFiltersForFields(this.options.database.name, this.options.table.name,
            this.options.filterFields);

        let filterIdsToIgnore = [];
        for (let neonFilter of neonFilters) {
            filterIdsToIgnore.push(neonFilter.id);
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
        if (relativeData.length) {
            let clauses = [];

            let filter = {
                id: undefined,
                field: nodeData.description,
                prettyField: 'Tree Node',
                value: nodeData.lineage + ' ' + nodeData.description
            };

            for (let node of relativeData) {
                clauses.push(neon.query.where(filter.field, '!=', node.name));
            }

            clause = neon.query.and.apply(neon.query, clauses);

            if (!this.filterExists(filter.field, filter.value)) {
                this.filters.push(filter);
                this.addNeonFilter(runQuery, filter, clause);
            }

        } else {
            let filter = {
                id: undefined,
                field: nodeData.description,
                prettyField: 'Tree Node',
                value: nodeData.name
            };

            clause = neon.query.where(filter.field, '!=', nodeData.name);
            if (!this.filterExists(filter.field, filter.value)) {
                this.filters.push(filter);
                this.addNeonFilter(runQuery, filter, clause);
            }
        }

    }

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
        return !!(this.options.database && this.options.database.name && this.options.table && this.options.table.name &&
            this.options.idField && this.options.idField.columnName && this.options.categoryField &&
            this.options.categoryField.columnName && this.options.typeField && this.options.typeField.columnName);
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
        let groups = [];
        let counter = 0;

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

                    //TODO: Not fully implemented because subTypes do not currently exist, but might need to be in the future
                    if (this.options.subTypeField.columnName) {
                        subTypes = neonUtilities.deepFind(d, this.options.typeField.columnName);
                    }

                    for (let category of categories) {
                        //create root node of the tree first
                        let parent = {
                            id: counter++,
                            name: category,
                            children: [],
                            description: this.options.categoryField.columnName,
                            checked: true
                        };

                        //checks if there are any parent(category) nodes in the tree
                        if (groups) {
                            //checks if the parent(category) node exists in the tree, if not adds it
                            let foundCategory = groups.find((item, index) => {
                                let found = item.name === category;
                                categoryIndex = index;
                                return found;
                            });

                            if (foundCategory) {
                                if (types) {
                                    for (let type of types) {
                                        //checks if a subChild node will be needed based on if dot notation exists
                                        // within the child node string
                                        let subTypeNeeded  = type.includes('.') || (subTypes && types !== subTypes);

                                        //checks if child(type) node exists in the tree, if not adds it
                                        let foundType = foundCategory.children.find((typeItem, index) => {
                                            let found = typeItem.name === type.split('.')[0];
                                            typeIndex = index;
                                            return found;
                                        });

                                        if (foundType) {
                                            if (subTypeNeeded) {

                                                let foundSubType = foundType.children.find((subType, index) => {
                                                    subTypeIndex = index;
                                                    let found = subType.name === type;
                                                    return found;
                                                });

                                                if (!foundSubType) {
                                                    //Alphabetize all values added to the taxonomy
                                                    let subTypeObject = {
                                                        id: counter++,
                                                        name: type,
                                                        lineage: category,
                                                        description: this.options.subTypeField.columnName,
                                                        checked: true
                                                    };

                                                    groups[categoryIndex].children[typeIndex].children.push(subTypeObject);
                                                    groups[categoryIndex].children[typeIndex].children.sort(this.compareValues('name'));
                                                }
                                            }
                                        } else {

                                            let typeObject = {
                                                id: counter++,
                                                name: subTypeNeeded ? type.split('.')[0] : type,
                                                children: [],
                                                lineage: category,
                                                description: this.options.typeField.columnName,
                                                checked: true
                                            };

                                            typeIndex = 0;

                                            //Alphabetize all values added to the taxanomy
                                            groups[categoryIndex].children.push(typeObject);
                                            groups[categoryIndex].children.sort(this.compareValues('name'));

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
                                                groups[categoryIndex].children[typeIndex].children.sort(this.compareValues('name'));
                                            }

                                        }
                                    }
                                }
                            } else {
                                groups.push(parent);
                            }
                        } else {
                            groups.push(parent);
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

    onEvent = ($event) => {
        //needed for the taxonomy options
    }

    checkRelatedNodes(node, $event) {
        this.updateChildNodesCheckBox(node, $event.target.checked);
        this.updateParentNodesCheckBox(node.parent);

        for (let filter of this.filters) {
            //If the filter value includes this node data and if the filter has a valid filter field
            if ((filter.value.includes(node.data.lineage) || filter.value.includes(node.data.name)) &&
                (filter.field === node.data.description || filter.field === node.parent.data.description)) {
                this.removeLocalFilterFromLocalAndNeon(filter, false, true);
                this.removeFilter(filter);
            }
        }

        let relatives = [];
        if (node.parent.data.indeterminate === true ||
            (node.parent.parent && node.parent.parent.data.indeterminate === true)) {

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

        } else if ($event.target.checked === false) {
            this.createFilter(node.data, []);
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

            if (allChildChecked) {
                //console.log("all children checked")
                node.data.checked = true;
                node.data.indeterminate = false;
            } else if (noChildChecked) {
                //console.log("no children checked")
                node.data.checked = false;
                node.data.indeterminate = false;
            } else {
                //console.log("some children checked")
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
        bindings.idField = this.options.idField.columnName;
        bindings.categoryField = this.options.categoryField.columnName;
        bindings.typeField = this.options.typeField.columnName;
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
