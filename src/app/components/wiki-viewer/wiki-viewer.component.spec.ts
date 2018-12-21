/*
 * Copyright 2017 Next Century Corporation
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
 *
 */
import { AppMaterialModule } from '../../app.material.module';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { By, DomSanitizer } from '@angular/platform-browser';
import { async, ComponentFixture, fakeAsync, inject, TestBed } from '@angular/core/testing';
import { DatabaseMetaData, FieldMetaData, TableMetaData } from '../../dataset';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { HttpTestingController, HttpClientTestingModule } from '@angular/common/http/testing';
import { Injector } from '@angular/core';
import { NeonGTDConfig } from '../../neon-gtd-config';

import {} from 'jasmine-core';
import * as neon from 'neon-framework';

import { ExportControlComponent } from '../export-control/export-control.component';
import { WikiViewerComponent } from './wiki-viewer.component';

import { ConnectionService } from '../../services/connection.service';
import { DatasetService } from '../../services/dataset.service';
import { FilterService } from '../../services/filter.service';
import { DatasetServiceMock } from '../../../testUtils/MockServices/DatasetServiceMock';
import { initializeTestBed } from '../../../testUtils/initializeTestBed';

describe('Component: WikiViewer', () => {
    let component: WikiViewerComponent;
    let fixture: ComponentFixture<WikiViewerComponent>;

    initializeTestBed({
        declarations: [
            WikiViewerComponent,
            ExportControlComponent
        ],
        providers: [
            ConnectionService,
            DatasetService,
            FilterService,
            Injector,
            { provide: 'config', useValue: new NeonGTDConfig() }
        ],
        imports: [
            AppMaterialModule,
            BrowserAnimationsModule,
            FormsModule,
            HttpClientModule,
            HttpClientTestingModule
        ]
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(WikiViewerComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('exists', (() => {
        expect(component).toBeTruthy();
    }));

    it('does set expected options properties', () => {
        expect(component.options.idField).toEqual(new FieldMetaData());
        expect(component.options.linkField).toEqual(new FieldMetaData());
        expect(component.options.id).toEqual('');
    });

    it('does set expected class properties', () => {
        expect(component.wikiName).toEqual([]);
        expect(component.wikiText).toEqual([]);
    });

    it('createQuery does return expected query', (() => {
        component.options.database = new DatabaseMetaData('testDatabase');
        component.options.table = new TableMetaData('testTable');
        component.options.id = 'testId';
        component.options.idField = new FieldMetaData('testIdField');
        component.options.linkField = new FieldMetaData('testLinkField');

        let query = new neon.query.Query()
            .selectFrom('testDatabase', 'testTable')
            .withFields(['testLinkField']);

        let whereClauses = [
            neon.query.where('testIdField', '=', 'testId'),
            neon.query.where('testLinkField', '!=', null)
        ];

        query.where(neon.query.and.apply(query, whereClauses));

        expect(component.createQuery()).toEqual(query);
    }));

    it('getButtonText does return expected string', () => {
        expect(component.getButtonText()).toBe('0 Pages');
        component.wikiName = ['a'];
        expect(component.getButtonText()).toBe('1 Page');
        component.wikiName = ['a', 'b', 'c', 'd'];
        expect(component.getButtonText()).toBe('4 Pages');
        component.wikiName = ['a', 'b'];
        expect(component.getButtonText()).toBe('2 Pages');
    });

    it('getElementRefs does return expected object', () => {
        let refs = component.getElementRefs();
        expect(refs.headerText).toBeDefined();
        expect(refs.infoText).toBeDefined();
        expect(refs.visualization).toBeDefined();
    });

    it('getFiltersToIgnore does return null', (() => {
        expect(component.getFiltersToIgnore()).toBeNull();
    }));

    it('getFilterText does return empty string', (() => {
        expect(component.getFilterText({})).toBe('');
        expect(component.getFilterText({
            value: 'testValue'
        })).toBe('');
    }));

    it('isValidQuery does return expected result', (() => {
        expect(component.isValidQuery()).toBe(false);

        component.options.database = new DatabaseMetaData('testDatabase');
        expect(component.isValidQuery()).toBe(false);

        component.options.table = new TableMetaData('testTable');
        expect(component.isValidQuery()).toBe(false);

        component.options.id = 'testId';
        expect(component.isValidQuery()).toBe(false);
        expect(component.options.idField).toEqual(new FieldMetaData());
        expect(component.options.linkField).toEqual(new FieldMetaData());

        component.options.idField = new FieldMetaData('testIdField');
        expect(component.isValidQuery()).toBe(false);

        component.options.linkField = new FieldMetaData('testLinkField');
        expect(component.isValidQuery()).toBe(true);
    }));

    it('onQuerySuccess does set expected properties if response returns no data', (() => {
        component.errorMessage = 'testErrorMessage';
        component.options.linkField.columnName = 'testLinkField';
        component.wikiName = ['testName'];
        component.wikiText = ['testText'];

        component.onQuerySuccess({
            data: []
        });

        expect(component.errorMessage).toBe('No Data');
        expect(component.wikiName).toEqual([]);
        expect(component.wikiText).toEqual([]);
    }));

    it('onQuerySuccess does call http.get and does set expected properties if response returns data',
        (inject([HttpTestingController], (backend) => {

        component.errorMessage = 'testErrorMessage';
        component.options.linkField.columnName = 'testLinkField';

        component.onQuerySuccess({
            data: [{
                testLinkField: 'testLinkValue'
            }]
        });

        let request = backend.expectOne({
            url: 'https://en.wikipedia.org/w/api.php?action=parse&format=json&origin=*&prop=text&page=testLinkValue',
            method: 'GET'
        });
        request.flush({
            body: JSON.stringify({
                parse: {
                    text: {
                        '*': '<p>Test Content</p>'
                    },
                    title: 'Test Title'
                }
            })
        });

        expect(component.errorMessage).toBe('');
        expect(component.wikiName).toEqual(['Test Title']);
        expect(component.wikiText.length).toBe(1);
        expect(component.wikiText[0].toString()).toBe(
            'SafeValue must use [property]=binding: <p>Test Content</p> (see http://g.co/ng/security#xss)');
    })));

    it('onQuerySuccess does call http.get and does set expected properties if response failed',
        (inject([HttpTestingController], (backend) => {

        component.options.linkField.columnName = 'testLinkField';
        component.wikiName = ['testName'];
        component.wikiText = ['testText'];

        component.onQuerySuccess({
            data: [{
                testLinkField: 'testLinkValue'
            }]
        });

        let request = backend.expectOne({
            url: 'https://en.wikipedia.org/w/api.php?action=parse&format=json&origin=*&prop=text&page=testLinkValue',
            method: 'GET'
        });
        request.flush({
            error: {
                code: 'Missing Title',
                info: 'The page you specified doesn\'t exist.'
            }
        });

        expect(component.errorMessage).toBe('');
        expect(component.wikiName).toEqual(['testLinkValue']);
        expect(component.wikiText.length).toBe(1);
        expect(component.wikiText[0]).toEqual('Missing Title: The page you specified doesn\'t exist.');
    })));

    it('onQuerySuccess does call http.get multiple times and does set expected properties if response returns data with multiple links',
        (inject([HttpTestingController], (backend) => {

        component.errorMessage = 'testErrorMessage';
        component.options.linkField.columnName = 'testLinkField';

        component.onQuerySuccess({
            data: [{
                testLinkField: ['testLinkValue1', 'testLinkValue2']
            }]
        });

        let request1 = backend.expectOne({
            url: 'https://en.wikipedia.org/w/api.php?action=parse&format=json&origin=*&prop=text&page=testLinkValue1',
            method: 'GET'
        });
        request1.flush({
            body: JSON.stringify({
                parse: {
                    text: {
                        '*': '<p>Test Content 1</p>'
                    },
                    title: 'Test Title 1'
                }
            })
        });

        let request2 = backend.expectOne({
            url: 'https://en.wikipedia.org/w/api.php?action=parse&format=json&origin=*&prop=text&page=testLinkValue2',
            method: 'GET'
        });
        request2.flush({
            body: JSON.stringify({
                parse: {
                    text: {
                        '*': '<p>Test Content 2</p>'
                    },
                    title: 'Test Title 2'
                }
            })
        });

        expect(component.errorMessage).toBe('');
        expect(component.wikiName).toEqual(['Test Title 1', 'Test Title 2']);
        expect(component.wikiText.length).toBe(2);
        expect(component.wikiText[0].toString()).toBe(
            'SafeValue must use [property]=binding: <p>Test Content 1</p> (see http://g.co/ng/security#xss)');
        expect(component.wikiText[1].toString()).toBe(
            'SafeValue must use [property]=binding: <p>Test Content 2</p> (see http://g.co/ng/security#xss)');
    })));

    it('postInit does call executeQueryChain', (() => {
        let spy = spyOn(component, 'executeQueryChain');
        component.postInit();
        expect(spy.calls.count()).toBe(1);
    }));

    it('refreshVisualization does call changeDetection.detectChanges', (() => {
        let spy = spyOn(component.changeDetection, 'detectChanges');
        component.refreshVisualization();
        expect(spy.calls.count()).toBe(1);
    }));

    it('removeFilter function does exist', (() => {
        expect(component.removeFilter).toBeDefined();
    }));

    it('setupFilters function does exist', (() => {
        expect(component.setupFilters).toBeDefined();
    }));

    it('subNgOnDestroy function does exist', (() => {
        expect(component.subNgOnDestroy).toBeDefined();
    }));

    it('subNgOnInit function does exist', (() => {
        expect(component.subNgOnInit).toBeDefined();
    }));

    it('does show toolbar and sidenav', (() => {
        fixture.detectChanges();
        let container = fixture.debugElement.query(By.css('mat-sidenav-container'));
        expect(container).not.toBeNull();
        let toolbar = fixture.debugElement.query(By.css('mat-sidenav-container mat-toolbar'));
        expect(toolbar).not.toBeNull();
        let sidenav = fixture.debugElement.query(By.css('mat-sidenav-container mat-sidenav'));
        expect(sidenav).not.toBeNull();
    }));

    it('does show header in toolbar with visualization name', (() => {
        fixture.detectChanges();
        let header = fixture.debugElement.query(By.css('mat-sidenav-container mat-toolbar .header'));
        expect(header).not.toBeNull();
        expect(header.nativeElement.textContent).toBe('Wiki Viewer');
    }));

    it('does hide error-message in toolbar and sidenav if errorMessage is undefined', (() => {
        fixture.detectChanges();
        let errorMessageInToolbar = fixture.debugElement.query(By.css('mat-sidenav-container mat-toolbar .error-message'));
        expect(errorMessageInToolbar).toBeNull();

        let iconInSidenav = fixture.debugElement.query(By.css('mat-sidenav-container mat-sidenav .error-message mat-icon'));
        expect(iconInSidenav).toBeNull();

        let errorMessageInSidenav = fixture.debugElement.query(By.css('mat-sidenav-container mat-sidenav .error-message span'));
        expect(errorMessageInSidenav).toBeNull();
    }));

    it('does show error-message in toolbar and sidenav if errorMessage is defined', async(() => {
        component.errorMessage = 'Test Error Message';
        fixture.detectChanges();

        fixture.whenStable().then(() => {
            fixture.detectChanges();

            let errorMessageInToolbar = fixture.debugElement.query(By.css('mat-sidenav-container mat-toolbar .error-message'));
            expect(errorMessageInToolbar).not.toBeNull();
            expect(errorMessageInToolbar.nativeElement.textContent).toContain('Test Error Message');

            let iconInSidenav = fixture.debugElement.query(By.css('mat-sidenav-container mat-sidenav .error-message mat-icon'));
            expect(iconInSidenav).not.toBeNull();
            expect(iconInSidenav.nativeElement.textContent).toBe('error');

            let errorMessageInSidenav = fixture.debugElement.query(By.css('mat-sidenav-container mat-sidenav .error-message span'));
            expect(errorMessageInSidenav).not.toBeNull();
            expect(errorMessageInSidenav.nativeElement.textContent).toContain('Test Error Message');
        });
    }));

    it('does show settings icon button in toolbar', (() => {
        fixture.detectChanges();
        let button = fixture.debugElement.query(By.css('mat-sidenav-container mat-toolbar button'));
        expect(button.attributes.matTooltip).toBe('Open/Close the Options Menu');

        let icon = fixture.debugElement.query(By.css('mat-sidenav-container mat-toolbar button mat-icon'));
        expect(icon.nativeElement.textContent).toBe('settings');
    }));

    it('does show sidenav options menu', (() => {
        let menu = fixture.debugElement.query(By.css('mat-sidenav-container mat-sidenav mat-card'));
        expect(menu).not.toBeNull();

        let content = fixture.debugElement.query(By.css('mat-sidenav-container mat-sidenav mat-card mat-card-content'));
        expect(content).not.toBeNull();
    }));

    it('does show selects in sidenav options menu that have no options', (() => {
        fixture.detectChanges();

        let inputs = fixture.debugElement.queryAll(
            By.css('mat-sidenav-container mat-sidenav mat-card mat-card-content mat-form-field .mat-input-element'));
        let selects = fixture.debugElement.queryAll(
            By.css('mat-sidenav-container mat-sidenav mat-card mat-card-content mat-form-field .mat-select'));
        let placeholders = fixture.debugElement.queryAll(
            By.css('mat-sidenav-container mat-sidenav mat-card mat-card-content mat-form-field .mat-form-field-placeholder-wrapper'));
        expect(inputs.length).toBe(1);
        expect(selects.length).toBe(4);
        expect(placeholders.length).toBe(5);

        expect(placeholders[0].nativeElement.textContent).toContain('Title');
        expect(selects[0].componentInstance.disabled).toBe(true);
        expect(placeholders[1].nativeElement.textContent).toContain('Database');
        expect(selects[1].componentInstance.disabled).toBe(true);
        expect(placeholders[2].nativeElement.textContent).toContain('Table');
        expect(selects[2].componentInstance.disabled).toBe(true);
        expect(placeholders[3].nativeElement.textContent).toContain('ID Field');
        expect(selects[3].componentInstance.disabled).toBe(true);
        expect(placeholders[4].nativeElement.textContent).toContain('Link Field');

        // TODO How can we test the input model values?
    }));

    it('does show export control in sidenav options menu', (() => {
        fixture.detectChanges();

        let exportControl = fixture.debugElement.query(By.css(
            'mat-sidenav-container mat-sidenav mat-card mat-card-content app-export-control'));
        expect(exportControl).not.toBeNull();
    }));

    it('does hide loading overlay by default', (() => {
        fixture.detectChanges();

        let hiddenLoadingOverlay = fixture.debugElement.query(By.css('mat-sidenav-container .not-loading-overlay'));
        expect(hiddenLoadingOverlay).not.toBeNull();

        let hiddenSpinner = fixture.debugElement.query(By.css('mat-sidenav-container .not-loading-overlay mat-spinner'));
        expect(hiddenSpinner).not.toBeNull();
    }));

    it('does show loading overlay if isLoading is true', async(() => {
        component.isLoading = true;
        fixture.detectChanges();

        fixture.whenStable().then(() => {
            fixture.detectChanges();

            let loadingOverlay = fixture.debugElement.query(By.css('mat-sidenav-container .loading-overlay'));
            expect(loadingOverlay).not.toBeNull();

            let spinner = fixture.debugElement.query(By.css('mat-sidenav-container .loading-overlay mat-spinner'));
            expect(spinner).not.toBeNull();
        });
    }));

    it('does hide wiki-text tabs if wikiText is empty', inject([DomSanitizer], (sanitizer) => {
        fixture.detectChanges();
        let tabs = fixture.debugElement.queryAll(By.css('mat-sidenav-container mat-tab-group .mat-tab-label'));
        expect(tabs.length).toBe(0);

        let text = fixture.debugElement.queryAll(By.css('mat-sidenav-container mat-tab-group .wiki-text'));
        expect(text.length).toBe(0);
    }));

    it('does show wiki-text tabs if wikiText is not empty', async(inject([DomSanitizer], (sanitizer) => {
        component.wikiName = ['Tab One', 'Tab Two'];
        component.wikiText = [sanitizer.bypassSecurityTrustHtml('<p>one</p>'), sanitizer.bypassSecurityTrustHtml('<p>two</p>')];
        fixture.detectChanges();

        fixture.whenStable().then(() => {
            fixture.detectChanges();

            expect(component.wikiText.length).toBe(2);
            expect(component.wikiText[0].toString()).toBe(
                'SafeValue must use [property]=binding: <p>one</p> (see http://g.co/ng/security#xss)');
            expect(component.wikiText[1].toString()).toBe(
                'SafeValue must use [property]=binding: <p>two</p> (see http://g.co/ng/security#xss)');

            let tabs = fixture.debugElement.queryAll(By.css('mat-sidenav-container mat-tab-group .mat-tab-label'));
            expect(tabs.length).toBe(2);
            expect(tabs[0].nativeElement.textContent).toBe('Tab One');
            expect(tabs[0].nativeElement.classList.contains('mat-tab-label-active')).toBe(true);
            expect(tabs[1].nativeElement.textContent).toBe('Tab Two');
            expect(tabs[1].nativeElement.classList.contains('mat-tab-label-active')).toBe(false);

            let text = fixture.debugElement.queryAll(By.css('mat-sidenav-container mat-tab-group .wiki-text'));
            expect(text.length).toBe(1);
            expect(text[0].nativeElement.innerHTML).toBe('<p>one</p>');
        });
    })));
});

describe('Component: WikiViewer with config', () => {
    let component: WikiViewerComponent;
    let fixture: ComponentFixture<WikiViewerComponent>;

    initializeTestBed({
        declarations: [
            WikiViewerComponent,
            ExportControlComponent
        ],
        providers: [
            ConnectionService,
            { provide: DatasetService, useClass: DatasetServiceMock },
            FilterService,
            Injector,
            { provide: 'config', useValue: new NeonGTDConfig() },
            { provide: 'tableKey', useValue: 'table_key_1' },
            { provide: 'id', useValue: 'testId' },
            { provide: 'idField', useValue: 'testIdField' },
            { provide: 'linkField', useValue: 'testLinkField' },
            { provide: 'title', useValue: 'Test Title' }
        ],
        imports: [
            AppMaterialModule,
            BrowserAnimationsModule,
            FormsModule,
            HttpClientModule,
            HttpClientTestingModule
        ]
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(WikiViewerComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('does set expected superclass options properties', (() => {
        expect(component.options.database).toEqual(DatasetServiceMock.DATABASES[0]);
        expect(component.options.databases).toEqual(DatasetServiceMock.DATABASES);
        expect(component.options.table).toEqual(DatasetServiceMock.TABLES[0]);
        expect(component.options.tables).toEqual(DatasetServiceMock.TABLES);
        expect(component.options.fields).toEqual(DatasetServiceMock.FIELDS);
    }));

    it('does set expected options properties', () => {
        expect(component.options.idField).toEqual(new FieldMetaData('testIdField', 'Test ID Field', false, 'string'));
        expect(component.options.linkField).toEqual(new FieldMetaData('testLinkField', 'Test Link Field', false, 'string'));
        expect(component.options.id).toEqual('testId');
    });

    it('does set expected class properties', () => {
        expect(component.wikiName).toEqual([]);
        expect(component.wikiText).toEqual([]);
    });

    it('does show header in toolbar with title from config', (() => {
        fixture.detectChanges();
        let header = fixture.debugElement.query(By.css('mat-sidenav-container mat-toolbar .header'));
        expect(header).not.toBeNull();
        expect(header.nativeElement.textContent).toBe('Test Title');
    }));

    it('does show selects in sidenav options menu that have expected options', (() => {
        fixture.detectChanges();

        let inputs = fixture.debugElement.queryAll(
            By.css('mat-sidenav-container mat-sidenav mat-card mat-card-content mat-form-field .mat-input-element'));
        let selects = fixture.debugElement.queryAll(
            By.css('mat-sidenav-container mat-sidenav mat-card mat-card-content mat-form-field .mat-select'));
        let placeholders = fixture.debugElement.queryAll(
            By.css('mat-sidenav-container mat-sidenav mat-card mat-card-content mat-form-field .mat-form-field-placeholder-wrapper'));
        expect(inputs.length).toBe(1);
        expect(selects.length).toBe(4);
        expect(placeholders.length).toBe(5);

        expect(placeholders[0].nativeElement.textContent).toContain('Title');

        // Don't directly test the two arrays because it's causing an overflow error!
        expect(selects[0].componentInstance.options.toArray().length).toEqual(DatasetServiceMock.DATABASES.length);
        expect(selects[0].componentInstance.disabled).toBe(false);
        expect(placeholders[1].nativeElement.textContent).toContain('Database');

        expect(selects[1].componentInstance.options.toArray().length).toEqual(DatasetServiceMock.TABLES.length);
        expect(selects[1].componentInstance.disabled).toBe(false);
        expect(placeholders[2].nativeElement.textContent).toContain('Table');

        expect(selects[2].componentInstance.options.toArray().length).toEqual(DatasetServiceMock.FIELDS.length);
        expect(selects[2].componentInstance.disabled).toBe(false);
        expect(placeholders[3].nativeElement.textContent).toContain('ID Field');

        expect(selects[3].componentInstance.options.toArray().length).toEqual(DatasetServiceMock.FIELDS.length);
        expect(selects[3].componentInstance.disabled).toBe(false);
        expect(placeholders[4].nativeElement.textContent).toContain('Link Field');

        // TODO How can we test the input and select model values?
    }));
});
