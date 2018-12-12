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
import { async, ComponentFixture, fakeAsync, inject, TestBed, tick } from '@angular/core/testing';
import { DatabaseMetaData, FieldMetaData, TableMetaData } from '../../dataset';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Injector } from '@angular/core';
import { NeonGTDConfig } from '../../neon-gtd-config';
import { neonVariables } from '../../neon-namespaces';

import {} from 'jasmine-core';
import * as neon from 'neon-framework';

import { ExportControlComponent } from '../export-control/export-control.component';
import { UnsharedFilterComponent } from '../unshared-filter/unshared-filter.component';
import { ThumbnailGridComponent } from './thumbnail-grid.component';

import { ConnectionService } from '../../services/connection.service';
import { DatasetService } from '../../services/dataset.service';
import { FilterService } from '../../services/filter.service';
import { DatasetServiceMock } from '../../../testUtils/MockServices/DatasetServiceMock';
import { FilterServiceMock } from '../../../testUtils/MockServices/FilterServiceMock';
import { initializeTestBed } from '../../../testUtils/initializeTestBed';
import { MatAutocompleteModule } from '@angular/material';
import { ThumbnailDetailsContractedComponent, ThumbnailDetailsExpandedComponent } from './thumbnail-details.component';

let validateSelect = (element: any, name: string, required: boolean = false, disabled: boolean = false) => {
    expect(element.componentInstance.disabled).toEqual(disabled);
    expect(element.componentInstance.placeholder).toEqual(name);
    expect(element.componentInstance.required).toEqual(required);
};

let validateSelectFields = (element: any, required: boolean = false, selected: string = '') => {
    let options = element.componentInstance.options.toArray();
    expect(options.length).toEqual(DatasetServiceMock.FIELDS.length + (required ? 0 : 1));
    if (!required) {
        expect(options[0].getLabel()).toEqual('(None)');
    }
    for (let i = 0; i < DatasetServiceMock.FIELDS.length; ++i) {
        let index = (required ? i : (i + 1));
        expect(options[index].getLabel()).toEqual(DatasetServiceMock.FIELDS[i].prettyName);
        expect(options[index].selected).toEqual(selected ? (DatasetServiceMock.FIELDS[i].columnName === selected) : false);
    }
};

let validateToggle = (element: any, value: any, content: string, checked: boolean) => {
    expect(element.componentInstance.value).toEqual(value);
    expect(element.nativeElement.textContent).toContain(content);
    expect(element.nativeElement.classList.contains('mat-button-toggle-checked')).toEqual(checked);
};

