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
    AfterViewInit,
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    Component,
    ElementRef,
    OnDestroy,
    OnInit,
    QueryList,
    ViewChild,
    ViewChildren,
    ViewEncapsulation
} from '@angular/core';
import { DynamicDialogComponent } from '../dynamic-dialog/dynamic-dialog.component';
import { MatDialog } from '@angular/material';

import { AbstractSearchService } from '../../library/core/services/abstract.search.service';
import {
    AggregationType,
    ConfigOption,
    ConfigOptionField,
    ConfigOptionSelect,
    OptionChoices,
    OptionType
} from '../../library/core/models/config-option';
import {
    ConfigurableWidget,
    OptionConfig,
    RootWidgetOptionCollection,
    WidgetOptionCollection
} from '../../models/widget-option-collection';
import { CoreUtil } from '../../library/core/core.util';
import { DashboardService } from '../../services/dashboard.service';
import { DashboardState } from '../../models/dashboard-state';
import { Dataset } from '../../library/core/models/dataset';
import { InjectableColorThemeService } from '../../services/injectable.color-theme.service';
import { InjectableFilterService } from '../../services/injectable.filter.service';
import { VisualizationType, VisualizationWidget } from '../../models/visualization-widget';

import { neonEvents } from '../../models/neon-namespaces';
import { eventing } from 'neon-framework';

import { NextCenturyAngularTextCloud } from '../../library/wrappers/angular/text-cloud.angular-component';

