/* tslint:disable:no-unused-variable */

import { TestBed, async, inject } from '@angular/core/testing';
import { VisualizationContainerComponent } from './visualization-container.component';
import { VisualizationInjectorComponent } from '../visualization-injector/visualization-injector.component';
import { TextCloudComponent } from '../text-cloud/text-cloud.component';
import { ActiveGridService } from '../../services/active-grid.service';

import { MdIcon, MdToolbar, MdToolbarRow } from '@angular/material';

describe('Component: VisualizationContainer', () => {

    beforeEach(() => {
        TestBed.configureTestingModule({
            declarations: [
                MdIcon,
                MdToolbar,
                MdToolbarRow,
                VisualizationContainerComponent,
                VisualizationInjectorComponent,
                TextCloudComponent
            ],
            providers: [ ActiveGridService ]
        });
    });

    it('should create an instance', inject([ActiveGridService], (ags: ActiveGridService) => {
        let component = new VisualizationContainerComponent(ags);
        expect(component).toBeTruthy();
    }));
});
