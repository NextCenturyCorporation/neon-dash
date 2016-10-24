/* tslint:disable:no-unused-variable */

import { async, inject, TestBed } from '@angular/core/testing';
import { DatasetSelectorComponent } from './dataset-selector.component';
import { ActiveGridService } from '../../services/active-grid.service';
import { ConnectionService } from '../../services/connection.service';
import { DatasetService } from '../../services/dataset.service';
import { NeonGTDConfig } from '../../neon-gtd-config';
import { ParameterService } from '../../services/parameter.service';

import { MdList, MdListItem, MdToolbar, MdToolbarRow } from '@angular/material';

describe('Component: DatasetSelector', () => {

    let testConfig: NeonGTDConfig = new NeonGTDConfig();

    beforeEach(() => {
        TestBed.configureTestingModule({
            declarations: [
                DatasetSelectorComponent,
                MdList,
                MdListItem,
                MdToolbar,
                MdToolbarRow
            ],
            providers: [
                ActiveGridService,
                ConnectionService,
                DatasetService,
                ParameterService,
                { provide: 'config', useValue: testConfig }
            ]
        });
    });

    it('should create an instance', inject([ ActiveGridService, ConnectionService,
                DatasetService, ParameterService ], (ags: ActiveGridService, cs: ConnectionService, ds: DatasetService, ps: ParameterService) => {
        let component = new DatasetSelectorComponent(cs, ds, ps, ags);
        expect(component).toBeTruthy();
    }));
});
