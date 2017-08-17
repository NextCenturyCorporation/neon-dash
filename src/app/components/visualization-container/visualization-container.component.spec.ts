/* tslint:disable:no-unused-variable */

import { TestBed, async, ComponentFixture } from '@angular/core/testing';
import { VisualizationContainerComponent } from './visualization-container.component';
import { VisualizationInjectorComponent } from '../visualization-injector/visualization-injector.component';
import { TextCloudComponent } from '../text-cloud/text-cloud.component';
import { BarChartComponent } from '../bar-chart/bar-chart.component';
import { LineChartComponent } from '../line-chart/line-chart.component';
import { TimelineComponent } from '../timeline/timeline.component';
import { MapComponent } from '../map/map.component';
import { DataTableComponent } from '../data-table/data-table.component';
import { ScatterPlotComponent } from '../scatter-plot/scatter-plot.component';
import { FilterBuilderComponent } from '../filter-builder/filter-builder.component';
import { LegendComponent } from '../legend/legend.component';
import { ExportControlComponent } from '../export-control/export-control.component';
import { ActiveGridService } from '../../services/active-grid.service';
import { NeonGTDConfig } from '../../neon-gtd-config';

import { ChartModule } from 'angular2-chartjs';
import { FormsModule } from '@angular/forms';
import { NgxDatatableModule } from '@swimlane/ngx-datatable';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import {AppMaterialModule} from '../../app.material.module';
import {UnsharedFilterComponent} from '../unshared-filter/unshared-filter.component';

describe('Component: VisualizationContainer', () => {
    let testConfig: NeonGTDConfig = new NeonGTDConfig();
    let component: VisualizationContainerComponent;
    let fixture: ComponentFixture<VisualizationContainerComponent>;

    beforeEach(() => {
        TestBed.configureTestingModule({
            declarations: [
                VisualizationContainerComponent,
                VisualizationInjectorComponent,
                TextCloudComponent,
                BarChartComponent,
                LineChartComponent,
                TimelineComponent,
                LegendComponent,
                MapComponent,
                DataTableComponent,
                ScatterPlotComponent,
                FilterBuilderComponent,
                ExportControlComponent,
                UnsharedFilterComponent
            ],
            providers: [
                ActiveGridService,
                { provide: 'config', useValue: testConfig }
            ],
            imports: [
                AppMaterialModule,
                FormsModule,
                ChartModule,
                NgxDatatableModule,
                BrowserAnimationsModule
            ]
        });
        fixture = TestBed.createComponent(VisualizationContainerComponent);
        component = fixture.componentInstance;
    });

    it('should create an instance', async(() => {
        expect(component).toBeTruthy();
    }));
});
