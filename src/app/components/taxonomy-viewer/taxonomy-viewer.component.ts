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

import { AbstractSearchService, NeonFilterClause, NeonQueryPayload, SortOrder } from '../../services/abstract.search.service';
import { DatasetService } from '../../services/dataset.service';
import { FilterService } from '../../services/filter.service';
import { KEYS, TREE_ACTIONS, TreeNode } from 'angular-tree-component';
import { BaseNeonComponent, TransformedVisualizationData } from '../base-neon-component/base-neon.component';
import { neonUtilities } from '../../neon-namespaces';
import {
    OptionChoices,
    WidgetFieldOption,
    WidgetFieldArrayOption,
    WidgetFreeTextOption,
    WidgetOption,
    WidgetSelectOption
} from '../../widget-option';
import * as neon from 'neon-framework';

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

    // TODO THOR-985
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
        datasetService: DatasetService,
        filterService: FilterService,
        searchService: AbstractSearchService,
        injector: Injector,
        ref: ChangeDetectorRef
    ) {

        super(
            datasetService,
            filterService,
            searchService,
            injector,
            ref
        );
    }

    /**
     * Creates and returns an array of field options for the visualization.
     *
     * @return {(WidgetFieldOption|WidgetFieldArrayOption)[]}
     * @override
     */
    createFieldOptions(): (WidgetFieldOption | WidgetFieldArrayOption)[] {
        return [
            new WidgetFieldOption('categoryField', 'Category Field', true),
            new WidgetFieldOption('idField', 'ID Field', true),
            new WidgetFieldOption('sourceIdField', 'Source ID Field', false),
            new WidgetFieldOption('linkField', 'Link Field', false),
            new WidgetFieldOption('typeField', 'Type Field', false),
            new WidgetFieldOption('subTypeField', 'Sub Type Field', false),
            new WidgetFieldArrayOption('filterFields', 'Filter Fields', false)
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
            new WidgetSelectOption('ascending', 'Sort Ascending', false, OptionChoices.NoFalseYesTrue),
            new WidgetFreeTextOption('id', 'ID', ''),
            new WidgetSelectOption('ignoreSelf', 'Filter Self', false, OptionChoices.NoFalseYesTrue),
            new WidgetSelectOption('extendedFilter', 'Extended Filter', false, OptionChoices.NoFalseYesTrue)
        ];
    }

    /**
     * Finalizes the given visualization query by adding the aggregations, filters, groups, and sort using the given options.
     *
     * @arg {any} options A WidgetOptionCollection object.
     * @arg {NeonQueryPayload} queryPayload
     * @arg {NeonFilterClause[]} sharedFilters
     * @return {NeonQueryPayload}
     * @override
     */
    finalizeVisualizationQuery(options: any, query: NeonQueryPayload, sharedFilters: NeonFilterClause[]): NeonQueryPayload {
        let filters: NeonFilterClause[] = [
            this.searchService.buildFilterClause(options.idField.columnName, '!=', null),
            this.searchService.buildFilterClause(options.idField.columnName, '!=', '')
        ];

        this.searchService.updateFilter(query, this.searchService.buildBoolFilterClause(sharedFilters.concat(filters)))
            .updateSort(query, options.categoryField.columnName, !options.ascending ? SortOrder.DESCENDING : SortOrder.ASCENDING);

        return query;
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
     * Returns the default limit for the visualization.
     *
     * @return {string}
     * @override
     */
    getVisualizationDefaultLimit(): number {
        return 10000;
    }

    /**
     * Returns the default title for the visualization.
     *
     * @return {string}
     * @override
     */
    getVisualizationDefaultTitle(): string {
        return 'Taxonomy Viewer';
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
        let filters = this.filters.some((existingFilter) => {
            return field === existingFilter.field && value === existingFilter.value;
        });

        return filters;
    }

    /**
     * Creates where clauses for the source field
     *
     * @arg {array} ids
     */
    createSourceClauses(ids) {
        let clauses = [];
        for (let id of ids) {
            clauses.push(neon.query.where(this.options.sourceIdField.columnName, '!=', id));
        }

        return clauses;
    }

    /**
     * Creates Neon and visualization filter objects for the given text.
     *
     * @arg {any} nodeData
     * @arg {array} relativeData
     */
    createNodeFilter(nodeData: any, relativeData?: any[]) {
        if (!this.options.filterFields) {
            return;
        }

        let nodeClause: any,
            nodeClauses = [],
            sourceClause: any,
            sourceClauses = [],
            runQuery = !this.options.ignoreSelf;

        let nodeFilter = {
            id: undefined,
            field: nodeData.description,
            prettyField: 'Tree Node',
            value: ''
        };

        let sourceFilter = {
            id: undefined,
            field: this.options.sourceIdField.columnName,
            prettyField: 'Tree Node',
            value: nodeData.lineage + ' ' + this.options.sourceIdField.columnName
        };

        if (relativeData.length) {
            for (let node of relativeData) {
                nodeClauses.push(neon.query.where(nodeFilter.field, '!=', node.name));
                if (node.sourceIds.length) {
                    sourceClauses.concat(this.createSourceClauses(node.sourceIds));
                }
            }

            nodeFilter.value = nodeData.lineage + ' ' + nodeData.description;
            nodeClause = neon.query.and.apply(neon.query, nodeClauses);

        } else {
            if (nodeData.sourceIds.length) {
                sourceClauses = this.createSourceClauses(nodeData.sourceIds);
            }
            nodeFilter.value = nodeData.name;
            nodeClause = neon.query.where(nodeFilter.field, '!=', nodeData.name);
        }

        this.addFilter(nodeFilter, runQuery, nodeClause);

        if (sourceClauses.length) {
            sourceClause = neon.query.and.apply(neon.query, sourceClauses);
            this.addFilter(sourceFilter, runQuery, sourceClause);
        }

    }

    /**
     * Add Neon and visualization filter objects
     * @arg {any} nodeData
     * @arg {array} relativeData
     */
    addFilter(filter: any, runQuery: boolean, clause: any) {
        this.filters.push(filter);
        this.addNeonFilter(this.options, runQuery, filter, clause);
    }

    /**
     * Returns whether the visualization query created using the given options is valid.
     *
     * @arg {any} options A WidgetOptionCollection object.
     * @return {boolean}
     * @override
     */
    validateVisualizationQuery(options: any): boolean {
        return !!(this.options.database.name && this.options.table.name && this.options.idField.columnName &&
            this.options.categoryField.columnName);
    }

    /**
     * Transforms the given array of query results using the given options into the array of objects to be shown in the visualization.
     *
     * @arg {any} options
     * @arg {any[]} results
     * @return {TransformedVisualizationData}
     * @override
     */
    transformVisualizationQueryResults(options: any, results: any[]): TransformedVisualizationData {
        let counter = 0;

        // TODO THOR-985
        this.taxonomyGroups = [];

        results.forEach((d) => {
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
                        id: counter++, name: category, lineage: category, children: [],
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

        this.addCountsToTaxonomy(results, this.taxonomyGroups);
        this.sortTaxonomyArrays(this.taxonomyGroups);

        return new TransformedVisualizationData(this.taxonomyGroups);
    }

    /**
     * This is needed to capture the double click event defined in the taxonomy options.
     * Without it, the double click event does not work.
     *
     */
    onEvent = () => {
        //Intentionally empty
    }

    addCountsToTaxonomy(data: any, groups: any[]) {
        for (let group of groups) {
            let count = 0;
            group.nodeIds = [];
            group.sourceIds = [];

            data.forEach((d) => {
                let id = neonUtilities.deepFind(d, this.options.idField.columnName);
                let sourceIds = neonUtilities.deepFind(d, this.options.sourceIdField.columnName);
                let description = neonUtilities.deepFind(d, group.description);
                let nameExists = description instanceof Array ?
                    description.find((s) => s.includes(group.name)) : description.includes(group.name);

                if (!!nameExists && !group.nodeIds.includes(id)) {
                    group.nodeIds.push(id);
                    group.sourceIds.push(sourceIds);
                    count++;
                }
            });

            group.nodeCount = count;
            group.sourceIds = neonUtilities.flatten(group.sourceIds)
                .filter((value, index, array) => array.indexOf(value) === index);

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
            neonUtilities.sortArrayOfObjects(array, 'name', 1);
        } else {
            neonUtilities.sortArrayOfObjects(array, 'name', -1);
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
        let relatives = [],
            tempFilters = this.filters.slice(0, this.filters.length); //array clone

        this.updateChildNodesCheckBox(node, $event.target.checked);
        this.updateParentNodesCheckBox(node.parent);

        for (let filter of tempFilters) {
            //If the filter value includes this node data and if the filter has a valid filter field
            if (filter.value.includes(node.data.lineage) || filter.value.includes(node.data.name)) {
                this.removeLocalFilterFromLocalAndNeon(this.options, filter, false, true);
                this.removeFilter(filter);
            }
        }

        //Gather the top level nodes in the taxonomy that are unchecked and add a != filter
        if (node.parent.level === 0 && $event.target.checked === false) {
            this.createNodeFilter(node.data, []);
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

            //If unchecked relatives exist, create a filter for them
            if (relatives.length) {
                this.createNodeFilter(node.data, relatives);
            }
        }
    }

    updateChildNodesCheckBox(node: TreeNode, checked: boolean) {
        let setNode = node.data || node;
        setNode.checked = checked;
        if (checked === false && setNode.indeterminate) {
            setNode.indeterminate = checked;
        }

        if (setNode.children) {
            setNode.children.forEach((child) => this.updateChildNodesCheckBox(child, checked));
        }
    }

    updateParentNodesCheckBox(node: TreeNode) {
        if (node && node.level > 0 && node.children) {
            let setNode = node.data || node,
                allChildrenChecked = true,
                noChildrenChecked = true;

            for (let child of node.children) {
                let setChild = child.data || child;
                if (node.level === 1 && !!setChild.indeterminate) {
                    allChildrenChecked = false;
                    noChildrenChecked = false;
                } else if (!setChild.checked) {
                    allChildrenChecked = false;
                } else if (setChild.checked) {
                    noChildrenChecked = false;
                }
            }

            if (allChildrenChecked) {
                setNode.checked = true;
                setNode.indeterminate = false;
            } else if (noChildrenChecked) {
                setNode.checked = false;
                setNode.indeterminate = false;
            } else {
                setNode.checked = true;
                setNode.indeterminate = true;
            }

            if (node.parent) {
                this.updateParentNodesCheckBox(node.parent);
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

    protected clearVisualizationData(options: any): void {
        // TODO THOR-985 Temporary function.
        this.transformVisualizationQueryResults(options, []);
    }
}
