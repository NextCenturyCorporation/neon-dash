/* tslint:disable:no-unused-variable */
import { TestBed, inject } from '@angular/core/testing';
import { ComponentFactoryResolver } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MaterialModule } from '@angular/material';
import { ChartModule } from 'angular2-chartjs';

import { VisualizationInjectorComponent } from './visualization-injector.component';
import { TextCloudComponent } from '../text-cloud/text-cloud.component';
import { BarChartComponent } from '../bar-chart/bar-chart.component';
import { LineChartComponent } from '../line-chart/line-chart.component';
import { TimelineComponent } from '../timeline/timeline.component';
import { MapComponent } from '../map/map.component';
import { LegendComponent } from '../legend/legend.component';

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
                TimelineComponent

            ],
            providers: [ ComponentFactoryResolver ],
            imports: [
                MaterialModule,
                MaterialModule.forRoot(),
                FormsModule,
                ChartModule
            ]
        });
    });

    it('should create an instance', inject([ComponentFactoryResolver], (resolver: ComponentFactoryResolver) => {
        let component = new VisualizationInjectorComponent(resolver);
        expect(component).toBeTruthy();
    }));
});
