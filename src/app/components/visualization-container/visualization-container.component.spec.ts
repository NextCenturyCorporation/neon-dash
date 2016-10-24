/* tslint:disable:no-unused-variable */

import { TestBed, async, inject } from '@angular/core/testing';
import { VisualizationContainerComponent } from './visualization-container.component';
import { ActiveGridService } from '../../services/active-grid.service';

describe('Component: VisualizationContainer', () => {

    beforeEach(() => {
        TestBed.configureTestingModule({
            declarations: [ ActiveGridService ]
        });
    });

    it('should create an instance', inject([ActiveGridService], (ags: ActiveGridService) => {
        let component = new VisualizationContainerComponent(ags);
        expect(component).toBeTruthy();
    }));
});
