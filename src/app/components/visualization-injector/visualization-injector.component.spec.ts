/* tslint:disable:no-unused-variable */
import { TestBed, inject } from '@angular/core/testing';
import { ComponentFactoryResolver } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ChartModule } from 'angular2-chartjs';
import { NgxDatatableModule } from '@swimlane/ngx-datatable';

import { BarChartComponent } from '../bar-chart/bar-chart.component';
import { DataTableComponent } from '../data-table/data-table.component';
import { DocumentViewerComponent } from '../document-viewer/document-viewer.component';
import { ExportControlComponent } from '../export-control/export-control.component';
import { FilterBuilderComponent } from '../filter-builder/filter-builder.component';
import { LegendComponent } from '../legend/legend.component';
import { LineChartComponent } from '../line-chart/line-chart.component';
import { MapComponent } from '../map/map.component';
import { ScatterPlotComponent } from '../scatter-plot/scatter-plot.component';
import { TextCloudComponent } from '../text-cloud/text-cloud.component';
import { TimelineComponent } from '../timeline/timeline.component';
import { UnsharedFilterComponent} from '../unshared-filter/unshared-filter.component';
import { VisualizationInjectorComponent } from './visualization-injector.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import {AppMaterialModule} from '../../app.material.module';
import {VisualizationService} from '../../services/visualization.service';

describe('Component: VisualizationInjector', () => {

    beforeEach(() => {
        TestBed.configureTestingModule({
            declarations: [
                BarChartComponent,
                DataTableComponent,
                DocumentViewerComponent,
                ExportControlComponent,
                FilterBuilderComponent,
                LegendComponent,
                LineChartComponent,
                MapComponent,
                ScatterPlotComponent,
                TextCloudComponent,
                TimelineComponent,
                UnsharedFilterComponent,
                VisualizationInjectorComponent

            ],
            providers: [ComponentFactoryResolver],
            imports: [
                AppMaterialModule,
                FormsModule,
                ChartModule,
                NgxDatatableModule,
                BrowserAnimationsModule
            ]
        });
    });

    it('should create an instance', inject([ComponentFactoryResolver], (resolver: ComponentFactoryResolver) => {
        let component = new VisualizationInjectorComponent(resolver);
        expect(component).toBeTruthy();
    }));
});
