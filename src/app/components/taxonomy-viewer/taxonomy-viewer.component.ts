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
    Component,
    ElementRef,
    OnDestroy,
    OnInit,
    ViewChild,
    ViewEncapsulation,
    Injector,
    ChangeDetectorRef
} from '@angular/core';

import { CompoundFilterType, FilterClause, QueryPayload, SortOrder, AbstractSearchService } from '../../services/abstract.search.service';
import { CompoundFilterDesign, FilterBehavior, FilterDesign, SimpleFilterDesign, FilterService } from '../../services/filter.service';
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
import { MatTreeNestedDataSource, MatDialog } from '@angular/material';
import { NestedTreeControl } from '@angular/cdk/tree';
import { DatasetService } from '../../services/dataset.service';

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
    description: FieldMetaData;
}

export interface TaxonomyGroup extends TaxonomyNode {
    count: number;
    childrenMap?: { [key: string]: TaxonomyGroup | TaxonomyNode };
    nodeIds: Set<string>;
    children?: (TaxonomyGroup | TaxonomyNode)[];
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

    private counter = 0;

    public taxonomyGroups: TaxonomyGroup[] = [];

    public deletedFilter: any;

    public treeControl = new NestedTreeControl<TaxonomyNode | TaxonomyGroup>((node) => 'children' in node && node.children);
    public dataSource = new MatTreeNestedDataSource<TaxonomyGroup | TaxonomyNode>();

    constructor(
        datasetService: DatasetService,
        filterService: FilterService,
        searchService: AbstractSearchService,
        injector: Injector,
        changeDetection: ChangeDetectorRef,
        dialog: MatDialog
    ) {
        super(datasetService, filterService, searchService, injector, changeDetection, dialog);
    }

    hasChild = (_: number, node: TaxonomyGroup) => {
        return !!node.children && node.children.length; // && node.children.some((x) => 'children' in x);
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
            infoText: this.infoText
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

    mergeTaxonomyData(group: TaxonomyGroup, lineage: { category: string | string[], type: string | string[], subtype?: string | string[] },
        child: TaxonomyNode
    ) {
        let currentGroup = group;
        let toArray = (el: string | string[]) => Array.isArray(el) ? el : (el ? el.split('.') : []);

        // Compose all layers into single array of [name, type][]
        const segments = [
            [toArray(lineage.category), 'category'],
            [toArray(lineage.type), 'type'],
            [toArray(lineage.subtype), 'subtype']
        ] as [string[], string][];

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
                        description: fieldToCheck,
                        name: pcat,
                        externalName: segment.slice(0, subPos + 1).join('.'),
                        parent: currentGroup,
                        checked: !this.isTaxonomyNodeFiltered(fieldToCheck, pcat),
                        sourceIds: [],
                        nodeIds: new Set(),
                        level: pos + 1,
                        count: 0,
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

            if (child.name !== child.externalId) {
                currentGroup.children.push(child);
            }
            child.parent = currentGroup;
            child.level = pos + 1;

            // Walk back up if a new item
            while (currentGroup && currentGroup.id) {
                if (!currentGroup.nodeIds.has(child.externalId)) {
                    currentGroup.count += 1;
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
            group.children.sort((a, b) => a.name.localeCompare(b.name));
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

        let find = (d: any, field: string) =>
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

            //leaf value set in case it is needed for the taxonomy valueObject
            // If a value is not found for the leafValue, id will be used
            const child = {
                description: this.options.valueField,
                name: find(d, 'valueField') || find(d, 'idField'),
                sourceIds: find(d, 'sourceIdField'),
                externalId: find(d, 'idField')
            };

            // Loop, categories[] -> types[] -> subTypes?[]
            for (const category of categories) {
                for (const type of types) {

                    // const [typeMajor, ...subTypes] = type.split('.');
                    // const lineage = { category, type: typeMajor, subtype: subTypes.join('.') };
                    const lineage = { category, type };

                    this.mergeTaxonomyData(group, lineage, {
                        ...child,
                        id: `${this.counter++}`,
                        externalName: child.name,
                        checked: !this.isTaxonomyNodeFiltered(this.options.typeField, lineage.type)
                    });
                }
            }
        }

        this.sortTaxonomies(group);

        this.taxonomyGroups = group.children as TaxonomyGroup[];
        this.dataSource.data = group.children;
        this.treeControl.dataNodes = group.children;
        return this.taxonomyGroups.length;
    }

    private findUnselectedGroups(group: any): any[] {
        return (group.checked ? [] : [group]).concat((group.children || []).reduce((array, child) =>
            array.concat(this.findUnselectedGroups(child)), []));
    }

    checkRelatedNodes(node: TaxonomyNode, check: { checked: boolean }) {
        // Update all the groups in the taxonomy (select or unselect them).
        this.updateChildNodesCheckBox(node, check.checked);
        this.updateParentNodesCheckBox(node.parent);

        // Find all the unselected groups in the taxonomy (parents and children).
        let unselectedGroups: any[] = this.taxonomyGroups.reduce((array, group) => array.concat(this.findUnselectedGroups(group)), []);

        // Create filters for all the unselected groups with valid fields (description properties).
        let filters: SimpleFilterDesign[] = unselectedGroups.filter((group) => group.description && group.description.columnName)
            .map((group) => this.createFilterDesign(group.description, group.externalName));

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

        this.changeDetection.detectChanges();
    }

    updateChildNodesCheckBox(node: TaxonomyNode | TaxonomyGroup, checked: boolean) {
        node.checked = checked;
        if (checked === false && node.indeterminate) {
            node.indeterminate = checked;
        }

        if ('children' in node) {
            node.children.forEach((child) => this.updateChildNodesCheckBox(child, checked));
        }
    }

    updateParentNodesCheckBox(node: TaxonomyNode | TaxonomyGroup) {
        if (node && node.level > 0 && 'children' in node) {
            const checked = node.children.filter((x) => x.checked && !x.indeterminate).length;
            const allChecked = checked === node.children.length;
            node.indeterminate = !allChecked && checked > 0;
            if (!node.indeterminate) {
                node.checked = allChecked;
            }
            this.updateParentNodesCheckBox(node.parent);
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
        // Do nothing
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
