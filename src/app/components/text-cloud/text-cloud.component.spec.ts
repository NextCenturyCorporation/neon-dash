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
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DatabaseMetaData, FieldMetaData, TableMetaData } from '../../dataset';

import { FormsModule } from '@angular/forms';
import { Injector } from '@angular/core';

import { ChartModule } from 'angular2-chartjs';

import { TextCloudComponent } from './text-cloud.component';
import { ExportControlComponent } from '../export-control/export-control.component';
import { ExportService } from '../../services/export.service';
import { ConnectionService } from '../../services/connection.service';
import { DatasetService } from '../../services/dataset.service';
import { TranslationService } from '../../services/translation.service';
import { FilterService } from '../../services/filter.service';
import { ThemesService } from '../../services/themes.service';
import { ErrorNotificationService } from '../../services/error-notification.service';
import { NeonGTDConfig } from '../../neon-gtd-config';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { AppMaterialModule } from '../../app.material.module';
import { UnsharedFilterComponent } from '../unshared-filter/unshared-filter.component';
import { VisualizationService } from '../../services/visualization.service';
import { neonMappings, neonVariables } from '../../neon-namespaces';

import * as neon from 'neon-framework';

class TestDatasetService extends DatasetService {
  constructor() {
    super(new NeonGTDConfig());
    let testDatabase = new DatabaseMetaData('testDatabase', 'Test Database');
    testDatabase.name = 'testName';
    testDatabase.tables = [
      new TableMetaData('testTable', 'Test Table', [
        new FieldMetaData('testDataField', 'Test Data Field'),
        new FieldMetaData('testSizeField', 'Test Size Field')
      ])
    ];
    this.setActiveDataset({
      databases: [testDatabase]
    });
  }
}

