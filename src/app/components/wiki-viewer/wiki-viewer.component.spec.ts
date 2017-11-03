/* tslint:disable:no-unused-variable */
import { AppMaterialModule } from '../../app.material.module';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { By, DomSanitizer } from '@angular/platform-browser';
import { ComponentFixture, fakeAsync, inject, TestBed, tick } from '@angular/core/testing';
import { DatabaseMetaData, FieldMetaData, TableMetaData } from '../../dataset';
import { FormsModule } from '@angular/forms';
import { HttpModule, Response, ResponseOptions, XHRBackend } from '@angular/http';
import { Injector } from '@angular/core';
import { MockBackend } from '@angular/http/testing';
import { NeonGTDConfig } from '../../neon-gtd-config';

import {} from 'jasmine';
import * as neon from 'neon-framework';

import { ExportControlComponent } from '../export-control/export-control.component';
import { WikiViewerComponent } from './wiki-viewer.component';

import { ConnectionService } from '../../services/connection.service';
import { DatasetService } from '../../services/dataset.service';
import { ErrorNotificationService } from '../../services/error-notification.service';
import { ExportService } from '../../services/export.service';
import { FilterService } from '../../services/filter.service';
import { ThemesService } from '../../services/themes.service';
import { VisualizationService } from '../../services/visualization.service';

class TestDatasetService extends DatasetService {
    constructor() {
        super(new NeonGTDConfig());
        let testDatabase = new DatabaseMetaData('testDatabase', 'Test Database');
        testDatabase.tables = [
            new TableMetaData('testTable', 'Test Table', [
                new FieldMetaData('testIdField', 'Test ID Field'),
                new FieldMetaData('testLinkField', 'Test Link Field')
            ])
        ];
        this.setActiveDataset({
            databases: [testDatabase]
        });
    }
};

