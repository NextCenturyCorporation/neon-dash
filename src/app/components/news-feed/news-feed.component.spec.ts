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
import { async, ComponentFixture, inject, TestBed } from '@angular/core/testing';
import { DatabaseMetaData, FieldMetaData, TableMetaData } from '../../dataset';
import { FormsModule } from '@angular/forms';
import { Injector } from '@angular/core';
import { MockBackend } from '@angular/http/testing';
import { NeonGTDConfig } from '../../neon-gtd-config';

import {} from 'jasmine-core';
import * as neon from 'neon-framework';

import { ExportControlComponent } from '../export-control/export-control.component';

import { ActiveGridService } from '../../services/active-grid.service';
import { ConnectionService } from '../../services/connection.service';
import { DatasetService } from '../../services/dataset.service';
import { ErrorNotificationService } from '../../services/error-notification.service';
import { ExportService } from '../../services/export.service';
import { FilterService } from '../../services/filter.service';
import { ThemesService } from '../../services/themes.service';
import { VisualizationService } from '../../services/visualization.service';
import { initializeTestBed } from '../../../testUtils/initializeTestBed';
import { NewsFeedComponent } from './news-feed.component';
import { FilterServiceMock } from '../../../testUtils/MockServices/FilterServiceMock';
import { neonVariables } from '../../neon-namespaces';

describe('Component: NewsFeed', () => {
    let component: NewsFeedComponent;
    let fixture: ComponentFixture<NewsFeedComponent>;
    let getService = (type: any) => fixture.debugElement.injector.get(type);

    //may need to add or remove some initializations (coppied from media-viewer.component)
    initializeTestBed({
        declarations: [
            NewsFeedComponent,
            ExportControlComponent
        ],
        providers: [
            ActiveGridService,
            ConnectionService,
            DatasetService,
            ExportService,
            ErrorNotificationService,
            { provide: FilterService, useClass: FilterServiceMock },
            ThemesService,
            VisualizationService,
            Injector,
            { provide: 'config', useValue: new NeonGTDConfig() }
        ],
        imports: [
            AppMaterialModule,
            BrowserAnimationsModule,
            FormsModule
        ]
    });

    //may need to change further
    beforeEach(() => {
        fixture = TestBed.createComponent(NewsFeedComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    //checks if all class properties are there
    it('does have expected class options properties', () => {
        expect(component.options.id).toEqual('');
        expect(component.options.ignoreSelf).toEqual(false);
        expect(component.options.contentField).toEqual(component.emptyField);
        expect(component.options.dateField).toEqual(component.emptyField);
        expect(component.options.filterField).toEqual(component.emptyField);
        expect(component.options.idField).toEqual(component.emptyField);
        expect(component.options.linkField).toEqual(component.emptyField);
        expect(component.options.primaryTitleField).toEqual(component.emptyField);
        expect(component.options.secondaryTitleField).toEqual(component.emptyField);
        expect(component.options.sortField).toEqual(component.emptyField);
    });

    //checks if component exists
    it('exists', () => {
        expect(component).toBeTruthy();
    });

    // //for create Filter method
    // it('createFilter does create Neon and visualization filters for the text', () => {

    // });

    //for create query method
    it('createQuery does return expected query', (() => {
        component.options.database = new DatabaseMetaData('testDatabase');
        component.options.id = 'testId';
        component.options.idField = new FieldMetaData('testIdField');
        component.options.sortField = new FieldMetaData('testSortField');
        component.options.primaryTitleField = new FieldMetaData('testPrimaryTitleField');
        component.options.secondaryTitleField = new FieldMetaData('testSecondaryTitleField');
        component.options.filterField = new FieldMetaData('testFilterField');
        component.options.contentField = new FieldMetaData('testContentField');
        component.options.dateField = new FieldMetaData('testDateField');

        let query = new neon.query.Query()
            .selectFrom('testDatabase', 'testTable')
            .withFields(['testIdField', 'testSortField', 'testPrimaryTitleField', 'testSecondaryTitleField', 
            'testFilterField', 'testContentField', 'testDateField'])
            .sortBy('testSortField', neonVariables.DESCENDING);

        let whereClauses = [
            neon.query.where('testIdField', '!=', null),
            neon.query.where('testIdField', '!=', '')
        ];

        query.where(neon.query.and.apply(query, whereClauses));

        expect(component.createQuery()).toEqual(query);
    }));

    // //for filter exists method
    // it('filterExists does return whether a visualization filter exists in the list of filters', () => {

    // });

    // //for get button text method
    // it('getButton does return the expected string', () =>{

    // });

    // //for go to next page method
    // it('goToNextPage does increase the page and update the bar chart', () =>{

    // });

    // //for go to previous page method
    // it('goToPreviousPage does decrease the page and update the bar chart', () =>{

    // });

    // //for update page data method
    // it('updatePageData does update the last pageand the bar chart', () =>{

    // });

    // //for getCloseableFilters method
    // it('getCloseableFilters does return the expected list', () =>{

    // });

    // //... more methods to test

});
