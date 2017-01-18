/* tslint:disable:no-unused-variable */

import { TestBed, async, inject, ComponentFixture } from '@angular/core/testing';
import { VisualizationContainerComponent } from './visualization-container.component';
import { VisualizationInjectorComponent } from '../visualization-injector/visualization-injector.component';
import { TextCloudComponent } from '../text-cloud/text-cloud.component';
import { ActiveGridService } from '../../services/active-grid.service';
import { NeonGTDConfig } from '../../neon-gtd-config';

import { MaterialModule } from '@angular/material';
import { FormsModule } from '@angular/forms';

describe('Component: VisualizationContainer', () => {
    let testConfig: NeonGTDConfig = new NeonGTDConfig();
    let component: VisualizationContainerComponent;
    let fixture: ComponentFixture<VisualizationContainerComponent>;
    let el: HTMLElement;

    beforeEach(() => {
        TestBed.configureTestingModule({
            declarations: [
                VisualizationContainerComponent,
                VisualizationInjectorComponent,
                TextCloudComponent
            ],
            providers: [
                ActiveGridService,
                { provide: 'config', useValue: testConfig }
            ],
            imports: [
                MaterialModule,
                MaterialModule.forRoot(),
                FormsModule
            ]
        });
        fixture = TestBed.createComponent(VisualizationContainerComponent);
        component = fixture.componentInstance;
    });

    it('should create an instance', async(() => {
        expect(component).toBeTruthy();
    }));
});