describe('Component: TextCloud', () => {
  let testConfig: NeonGTDConfig = new NeonGTDConfig();
  let component: TextCloudComponent;
  let fixture: ComponentFixture<TextCloudComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [
        TextCloudComponent,
        ExportControlComponent,
        UnsharedFilterComponent
      ],
      providers: [
        ConnectionService,
        DatasetService,
        FilterService,
        ExportService,
        TranslationService,
        VisualizationService,
        ErrorNotificationService,
        ThemesService,
        Injector,
        { provide: 'config', useValue: new NeonGTDConfig() }
      ],
      imports: [
        AppMaterialModule,
        FormsModule,
        ChartModule,
        BrowserAnimationsModule
      ]
    });
    fixture = TestBed.createComponent(TextCloudComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create an instance', (() => {
    expect(component).toBeTruthy();
  }));

  it('has expected active properties', (() => {
    expect(component.active).toEqual({
      dataField: new FieldMetaData(),
      sizeField: new FieldMetaData(),
      andFilters: true,
      limit: 40,
      textColor: '#111',
      allowsTranslations: true,
      filterable: true,
      data: [],
      count: 0
    });
  }));

  it('returns expected query from createQuery', (() => {
    component.meta.database = new DatabaseMetaData('testDatabase');
    component.meta.table = new TableMetaData('testTable');

    let query = new neon.query.Query().selectFrom('testDatabase', 'testTable');
    let whereClause;
    // Checks for an unshared filter in the config file.
    if (component.getOptionFromConfig('configFilter')) {
      whereClause = neon.query.where(component.getOptionFromConfig('configFilter').lhs,
        component.getOptionFromConfig('configFilter').operator,
        component.getOptionFromConfig('configFilter').rhs);
    } else if (component.hasUnsharedFilter()) {
      whereClause = neon.query.where(component.getOptionFromConfig('unsharedFilterField').columnName,
        '=', component.getOptionFromConfig('unsharedFilterValue'));
    } else {
      whereClause = neon.query.where(component.active.dataField.columnName, '!=', null);
    }
    let dataField = component.active.dataField.columnName;

    if (component.active.sizeField.columnName === '') {
      // Normal aggregation query
      query.where(whereClause).groupBy(dataField).aggregate(neonVariables.COUNT, '*', 'value')
        .sortBy('value', neonVariables.DESCENDING).limit(component.active.limit);
    } else {
      // Query for data with the size field and sort by it
      let sizeColumn = component.active.sizeField.columnName;
      query.where(neon.query.and(whereClause, neon.query.where(sizeColumn, '!=', null)))
        .groupBy(dataField).aggregate(neon.query[component.sizeAggregation], sizeColumn, sizeColumn)
        .sortBy(sizeColumn, neonVariables.DESCENDING).limit(component.active.limit);
    }

    expect(component.createQuery()).toEqual(query);

  }));

  it('has subNgOnDestroy function that does nothing', (() => {
    expect(component.subNgOnDestroy).toBeDefined();
  }));

  it('has subGetBindings function that updates the input bindings with specific config options', (() => {
    let bindings = {
      dataField: null,
      sizeField: null,
      sizeAggregation: null,
      limit: null
    };
    component.subGetBindings(bindings);
    expect(bindings.dataField).toEqual(component.active.dataField.columnName);
    expect(bindings.sizeField).toEqual(component.active.sizeField.columnName);
    expect(bindings.sizeAggregation).toEqual(component.sizeAggregation);
    expect(bindings.limit).toEqual(component.active.limit);
  }));

  it('has getExportFields function that updates the input bindings with specific config options', (() => {

    component.active.dataField.columnName = 'testDataField';
    component.active.dataField.prettyName = 'Test Data Field';
    component.active.sizeField.columnName = 'testSizeField';
    component.active.sizeField.prettyName = 'Test Size Field';

    expect(component.getExportFields()).toEqual([{
      columnName: 'testDataField',
      prettyName: 'Test Data Field'
    }, {
      columnName: 'value',
      prettyName: 'Test Size Field'
    }]);

  }));

  it('returns default options from getOptionFromConfig', (() => {
    expect(component.getOptionFromConfig('database')).toBeNull();
    expect(component.getOptionFromConfig('dataField')).toBeNull();
    expect(component.getOptionFromConfig('configFilter')).toBeNull();
    expect(component.getOptionFromConfig('table')).toBeNull();
    expect(component.getOptionFromConfig('title')).toBeNull();
    expect(component.getOptionFromConfig('unsharedFilterField')).toBeNull();
    expect(component.getOptionFromConfig('unsharedFilterValue')).toBeNull();
    expect(component.getOptionFromConfig('sizeField')).toBeNull();
    expect(component.getOptionFromConfig('sizeAggregation')).toEqual('AVG');
    expect(component.getOptionFromConfig('limit')).toEqual(40);

  }));

  it('has updateObject which correctly updates a field', (() => {
    let obj = component.updateObject(component.active, 'limit', 100);
    expect(obj.limit).toEqual(100);
  }));

  it('has updateArray which adds an element to an array', (() => {
    let arr = [1, 2, 3, 4];
    expect(component.updateArray(arr, 5)).toEqual([1, 2, 3, 4, 5]);
  }));

  it('has updateArray which adds an element to an array', (() => {
    let arr = [];
    expect(component.updateArray(arr, 5)).toEqual([5]);
  }));

  it('has onUpdateFields which updates dataField, sizeField', (() => {
      component.onUpdateFields();
      expect(component.getOptionFromConfig('dataField')).toEqual(component.findFieldObject('dataField', neonMappings.TAGS));
      expect(component.getOptionFromConfig('sizeField')).toEqual(component.findFieldObject('dataField', neonMappings.TAGS));
      // let dataField = this.findFieldObject('dataField', neonMappings.TAGS);
      // let sizeField = this.findFieldObject('sizeField', neonMappings.TAGS);
      // this.active = this.updateObject(this.active, 'dataField', dataField);
      // this.active = this.updateObject(this.active, 'sizeField', sizeField);
      // this.meta = Object.assign({}, this.meta); // trigger action
  }));
});
