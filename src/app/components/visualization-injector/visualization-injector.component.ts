import { Component, Input, ViewContainerRef, ViewChild, ReflectiveInjector, ComponentFactoryResolver } from '@angular/core';

import { BarChartComponent } from '../bar-chart/bar-chart.component';
import { DataTableComponent } from '../data-table/data-table.component';
import { DocumentViewerComponent } from '../document-viewer/document-viewer.component';
import { FilterBuilderComponent } from '../filter-builder/filter-builder.component';
import { LineChartComponent } from '../line-chart/line-chart.component';
import { MapComponent } from '../map/map.component';
import { ScatterPlotComponent } from '../scatter-plot/scatter-plot.component';
import { TextCloudComponent } from '../text-cloud/text-cloud.component';
import { TimelineComponent } from '../timeline/timeline.component';
import { NeonGridItem } from '../../neon-grid-item';

@Component({
    selector: 'app-visualization-injector',
    entryComponents: [BarChartComponent, DataTableComponent, DocumentViewerComponent, FilterBuilderComponent, LineChartComponent, MapComponent, ScatterPlotComponent, TextCloudComponent, TimelineComponent],
    template: `<div #dynamicComponentContainer></div>`,
})
export class VisualizationInjectorComponent {
    currentComponent = null;

    @ViewChild('dynamicComponentContainer', { read: ViewContainerRef }) dynamicComponentContainer: ViewContainerRef;

    // component: Class for the component you want to create
    // inputs: An object with key/value pairs mapped to input name/input value
    @Input() set componentData(data: NeonGridItem) {
        if (!data) {
            return;
        }

        // Inputs need to be in the following format to be resolved properly
        let inputProviders = Object.keys(data.bindings ? data.bindings : {}).map((bindingName) => {
            return { provide: bindingName, useValue: data.bindings[bindingName] };
        });
        let resolvedInputs = ReflectiveInjector.resolve(inputProviders);

        // We create an injector out of the data we want to pass down and this components injector
        let injector = ReflectiveInjector.fromResolvedProviders(resolvedInputs, this.dynamicComponentContainer.parentInjector);

        let vizComponent = this.getComponent(data.type);

        // Destroy the previously created component
        if (this.currentComponent) {
            this.currentComponent.destroy();
        }

        if (vizComponent) {
            // We create a factory out of the component we want to create
            let factory = this.resolver.resolveComponentFactory(vizComponent);

            // We create the component using the factory and the injector
            let component = factory.create(injector);

            // We insert the component into the dom container
            this.dynamicComponentContainer.insert(component.hostView);

            this.currentComponent = component;
        }
    }

    constructor(private resolver: ComponentFactoryResolver) { }

    getComponent(type: string): any {
        switch (type) {
            case 'barChart': return BarChartComponent;
            case 'dataTable': return DataTableComponent;
            case 'documentViewer': return DocumentViewerComponent; 
            case 'textCloud': return TextCloudComponent;
            case 'lineChart': return LineChartComponent;
            case 'map': return MapComponent;
            case 'timeline': return TimelineComponent;
            case 'scatterPlot': return ScatterPlotComponent;
            case 'filterBuilder': return FilterBuilderComponent;


            default: return null;
        }
    }

    onResizeStop() {
        if (this.currentComponent) {
            this.currentComponent.instance.onResizeStop();
        }
    }

}
