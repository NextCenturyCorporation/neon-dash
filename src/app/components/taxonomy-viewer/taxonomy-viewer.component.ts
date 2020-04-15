/**
 * Copyright 2020 CACI (formerly Next Century Corporation)
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
    OnDestroy,
    OnInit,
    ViewChild,
    ViewEncapsulation
} from '@angular/core';

import {
    AbstractFilterDesign,
    AbstractSearchService,
    CompoundFilterType,
    ConfigOptionField,
    ConfigOptionFieldArray,
    ConfigOptionFreeText,
    ConfigOption,
    ConfigOptionSelect,
    CoreUtil,
    FieldConfig,
    FieldKey,
    FilterClause,
    FilterCollection,
    ListFilterDesign,
    OptionChoices,
    SearchObject,
    SortOrder
} from '@caci-critical-insight-solutions/nucleus-core';
import { DashboardService } from '../../services/dashboard.service';
import { InjectableFilterService } from '../../services/injectable.filter.service';
import { KEYS, TREE_ACTIONS, TreeNode } from 'angular-tree-component';
import { BaseNeonComponent } from '../base-neon-component/base-neon.component';
import { MatDialog } from '@angular/material';

let styleImport: any;

export interface TaxonomyNode {
    id: string;
    externalId?: string;
    duplicateLabel?: boolean;
    hidden?: boolean;
    sourceIds: string[];
    parent?: TaxonomyGroup;
    externalName?: string;
    name: string;
    level?: number;
    checked?: boolean;
    indeterminate?: boolean;
    description: FieldConfig;
}

export interface TaxonomyGroup extends TaxonomyNode {
    nodeCount: number;
    childrenMap?: { [key: string]: TaxonomyGroup | TaxonomyNode };
    nodeIds: Set<string>;
    children?: (TaxonomyGroup | TaxonomyNode)[];
    leafCount?: number;
}

@Component({
    selector: 'app-taxonomy-viewer',
    templateUrl: './taxonomy-viewer.component.html',
    styleUrls: [
        './taxonomy-viewer.component.scss'
    ],
    encapsulation: ViewEncapsulation.Emulated,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class TaxonomyViewerComponent extends BaseNeonComponent implements OnInit, OnDestroy {
    // HTML element references used by the superclass for the resizing behavior.
    @ViewChild('headerText', { static: true }) headerText: ElementRef;
    @ViewChild('infoText', { static: true }) infoText: ElementRef;
    @ViewChild('treeRoot', { static: true }) treeRoot: ElementRef;

    private counter = 0;
    public taxonomyGroups: TaxonomyGroup[] = [];

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
                [KEYS.ENTER]: (__tree, node) => {
                    node.expandAll();
                }
            }
        }
    };

    constructor(
        dashboardService: DashboardService,
        filterService: InjectableFilterService,
        searchService: AbstractSearchService,
        ref: ChangeDetectorRef,
        dialog: MatDialog,
        public visualization: ElementRef
    ) {
        super(
            dashboardService,
            filterService,
            searchService,
            ref,
            dialog
        );

        if (!styleImport) {
            styleImport = document.createElement('link');
            styleImport.rel = 'stylesheet';
            styleImport.href = 'assets/angular-tree-component/dist/angular-tree-component.css';
            document.head.appendChild(styleImport);
        }
    }

    private createFilterDesignsForField(field: FieldConfig): AbstractFilterDesign[] {
        let designs: AbstractFilterDesign[] = [];
        // Match a filter with one or more NOT EQUALS filters on the specific filter field.
        designs.push(this.createFilterDesignOnList(field));
        return designs;
    }

    private createFilterDesignOnList(field: FieldConfig, values: any[] = [undefined]): ListFilterDesign {
        return new ListFilterDesign(CompoundFilterType.AND, this.options.datastore.name + '.' + this.options.database.name + '.' +
            this.options.table.name + '.' + field.columnName, '!=', values);
    }

    /**
     * Creates and returns an array of options for the visualization.
     *
     * @return {ConfigOption[]}
     * @override
     */
    protected createOptions(): ConfigOption[] {
        return [
            new ConfigOptionField('categoryField', 'Category Field', true),
            new ConfigOptionField('idField', 'ID Field', true),
            new ConfigOptionField('sourceIdField', 'Source ID Field', false),
            new ConfigOptionField('linkField', 'Link Field', false),
            new ConfigOptionField('typeField', 'Type Field', false),
            new ConfigOptionField('subTypeField', 'Sub Type Field', false),
            new ConfigOptionField('valueField', 'Value Field', false),
            new ConfigOptionFieldArray('filterFields', 'Filter Fields', false),
            new ConfigOptionSelect('ascending', 'Sort Ascending', false, false, OptionChoices.NoFalseYesTrue),
            new ConfigOptionFreeText('id', 'ID', false, ''),
            new ConfigOptionSelect('ignoreSelf', 'Filter Self', false, false, OptionChoices.YesFalseNoTrue),
            new ConfigOptionSelect('extendedFilter', 'Extended Filter', false, false, OptionChoices.NoFalseYesTrue)
        ];
    }

    /**
     * Returns the design for each type of filter made by this visualization.  This visualization will automatically update itself with all
     * compatible filters that were set internally or externally whenever it runs a visualization query.
     *
     * @return {AbstractFilterDesign[]}
     * @override
     */
    protected designEachFilterWithNoValues(): AbstractFilterDesign[] {
        let designs: AbstractFilterDesign[] = [];

        if (this.options.categoryField.columnName) {
            designs = designs.concat(this.createFilterDesignsForField(this.options.categoryField));
        }

        if (this.options.typeField.columnName) {
            designs = designs.concat(this.createFilterDesignsForField(this.options.typeField));
        }

        if (this.options.subTypeField.columnName) {
            designs = designs.concat(this.createFilterDesignsForField(this.options.subTypeField));
        }

        return designs;
    }

    /**
     * Finalizes the given visualization query by adding the aggregations, filters, groups, and sort using the given options.
     *
     * @arg {any} options A WidgetOptionCollection object.
     * @arg {SearchObject} SearchObject
     * @arg {FilterClause[]} filters
     * @return {SearchObject}
     * @override
     */
    finalizeVisualizationQuery(options: any, query: SearchObject, filters: FilterClause[]): SearchObject {
        this.searchService.withFilter(query, this.searchService.createCompoundFilterClause(filters.concat([
            this.searchService.createFilterClause({
                datastore: options.datastore.name,
                database: options.database.name,
                table: options.table.name,
                field: options.idField.columnName
            } as FieldKey, '!=', null)
        ]))).withOrder(query, {
            datastore: options.datastore.name,
            database: options.database.name,
            table: options.table.name,
            field: options.categoryField.columnName
        } as FieldKey, !options.ascending ? SortOrder.DESCENDING : SortOrder.ASCENDING);

        return query;
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

    private isTaxonomyNodeFiltered(filters: FilterCollection, field: FieldConfig, value: any) {
        return filters.getCompatibleFilters(this.createFilterDesignOnList(field, [value])).length;
    }

    /**
     * Returns whether the visualization query created using the given options is valid.
     *
     * @arg {any} options A WidgetOptionCollection object.
     * @return {boolean}
     * @override
     */
    validateVisualizationQuery(options: any): boolean {
        return !!(options.database.name && options.table.name && options.idField.columnName && options.categoryField.columnName);
    }

    mergeTaxonomyData(
        group: TaxonomyGroup,
        lineage: { category: string | string[], type: string | string[], subtype?: string | string[] },
        child: TaxonomyNode,
        filters: FilterCollection
    ) {
        let currentGroup = group;
        let toArray = (el: string | string[]) => Array.isArray(el) ? el : (el ? el.split('.') : []);

        // Compose all layers into single array of [name, type][]
        const categoriesAndTypes: [string[], string][] = [
            [toArray(lineage.category), 'category'],
            [toArray(lineage.type), 'type'],
            [toArray(lineage.subtype), 'subtype']
        ];

        let pos = 0;
        for (const [categoryOrTypeList, fieldNamePrefix] of categoriesAndTypes) {
            let subPos = 0;
            // Travel inward, one level at a time
            for (const categoryOrType of categoryOrTypeList) {
                // Traverse forward in each layer
                if (!(categoryOrType in currentGroup.childrenMap)) {
                    // Find field that this node should be filtered by
                    const fieldToCheck = this.options[`${fieldNamePrefix}Field`];
                    // The node's type.subtype
                    const dottedNodeType = categoryOrTypeList.slice(0, subPos + 1).join('.');

                    // Build new object
                    const node: TaxonomyGroup = {
                        id: `${this.counter++}`,
                        description: fieldToCheck,
                        name: categoryOrType,
                        externalName: dottedNodeType,
                        parent: currentGroup,
                        checked: !this.isTaxonomyNodeFiltered(filters, fieldToCheck, dottedNodeType),
                        sourceIds: [],
                        nodeIds: new Set(),
                        level: pos + 1,
                        nodeCount: 0,
                        leafCount: 0,
                        children: [],
                        childrenMap: {}
                    };

                    // Register node with parent
                    currentGroup.childrenMap[categoryOrType] = node;
                    currentGroup.children.push(node);
                }
                // Descend into child
                const next = currentGroup.childrenMap[categoryOrType] as TaxonomyGroup;
                currentGroup = next;
                pos += 1;
                subPos += 1;
            }
        }

        // If new node, walk back up to parent, recording counts
        if (!(child.externalId in currentGroup.childrenMap)) {
            currentGroup.childrenMap[child.externalId] = child;
            currentGroup.leafCount += 1;

            if (child.name !== child.externalId) {
                currentGroup.children.push(child);
            }
            child.parent = currentGroup;
            child.level = pos + 1;

            // Walk back up if a new item
            while (currentGroup && currentGroup.id) {
                if (!currentGroup.nodeIds.has(child.externalId)) {
                    currentGroup.nodeCount += 1;
                    if (child.externalId) {
                        currentGroup.nodeIds.add(child.externalId);
                    }
                }
                if (currentGroup.sourceIds && child.sourceIds) {
                    currentGroup.sourceIds.push(...child.sourceIds);
                }
                currentGroup = currentGroup.parent;
            }
        }
    }

    /**
     * Navigate each level, sorting by name if children present
     */
    sortTaxonomies(group: TaxonomyGroup | TaxonomyNode) {
        if ('children' in group) {
            group.children.sort((child1, child2) => child1.name.localeCompare(child2.name));
            group.checked = !group.children.find((child) => child.checked === false);
            for (let index = 0; index < group.children.length; index++) {
                if (index > 0) {
                    if (group.children[index - 1].name.toLowerCase() === group.children[index].name.toLowerCase()) {
                        group.children[index - 1].duplicateLabel = true;
                        group.children[index].duplicateLabel = true;
                    }
                }
                this.sortTaxonomies(group.children[index]);
            }
        }
    }

    /**
     * Transforms the given array of query results using the given options into an array of objects to be shown in the visualization.
     * Returns the count of elements shown in the visualization.
     *
     * @arg {any} options
     * @arg {any[]} results
     * @arg {FilterCollection} filters
     * @return {number}
     * @override
     */
    transformVisualizationQueryResults(options: any, results: any[], filters: FilterCollection): number {
        const group = {
            childrenMap: {},
            children: []
        } as TaxonomyGroup;

        const find = (data: any, field: string) =>
            options[field].columnName ?
                CoreUtil.deepFind(data, options[field].columnName) :
                null;

        for (const data of results) {
            let types: string[];
            let subTypes: string[];
            const categories = CoreUtil.deepFind(data, options.categoryField.columnName);

            if (options.typeField.columnName) {
                const val = CoreUtil.deepFind(data, options.typeField.columnName);
                types = Array.isArray(val) ? val : [val];
            }

            if (options.subTypeField.columnName && options.subTypeField.columnName !== options.typeField.columnName) {
                const val = CoreUtil.deepFind(data, options.subTypeField.columnName);
                subTypes = Array.isArray(val) ? val : [val];
            }

            // Leaf value set in case it is needed for the taxonomy valueObject
            // If a value is not found for the leafValue, id will be used
            const name = find(data, 'valueField') || find(data, 'idField');
            const child = {
                description: options.valueField.columnName,
                name,
                sourceIds: find(data, 'sourceIdField'),
                externalId: find(data, 'idField'),
                externalName: name
            };

            // Loop, categories[] -> types[] -> subTypes?[]
            for (const category of categories) {
                for (const type of types) {
                    const lineage = { category, type };
                    if (subTypes) {
                        for (const subtype of subTypes) {
                            this.mergeTaxonomyData(group, { ...lineage, subtype }, {
                                ...child,
                                id: `${this.counter++}`,
                                checked: !this.isTaxonomyNodeFiltered(filters, options.subTypeField, type + '.' + subtype)
                            }, filters);
                        }
                    } else {
                        this.mergeTaxonomyData(group, lineage, {
                            ...child,
                            id: `${this.counter++}`,
                            checked: !this.isTaxonomyNodeFiltered(filters, options.typeField, type)
                        }, filters);
                    }
                }
            }
        }

        this.sortTaxonomies(group);

        this._updateEachTreeNodeCheckBox(group);

        this.taxonomyGroups = group.children as TaxonomyGroup[];

        return this.taxonomyGroups.reduce((acc, grp) => acc + grp.nodeCount, 0);
    }

    /**
     * Sets class for nodes based on position in taxonomy
     *
     * @arg {TreeNode} node
     * @arg {string} classString
     * @return {string}
     */
    setClassForTreePosition(node, classString) {
        let nodeClass = classString + node.level;
        // Adds a styling class for the values of types or subTypes
        if (this.options.valueField.columnName &&
            ((node.level === 2 && node.hasChildren && !node.children[0].hasChildren) || node.level >= 3)) {
            nodeClass += ' leaf-node-level';
        }

        return nodeClass;
    }

    /**
     * Adds necessary ids and counts to the nodes in the taxonomy
     *
     * @arg {any} data
     * @arg {any[]} groups
     */
    addCountsToTaxonomy(data: any, groups: any[]) {
        for (let group of groups) {
            let count = 0;
            group.nodeIds = [];
            group.sourceIds = [];

            data.forEach((result) => {
                let description = CoreUtil.deepFind(result, group.description.columnName);
                let lineage = CoreUtil.deepFind(result, this.options.categoryField.columnName);
                let id = CoreUtil.deepFind(result, this.options.idField.columnName);

                let nameExists = description instanceof Array ? description.find((str) => str.includes(group.name)) :
                    description.includes(group.name);

                let lineageExists = lineage instanceof Array ?
                    lineage.find((str) => (str === group.lineage)) : (lineage === group.lineage);

                if (!!nameExists && !!lineageExists && !group.nodeIds.includes(id)) {
                    let sourceIds = CoreUtil.deepFind(result, this.options.sourceIdField.columnName);
                    group.nodeIds.push(id);
                    group.sourceIds.push(sourceIds);
                    count++;
                }
            });

            group.nodeCount = count;
            group.sourceIds = CoreUtil.flatten(group.sourceIds)
                .filter((value, index, array) => array.indexOf(value) === index);

            if (group.hasOwnProperty('children')) {
                this.addCountsToTaxonomy(data, group.children);
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
            CoreUtil.sortArrayOfObjects(array, 'name', 1);
        } else {
            CoreUtil.sortArrayOfObjects(array, 'name', -1);
        }
    }

    getTaxonomyObject(group: any[], name: string) {
        let foundIndex = 0;
        let foundObject = group.find((item, index) => {
            let found = item.name === name;
            foundIndex = index;
            return found;
        });

        return {
            index: foundIndex,
            object: foundObject
        };
    }

    private findUnselectedGroups(group: TaxonomyGroup | TaxonomyNode): TaxonomyNode[] {
        const base = (!group.checked || (group.level > 1 && group.indeterminate) ? [group] : []);
        const nested: (TaxonomyGroup | TaxonomyNode)[] = [];
        if ('children' in group) {
            nested.push(...group.children);
        }

        return [
            ...base,
            ...nested
                .map((child) => this.findUnselectedGroups(child))
                .reduce((acc, child) => acc.concat(child), [])
        ];
    }

    checkRelatedNodes(node: TreeNode | TaxonomyNode, $event: any) {
        // Update all the groups in the taxonomy (select or unselect them).
        this._updateChildNodesCheckBox(node, $event.target.checked);
        this._updateParentNodesCheckBox(node.parent);

        // Find all the unselected groups in the taxonomy (parents and children).
        const unselectedGroups = this.taxonomyGroups.reduce((array, group) =>
            array.concat(this.findUnselectedGroups(group)), [] as TaxonomyNode[]);

        // Create filters for all the unselected groups with valid fields (description properties).
        let categoryValues: any[] = [];
        let typeValues: any[] = [];
        let subTypeValues: any[] = [];

        unselectedGroups.filter((group) => group.description && group.description.columnName).forEach((group) => {
            const groupValue = group.externalName || group.name;
            if (group.description.columnName === this.options.categoryField.columnName) {
                categoryValues.push(groupValue);
            }
            if (group.description.columnName === this.options.typeField.columnName) {
                typeValues.push(groupValue);
            }
            if (group.description.columnName === this.options.subTypeField.columnName) {
                subTypeValues.push(groupValue);
            }
        });

        // Create a single compound AND filter (with a pretty name) for all the filters on each filterable field.
        const categoryFilter: AbstractFilterDesign = categoryValues.length ? this.createFilterDesignOnList(this.options.categoryField,
            categoryValues) : null;

        // Ignore the type filters if the type field is the same as the category field.
        const typeIsDuplicated = !!(this.options.typeField.columnName === this.options.categoryField.columnName && categoryValues.length);
        const typeFilter: AbstractFilterDesign = (typeValues.length && !typeIsDuplicated) ? this.createFilterDesignOnList(
            this.options.typeField, typeValues
        ) : null;

        // Ignore the subtype filters if the subtype field is the same as the type field or the category field.
        const subTypeIsDuplicated = !!(this.options.subTypeField.columnName === this.options.typeField.columnName && typeValues.length) ||
            !!(this.options.subTypeField.columnName === this.options.categoryField.columnName && categoryValues.length);
        const subTypeFilter: AbstractFilterDesign = (subTypeValues.length && !subTypeIsDuplicated) ? this.createFilterDesignOnList(
            this.options.subTypeField, subTypeValues
        ) : null;

        // If we don't need to filter a valid filterable field, ensure that we delete all previous filters that were set on that field.
        const filterConfigListToDelete: AbstractFilterDesign[] = [];
        if (!categoryFilter && this.options.categoryField.columnName) {
            filterConfigListToDelete.push(this.createFilterDesignOnList(this.options.categoryField));
        }
        // Don't accidentally delete filters from duplicated fields!
        if (!typeFilter && !typeIsDuplicated && this.options.typeField.columnName) {
            filterConfigListToDelete.push(this.createFilterDesignOnList(this.options.typeField));
        }
        if (!subTypeFilter && !subTypeIsDuplicated && this.options.subTypeField.columnName) {
            filterConfigListToDelete.push(this.createFilterDesignOnList(this.options.subTypeField));
        }

        this.exchangeFilters([categoryFilter, typeFilter, subTypeFilter].filter((filter) => !!filter), filterConfigListToDelete, true);
    }

    private _updateChildNodesCheckBox(node: TreeNode | TaxonomyNode, checked: boolean): void {
        let nodeData: TaxonomyGroup = 'data' in node ? node.data : node;
        nodeData.checked = checked;
        if (!checked) {
            nodeData.indeterminate = false;
        }
        if (nodeData.children) {
            nodeData.children.forEach((child) => this._updateChildNodesCheckBox(child, checked));
        }
    }

    private _updateEachTreeNodeCheckBox(node: TaxonomyGroup | TaxonomyNode): void {
        if ('children' in node && node.children.length) {
            for (const child of node.children) {
                if (child.checked) {
                    this._updateChildNodesCheckBox(child, true);
                    this._updateParentNodesCheckBox(node);
                }
                this._updateEachTreeNodeCheckBox(child);
            }
        }
    }

    private _updateNodeCheckBox(node: TaxonomyGroup): void {
        let allChildrenChecked = true;
        let noChildrenChecked = true;

        for (const child of node.children) {
            if (node.level === 1 && child.indeterminate) {
                allChildrenChecked = false;
                noChildrenChecked = false;
            } else if (!child.checked) {
                allChildrenChecked = false;
            } else if (child.checked) {
                noChildrenChecked = false;
            }
        }

        if (allChildrenChecked) {
            node.checked = true;
            node.indeterminate = false;
        } else if (noChildrenChecked) {
            node.checked = false;
            node.indeterminate = false;
        } else {
            node.checked = true;
            node.indeterminate = true;
        }
    }

    private _updateParentNodesCheckBox(node: TreeNode | TaxonomyGroup): void {
        if (node && node.level > 0 && node.children) {
            this._updateNodeCheckBox('data' in node ? node.data : node);

            if (node.parent) {
                this._updateParentNodesCheckBox(node.parent);
            }
        }
    }

    retrieveUnselectedNodes(nodeArray: (TaxonomyNode | TaxonomyGroup)[]) {
        let relatives = [];
        for (let node of nodeArray) {
            // Ensures that only node child relatives(with checkboxes) are added and not the values listed(without checkboxes)
            if (
                'children' in node && node.children.length &&
                node.children[0].description.columnName !== this.options.valueField.columnName
            ) {
                for (let child of node.children) {
                    if (child.checked === false && child.description.columnName !== this.options.valueField.columnName) {
                        relatives.push(child);
                    }
                }
            } else if (node.checked === false) {
                relatives.push(node);
            }
        }

        return relatives;
    }

    /**
     * Redraws this visualization with the given compatible filters.
     *
     * @override
     */
    protected redrawFilters(__filters: FilterCollection): void {
        // TODO AIDA-753 Update the checked nodes in the taxonomy tree using the given filters
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
     * Returns whether this visualization should filter itself.
     *
     * @return {boolean}
     * @override
     */
    protected shouldFilterSelf(): boolean {
        return false;
    }
}
