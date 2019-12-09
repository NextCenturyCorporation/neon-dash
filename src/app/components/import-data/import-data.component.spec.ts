/**
 * Copyright 2019 Next Century Corporation
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Injector } from '@angular/core';

import { } from 'jasmine-core';

import { ImportDataComponent } from './import-data.component';

import { DashboardService } from '../../services/dashboard.service';

import { DashboardServiceMock } from '../../services/mock.dashboard-service';
import { initializeTestBed } from '../../../testUtils/initializeTestBed';

import { ImportDataModule } from './import-data.module';
import { InjectableConnectionService } from '../../services/injectable.connection.service';
import { WidgetOptionCollection } from '../../models/widget-option-collection';
import { CSVService } from '../../services/csv.service';

describe('Component: Import-Data', () => {
    let component: ImportDataComponent;
    let fixture: ComponentFixture<ImportDataComponent>;

    // Setup mock services
    let mockCSVService = jasmine.createSpyObj('csvParser', ['parse', 'abort', 'pause', 'resume']);
    mockCSVService.parse.and.callFake((file: File, settings: any) => {
        if (file.name === 'invalid.csv') {
            settings.chunk({
                errors: [{ row: 1, message: 'failed to parse' }],
                data: [{ col1: 'val1', col2: 'val2' }],
                meta: { fields: ['col1', 'col2'] }
            }, mockCSVService);
        } else {
            settings.chunk({
                errors: [],
                data: [{ col1: 'val1', col2: 'val2' }],
                meta: { fields: ['col1', 'col2'] }
            }, mockCSVService);
        }
    });

    let mockConnection = jasmine.createSpyObj('connection', ['runImportQuery']);
    mockConnection.runImportQuery.and.callFake((importQuery, callBack) => {
        let importResponse = { total: 3, failCount: null };
        importResponse.failCount = importQuery.hostName === 'testHostname' ? 0 : 1;
        callBack(importResponse);
    });

    let mockConnectionService = jasmine.createSpyObj('connectionService', ['connect']);
    mockConnectionService.connect.and.returnValue(mockConnection);

    initializeTestBed('ImportData', {
        providers: [
            { provide: DashboardService, useClass: DashboardServiceMock },
            { provide: InjectableConnectionService, useValue: mockConnectionService },
            { provide: CSVService, useValue: mockCSVService },
            Injector
        ],
        imports: [
            ImportDataModule
        ]
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(ImportDataComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('component should be initialized', (() => {
        expect(component).toBeTruthy();
    }));

    it('should report CSV parse errors', (() => {
        let file = new File(['col1,col2', 'val1,val2'], 'invalid.csv', {
            type: 'text/plain'
        });
        component.inputFile.nativeElement = { files: [file] };
        component.maxAllowedErrors = 0;

        component.onImportClick();

        expect(component.parseErrors.length).toBeGreaterThan(0);
    }));

    it('should warn when source and destination schema don\'t match', (() => {
        // Setup source file
        let file = new File(['col1,col2', 'val1,val2'], 'valid.csv', {
            type: 'text/plain'
        });
        component.inputFile.nativeElement = { files: [file] };

        // Setup destination schema
        component.optionCollection = new WidgetOptionCollection();
        component.optionCollection.fields = [
            { columnName: 'col1', prettyName: 'col1', type: 'text', hide: false },
            { columnName: 'col3', prettyName: 'col3', type: 'text', hide: false }
        ];

        component.onImportClick();

        expect(mockConnectionService.connect).toHaveBeenCalledWith('testDatastore', 'testHostname');

        expect(component.warningMessage.length).toBeGreaterThan(0);
        expect(mockCSVService.abort).toHaveBeenCalledWith();
    }));

    it('Should run import for valid csv file', (() => {
        // Setup source file
        let file = new File(['col1,col2', 'val1,val2'], 'valid.csv', {
            type: 'text/plain'
        });
        component.inputFile.nativeElement = { files: [file] };
        component.sideNavRight = jasmine.createSpyObj('sideNavRight', ['close']);

        // Setup destination store
        component.optionCollection = new WidgetOptionCollection();
        component.optionCollection.datastore = { host: 'testHostname', name: 'testDatastore', type: 'es', databases: null };
        component.optionCollection.database = { name: 'testDatabase', prettyName: 'Test Database', tables: null };
        component.optionCollection.table = { name: 'testTable', prettyName: 'Test Table', fields: null, labelOptions: null };
        component.optionCollection.fields = [
            { columnName: 'col1', prettyName: 'col1', type: 'text', hide: false },
            { columnName: 'col2', prettyName: 'col2', type: 'text', hide: false }
        ];

        component.onImportClick();

        expect(mockConnectionService.connect).toHaveBeenCalledWith('testDatastore', 'testHostname');

        let importQuery = {
            hostName: component.optionCollection.datastore.host,
            dataStoreType: component.optionCollection.datastore.type,
            database: component.optionCollection.database.name,
            table: component.optionCollection.table.name,
            source: [{ col1: 'val1', col2: 'val2' }].map((row) => JSON.stringify(row))
        };
        expect(mockConnection.runImportQuery).toHaveBeenCalledWith(importQuery, jasmine.any(Function), jasmine.any(Function));
        expect(mockCSVService.pause).toHaveBeenCalledWith();

        expect(component.processedRecordsCount).toEqual(1);
        expect(component.dbErrors.length).toEqual(0);
        expect(mockCSVService.resume).toHaveBeenCalledWith();
    }));
});
