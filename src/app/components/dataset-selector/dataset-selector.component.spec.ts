/* tslint:disable:no-unused-variable */

// import { By }           from '@angular/platform-browser';
// import { DebugElement } from '@angular/core';
import { async, inject, TestBed } from '@angular/core/testing';
import { DatasetSelectorComponent } from './dataset-selector.component';
import { ActiveGridService } from '../../services/active-grid.service';
import { ConnectionService } from '../../services/connection.service';
import { DatasetService } from '../../services/dataset.service';
import { ParameterService } from '../../services/parameter.service';

describe('Component: DatasetSelector', () => {

    beforeEach(() => {
        TestBed.configureTestingModule({
            declarations: [DatasetSelectorComponent, ActiveGridService, ConnectionService,
                DatasetService, ParameterService ]
        });
    });

    it('should be injectable', inject([ActiveGridService], (service: ActiveGridService) => {
      expect(service).toBeTruthy();
    }));

    it('should create an instance', inject([ ActiveGridService, ConnectionService,
                DatasetService, ParameterService ], (ags: ActiveGridService, cs: ConnectionService, ds: DatasetService, ps: ParameterService) => {
        let component = new DatasetSelectorComponent(cs, ds, ps, ags);
        expect(component).toBeTruthy();
    }));
});
