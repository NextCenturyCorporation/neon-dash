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

import { AbstractSearchService, CompoundFilterType, FilterClause, QueryPayload, SortOrder } from '../../services/abstract.search.service';
import { DatasetService } from '../../services/dataset.service';
import { CompoundFilterDesign, FilterBehavior, FilterDesign, FilterService, SimpleFilterDesign } from '../../services/filter.service';
import { KEYS, TREE_ACTIONS, TreeNode } from 'angular-tree-component';
import { BaseNeonComponent } from '../base-neon-component/base-neon.component';
import { FieldMetaData } from '../../dataset';
import { neonUtilities } from '../../neon-namespaces';
import {
    OptionChoices,
    WidgetFieldOption,
    WidgetFieldArrayOption,
    WidgetFreeTextOption,
    WidgetOption,
    WidgetSelectOption
} from '../../widget-option';
import { MatDialog } from '@angular/material';

let styleImport: any;

export interface TaxonomyNode {
    id: string;
    type: 'leaf' | 'group';
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
    description: FieldMetaData;
}

export interface TaxonomyGroup extends TaxonomyNode {
    type: 'group';
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
    @ViewChild('visualization', { read: ElementRef }) visualization: ElementRef;
    @ViewChild('headerText') headerText: ElementRef;
    @ViewChild('infoText') infoText: ElementRef;
    @ViewChild('treeRoot') treeRoot: ElementRef;

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