describe('Component: WikiViewer', () => {
    let component: WikiViewerComponent;
    let fixture: ComponentFixture<WikiViewerComponent>;

    beforeEach(() => {
        TestBed.configureTestingModule({
            declarations: [
                WikiViewerComponent,
                ExportControlComponent
            ],
            providers: [
                ConnectionService,
                DatasetService,
                ExportService,
                ErrorNotificationService,
                FilterService,
                ThemesService,
                VisualizationService,
                Injector,
                { provide: 'config', useValue: new NeonGTDConfig() },
                // Mock for testing Http
                { provide: XHRBackend, useClass: MockBackend }
            ],
            imports: [
                AppMaterialModule,
                BrowserAnimationsModule,
                FormsModule,
                HttpModule
            ]
        });
        fixture = TestBed.createComponent(WikiViewerComponent);
        component = fixture.componentInstance;
    });

    it('exists', (() => {
        expect(component).toBeTruthy();
    }));

    it('has expected active properties', (() => {
        expect(component.active).toEqual({
            allowsTranslations: true,
            errorMessage: '',
            id: '',
            idField: new FieldMetaData(),
            linkField: new FieldMetaData(),
            textColor: '#111',
            wikiName: '',
            wikiText: ''
        });
    }));

    it('returns null from createNeonFilterClauseEquals', (() => {
        expect(component.createNeonFilterClauseEquals('testDatabase', 'testTable', 'testField')).toBeNull();
    }));

    it('returns expected query from createQuery', (() => {
        component.meta.database = new DatabaseMetaData('testDatabase');
        component.meta.table = new TableMetaData('testTable');
        component.active.id = 'testId';
        component.active.idField.columnName = 'testIdField';
        component.active.linkField.columnName = 'testLinkField';

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

    it('returns expected list from getExportFields', (() => {
        component.active.idField.columnName = 'testIdField';
        component.active.idField.prettyName = 'Test ID Field';
        component.active.linkField.columnName = 'testLinkField';
        component.active.linkField.prettyName = 'Test Link Field';

        expect(component.getExportFields()).toEqual([{
            columnName: 'testIdField',
            prettyName: 'Test ID Field'
        }, {
            columnName: 'testLinkField',
            prettyName: 'Test Link Field'
        }]);
    }));

    it('returns null from getFiltersToIgnore', (() => {
        expect(component.getFiltersToIgnore()).toBeNull();
    }));

    it('returns empty string from getFilterText', (() => {
        expect(component.getFilterText({})).toBe('');
        expect(component.getFilterText({
            value: 'testValue'
        })).toBe('');
    }));

    it('returns empty list from getNeonFilterFields', (() => {
        expect(component.getNeonFilterFields()).toEqual([]);
    }));

    it('returns null options from getOptionFromConfig because config is empty', (() => {
        expect(component.getOptionFromConfig('database')).toBeNull();
        expect(component.getOptionFromConfig('idField')).toBeNull();
        expect(component.getOptionFromConfig('linkField')).toBeNull();
        expect(component.getOptionFromConfig('table')).toBeNull();
        expect(component.getOptionFromConfig('title')).toBeNull();
    }));

    it('returns expected string from getVisualizationName', (() => {
        expect(component.getVisualizationName()).toBe('Wiki Viewer');
    }));

    it('returns expected result from isValidQuery', (() => {
        expect(component.isValidQuery()).toBe(false);

        component.meta.database = new DatabaseMetaData('testDatabase');
        expect(component.isValidQuery()).toBe(false);

        component.meta.table = new TableMetaData('testTable');
        expect(component.isValidQuery()).toBe(false);

        component.active.id = 'testId';
        expect(component.isValidQuery()).toBe(false);

        component.active.idField.columnName = 'testIdField';
        expect(component.isValidQuery()).toBe(false);

        component.active.linkField.columnName = 'testLinkField';
        expect(component.isValidQuery()).toBe(true);
    }));

    it('sets expected properties in onQuerySuccess if response returns no data', (() => {
        component.active.linkField.columnName = 'testLinkField';
        component.active.errorMessage = 'testErrorMessage';
        component.active.wikiName = 'testName';
        component.active.wikiText = 'testText';

        component.onQuerySuccess({
            data: []
        });

        expect(component.active.errorMessage).toBe('No Data');
        expect(component.active.wikiName).toBe('');
        expect(component.active.wikiText).toBe('');
    }));

    it('calls http.get and sets expected properties in onQuerySuccess if response returns data',
    fakeAsync(inject([XHRBackend], (mockBackend) => {

        component.active.linkField.columnName = 'testLinkField';
        component.active.errorMessage = 'testErrorMessage';

        mockBackend.connections.subscribe((connection) => {
            connection.mockRespond(new Response(new ResponseOptions({
                body: JSON.stringify({
                    parse: {
                        text: {
                            '*': '<p>Test Content</p>'
                        },
                        title: 'Test Title'
                    }
                })
            })));
        });

        component.onQuerySuccess({
            data: [{
                testLinkField: 'testLinkValue'
            }]
        });

        // Wait for the HTTP response.
        tick(500);
        expect(component.active.errorMessage).toBe('');
        expect(component.active.wikiName).toBe('Test Title');
        expect(component.active.wikiText.toString()).toBe(
            'SafeValue must use [property]=binding: <p>Test Content</p> (see http://g.co/ng/security#xss)');
    })));

    it('calls http.get and sets expected properties in onQuerySuccess if response failed', fakeAsync(inject([XHRBackend], (mockBackend) => {
        component.active.linkField.columnName = 'testLinkField';
        component.active.wikiName = 'testName';
        component.active.wikiText = 'testText';

        mockBackend.connections.subscribe((connection) => {
            connection.mockError(new Response(new ResponseOptions({
                body: 'Test Error Message',
                status: 500
            })));
        });

        component.onQuerySuccess({
            data: [{
                testLinkField: 'testLinkValue'
            }]
        });

        // Wait for the HTTP response.
        tick(500);
        expect(component.active.errorMessage).toBe('Query Error');
        expect(component.active.wikiName).toBe('');
        expect(component.active.wikiText).toBe('');
    })));

    it('sets expected fields in onUpdateFields to empty strings because fields are empty', (() => {
        component.onUpdateFields();
        expect(component.active.idField).toEqual({
            columnName: '',
            prettyName: '',
            hide: false
        });
        expect(component.active.linkField).toEqual({
            columnName: '',
            prettyName: '',
            hide: false
        });
    }));

    it('runs executeQueryChain in postInit', (() => {
        let spy = spyOn(component, 'executeQueryChain');
        component.postInit();
        expect(spy.calls.count()).toBe(1);
    }));

    it('runs changeDetection.detectChanges in refreshVisualization', (() => {
        let spy = spyOn(component.changeDetection, 'detectChanges');
        component.refreshVisualization();
        expect(spy.calls.count()).toBe(1);
    }));

    it('has removeFilter function that does nothing', (() => {
        expect(component.removeFilter).toBeDefined();
    }));

    it('has setupFilters function that does nothing', (() => {
        expect(component.setupFilters).toBeDefined();
    }));

    it('sets expected bindings in subGetBindings', (() => {
        component.active.idField.columnName = 'testIdField';
        component.active.linkField.columnName = 'testLinkField';

        let bindings = {};
        component.subGetBindings(bindings);
        expect(bindings).toEqual({
            idField: 'testIdField',
            linkField: 'testLinkField'
        });
    }));

    it('has subNgOnDestroy function that does nothing', (() => {
        expect(component.subNgOnDestroy).toBeDefined();
    }));

    it('has subNgOnInit function that does nothing', (() => {
        expect(component.subNgOnInit).toBeDefined();
    }));

    it('shows toolbar and sidenav', (() => {
        let container = fixture.debugElement.query(By.css('mat-sidenav-container'));
        expect(container).not.toBeNull();
        let toolbar = fixture.debugElement.query(By.css('mat-sidenav-container mat-toolbar'));
        expect(toolbar).not.toBeNull();
        let sidenav = fixture.debugElement.query(By.css('mat-sidenav-container mat-sidenav'));
        expect(sidenav).not.toBeNull();
    }));

    it('shows header in toolbar that shows visualization name', (() => {
        fixture.detectChanges();
        let header = fixture.debugElement.query(By.css('mat-sidenav-container mat-toolbar .header'));
        expect(header).not.toBeNull();
        expect(header.nativeElement.textContent).toBe('Wiki Viewer');
    }));

    it('hides error-message in toolbar and sidenav if active.errorMessage is undefined', (() => {
        let errorMessageInToolbar = fixture.debugElement.query(By.css('mat-sidenav-container mat-toolbar .error-message'));
        expect(errorMessageInToolbar).toBeNull();

        let iconInSidenav = fixture.debugElement.query(By.css('mat-sidenav-container mat-toolbar .error-message mat-icon'));
        expect(iconInSidenav).toBeNull();

        let errorMessageInSidenav = fixture.debugElement.query(By.css('mat-sidenav-container mat-toolbar .error-message > div'));
        expect(errorMessageInSidenav).toBeNull();
    }));

    it('shows error-message in toolbar and sidenav if active.errorMessage is defined', (() => {
        component.active.errorMessage = 'Test Error Message';
        fixture.detectChanges();

        let errorMessageInToolbar = fixture.debugElement.query(By.css('mat-sidenav-container mat-toolbar .error-message'));
        expect(errorMessageInToolbar).not.toBeNull();
        expect(errorMessageInToolbar.nativeElement.textContent).toBe('Test Error Message');

        let iconInSidenav = fixture.debugElement.query(By.css('mat-sidenav-container mat-sidenav .error-message.icon'));
        expect(iconInSidenav).not.toBeNull();
        expect(iconInSidenav.nativeElement.textContent).toBe('error');

        let errorMessageInSidenav = fixture.debugElement.query(By.css('mat-sidenav-container mat-toolbar .error-message.text'));
        expect(errorMessageInSidenav).not.toBeNull();
        expect(errorMessageInSidenav.nativeElement.textContent).toBe('Test Error Message');
    }));

    it('hides wiki-name in toolbar and sidenav if active.wikiName is undefined', (() => {
        let nameInToolbar = fixture.debugElement.query(By.css('mat-sidenav-container mat-toolbar .wiki-name'));
        expect(nameInToolbar).toBeNull();

        let iconInSidenav = fixture.debugElement.query(By.css('mat-sidenav-container mat-toolbar .wiki-name mat-icon'));
        expect(iconInSidenav).toBeNull();

        let nameInSidenav = fixture.debugElement.query(By.css('mat-sidenav-container mat-toolbar .wiki-name > div'));
        expect(nameInSidenav).toBeNull();
    }));

    it('shows wiki-name in toolbar and sidenav if active.wikiName is defined', (() => {
        component.active.wikiName = 'Test Name';
        fixture.detectChanges();

        let nameInToolbar = fixture.debugElement.query(By.css('mat-sidenav-container mat-toolbar .wiki-name'));
        expect(nameInToolbar).not.toBeNull();
        expect(nameInToolbar.nativeElement.textContent).toBe('Test Name');

        let iconInSidenav = fixture.debugElement.query(By.css('mat-sidenav-container mat-sidenav .wiki-name.icon'));
        expect(iconInSidenav).not.toBeNull();
        expect(iconInSidenav.nativeElement.textContent).toBe('web');

        let nameInSidenav = fixture.debugElement.query(By.css('mat-sidenav-container mat-toolbar .wiki-name.text'));
        expect(nameInSidenav).not.toBeNull();
        expect(nameInSidenav.nativeElement.textContent).toBe('Test Name');
    }));

    it('shows settings icon button in toolbar', (() => {
        let button = fixture.debugElement.query(By.css('mat-sidenav-container mat-toolbar button'));
        expect(button.attributes.matTooltip).toBe('Open/Close the Options Menu');

        let icon = fixture.debugElement.query(By.css('mat-sidenav-container mat-toolbar button mat-icon'));
        expect(icon.nativeElement.textContent).toBe('settings');
    }));

    it('shows sidenav options menu', (() => {
        let menu = fixture.debugElement.query(By.css('mat-sidenav-container mat-sidenav mat-card'));
        expect(menu).not.toBeNull();

        let content = fixture.debugElement.query(By.css('mat-sidenav-container mat-sidenav mat-card mat-card-content'));
        expect(content).not.toBeNull();
    }));

    it('shows selects in sidenav options menu that have no options', (() => {
        fixture.detectChanges();

        let selects = fixture.debugElement.queryAll(By.css('mat-sidenav-container mat-sidenav mat-card mat-card-content mat-select'));
        expect(selects.length).toBe(4);
        expect(selects[0].componentInstance.disabled).toBe(true);
        expect(selects[0].nativeElement.textContent).toBe('Database');
        expect(selects[1].componentInstance.disabled).toBe(true);
        expect(selects[1].nativeElement.textContent).toBe('Table');
        expect(selects[2].componentInstance.disabled).toBe(true);
        expect(selects[2].nativeElement.textContent).toBe('ID Field');
        expect(selects[3].componentInstance.disabled).toBe(true);
        expect(selects[3].nativeElement.textContent).toBe('Link Field');
    }));

    it('shows export control in sidenav options menu', (() => {
        fixture.detectChanges();

        let exportControl = fixture.debugElement.query(By.css(
            'mat-sidenav-container mat-sidenav mat-card mat-card-content app-export-control'));
        expect(exportControl).not.toBeNull();
        expect(exportControl.componentInstance.exportId).toBeDefined();
    }));

    it('hides loading overlay by default', (() => {
        fixture.detectChanges();

        let loadingOverlay = fixture.debugElement.query(By.css('mat-sidenav-container .not-loading-overlay'));
        expect(loadingOverlay).not.toBeNull();

        let spinner = fixture.debugElement.query(By.css('mat-sidenav-container .not-loading-overlay mat-spinner'));
        expect(spinner).not.toBeNull();
    }));

    it('shows loading overlay if isLoading is true', (() => {
        component.isLoading = true;
        fixture.detectChanges();

        let loadingOverlay = fixture.debugElement.query(By.css('mat-sidenav-container .loading-overlay'));
        expect(loadingOverlay).not.toBeNull();

        let spinner = fixture.debugElement.query(By.css('mat-sidenav-container .loading-overlay mat-spinner'));
        expect(spinner).not.toBeNull();
    }));

    it('shows wiki-text is empty if active.wikiText is empty', inject([DomSanitizer], (sanitizer) => {
        let text = fixture.debugElement.query(By.css('mat-sidenav-container .wiki-text'));
        expect(text).not.toBeNull();
        expect(text.nativeElement.textContent).toBe('');
        expect(text.nativeElement.innerHTML).toBe('');
    }));

    it('shows wiki-text with active.wikiText', inject([DomSanitizer], (sanitizer) => {
        component.active.wikiText = sanitizer.bypassSecurityTrustHtml('<p>test</p>');
        fixture.detectChanges();

        expect(component.active.wikiText.toString()).toBe(
            'SafeValue must use [property]=binding: <p>test</p> (see http://g.co/ng/security#xss)');
        let text = fixture.debugElement.query(By.css('mat-sidenav-container .wiki-text'));
        expect(text).not.toBeNull();
        expect(text.nativeElement.textContent).toBe('test');
        expect(text.nativeElement.innerHTML).toBe('<p>test</p>');
    }));
});

describe('Component: WikiViewer with config', () => {
    let component: WikiViewerComponent;
    let fixture: ComponentFixture<WikiViewerComponent>;

    beforeEach(() => {
        TestBed.configureTestingModule({
            declarations: [
                WikiViewerComponent,
                ExportControlComponent
            ],
            providers: [
                ConnectionService,
                {
                    provide: DatasetService,
                    useClass: TestDatasetService
                },
                ExportService,
                ErrorNotificationService,
                FilterService,
                ThemesService,
                VisualizationService,
                Injector,
                { provide: 'config', useValue: new NeonGTDConfig() },
                { provide: 'database', useValue: 'testDatabase' },
                { provide: 'table', useValue: 'testTable' },
                { provide: 'id', useValue: 'testId' },
                { provide: 'idField', useValue: 'testIdField' },
                { provide: 'linkField', useValue: 'testLinkField' },
                { provide: 'title', useValue: 'Test Title' }
            ],
            imports: [
                AppMaterialModule,
                BrowserAnimationsModule,
                FormsModule,
                HttpModule
            ]
        });
        fixture = TestBed.createComponent(WikiViewerComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('has expected meta properties', (() => {
        let testIdField = new FieldMetaData('testIdField', 'Test ID Field');
        let testLinkField = new FieldMetaData('testLinkField', 'Test Link Field');
        let testTable = new TableMetaData('testTable', 'Test Table', [testIdField, testLinkField]);
        let testDatabase = new DatabaseMetaData('testDatabase', 'Test Database');
        testDatabase.tables = [testTable];

        expect(component.meta.database).toEqual(testDatabase);
        expect(component.meta.table).toEqual(testTable);
        expect(component.meta.databases.length).toBe(1);
        expect(component.meta.databases[0]).toEqual(testDatabase);
        expect(component.meta.tables.length).toBe(1);
        expect(component.meta.tables[0]).toEqual(testTable);
        expect(component.meta.fields.length).toBe(2);
        expect(component.meta.fields[0]).toEqual(testIdField);
        expect(component.meta.fields[1]).toEqual(testLinkField);
    }));

    it('has expected active properties', (() => {
        expect(component.active).toEqual({
            allowsTranslations: true,
            errorMessage: '',
            id: 'testId',
            idField: new FieldMetaData('testIdField', 'Test ID Field'),
            linkField: new FieldMetaData('testLinkField', 'Test Link Field'),
            textColor: '#111',
            wikiName: '',
            wikiText: ''
        });
    }));

    it('returns expected options from config', (() => {
        expect(component.getOptionFromConfig('database')).toBe('testDatabase');
        expect(component.getOptionFromConfig('id')).toBe('testId');
        expect(component.getOptionFromConfig('idField')).toBe('testIdField');
        expect(component.getOptionFromConfig('linkField')).toBe('testLinkField');
        expect(component.getOptionFromConfig('table')).toBe('testTable');
        expect(component.getOptionFromConfig('title')).toBe('Test Title');
    }));

    it('sets expected fields in onUpdateFields to fields from config', (() => {
        component.onUpdateFields();
        expect(component.active.idField).toEqual(new FieldMetaData('testIdField', 'Test ID Field'));
        expect(component.active.linkField).toEqual(new FieldMetaData('testLinkField', 'Test Link Field'));
    }));

    it('shows header in toolbar that shows title from config', (() => {
        fixture.detectChanges();
        let header = fixture.debugElement.query(By.css('mat-sidenav-container mat-toolbar .header'));
        expect(header).not.toBeNull();
        expect(header.nativeElement.textContent).toBe('Test Title');
    }));

    it('shows selects in sidenav options menu that have expected options', (() => {
        let testIdField = new FieldMetaData('testIdField', 'Test ID Field');
        let testLinkField = new FieldMetaData('testLinkField', 'Test Link Field');
        let testTable = new TableMetaData('testTable', 'Test Table', [testIdField, testLinkField]);
        let testDatabase = new DatabaseMetaData('testDatabase', 'Test Database');
        testDatabase.tables = [testTable];

        fixture.detectChanges();

        let selects = fixture.debugElement.queryAll(By.css('mat-sidenav-container mat-sidenav mat-card mat-card-content mat-select'));
        expect(selects.length).toBe(4);

        expect(selects[0].componentInstance.disabled).toBe(true);
        expect(selects[0].nativeElement.textContent).toBe('Database');
        expect(selects[0].componentInstance.options.toArray().length).toBe(1);
        expect(selects[0].componentInstance.options.toArray()[0].value).toEqual(testDatabase);

        expect(selects[1].componentInstance.disabled).toBe(true);
        expect(selects[1].nativeElement.textContent).toBe('Table');
        expect(selects[1].componentInstance.options.toArray().length).toBe(1);
        expect(selects[1].componentInstance.options.toArray()[0].value).toEqual(testTable);

        expect(selects[2].componentInstance.disabled).toBe(false);
        expect(selects[2].nativeElement.textContent).toBe('ID Field');
        expect(selects[2].componentInstance.options.toArray().length).toBe(2);
        expect(selects[2].componentInstance.options.toArray()[0].value).toEqual(testIdField);
        expect(selects[2].componentInstance.options.toArray()[1].value).toEqual(testLinkField);

        expect(selects[3].componentInstance.disabled).toBe(false);
        expect(selects[3].nativeElement.textContent).toBe('Link Field');
        expect(selects[3].componentInstance.options.toArray().length).toBe(2);
        expect(selects[3].componentInstance.options.toArray()[0].value).toEqual(testIdField);
        expect(selects[3].componentInstance.options.toArray()[1].value).toEqual(testLinkField);

        // TODO How can we test the selected values?
    }));
});
