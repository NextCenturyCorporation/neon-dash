/* tslint:disable:no-unused-variable */
import { TestBed, inject } from '@angular/core/testing';
import { ComponentFactoryResolver } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ChartModule } from 'angular2-chartjs';
import { NgxDatatableModule } from '@swimlane/ngx-datatable';

import { VisualizationInjectorComponent } from './visualization-injector.component';
import { TextCloudComponent } from '../text-cloud/text-cloud.component';
import { BarChartComponent } from '../bar-chart/bar-chart.component';
import { LineChartComponent } from '../line-chart/line-chart.component';
import { TimelineComponent } from '../timeline/timeline.component';
import { MapComponent } from '../map/map.component';
import { LegendComponent } from '../legend/legend.component';
import { ExportControlComponent } from '../export-control/export-control.component';
import { DataTableComponent } from '../data-table/data-table.component';
import { ScatterPlotComponent } from '../scatter-plot/scatter-plot.component';
import { FilterBuilderComponent } from '../filter-builder/filter-builder.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import {AppMaterialModule} from '../../app.material.module';
import {UnsharedFilterComponent} from '../unshared-filter/unshared-filter.component';
import {VisualizationService} from '../../services/visualization.service';

describe('Component: VisualizationInjector', () => {

    beforeEach(() => {
        TestBed.configureTestingModule({
            declarations: [
                VisualizationInjectorComponent,
                TextCloudComponent,
                BarChartComponent,
                LineChartComponent,
                LegendComponent,
                MapComponent,
                TimelineComponent,
                DataTableComponent,
                ScatterPlotComponent,
                FilterBuilderComponent,
                ExportControlComponent,
                UnsharedFilterComponent
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

    it('should create an instance', inject([ComponentFactoryResolver],
        (resolver: ComponentFactoryResolver) => {
        let component = new VisualizationInjectorComponent(resolver, new VisualizationService());
        expect(component).toBeTruthy();
    }));
});