@Component({
    selector: 'app-single-visualization-widget',
    templateUrl: './single-visualization-widget.component.html',
    // TODO Move scss file to single-visualization-widget folder when BaseNeonComponent is no longer needed.
    styleUrls: ['../base-neon-component/base-neon.component.scss'],
    encapsulation: ViewEncapsulation.Emulated,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class SingleVisualizationWidgetComponent extends VisualizationWidget implements AfterViewInit, OnInit, OnDestroy {
    private SETTINGS_BUTTON_WIDTH: number = 30;
    private TEXT_MARGIN_WIDTH: number = 10;
    private TOOLBAR_PADDING_WIDTH: number = 20;
    /* eslint-disable-next-line no-invalid-this */
    private TOOLBAR_EXTRA_WIDTH: number = this.SETTINGS_BUTTON_WIDTH + this.TEXT_MARGIN_WIDTH + this.TOOLBAR_PADDING_WIDTH;

    @ViewChild('headerText') headerText: ElementRef;
    @ViewChild('infoText') infoText: ElementRef;
    @ViewChildren('visualization') visualizations: QueryList<any>;

    public errorMessage: string = '';
    public infoButtonText: string = '';
    public loadingCount: number = 0;
    public showNoData: boolean = false;

    public options: RootWidgetOptionCollection & { [key: string]: any };
    public componentLibraryOptions: { [key: string]: any };

    private eventMessenger: eventing.Messenger;
    private id: string;
    private visElementId: string;

    // Maps the options/layer ID to the element count.
    private layerIdToElementCount: Map<string, number> = new Map<string, number>();

    private cachedPage: number = -1;
    private lastPage: boolean = true;
    private page: number = 1;

    readonly dashboardState: DashboardState;
    private dataset: Dataset;

    /**
     * Creates and returns the text for the info button using the given count map, options, and page number.
     */
    static createInfoButtonText(
        layerIdToElementCount: Map<string, number>,
        options: RootWidgetOptionCollection,
        pageNumber: number,
        visualizationType: VisualizationType
    ): string {
        if (!options.layers.length) {
            return SingleVisualizationWidgetComponent.createInfoButtonTextHelper(options, layerIdToElementCount.get(options._id),
                pageNumber, options.limit, visualizationType);
        }

        if (options.layers.length === 1) {
            return SingleVisualizationWidgetComponent.createInfoButtonTextHelper(options.layers[0],
                layerIdToElementCount.get(options.layers[0]._id), pageNumber, options.limit, visualizationType);
        }

        return options.layers.map((layer) => {
            let text = SingleVisualizationWidgetComponent.createInfoButtonTextHelper(layer, layerIdToElementCount.get(layer._id),
                pageNumber, options.limit, visualizationType);
            return text ? (layer.title + ' (' + text + ')') : '';
        }).filter((text) => !!text).join(', ');
    }

    /**
     * Creates and returns the text for the info button using the given element count map, options, and page.
     */
    static createInfoButtonTextHelper(
        options: WidgetOptionCollection,
        elementCount: number,
        pageNumber: number,
        queryLimit: number,
        visualizationType: VisualizationType
    ): string {
        // If the query was not yet run, show no text unless waiting on an event.
        if (typeof elementCount === 'undefined') {
            return options.hideUnfiltered ? 'Please Filter' : '';
        }

        let elementLabel = SingleVisualizationWidgetComponent.getVisualizationElementLabel(visualizationType, elementCount);

        if (!elementCount) {
            return (elementLabel ? ('0 ' + elementLabel) : 'None');
        }

        // If the visualization query does pagination, show the pagination text.
        if (SingleVisualizationWidgetComponent.isPaginatedVisualization(visualizationType)) {
            let begin = CoreUtil.prettifyInteger((pageNumber - 1) * queryLimit + 1);
            let end = CoreUtil.prettifyInteger(Math.min(pageNumber * queryLimit, elementCount));
            if (elementCount <= queryLimit) {
                return CoreUtil.prettifyInteger(elementCount) + (elementLabel ? (' ' + elementLabel) : '');
            }
            return (begin === end ? begin : (begin + ' - ' + end)) + ' of ' + CoreUtil.prettifyInteger(elementCount) +
                (elementLabel ? (' ' + elementLabel) : '');
        }

        // Otherwise just show the element count.
        return CoreUtil.prettifyInteger(elementCount) + (elementLabel ? (' ' + elementLabel) : '');
    }

    /**
     * Creates and returns the widget option collection for a visualization with the given config options, dataset, and type.
     */
    static createWidgetOptionCollection(
        caller: any,
        configOptions: any,
        dataset: Dataset,
        visualizationType: VisualizationType
    ): RootWidgetOptionCollection {
        let options = new RootWidgetOptionCollection(dataset,
            SingleVisualizationWidgetComponent.createWidgetOptionsForVisualization.bind(caller, visualizationType),
            SingleVisualizationWidgetComponent.createWidgetOptionsForLayer.bind(caller, visualizationType),
            SingleVisualizationWidgetComponent.getVisualizationDefaultTitle(visualizationType),
            SingleVisualizationWidgetComponent.getVisualizationDefaultLimit(visualizationType),
            false, new OptionConfig(configOptions));

        options.layers.forEach((layerOptions) => {
            SingleVisualizationWidgetComponent.handleFinalizeCreateLayer(layerOptions);
        });

        return options;
    }

    /**
     * Creates and returns the array of widget option objects for a config layer of a visualization of the given type.
     */
    static createWidgetOptionsForLayer(visualizationType: VisualizationType): ConfigOption[] {
        switch (visualizationType) {
            case VisualizationType.TEXT_CLOUD:
            default:
                return [];
        }
    }

    /**
     * Creates and returns the array of widget option objects for a visualization of the given type.
     */
    static createWidgetOptionsForVisualization(visualizationType: VisualizationType): ConfigOption[] {
        switch (visualizationType) {
            case VisualizationType.TEXT_CLOUD:
                return [
                    new ConfigOptionField('dataField', 'Term Field', true),
                    new ConfigOptionField('sizeField', 'Size Field', false,
                        SingleVisualizationWidgetComponent.optionsPropertyEquals.bind(this, 'aggregation', AggregationType.COUNT)),
                    new ConfigOptionSelect('aggregation', 'Aggregation', false, AggregationType.COUNT, OptionChoices.Aggregation),
                    new ConfigOptionSelect('andFilters', 'Filter Operator', false, true, OptionChoices.OrFalseAndTrue),
                    new ConfigOptionSelect('ignoreSelf', 'Filter Self', false, false, OptionChoices.YesFalseNoTrue),
                    new ConfigOptionSelect('paragraphs', 'Show as Paragraphs', false, false, OptionChoices.NoFalseYesTrue),
                    new ConfigOptionSelect('showCounts', 'Show Counts', false, false, OptionChoices.NoFalseYesTrue)
                ];
            default:
                return [];
        }
    }

    /**
     * Returns the default limit for a visualization with the given type.
     */
    static getVisualizationDefaultLimit(visualizationType: VisualizationType): number {
        switch (visualizationType) {
            case VisualizationType.TEXT_CLOUD:
                return 40;
            default:
                return 10;
        }
    }

    /**
     * Returns the default title for a visualization with the given type.
     */
    static getVisualizationDefaultTitle(visualizationType: VisualizationType): string {
        switch (visualizationType) {
            case VisualizationType.TEXT_CLOUD:
                return 'Text Cloud';
            default:
                return 'Widget';
        }
    }

    /**
     * Returns the label for the elemnts that are shown in a visualization with the given type.  Uses the given count to determine the
     * plurality.  For example:  Bars, Lines, Nodes, Points, Rows, Terms, ...
     */
    static getVisualizationElementLabel(visualizationType: VisualizationType, count: number): string {
        switch (visualizationType) {
            case VisualizationType.TEXT_CLOUD:
                return 'Term' + (count === 1 ? '' : 's');
            default:
                return 'Result' + (count === 1 ? '' : 's');
        }
    }

    /**
     * Handles any behavior needed to create a layer in the given widget options collection with the given bindings, but does not create
     * until handleFinalizeCreateLayer is called.
     */
    static handleCreateLayer(options: WidgetOptionCollection, layerBindings: any = {}): any {
        return options.addLayer(layerBindings);
    }

    /**
     * Handles any behavior needed to delete the given layer options in the given widget options collection, but does not delete until
     * handleFinalizeDeleteLayer is called.
     */
    static handleDeleteLayer(options: WidgetOptionCollection, layerOptions: any): boolean {
        return options.removeLayer(layerOptions);
    }

    /**
     * Finalizes the creation of a layer in the given widget options collection.
     */
    static handleFinalizeCreateLayer(__layerOptions: any): void {
        // TODO THOR-1425 Add multi-layer support.
    }

    /**
     * Finalizes the deletion of a layer in the given widget options collection.
     */
    static handleFinalizeDeleteLayer(__layerOptions: any): void {
        // TODO THOR-1425 Add multi-layer support.
    }

    /**
     * Returns if a visualization with the given type is paginated.
     */
    static isPaginatedVisualization(visualizationType: VisualizationType): boolean {
        switch (visualizationType) {
            case VisualizationType.TEXT_CLOUD:
                return false;
            default:
                return false;
        }
    }

    /**
     * Returns if a visualization with the given type is able to filter itself.
     */
    static isSelfFilterableVisualization(visualizationType: VisualizationType): boolean {
        switch (visualizationType) {
            case VisualizationType.TEXT_CLOUD:
            default:
                return true;
        }
    }

    /**
     * Returns if the given property in the given widget option collection equals the given target data.
     */
    static optionsPropertyEquals(property: string, target: any, options: WidgetOptionCollection): boolean {
        return options[property] === target;
    }

    /**
     * Returns the list of fields in the given options to export.
     */
    static retrieveExportFields(options: WidgetOptionCollection): { columnName: string, prettyName: string }[] {
        return options.list().reduce((returnFields, option) => {
            let fields = [];
            if (option.optionType === OptionType.FIELD && option.valueCurrent.columnName) {
                fields = [option.valueCurrent];
            }
            if (option.optionType === OptionType.FIELD_ARRAY) {
                fields = option.valueCurrent;
            }
            return fields.reduce((exportFields, field) => {
                if (field.columnName) {
                    // Ignore repeated fields.
                    let exists = exportFields.some((exportField) => exportField.columnName === field.columnName);
                    if (!exists) {
                        return exportFields.concat({
                            columnName: field.columnName,
                            prettyName: field.prettyName
                        });
                    }
                }
                return exportFields;
            }, returnFields);
        }, []);
    }

    /**
     * Transforms the given widget option collection for a visualization with the given type into a NCCL visualization options JSON object.
     */
    static transformComponentLibraryOptions(
        colorThemeService: InjectableColorThemeService,
        options: RootWidgetOptionCollection,
        page: number,
        visualizationType: VisualizationType
    ): { [key: string]: any } {
        let componentLibraryOptions = {
            'color-accent': colorThemeService.getThemeAccentColorHex(),
            'color-text': colorThemeService.getThemeTextColorHex(),
            'enable-hide-if-unfiltered': options.hideUnfiltered || undefined, // If false, set to undefined
            'enable-ignore-self-filter': options.ignoreSelf || undefined, // If false, set to undefined
            'search-limit': options.limit,
            'search-page': page
        };

        const tableKey = options.datastore.name + '.' + options.database.name + '.' + options.table.name;

        switch (visualizationType) {
            case VisualizationType.TEXT_CLOUD:
                componentLibraryOptions['aggregation-field-key'] = !options.sizeField.columnName ? undefined :
                    (tableKey + '.' + options.sizeField.columnName);
                componentLibraryOptions['aggregation-type'] = options.aggregation;
                componentLibraryOptions['enable-show-counts'] = options.showCounts || undefined; // If false, set to undefined
                componentLibraryOptions['enable-show-paragraphs'] = options.paragraphs || undefined; // If false, set to undefined
                componentLibraryOptions['list-intersection'] = options.andFilters || undefined; // If false, set to undefined
                componentLibraryOptions['text-field-key'] = tableKey + '.' + options.dataField.columnName;
        }

        return componentLibraryOptions;
    }

    constructor(
        private colorThemeService: InjectableColorThemeService,
        private dashboardService: DashboardService,
        public filterService: InjectableFilterService,
        public searchService: AbstractSearchService,
        private changeDetector: ChangeDetectorRef,
        private elementRef: ElementRef,
        private dialog: MatDialog
    ) {
        super();
        this.eventMessenger = new eventing.Messenger();
        this.dashboardState = dashboardService.state;
        this.dataset = this.dashboardState.asDataset();
        dashboardService.stateSource.subscribe((dashboardState) => {
            this.dataset = dashboardState.asDataset();
        });
    }

    /**
     * Returns the export header data.
     *
     * @return {{name:string,data:any}[]}
     */
    public createExportData(): { name: string, data: any }[] {
        // TODO THOR-1425 Add multi-layer support.
        const exportFields = SingleVisualizationWidgetComponent.retrieveExportFields(this.options);
        const filename = this.options.title.split(':').join(' ') + '-' + this.options._id;
        const visArray = this.visualizations.toArray();

        if (visArray.length) {
            switch (this.visualizationType) {
                case VisualizationType.TEXT_CLOUD:
                    return (visArray[0] as NextCenturyAngularTextCloud).createExportData(exportFields, filename);
            }
        }

        return [];
    }

    /**
     * Returns the widget option menu callbacks.
     */
    public getWidgetOptionMenuCallbacks(): ConfigurableWidget {
        return {
            changeData: this._handleChangeData.bind(this),
            changeFilterData: this._handleChangeData.bind(this),
            createLayer: SingleVisualizationWidgetComponent.handleCreateLayer.bind(this),
            deleteLayer: SingleVisualizationWidgetComponent.handleDeleteLayer.bind(this),
            exportData: this.createExportData.bind(this),
            finalizeCreateLayer: SingleVisualizationWidgetComponent.handleFinalizeCreateLayer.bind(this),
            finalizeDeleteLayer: SingleVisualizationWidgetComponent.handleFinalizeDeleteLayer.bind(this),
            handleChangeSubcomponentType: this._handleChangeData.bind(this),
            options: this.options
        } as ConfigurableWidget;
    }

    /**
     * Increases the page and runs the visualization query.
     */
    public goToNextPage(): void {
        if (!this.lastPage) {
            this.page++;
            this._updateVisualizationOptions();
        }
    }

    /**
     * Decreases the page and runs the visualization query.
     */
    public goToPreviousPage(): void {
        if (this.page !== 1) {
            this.page--;
            this._updateVisualizationOptions();
        }
    }

    /**
     * Angular lifecycle hook:  Add event listeners for the NCCL visualization and sets its options to trigger initialization.
     */
    public ngAfterViewInit(): void {
        // Add the event listeners to the visualization only after the HTML elements are stable.
        const visElement: HTMLElement = this.elementRef.nativeElement.querySelector('#' + this.visElementId);
        visElement.addEventListener('searchCanceled', this._onSearchCanceledOrFailed.bind(this));
        visElement.addEventListener('searchFailed', this._onSearchCanceledOrFailed.bind(this));
        visElement.addEventListener('searchFinished', this._onSearchFinished.bind(this));
        visElement.addEventListener('searchLaunched', this._onSearchLaunched.bind(this));
        visElement.addEventListener('valuesFiltered', this._onValuesFiltered.bind(this));

        this._updateVisualizationOptions();
        this.changeDetector.detectChanges();
    }

    /**
     * Angular lifecycle hook:  Detaches the widget and unregisters its event listeners as needed.
     */
    public ngOnDestroy() {
        this.changeDetector.detach();
        this.eventMessenger.unsubscribeAll();
        this.eventMessenger.publish(neonEvents.WIDGET_UNREGISTER, {
            id: this.id
        });
    }

    /**
     * Angular lifecycle hook:  Initializes widget properties and registers its event listeners as needed.
     */
    public ngOnInit(): void {
        this.options = SingleVisualizationWidgetComponent.createWidgetOptionCollection(this, this.configOptions, this.dataset,
            this.visualizationType);
        this.id = this.options._id;
        this.visElementId = 'widget-' + this.id;

        if (this.dashboardState.dashboard && this.dashboardState.dashboard.visualizationTitles &&
            this.dashboardState.dashboard.visualizationTitles[this.options.title]) {
            this.options.title = this.dashboardState.dashboard.visualizationTitles[this.options.title];
        }

        this.eventMessenger.subscribe(neonEvents.DASHBOARD_REFRESH, () => {
            this.redraw();
            this._handleChangeData();
        });

        this.eventMessenger.publish(neonEvents.WIDGET_REGISTER, {
            id: this.id,
            widget: this
        });
    }

    /**
     * Handles any needed behavior before resizing the widget.
     */
    public onResizeStart(): void {
        // Do nothing.
    }

    /**
     * Handles any needed behavior when resizing the widget.
     */
    public onResize(): void {
        // Do nothing.
    }

    /**
     * Handles any needed behavior after resizing the widget.
     */
    public onResizeStop(): void {
        this._updateHeaderStyles();

        // TODO Is this still needed?

        // This event fires as soon as the user releases the mouse, but NgGrid animates the resize,
        // so the current width and height are not the new width and height.  NgGrid uses a 0.25
        // second transition so wait until that has finished before redrawing.
        setTimeout(() => {
            this.redraw();
            this.changeDetector.detectChanges();
        }, 300);
    }

    /**
     * Opens the contribution dialog.
     */
    public openContributionDialog(): void {
        let allContributors = this.dashboardState.dashboard.contributors;
        let contributorKeys = (this.options.contributionKeys || Object.keys(allContributors)).filter((key) =>
            !!allContributors[key]).map((key) => allContributors[key]);

        this.dialog.open(DynamicDialogComponent, {
            data: {
                component: 'contribution-dialog',
                contributors: contributorKeys
            },
            width: '400px',
            minHeight: '200px'
        });
    }

    /**
     * Updates and redraws the elements and properties for the visualization.
     */
    public redraw(): void {
        const visArray = this.visualizations.toArray();
        if (visArray.length) {
            switch (this.visualizationType) {
                case VisualizationType.TEXT_CLOUD:
                    (visArray[0] as NextCenturyAngularTextCloud).redraw();
            }
        }
    }

    /**
     * Returns the contributor abbreviations from the dashboard config.
     */
    public retrieveContributionAbbreviations(): string {
        let allContributors = this.dashboardState.dashboard.contributors;
        let contributorAbbreviations = (this.options.contributionKeys || Object.keys(allContributors)).filter((key) =>
            !!(allContributors[key] && allContributors[key].abbreviation)).map((key) => allContributors[key].abbreviation);
        return contributorAbbreviations.join(', ');
    }

    /**
     * Returns whether to show the contributions.
     */
    public showContribution(): boolean {
        return !!((this.options.contributionKeys && this.options.contributionKeys.length !== 0) ||
            (this.options.contributionKeys === null &&
                this.dashboardState.dashboard &&
                this.dashboardState.dashboard.contributors &&
                Object.keys(this.dashboardState.dashboard.contributors).length));
    }

    /**
     * Returns whether to show the two pagination buttons.
     */
    public showPagination(): boolean {
        // Assumes single-layer widget.
        return SingleVisualizationWidgetComponent.isPaginatedVisualization(this.visualizationType) && (this.page > 1 ||
            ((this.page * this.options.limit) < this.layerIdToElementCount.get(this.options._id)));
    }

    private _handleChangeData(options?: WidgetOptionCollection, __databaseOrTableChange?: boolean): void {
        this.layerIdToElementCount.set((options || this.options)._id, 0);

        this.errorMessage = '';
        this.cachedPage = -1;
        this.lastPage = true;
        this.page = 1;

        this.eventMessenger.publish(neonEvents.WIDGET_CONFIGURED, {});

        this._updateVisualizationOptions();
    }

    private _onSearchCanceledOrFailed(event: any): void {
        this.loadingCount--;
        this.layerIdToElementCount.set(this.options._id, 0);
        this.errorMessage = event.detail.message || '';
        if (event.detail.message) {
            this.eventMessenger.publish(neonEvents.DASHBOARD_MESSAGE, {
                error: event.detail.error,
                message: event.detail.message
            });
        }
        this._updateInfoElements();
    }

    private _onSearchFinished(event: any): void {
        this.loadingCount--;
        this.layerIdToElementCount.set(this.options._id, event.detail.size);
        this.errorMessage = event.detail.info || (event.detail.size > 0 ? '' : 'No Data');
        this._updateInfoElements();
    }

    private _onSearchLaunched(__event: any): void {
        this.loadingCount++;
    }

    private _onValuesFiltered(event: any): void {
        const selfFilterable = SingleVisualizationWidgetComponent.isSelfFilterableVisualization(this.visualizationType) &&
            !this.options.ignoreSelf;

        const previousPage = this.page;

        if (event.detail.caller === this.id && event.detail.values.length) {
            if (this.cachedPage <= 0) {
                this.cachedPage = this.page;
            }

            if (selfFilterable) {
                this.page = 1;
            }
        }

        if (!event.detail.values.length) {
            if (this.cachedPage <= 0 && (event.detail.caller !== this.id || selfFilterable)) {
                this.page = 1;
            }

            if (this.cachedPage > 0) {
                this.page = this.cachedPage;
                this.cachedPage = -1;
            }
        }

        if (previousPage !== this.page) {
            this._updateVisualizationOptions();
        }
    }

    private _updateHeaderStyles() {
        const visElement = this.elementRef.nativeElement.querySelector('#' + this.visElementId);
        if (this.headerText && this.infoText && visElement) {
            this.headerText.nativeElement.style.maxWidth = Math.floor(visElement.clientWidth - this.infoText.nativeElement.clientWidth -
                this.TOOLBAR_EXTRA_WIDTH - 1) + 'px';
        }
    }

    private _updateInfoElements(): void {
        this.infoButtonText = SingleVisualizationWidgetComponent.createInfoButtonText(this.layerIdToElementCount, this.options, this.page,
            this.visualizationType);
        this.showNoData = (this.errorMessage === 'No Data');

        // Run the change detector after setting the variables to update the DOM.
        this.changeDetector.detectChanges();

        // Update the header styles only AFTER the change detector runs.
        this._updateHeaderStyles();

        // Run the change detector AGAIN AFTER setting the header styles to update the DOM.
        this.changeDetector.detectChanges();

        // Setting the style attribute is needed for the data table.
        this.elementRef.nativeElement.querySelector('.body-container').setAttribute('style', 'display: ' + (this.showNoData ? 'none' :
            'show'));
    }

    private _updateVisualizationOptions(): void {
        this.componentLibraryOptions = SingleVisualizationWidgetComponent.transformComponentLibraryOptions(this.colorThemeService,
            this.options, this.page, this.visualizationType);
        this._updateInfoElements();
    }
}