describe('Component: ThumbnailGrid', () => {
    let component: ThumbnailGridComponent;
    let fixture: ComponentFixture<ThumbnailGridComponent>;
    let getService = (type: any) => fixture.debugElement.injector.get(type);

    initializeTestBed({
        declarations: [
            ThumbnailDetailsContractedComponent,
            ThumbnailDetailsExpandedComponent,
            ThumbnailGridComponent,
            ExportControlComponent,
            UnsharedFilterComponent
        ],
        providers: [
            ConnectionService,
            { provide: DatasetService, useClass: DatasetServiceMock },
            { provide: FilterService, useClass: FilterServiceMock },
            Injector,
            { provide: 'config', useValue: new NeonGTDConfig() }
        ],
        imports: [
            AppMaterialModule,
            BrowserAnimationsModule,
            FormsModule,
            MatAutocompleteModule,
            ReactiveFormsModule
        ]
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(ThumbnailGridComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('does have expected class options properties', () => {
        expect(component.options.border).toEqual('');
        expect(component.options.borderCompareValue).toEqual('');
        expect(component.options.borderPercentThreshold).toEqual(0.5);
        expect(component.options.cropAndScale).toEqual('');
        expect(component.options.defaultLabel).toEqual('');
        expect(component.options.defaultPercent).toEqual('');
        expect(component.options.id).toEqual('');
        expect(component.options.ignoreSelf).toEqual(false);
        expect(component.options.linkPrefix).toEqual('');
        expect(component.options.openOnMouseClick).toEqual(true);
        expect(component.options.sortDescending).toEqual(false);
        expect(component.options.textMap).toEqual({});
        expect(component.options.typeMap).toEqual({});

        expect(component.options.categoryField).toEqual(new FieldMetaData());
        expect(component.options.compareField).toEqual(new FieldMetaData());
        expect(component.options.filterField).toEqual(new FieldMetaData());
        expect(component.options.idField).toEqual(new FieldMetaData());
        expect(component.options.linkField).toEqual(new FieldMetaData());
        expect(component.options.nameField).toEqual(new FieldMetaData());
        expect(component.options.objectIdField).toEqual(new FieldMetaData());
        expect(component.options.objectNameField).toEqual(new FieldMetaData());
        expect(component.options.percentField).toEqual(new FieldMetaData());
        expect(component.options.predictedNameField).toEqual(new FieldMetaData());
        expect(component.options.sortField).toEqual(new FieldMetaData());
        expect(component.options.typeField).toEqual(new FieldMetaData());

        expect(component.headerText).toBeDefined();
        expect(component.infoText).toBeDefined();
        expect(component.thumbnailGrid).toBeDefined();
        expect(component.visualization).toBeDefined();
    });

    it('does have expected class properties', () => {
        expect(component.gridArray).toEqual([]);
        expect(component.filters).toEqual([]);
        expect(component.loadingCount).toEqual(0);
        expect(component.lastPage).toEqual(true);
        expect(component.mediaTypes).toEqual({
            image: 'img',
            video: 'vid',
            html: 'htm',
            pdf: 'pdf',
            audio: 'aud',
            maskImage: 'mask'
        });
        expect(component.page).toEqual(1);
        expect(component.pagingGrid).toEqual([]);
    });

    it('does show toolbar and sidenav', () => {
        let container = fixture.debugElement.query(By.css('mat-sidenav-container'));
        expect(container).not.toBeNull();
        let toolbar = fixture.debugElement.query(By.css('mat-sidenav-container mat-toolbar'));
        expect(toolbar).not.toBeNull();
        let sidenav = fixture.debugElement.query(By.css('mat-sidenav-container mat-sidenav'));
        expect(sidenav).not.toBeNull();
    });

    it('does show header in toolbar with visualization title', () => {
        let header = fixture.debugElement.query(By.css('mat-sidenav-container mat-toolbar .header'));
        expect(header).not.toBeNull();
        expect(header.nativeElement.textContent).toContain('Thumbnail Grid');
    });

    it('does show data-info and hide error-message in toolbar and sidenav if errorMessage is undefined', () => {
        let dataInfoTextInToolbar = fixture.debugElement.query(By.css('mat-sidenav-container mat-toolbar .data-info'));
        expect(dataInfoTextInToolbar).not.toBeNull();
        expect(dataInfoTextInToolbar.nativeElement.textContent).toContain('0 Files');

        let dataInfoIconInSidenav = fixture.debugElement.query(By.css('mat-sidenav-container mat-sidenav .data-info mat-icon'));
        expect(dataInfoIconInSidenav).not.toBeNull();
        expect(dataInfoIconInSidenav.nativeElement.textContent).toEqual('info');

        let dataInfoTextInSidenav = fixture.debugElement.query(By.css('mat-sidenav-container mat-sidenav .data-info span'));
        expect(dataInfoTextInSidenav).not.toBeNull();
        expect(dataInfoTextInSidenav.nativeElement.textContent).toContain('0 Files');

        let errorMessageInToolbar = fixture.debugElement.query(By.css('mat-sidenav-container mat-toolbar .error-message'));
        expect(errorMessageInToolbar).toBeNull();

        let errorIconInSidenav = fixture.debugElement.query(By.css('mat-sidenav-container mat-sidenav .error-message mat-icon'));
        expect(errorIconInSidenav).toBeNull();

        let errorMessageInSidenav = fixture.debugElement.query(By.css('mat-sidenav-container mat-sidenav .error-message span'));
        expect(errorMessageInSidenav).toBeNull();
    });

    it('does show error-message in toolbar and sidenav if errorMessage is defined', async(() => {
        component.errorMessage = 'Test Error Message';

        // Force the component to update all its ngFor and ngIf elements.
        fixture.detectChanges();
        fixture.whenStable().then(() => {
            fixture.detectChanges();

            let dataInfoTextInToolbar = fixture.debugElement.query(By.css('mat-sidenav-container mat-toolbar .data-info'));
            expect(dataInfoTextInToolbar).toBeNull();

            let dataInfoIconInSidenav = fixture.debugElement.query(By.css('mat-sidenav-container mat-sidenav .data-info mat-icon'));
            expect(dataInfoIconInSidenav).not.toBeNull();
            expect(dataInfoIconInSidenav.nativeElement.textContent).toEqual('info');

            let dataInfoTextInSidenav = fixture.debugElement.query(By.css('mat-sidenav-container mat-sidenav .data-info span'));
            expect(dataInfoTextInSidenav).not.toBeNull();
            expect(dataInfoTextInSidenav.nativeElement.textContent).toContain('0 Files');

            let errorMessageInToolbar = fixture.debugElement.query(By.css('mat-sidenav-container mat-toolbar .error-message'));
            expect(errorMessageInToolbar).not.toBeNull();
            expect(errorMessageInToolbar.nativeElement.textContent).toContain('Test Error Message');

            let errorIconInSidenav = fixture.debugElement.query(By.css('mat-sidenav-container mat-sidenav .error-message mat-icon'));
            expect(errorIconInSidenav).not.toBeNull();
            expect(errorIconInSidenav.nativeElement.textContent).toEqual('error');

            let errorMessageInSidenav = fixture.debugElement.query(By.css('mat-sidenav-container mat-sidenav .error-message span'));
            expect(errorMessageInSidenav).not.toBeNull();
            expect(errorMessageInSidenav.nativeElement.textContent).toContain('Test Error Message');
        });
    }));

    it('does show settings icon button in toolbar', () => {
        let button = fixture.debugElement.query(By.css('mat-sidenav-container mat-toolbar button'));

        let icon = fixture.debugElement.query(By.css('mat-sidenav-container mat-toolbar button mat-icon'));
        expect(icon.nativeElement.textContent).toEqual('settings');
    });

    it('does show sidenav options menu', () => {
        let menu = fixture.debugElement.query(By.css('mat-sidenav-container mat-sidenav mat-card'));
        expect(menu).not.toBeNull();

        let content = fixture.debugElement.query(By.css('mat-sidenav-container mat-sidenav mat-card mat-card-content'));
        expect(content).not.toBeNull();
    });

    it('does show elements in sidenav options menu that have expected options', async(() => {
        // Force the component to update all its selected elements.
        fixture.detectChanges();
        fixture.whenStable().then(() => {
            fixture.detectChanges();

            let inputs = fixture.debugElement.queryAll(
                By.css('mat-sidenav-container mat-sidenav mat-card mat-card-content mat-form-field input'));
            expect(inputs.length).toEqual(4);

            expect(inputs[0].attributes.placeholder).toBe('Title');
            expect(inputs[0].nativeElement.value).toContain('Thumbnail Grid');

            expect(inputs[1].attributes.placeholder).toBe('Thumbnail Limit');
            expect(inputs[1].nativeElement.value).toContain('30');

            expect(inputs[2].attributes.placeholder).toBe('Link Prefix');
            expect(inputs[2].nativeElement.value).toEqual('');

            let selects = fixture.debugElement.queryAll(
                By.css('mat-sidenav-container mat-sidenav mat-card mat-card-content mat-form-field mat-select'));
            expect(selects.length).toEqual(14);

            validateSelect(selects[0], 'Database', true);
            let databaseOptions = selects[0].componentInstance.options.toArray();
            expect(databaseOptions.length).toEqual(2);
            expect(databaseOptions[0].getLabel()).toEqual('Test Database 1');
            expect(databaseOptions[0].selected).toEqual(true);
            expect(databaseOptions[1].getLabel()).toEqual('Test Database 2');
            expect(databaseOptions[1].selected).toEqual(false);

            validateSelect(selects[1], 'Table', true);
            let tableOptions = selects[1].componentInstance.options.toArray();
            expect(tableOptions.length).toEqual(2);
            expect(tableOptions[0].getLabel()).toEqual('Test Table 1');
            expect(tableOptions[0].selected).toEqual(true);
            expect(tableOptions[1].getLabel()).toEqual('Test Table 2');
            expect(tableOptions[1].selected).toEqual(false);

            validateSelect(selects[2], 'Name Field', false);
            validateSelectFields(selects[2], false);

            validateSelect(selects[3], 'Actual Name Field', false);
            validateSelectFields(selects[3], false);

            validateSelect(selects[4], 'Predicted Name Field', false);
            validateSelectFields(selects[4], false);

            validateSelect(selects[5], 'Predicted Probability Field', false);
            validateSelectFields(selects[5], false);

            validateSelect(selects[6], 'Category Field', false);
            validateSelectFields(selects[6], false);

            validateSelect(selects[7], 'Comparison Field', false);
            validateSelectFields(selects[7], false);

            validateSelect(selects[8], 'Filter Field', false);
            validateSelectFields(selects[8], false);

            validateSelect(selects[9], 'ID Field', false);
            validateSelectFields(selects[9], false);

            validateSelect(selects[10], 'Link Field', true);
            validateSelectFields(selects[10], true);

            validateSelect(selects[11], 'Sort Field', true);
            validateSelectFields(selects[11], true);

            validateSelect(selects[12], 'Type Field', false);
            validateSelectFields(selects[12], false);

            let toggles = fixture.debugElement.queryAll(
                By.css('mat-sidenav-container mat-sidenav mat-card mat-card-content mat-button-toggle'));
            expect(toggles.length).toEqual(10);

            validateToggle(toggles[0], '', 'None', true);
            validateToggle(toggles[1], 'scale', 'Scale', false);
            validateToggle(toggles[2], 'crop', 'Crop', false);
            validateToggle(toggles[3], 'both', 'Both', false);
            validateToggle(toggles[4], true, 'Yes', false);
            validateToggle(toggles[5], false, 'No', true);
            validateToggle(toggles[6], true, 'Yes', true);
            validateToggle(toggles[7], false, 'No', false);
            validateToggle(toggles[8], false, 'Ascending', true);
            validateToggle(toggles[9], true, 'Descending', false);
        });
    }));

    it('does show unshared filter in sidenav options menu', () => {
        let unsharedFilter = fixture.debugElement.query(By.css(
            'mat-sidenav-container mat-sidenav mat-card mat-card-content app-unshared-filter'));
        expect(unsharedFilter).not.toBeNull();
        expect(unsharedFilter.componentInstance.meta).toEqual(component.options);
        expect(unsharedFilter.componentInstance.unsharedFilterChanged).toBeDefined();
        expect(unsharedFilter.componentInstance.unsharedFilterRemoved).toBeDefined();
    });

    it('does show export control in sidenav options menu', () => {
        let exportControl = fixture.debugElement.query(By.css(
            'mat-sidenav-container mat-sidenav mat-card mat-card-content app-export-control'));
        expect(exportControl).not.toBeNull();
    });

    it('does hide loading overlay by default', () => {
        let hiddenLoadingOverlay = fixture.debugElement.query(By.css('mat-sidenav-container .not-loading-overlay'));
        expect(hiddenLoadingOverlay).not.toBeNull();

        let hiddenSpinner = fixture.debugElement.query(By.css('mat-sidenav-container .not-loading-overlay mat-spinner'));
        expect(hiddenSpinner).not.toBeNull();
    });

    it('does show loading overlay if loadingCount is positive', async(() => {
        component.loadingCount = 1;

        // Force the component to update all its ngFor and ngIf elements.
        fixture.detectChanges();
        fixture.whenStable().then(() => {
            fixture.detectChanges();

            let loadingOverlay = fixture.debugElement.query(By.css('mat-sidenav-container .loading-overlay'));
            expect(loadingOverlay).not.toBeNull();

            let spinner = fixture.debugElement.query(By.css('mat-sidenav-container .loading-overlay mat-spinner'));
            expect(spinner).not.toBeNull();
        });
    }));

    it('does not show filter-container if filters is empty array', () => {
        let filterContainer = fixture.debugElement.query(By.css('mat-sidenav-container .filter-container'));
        expect(filterContainer).toBeNull();

        let bodyContainer = fixture.debugElement.query(By.css('mat-sidenav-container .body-container.with-filter'));
        expect(bodyContainer).toBeNull();
    });

    it('does show filter-container and filter-reset elements if filters is non-empty array', async(() => {
        component.filters = [{
            id: 'idA',
            field: 'field1',
            prettyField: 'prettyField1',
            value: 'value1'
        }, {
            id: 'idB',
            field: 'field2',
            prettyField: 'prettyField2',
            value: 'value2'
        }];

        // Force the component to update all its ngFor and ngIf elements.
        fixture.detectChanges();
        fixture.whenStable().then(() => {
            fixture.detectChanges();

            let filterContainer = fixture.debugElement.query(By.css('mat-sidenav-container .filter-container'));
            expect(filterContainer).not.toBeNull();

            let bodyContainer = fixture.debugElement.query(By.css('mat-sidenav-container .body-container.with-filter'));
            expect(bodyContainer).not.toBeNull();

            let filterResets = fixture.debugElement.queryAll(By.css('mat-sidenav-container .filter-container .filter-reset'));
            expect(filterResets.length).toEqual(2);

            let filterLabels = fixture.debugElement.queryAll(By.css('mat-sidenav-container .filter-container .filter-label'));
            expect(filterLabels.length).toEqual(2);

            expect(filterLabels[0].nativeElement.textContent).toContain('value1');
            expect(filterLabels[1].nativeElement.textContent).toContain('value2');

            let filterButtons = fixture.debugElement.queryAll(By.css('mat-sidenav-container .filter-container button'));
            expect(filterButtons.length).toEqual(2);

            let filterIcons = fixture.debugElement.queryAll(By.css('mat-sidenav-container .filter-container button mat-icon'));
            expect(filterIcons.length).toEqual(2);

            expect(filterIcons[0].nativeElement.textContent).toEqual('close');
            expect(filterIcons[1].nativeElement.textContent).toEqual('close');
        });
    }));

    it('does show body-container', () => {
        let bodyContainer = fixture.debugElement.query(By.css('mat-sidenav-container .body-container'));
        expect(bodyContainer).not.toBeNull();
    });

    it('does not show thumbnail-grid-div elements if pagingGrid is empty array', () => {
        let elements = fixture.debugElement.queryAll(By.css('mat-sidenav-container .body-container .thumbnail-grid-div'));
        expect(elements.length).toEqual(0);
    });

    it('does show thumbnail-grid-div elements if pagingGrid is non-empty array', async(() => {
        component.options.linkField = new FieldMetaData('testLinkField', 'Test Link Field');
        component.options.nameField = new FieldMetaData('testNameField', 'Test Name Field');
        component.options.objectIdField = new FieldMetaData('testObjectIdField', 'Test Object ID Field');
        component.options.objectNameField = new FieldMetaData('testObjectNameField', 'Test Object Name Field');
        component.options.percentField = new FieldMetaData('testPercentField', 'Test Percent Field');
        component.options.predictedNameField = new FieldMetaData('testPredictedNameField', 'Test Predicted Name Field');

        component.pagingGrid = [{
            testLinkField: 'link1',
            testNameField: 'name1',
            testObjectIdField: 'objectId1',
            testObjectNameField: 'objectName1',
            testPercentField: 0.1,
            testPredictedNameField: 'predictedName1'
        }, {
            testLinkField: 'link2',
            testNameField: 'name2',
            testObjectIdField: 'objectId2',
            testObjectNameField: 'objectName2',
            testPercentField: 0.2,
            testPredictedNameField: 'predictedName2'
        }];

        // Force the component to update all its ngFor and ngIf elements.
        fixture.detectChanges();
        fixture.whenStable().then(() => {
            fixture.detectChanges();

            let elements = fixture.debugElement.queryAll(By.css('mat-sidenav-container .body-container .thumbnail-grid-div'));
            expect(elements.length).toEqual(2);

            expect(elements[0].nativeElement.classList.contains('with-text')).toEqual(true);
            expect(elements[0].nativeElement.classList.contains('selected')).toEqual(false);

            expect(elements[1].nativeElement.classList.contains('with-text')).toEqual(true);
            expect(elements[1].nativeElement.classList.contains('selected')).toEqual(false);

            let detailElements = fixture.debugElement.queryAll(By.css(
                'mat-sidenav-container .body-container .thumbnail-grid-div .thumbnail-details'));
            expect(detailElements.length).toEqual(2);

            let ellipsesElements = fixture.debugElement.queryAll(By.css(
                'mat-sidenav-container .body-container .thumbnail-grid-div .thumbnail-details .detail-ellipses'));
            expect(ellipsesElements.length).toEqual(2);

            expect(ellipsesElements[0].nativeElement.textContent).toEqual('predictedName1');
            expect(ellipsesElements[1].nativeElement.textContent).toEqual('predictedName2');

            let percentageElements = fixture.debugElement.queryAll(By.css(
                'mat-sidenav-container .body-container .thumbnail-grid-div .thumbnail-details .detail-percentage'));
            expect(percentageElements.length).toEqual(2);

            expect(percentageElements[0].nativeElement.textContent).toEqual('10%');
            expect(percentageElements[1].nativeElement.textContent).toEqual('20%');

            let canvasElements = fixture.debugElement.queryAll(By.css(
                'mat-sidenav-container .body-container .thumbnail-grid-div .thumbnail-view'));
            expect(canvasElements.length).toEqual(2);
        });
    }));

    it('does not show footer-container or pagination-button elements if pagingGrid.length === gridArray.length', () => {
        let footerContainer = fixture.debugElement.query(By.css('mat-sidenav-container .footer'));
        expect(footerContainer).toBeNull();

        let bodyContainer = fixture.debugElement.query(By.css('mat-sidenav-container .body-container.with-footer'));
        expect(bodyContainer).toBeNull();
    });

    it('does show footer-container and pagination-button elements if pagingGrid.length < gridArray.length (first page)', async(() => {
        component.pagingGrid = [{}];
        component.gridArray = [{}, {}, {}];
        component.lastPage = false;
        component.page = 1;

        // Force the component to update all its ngFor and ngIf elements.
        fixture.detectChanges();
        fixture.whenStable().then(() => {
            fixture.detectChanges();

            let footerContainer = fixture.debugElement.query(By.css('mat-sidenav-container .footer'));
            expect(footerContainer).not.toBeNull();

            let bodyContainer = fixture.debugElement.query(By.css('mat-sidenav-container .body-container.with-footer'));
            expect(bodyContainer).not.toBeNull();

            let footerButtons = fixture.debugElement.queryAll(By.css(
                'mat-sidenav-container .footer .footer-button-container .pagination-button'));
            expect(footerButtons.length).toEqual(2);

            expect(footerButtons[0].componentInstance.disabled).toEqual(true);
            expect(footerButtons[0].nativeElement.textContent).toContain('Previous');

            expect(footerButtons[1].componentInstance.disabled).toEqual(false);
            expect(footerButtons[1].nativeElement.textContent).toContain('Next');
        });
    }));

    it('does show footer-container and pagination-button elements if pagingGrid.length < gridArray.length (middle page)', async(() => {
        component.pagingGrid = [{}];
        component.gridArray = [{}, {}, {}];
        component.lastPage = false;
        component.page = 2;

        // Force the component to update all its ngFor and ngIf elements.
        fixture.detectChanges();
        fixture.whenStable().then(() => {
            fixture.detectChanges();

            let footerContainer = fixture.debugElement.query(By.css('mat-sidenav-container .footer'));
            expect(footerContainer).not.toBeNull();

            let bodyContainer = fixture.debugElement.query(By.css('mat-sidenav-container .body-container.with-footer'));
            expect(bodyContainer).not.toBeNull();

            let footerButtons = fixture.debugElement.queryAll(By.css(
                'mat-sidenav-container .footer .footer-button-container .pagination-button'));
            expect(footerButtons.length).toEqual(2);

            expect(footerButtons[0].componentInstance.disabled).toEqual(false);
            expect(footerButtons[0].nativeElement.textContent).toContain('Previous');

            expect(footerButtons[1].componentInstance.disabled).toEqual(false);
            expect(footerButtons[1].nativeElement.textContent).toContain('Next');
        });
    }));

    it('does show footer-container and pagination-button elements if pagingGrid.length < gridArray.length (last page)', async(() => {
        component.pagingGrid = [{}];
        component.gridArray = [{}, {}, {}];
        component.lastPage = true;
        component.page = 3;

        // Force the component to update all its ngFor and ngIf elements.
        fixture.detectChanges();
        fixture.whenStable().then(() => {
            fixture.detectChanges();

            let footerContainer = fixture.debugElement.query(By.css('mat-sidenav-container .footer'));
            expect(footerContainer).not.toBeNull();

            let bodyContainer = fixture.debugElement.query(By.css('mat-sidenav-container .body-container.with-footer'));
            expect(bodyContainer).not.toBeNull();

            let footerButtons = fixture.debugElement.queryAll(By.css(
                'mat-sidenav-container .footer .footer-button-container .pagination-button'));
            expect(footerButtons.length).toEqual(2);

            expect(footerButtons[0].componentInstance.disabled).toEqual(false);
            expect(footerButtons[0].nativeElement.textContent).toContain('Previous');

            expect(footerButtons[1].componentInstance.disabled).toEqual(true);
            expect(footerButtons[1].nativeElement.textContent).toContain('Next');
        });
    }));

    it('createFilter does nothing if filterField is empty', () => {
        let spy1 = spyOn(component, 'addNeonFilter');
        let spy2 = spyOn(component, 'replaceNeonFilter');
        let spy3 = spyOn(component, 'removeAllFilters');

        component.createFilter('test text');

        expect(spy1.calls.count()).toEqual(0);
        expect(spy2.calls.count()).toEqual(0);
        expect(spy3.calls.count()).toEqual(0);
    });

    it('createFilter with no existing filters does add a new filter', () => {
        let spy1 = spyOn(component, 'addNeonFilter');
        let spy2 = spyOn(component, 'replaceNeonFilter');
        let spy3 = spyOn(component, 'removeAllFilters');

        component.options.filterField = new FieldMetaData('testFilterField', 'Test Filter Field');
        component.options.ignoreSelf = false;

        component.createFilter('test text');

        expect(component.filters).toEqual([{
            id: undefined,
            field: 'testFilterField',
            prettyField: 'Test Filter Field',
            value: 'test text'
        }]);

        expect(spy1.calls.count()).toEqual(1);
        expect(spy1.calls.argsFor(0)).toEqual([component.options, true, {
            id: undefined,
            field: 'testFilterField',
            prettyField: 'Test Filter Field',
            value: 'test text'
        }, neon.query.where('testFilterField', '=', 'test text')]);
        expect(spy2.calls.count()).toEqual(0);
        expect(spy3.calls.count()).toEqual(0);
    });

    it('createFilter with ignoreSelf=true and no existing filters does not query', () => {
        let spy1 = spyOn(component, 'addNeonFilter');
        let spy2 = spyOn(component, 'replaceNeonFilter');
        let spy3 = spyOn(component, 'removeAllFilters');

        component.options.filterField = new FieldMetaData('testFilterField', 'Test Filter Field');
        component.options.ignoreSelf = true;

        component.createFilter('test text');

        expect(component.filters).toEqual([{
            id: undefined,
            field: 'testFilterField',
            prettyField: 'Test Filter Field',
            value: 'test text'
        }]);

        expect(spy1.calls.count()).toEqual(1);
        expect(spy1.calls.argsFor(0)).toEqual([component.options, false, {
            id: undefined,
            field: 'testFilterField',
            prettyField: 'Test Filter Field',
            value: 'test text'
        }, neon.query.where('testFilterField', '=', 'test text')]);
        expect(spy2.calls.count()).toEqual(0);
        expect(spy3.calls.count()).toEqual(0);
    });

    it('createFilter with one existing filter does replace an existing filter', () => {
        let spy1 = spyOn(component, 'addNeonFilter');
        let spy2 = spyOn(component, 'replaceNeonFilter');
        let spy3 = spyOn(component, 'removeAllFilters');

        component.options.filterField = new FieldMetaData('testFilterField', 'Test Filter Field');
        component.options.ignoreSelf = false;
        component.filters = [{
            id: 'idA',
            field: 'field1',
            prettyField: 'prettyField1',
            value: 'value1'
        }];

        component.createFilter('test text');

        expect(component.filters).toEqual([{
            id: 'idA',
            field: 'testFilterField',
            prettyField: 'Test Filter Field',
            value: 'test text'
        }]);

        expect(spy1.calls.count()).toEqual(0);
        expect(spy2.calls.count()).toEqual(1);
        expect(spy2.calls.argsFor(0)).toEqual([component.options, true, {
            id: 'idA',
            field: 'testFilterField',
            prettyField: 'Test Filter Field',
            value: 'test text'
        }, neon.query.where('testFilterField', '=', 'test text')]);
        expect(spy3.calls.count()).toEqual(0);
    });

    it('createFilter with ignoreSelf=true and one existing filter does not query', () => {
        let spy1 = spyOn(component, 'addNeonFilter');
        let spy2 = spyOn(component, 'replaceNeonFilter');
        let spy3 = spyOn(component, 'removeAllFilters');

        component.options.filterField = new FieldMetaData('testFilterField', 'Test Filter Field');
        component.options.ignoreSelf = true;
        component.filters = [{
            id: 'idA',
            field: 'field1',
            prettyField: 'prettyField1',
            value: 'value1'
        }];

        component.createFilter('test text');

        expect(component.filters).toEqual([{
            id: 'idA',
            field: 'testFilterField',
            prettyField: 'Test Filter Field',
            value: 'test text'
        }]);

        expect(spy1.calls.count()).toEqual(0);
        expect(spy2.calls.count()).toEqual(1);
        expect(spy2.calls.argsFor(0)).toEqual([component.options, false, {
            id: 'idA',
            field: 'testFilterField',
            prettyField: 'Test Filter Field',
            value: 'test text'
        }, neon.query.where('testFilterField', '=', 'test text')]);
        expect(spy3.calls.count()).toEqual(0);
    });

    it('createFilter with multiple existing filters does remove all filters and then add a new filter', () => {
        let spy1 = spyOn(component, 'addNeonFilter');
        let spy2 = spyOn(component, 'replaceNeonFilter');
        let spy3 = spyOn(component, 'removeAllFilters');

        component.options.filterField = new FieldMetaData('testFilterField', 'Test Filter Field');
        component.options.ignoreSelf = false;
        component.filters = [{
            id: 'idA',
            field: 'field1',
            prettyField: 'prettyField1',
            value: 'value1'
        }, {
            id: 'idB',
            field: 'field2',
            prettyField: 'prettyField2',
            value: 'value2'
        }];

        component.createFilter('test text');

        expect(spy1.calls.count()).toEqual(0);
        expect(spy2.calls.count()).toEqual(0);
        expect(spy3.calls.count()).toEqual(1);
        let args = spy3.calls.argsFor(0);
        expect(args[0]).toEqual(component.options);
        expect(args[1]).toEqual([{
            id: 'idA',
            field: 'field1',
            prettyField: 'prettyField1',
            value: 'value1'
        }, {
            id: 'idB',
            field: 'field2',
            prettyField: 'prettyField2',
            value: 'value2'
        }]);

        // Run the callback.
        expect(typeof args[2]).toEqual('function');
        args[2]();

        expect(component.filters).toEqual([{
            id: undefined,
            field: 'testFilterField',
            prettyField: 'Test Filter Field',
            value: 'test text'
        }]);

        expect(spy1.calls.count()).toEqual(1);
        expect(spy1.calls.argsFor(0)).toEqual([component.options, true, {
            id: undefined,
            field: 'testFilterField',
            prettyField: 'Test Filter Field',
            value: 'test text'
        }, neon.query.where('testFilterField', '=', 'test text')]);
        expect(spy2.calls.count()).toEqual(0);
        expect(spy3.calls.count()).toEqual(1);
    });

    it('createFilter with ignoreSelf=true and multiple existing filters does not query', () => {
        let spy1 = spyOn(component, 'addNeonFilter');
        let spy2 = spyOn(component, 'replaceNeonFilter');
        let spy3 = spyOn(component, 'removeAllFilters');

        component.options.filterField = new FieldMetaData('testFilterField', 'Test Filter Field');
        component.options.ignoreSelf = true;
        component.filters = [{
            id: 'idA',
            field: 'field1',
            prettyField: 'prettyField1',
            value: 'value1'
        }, {
            id: 'idB',
            field: 'field2',
            prettyField: 'prettyField2',
            value: 'value2'
        }];

        component.createFilter('test text');

        expect(spy1.calls.count()).toEqual(0);
        expect(spy2.calls.count()).toEqual(0);
        expect(spy3.calls.count()).toEqual(1);
        let args = spy3.calls.argsFor(0);
        expect(args[0]).toEqual(component.options);
        expect(args[1]).toEqual([{
            id: 'idA',
            field: 'field1',
            prettyField: 'prettyField1',
            value: 'value1'
        }, {
            id: 'idB',
            field: 'field2',
            prettyField: 'prettyField2',
            value: 'value2'
        }]);

        // Run the callback.
        expect(typeof args[2]).toEqual('function');
        args[2]();

        expect(component.filters).toEqual([{
            id: undefined,
            field: 'testFilterField',
            prettyField: 'Test Filter Field',
            value: 'test text'
        }]);

        expect(spy1.calls.count()).toEqual(1);
        expect(spy1.calls.argsFor(0)).toEqual([component.options, false, {
            id: undefined,
            field: 'testFilterField',
            prettyField: 'Test Filter Field',
            value: 'test text'
        }, neon.query.where('testFilterField', '=', 'test text')]);
        expect(spy2.calls.count()).toEqual(0);
        expect(spy3.calls.count()).toEqual(1);
    });

    it('createQuery does return expected query', () => {
        component.options.database = DatasetServiceMock.DATABASES[0];
        component.options.table = DatasetServiceMock.TABLES[0];
        component.options.linkField = new FieldMetaData('testLinkField', 'Test Link Field');
        component.options.sortField = new FieldMetaData('testSortField', 'Test Sort Field');

        let fields = ['testLinkField', 'testSortField'];

        let wherePredicate = neon.query.and.apply(neon.query, [
            neon.query.where('testLinkField', '!=', null),
            neon.query.where('testLinkField', '!=', '')
        ]);

        expect(component.createQuery(component.options)).toEqual(new neon.query.Query()
            .selectFrom(component.options.database.name, component.options.table.name)
            .withFields(fields)
            .where(wherePredicate)
            .sortBy('testSortField', neonVariables.ASCENDING));

        component.options.categoryField = new FieldMetaData('testCategoryField', 'Test Category Field');
        component.options.compareField = new FieldMetaData('testCompareField', 'Test Compare Field');
        component.options.filterField = new FieldMetaData('testFilterField', 'Test Filter Field');
        component.options.idField = new FieldMetaData('testIdField', 'Test ID Field');
        component.options.nameField = new FieldMetaData('testNameField', 'Test Name Field');
        component.options.objectIdField = new FieldMetaData('testObjectIdField', 'Test Object ID Field');
        component.options.objectNameField = new FieldMetaData('testObjectNameField', 'Test Object Name Field');
        component.options.percentField = new FieldMetaData('testPercentField', 'Test Percent Field');
        component.options.predictedNameField = new FieldMetaData('testPredictedNameField', 'Test Predicted Name Field');
        component.options.typeField = new FieldMetaData('testTypeField', 'Test Type Field');
        component.options.sortDescending = true;

        fields = ['testLinkField', 'testSortField', 'testCategoryField', 'testCompareField', 'testFilterField', 'testIdField',
            'testNameField', 'testObjectIdField', 'testObjectNameField', 'testPercentField', 'testPredictedNameField', 'testTypeField'];

        expect(component.createQuery(component.options)).toEqual(new neon.query.Query()
            .selectFrom(component.options.database.name, component.options.table.name)
            .withFields(fields)
            .where(wherePredicate)
            .sortBy('testSortField', neonVariables.DESCENDING));
    });

    it('filterExists does return expected boolean', () => {
        expect(component.filterExists('field1', 'value1')).toEqual(false);
        expect(component.filterExists('field1', 'value2')).toEqual(false);
        expect(component.filterExists('field2', 'value1')).toEqual(false);
        expect(component.filterExists('field2', 'value2')).toEqual(false);

        component.filters.push({
            id: undefined,
            field: 'field1',
            prettyField: 'prettyField1',
            value: 'value1'
        });

        expect(component.filterExists('field1', 'value1')).toEqual(true);
        expect(component.filterExists('field1', 'value2')).toEqual(false);
        expect(component.filterExists('field2', 'value1')).toEqual(false);
        expect(component.filterExists('field2', 'value2')).toEqual(false);

        component.filters.push({
            id: undefined,
            field: 'field1',
            prettyField: 'prettyField1',
            value: 'value2'
        });

        expect(component.filterExists('field1', 'value1')).toEqual(true);
        expect(component.filterExists('field1', 'value2')).toEqual(true);
        expect(component.filterExists('field2', 'value1')).toEqual(false);
        expect(component.filterExists('field2', 'value2')).toEqual(false);

        component.filters.push({
            id: undefined,
            field: 'field2',
            prettyField: 'prettyField2',
            value: 'value1'
        });

        expect(component.filterExists('field1', 'value1')).toEqual(true);
        expect(component.filterExists('field1', 'value2')).toEqual(true);
        expect(component.filterExists('field2', 'value1')).toEqual(true);
        expect(component.filterExists('field2', 'value2')).toEqual(false);

        component.filters.push({
            id: undefined,
            field: 'field2',
            prettyField: 'prettyField2',
            value: 'value2'
        });

        expect(component.filterExists('field1', 'value1')).toEqual(true);
        expect(component.filterExists('field1', 'value2')).toEqual(true);
        expect(component.filterExists('field2', 'value1')).toEqual(true);
        expect(component.filterExists('field2', 'value2')).toEqual(true);

        component.filters = [];

        expect(component.filterExists('field1', 'value1')).toEqual(false);
        expect(component.filterExists('field1', 'value2')).toEqual(false);
        expect(component.filterExists('field2', 'value1')).toEqual(false);
        expect(component.filterExists('field2', 'value2')).toEqual(false);
    });

    it('getButtonText does return expected string', () => {
        expect(component.getButtonText()).toEqual('0 Files');

        component.options.limit = 1;
        component.gridArray = [{}];
        expect(component.getButtonText()).toEqual('1 File');

        component.gridArray = [{}, {}, {}, {}];
        expect(component.getButtonText()).toEqual('1 of 4 Files');

        component.options.limit = 2;
        expect(component.getButtonText()).toEqual('1 - 2 of 4 Files');

        component.page = 2;
        expect(component.getButtonText()).toEqual('3 - 4 of 4 Files');

        component.options.limit = 4;
        expect(component.getButtonText()).toEqual('4 Files');
    });

    it('getCloseableFilters does return expected array of filters', () => {
        expect(component.getCloseableFilters()).toEqual([]);

        component.filters.push({
            id: undefined,
            field: 'field1',
            prettyField: 'prettyField1',
            value: 'value1'
        });

        expect(component.getCloseableFilters()).toEqual([{
            id: undefined,
            field: 'field1',
            prettyField: 'prettyField1',
            value: 'value1'
        }]);

        component.filters.push({
            id: undefined,
            field: 'field2',
            prettyField: 'prettyField2',
            value: 'value2'
        });

        expect(component.getCloseableFilters()).toEqual([{
            id: undefined,
            field: 'field1',
            prettyField: 'prettyField1',
            value: 'value1'
        }, {
            id: undefined,
            field: 'field2',
            prettyField: 'prettyField2',
            value: 'value2'
        }]);
    });

    it('getElementRefs does return expected object', () => {
        let refs = component.getElementRefs();
        expect(refs.headerText).toBeDefined();
        expect(refs.infoText).toBeDefined();
        expect(refs.thumbnailGrid).toBeDefined();
        expect(refs.visualization).toBeDefined();
    });

    it('getFiltersToIgnore does return null if no filters are set', () => {
        component.options.database = DatasetServiceMock.DATABASES[0];
        component.options.table = DatasetServiceMock.TABLES[0];
        component.options.fields = DatasetServiceMock.FIELDS;
        component.options.ignoreSelf = false;

        expect(component.getFiltersToIgnore()).toEqual(null);

        component.options.ignoreSelf = true;

        expect(component.getFiltersToIgnore()).toEqual(null);
    });

    it('getFiltersToIgnore with ignoreSelf=false does return null if filters are set', () => {
        getService(FilterService).addFilter(null, 'testName', DatasetServiceMock.DATABASES[0].name, DatasetServiceMock.TABLES[0].name,
            neon.query.where('testFilterField', '!=', null), 'testFilterName1');

        component.options.database = DatasetServiceMock.DATABASES[0];
        component.options.table = DatasetServiceMock.TABLES[0];
        component.options.fields = DatasetServiceMock.FIELDS;
        component.options.filterField = new FieldMetaData('testFilterField', 'Test Filter Field');
        component.options.ignoreSelf = false;

        expect(component.getFiltersToIgnore()).toEqual(null);

        getService(FilterService).removeFilters(null, getService(FilterService).getFilters().map((filter) => {
            return filter.id;
        }));
    });

    it('getFiltersToIgnore with ignoreSelf=true does return expected array of IDs if filters are set matching database/table/field', () => {
        getService(FilterService).addFilter(null, 'testName', DatasetServiceMock.DATABASES[0].name, DatasetServiceMock.TABLES[0].name,
            neon.query.where('testFilterField', '!=', null), 'testFilterName1');

        component.options.database = DatasetServiceMock.DATABASES[0];
        component.options.table = DatasetServiceMock.TABLES[0];
        component.options.fields = DatasetServiceMock.FIELDS;
        component.options.filterField = new FieldMetaData('testFilterField', 'Test Filter Field');
        component.options.ignoreSelf = true;

        expect(component.getFiltersToIgnore()).toEqual(['testDatabase1-testTable1-testFilterName1']);

        getService(FilterService).removeFilters(null, getService(FilterService).getFilters().map((filter) => {
            return filter.id;
        }));
    });

    it('getFiltersToIgnore with ignoreSelf=true does return null if filters have multiple clauses', () => {
        getService(FilterService).addFilter(null, 'testName', DatasetServiceMock.DATABASES[0].name, DatasetServiceMock.TABLES[0].name,
            neon.query.and.apply(neon.query, [
                neon.query.where('testFilterField', '!=', null),
                neon.query.where('testLinkField', '!=', null)
            ]), 'testFilterName1');

        component.options.database = DatasetServiceMock.DATABASES[0];
        component.options.table = DatasetServiceMock.TABLES[0];
        component.options.fields = DatasetServiceMock.FIELDS;
        component.options.filterField = new FieldMetaData('testFilterField', 'Test Filter Field');
        component.options.ignoreSelf = true;

        expect(component.getFiltersToIgnore()).toEqual(null);

        getService(FilterService).removeFilters(null, getService(FilterService).getFilters().map((filter) => {
            return filter.id;
        }));
    });

    it('getFiltersToIgnore with ignoreSelf=true does return null if no filters are set matching database/table/field', () => {
        getService(FilterService).addFilter(null, 'testName', DatasetServiceMock.DATABASES[0].name, DatasetServiceMock.TABLES[0].name,
            neon.query.where('testFilterField', '!=', null), 'testFilterName1');

        component.options.database = DatasetServiceMock.DATABASES[0];
        component.options.table = DatasetServiceMock.TABLES[0];
        component.options.fields = DatasetServiceMock.FIELDS;
        component.options.filterField = new FieldMetaData('testField', 'Test Field');
        component.options.ignoreSelf = true;

        // Test matching database/table but not field.
        expect(component.getFiltersToIgnore()).toEqual(null);

        component.options.database = DatasetServiceMock.DATABASES[1];
        component.options.filterField = new FieldMetaData('testFilterField', 'Test Filter Field');

        // Test matching database/field but not table.
        expect(component.getFiltersToIgnore()).toEqual(null);

        component.options.database = DatasetServiceMock.DATABASES[0];
        component.options.table = DatasetServiceMock.TABLES[1];

        // Test matching table/field but not database.
        expect(component.getFiltersToIgnore()).toEqual(null);

        getService(FilterService).removeFilters(null, getService(FilterService).getFilters().map((filter) => {
            return filter.id;
        }));
    });

    it('getFiltersToIgnore with ignoreSelf=true does return expected array of IDs if no filterField is set', () => {
        getService(FilterService).addFilter(null, 'testName', DatasetServiceMock.DATABASES[0].name, DatasetServiceMock.TABLES[0].name,
            neon.query.where('testField1', '!=', null), 'testFilterName1');
        getService(FilterService).addFilter(null, 'testName', DatasetServiceMock.DATABASES[0].name, DatasetServiceMock.TABLES[0].name,
            neon.query.where('testField2', '!=', null), 'testFilterName2');

        component.options.database = DatasetServiceMock.DATABASES[0];
        component.options.table = DatasetServiceMock.TABLES[0];
        component.options.fields = DatasetServiceMock.FIELDS;
        component.options.ignoreSelf = true;

        expect(component.getFiltersToIgnore()).toEqual(['testDatabase1-testTable1-testFilterName1',
            'testDatabase1-testTable1-testFilterName2']);

        getService(FilterService).removeFilters(null, getService(FilterService).getFilters().map((filter) => {
            return filter.id;
        }));
    });

    it('getFilterText does return expected string', () => {
        expect(component.getFilterText({
            id: undefined,
            field: 'field1',
            prettyField: 'prettyField1',
            value: 'value1'
        })).toEqual('prettyField1 = value1');
    });

    it('getThumbnailLabel does return expected string', () => {
        expect(component.getThumbnailLabel({})).toEqual('');

        expect(component.getThumbnailLabel({
            testObjectNameField: 'myObjectName',
            testPredictedNameField: 'myPredictedName'
        })).toEqual('');

        component.options.objectNameField = new FieldMetaData('testObjectNameField', 'Test Object Name Field');

        expect(component.getThumbnailLabel({
            testObjectNameField: 'myObjectName',
            testPredictedNameField: 'myPredictedName'
        })).toEqual('myObjectName');

        expect(component.getThumbnailLabel({
            testPredictedNameField: 'myPredictedName'
        })).toEqual('');

        component.options.predictedNameField = new FieldMetaData('testPredictedNameField', 'Test Predicted Name Field');

        expect(component.getThumbnailLabel({
            testObjectNameField: 'myObjectName',
            testPredictedNameField: 'myPredictedName'
        })).toEqual('myPredictedName');

        expect(component.getThumbnailLabel({
            testObjectNameField: 'myObjectName'
        })).toEqual('');
    });

    it('getThumbnailPercent does return expected string', () => {
        expect(component.getThumbnailPercent({})).toEqual('');

        expect(component.getThumbnailPercent({
            testPercentField: 0.1234
        })).toEqual('');

        component.options.percentField = new FieldMetaData('testPercentField', 'Test Percent Field');

        expect(component.getThumbnailPercent({})).toEqual('');

        expect(component.getThumbnailPercent({
            testPercentField: 0.1234
        })).toEqual('12.3%');

        expect(component.getThumbnailPercent({
            testPercentField: 0.5678
        })).toEqual('56.8%');

        expect(component.getThumbnailPercent({
            testPercentField: 0
        })).toEqual('0%');

        expect(component.getThumbnailPercent({
            testPercentField: 0.5
        })).toEqual('50%');

        expect(component.getThumbnailPercent({
            testPercentField: 1
        })).toEqual('100%');
    });

    it('getThumbnailTitle does return expected string', () => {
        expect(component.getThumbnailTitle({})).toEqual('');

        expect(component.getThumbnailTitle({
            testNameField: 'myName',
            testObjectNameField: 'myObjectName',
            testPercentField: 0.1234,
            testPredictedNameField: 'myPredictedName'
        })).toEqual('');

        component.options.nameField = new FieldMetaData('testNameField', 'Test Name Field');
        component.options.objectNameField = new FieldMetaData('testObjectNameField', 'Test Object Name Field');
        component.options.percentField = new FieldMetaData('testPercentField', 'Test Percent Field');
        component.options.predictedNameField = new FieldMetaData('testPredictedNameField', 'Test Predicted Name Field');

        expect(component.getThumbnailTitle({
            testNameField: 'myName',
            testObjectNameField: 'myObjectName',
            testPercentField: 0.1234,
            testPredictedNameField: 'myPredictedName'
        })).toEqual('myName, Prediction : myPredictedName, Actual : myObjectName');
    });

    it('getThumbnailTitle does use textMap', () => {
        component.options.nameField = new FieldMetaData('testNameField', 'Test Name Field');
        component.options.objectNameField = new FieldMetaData('testObjectNameField', 'Test Object Name Field');
        component.options.percentField = new FieldMetaData('testPercentField', 'Test Percent Field');
        component.options.predictedNameField = new FieldMetaData('testPredictedNameField', 'Test Predicted Name Field');
        component.options.textMap = {
            actual: 'MyActualText',
            name: 'MyNameText',
            percentage: 'MyPercentageText',
            prediction: 'MyPredictionText'
        };

        expect(component.getThumbnailTitle({
            testNameField: 'myName',
            testObjectNameField: 'myObjectName',
            testPercentField: 0.1234,
            testPredictedNameField: 'myPredictedName'
        })).toEqual('MyNameText : myName, MyPredictionText : myPredictedName, MyActualText : myObjectName');
    });

    it('goToNextPage does not update page or call updatePageData if lastPage is true', () => {
        let spy = spyOn(component, 'updatePageData');
        component.goToNextPage();

        expect(component.page).toEqual(1);
        expect(spy.calls.count()).toEqual(0);
    });

    it('goToNextPage does update page and call updatePageData if lastPage is false', () => {
        let spy = spyOn(component, 'updatePageData');
        component.lastPage = false;

        component.goToNextPage();
        expect(component.page).toEqual(2);
        expect(spy.calls.count()).toEqual(1);

        component.goToNextPage();
        expect(component.page).toEqual(3);
        expect(spy.calls.count()).toEqual(2);
    });

    it('goToPreviousPage does not update page or call updatePageData if page is 1', () => {
        let spy = spyOn(component, 'updatePageData');
        component.goToPreviousPage();

        expect(component.page).toEqual(1);
        expect(spy.calls.count()).toEqual(0);
    });

    it('goToPreviousPage does update page and call updatePageData if page is not 1', () => {
        let spy = spyOn(component, 'updatePageData');
        component.page = 3;

        component.goToPreviousPage();
        expect(component.page).toEqual(2);
        expect(spy.calls.count()).toEqual(1);

        component.goToPreviousPage();
        expect(component.page).toEqual(1);
        expect(spy.calls.count()).toEqual(2);
    });

    it('isSelectable does return expected boolean', () => {
        component.options.openOnMouseClick = false;
        expect(component.isSelectable()).toEqual(false);

        component.options.filterField = new FieldMetaData('testFilterField', 'Test Filter Field');
        expect(component.isSelectable()).toEqual(true);
        component.options.filterField = new FieldMetaData();

        component.options.idField = new FieldMetaData('testIdField', 'Test ID Field');
        expect(component.isSelectable()).toEqual(true);
        component.options.idField = new FieldMetaData();

        component.options.openOnMouseClick = true;
        expect(component.isSelectable()).toEqual(true);
    });

    it('isSelected does return expected boolean', () => {
        expect(component.isSelected({})).toEqual(false);

        expect(component.isSelected({
            testFilterField: 'testFilterValue'
        })).toEqual(false);

        component.filters = [{
            id: undefined,
            field: 'testFilterField',
            prettyField: 'Test Filter Field',
            value: 'testFilterValue'
        }];

        expect(component.isSelected({
            testFilterField: 'testFilterValue'
        })).toEqual(false);

        component.options.filterField = new FieldMetaData('testFilterField', 'Test Filter Field');

        expect(component.isSelected({
            testFilterField: 'testFilterValue'
        })).toEqual(true);

        component.filters = [];

        expect(component.isSelected({
            testFilterField: 'testFilterValue'
        })).toEqual(false);
    });

    it('isValidQuery does return expected boolean', () => {
        expect(component.isValidQuery(component.options)).toEqual(false);

        component.options.database = DatasetServiceMock.DATABASES[0];
        expect(component.isValidQuery(component.options)).toEqual(false);

        component.options.table = DatasetServiceMock.TABLES[0];
        expect(component.isValidQuery(component.options)).toEqual(false);

        component.options.linkField = new FieldMetaData('testLinkField', 'Test Link Field');
        expect(component.isValidQuery(component.options)).toEqual(false);

        component.options.sortField = new FieldMetaData('testSortField', 'Test Sort Field');
        expect(component.isValidQuery(component.options)).toEqual(true);
    });

    it('onQuerySuccess with aggregation query data does update expected properties and call expected functions', () => {
        component.options.categoryField = new FieldMetaData('testCategoryField', 'Test Category Field');
        component.options.compareField = new FieldMetaData('testCompareField', 'Test Compare Field');
        component.options.filterField = new FieldMetaData('testFilterField', 'Test Filter Field');
        component.options.idField = new FieldMetaData('_id', 'Test ID Field');
        component.options.linkField = new FieldMetaData('testLinkField', 'Test Link Field');
        component.options.nameField = new FieldMetaData('testNameField', 'Test Name Field');
        component.options.objectIdField = new FieldMetaData('testObjectIdField', 'Test Object ID Field');
        component.options.objectNameField = new FieldMetaData('testObjectNameField', 'Test Object Name Field');
        component.options.percentField = new FieldMetaData('testPercentField', 'Test Percent Field');
        component.options.predictedNameField = new FieldMetaData('testPredictedNameField', 'Test Predicted Name Field');
        component.options.sortField = new FieldMetaData('testSortField', 'Test Sort Field');
        component.options.typeField = new FieldMetaData('testTypeField', 'Test Type Field');
        component.errorMessage = 'Previous Error Message';
        component.lastPage = true;
        component.page = 2;
        component.showGrid = false;
        let spy1 = spyOn(component, 'refreshVisualization');
        let spy2 = spyOn(component, 'createMediaThumbnail');

        component.onQuerySuccess(component.options, {
            data: [{
                _id: 'id1',
                testCategoryField: 'category1',
                testCompareField: 'compare1',
                testFilterField: 'filter1',
                testLinkField: 'link1',
                testNameField: 'name1',
                testObjectIdField: 'objectId1',
                testObjectNameField: 'objectName1',
                testPercentField: 0.1,
                testPredictedNameField: 'predictedName1',
                testSortField: 'sort1',
                testTypeField: 'type1'
            }, {
                _id: 'id2',
                testCategoryField: 'category2',
                testCompareField: 'compare2',
                testFilterField: 'filter2',
                testLinkField: 'link2',
                testNameField: 'name2',
                testObjectIdField: 'objectId2',
                testObjectNameField: 'objectName2',
                testPercentField: 0.2,
                testPredictedNameField: 'predictedName2',
                testSortField: 'sort2',
                testTypeField: 'type2'
            }]
        });

        expect(component.errorMessage).toEqual('');
        expect(component.lastPage).toEqual(true);
        expect(component.page).toEqual(1);
        expect(component.showGrid).toEqual(true);

        expect(component.gridArray).toEqual([{
            _id: 'id1',
            testCategoryField: 'category1',
            testCompareField: 'compare1',
            testFilterField: 'filter1',
            testLinkField: 'link1',
            testNameField: 'name1',
            testObjectIdField: 'objectId1',
            testObjectNameField: 'objectName1',
            testPercentField: 0.1,
            testPredictedNameField: 'predictedName1',
            testSortField: 'sort1',
            testTypeField: 'type1'
        }, {
            _id: 'id2',
            testCategoryField: 'category2',
            testCompareField: 'compare2',
            testFilterField: 'filter2',
            testLinkField: 'link2',
            testNameField: 'name2',
            testObjectIdField: 'objectId2',
            testObjectNameField: 'objectName2',
            testPercentField: 0.2,
            testPredictedNameField: 'predictedName2',
            testSortField: 'sort2',
            testTypeField: 'type2'
        }]);
        expect(component.pagingGrid).toEqual([{
            _id: 'id1',
            testCategoryField: 'category1',
            testCompareField: 'compare1',
            testFilterField: 'filter1',
            testLinkField: 'link1',
            testNameField: 'name1',
            testObjectIdField: 'objectId1',
            testObjectNameField: 'objectName1',
            testPercentField: 0.1,
            testPredictedNameField: 'predictedName1',
            testSortField: 'sort1',
            testTypeField: 'type1'
        }, {
            _id: 'id2',
            testCategoryField: 'category2',
            testCompareField: 'compare2',
            testFilterField: 'filter2',
            testLinkField: 'link2',
            testNameField: 'name2',
            testObjectIdField: 'objectId2',
            testObjectNameField: 'objectName2',
            testPercentField: 0.2,
            testPredictedNameField: 'predictedName2',
            testSortField: 'sort2',
            testTypeField: 'type2'
        }]);

        expect(spy1.calls.count()).toEqual(1);
        expect(spy2.calls.count()).toEqual(1);
    });

    it('onQuerySuccess with empty aggregation query data does update expected properties and call expected functions', () => {
        component.options.fields = DatasetServiceMock.FIELDS;
        component.options.linkField = new FieldMetaData('testLinkField', 'Test Link Field');
        component.errorMessage = 'Previous Error Message';
        component.lastPage = true;
        component.page = 2;
        component.showGrid = false;
        let spy1 = spyOn(component, 'refreshVisualization');
        let spy2 = spyOn(component, 'createMediaThumbnail');

        component.onQuerySuccess(component.options, {
            data: []
        });

        expect(component.errorMessage).toEqual('No Data');
        expect(component.lastPage).toEqual(true);
        expect(component.page).toEqual(2);
        expect(component.showGrid).toEqual(false);

        expect(component.gridArray).toEqual([]);
        expect(component.pagingGrid).toEqual([]);

        expect(spy1.calls.count()).toEqual(1);
        expect(spy2.calls.count()).toEqual(0);
    });

    it('onQuerySuccess with limited aggregation query data does update expected properties and call expected functions', () => {
        component.options.fields = DatasetServiceMock.FIELDS;
        component.options.limit = 2;
        component.options.idField = new FieldMetaData('_id', 'Test ID Field');
        component.options.linkField = new FieldMetaData('testLinkField', 'Test Link Field');
        component.options.nameField = new FieldMetaData('testNameField', 'Test Name Field');
        component.options.percentField = new FieldMetaData('testSizeField', 'Test Size Field');
        component.options.typeField = new FieldMetaData('testTypeField', 'Test Type Field');
        component.errorMessage = 'Previous Error Message';
        component.lastPage = true;
        component.page = 2;
        component.showGrid = false;
        let spy1 = spyOn(component, 'refreshVisualization');
        let spy2 = spyOn(component, 'createMediaThumbnail');

        component.onQuerySuccess(component.options, {
            data: [{
                _id: 'id1',
                testLinkField: 'link1',
                testNameField: 'name1',
                testSizeField: 0.1,
                testTypeField: 'type1'
            }, {
                _id: 'id2',
                testLinkField: 'link2',
                testNameField: 'name2',
                testSizeField: 0.2,
                testTypeField: 'type2'
            }, {
                _id: 'id3',
                testLinkField: 'link3',
                testNameField: 'name3',
                testSizeField: 0.3,
                testTypeField: 'type3'
            }, {
                _id: 'id4',
                testLinkField: 'link4',
                testNameField: 'name4',
                testSizeField: 0.4,
                testTypeField: 'type4'
            }]
        });

        expect(component.errorMessage).toEqual('');
        expect(component.lastPage).toEqual(true);
        expect(component.page).toEqual(2);
        expect(component.showGrid).toEqual(true);

        expect(component.gridArray).toEqual([{
                _id: 'id1',
                testLinkField: 'link1',
                testNameField: 'name1',
                testSizeField: 0.1,
                testTypeField: 'type1'
            }, {
                _id: 'id2',
                testLinkField: 'link2',
                testNameField: 'name2',
                testSizeField: 0.2,
                testTypeField: 'type2'
            }, {
                _id: 'id3',
                testLinkField: 'link3',
                testNameField: 'name3',
                testSizeField: 0.3,
                testTypeField: 'type3'
            }, {
                _id: 'id4',
                testLinkField: 'link4',
                testNameField: 'name4',
                testSizeField: 0.4,
                testTypeField: 'type4'
        }]);
        expect(component.pagingGrid).toEqual([{
                _id: 'id3',
                testLinkField: 'link3',
                testNameField: 'name3',
                testSizeField: 0.3,
                testTypeField: 'type3'
            }, {
                _id: 'id4',
                testLinkField: 'link4',
                testNameField: 'name4',
                testSizeField: 0.4,
                testTypeField: 'type4'
        }]);

        expect(spy1.calls.count()).toEqual(1);
        expect(spy2.calls.count()).toEqual(1);
    });

    it('onQuerySuccess with data set to the last page does update expected properties and call expected functions', () => {
        component.options.fields = DatasetServiceMock.FIELDS;
        component.options.limit = 2;
        component.options.idField = new FieldMetaData('_id', 'Test ID Field');
        component.options.linkField = new FieldMetaData('testLinkField', 'Test Link Field');
        component.options.nameField = new FieldMetaData('testNameField', 'Test Name Field');
        component.options.percentField = new FieldMetaData('testSizeField', 'Test Size Field');
        component.options.typeField = new FieldMetaData('testTypeField', 'Test Type Field');
        component.errorMessage = 'Previous Error Message';
        component.lastPage = true;
        component.page = 2;
        component.showGrid = false;
        let spy1 = spyOn(component, 'refreshVisualization');
        let spy2 = spyOn(component, 'createMediaThumbnail');

        component.onQuerySuccess(component.options, {
            data: [{
                _id: 'id1',
                testLinkField: 'link1',
                testNameField: 'name1',
                testSizeField: 0.1,
                testTypeField: 'type1'
            }, {
                _id: 'id2',
                testLinkField: 'link2',
                testNameField: 'name2',
                testSizeField: 0.2,
                testTypeField: 'type2'
            }, {
                _id: 'id3',
                testLinkField: 'link3',
                testNameField: 'name3',
                testSizeField: 0.3,
                testTypeField: 'type3'
            }, {
                _id: 'id4',
                testLinkField: 'link4',
                testNameField: 'name4',
                testSizeField: 0.4,
                testTypeField: 'type4'
            }]
        });

        expect(component.errorMessage).toEqual('');
        expect(component.lastPage).toEqual(true);
        expect(component.page).toEqual(2);
        expect(component.showGrid).toEqual(true);

        expect(component.gridArray).toEqual([{
                _id: 'id1',
                testLinkField: 'link1',
                testNameField: 'name1',
                testSizeField: 0.1,
                testTypeField: 'type1'
            }, {
                _id: 'id2',
                testLinkField: 'link2',
                testNameField: 'name2',
                testSizeField: 0.2,
                testTypeField: 'type2'
            }, {
                _id: 'id3',
                testLinkField: 'link3',
                testNameField: 'name3',
                testSizeField: 0.3,
                testTypeField: 'type3'
            }, {
                _id: 'id4',
                testLinkField: 'link4',
                testNameField: 'name4',
                testSizeField: 0.4,
                testTypeField: 'type4'
        }]);
        expect(component.pagingGrid).toEqual([{
                _id: 'id3',
                testLinkField: 'link3',
                testNameField: 'name3',
                testSizeField: 0.3,
                testTypeField: 'type3'
            }, {
                _id: 'id4',
                testLinkField: 'link4',
                testNameField: 'name4',
                testSizeField: 0.4,
                testTypeField: 'type4'
        }]);

        expect(spy1.calls.count()).toEqual(1);
        expect(spy2.calls.count()).toEqual(1);
    });

    it('onQuerySuccess with link prefix does update expected properties and call expected functions', () => {
        component.options.fields = DatasetServiceMock.FIELDS;
        component.options.idField = new FieldMetaData('_id', 'Test ID Field');
        component.options.linkField = new FieldMetaData('testLinkField', 'Test Link Field');
        component.options.nameField = new FieldMetaData('testNameField', 'Test Name Field');
        component.options.percentField = new FieldMetaData('testSizeField', 'Test Size Field');
        component.options.typeField = new FieldMetaData('testTypeField', 'Test Type Field');
        component.options.linkPrefix = 'prefix/';
        let spy1 = spyOn(component, 'refreshVisualization');
        let spy2 = spyOn(component, 'createMediaThumbnail');

        component.onQuerySuccess(component.options, {
            data: [{
                _id: 'id1',
                testLinkField: 'link1',
                testNameField: 'name1',
                testSizeField: 0.1,
                testTypeField: 'type1'
            }, {
                _id: 'id2',
                testLinkField: 'link2',
                testNameField: 'name2',
                testSizeField: 0.2,
                testTypeField: 'type2'
            }]
        });

        expect(component.gridArray).toEqual([{
            _id: 'id1',
            testLinkField: 'prefix/link1',
            testNameField: 'name1',
            testSizeField: 0.1,
            testTypeField: 'type1'
        }, {
            _id: 'id2',
            testLinkField: 'prefix/link2',
            testNameField: 'name2',
            testSizeField: 0.2,
            testTypeField: 'type2'
        }]);
        expect(component.pagingGrid).toEqual([{
            _id: 'id1',
            testLinkField: 'prefix/link1',
            testNameField: 'name1',
            testSizeField: 0.1,
            testTypeField: 'type1'
        }, {
            _id: 'id2',
            testLinkField: 'prefix/link2',
            testNameField: 'name2',
            testSizeField: 0.2,
            testTypeField: 'type2'
        }]);

        expect(spy1.calls.count()).toEqual(1);
        expect(spy2.calls.count()).toEqual(1);
    });

    it('refreshVisualization does call changeDetection.detectChanges', () => {
        let spy = spyOn(component.changeDetection, 'detectChanges');

        component.refreshVisualization();
        expect(spy.calls.count()).toEqual(1);
    });

    it('removeFilter does remove objects from filters', () => {
        let filter1 = {
            id: 'idA',
            field: 'field1',
            prettyField: 'prettyField1',
            value: 'value1'
        };
        let filter2 = {
            id: 'idB',
            field: 'field2',
            prettyField: 'prettyField2',
            value: 'value2'
        };
        component.filters = [filter1, filter2];

        component.removeFilter(filter1);
        expect(component.filters).toEqual([filter2]);

        component.removeFilter(filter2);
        expect(component.filters).toEqual([]);
    });

    it('removeFilter does not remove objects from filters with non-matching IDs', () => {
        component.filters = [{
            id: 'idA',
            field: 'field1',
            prettyField: 'prettyField1',
            value: 'value1'
        }];

        component.removeFilter({
            id: 'idC',
            field: 'field1',
            prettyField: 'prettyField1',
            value: 'value1'
        });
        expect(component.filters).toEqual([{
            id: 'idA',
            field: 'field1',
            prettyField: 'prettyField1',
            value: 'value1'
        }]);
    });

    it('selectGridItem does call publishSelectId if idField is set', () => {
        let spy = spyOn(component, 'publishSelectId');

        component.selectGridItem({
            testIdField: 'id1'
        });
        expect(spy.calls.count()).toEqual(0);

        component.options.idField = new FieldMetaData('testIdField', 'Test ID Field');

        component.selectGridItem({
            testIdField: 'id1'
        });
        expect(spy.calls.count()).toEqual(1);
        expect(spy.calls.argsFor(0)).toEqual(['id1']);
    });

    it('selectGridItem does call createFilter if filterField is set', () => {
        let spy = spyOn(component, 'createFilter');

        component.selectGridItem({
            testFilterField: 'filter1'
        });
        expect(spy.calls.count()).toEqual(0);

        component.options.filterField = new FieldMetaData('testFilterField', 'Test Filter Field');

        component.selectGridItem({
            testFilterField: 'filter1'
        });
        expect(spy.calls.count()).toEqual(1);
        expect(spy.calls.argsFor(0)).toEqual(['filter1']);
    });

    it('isValideMediaType does return true if a MediaType is valid', () => {
        component.options.linkField = new FieldMetaData('testLinkField', 'Test Link Field');
        let random = {
            testLinkField: 'random'
        };
        let correctMedia = {
            testLinkField: 'img'
        };
        expect(!component.isValidMediaType(random));
        expect(component.isValidMediaType(correctMedia));
    });

    it('setupFilters does not do anything if no filter exists', () => {
        component.options.database = DatasetServiceMock.DATABASES[0];
        component.options.table = DatasetServiceMock.TABLES[0];
        component.options.fields = DatasetServiceMock.FIELDS;
        component.options.filterField = DatasetServiceMock.FILTER_FIELD;

        component.setupFilters();
        expect(component.filters).toEqual([]);
    });

    it('setupFilters does add neon filter to filters', () => {
        getService(FilterService).addFilter(null, 'testName', DatasetServiceMock.DATABASES[0].name, DatasetServiceMock.TABLES[0].name,
            neon.query.where('testFilterField', '=', 'value1'), 'testFilterName1');

        component.options.database = DatasetServiceMock.DATABASES[0];
        component.options.table = DatasetServiceMock.TABLES[0];
        component.options.fields = DatasetServiceMock.FIELDS;
        component.options.filterField = DatasetServiceMock.FILTER_FIELD;

        component.setupFilters();
        expect(component.filters).toEqual([{
            id: 'testDatabase1-testTable1-testFilterName1',
            field: 'testFilterField',
            prettyField: 'Test Filter Field',
            value: 'value1'
        }]);

        getService(FilterService).removeFilters(null, getService(FilterService).getFilters().map((filter) => {
            return filter.id;
        }));
    });

    it('setupFilters does not add neon filter with non-matching database/table/field', () => {
        getService(FilterService).addFilter(null, 'testName', DatasetServiceMock.DATABASES[0].name, DatasetServiceMock.TABLES[0].name,
            neon.query.where('testFilterField', '=', 'value1'), 'testFilterName1');

        component.options.database = DatasetServiceMock.DATABASES[0];
        component.options.table = DatasetServiceMock.TABLES[0];
        component.options.fields = DatasetServiceMock.FIELDS;

        // Test matching database/table but not field.
        component.setupFilters();
        expect(component.filters).toEqual([]);

        component.options.database = DatasetServiceMock.DATABASES[1];
        component.options.filterField = DatasetServiceMock.FILTER_FIELD;

        // Test matching database/field but not table.
        component.setupFilters();
        expect(component.filters).toEqual([]);

        component.options.database = DatasetServiceMock.DATABASES[0];
        component.options.table = DatasetServiceMock.TABLES[1];

        // Test matching table/field but not table.
        component.setupFilters();
        expect(component.filters).toEqual([]);

        getService(FilterService).removeFilters(null, getService(FilterService).getFilters().map((filter) => {
            return filter.id;
        }));
    });

    it('setupFilters does not add neon filter matching existing filter field/value', () => {
        getService(FilterService).addFilter(null, 'testName', DatasetServiceMock.DATABASES[0].name, DatasetServiceMock.TABLES[0].name,
            neon.query.where('testFilterField', '=', 'value1'), 'testFilterName1');

        getService(FilterService).addFilter(null, 'testName', DatasetServiceMock.DATABASES[0].name, DatasetServiceMock.TABLES[0].name,
            neon.query.where('testFilterField', '=', 'value1'), 'testFilterName2');

        component.options.database = DatasetServiceMock.DATABASES[0];
        component.options.table = DatasetServiceMock.TABLES[0];
        component.options.fields = DatasetServiceMock.FIELDS;
        component.options.filterField = DatasetServiceMock.FILTER_FIELD;

        component.setupFilters();
        expect(component.filters).toEqual([{
            id: 'testDatabase1-testTable1-testFilterName1',
            field: 'testFilterField',
            prettyField: 'Test Filter Field',
            value: 'value1'
        }]);

        getService(FilterService).removeFilters(null, getService(FilterService).getFilters().map((filter) => {
            return filter.id;
        }));
    });

    it('setupFilters does remove previous filters', () => {
        getService(FilterService).addFilter(null, 'testName', DatasetServiceMock.DATABASES[0].name, DatasetServiceMock.TABLES[0].name,
            neon.query.where('testFilterField', '=', 'value1'), 'testFilterName1');

        component.options.database = DatasetServiceMock.DATABASES[0];
        component.options.table = DatasetServiceMock.TABLES[0];
        component.options.fields = DatasetServiceMock.FIELDS;
        component.options.filterField = DatasetServiceMock.FILTER_FIELD;
        component.filters = [{
            id: 'idA',
            field: 'testFilterField',
            prettyField: 'Test Filter Field',
            value: 'value2'
        }];

        component.setupFilters();
        expect(component.filters).toEqual([{
            id: 'testDatabase1-testTable1-testFilterName1',
            field: 'testFilterField',
            prettyField: 'Test Filter Field',
            value: 'value1'
        }]);

        getService(FilterService).removeFilters(null, getService(FilterService).getFilters().map((filter) => {
            return filter.id;
        }));
    });

    it('setupFilters does ignore neon filters with multiple clauses', () => {
        getService(FilterService).addFilter(null, 'testName', DatasetServiceMock.DATABASES[0].name, DatasetServiceMock.TABLES[0].name,
            neon.query.and.apply(neon.query, [
                neon.query.where('testFilterField', '=', 'value1'),
                neon.query.where('testFilterField', '=', 'value2')
            ]), 'testFilterName2');

        component.options.database = DatasetServiceMock.DATABASES[0];
        component.options.table = DatasetServiceMock.TABLES[0];
        component.options.filterField = DatasetServiceMock.FILTER_FIELD;

        component.setupFilters();
        expect(component.filters).toEqual([]);

        getService(FilterService).removeFilters(null, getService(FilterService).getFilters().map((filter) => {
            return filter.id;
        }));
    });

    it('updatePageData does update pagingGrid and lastPage from gridArray, page, and limit and call expected functions', () => {
        component.options.limit = 2;
        component.page = 1;
        component.gridArray = [{}, {}, {}];
        let spy1 = spyOn(component, 'refreshVisualization');
        let spy2 = spyOn(component, 'createMediaThumbnail');

        component.updatePageData();
        expect(component.pagingGrid).toEqual([{}, {}]);
        expect(component.lastPage).toEqual(false);
        expect(spy1.calls.count()).toEqual(1);
        expect(spy2.calls.count()).toEqual(1);
    });

    it('updatePageData does set lastPage to true if on last page', () => {
        component.options.limit = 2;
        component.page = 2;
        component.gridArray = [{}, {}, {}];
        let spy1 = spyOn(component, 'refreshVisualization');
        let spy2 = spyOn(component, 'createMediaThumbnail');

        component.updatePageData();
        expect(component.pagingGrid).toEqual([{}]);
        expect(component.lastPage).toEqual(true);
        expect(spy1.calls.count()).toEqual(1);
        expect(spy2.calls.count()).toEqual(1);
    });
});

describe('Component: ThumbnailGrid with config', () => {
    let component: ThumbnailGridComponent;
    let fixture: ComponentFixture<ThumbnailGridComponent>;

    initializeTestBed({
        declarations: [
            ThumbnailDetailsContractedComponent,
            ThumbnailDetailsExpandedComponent,
            ThumbnailGridComponent,
            ExportControlComponent,
            UnsharedFilterComponent
        ],

        providers: [
            ConnectionService,
            { provide: DatasetService, useClass: DatasetServiceMock },
            { provide: FilterService, useClass: FilterServiceMock },
            Injector,
            { provide: 'config', useValue: new NeonGTDConfig() },
            { provide: 'database', useValue: 'testDatabase2' },
            { provide: 'table', useValue: 'testTable2' },
            { provide: 'filter', useValue: {lhs: 'testConfigFilterField', operator: '=', rhs: 'testConfigFilterValue' } },
            { provide: 'limit', useValue: 10 },
            { provide: 'border', useValue: 'percentCompare' },
            { provide: 'borderCompareValue', useValue: 'Test Compare Value' },
            { provide: 'borderPercentThreshold', useValue: 0.25 },
            { provide: 'categoryField', useValue: 'testCategoryField' },
            { provide: 'compareField', useValue: 'testCategoryField' },
            { provide: 'cropAndScale', useValue: 'both' },
            { provide: 'dateField', useValue: 'testDateField'},
            { provide: 'defaultLabel', useValue: 'testDefaultLabel' },
            { provide: 'defaultPercent', useValue: 'testDefaultPercent' },
            { provide: 'detailedThumbnails', useValue: false},
            { provide: 'filterField', useValue: 'testFilterField' },
            { provide: 'id', useValue: 'testId' },
            { provide: 'idField', useValue: 'testIdField' },
            { provide: 'ignoreSelf', useValue: true },
            { provide: 'linkField', useValue: 'testLinkField' },
            { provide: 'linkPrefix', useValue: 'prefix/' },
            { provide: 'nameField', useValue: 'testNameField' },
            { provide: 'objectIdField', useValue: 'testIdField' },
            { provide: 'objectNameField', useValue: 'testNameField' },
            { provide: 'openOnMouseClick', useValue: false },
            { provide: 'percentField', useValue: 'testSizeField' },
            { provide: 'predictedNameField', useValue: 'testNameField' },
            { provide: 'sortDescending', useValue: false },
            { provide: 'sortField', useValue: 'testSortField' },
            { provide: 'textMap', useValue: { actual: 'Truth', percentage: 'Score' } },
            { provide: 'typeField', useValue: 'testTypeField' },
            { provide: 'typeMap', useValue: { jpg: 'img', mov: 'vid' } },
            { provide: 'title', useValue: 'Test Title' }
        ],
        imports: [
            AppMaterialModule,
            BrowserAnimationsModule,
            FormsModule
        ]
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(ThumbnailGridComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('does have expected superclass options properties', () => {
        expect(component.options.database).toEqual(DatasetServiceMock.DATABASES[1]);
        expect(component.options.databases).toEqual(DatasetServiceMock.DATABASES);
        expect(component.options.table).toEqual(DatasetServiceMock.TABLES[1]);
        expect(component.options.tables).toEqual(DatasetServiceMock.TABLES);
        expect(component.options.fields).toEqual(DatasetServiceMock.FIELDS);
        expect(component.options.limit).toEqual(10);
        expect(component.options.title).toEqual('Test Title');
        expect(component.options.filter).toEqual({
            lhs: 'testConfigFilterField',
            operator: '=',
            rhs: 'testConfigFilterValue'
        });
    });

    it('does have expected class options properties', () => {
        expect(component.options.border).toEqual('percentCompare');
        expect(component.options.borderCompareValue).toEqual('Test Compare Value');
        expect(component.options.borderPercentThreshold).toEqual(0.25);
        expect(component.options.cropAndScale).toEqual('both');
        expect(component.options.defaultLabel).toEqual('testDefaultLabel');
        expect(component.options.defaultPercent).toEqual('testDefaultPercent');
        expect(component.options.detailedThumbnails).toEqual(false);
        expect(component.options.id).toEqual('testId');
        expect(component.options.ignoreSelf).toEqual(true);
        expect(component.options.linkPrefix).toEqual('prefix/');
        expect(component.options.openOnMouseClick).toEqual(false);
        expect(component.options.sortDescending).toEqual(false);

        expect(component.options.textMap).toEqual({
            actual: 'Truth',
            percentage: 'Score'
        });
        expect(component.options.typeMap).toEqual({
            jpg: 'img',
            mov: 'vid'
        });

        expect(component.options.categoryField).toEqual(new FieldMetaData('testCategoryField', 'Test Category Field', false, 'string'));
        expect(component.options.compareField).toEqual(new FieldMetaData('testCategoryField', 'Test Category Field', false, 'string'));
        expect(component.options.dateField).toEqual(new FieldMetaData('testDateField', 'Test Date Field', false, 'date'));
        expect(component.options.filterField).toEqual(new FieldMetaData('testFilterField', 'Test Filter Field', false, 'string'));
        expect(component.options.idField).toEqual(new FieldMetaData('testIdField', 'Test ID Field', false, 'string'));
        expect(component.options.linkField).toEqual(new FieldMetaData('testLinkField', 'Test Link Field', false, 'string'));
        expect(component.options.nameField).toEqual(new FieldMetaData('testNameField', 'Test Name Field', false, 'string'));
        expect(component.options.objectIdField).toEqual(new FieldMetaData('testIdField', 'Test ID Field', false, 'string'));
        expect(component.options.objectNameField).toEqual(new FieldMetaData('testNameField', 'Test Name Field', false, 'string'));
        expect(component.options.percentField).toEqual(new FieldMetaData('testSizeField', 'Test Size Field', false, 'float'));
        expect(component.options.predictedNameField).toEqual(new FieldMetaData('testNameField', 'Test Name Field', false, 'string'));
        expect(component.options.sortField).toEqual(new FieldMetaData('testSortField', 'Test Sort Field', false, 'string'));
        expect(component.options.typeField).toEqual(new FieldMetaData('testTypeField', 'Test Type Field', false, 'string'));
    });

    it('does show header in toolbar with visualization title from config', () => {
        let header = fixture.debugElement.query(By.css('mat-sidenav-container mat-toolbar .header'));
        expect(header).not.toBeNull();
        expect(header.nativeElement.textContent).toContain('Test Title');
    });

    it('does show elements in sidenav options menu that have expected options', async(() => {
        // Force the component to update all its selected elements.
        fixture.detectChanges();
        fixture.whenStable().then(() => {
            fixture.detectChanges();

            let inputs = fixture.debugElement.queryAll(
                By.css('mat-sidenav-container mat-sidenav mat-card mat-card-content mat-form-field input'));
            expect(inputs.length).toEqual(6);

            expect(inputs[0].attributes.placeholder).toBe('Title');
            expect(inputs[0].nativeElement.value).toContain('Test Title');

            expect(inputs[1].attributes.placeholder).toBe('Thumbnail Limit');
            expect(inputs[1].nativeElement.value).toContain('10');

            expect(inputs[2].attributes.placeholder).toBe('Border Comparison Field Equals...');
            expect(inputs[2].nativeElement.value).toEqual('Test Compare Value');

            expect(inputs[3].attributes.placeholder).toBe('Border Probability Greater Than...');
            expect(inputs[3].nativeElement.value).toEqual('0.25');

            expect(inputs[4].attributes.placeholder).toBe('Link Prefix');
            expect(inputs[4].nativeElement.value).toEqual('prefix/');

            let selects = fixture.debugElement.queryAll(
                By.css('mat-sidenav-container mat-sidenav mat-card mat-card-content mat-form-field mat-select'));
            expect(selects.length).toEqual(14);

            validateSelect(selects[0], 'Database', true);
            let databaseOptions = selects[0].componentInstance.options.toArray();
            expect(databaseOptions.length).toEqual(2);
            expect(databaseOptions[0].getLabel()).toEqual('Test Database 1');
            expect(databaseOptions[0].selected).toEqual(false);
            expect(databaseOptions[1].getLabel()).toEqual('Test Database 2');
            expect(databaseOptions[1].selected).toEqual(true);

            validateSelect(selects[1], 'Table', true);
            let tableOptions = selects[1].componentInstance.options.toArray();
            expect(tableOptions.length).toEqual(2);
            expect(tableOptions[0].getLabel()).toEqual('Test Table 1');
            expect(tableOptions[0].selected).toEqual(false);
            expect(tableOptions[1].getLabel()).toEqual('Test Table 2');
            expect(tableOptions[1].selected).toEqual(true);

            validateSelect(selects[2], 'Name Field', false);
            validateSelectFields(selects[2], false, 'testNameField');

            validateSelect(selects[3], 'Actual Name Field', false);
            validateSelectFields(selects[3], false, 'testNameField');

            validateSelect(selects[4], 'Predicted Name Field', false);
            validateSelectFields(selects[4], false, 'testNameField');

            validateSelect(selects[5], 'Predicted Probability Field', false);
            validateSelectFields(selects[5], false, 'testSizeField');

            validateSelect(selects[6], 'Category Field', false);
            validateSelectFields(selects[6], false, 'testCategoryField');

            validateSelect(selects[7], 'Comparison Field', false);
            validateSelectFields(selects[7], false, 'testCategoryField');

            validateSelect(selects[8], 'Filter Field', false);
            validateSelectFields(selects[8], false, 'testFilterField');

            validateSelect(selects[9], 'ID Field', false);
            validateSelectFields(selects[9], false, 'testIdField');

            validateSelect(selects[10], 'Link Field', true);
            validateSelectFields(selects[10], true, 'testLinkField');

            validateSelect(selects[11], 'Sort Field', true);
            validateSelectFields(selects[11], true, 'testSortField');

            validateSelect(selects[12], 'Type Field', false);
            validateSelectFields(selects[12], false, 'testTypeField');

            let toggles = fixture.debugElement.queryAll(
                By.css('mat-sidenav-container mat-sidenav mat-card mat-card-content mat-button-toggle'));
            expect(toggles.length).toEqual(10);

            validateToggle(toggles[0], '', 'None', false);
            validateToggle(toggles[1], 'scale', 'Scale', false);
            validateToggle(toggles[2], 'crop', 'Crop', false);
            validateToggle(toggles[3], 'both', 'Both', true);
            validateToggle(toggles[4], true, 'Yes', true);
            validateToggle(toggles[5], false, 'No', false);
            validateToggle(toggles[6], true, 'Yes', false);
            validateToggle(toggles[7], false, 'No', true);
            validateToggle(toggles[8], false, 'Ascending', true);
            validateToggle(toggles[9], true, 'Descending', false);
        });
    }));
});