        if (!styleImport) {
            styleImport = document.createElement('link');
            styleImport.rel = 'stylesheet';
            styleImport.href = '/assets/angular-tree-component/dist/angular-tree-component.css';
            document.head.appendChild(styleImport);
        }
    }

    private addFilterBehaviorToList(list: FilterBehavior[], field: FieldMetaData): FilterBehavior[] {
        list.push({
            // Match a single NOT EQUALS filter on the specific filter field.
            filterDesign: this.createFilterDesign(field),
            redrawCallback: this.redrawTaxonomy.bind(this)
        });
        list.push({
            // Match a compound AND filter with one or more NOT EQUALS filters on the specific filter field.
            filterDesign: this.createFilterDesignOnList([this.createFilterDesign(field)]),
            redrawCallback: this.redrawTaxonomy.bind(this)
        });
        return list;
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
            new WidgetFieldOption('valueField', 'Value Field', false),
            new WidgetFieldArrayOption('filterFields', 'Filter Fields', false)
        ];
    }

    private createFilterDesign(field: FieldMetaData, value?: any): SimpleFilterDesign {
        return {
            datastore: '',
            database: this.options.database,
            table: this.options.table,
            field: field,
            operator: '!=',
            value: value
        } as SimpleFilterDesign;
    }

    private createFilterDesignOnList(filters: FilterDesign[]): FilterDesign {
        return {
            type: CompoundFilterType.AND,
            filters: filters
        } as CompoundFilterDesign;
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
            new WidgetSelectOption('ignoreSelf', 'Filter Self', false, OptionChoices.YesFalseNoTrue),
            new WidgetSelectOption('extendedFilter', 'Extended Filter', false, OptionChoices.NoFalseYesTrue)
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

        if (this.options.categoryField.columnName) {
            behaviors = this.addFilterBehaviorToList(behaviors, this.options.categoryField);
        }

        if (this.options.typeField.columnName) {
            behaviors = this.addFilterBehaviorToList(behaviors, this.options.typeField);
        }

        if (this.options.subTypeField.columnName) {
            behaviors = this.addFilterBehaviorToList(behaviors, this.options.subTypeField);
        }

        if (this.options.sourceIdField.columnName) {
            // TODO AIDA-607
            // behaviors.push({
            //     // Match a compound AND filter with one or more NOT EQUALS filters on the source ID field.
            //     filterDesign: this.createFilterDesignOnList([this.createFilterDesign(this.options.sourceIdField)]),
            //     redrawCallback: () => {}
            // });
            // behaviors.push({
            //     // Match a compound AND filter with one or more compound AND filters with one or more NOT EQUALS filters.
            //     filterDesign: this.createFilterDesignOnList([this.createFilterDesignOnList(
            //         [this.createFilterDesign(this.options.sourceIdField)])]),
            //     redrawCallback: () => {}
            // });
        }

        return behaviors;
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
        let filters: FilterClause[] = [
            this.searchService.buildFilterClause(options.idField.columnName, '!=', null),
            this.searchService.buildFilterClause(options.idField.columnName, '!=', '')
        ];

        this.searchService.updateFilter(query, this.searchService.buildCompoundFilterClause(sharedFilters.concat(filters)))
            .updateSort(query, options.categoryField.columnName, !options.ascending ? SortOrder.DESCENDING : SortOrder.ASCENDING);

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

    private isTaxonomyNodeFiltered(field: FieldMetaData, value: any) {
        let filterDesign: FilterDesign = this.createFilterDesign(field, value);
        return this.isFiltered(filterDesign) || this.isFiltered(this.createFilterDesignOnList([filterDesign]));
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
        child: TaxonomyNode
    ) {
        let currentGroup = group;
        let toArray = (el: string | string[]) => Array.isArray(el) ? el : (el ? el.split('.') : []);

        // Compose all layers into single array of [name, type][]
        const segments: [string[], string][] = [
            [toArray(lineage.category), 'category'],
            [toArray(lineage.type), 'type'],
            [toArray(lineage.subtype), 'subtype']
        ];

        let pos = 0;
        for (const [segment, ptype] of segments) {
            let subPos = 0;
            // Travel inward, one level at a time
            for (const pcat of segment) {
                // Traverse forward in each layer
                if (!(pcat in currentGroup.childrenMap)) {
                    // Find field that this node should be filtered by
                    const fieldToCheck = this.options[`${ptype}Field`];

                    // Build new object
                    const node: TaxonomyGroup = {
                        id: `${this.counter++}`,
                        type: 'group',
                        description: fieldToCheck,
                        name: pcat,
                        externalName: segment.slice(0, subPos + 1).join('.'),
                        parent: currentGroup,
                        checked: !this.isTaxonomyNodeFiltered(fieldToCheck, pcat),
                        sourceIds: [],
                        nodeIds: new Set(),
                        level: pos + 1,
                        nodeCount: 0,
                        leafCount: 0,
                        children: [],
                        childrenMap: {}
                    };

                    // Register node with parent
                    currentGroup.childrenMap[pcat] = node;
                    currentGroup.children.push(node);
                }
                // Descend into child
                const next = currentGroup.childrenMap[pcat] as TaxonomyGroup;
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
                currentGroup.sourceIds.push(...child.sourceIds);
                currentGroup = currentGroup.parent;
            }
        }
    }

    /**
     * Navigate each level, sorting by name if children present
     */
    sortTaxonomies(group: TaxonomyGroup | TaxonomyNode) {
        if ('children' in group) {
            group.children.sort((a, b) => `${(a ? a.name : a)}`.localeCompare(`${b ? b.name : b}`));
            group.checked = !group.children.find((x) => x.checked === false);
            for (let i = 0; i < group.children.length; i++) {
                if (i > 0) {
                    if (group.children[i - 1].name.toLowerCase() === group.children[i].name.toLowerCase()) {
                        group.children[i - 1].duplicateLabel = true;
                        group.children[i].duplicateLabel = true;
                    }
                }
                this.sortTaxonomies(group.children[i]);
            }
        }
    }

    /**
     * Transforms the given array of query results using the given options into an array of objects to be shown in the visualization.
     * Returns the count of elements shown in the visualization.
     *
     * @arg {any} options
     * @arg {any[]} results
     * @return {number}
     * @override
     */
    transformVisualizationQueryResults(options: any, results: any[]): number {
        const group = {
            childrenMap: {},
            children: []
        } as TaxonomyGroup;

        const find = (d: any, field: string) =>
            this.options[field].columnName ?
                neonUtilities.deepFind(d, this.options[field].columnName) :
                null;

        for (const d of results) {
            let types: string[];
            const categories = neonUtilities.deepFind(d, this.options.categoryField.columnName);

            if (this.options.typeField.columnName) {
                const val = neonUtilities.deepFind(d, this.options.typeField.columnName);
                types = Array.isArray(val) ? val : [val];
            }

            // Leaf value set in case it is needed for the taxonomy valueObject
            // If a value is not found for the leafValue, id will be used
            const name = find(d, 'valueField') || find(d, 'idField');
            const child = {
                description: this.options.valueField,
                name,
                sourceIds: find(d, 'sourceIdField'),
                externalId: find(d, 'idField'),
                externalName: name
            };

            // Loop, categories[] -> types[] -> subTypes?[]
            for (const category of categories) {
                for (const type of types) {
                    const lineage = { category, type };

                    this.mergeTaxonomyData(group, lineage, {
                        ...child,
                        type: 'leaf',
                        id: `${this.counter++}`,
                        checked: !this.isTaxonomyNodeFiltered(this.options.typeField, lineage.type)
                    });
                }
            }
        }

        this.sortTaxonomies(group);

        this.taxonomyGroups = group.children as TaxonomyGroup[];
        return this.taxonomyGroups.reduce((acc, v) => acc + v.nodeCount, 0);
    }

    // /**
    //  * Transforms the given array of query results using the given options into an array of objects to be shown in the visualization.
    //  * Returns the count of elements shown in the visualization.
    //  *
    //  * @arg {any} options
    //  * @arg {any[]} results
    //  * @return {number}
    //  * @override
    //  */
    // transformVisualizationQueryResults(options: any, results: any[]): number {
    //     let counter = 0;

    //     this.taxonomyGroups = [];

    //     // TODO Move this code into separate functions
    //     /* eslint-disable-next-line complexity */
    //     results.forEach((d) => {
    //         let categories: string[];
    //         let types: string[];
    //         let subTypes: string[];
    //         let leafValue: string;

    //         categories = neonUtilities.deepFind(d, this.options.categoryField.columnName);

    //         if (this.options.typeField.columnName) {
    //             types = neonUtilities.deepFind(d, this.options.typeField.columnName) instanceof Array ?
    //                 neonUtilities.deepFind(d, this.options.typeField.columnName) :
    //                 [neonUtilities.deepFind(d, this.options.typeField.columnName)];
    //         }

    //         // TODO: Not fully implemented because subTypes do not currently exist, but might need to be in the future THOR-908
    //         if (this.options.subTypeField.columnName) {
    //             subTypes = neonUtilities.deepFind(d, this.options.typeField.columnName);
    //         }

    //         // Leaf value set in case it is needed for the taxonomy valueObject
    //         // If a value is not found for the leafValue, id will be used
    //         leafValue = neonUtilities.deepFind(d, this.options.valueField.columnName) ?
    //             neonUtilities.deepFind(d, this.options.valueField.columnName) :
    //             neonUtilities.deepFind(d, this.options.idField.columnName);

    //         for (let category of categories) {
    //             // Checks if there are any parent(category) nodes in the tree
    //             let foundCategory = this.getTaxonomyObject(this.taxonomyGroups, category);

    //             // If the parent(category) node does not exist in the tree, add it
    //             if (!foundCategory.object) {
    //                 let parent = {
    //                     id: counter++,
    //                     name: category,
    //                     lineage: category,
    //                     children: [],
    //                     description: this.options.categoryField,
    //                     checked: !this.isTaxonomyNodeFiltered(this.options.categoryField, category)
    //                 };

    //                 this.taxonomyGroups.push(parent);
    //                 foundCategory.object = this.taxonomyGroups[this.taxonomyGroups.length - 1];
    //                 foundCategory.index = this.taxonomyGroups.length - 1;
    //             }

    //             // Creates valueObject to be added to the taxonomy if a value field exists
    //             let valueObject = this.options.valueField.columnName ? {
    //                 id: counter++,
    //                 name: leafValue,
    //                 lineage: category,
    //                 description: this.options.valueField
    //             } : null;

    //             if (types) {
    //                 for (let type of types) {
    //                     // Checks if a subChild node will be needed based on if dot notation exists
    //                     // within the child node string
    //                     let subTypeNeeded = type.includes('.') || (subTypes && types !== subTypes);
    //                     let foundType = null;
    //                     let subTypeObject = null;

    //                     // Checks if child(type) node exists in the tree and if not, adds it
    //                     if (foundCategory.object.children) {
    //                         foundType = this.getTaxonomyObject(foundCategory.object.children,
    //                             type.includes('.') ? type.split('.')[0] : type);
    //                     }

    //                     // Creates subTypeObject to be added to the taxonomy if a subType exists
    //                     if (subTypeNeeded) {
    //                         subTypeObject = {
    //                             id: counter++,
    //                             name: type,
    //                             children: [],
    //                             lineage: category,
    //                             description: this.options.subTypeField.columnName ?
    //                                 this.options.subTypeField : this.options.typeField
    //                         };
    //                         subTypeObject.checked = !this.isTaxonomyNodeFiltered(subTypeObject.description, type);

    //                         if (valueObject) {
    //                             subTypeObject.children.push(valueObject);
    //                         }
    //                     }

    //                     // If a child(type) node is found, add the subChild or value to the child if they exist
    //                     if (foundType && foundType.object) {
    //                         if (subTypeNeeded) {
    //                             let foundSubType = this.getTaxonomyObject(foundType.object.children, type);

    //                             if (!foundSubType.object) {
    //                                 this.taxonomyGroups[foundCategory.index].children[foundType.index].children.push(subTypeObject);
    //                             } else if (valueObject) {
    //                                 let foundValue = this.getTaxonomyObject(foundSubType.object.children, valueObject.name);

    //                                 if (!foundValue.object) {
    //                                     this.taxonomyGroups[foundCategory.index].children[foundType.index].children[foundSubType.index]
    //                                         .children.push(valueObject);
    //                                 }
    //                             }

    //                             this.sortTaxonomyArrays(this.taxonomyGroups[foundCategory.index].children[foundType.index]
    //                                 .children[foundSubType.index].children);
    //                         } else if (valueObject) {
    //                             let foundValue = this.getTaxonomyObject(foundType.object.children, valueObject.name);

    //                             if (!foundValue.object) {
    //                                 this.taxonomyGroups[foundCategory.index].children[foundType.index].children.push(valueObject);
    //                             }
    //                         }
    //                     } else {
    //                         // If a child(type) node is not found, add a child. Then add a subChild or value to the child.
    //                         let setType = type.includes('.') ? type.split('.')[0] : type;
    //                         let typeObject = {
    //                             id: counter++,
    //                             name: setType,
    //                             children: [],
    //                             lineage: category,
    //                             description: this.options.typeField,
    //                             checked: !this.isTaxonomyNodeFiltered(this.options.typeField, setType)
    //                         };

    //                         this.taxonomyGroups[foundCategory.index].children.push(typeObject);
    //                         foundType.index = this.taxonomyGroups[foundCategory.index].children.length - 1;

    //                         if (subTypeNeeded) {
    //                             this.taxonomyGroups[foundCategory.index].children[foundType.index].children.push(subTypeObject);
    //                         } else if (valueObject) {
    //                             this.taxonomyGroups[foundCategory.index].children[foundType.index].children.push(valueObject);
    //                         }
    //                     }

    //                     this.sortTaxonomyArrays(this.taxonomyGroups[foundCategory.index].children[foundType.index].children);
    //                 }// End types loop
    //             }
    //             this.sortTaxonomyArrays(this.taxonomyGroups[foundCategory.index].children);
    //         } // End categories loop
    //     });

    //     this.addCountsToTaxonomy(results, this.taxonomyGroups);
    //     this.sortTaxonomyArrays(this.taxonomyGroups);

    //     return this.taxonomyGroups.length;
    // }

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
            ((node.level === 2 && node.hasChildren && !node.children[0].hasChildren) || node.level === 3)) {
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

            data.forEach((d) => {
                let description = neonUtilities.deepFind(d, group.description.columnName);
                let lineage = neonUtilities.deepFind(d, this.options.categoryField.columnName);
                let id = neonUtilities.deepFind(d, this.options.idField.columnName);

                let nameExists = description instanceof Array ? description.find((s) => s.includes(group.name)) :
                    description.includes(group.name);

                let lineageExists = lineage instanceof Array ?
                    lineage.find((s) => (s === group.lineage)) : (lineage === group.lineage);

                if (!!nameExists && !!lineageExists && !group.nodeIds.includes(id)) {
                    let sourceIds = neonUtilities.deepFind(d, this.options.sourceIdField.columnName);
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

    private findUnselectedGroups(group: any): any[] {
        return (group.checked ? [] : [group]).concat((group.children || []).reduce((array, child) =>
            array.concat(this.findUnselectedGroups(child)), []));
    }

    checkRelatedNodes(node: TreeNode, $event: any) {
        // Update all the groups in the taxonomy (select or unselect them).
        this.updateChildNodesCheckBox(node, $event.target.checked);
        this.updateParentNodesCheckBox(node.parent);

        // Find all the unselected groups in the taxonomy (parents and children).
        let unselectedGroups: any[] = this.taxonomyGroups.reduce((array, group) => array.concat(this.findUnselectedGroups(group)), []);

        // Create filters for all the unselected groups with valid fields (description properties).
        let filters: SimpleFilterDesign[] = unselectedGroups.filter((group) => group.description && group.description.columnName)
            .map((group) => this.createFilterDesign(group.description, group.name));

        let categoryFilters: FilterDesign[] = filters.filter((filter) => filter.field.columnName ===
            this.options.categoryField.columnName);
        let typeFilters: FilterDesign[] = filters.filter((filter) => filter.field.columnName === this.options.typeField.columnName);
        let subTypeFilters: FilterDesign[] = filters.filter((filter) => filter.field.columnName ===
            this.options.subTypeField.columnName);

        // Create a single compound AND filter (with a pretty name) for all the filters on each filterable field.
        let categoryFilter: FilterDesign = (categoryFilters.length) ? (categoryFilters.length === 1 ? categoryFilters[0] :
            this.createFilterDesignOnList(categoryFilters)) : null;

        // Ignore the type filters if the type field is the same as the category field.
        let typeIsDuplicated = !!(this.options.typeField.columnName === this.options.categoryField.columnName && categoryFilters.length);
        let typeFilter: FilterDesign = (typeFilters.length && !typeIsDuplicated) ? (typeFilters.length === 1 ? typeFilters[0] :
            this.createFilterDesignOnList(typeFilters)) : null;

        // Ignore the subtype filters if the subtype field is the same as the type field or the category field.
        let subTypeIsDuplicated = !!(this.options.subTypeField.columnName === this.options.typeField.columnName && typeFilters.length) ||
            !!(this.options.subTypeField.columnName === this.options.categoryField.columnName && categoryFilters.length);
        let subTypeFilter: FilterDesign = (subTypeFilters.length && !subTypeIsDuplicated) ? (subTypeFilters.length === 1 ?
            subTypeFilters[0] : this.createFilterDesignOnList(subTypeFilters)) : null;

        // If we don't need to filter a valid filterable field, ensure that we delete all previous filters that were set on that field.
        let filterDesignListToDelete: FilterDesign[] = [];
        if (!categoryFilter && this.options.categoryField.columnName) {
            filterDesignListToDelete.push(this.createFilterDesign(this.options.categoryField));
        }
        // Don't accidentally delete filters from duplicated fields!
        if (!typeFilter && !typeIsDuplicated && this.options.typeField.columnName) {
            filterDesignListToDelete.push(this.createFilterDesign(this.options.typeField));
        }
        if (!subTypeFilter && !subTypeIsDuplicated && this.options.subTypeField.columnName) {
            filterDesignListToDelete.push(this.createFilterDesign(this.options.subTypeField));
        }

        // TODO AIDA-607 (Add sourceFilter to existing call of exchangeFilters)
        // let sourceFilters: FilterDesign[] = unselectedGroups.filter((group) => group.sourceIds.length).map((group) =>
        //     this.createFilterDesignOnList(group.sourceIds.map((sourceId) =>
        //         this.createFilterDesign(this.options.sourceIdField, sourceId))));
        // let filterOnSource = !!(sourceFilters.length);
        // let sourceFilter: FilterDesign = filterOnSource ? (sourceFilters.length === 1 ? sourceFilters[0] :
        //     this.createFilterDesignOnList(sourceFilters)) : null;
        // if (!sourceFilter && this.options.sourceIdField.columnName) {
        //   filterDesignListToDelete.push(this.createFilterDesign(this.options.sourceIdField));
        // }

        this.exchangeFilters([categoryFilter, typeFilter, subTypeFilter].filter((filter) => !!filter), filterDesignListToDelete);
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
            let setNode = node.data || node;
            let allChildrenChecked = true;
            let noChildrenChecked = true;

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
            // Ensures that only node child relatives(with checkboxes) are added and not the values listed(without checkboxes)
            if (node.children && node.children.length && node.children[0].description.columnName !== this.options.valueField.columnName) {
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

    private redrawTaxonomy(_filters: FilterDesign[]) {
        // TODO AIDA-753
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
