/* tslint:disable:no-unused-variable */

import { TestBed, async, ComponentFixture } from '@angular/core/testing';
import { VisualizationContainerComponent } from './visualization-container.component';
import { VisualizationInjectorComponent } from '../visualization-injector/visualization-injector.component';
import { TextCloudComponent } from '../text-cloud/text-cloud.component';
import { BarChartComponent } from '../bar-chart/bar-chart.component';
import { LineChartComponent } from '../line-chart/line-chart.component';
import { MapComponent } from '../map/map.component';
import { LegendComponent } from '../legend/legend.component';
import { ActiveGridService } from '../../services/active-grid.service';
import { NeonGTDConfig } from '../../neon-gtd-config';

import { MaterialModule } from '@angular/material';
import { ChartModule } from 'angular2-chartjs';
import { FormsModule } from '@angular/forms';

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
                LegendComponent,
                MapComponent
            ],
            providers: [
                ActiveGridService,
                { provide: 'config', useValue: testConfig }
            ],
            imports: [
                MaterialModule,
                MaterialModule.forRoot(),
                FormsModule,
                ChartModule
            ]
        });
        fixture = TestBed.createComponent(VisualizationContainerComponent);
        component = fixture.componentInstance;
    });

    it('should create an instance', async(() => {
        expect(component).toBeTruthy();
    }));
});
