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
import { ComponentFixture, fakeAsync, inject, tick } from '@angular/core/testing';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { HttpTestingController, HttpClientTestingModule } from '@angular/common/http/testing';
import { Injectable } from '@angular/core';

import { AbstractSearchService, CompoundFilterType } from './abstract.search.service';
import { DatasetService } from './dataset.service';
import {
    CompoundFilterDesign,
    DualListFilterCollection,
    FilterBehavior,
    FilterDataSource,
    FilterService,
    FilterUtil,
    SimpleFilterDesign,
    SingleListFilterCollection
} from './filter.service';

import { FieldMetaData } from '../dataset';
import { NeonGTDConfig } from '../neon-gtd-config';
import { neonEvents } from '../neon-namespaces';

import { DatasetServiceMock } from '../../testUtils/MockServices/DatasetServiceMock';
import { SearchServiceMock } from '../../testUtils/MockServices/SearchServiceMock';
import { initializeTestBed } from '../../testUtils/initializeTestBed';

import * as neon from 'neon-framework';

describe('FilterUtil', () => {
    beforeAll(() => {
        /* tslint:disable:no-console */
        console.log('STARTING FILTER UTIL TESTS...');
        /* tslint:enable:no-console */
    });

    it('areFilterDataSourcesEquivalent should return expected boolean', () => {
        expect(FilterUtil.areFilterDataSourcesEquivalent({
            datastoreName: 'datastore1',
            databaseName: 'database1',
            tableName: 'table1',
            fieldName: 'field1',
            operator: '='
        } as FilterDataSource, {
            datastoreName: 'datastore2',
            databaseName: 'database1',
            tableName: 'table1',
            fieldName: 'field1',
            operator: '='
        } as FilterDataSource)).toEqual(false);

        expect(FilterUtil.areFilterDataSourcesEquivalent({
            datastoreName: 'datastore1',
            databaseName: 'database1',
            tableName: 'table1',
            fieldName: 'field1',
            operator: '='
        } as FilterDataSource, {
            datastoreName: 'datastore1',
            databaseName: 'database2',
            tableName: 'table1',
            fieldName: 'field1',
            operator: '='
        } as FilterDataSource)).toEqual(false);

        expect(FilterUtil.areFilterDataSourcesEquivalent({
            datastoreName: 'datastore1',
            databaseName: 'database1',
            tableName: 'table1',
            fieldName: 'field1',
            operator: '='
        } as FilterDataSource, {
            datastoreName: 'datastore1',
            databaseName: 'database1',
            tableName: 'table2',
            fieldName: 'field1',
            operator: '='
        } as FilterDataSource)).toEqual(false);

        expect(FilterUtil.areFilterDataSourcesEquivalent({
            datastoreName: 'datastore1',
            databaseName: 'database1',
            tableName: 'table1',
            fieldName: 'field1',
            operator: '='
        } as FilterDataSource, {
            datastoreName: 'datastore1',
            databaseName: 'database1',
            tableName: 'table1',
            fieldName: 'field2',
            operator: '='
        } as FilterDataSource)).toEqual(false);

        expect(FilterUtil.areFilterDataSourcesEquivalent({
            datastoreName: 'datastore1',
            databaseName: 'database1',
            tableName: 'table1',
            fieldName: 'field1',
            operator: '='
        } as FilterDataSource, {
            datastoreName: 'datastore1',
            databaseName: 'database1',
            tableName: 'table1',
            fieldName: 'field1',
            operator: 'contains'
        } as FilterDataSource)).toEqual(false);

        expect(FilterUtil.areFilterDataSourcesEquivalent({
            datastoreName: 'datastore1',
            databaseName: 'database1',
            tableName: 'table1',
            fieldName: 'field1',
            operator: '='
        } as FilterDataSource, {
            datastoreName: 'datastore1',
            databaseName: 'database1',
            tableName: 'table1',
            fieldName: 'field1',
            operator: '='
        } as FilterDataSource)).toEqual(true);
    });

    it('areFilterDataSourcesEquivalent with ignoreOperator=true should return expected boolean', () => {
        expect(FilterUtil.areFilterDataSourcesEquivalent({
            datastoreName: 'datastore1',
            databaseName: 'database1',
            tableName: 'table1',
            fieldName: 'field1',
            operator: '='
        } as FilterDataSource, {
            datastoreName: 'datastore1',
            databaseName: 'database1',
            tableName: 'table1',
            fieldName: 'field1',
            operator: 'contains'
        } as FilterDataSource, true)).toEqual(true);
    });

    it('areFilterDataSourceListsEquivalent should return expected boolean', () => {
        expect(FilterUtil.areFilterDataSourceListsEquivalent([{
            datastoreName: 'datastore1',
            databaseName: 'database1',
            tableName: 'table1',
            fieldName: 'field1',
            operator: '='
        } as FilterDataSource], [{
            datastoreName: 'datastore1',
            databaseName: 'database1',
            tableName: 'table1',
            fieldName: 'field1',
            operator: '='
        } as FilterDataSource])).toEqual(true);

        expect(FilterUtil.areFilterDataSourceListsEquivalent([{
            datastoreName: 'datastore1',
            databaseName: 'database1',
            tableName: 'table1',
            fieldName: 'field1',
            operator: '='
        } as FilterDataSource], [{
            datastoreName: 'datastore1',
            databaseName: 'database1',
            tableName: 'table1',
            fieldName: 'field1',
            operator: 'contains'
        } as FilterDataSource])).toEqual(false);

        expect(FilterUtil.areFilterDataSourceListsEquivalent([{
            datastoreName: 'datastore1',
            databaseName: 'database1',
            tableName: 'table1',
            fieldName: 'field1',
            operator: '='
        } as FilterDataSource], [{
            datastoreName: 'datastore1',
            databaseName: 'database1',
            tableName: 'table1',
            fieldName: 'field1',
            operator: '='
        } as FilterDataSource, {
            datastoreName: 'datastore1',
            databaseName: 'database1',
            tableName: 'table1',
            fieldName: 'field1',
            operator: 'contains'
        } as FilterDataSource])).toEqual(false);

        expect(FilterUtil.areFilterDataSourceListsEquivalent([{
            datastoreName: 'datastore1',
            databaseName: 'database1',
            tableName: 'table1',
            fieldName: 'field1',
            operator: '='
        } as FilterDataSource, {
            datastoreName: 'datastore1',
            databaseName: 'database1',
            tableName: 'table1',
            fieldName: 'field1',
            operator: 'contains'
        } as FilterDataSource], [{
            datastoreName: 'datastore1',
            databaseName: 'database1',
            tableName: 'table1',
            fieldName: 'field1',
            operator: 'contains'
        } as FilterDataSource])).toEqual(false);

        expect(FilterUtil.areFilterDataSourceListsEquivalent([{
            datastoreName: 'datastore1',
            databaseName: 'database1',
            tableName: 'table1',
            fieldName: 'field1',
            operator: '='
        } as FilterDataSource, {
            datastoreName: 'datastore1',
            databaseName: 'database1',
            tableName: 'table1',
            fieldName: 'field1',
            operator: 'contains'
        } as FilterDataSource], [{
            datastoreName: 'datastore1',
            databaseName: 'database1',
            tableName: 'table1',
            fieldName: 'field1',
            operator: '='
        } as FilterDataSource, {
            datastoreName: 'datastore1',
            databaseName: 'database1',
            tableName: 'table1',
            fieldName: 'field1',
            operator: 'contains'
        } as FilterDataSource])).toEqual(true);

        expect(FilterUtil.areFilterDataSourceListsEquivalent([{
            datastoreName: 'datastore1',
            databaseName: 'database1',
            tableName: 'table1',
            fieldName: 'field1',
            operator: '='
        } as FilterDataSource, {
            datastoreName: 'datastore1',
            databaseName: 'database1',
            tableName: 'table1',
            fieldName: 'field1',
            operator: 'contains'
        } as FilterDataSource], [{
            datastoreName: 'datastore1',
            databaseName: 'database1',
            tableName: 'table1',
            fieldName: 'field1',
            operator: 'contains'
        } as FilterDataSource, {
            datastoreName: 'datastore1',
            databaseName: 'database1',
            tableName: 'table1',
            fieldName: 'field1',
            operator: '='
        } as FilterDataSource])).toEqual(true);
    });

    it('createFilterDataSourceListFromDesign should return expected array', () => {
        expect(FilterUtil.createFilterDataSourceListFromDesign({
            datastore: 'testDatastore1',
            database: DatasetServiceMock.DATABASES[0],
            table: DatasetServiceMock.TABLES[0],
            field: DatasetServiceMock.ID_FIELD,
            operator: '=',
            value: 'testId'
        } as SimpleFilterDesign)).toEqual([{
            datastoreName: 'testDatastore1',
            databaseName: 'testDatabase1',
            tableName: 'testTable1',
            fieldName: 'testIdField',
            operator: '='
        } as FilterDataSource]);

        expect(FilterUtil.createFilterDataSourceListFromDesign({
            type: 'or',
            filters: [{
                datastore: 'testDatastore1',
                database: DatasetServiceMock.DATABASES[0],
                table: DatasetServiceMock.TABLES[0],
                field: DatasetServiceMock.X_FIELD,
                operator: '>',
                value: 10
            } as SimpleFilterDesign, {
                datastore: 'testDatastore1',
                database: DatasetServiceMock.DATABASES[0],
                table: DatasetServiceMock.TABLES[0],
                field: DatasetServiceMock.X_FIELD,
                operator: '<',
                value: 20
            } as SimpleFilterDesign]
        } as CompoundFilterDesign)).toEqual([{
            datastoreName: 'testDatastore1',
            databaseName: 'testDatabase1',
            tableName: 'testTable1',
            fieldName: 'testXField',
            operator: '>'
        } as FilterDataSource, {
            datastoreName: 'testDatastore1',
            databaseName: 'testDatabase1',
            tableName: 'testTable1',
            fieldName: 'testXField',
            operator: '<'
        } as FilterDataSource]);

        expect(FilterUtil.createFilterDataSourceListFromDesign({
            type: 'or',
            filters: [{
                datastore: 'testDatastore1',
                database: DatasetServiceMock.DATABASES[0],
                table: DatasetServiceMock.TABLES[0],
                field: DatasetServiceMock.X_FIELD,
                operator: '=',
                value: 10
            } as SimpleFilterDesign, {
                datastore: 'testDatastore1',
                database: DatasetServiceMock.DATABASES[0],
                table: DatasetServiceMock.TABLES[0],
                field: DatasetServiceMock.Y_FIELD,
                operator: '=',
                value: 20
            } as SimpleFilterDesign]
        } as CompoundFilterDesign)).toEqual([{
            datastoreName: 'testDatastore1',
            databaseName: 'testDatabase1',
            tableName: 'testTable1',
            fieldName: 'testXField',
            operator: '='
        } as FilterDataSource, {
            datastoreName: 'testDatastore1',
            databaseName: 'testDatabase1',
            tableName: 'testTable1',
            fieldName: 'testYField',
            operator: '='
        } as FilterDataSource]);

        expect(FilterUtil.createFilterDataSourceListFromDesign({
            type: 'or',
            filters: [{
                datastore: 'testDatastore1',
                database: DatasetServiceMock.DATABASES[0],
                table: DatasetServiceMock.TABLES[0],
                field: DatasetServiceMock.ID_FIELD,
                operator: '=',
                value: 'testId'
            } as SimpleFilterDesign, {
                type: 'or',
                filters: [{
                    datastore: 'testDatastore1',
                    database: DatasetServiceMock.DATABASES[0],
                    table: DatasetServiceMock.TABLES[0],
                    field: DatasetServiceMock.X_FIELD,
                    operator: '=',
                    value: 10
                } as SimpleFilterDesign, {
                    datastore: 'testDatastore1',
                    database: DatasetServiceMock.DATABASES[0],
                    table: DatasetServiceMock.TABLES[0],
                    field: DatasetServiceMock.Y_FIELD,
                    operator: '=',
                    value: 20
                } as SimpleFilterDesign]
            } as CompoundFilterDesign]
        } as CompoundFilterDesign)).toEqual([{
            datastoreName: 'testDatastore1',
            databaseName: 'testDatabase1',
            tableName: 'testTable1',
            fieldName: 'testIdField',
            operator: '='
        } as FilterDataSource, {
            datastoreName: 'testDatastore1',
            databaseName: 'testDatabase1',
            tableName: 'testTable1',
            fieldName: 'testXField',
            operator: '='
        } as FilterDataSource, {
            datastoreName: 'testDatastore1',
            databaseName: 'testDatabase1',
            tableName: 'testTable1',
            fieldName: 'testYField',
            operator: '='
        } as FilterDataSource]);
    });

    it('createFilterDataSourceListFromDesign should ignore clauses in compound filters with equivalent non-value properties', () => {
        expect(FilterUtil.createFilterDataSourceListFromDesign({
            type: 'or',
            filters: [{
                datastore: 'testDatastore1',
                database: DatasetServiceMock.DATABASES[0],
                table: DatasetServiceMock.TABLES[0],
                field: DatasetServiceMock.ID_FIELD,
                operator: '=',
                value: 'testId1'
            } as SimpleFilterDesign, {
                datastore: 'testDatastore1',
                database: DatasetServiceMock.DATABASES[0],
                table: DatasetServiceMock.TABLES[0],
                field: DatasetServiceMock.ID_FIELD,
                operator: '=',
                value: 'testId2'
            } as SimpleFilterDesign]
        } as CompoundFilterDesign)).toEqual([{
            datastoreName: 'testDatastore1',
            databaseName: 'testDatabase1',
            tableName: 'testTable1',
            fieldName: 'testIdField',
            operator: '='
        } as FilterDataSource]);

        expect(FilterUtil.createFilterDataSourceListFromDesign({
            type: 'or',
            filters: [{
                type: 'or',
                filters: [{
                    datastore: 'testDatastore1',
                    database: DatasetServiceMock.DATABASES[0],
                    table: DatasetServiceMock.TABLES[0],
                    field: DatasetServiceMock.X_FIELD,
                    operator: '=',
                    value: 10
                } as SimpleFilterDesign, {
                    datastore: 'testDatastore1',
                    database: DatasetServiceMock.DATABASES[0],
                    table: DatasetServiceMock.TABLES[0],
                    field: DatasetServiceMock.Y_FIELD,
                    operator: '=',
                    value: 20
                } as SimpleFilterDesign]
            } as CompoundFilterDesign, {
                type: 'or',
                filters: [{
                    datastore: 'testDatastore1',
                    database: DatasetServiceMock.DATABASES[0],
                    table: DatasetServiceMock.TABLES[0],
                    field: DatasetServiceMock.X_FIELD,
                    operator: '=',
                    value: 30
                } as SimpleFilterDesign, {
                    datastore: 'testDatastore1',
                    database: DatasetServiceMock.DATABASES[0],
                    table: DatasetServiceMock.TABLES[0],
                    field: DatasetServiceMock.Y_FIELD,
                    operator: '=',
                    value: 40
                } as SimpleFilterDesign]
            } as CompoundFilterDesign]
        } as CompoundFilterDesign)).toEqual([{
            datastoreName: 'testDatastore1',
            databaseName: 'testDatabase1',
            tableName: 'testTable1',
            fieldName: 'testXField',
            operator: '='
        } as FilterDataSource, {
            datastoreName: 'testDatastore1',
            databaseName: 'testDatabase1',
            tableName: 'testTable1',
            fieldName: 'testYField',
            operator: '='
        } as FilterDataSource]);
    });

    it('createFilterDataSourceListFromDesign with ignoreOperator=true should ignore operator properties', () => {
        expect(FilterUtil.createFilterDataSourceListFromDesign({
            type: 'or',
            filters: [{
                datastore: 'testDatastore1',
                database: DatasetServiceMock.DATABASES[0],
                table: DatasetServiceMock.TABLES[0],
                field: DatasetServiceMock.X_FIELD,
                operator: '>',
                value: 10
            } as SimpleFilterDesign, {
                datastore: 'testDatastore1',
                database: DatasetServiceMock.DATABASES[0],
                table: DatasetServiceMock.TABLES[0],
                field: DatasetServiceMock.X_FIELD,
                operator: '<',
                value: 20
            } as SimpleFilterDesign]
        } as CompoundFilterDesign, true)).toEqual([{
            datastoreName: 'testDatastore1',
            databaseName: 'testDatabase1',
            tableName: 'testTable1',
            fieldName: 'testXField',
            operator: undefined
        } as FilterDataSource]);

        expect(FilterUtil.createFilterDataSourceListFromDesign({
            type: 'or',
            filters: [{
                type: 'or',
                filters: [{
                    datastore: 'testDatastore1',
                    database: DatasetServiceMock.DATABASES[0],
                    table: DatasetServiceMock.TABLES[0],
                    field: DatasetServiceMock.X_FIELD,
                    operator: '=',
                    value: 10
                } as SimpleFilterDesign, {
                    datastore: 'testDatastore1',
                    database: DatasetServiceMock.DATABASES[0],
                    table: DatasetServiceMock.TABLES[0],
                    field: DatasetServiceMock.Y_FIELD,
                    operator: '=',
                    value: 20
                } as SimpleFilterDesign]
            } as CompoundFilterDesign, {
                type: 'or',
                filters: [{
                    datastore: 'testDatastore1',
                    database: DatasetServiceMock.DATABASES[0],
                    table: DatasetServiceMock.TABLES[0],
                    field: DatasetServiceMock.X_FIELD,
                    operator: '!=',
                    value: 30
                } as SimpleFilterDesign, {
                    datastore: 'testDatastore1',
                    database: DatasetServiceMock.DATABASES[0],
                    table: DatasetServiceMock.TABLES[0],
                    field: DatasetServiceMock.Y_FIELD,
                    operator: '!=',
                    value: 40
                } as SimpleFilterDesign]
            } as CompoundFilterDesign]
        } as CompoundFilterDesign, true)).toEqual([{
            datastoreName: 'testDatastore1',
            databaseName: 'testDatabase1',
            tableName: 'testTable1',
            fieldName: 'testXField',
            operator: undefined
        } as FilterDataSource, {
            datastoreName: 'testDatastore1',
            databaseName: 'testDatabase1',
            tableName: 'testTable1',
            fieldName: 'testYField',
            operator: undefined
        } as FilterDataSource]);
    });

    it('isCompoundFilterDesign should return expected boolean', () => {
        expect(FilterUtil.isCompoundFilterDesign({
            datastore: 'testDatastore1',
            database: DatasetServiceMock.DATABASES[0],
            table: DatasetServiceMock.TABLES[0],
            field: DatasetServiceMock.ID_FIELD,
            operator: '=',
            value: 'testId'
        } as SimpleFilterDesign)).toEqual(false);

        expect(FilterUtil.isCompoundFilterDesign({
            type: 'or',
            filters: [{
                datastore: 'testDatastore1',
                database: DatasetServiceMock.DATABASES[0],
                table: DatasetServiceMock.TABLES[0],
                field: DatasetServiceMock.ID_FIELD,
                operator: '=',
                value: 'testId1'
            } as SimpleFilterDesign, {
                datastore: 'testDatastore1',
                database: DatasetServiceMock.DATABASES[0],
                table: DatasetServiceMock.TABLES[0],
                field: DatasetServiceMock.ID_FIELD,
                operator: '=',
                value: 'testId2'
            } as SimpleFilterDesign]
        } as CompoundFilterDesign)).toEqual(true);
    });

    it('isSimpleFilterDesign should return expected boolean', () => {
        expect(FilterUtil.isSimpleFilterDesign({
            datastore: 'testDatastore1',
            database: DatasetServiceMock.DATABASES[0],
            table: DatasetServiceMock.TABLES[0],
            field: DatasetServiceMock.ID_FIELD,
            operator: '=',
            value: 'testId'
        } as SimpleFilterDesign)).toEqual(true);

        expect(FilterUtil.isSimpleFilterDesign({
            type: 'or',
            filters: [{
                datastore: 'testDatastore1',
                database: DatasetServiceMock.DATABASES[0],
                table: DatasetServiceMock.TABLES[0],
                field: DatasetServiceMock.ID_FIELD,
                operator: '=',
                value: 'testId1'
            } as SimpleFilterDesign, {
                datastore: 'testDatastore1',
                database: DatasetServiceMock.DATABASES[0],
                table: DatasetServiceMock.TABLES[0],
                field: DatasetServiceMock.ID_FIELD,
                operator: '=',
                value: 'testId2'
            } as SimpleFilterDesign]
        } as CompoundFilterDesign)).toEqual(false);
    });
});

describe('SingleListFilterCollection', () => {
    let singleListCollection: SingleListFilterCollection;
    let searchService: AbstractSearchService;
    let source1: FilterDataSource[];
    let source2: FilterDataSource[];
    let filter1A: any;
    let filter1B: any;
    let filter2A: any;

    initializeTestBed('Single List Filter Collection', {
        providers: [
            { provide: AbstractSearchService, useClass: SearchServiceMock }
        ]
    });

    beforeEach(inject([AbstractSearchService], (_searchService) => {
        searchService = _searchService;
        source1 = [{
            datastoreName: 'testDatastore1',
            databaseName: DatasetServiceMock.DATABASES[0].name,
            tableName: DatasetServiceMock.TABLES[0].name,
            fieldName: DatasetServiceMock.ID_FIELD.columnName,
            operator: '='
        } as FilterDataSource];
        source2 = [{
            datastoreName: 'testDatastore1',
            databaseName: DatasetServiceMock.DATABASES[0].name,
            tableName: DatasetServiceMock.TABLES[0].name,
            fieldName: DatasetServiceMock.SIZE_FIELD.columnName,
            operator: '>'
        } as FilterDataSource, {
            datastoreName: 'testDatastore1',
            databaseName: DatasetServiceMock.DATABASES[0].name,
            tableName: DatasetServiceMock.TABLES[0].name,
            fieldName: DatasetServiceMock.SIZE_FIELD.columnName,
            operator: '<'
        } as FilterDataSource];
        filter1A = FilterUtil.createFilterFromDesign({
            datastore: 'testDatastore1',
            database: DatasetServiceMock.DATABASES[0],
            table: DatasetServiceMock.TABLES[0],
            field: DatasetServiceMock.ID_FIELD,
            operator: '=',
            value: 'testId1'
        } as SimpleFilterDesign, searchService);
        filter1B = FilterUtil.createFilterFromDesign({
            datastore: 'testDatastore1',
            database: DatasetServiceMock.DATABASES[0],
            table: DatasetServiceMock.TABLES[0],
            field: DatasetServiceMock.ID_FIELD,
            operator: '=',
            value: 'testId2'
        } as SimpleFilterDesign, searchService);
        filter2A = FilterUtil.createFilterFromDesign({
            type: 'and',
            filters: [{
                datastore: 'testDatastore1',
                database: DatasetServiceMock.DATABASES[0],
                table: DatasetServiceMock.TABLES[0],
                field: DatasetServiceMock.SIZE_FIELD,
                operator: '>',
                value: 10
            } as SimpleFilterDesign, {
                datastore: 'testDatastore1',
                database: DatasetServiceMock.DATABASES[0],
                table: DatasetServiceMock.TABLES[0],
                field: DatasetServiceMock.SIZE_FIELD,
                operator: '<',
                value: 20
            } as SimpleFilterDesign]
        } as CompoundFilterDesign, searchService);
        singleListCollection = new SingleListFilterCollection();
        (singleListCollection as any).data.set(source1, [filter1A, filter1B]);
        (singleListCollection as any).data.set(source2, [filter2A]);
    }));

    it('data of new collection should be empty', () => {
        let testCollection = new SingleListFilterCollection();
        expect((testCollection as any).data.size).toEqual(0);
    });

    it('findFilterDataSources should return data source from collection', () => {
        expect(singleListCollection.findFilterDataSources({
            datastore: 'testDatastore1',
            database: DatasetServiceMock.DATABASES[0],
            table: DatasetServiceMock.TABLES[0],
            field: DatasetServiceMock.ID_FIELD,
            operator: '=',
            value: 'testId1'
        } as SimpleFilterDesign)).toEqual(source1);

        expect(singleListCollection.findFilterDataSources({
            type: 'and',
            filters: [{
                datastore: 'testDatastore1',
                database: DatasetServiceMock.DATABASES[0],
                table: DatasetServiceMock.TABLES[0],
                field: DatasetServiceMock.SIZE_FIELD,
                operator: '>',
                value: 10
            } as SimpleFilterDesign, {
                datastore: 'testDatastore1',
                database: DatasetServiceMock.DATABASES[0],
                table: DatasetServiceMock.TABLES[0],
                field: DatasetServiceMock.SIZE_FIELD,
                operator: '<',
                value: 20
            } as SimpleFilterDesign]
        } as CompoundFilterDesign)).toEqual(source2);
    });

    it('findFilterDataSources should return new data source and add to collection', () => {
        let actual = singleListCollection.findFilterDataSources({
            datastore: 'testDatastore1',
            database: DatasetServiceMock.DATABASES[0],
            table: DatasetServiceMock.TABLES[0],
            field: DatasetServiceMock.ID_FIELD,
            operator: '!=',
            value: 'testId1'
        } as SimpleFilterDesign);

        expect(actual).toEqual([{
            datastoreName: 'testDatastore1',
            databaseName: DatasetServiceMock.DATABASES[0].name,
            tableName: DatasetServiceMock.TABLES[0].name,
            fieldName: DatasetServiceMock.ID_FIELD.columnName,
            operator: '!='
        } as FilterDataSource]);

        expect((singleListCollection as any).data.get(actual)).toEqual([]);
    });

    it('getDataSources should return expected array', () => {
        expect(singleListCollection.getDataSources()).toEqual([source1, source2]);

        let testDataSource = [{
            datastoreName: 'testDatastore1',
            databaseName: DatasetServiceMock.DATABASES[0].name,
            tableName: DatasetServiceMock.TABLES[0].name,
            fieldName: DatasetServiceMock.ID_FIELD.columnName,
            operator: '!='
        } as FilterDataSource];

        (singleListCollection as any).data.set(testDataSource, []);

        expect(singleListCollection.getDataSources()).toEqual([source1, source2, testDataSource]);
    });

    it('getFilters should create and return empty array if data source is not in collection', () => {
        // Different datastore
        let testDataSource1 = [{
            datastoreName: 'testDatastore2',
            databaseName: DatasetServiceMock.DATABASES[0].name,
            tableName: DatasetServiceMock.TABLES[0].name,
            fieldName: DatasetServiceMock.ID_FIELD.columnName,
            operator: '='
        } as FilterDataSource];

        // Different database
        let testDataSource2 = [{
            datastoreName: 'testDatastore1',
            databaseName: DatasetServiceMock.DATABASES[1].name,
            tableName: DatasetServiceMock.TABLES[0].name,
            fieldName: DatasetServiceMock.ID_FIELD.columnName,
            operator: '='
        } as FilterDataSource];

        // Different table
        let testDataSource3 = [{
            datastoreName: 'testDatastore1',
            databaseName: DatasetServiceMock.DATABASES[0].name,
            tableName: DatasetServiceMock.TABLES[1].name,
            fieldName: DatasetServiceMock.ID_FIELD.columnName,
            operator: '='
        } as FilterDataSource];

        // Different field
        let testDataSource4 = [{
            datastoreName: 'testDatastore1',
            databaseName: DatasetServiceMock.DATABASES[0].name,
            tableName: DatasetServiceMock.TABLES[0].name,
            fieldName: DatasetServiceMock.TEXT_FIELD.columnName,
            operator: '='
        } as FilterDataSource];

        // Different operator
        let testDataSource5 = [{
            datastoreName: 'testDatastore1',
            databaseName: DatasetServiceMock.DATABASES[0].name,
            tableName: DatasetServiceMock.TABLES[0].name,
            fieldName: DatasetServiceMock.ID_FIELD.columnName,
            operator: '!='
        } as FilterDataSource];

        // Different operators (compound)
        let testDataSource6 = [{
            datastoreName: 'testDatastore1',
            databaseName: DatasetServiceMock.DATABASES[0].name,
            tableName: DatasetServiceMock.TABLES[0].name,
            fieldName: DatasetServiceMock.SIZE_FIELD.columnName,
            operator: '='
        } as FilterDataSource, {
            datastoreName: 'testDatastore1',
            databaseName: DatasetServiceMock.DATABASES[0].name,
            tableName: DatasetServiceMock.TABLES[0].name,
            fieldName: DatasetServiceMock.SIZE_FIELD.columnName,
            operator: '!='
        } as FilterDataSource];

        expect(singleListCollection.getFilters(testDataSource1)).toEqual([]);
        expect(singleListCollection.getFilters(testDataSource2)).toEqual([]);
        expect(singleListCollection.getFilters(testDataSource3)).toEqual([]);
        expect(singleListCollection.getFilters(testDataSource4)).toEqual([]);
        expect(singleListCollection.getFilters(testDataSource5)).toEqual([]);
        expect(singleListCollection.getFilters(testDataSource6)).toEqual([]);

        expect((singleListCollection as any).data.get(testDataSource1)).toEqual([]);
        expect((singleListCollection as any).data.get(testDataSource2)).toEqual([]);
        expect((singleListCollection as any).data.get(testDataSource3)).toEqual([]);
        expect((singleListCollection as any).data.get(testDataSource4)).toEqual([]);
        expect((singleListCollection as any).data.get(testDataSource5)).toEqual([]);
        expect((singleListCollection as any).data.get(testDataSource6)).toEqual([]);
    });

    it('getFilters should return array from identical data source object in collection', () => {
        expect(singleListCollection.getFilters(source1)).toEqual([filter1A, filter1B]);
        expect(singleListCollection.getFilters(source2)).toEqual([filter2A]);
    });

    it('getFilters should return array from similar data source object in collection', () => {
        let testDataSource1 = [{
            datastoreName: 'testDatastore1',
            databaseName: DatasetServiceMock.DATABASES[0].name,
            tableName: DatasetServiceMock.TABLES[0].name,
            fieldName: DatasetServiceMock.ID_FIELD.columnName,
            operator: '='
        } as FilterDataSource];

        let testDataSource2 = [{
            datastoreName: 'testDatastore1',
            databaseName: DatasetServiceMock.DATABASES[0].name,
            tableName: DatasetServiceMock.TABLES[0].name,
            fieldName: DatasetServiceMock.SIZE_FIELD.columnName,
            operator: '>'
        } as FilterDataSource, {
            datastoreName: 'testDatastore1',
            databaseName: DatasetServiceMock.DATABASES[0].name,
            tableName: DatasetServiceMock.TABLES[0].name,
            fieldName: DatasetServiceMock.SIZE_FIELD.columnName,
            operator: '<'
        } as FilterDataSource];

        expect(singleListCollection.getFilters(testDataSource1)).toEqual([filter1A, filter1B]);
        expect(singleListCollection.getFilters(testDataSource2)).toEqual([filter2A]);

        expect((singleListCollection as any).data.has(testDataSource1)).toEqual(false);
        expect((singleListCollection as any).data.has(testDataSource2)).toEqual(false);
    });

    it('setFilters should save filters with input data source if it is not in collection', () => {
        let testDataSource = [{
            datastoreName: 'testDatastore1',
            databaseName: DatasetServiceMock.DATABASES[0].name,
            tableName: DatasetServiceMock.TABLES[0].name,
            fieldName: DatasetServiceMock.ID_FIELD.columnName,
            operator: '!='
        } as FilterDataSource];

        let testFilter = FilterUtil.createFilterFromDesign({
            datastore: 'testDatastore1',
            database: DatasetServiceMock.DATABASES[0],
            table: DatasetServiceMock.TABLES[0],
            field: DatasetServiceMock.ID_FIELD,
            operator: '!=',
            value: 'testId'
        } as SimpleFilterDesign, searchService);

        expect(singleListCollection.setFilters(testDataSource, [testFilter], searchService)).toEqual(testDataSource);
        expect((singleListCollection as any).data.get(testDataSource)).toEqual([testFilter]);

        expect(singleListCollection.setFilters(testDataSource, [], searchService)).toEqual(testDataSource);
        expect((singleListCollection as any).data.get(testDataSource)).toEqual([]);
    });

    it('setFilters should save filters with identical data source object in collection', () => {
        expect(singleListCollection.setFilters(source1, [filter1A], searchService)).toEqual(source1);
        expect((singleListCollection as any).data.get(source1)).toEqual([filter1A]);

        expect(singleListCollection.setFilters(source1, [], searchService)).toEqual(source1);
        expect((singleListCollection as any).data.get(source1)).toEqual([]);

        let testFilter = FilterUtil.createFilterFromDesign({
            datastore: 'testDatastore1',
            database: DatasetServiceMock.DATABASES[0],
            table: DatasetServiceMock.TABLES[0],
            field: DatasetServiceMock.ID_FIELD,
            operator: '=',
            value: 'testId'
        } as SimpleFilterDesign, searchService);

        expect(singleListCollection.setFilters(source1, [testFilter], searchService)).toEqual(source1);
        expect((singleListCollection as any).data.get(source1)).toEqual([testFilter]);

        expect(singleListCollection.setFilters(source1, [filter1A, testFilter], searchService)).toEqual(source1);
        expect((singleListCollection as any).data.get(source1)).toEqual([filter1A, testFilter]);
    });

    it('setFilters should save filters with similar data source object in collection', () => {
        let testDataSource = [{
            datastoreName: 'testDatastore1',
            databaseName: DatasetServiceMock.DATABASES[0].name,
            tableName: DatasetServiceMock.TABLES[0].name,
            fieldName: DatasetServiceMock.ID_FIELD.columnName,
            operator: '='
        } as FilterDataSource];

        expect(singleListCollection.setFilters(testDataSource, [filter1A], searchService)).toEqual(source1);
        expect((singleListCollection as any).data.get(source1)).toEqual([filter1A]);
        expect((singleListCollection as any).data.has(testDataSource)).toEqual(false);

        expect(singleListCollection.setFilters(testDataSource, [], searchService)).toEqual(source1);
        expect((singleListCollection as any).data.get(source1)).toEqual([]);
        expect((singleListCollection as any).data.has(testDataSource)).toEqual(false);

        let testFilter = FilterUtil.createFilterFromDesign({
            datastore: 'testDatastore1',
            database: DatasetServiceMock.DATABASES[0],
            table: DatasetServiceMock.TABLES[0],
            field: DatasetServiceMock.ID_FIELD,
            operator: '=',
            value: 'testId'
        } as SimpleFilterDesign, searchService);

        expect(singleListCollection.setFilters(testDataSource, [testFilter], searchService)).toEqual(source1);
        expect((singleListCollection as any).data.get(source1)).toEqual([testFilter]);
        expect((singleListCollection as any).data.has(testDataSource)).toEqual(false);

        expect(singleListCollection.setFilters(testDataSource, [filter1A, testFilter], searchService)).toEqual(source1);
        expect((singleListCollection as any).data.get(source1)).toEqual([filter1A, testFilter]);
        expect((singleListCollection as any).data.has(testDataSource)).toEqual(false);
    });
});

describe('DualListFilterCollection', () => {
    let dualListCollection: DualListFilterCollection;
    let searchService: AbstractSearchService;
    let source1: FilterDataSource[];
    let source2: FilterDataSource[];
    let filter1A: any;
    let filter1B: any;
    let filter1C: any;
    let filter1D: any;
    let filter2A: any;
    let requiredFilter1: any;
    let optionalFilter1: any;

    initializeTestBed('Dual List Filter Collection', {
        providers: [
            { provide: AbstractSearchService, useClass: SearchServiceMock }
        ]
    });

    beforeEach(inject([AbstractSearchService], (_searchService) => {
        searchService = _searchService;
        source1 = [{
            datastoreName: 'testDatastore1',
            databaseName: DatasetServiceMock.DATABASES[0].name,
            tableName: DatasetServiceMock.TABLES[0].name,
            fieldName: DatasetServiceMock.ID_FIELD.columnName,
            operator: '='
        } as FilterDataSource];
        source2 = [{
            datastoreName: 'testDatastore1',
            databaseName: DatasetServiceMock.DATABASES[0].name,
            tableName: DatasetServiceMock.TABLES[0].name,
            fieldName: DatasetServiceMock.SIZE_FIELD.columnName,
            operator: '>'
        } as FilterDataSource, {
            datastoreName: 'testDatastore1',
            databaseName: DatasetServiceMock.DATABASES[0].name,
            tableName: DatasetServiceMock.TABLES[0].name,
            fieldName: DatasetServiceMock.SIZE_FIELD.columnName,
            operator: '<'
        } as FilterDataSource];
        filter1A = FilterUtil.createFilterFromDesign({
            datastore: 'testDatastore1',
            database: DatasetServiceMock.DATABASES[0],
            table: DatasetServiceMock.TABLES[0],
            field: DatasetServiceMock.ID_FIELD,
            operator: '=',
            value: 'testId1'
        } as SimpleFilterDesign, searchService);
        filter1B = FilterUtil.createFilterFromDesign({
            datastore: 'testDatastore1',
            database: DatasetServiceMock.DATABASES[0],
            table: DatasetServiceMock.TABLES[0],
            field: DatasetServiceMock.ID_FIELD,
            operator: '=',
            value: 'testId2'
        } as SimpleFilterDesign, searchService);
        filter1C = FilterUtil.createFilterFromDesign({
            datastore: 'testDatastore1',
            database: DatasetServiceMock.DATABASES[0],
            table: DatasetServiceMock.TABLES[0],
            field: DatasetServiceMock.ID_FIELD,
            operator: '=',
            value: 'testId3'
        } as SimpleFilterDesign, searchService);
        filter1D = FilterUtil.createFilterFromDesign({
            datastore: 'testDatastore1',
            database: DatasetServiceMock.DATABASES[0],
            table: DatasetServiceMock.TABLES[0],
            field: DatasetServiceMock.ID_FIELD,
            operator: '=',
            value: 'testId4'
        } as SimpleFilterDesign, searchService);
        filter2A = FilterUtil.createFilterFromDesign({
            type: 'and',
            filters: [{
                datastore: 'testDatastore1',
                database: DatasetServiceMock.DATABASES[0],
                table: DatasetServiceMock.TABLES[0],
                field: DatasetServiceMock.SIZE_FIELD,
                operator: '>',
                value: 10
            } as SimpleFilterDesign, {
                datastore: 'testDatastore1',
                database: DatasetServiceMock.DATABASES[0],
                table: DatasetServiceMock.TABLES[0],
                field: DatasetServiceMock.SIZE_FIELD,
                operator: '<',
                value: 20
            } as SimpleFilterDesign]
        } as CompoundFilterDesign, searchService);
        requiredFilter1 = FilterUtil.createFilterFromDesign({
            type: 'and',
            filters: [filter1A, filter1B]
        } as CompoundFilterDesign, searchService);
        optionalFilter1 = FilterUtil.createFilterFromDesign({
            type: 'or',
            filters: [filter1C, filter1D]
        } as CompoundFilterDesign, searchService);
        let requiredFilter2 = FilterUtil.createFilterFromDesign({
            type: 'and',
            filters: [filter2A]
        } as CompoundFilterDesign, searchService);
        dualListCollection = new DualListFilterCollection();
        (dualListCollection as any).data.set(source1, [requiredFilter1, optionalFilter1]);
        (dualListCollection as any).data.set(source2, [requiredFilter2, null]);
    }));

    it('data of new collection should be empty', () => {
        let testCollection = new DualListFilterCollection();
        expect((testCollection as any).data.size).toEqual(0);
    });

    it('findFilterDataSources should return data source from collection', () => {
        expect(dualListCollection.findFilterDataSources({
            datastore: 'testDatastore1',
            database: DatasetServiceMock.DATABASES[0],
            table: DatasetServiceMock.TABLES[0],
            field: DatasetServiceMock.ID_FIELD,
            operator: '=',
            value: 'testId1'
        } as SimpleFilterDesign)).toEqual(source1);

        expect(dualListCollection.findFilterDataSources({
            type: 'and',
            filters: [{
                datastore: 'testDatastore1',
                database: DatasetServiceMock.DATABASES[0],
                table: DatasetServiceMock.TABLES[0],
                field: DatasetServiceMock.SIZE_FIELD,
                operator: '>',
                value: 10
            } as SimpleFilterDesign, {
                datastore: 'testDatastore1',
                database: DatasetServiceMock.DATABASES[0],
                table: DatasetServiceMock.TABLES[0],
                field: DatasetServiceMock.SIZE_FIELD,
                operator: '<',
                value: 20
            } as SimpleFilterDesign]
        } as CompoundFilterDesign)).toEqual(source2);
    });

    it('findFilterDataSources should return new data source and add to collection', () => {
        let actual = dualListCollection.findFilterDataSources({
            datastore: 'testDatastore1',
            database: DatasetServiceMock.DATABASES[0],
            table: DatasetServiceMock.TABLES[0],
            field: DatasetServiceMock.ID_FIELD,
            operator: '!=',
            value: 'testId1'
        } as SimpleFilterDesign);

        expect(actual).toEqual([{
            datastoreName: 'testDatastore1',
            databaseName: DatasetServiceMock.DATABASES[0].name,
            tableName: DatasetServiceMock.TABLES[0].name,
            fieldName: DatasetServiceMock.ID_FIELD.columnName,
            operator: '!='
        } as FilterDataSource]);

        expect((dualListCollection as any).data.get(actual)).toEqual([null, null]);
    });

    it('getDataSources should return expected array', () => {
        expect(dualListCollection.getDataSources()).toEqual([source1, source2]);

        let testDataSource = [{
            datastoreName: 'testDatastore1',
            databaseName: DatasetServiceMock.DATABASES[0].name,
            tableName: DatasetServiceMock.TABLES[0].name,
            fieldName: DatasetServiceMock.ID_FIELD.columnName,
            operator: '!='
        } as FilterDataSource];

        (dualListCollection as any).data.set(testDataSource, [null, null]);

        expect(dualListCollection.getDataSources()).toEqual([source1, source2, testDataSource]);
    });

    it('getFiltersInSingleList should create and return empty array if data source is not in collection', () => {
        let testDataSource1 = [{
            datastoreName: 'testDatastore1',
            databaseName: DatasetServiceMock.DATABASES[0].name,
            tableName: DatasetServiceMock.TABLES[0].name,
            fieldName: DatasetServiceMock.ID_FIELD.columnName,
            operator: '!='
        } as FilterDataSource];

        let testDataSource2 = [{
            datastoreName: 'testDatastore1',
            databaseName: DatasetServiceMock.DATABASES[0].name,
            tableName: DatasetServiceMock.TABLES[0].name,
            fieldName: DatasetServiceMock.SIZE_FIELD.columnName,
            operator: '='
        } as FilterDataSource, {
            datastoreName: 'testDatastore1',
            databaseName: DatasetServiceMock.DATABASES[0].name,
            tableName: DatasetServiceMock.TABLES[0].name,
            fieldName: DatasetServiceMock.SIZE_FIELD.columnName,
            operator: '!='
        } as FilterDataSource];

        expect(dualListCollection.getFiltersInSingleList(testDataSource1)).toEqual([]);
        expect(dualListCollection.getFiltersInSingleList(testDataSource2)).toEqual([]);

        expect((dualListCollection as any).data.get(testDataSource1)).toEqual([null, null]);
        expect((dualListCollection as any).data.get(testDataSource2)).toEqual([null, null]);
    });

    it('getFiltersInSingleList should return array from identical data source object in collection', () => {
        expect(dualListCollection.getFiltersInSingleList(source1)).toEqual([filter1A, filter1B, filter1C, filter1D]);
        expect(dualListCollection.getFiltersInSingleList(source2)).toEqual([filter2A]);
    });

    it('getFiltersInSingleList should return array from similar data source object in collection', () => {
        let testDataSource1 = [{
            datastoreName: 'testDatastore1',
            databaseName: DatasetServiceMock.DATABASES[0].name,
            tableName: DatasetServiceMock.TABLES[0].name,
            fieldName: DatasetServiceMock.ID_FIELD.columnName,
            operator: '='
        } as FilterDataSource];

        let testDataSource2 = [{
            datastoreName: 'testDatastore1',
            databaseName: DatasetServiceMock.DATABASES[0].name,
            tableName: DatasetServiceMock.TABLES[0].name,
            fieldName: DatasetServiceMock.SIZE_FIELD.columnName,
            operator: '>'
        } as FilterDataSource, {
            datastoreName: 'testDatastore1',
            databaseName: DatasetServiceMock.DATABASES[0].name,
            tableName: DatasetServiceMock.TABLES[0].name,
            fieldName: DatasetServiceMock.SIZE_FIELD.columnName,
            operator: '<'
        } as FilterDataSource];

        expect(dualListCollection.getFiltersInSingleList(testDataSource1)).toEqual([filter1A, filter1B, filter1C, filter1D]);
        expect(dualListCollection.getFiltersInSingleList(testDataSource2)).toEqual([filter2A]);

        expect((dualListCollection as any).data.has(testDataSource1)).toEqual(false);
        expect((dualListCollection as any).data.has(testDataSource2)).toEqual(false);
    });

    it('getFiltersFromOptionalList should create and return empty array if data source is not in collection', () => {
        let testDataSource1 = [{
            datastoreName: 'testDatastore1',
            databaseName: DatasetServiceMock.DATABASES[0].name,
            tableName: DatasetServiceMock.TABLES[0].name,
            fieldName: DatasetServiceMock.ID_FIELD.columnName,
            operator: '!='
        } as FilterDataSource];

        let testDataSource2 = [{
            datastoreName: 'testDatastore1',
            databaseName: DatasetServiceMock.DATABASES[0].name,
            tableName: DatasetServiceMock.TABLES[0].name,
            fieldName: DatasetServiceMock.SIZE_FIELD.columnName,
            operator: '='
        } as FilterDataSource, {
            datastoreName: 'testDatastore1',
            databaseName: DatasetServiceMock.DATABASES[0].name,
            tableName: DatasetServiceMock.TABLES[0].name,
            fieldName: DatasetServiceMock.SIZE_FIELD.columnName,
            operator: '!='
        } as FilterDataSource];

        expect(dualListCollection.getFiltersFromOptionalList(testDataSource1)).toEqual([]);
        expect(dualListCollection.getFiltersFromOptionalList(testDataSource2)).toEqual([]);

        expect((dualListCollection as any).data.get(testDataSource1)).toEqual([null, null]);
        expect((dualListCollection as any).data.get(testDataSource2)).toEqual([null, null]);
    });

    it('getFiltersFromOptionalList should return array from identical data source object in collection', () => {
        expect(dualListCollection.getFiltersFromOptionalList(source1)).toEqual([filter1C, filter1D]);
        expect(dualListCollection.getFiltersFromOptionalList(source2)).toEqual([]);
    });

    it('getFiltersFromOptionalList should return array from similar data source object in collection', () => {
        let testDataSource1 = [{
            datastoreName: 'testDatastore1',
            databaseName: DatasetServiceMock.DATABASES[0].name,
            tableName: DatasetServiceMock.TABLES[0].name,
            fieldName: DatasetServiceMock.ID_FIELD.columnName,
            operator: '='
        } as FilterDataSource];

        let testDataSource2 = [{
            datastoreName: 'testDatastore1',
            databaseName: DatasetServiceMock.DATABASES[0].name,
            tableName: DatasetServiceMock.TABLES[0].name,
            fieldName: DatasetServiceMock.SIZE_FIELD.columnName,
            operator: '>'
        } as FilterDataSource, {
            datastoreName: 'testDatastore1',
            databaseName: DatasetServiceMock.DATABASES[0].name,
            tableName: DatasetServiceMock.TABLES[0].name,
            fieldName: DatasetServiceMock.SIZE_FIELD.columnName,
            operator: '<'
        } as FilterDataSource];

        expect(dualListCollection.getFiltersFromOptionalList(testDataSource1)).toEqual([filter1C, filter1D]);
        expect(dualListCollection.getFiltersFromOptionalList(testDataSource2)).toEqual([]);

        expect((dualListCollection as any).data.has(testDataSource1)).toEqual(false);
        expect((dualListCollection as any).data.has(testDataSource2)).toEqual(false);
    });

    it('getFiltersFromRequiredList should create and return empty array if data source is not in collection', () => {
        let testDataSource1 = [{
            datastoreName: 'testDatastore1',
            databaseName: DatasetServiceMock.DATABASES[0].name,
            tableName: DatasetServiceMock.TABLES[0].name,
            fieldName: DatasetServiceMock.ID_FIELD.columnName,
            operator: '!='
        } as FilterDataSource];

        let testDataSource2 = [{
            datastoreName: 'testDatastore1',
            databaseName: DatasetServiceMock.DATABASES[0].name,
            tableName: DatasetServiceMock.TABLES[0].name,
            fieldName: DatasetServiceMock.SIZE_FIELD.columnName,
            operator: '='
        } as FilterDataSource, {
            datastoreName: 'testDatastore1',
            databaseName: DatasetServiceMock.DATABASES[0].name,
            tableName: DatasetServiceMock.TABLES[0].name,
            fieldName: DatasetServiceMock.SIZE_FIELD.columnName,
            operator: '!='
        } as FilterDataSource];

        expect(dualListCollection.getFiltersFromRequiredList(testDataSource1)).toEqual([]);
        expect(dualListCollection.getFiltersFromRequiredList(testDataSource2)).toEqual([]);

        expect((dualListCollection as any).data.get(testDataSource1)).toEqual([null, null]);
        expect((dualListCollection as any).data.get(testDataSource2)).toEqual([null, null]);
    });

    it('getFiltersFromRequiredList should return array from identical data source object in collection', () => {
        expect(dualListCollection.getFiltersFromRequiredList(source1)).toEqual([filter1A, filter1B]);
        expect(dualListCollection.getFiltersFromRequiredList(source2)).toEqual([filter2A]);
    });

    it('getFiltersFromRequiredList should return array from similar data source object in collection', () => {
        let testDataSource1 = [{
            datastoreName: 'testDatastore1',
            databaseName: DatasetServiceMock.DATABASES[0].name,
            tableName: DatasetServiceMock.TABLES[0].name,
            fieldName: DatasetServiceMock.ID_FIELD.columnName,
            operator: '='
        } as FilterDataSource];

        let testDataSource2 = [{
            datastoreName: 'testDatastore1',
            databaseName: DatasetServiceMock.DATABASES[0].name,
            tableName: DatasetServiceMock.TABLES[0].name,
            fieldName: DatasetServiceMock.SIZE_FIELD.columnName,
            operator: '>'
        } as FilterDataSource, {
            datastoreName: 'testDatastore1',
            databaseName: DatasetServiceMock.DATABASES[0].name,
            tableName: DatasetServiceMock.TABLES[0].name,
            fieldName: DatasetServiceMock.SIZE_FIELD.columnName,
            operator: '<'
        } as FilterDataSource];

        expect(dualListCollection.getFiltersFromRequiredList(testDataSource1)).toEqual([filter1A, filter1B]);
        expect(dualListCollection.getFiltersFromRequiredList(testDataSource2)).toEqual([filter2A]);

        expect((dualListCollection as any).data.has(testDataSource1)).toEqual(false);
        expect((dualListCollection as any).data.has(testDataSource2)).toEqual(false);
    });

    it('getFiltersToSearch should create and return empty array if data source is not in collection', () => {
        let testDataSource1 = [{
            datastoreName: 'testDatastore1',
            databaseName: DatasetServiceMock.DATABASES[0].name,
            tableName: DatasetServiceMock.TABLES[0].name,
            fieldName: DatasetServiceMock.ID_FIELD.columnName,
            operator: '!='
        } as FilterDataSource];

        let testDataSource2 = [{
            datastoreName: 'testDatastore1',
            databaseName: DatasetServiceMock.DATABASES[0].name,
            tableName: DatasetServiceMock.TABLES[0].name,
            fieldName: DatasetServiceMock.SIZE_FIELD.columnName,
            operator: '='
        } as FilterDataSource, {
            datastoreName: 'testDatastore1',
            databaseName: DatasetServiceMock.DATABASES[0].name,
            tableName: DatasetServiceMock.TABLES[0].name,
            fieldName: DatasetServiceMock.SIZE_FIELD.columnName,
            operator: '!='
        } as FilterDataSource];

        expect(dualListCollection.getFiltersToSearch(testDataSource1)).toEqual([]);
        expect(dualListCollection.getFiltersToSearch(testDataSource2)).toEqual([]);

        expect((dualListCollection as any).data.get(testDataSource1)).toEqual([null, null]);
        expect((dualListCollection as any).data.get(testDataSource2)).toEqual([null, null]);
    });

    it('getFiltersToSearch should return array from identical data source object in collection', () => {
        expect(dualListCollection.getFiltersToSearch(source1)).toEqual([requiredFilter1, optionalFilter1]);
        expect(dualListCollection.getFiltersToSearch(source2)).toEqual([filter2A]);
    });

    it('getFiltersToSearch should return array from similar data source object in collection', () => {
        let testDataSource1 = [{
            datastoreName: 'testDatastore1',
            databaseName: DatasetServiceMock.DATABASES[0].name,
            tableName: DatasetServiceMock.TABLES[0].name,
            fieldName: DatasetServiceMock.ID_FIELD.columnName,
            operator: '='
        } as FilterDataSource];

        let testDataSource2 = [{
            datastoreName: 'testDatastore1',
            databaseName: DatasetServiceMock.DATABASES[0].name,
            tableName: DatasetServiceMock.TABLES[0].name,
            fieldName: DatasetServiceMock.SIZE_FIELD.columnName,
            operator: '>'
        } as FilterDataSource, {
            datastoreName: 'testDatastore1',
            databaseName: DatasetServiceMock.DATABASES[0].name,
            tableName: DatasetServiceMock.TABLES[0].name,
            fieldName: DatasetServiceMock.SIZE_FIELD.columnName,
            operator: '<'
        } as FilterDataSource];

        expect(dualListCollection.getFiltersToSearch(testDataSource1)).toEqual([requiredFilter1, optionalFilter1]);
        expect(dualListCollection.getFiltersToSearch(testDataSource2)).toEqual([filter2A]);

        expect((dualListCollection as any).data.has(testDataSource1)).toEqual(false);
        expect((dualListCollection as any).data.has(testDataSource2)).toEqual(false);
    });

    it('setFiltersInDualLists should save filters with input data source if it is not in collection', () => {
        let actual;

        let testDataSource = [{
            datastoreName: 'testDatastore1',
            databaseName: DatasetServiceMock.DATABASES[0].name,
            tableName: DatasetServiceMock.TABLES[0].name,
            fieldName: DatasetServiceMock.ID_FIELD.columnName,
            operator: '!='
        } as FilterDataSource];

        let testFilter1 = FilterUtil.createFilterFromDesign({
            datastore: 'testDatastore1',
            database: DatasetServiceMock.DATABASES[0],
            table: DatasetServiceMock.TABLES[0],
            field: DatasetServiceMock.ID_FIELD,
            operator: '!=',
            value: 'testId1'
        } as SimpleFilterDesign, searchService);

        let testFilter2 = FilterUtil.createFilterFromDesign({
            datastore: 'testDatastore1',
            database: DatasetServiceMock.DATABASES[0],
            table: DatasetServiceMock.TABLES[0],
            field: DatasetServiceMock.ID_FIELD,
            operator: '!=',
            value: 'testId2'
        } as SimpleFilterDesign, searchService);

        expect(dualListCollection.setFiltersInDualLists(testDataSource, [testFilter1], [testFilter2], searchService)).toEqual(
            testDataSource);
        actual = (dualListCollection as any).data.get(testDataSource);
        expect(actual.length).toEqual(2);
        expect(actual[0].type).toEqual('and');
        expect(actual[0].filters).toEqual([testFilter1]);
        expect(actual[1].type).toEqual('or');
        expect(actual[1].filters).toEqual([testFilter2]);

        let testFilter3 = FilterUtil.createFilterFromDesign({
            datastore: 'testDatastore1',
            database: DatasetServiceMock.DATABASES[0],
            table: DatasetServiceMock.TABLES[0],
            field: DatasetServiceMock.ID_FIELD,
            operator: '!=',
            value: 'testId3'
        } as SimpleFilterDesign, searchService);

        let testFilter4 = FilterUtil.createFilterFromDesign({
            datastore: 'testDatastore1',
            database: DatasetServiceMock.DATABASES[0],
            table: DatasetServiceMock.TABLES[0],
            field: DatasetServiceMock.ID_FIELD,
            operator: '!=',
            value: 'testId4'
        } as SimpleFilterDesign, searchService);

        expect(dualListCollection.setFiltersInDualLists(testDataSource, [testFilter1, testFilter2], [testFilter3, testFilter4],
            searchService)).toEqual(testDataSource);
        actual = (dualListCollection as any).data.get(testDataSource);
        expect(actual.length).toEqual(2);
        expect(actual[0].type).toEqual('and');
        expect(actual[0].filters).toEqual([testFilter1, testFilter2]);
        expect(actual[1].type).toEqual('or');
        expect(actual[1].filters).toEqual([testFilter3, testFilter4]);

        expect(dualListCollection.setFiltersInDualLists(testDataSource, [testFilter1], [], searchService)).toEqual(testDataSource);
        actual = (dualListCollection as any).data.get(testDataSource);
        expect(actual.length).toEqual(2);
        expect(actual[0].type).toEqual('and');
        expect(actual[0].filters).toEqual([testFilter1]);
        expect(actual[1]).toEqual(null);

        expect(dualListCollection.setFiltersInDualLists(testDataSource, [], [testFilter1], searchService)).toEqual(testDataSource);
        actual = (dualListCollection as any).data.get(testDataSource);
        expect(actual.length).toEqual(2);
        expect(actual[0]).toEqual(null);
        expect(actual[1].type).toEqual('or');
        expect(actual[1].filters).toEqual([testFilter1]);
    });

    it('setFiltersInDualLists should save filters with identical data source object in collection', () => {
        let actual;

        expect(dualListCollection.setFiltersInDualLists(source1, [filter1A, filter1D], [filter1B, filter1C],
            searchService)).toEqual(source1);
        actual = (dualListCollection as any).data.get(source1);
        expect(actual.length).toEqual(2);
        expect(actual[0].type).toEqual('and');
        expect(actual[0].filters).toEqual([filter1A, filter1D]);
        expect(actual[1].type).toEqual('or');
        expect(actual[1].filters).toEqual([filter1B, filter1C]);

        expect(dualListCollection.setFiltersInDualLists(source1, [], [], searchService)).toEqual(source1);
        actual = (dualListCollection as any).data.get(source1);
        expect(actual.length).toEqual(2);
        expect(actual[0]).toEqual(null);
        expect(actual[1]).toEqual(null);

        let testFilter = FilterUtil.createFilterFromDesign({
            datastore: 'testDatastore1',
            database: DatasetServiceMock.DATABASES[0],
            table: DatasetServiceMock.TABLES[0],
            field: DatasetServiceMock.ID_FIELD,
            operator: '=',
            value: 'testId'
        } as SimpleFilterDesign, searchService);

        expect(dualListCollection.setFiltersInDualLists(source1, [testFilter], [], searchService)).toEqual(source1);
        actual = (dualListCollection as any).data.get(source1);
        expect(actual.length).toEqual(2);
        expect(actual[0].type).toEqual('and');
        expect(actual[0].filters).toEqual([testFilter]);
        expect(actual[1]).toEqual(null);

        expect(dualListCollection.setFiltersInDualLists(source1, [filter1A], [testFilter], searchService)).toEqual(source1);
        actual = (dualListCollection as any).data.get(source1);
        expect(actual.length).toEqual(2);
        expect(actual[0].type).toEqual('and');
        expect(actual[0].filters).toEqual([filter1A]);
        expect(actual[1].type).toEqual('or');
        expect(actual[1].filters).toEqual([testFilter]);
    });

    it('setFiltersInDualLists should save filters with similar data source object in collection', () => {
        let actual;

        let testDataSource = [{
            datastoreName: 'testDatastore1',
            databaseName: DatasetServiceMock.DATABASES[0].name,
            tableName: DatasetServiceMock.TABLES[0].name,
            fieldName: DatasetServiceMock.ID_FIELD.columnName,
            operator: '='
        } as FilterDataSource];

        expect(dualListCollection.setFiltersInDualLists(testDataSource, [filter1A, filter1D], [filter1B, filter1C],
            searchService)).toEqual(source1);
        actual = (dualListCollection as any).data.get(source1);
        expect(actual.length).toEqual(2);
        expect(actual[0].type).toEqual('and');
        expect(actual[0].filters).toEqual([filter1A, filter1D]);
        expect(actual[1].type).toEqual('or');
        expect(actual[1].filters).toEqual([filter1B, filter1C]);
        expect((dualListCollection as any).data.has(testDataSource)).toEqual(false);

        expect(dualListCollection.setFiltersInDualLists(testDataSource, [], [], searchService)).toEqual(source1);
        actual = (dualListCollection as any).data.get(source1);
        expect(actual.length).toEqual(2);
        expect(actual[0]).toEqual(null);
        expect(actual[1]).toEqual(null);
        expect((dualListCollection as any).data.has(testDataSource)).toEqual(false);

        let testFilter = FilterUtil.createFilterFromDesign({
            datastore: 'testDatastore1',
            database: DatasetServiceMock.DATABASES[0],
            table: DatasetServiceMock.TABLES[0],
            field: DatasetServiceMock.ID_FIELD,
            operator: '=',
            value: 'testId'
        } as SimpleFilterDesign, searchService);

        expect(dualListCollection.setFiltersInDualLists(testDataSource, [testFilter], [], searchService)).toEqual(source1);
        actual = (dualListCollection as any).data.get(source1);
        expect(actual.length).toEqual(2);
        expect(actual[0].type).toEqual('and');
        expect(actual[0].filters).toEqual([testFilter]);
        expect(actual[1]).toEqual(null);
        expect((dualListCollection as any).data.has(testDataSource)).toEqual(false);

        expect(dualListCollection.setFiltersInDualLists(testDataSource, [filter1A], [testFilter], searchService)).toEqual(source1);
        actual = (dualListCollection as any).data.get(source1);
        expect(actual.length).toEqual(2);
        expect(actual[0].type).toEqual('and');
        expect(actual[0].filters).toEqual([filter1A]);
        expect(actual[1].type).toEqual('or');
        expect(actual[1].filters).toEqual([testFilter]);
        expect((dualListCollection as any).data.has(testDataSource)).toEqual(false);
    });
});

describe('SimpleFilter', () => {
    let simpleFilter: any;
    let searchService: AbstractSearchService;

    initializeTestBed('Simple Filter', {
        providers: [
            { provide: AbstractSearchService, useClass: SearchServiceMock }
        ]
    });

    beforeEach(inject([AbstractSearchService], (_searchService) => {
        searchService = _searchService;
        simpleFilter = FilterUtil.createFilterFromDesign({
            datastore: 'testDatastore1',
            database: DatasetServiceMock.DATABASES[0],
            table: DatasetServiceMock.TABLES[0],
            field: DatasetServiceMock.NAME_FIELD,
            operator: '=',
            value: 'testName1'
        } as SimpleFilterDesign, searchService);
        // TODO THOR-1078 Remove this line
        simpleFilter.datastore = 'testDatastore1';
    }));

    it('does have expected properties', () => {
        expect(simpleFilter.datastore).toEqual('testDatastore1');
        expect(simpleFilter.database).toEqual(DatasetServiceMock.DATABASES[0]);
        expect(simpleFilter.table).toEqual(DatasetServiceMock.TABLES[0]);
        expect(simpleFilter.field).toEqual(DatasetServiceMock.NAME_FIELD);
        expect(simpleFilter.operator).toEqual('=');
        expect(simpleFilter.value).toEqual('testName1');

        expect(simpleFilter.filterClause).toBeDefined();
        expect(simpleFilter.id).toBeDefined();
        expect(simpleFilter.name).toEqual('Test Database 1 / Test Table 1 / Test Name Field = testName1');
        expect(simpleFilter.optional).toEqual(false);
        expect(simpleFilter.relations).toEqual([]);
    });

    it('createRelationFilter should return null if substitue has bad data', () => {
        let actual = simpleFilter.createRelationFilter([{
            datastore: 'testDatastore1',
            database: DatasetServiceMock.DATABASES[0],
            table: DatasetServiceMock.TABLES[0],
            field: DatasetServiceMock.NAME_FIELD
        }], [{
            datastore: 'testDatastore1',
            database: DatasetServiceMock.DATABASES[0],
            table: DatasetServiceMock.TABLES[0],
            field: new FieldMetaData()
        }], searchService);
        expect(actual).toEqual(null);
    });

    it('createRelationFilter should return expected object', () => {
        let actual;

        let testSubstituteList = [{
            datastore: 'testDatastore2',
            database: DatasetServiceMock.DATABASES[1],
            table: DatasetServiceMock.TABLES[1],
            field: DatasetServiceMock.TEXT_FIELD
        }];

        actual = simpleFilter.createRelationFilter([{
            datastore: 'testDatastore1',
            database: DatasetServiceMock.DATABASES[0],
            table: DatasetServiceMock.TABLES[0],
            field: DatasetServiceMock.NAME_FIELD
        }], testSubstituteList, searchService);
        expect(actual.datastore).toEqual('testDatastore2');
        expect(actual.database).toEqual(DatasetServiceMock.DATABASES[1]);
        expect(actual.table).toEqual(DatasetServiceMock.TABLES[1]);
        expect(actual.field).toEqual(DatasetServiceMock.TEXT_FIELD);
        expect(actual.operator).toEqual('=');
        expect(actual.value).toEqual('testName1');
        expect(actual.optional).toEqual(false);
    });

    it('createRelationFilter should work with optional filter', () => {
        simpleFilter.optional = true;

        let testSubstituteList = [{
            datastore: 'testDatastore2',
            database: DatasetServiceMock.DATABASES[1],
            table: DatasetServiceMock.TABLES[1],
            field: DatasetServiceMock.TEXT_FIELD
        }];

        let actual = simpleFilter.createRelationFilter([{
            datastore: 'testDatastore1',
            database: DatasetServiceMock.DATABASES[0],
            table: DatasetServiceMock.TABLES[0],
            field: DatasetServiceMock.NAME_FIELD
        }], testSubstituteList, searchService);
        expect(actual.datastore).toEqual('testDatastore2');
        expect(actual.database).toEqual(DatasetServiceMock.DATABASES[1]);
        expect(actual.table).toEqual(DatasetServiceMock.TABLES[1]);
        expect(actual.field).toEqual(DatasetServiceMock.TEXT_FIELD);
        expect(actual.operator).toEqual('=');
        expect(actual.value).toEqual('testName1');
        expect(actual.optional).toEqual(true);
    });

    it('doesAffectSearch should return expected boolean', () => {
        expect(simpleFilter.doesAffectSearch('testDatastore1', 'testDatabase1', 'testTable1')).toEqual(true);
        expect(simpleFilter.doesAffectSearch('testDatastore2', 'testDatabase1', 'testTable1')).toEqual(false);
        expect(simpleFilter.doesAffectSearch('testDatastore1', 'testDatabase2', 'testTable1')).toEqual(false);
        expect(simpleFilter.doesAffectSearch('testDatastore1', 'testDatabase1', 'testTable2')).toEqual(false);
    });

    it('isCompatibleWithDesign should return expected boolean', () => {
        // Correct, with value
        expect(simpleFilter.isCompatibleWithDesign({
            datastore: 'testDatastore1',
            database: DatasetServiceMock.DATABASES[0],
            table: DatasetServiceMock.TABLES[0],
            field: DatasetServiceMock.NAME_FIELD,
            operator: '=',
            value: 'testName1'
        })).toEqual(true);

        // Correct
        expect(simpleFilter.isCompatibleWithDesign({
            datastore: 'testDatastore1',
            database: DatasetServiceMock.DATABASES[0],
            table: DatasetServiceMock.TABLES[0],
            field: DatasetServiceMock.NAME_FIELD,
            operator: '='
        })).toEqual(true);

        // Correct, with optional status
        expect(simpleFilter.isCompatibleWithDesign({
            datastore: 'testDatastore1',
            database: DatasetServiceMock.DATABASES[0],
            table: DatasetServiceMock.TABLES[0],
            field: DatasetServiceMock.NAME_FIELD,
            operator: '=',
            optional: false
        })).toEqual(true);

        // Different datastore
        expect(simpleFilter.isCompatibleWithDesign({
            datastore: 'testDatastore2',
            database: DatasetServiceMock.DATABASES[0],
            table: DatasetServiceMock.TABLES[0],
            field: DatasetServiceMock.NAME_FIELD,
            operator: '='
        })).toEqual(false);

        // Different database
        expect(simpleFilter.isCompatibleWithDesign({
            datastore: 'testDatastore1',
            database: DatasetServiceMock.DATABASES[1],
            table: DatasetServiceMock.TABLES[0],
            field: DatasetServiceMock.NAME_FIELD,
            operator: '='
        })).toEqual(false);

        // Different table
        expect(simpleFilter.isCompatibleWithDesign({
            datastore: 'testDatastore1',
            database: DatasetServiceMock.DATABASES[0],
            table: DatasetServiceMock.TABLES[1],
            field: DatasetServiceMock.NAME_FIELD,
            operator: '='
        })).toEqual(false);

        // Different field
        expect(simpleFilter.isCompatibleWithDesign({
            datastore: 'testDatastore1',
            database: DatasetServiceMock.DATABASES[0],
            table: DatasetServiceMock.TABLES[0],
            field: DatasetServiceMock.TEXT_FIELD,
            operator: '='
        })).toEqual(false);

        // Different operator
        expect(simpleFilter.isCompatibleWithDesign({
            datastore: 'testDatastore1',
            database: DatasetServiceMock.DATABASES[0],
            table: DatasetServiceMock.TABLES[0],
            field: DatasetServiceMock.NAME_FIELD,
            operator: '!='
        })).toEqual(false);

        // Different optional status
        expect(simpleFilter.isCompatibleWithDesign({
            datastore: 'testDatastore1',
            database: DatasetServiceMock.DATABASES[0],
            table: DatasetServiceMock.TABLES[0],
            field: DatasetServiceMock.NAME_FIELD,
            operator: '=',
            optional: true
        })).toEqual(false);

        // Different value
        expect(simpleFilter.isCompatibleWithDesign({
            datastore: 'testDatastore1',
            database: DatasetServiceMock.DATABASES[0],
            table: DatasetServiceMock.TABLES[0],
            field: DatasetServiceMock.NAME_FIELD,
            operator: '=',
            value: 'testName2'
        })).toEqual(false);

        // Different structure
        expect(simpleFilter.isCompatibleWithDesign({
            type: 'and',
            filters: [{
                datastore: 'testDatastore1',
                database: DatasetServiceMock.DATABASES[0],
                table: DatasetServiceMock.TABLES[0],
                field: DatasetServiceMock.NAME_FIELD,
                operator: '='
            }]
        })).toEqual(false);
    });

    it('isEquivalentToFilter should return expected boolean', () => {
        // Different datastore
        let testFilter1 = FilterUtil.createFilterFromDesign({
            datastore: 'testDatastore2',
            database: DatasetServiceMock.DATABASES[0],
            table: DatasetServiceMock.TABLES[0],
            field: DatasetServiceMock.NAME_FIELD,
            operator: '=',
            value: 'testName1'
        } as SimpleFilterDesign, searchService);

        // Different database
        let testFilter2 = FilterUtil.createFilterFromDesign({
            datastore: 'testDatastore1',
            database: DatasetServiceMock.DATABASES[1],
            table: DatasetServiceMock.TABLES[0],
            field: DatasetServiceMock.NAME_FIELD,
            operator: '=',
            value: 'testName1'
        } as SimpleFilterDesign, searchService);

        // Different table
        let testFilter3 = FilterUtil.createFilterFromDesign({
            datastore: 'testDatastore1',
            database: DatasetServiceMock.DATABASES[0],
            table: DatasetServiceMock.TABLES[1],
            field: DatasetServiceMock.NAME_FIELD,
            operator: '=',
            value: 'testName1'
        } as SimpleFilterDesign, searchService);

        // Different field
        let testFilter4 = FilterUtil.createFilterFromDesign({
            datastore: 'testDatastore1',
            database: DatasetServiceMock.DATABASES[0],
            table: DatasetServiceMock.TABLES[0],
            field: DatasetServiceMock.TEXT_FIELD,
            operator: '=',
            value: 'testName1'
        } as SimpleFilterDesign, searchService);

        // Different operator
        let testFilter5 = FilterUtil.createFilterFromDesign({
            datastore: 'testDatastore1',
            database: DatasetServiceMock.DATABASES[0],
            table: DatasetServiceMock.TABLES[0],
            field: DatasetServiceMock.NAME_FIELD,
            operator: '!=',
            value: 'testName1'
        } as SimpleFilterDesign, searchService);

        // Different value
        let testFilter6 = FilterUtil.createFilterFromDesign({
            datastore: 'testDatastore1',
            database: DatasetServiceMock.DATABASES[0],
            table: DatasetServiceMock.TABLES[0],
            field: DatasetServiceMock.NAME_FIELD,
            operator: '=',
            value: 'testName2'
        } as SimpleFilterDesign, searchService);

        // Different optional status
        let testFilter7 = FilterUtil.createFilterFromDesign({
            optional: true,
            datastore: 'testDatastore1',
            database: DatasetServiceMock.DATABASES[0],
            table: DatasetServiceMock.TABLES[0],
            field: DatasetServiceMock.NAME_FIELD,
            operator: '=',
            value: 'testName1'
        } as SimpleFilterDesign, searchService);

        // Different structure
        let testFilter8 = FilterUtil.createFilterFromDesign({
            type: 'and',
            filters: [{
                datastore: 'testDatastore1',
                database: DatasetServiceMock.DATABASES[0],
                table: DatasetServiceMock.TABLES[0],
                field: DatasetServiceMock.NAME_FIELD,
                operator: '=',
                value: 'testName1'
            } as SimpleFilterDesign]
        } as CompoundFilterDesign, searchService);

        // Correct
        let testFilter9 = FilterUtil.createFilterFromDesign({
            datastore: 'testDatastore1',
            database: DatasetServiceMock.DATABASES[0],
            table: DatasetServiceMock.TABLES[0],
            field: DatasetServiceMock.NAME_FIELD,
            operator: '=',
            value: 'testName1'
        } as SimpleFilterDesign, searchService);
        // TODO THOR-1078 Remove this line
        (testFilter9 as any).datastore = 'testDatastore1';

        expect(simpleFilter.isEquivalentToFilter(testFilter1)).toEqual(false);
        expect(simpleFilter.isEquivalentToFilter(testFilter2)).toEqual(false);
        expect(simpleFilter.isEquivalentToFilter(testFilter3)).toEqual(false);
        expect(simpleFilter.isEquivalentToFilter(testFilter4)).toEqual(false);
        expect(simpleFilter.isEquivalentToFilter(testFilter5)).toEqual(false);
        expect(simpleFilter.isEquivalentToFilter(testFilter6)).toEqual(false);
        expect(simpleFilter.isEquivalentToFilter(testFilter7)).toEqual(false);
        expect(simpleFilter.isEquivalentToFilter(testFilter8)).toEqual(false);
        expect(simpleFilter.isEquivalentToFilter(testFilter9)).toEqual(true);
    });

    it('toDesign should return expected object', () => {
        expect(simpleFilter.toDesign()).toEqual({
            id: simpleFilter.id,
            name: 'Test Database 1 / Test Table 1 / Test Name Field = testName1',
            optional: false,
            datastore: 'testDatastore1',
            database: DatasetServiceMock.DATABASES[0],
            table: DatasetServiceMock.TABLES[0],
            field: DatasetServiceMock.NAME_FIELD,
            operator: '=',
            value: 'testName1'
        } as SimpleFilterDesign);
    });

    it('toString should return expected string', () => {
        expect(simpleFilter.toString()).toEqual('Test Database 1 / Test Table 1 / Test Name Field = testName1');
    });

    it('toString on filter with name property should return name property', () => {
        simpleFilter.name = 'testName';
        expect(simpleFilter.toString()).toEqual('testName');
    });
});

describe('SimpleFilter (Falsey Values)', () => {
    let searchService: AbstractSearchService;

    initializeTestBed('Simple Filter (Falsey Values)', {
        providers: [
            { provide: AbstractSearchService, useClass: SearchServiceMock }
        ]
    });

    beforeEach(inject([AbstractSearchService], (_searchService) => {
        searchService = _searchService;
    }));

    it('filter on zero', () => {
        let filter = FilterUtil.createFilterFromDesign({
            datastore: 'testDatastore1',
            database: DatasetServiceMock.DATABASES[0],
            table: DatasetServiceMock.TABLES[0],
            field: DatasetServiceMock.NAME_FIELD,
            operator: '=',
            value: 0
        } as SimpleFilterDesign, searchService);
        // TODO THOR-1078 Remove this line
        (filter as any).datastore = 'testDatastore1';

        expect((filter as any).database).toEqual(DatasetServiceMock.DATABASES[0]);
        expect((filter as any).table).toEqual(DatasetServiceMock.TABLES[0]);
        expect((filter as any).field).toEqual(DatasetServiceMock.NAME_FIELD);
        expect((filter as any).operator).toEqual('=');
        expect((filter as any).value).toEqual(0);

        expect(filter.isCompatibleWithDesign({
            datastore: 'testDatastore1',
            database: DatasetServiceMock.DATABASES[0],
            table: DatasetServiceMock.TABLES[0],
            field: DatasetServiceMock.NAME_FIELD,
            operator: '=',
            value: 0
        } as SimpleFilterDesign)).toEqual(true);

        expect(filter.isCompatibleWithDesign({
            datastore: 'testDatastore1',
            database: DatasetServiceMock.DATABASES[0],
            table: DatasetServiceMock.TABLES[0],
            field: DatasetServiceMock.NAME_FIELD,
            operator: '=',
            value: ''
        } as SimpleFilterDesign)).toEqual(false);

        expect(filter.isCompatibleWithDesign({
            datastore: 'testDatastore1',
            database: DatasetServiceMock.DATABASES[0],
            table: DatasetServiceMock.TABLES[0],
            field: DatasetServiceMock.NAME_FIELD,
            operator: '=',
            value: false
        } as SimpleFilterDesign)).toEqual(false);

        expect(filter.isCompatibleWithDesign({
            datastore: 'testDatastore1',
            database: DatasetServiceMock.DATABASES[0],
            table: DatasetServiceMock.TABLES[0],
            field: DatasetServiceMock.NAME_FIELD,
            operator: '=',
            value: null
        } as SimpleFilterDesign)).toEqual(false);
    });

    it('filter on empty string', () => {
        let filter = FilterUtil.createFilterFromDesign({
            datastore: 'testDatastore1',
            database: DatasetServiceMock.DATABASES[0],
            table: DatasetServiceMock.TABLES[0],
            field: DatasetServiceMock.NAME_FIELD,
            operator: '=',
            value: ''
        } as SimpleFilterDesign, searchService);
        // TODO THOR-1078 Remove this line
        (filter as any).datastore = 'testDatastore1';

        expect((filter as any).database).toEqual(DatasetServiceMock.DATABASES[0]);
        expect((filter as any).table).toEqual(DatasetServiceMock.TABLES[0]);
        expect((filter as any).field).toEqual(DatasetServiceMock.NAME_FIELD);
        expect((filter as any).operator).toEqual('=');
        expect((filter as any).value).toEqual('');

        expect(filter.isCompatibleWithDesign({
            datastore: 'testDatastore1',
            database: DatasetServiceMock.DATABASES[0],
            table: DatasetServiceMock.TABLES[0],
            field: DatasetServiceMock.NAME_FIELD,
            operator: '=',
            value: 0
        } as SimpleFilterDesign)).toEqual(false);

        expect(filter.isCompatibleWithDesign({
            datastore: 'testDatastore1',
            database: DatasetServiceMock.DATABASES[0],
            table: DatasetServiceMock.TABLES[0],
            field: DatasetServiceMock.NAME_FIELD,
            operator: '=',
            value: ''
        } as SimpleFilterDesign)).toEqual(true);

        expect(filter.isCompatibleWithDesign({
            datastore: 'testDatastore1',
            database: DatasetServiceMock.DATABASES[0],
            table: DatasetServiceMock.TABLES[0],
            field: DatasetServiceMock.NAME_FIELD,
            operator: '=',
            value: false
        } as SimpleFilterDesign)).toEqual(false);

        expect(filter.isCompatibleWithDesign({
            datastore: 'testDatastore1',
            database: DatasetServiceMock.DATABASES[0],
            table: DatasetServiceMock.TABLES[0],
            field: DatasetServiceMock.NAME_FIELD,
            operator: '=',
            value: null
        } as SimpleFilterDesign)).toEqual(false);
    });

    it('filter on false', () => {
        let filter = FilterUtil.createFilterFromDesign({
            datastore: 'testDatastore1',
            database: DatasetServiceMock.DATABASES[0],
            table: DatasetServiceMock.TABLES[0],
            field: DatasetServiceMock.NAME_FIELD,
            operator: '=',
            value: false
        } as SimpleFilterDesign, searchService);
        // TODO THOR-1078 Remove this line
        (filter as any).datastore = 'testDatastore1';

        expect((filter as any).database).toEqual(DatasetServiceMock.DATABASES[0]);
        expect((filter as any).table).toEqual(DatasetServiceMock.TABLES[0]);
        expect((filter as any).field).toEqual(DatasetServiceMock.NAME_FIELD);
        expect((filter as any).operator).toEqual('=');
        expect((filter as any).value).toEqual(false);

        expect(filter.isCompatibleWithDesign({
            datastore: 'testDatastore1',
            database: DatasetServiceMock.DATABASES[0],
            table: DatasetServiceMock.TABLES[0],
            field: DatasetServiceMock.NAME_FIELD,
            operator: '=',
            value: 0
        } as SimpleFilterDesign)).toEqual(false);

        expect(filter.isCompatibleWithDesign({
            datastore: 'testDatastore1',
            database: DatasetServiceMock.DATABASES[0],
            table: DatasetServiceMock.TABLES[0],
            field: DatasetServiceMock.NAME_FIELD,
            operator: '=',
            value: ''
        } as SimpleFilterDesign)).toEqual(false);

        expect(filter.isCompatibleWithDesign({
            datastore: 'testDatastore1',
            database: DatasetServiceMock.DATABASES[0],
            table: DatasetServiceMock.TABLES[0],
            field: DatasetServiceMock.NAME_FIELD,
            operator: '=',
            value: false
        } as SimpleFilterDesign)).toEqual(true);

        expect(filter.isCompatibleWithDesign({
            datastore: 'testDatastore1',
            database: DatasetServiceMock.DATABASES[0],
            table: DatasetServiceMock.TABLES[0],
            field: DatasetServiceMock.NAME_FIELD,
            operator: '=',
            value: null
        } as SimpleFilterDesign)).toEqual(false);
    });

    it('filter on null', () => {
        let filter = FilterUtil.createFilterFromDesign({
            datastore: 'testDatastore1',
            database: DatasetServiceMock.DATABASES[0],
            table: DatasetServiceMock.TABLES[0],
            field: DatasetServiceMock.NAME_FIELD,
            operator: '=',
            value: null
        } as SimpleFilterDesign, searchService);
        // TODO THOR-1078 Remove this line
        (filter as any).datastore = 'testDatastore1';

        expect((filter as any).database).toEqual(DatasetServiceMock.DATABASES[0]);
        expect((filter as any).table).toEqual(DatasetServiceMock.TABLES[0]);
        expect((filter as any).field).toEqual(DatasetServiceMock.NAME_FIELD);
        expect((filter as any).operator).toEqual('=');
        expect((filter as any).value).toEqual(null);

        expect(filter.isCompatibleWithDesign({
            datastore: 'testDatastore1',
            database: DatasetServiceMock.DATABASES[0],
            table: DatasetServiceMock.TABLES[0],
            field: DatasetServiceMock.NAME_FIELD,
            operator: '=',
            value: 0
        } as SimpleFilterDesign)).toEqual(false);

        expect(filter.isCompatibleWithDesign({
            datastore: 'testDatastore1',
            database: DatasetServiceMock.DATABASES[0],
            table: DatasetServiceMock.TABLES[0],
            field: DatasetServiceMock.NAME_FIELD,
            operator: '=',
            value: ''
        } as SimpleFilterDesign)).toEqual(false);

        expect(filter.isCompatibleWithDesign({
            datastore: 'testDatastore1',
            database: DatasetServiceMock.DATABASES[0],
            table: DatasetServiceMock.TABLES[0],
            field: DatasetServiceMock.NAME_FIELD,
            operator: '=',
            value: false
        } as SimpleFilterDesign)).toEqual(false);

        expect(filter.isCompatibleWithDesign({
            datastore: 'testDatastore1',
            database: DatasetServiceMock.DATABASES[0],
            table: DatasetServiceMock.TABLES[0],
            field: DatasetServiceMock.NAME_FIELD,
            operator: '=',
            value: null
        } as SimpleFilterDesign)).toEqual(true);
    });
});

describe('SimpleFilter and CompoundFilter (Date Fields)', () => {
    let simpleFilter: any;
    let compoundFilter: any;
    let searchService: AbstractSearchService;

    initializeTestBed('Simple and Compound Filters (Date Fields)', {
        providers: [
            { provide: AbstractSearchService, useClass: SearchServiceMock }
        ]
    });

    beforeEach(inject([AbstractSearchService], (_searchService) => {
        searchService = _searchService;

        simpleFilter = FilterUtil.createFilterFromDesign({
            datastore: 'testDatastore1',
            database: DatasetServiceMock.DATABASES[0],
            table: DatasetServiceMock.TABLES[0],
            field: DatasetServiceMock.DATE_FIELD,
            operator: '=',
            value: new Date(0)
        } as SimpleFilterDesign, searchService);
        // TODO THOR-1078 Remove this line
        simpleFilter.datastore = 'testDatastore1';

        compoundFilter = FilterUtil.createFilterFromDesign({
            type: 'and',
            filters: [{
                datastore: 'testDatastore1',
                database: DatasetServiceMock.DATABASES[0],
                table: DatasetServiceMock.TABLES[0],
                field: DatasetServiceMock.DATE_FIELD,
                operator: '>',
                value: new Date(0)
            } as SimpleFilterDesign, {
                datastore: 'testDatastore1',
                database: DatasetServiceMock.DATABASES[0],
                table: DatasetServiceMock.TABLES[0],
                field: DatasetServiceMock.DATE_FIELD,
                operator: '<',
                // One year + one month + one day
                value: new Date(34300800000)
            } as SimpleFilterDesign]
        } as CompoundFilterDesign, searchService);
        // TODO THOR-1078 Remove this line
        compoundFilter.filters.forEach((filter) => filter.datastore = 'testDatastore1');
    }));

    it('toString on simple date filter should return expected string', () => {
        expect(simpleFilter.toString()).toEqual('Test Database 1 / Test Table 1 / Test Date Field = 1-1-1970');
    });

    it('toString on compound date filter should return expected string', () => {
        expect(compoundFilter.toString()).toEqual('(Test Database 1 / Test Table 1 / Test Date Field > 1-1-1970) and ' +
            '(Test Database 1 / Test Table 1 / Test Date Field < 2-2-1971)');
    });
});

describe('CompoundFilter (One Field)', () => {
    let compoundFilter: any;
    let searchService: AbstractSearchService;

    initializeTestBed('Compound Filter (One Field)', {
        providers: [
            { provide: AbstractSearchService, useClass: SearchServiceMock }
        ]
    });

    beforeEach(inject([AbstractSearchService], (_searchService) => {
        searchService = _searchService;
        compoundFilter = FilterUtil.createFilterFromDesign({
            type: 'and',
            filters: [{
                datastore: 'testDatastore1',
                database: DatasetServiceMock.DATABASES[0],
                table: DatasetServiceMock.TABLES[0],
                field: DatasetServiceMock.X_FIELD,
                operator: '>',
                value: -100
            } as SimpleFilterDesign, {
                datastore: 'testDatastore1',
                database: DatasetServiceMock.DATABASES[0],
                table: DatasetServiceMock.TABLES[0],
                field: DatasetServiceMock.X_FIELD,
                operator: '<',
                value: 100
            } as SimpleFilterDesign]
        } as CompoundFilterDesign, searchService);
        // TODO THOR-1078 Remove this line
        compoundFilter.filters.forEach((filter) => filter.datastore = 'testDatastore1');
    }));

    it('does have expected properties', () => {
        expect(compoundFilter.filterClause).toBeDefined();
        expect(compoundFilter.id).toBeDefined();
        expect(compoundFilter.name).toEqual('(Test Database 1 / Test Table 1 / Test X Field > -100) and ' +
            '(Test Database 1 / Test Table 1 / Test X Field < 100)');
        expect(compoundFilter.optional).toEqual(false);
        expect(compoundFilter.relations).toEqual([]);
        expect(compoundFilter.type).toEqual(CompoundFilterType.AND);

        expect(compoundFilter.filters.length).toEqual(2);
        expect(compoundFilter.filters[0].datastore).toEqual('testDatastore1');
        expect(compoundFilter.filters[0].database).toEqual(DatasetServiceMock.DATABASES[0]);
        expect(compoundFilter.filters[0].table).toEqual(DatasetServiceMock.TABLES[0]);
        expect(compoundFilter.filters[0].field).toEqual(DatasetServiceMock.X_FIELD);
        expect(compoundFilter.filters[0].operator).toEqual('>');
        expect(compoundFilter.filters[0].value).toEqual(-100);
        expect(compoundFilter.filters[1].datastore).toEqual('testDatastore1');
        expect(compoundFilter.filters[1].database).toEqual(DatasetServiceMock.DATABASES[0]);
        expect(compoundFilter.filters[1].table).toEqual(DatasetServiceMock.TABLES[0]);
        expect(compoundFilter.filters[1].field).toEqual(DatasetServiceMock.X_FIELD);
        expect(compoundFilter.filters[1].operator).toEqual('<');
        expect(compoundFilter.filters[1].value).toEqual(100);
    });

    it('createRelationFilter should return null if substitue has bad data', () => {
        let actual = compoundFilter.createRelationFilter([{
            datastore: 'testDatastore1',
            database: DatasetServiceMock.DATABASES[0],
            table: DatasetServiceMock.TABLES[0],
            field: DatasetServiceMock.X_FIELD
        }], [{
            datastore: 'testDatastore1',
            database: DatasetServiceMock.DATABASES[0],
            table: DatasetServiceMock.TABLES[0],
            field: new FieldMetaData()
        }], searchService);
        expect(actual).toEqual(null);
    });

    it('createRelationFilter should return expected object', () => {
        let actual;

        let testSubstituteList = [{
            datastore: 'testDatastore2',
            database: DatasetServiceMock.DATABASES[1],
            table: DatasetServiceMock.TABLES[1],
            field: DatasetServiceMock.Y_FIELD
        }];

        actual = compoundFilter.createRelationFilter([{
            datastore: 'testDatastore1',
            database: DatasetServiceMock.DATABASES[0],
            table: DatasetServiceMock.TABLES[0],
            field: DatasetServiceMock.X_FIELD
        }], testSubstituteList, searchService);
        expect(actual.type).toEqual(CompoundFilterType.AND);
        expect(actual.optional).toEqual(false);
        expect(actual.filters.length).toEqual(2);
        expect(actual.filters[0].datastore).toEqual('testDatastore2');
        expect(actual.filters[0].database).toEqual(DatasetServiceMock.DATABASES[1]);
        expect(actual.filters[0].table).toEqual(DatasetServiceMock.TABLES[1]);
        expect(actual.filters[0].field).toEqual(DatasetServiceMock.Y_FIELD);
        expect(actual.filters[0].operator).toEqual('>');
        expect(actual.filters[0].value).toEqual(-100);
        expect(actual.filters[1].datastore).toEqual('testDatastore2');
        expect(actual.filters[1].database).toEqual(DatasetServiceMock.DATABASES[1]);
        expect(actual.filters[1].table).toEqual(DatasetServiceMock.TABLES[1]);
        expect(actual.filters[1].field).toEqual(DatasetServiceMock.Y_FIELD);
        expect(actual.filters[1].operator).toEqual('<');
        expect(actual.filters[1].value).toEqual(100);
    });

    it('createRelationFilter should work with optional filter', () => {
        compoundFilter.optional = true;

        let testSubstituteList = [{
            datastore: 'testDatastore2',
            database: DatasetServiceMock.DATABASES[1],
            table: DatasetServiceMock.TABLES[1],
            field: DatasetServiceMock.Y_FIELD
        }];

        let actual = compoundFilter.createRelationFilter([{
            datastore: 'testDatastore1',
            database: DatasetServiceMock.DATABASES[0],
            table: DatasetServiceMock.TABLES[0],
            field: DatasetServiceMock.X_FIELD
        }], testSubstituteList, searchService);
        expect(actual.type).toEqual(CompoundFilterType.AND);
        expect(actual.optional).toEqual(true);
        expect(actual.filters.length).toEqual(2);
        expect(actual.filters[0].datastore).toEqual('testDatastore2');
        expect(actual.filters[0].database).toEqual(DatasetServiceMock.DATABASES[1]);
        expect(actual.filters[0].table).toEqual(DatasetServiceMock.TABLES[1]);
        expect(actual.filters[0].field).toEqual(DatasetServiceMock.Y_FIELD);
        expect(actual.filters[0].operator).toEqual('>');
        expect(actual.filters[0].value).toEqual(-100);
        expect(actual.filters[1].datastore).toEqual('testDatastore2');
        expect(actual.filters[1].database).toEqual(DatasetServiceMock.DATABASES[1]);
        expect(actual.filters[1].table).toEqual(DatasetServiceMock.TABLES[1]);
        expect(actual.filters[1].field).toEqual(DatasetServiceMock.Y_FIELD);
        expect(actual.filters[1].operator).toEqual('<');
        expect(actual.filters[1].value).toEqual(100);
    });

    it('doesAffectSearch should return expected boolean', () => {
        expect(compoundFilter.doesAffectSearch('testDatastore1', 'testDatabase1', 'testTable1')).toEqual(true);
        expect(compoundFilter.doesAffectSearch('testDatastore2', 'testDatabase1', 'testTable1')).toEqual(false);
        expect(compoundFilter.doesAffectSearch('testDatastore1', 'testDatabase2', 'testTable1')).toEqual(false);
        expect(compoundFilter.doesAffectSearch('testDatastore1', 'testDatabase1', 'testTable2')).toEqual(false);
    });

    it('isCompatibleWithDesign should return expected boolean', () => {
        // Correct, with value
        expect(compoundFilter.isCompatibleWithDesign({
            type: 'and',
            filters: [{
                datastore: 'testDatastore1',
                database: DatasetServiceMock.DATABASES[0],
                table: DatasetServiceMock.TABLES[0],
                field: DatasetServiceMock.X_FIELD,
                operator: '>',
                value: -100
            } as SimpleFilterDesign, {
                datastore: 'testDatastore1',
                database: DatasetServiceMock.DATABASES[0],
                table: DatasetServiceMock.TABLES[0],
                field: DatasetServiceMock.X_FIELD,
                operator: '<',
                value: 100
            } as SimpleFilterDesign]
        } as CompoundFilterDesign)).toEqual(true);

        // Correct
        expect(compoundFilter.isCompatibleWithDesign({
            type: 'and',
            filters: [{
                datastore: 'testDatastore1',
                database: DatasetServiceMock.DATABASES[0],
                table: DatasetServiceMock.TABLES[0],
                field: DatasetServiceMock.X_FIELD,
                operator: '>'
            } as SimpleFilterDesign, {
                datastore: 'testDatastore1',
                database: DatasetServiceMock.DATABASES[0],
                table: DatasetServiceMock.TABLES[0],
                field: DatasetServiceMock.X_FIELD,
                operator: '<'
            } as SimpleFilterDesign]
        } as CompoundFilterDesign)).toEqual(true);

        // Correct, with optional status
        expect(compoundFilter.isCompatibleWithDesign({
            type: 'and',
            optional: false,
            filters: [{
                datastore: 'testDatastore1',
                database: DatasetServiceMock.DATABASES[0],
                table: DatasetServiceMock.TABLES[0],
                field: DatasetServiceMock.X_FIELD,
                operator: '>'
            } as SimpleFilterDesign, {
                datastore: 'testDatastore1',
                database: DatasetServiceMock.DATABASES[0],
                table: DatasetServiceMock.TABLES[0],
                field: DatasetServiceMock.X_FIELD,
                operator: '<'
            } as SimpleFilterDesign]
        } as CompoundFilterDesign)).toEqual(true);

        // Correct, with rearranged structure
        expect(compoundFilter.isCompatibleWithDesign({
            type: 'and',
            filters: [{
                datastore: 'testDatastore1',
                database: DatasetServiceMock.DATABASES[0],
                table: DatasetServiceMock.TABLES[0],
                field: DatasetServiceMock.X_FIELD,
                operator: '<'
            } as SimpleFilterDesign, {
                datastore: 'testDatastore1',
                database: DatasetServiceMock.DATABASES[0],
                table: DatasetServiceMock.TABLES[0],
                field: DatasetServiceMock.X_FIELD,
                operator: '>'
            } as SimpleFilterDesign]
        } as CompoundFilterDesign)).toEqual(true);

        // Different datastore
        expect(compoundFilter.isCompatibleWithDesign({
            type: 'and',
            filters: [{
                datastore: 'testDatastore2',
                database: DatasetServiceMock.DATABASES[0],
                table: DatasetServiceMock.TABLES[0],
                field: DatasetServiceMock.X_FIELD,
                operator: '>'
            } as SimpleFilterDesign, {
                datastore: 'testDatastore1',
                database: DatasetServiceMock.DATABASES[0],
                table: DatasetServiceMock.TABLES[0],
                field: DatasetServiceMock.X_FIELD,
                operator: '<'
            } as SimpleFilterDesign]
        } as CompoundFilterDesign)).toEqual(false);

        // Different database
        expect(compoundFilter.isCompatibleWithDesign({
            type: 'and',
            filters: [{
                datastore: 'testDatastore1',
                database: DatasetServiceMock.DATABASES[1],
                table: DatasetServiceMock.TABLES[0],
                field: DatasetServiceMock.X_FIELD,
                operator: '>'
            } as SimpleFilterDesign, {
                datastore: 'testDatastore1',
                database: DatasetServiceMock.DATABASES[0],
                table: DatasetServiceMock.TABLES[0],
                field: DatasetServiceMock.X_FIELD,
                operator: '<'
            } as SimpleFilterDesign]
        } as CompoundFilterDesign)).toEqual(false);

        // Different table
        expect(compoundFilter.isCompatibleWithDesign({
            type: 'and',
            filters: [{
                datastore: 'testDatastore1',
                database: DatasetServiceMock.DATABASES[0],
                table: DatasetServiceMock.TABLES[1],
                field: DatasetServiceMock.X_FIELD,
                operator: '>'
            } as SimpleFilterDesign, {
                datastore: 'testDatastore1',
                database: DatasetServiceMock.DATABASES[0],
                table: DatasetServiceMock.TABLES[0],
                field: DatasetServiceMock.X_FIELD,
                operator: '<'
            } as SimpleFilterDesign]
        } as CompoundFilterDesign)).toEqual(false);

        // Different field
        expect(compoundFilter.isCompatibleWithDesign({
            type: 'and',
            filters: [{
                datastore: 'testDatastore1',
                database: DatasetServiceMock.DATABASES[0],
                table: DatasetServiceMock.TABLES[0],
                field: DatasetServiceMock.Y_FIELD,
                operator: '>'
            } as SimpleFilterDesign, {
                datastore: 'testDatastore1',
                database: DatasetServiceMock.DATABASES[0],
                table: DatasetServiceMock.TABLES[0],
                field: DatasetServiceMock.X_FIELD,
                operator: '<'
            } as SimpleFilterDesign]
        } as CompoundFilterDesign)).toEqual(false);

        // Different operator
        expect(compoundFilter.isCompatibleWithDesign({
            type: 'and',
            filters: [{
                datastore: 'testDatastore1',
                database: DatasetServiceMock.DATABASES[0],
                table: DatasetServiceMock.TABLES[0],
                field: DatasetServiceMock.X_FIELD,
                operator: '='
            } as SimpleFilterDesign, {
                datastore: 'testDatastore1',
                database: DatasetServiceMock.DATABASES[0],
                table: DatasetServiceMock.TABLES[0],
                field: DatasetServiceMock.X_FIELD,
                operator: '<'
            } as SimpleFilterDesign]
        } as CompoundFilterDesign)).toEqual(false);

        // Different optional status
        expect(compoundFilter.isCompatibleWithDesign({
            type: 'and',
            optional: true,
            filters: [{
                datastore: 'testDatastore1',
                database: DatasetServiceMock.DATABASES[0],
                table: DatasetServiceMock.TABLES[0],
                field: DatasetServiceMock.X_FIELD,
                operator: '>'
            } as SimpleFilterDesign, {
                datastore: 'testDatastore1',
                database: DatasetServiceMock.DATABASES[0],
                table: DatasetServiceMock.TABLES[0],
                field: DatasetServiceMock.X_FIELD,
                operator: '<'
            } as SimpleFilterDesign]
        } as CompoundFilterDesign)).toEqual(false);

        // Different value
        expect(compoundFilter.isCompatibleWithDesign({
            type: 'and',
            filters: [{
                datastore: 'testDatastore1',
                database: DatasetServiceMock.DATABASES[0],
                table: DatasetServiceMock.TABLES[0],
                field: DatasetServiceMock.X_FIELD,
                operator: '>',
                value: 1
            } as SimpleFilterDesign, {
                datastore: 'testDatastore1',
                database: DatasetServiceMock.DATABASES[0],
                table: DatasetServiceMock.TABLES[0],
                field: DatasetServiceMock.X_FIELD,
                operator: '<'
            } as SimpleFilterDesign]
        } as CompoundFilterDesign)).toEqual(false);

        // Different type
        expect(compoundFilter.isCompatibleWithDesign({
            type: 'or',
            filters: [{
                datastore: 'testDatastore1',
                database: DatasetServiceMock.DATABASES[0],
                table: DatasetServiceMock.TABLES[0],
                field: DatasetServiceMock.X_FIELD,
                operator: '>'
            } as SimpleFilterDesign, {
                datastore: 'testDatastore1',
                database: DatasetServiceMock.DATABASES[0],
                table: DatasetServiceMock.TABLES[0],
                field: DatasetServiceMock.X_FIELD,
                operator: '<'
            } as SimpleFilterDesign]
        } as CompoundFilterDesign)).toEqual(false);

        // Different structure
        expect(compoundFilter.isCompatibleWithDesign({
            type: 'and',
            filters: [{
                datastore: 'testDatastore1',
                database: DatasetServiceMock.DATABASES[0],
                table: DatasetServiceMock.TABLES[0],
                field: DatasetServiceMock.X_FIELD,
                operator: '>'
            } as SimpleFilterDesign, {
                datastore: 'testDatastore1',
                database: DatasetServiceMock.DATABASES[0],
                table: DatasetServiceMock.TABLES[0],
                field: DatasetServiceMock.X_FIELD,
                operator: '<'
            } as SimpleFilterDesign, {
                datastore: 'testDatastore1',
                database: DatasetServiceMock.DATABASES[0],
                table: DatasetServiceMock.TABLES[0],
                field: DatasetServiceMock.X_FIELD,
                operator: '='
            } as SimpleFilterDesign]
        } as CompoundFilterDesign)).toEqual(false);

        // Different structure
        expect(compoundFilter.isCompatibleWithDesign({
            type: 'and',
            filters: [{
                type: 'and',
                filters: [{
                    datastore: 'testDatastore1',
                    database: DatasetServiceMock.DATABASES[0],
                    table: DatasetServiceMock.TABLES[0],
                    field: DatasetServiceMock.X_FIELD,
                    operator: '>'
                } as SimpleFilterDesign, {
                    datastore: 'testDatastore1',
                    database: DatasetServiceMock.DATABASES[0],
                    table: DatasetServiceMock.TABLES[0],
                    field: DatasetServiceMock.X_FIELD,
                    operator: '<'
                } as SimpleFilterDesign]
            } as CompoundFilterDesign]
        } as CompoundFilterDesign)).toEqual(false);

        // Different structure
        expect(compoundFilter.isCompatibleWithDesign({
            datastore: 'testDatastore1',
            database: DatasetServiceMock.DATABASES[0],
            table: DatasetServiceMock.TABLES[0],
            field: DatasetServiceMock.X_FIELD,
            operator: '>'
        } as SimpleFilterDesign)).toEqual(false);
    });

    it('isEquivalentToFilter should return expected boolean', () => {
        // Different datastore
        let testFilter1 = FilterUtil.createFilterFromDesign({
            type: 'and',
            filters: [{
                datastore: 'testDatastore2',
                database: DatasetServiceMock.DATABASES[0],
                table: DatasetServiceMock.TABLES[0],
                field: DatasetServiceMock.X_FIELD,
                operator: '>',
                value: -100
            } as SimpleFilterDesign, {
                datastore: 'testDatastore1',
                database: DatasetServiceMock.DATABASES[0],
                table: DatasetServiceMock.TABLES[0],
                field: DatasetServiceMock.X_FIELD,
                operator: '<',
                value: 100
            } as SimpleFilterDesign]
        } as CompoundFilterDesign, searchService);

        // Different database
        let testFilter2 = FilterUtil.createFilterFromDesign({
            type: 'and',
            filters: [{
                datastore: 'testDatastore1',
                database: DatasetServiceMock.DATABASES[1],
                table: DatasetServiceMock.TABLES[0],
                field: DatasetServiceMock.X_FIELD,
                operator: '>',
                value: -100
            } as SimpleFilterDesign, {
                datastore: 'testDatastore1',
                database: DatasetServiceMock.DATABASES[0],
                table: DatasetServiceMock.TABLES[0],
                field: DatasetServiceMock.X_FIELD,
                operator: '<',
                value: 100
            } as SimpleFilterDesign]
        } as CompoundFilterDesign, searchService);

        // Different table
        let testFilter3 = FilterUtil.createFilterFromDesign({
            type: 'and',
            filters: [{
                datastore: 'testDatastore1',
                database: DatasetServiceMock.DATABASES[0],
                table: DatasetServiceMock.TABLES[1],
                field: DatasetServiceMock.X_FIELD,
                operator: '>',
                value: -100
            } as SimpleFilterDesign, {
                datastore: 'testDatastore1',
                database: DatasetServiceMock.DATABASES[0],
                table: DatasetServiceMock.TABLES[0],
                field: DatasetServiceMock.X_FIELD,
                operator: '<',
                value: 100
            } as SimpleFilterDesign]
        } as CompoundFilterDesign, searchService);

        // Different field
        let testFilter4 = FilterUtil.createFilterFromDesign({
            type: 'and',
            filters: [{
                datastore: 'testDatastore1',
                database: DatasetServiceMock.DATABASES[0],
                table: DatasetServiceMock.TABLES[0],
                field: DatasetServiceMock.Y_FIELD,
                operator: '>',
                value: -100
            } as SimpleFilterDesign, {
                datastore: 'testDatastore1',
                database: DatasetServiceMock.DATABASES[0],
                table: DatasetServiceMock.TABLES[0],
                field: DatasetServiceMock.X_FIELD,
                operator: '<',
                value: 100
            } as SimpleFilterDesign]
        } as CompoundFilterDesign, searchService);

        // Different operator
        let testFilter5 = FilterUtil.createFilterFromDesign({
            type: 'and',
            filters: [{
                datastore: 'testDatastore1',
                database: DatasetServiceMock.DATABASES[0],
                table: DatasetServiceMock.TABLES[0],
                field: DatasetServiceMock.X_FIELD,
                operator: '=',
                value: -100
            } as SimpleFilterDesign, {
                datastore: 'testDatastore1',
                database: DatasetServiceMock.DATABASES[0],
                table: DatasetServiceMock.TABLES[0],
                field: DatasetServiceMock.X_FIELD,
                operator: '<',
                value: 100
            } as SimpleFilterDesign]
        } as CompoundFilterDesign, searchService);

        // Different value
        let testFilter6 = FilterUtil.createFilterFromDesign({
            type: 'and',
            filters: [{
                datastore: 'testDatastore1',
                database: DatasetServiceMock.DATABASES[0],
                table: DatasetServiceMock.TABLES[0],
                field: DatasetServiceMock.X_FIELD,
                operator: '>',
                value: 1
            } as SimpleFilterDesign, {
                datastore: 'testDatastore1',
                database: DatasetServiceMock.DATABASES[0],
                table: DatasetServiceMock.TABLES[0],
                field: DatasetServiceMock.X_FIELD,
                operator: '<',
                value: 100
            } as SimpleFilterDesign]
        } as CompoundFilterDesign, searchService);

        // Different optional status
        let testFilter7 = FilterUtil.createFilterFromDesign({
            type: 'and',
            optional: true,
            filters: [{
                datastore: 'testDatastore1',
                database: DatasetServiceMock.DATABASES[0],
                table: DatasetServiceMock.TABLES[0],
                field: DatasetServiceMock.X_FIELD,
                operator: '>',
                value: -100
            } as SimpleFilterDesign, {
                datastore: 'testDatastore1',
                database: DatasetServiceMock.DATABASES[0],
                table: DatasetServiceMock.TABLES[0],
                field: DatasetServiceMock.X_FIELD,
                operator: '<',
                value: 100
            } as SimpleFilterDesign]
        } as CompoundFilterDesign, searchService);

        // Different type
        let testFilter8 = FilterUtil.createFilterFromDesign({
            type: 'or',
            filters: [{
                datastore: 'testDatastore1',
                database: DatasetServiceMock.DATABASES[0],
                table: DatasetServiceMock.TABLES[0],
                field: DatasetServiceMock.X_FIELD,
                operator: '>',
                value: -100
            } as SimpleFilterDesign, {
                datastore: 'testDatastore1',
                database: DatasetServiceMock.DATABASES[0],
                table: DatasetServiceMock.TABLES[0],
                field: DatasetServiceMock.X_FIELD,
                operator: '<',
                value: 100
            } as SimpleFilterDesign]
        } as CompoundFilterDesign, searchService);

        // Correct
        let testFilter9 = FilterUtil.createFilterFromDesign({
            type: 'and',
            filters: [{
                datastore: 'testDatastore1',
                database: DatasetServiceMock.DATABASES[0],
                table: DatasetServiceMock.TABLES[0],
                field: DatasetServiceMock.X_FIELD,
                operator: '>',
                value: -100
            } as SimpleFilterDesign, {
                datastore: 'testDatastore1',
                database: DatasetServiceMock.DATABASES[0],
                table: DatasetServiceMock.TABLES[0],
                field: DatasetServiceMock.X_FIELD,
                operator: '<',
                value: 100
            } as SimpleFilterDesign]
        } as CompoundFilterDesign, searchService);
        // TODO THOR-1078 Remove this line
        (testFilter9 as any).filters.forEach((filter) => filter.datastore = 'testDatastore1');

        expect(compoundFilter.isEquivalentToFilter(testFilter1)).toEqual(false);
        expect(compoundFilter.isEquivalentToFilter(testFilter2)).toEqual(false);
        expect(compoundFilter.isEquivalentToFilter(testFilter3)).toEqual(false);
        expect(compoundFilter.isEquivalentToFilter(testFilter4)).toEqual(false);
        expect(compoundFilter.isEquivalentToFilter(testFilter5)).toEqual(false);
        expect(compoundFilter.isEquivalentToFilter(testFilter6)).toEqual(false);
        expect(compoundFilter.isEquivalentToFilter(testFilter7)).toEqual(false);
        expect(compoundFilter.isEquivalentToFilter(testFilter8)).toEqual(false);
        expect(compoundFilter.isEquivalentToFilter(testFilter9)).toEqual(true);
    });

    it('toDesign should return expected object', () => {
        expect(compoundFilter.toDesign()).toEqual({
            type: 'and',
            id: compoundFilter.id,
            name: '(Test Database 1 / Test Table 1 / Test X Field > -100) and (Test Database 1 / Test Table 1 / Test X Field < 100)',
            optional: false,
            filters: [{
                id: compoundFilter.filters[0].id,
                name: 'Test Database 1 / Test Table 1 / Test X Field > -100',
                optional: false,
                datastore: 'testDatastore1',
                database: DatasetServiceMock.DATABASES[0],
                table: DatasetServiceMock.TABLES[0],
                field: DatasetServiceMock.X_FIELD,
                operator: '>',
                value: -100
            } as SimpleFilterDesign, {
                id: compoundFilter.filters[1].id,
                name: 'Test Database 1 / Test Table 1 / Test X Field < 100',
                optional: false,
                datastore: 'testDatastore1',
                database: DatasetServiceMock.DATABASES[0],
                table: DatasetServiceMock.TABLES[0],
                field: DatasetServiceMock.X_FIELD,
                operator: '<',
                value: 100
            } as SimpleFilterDesign]
        } as CompoundFilterDesign);
    });

    it('toString should return expected string', () => {
        expect(compoundFilter.toString()).toEqual('(Test Database 1 / Test Table 1 / Test X Field > -100) and ' +
            '(Test Database 1 / Test Table 1 / Test X Field < 100)');
    });

    it('toString on filter with name property should return name property', () => {
        compoundFilter.name = 'testName';
        expect(compoundFilter.toString()).toEqual('testName');
    });
});

describe('CompoundFilter (Multi-Field)', () => {
    let compoundFilter: any;
    let searchService: AbstractSearchService;

    initializeTestBed('Compound Filter (Multi-Field)', {
        providers: [
            { provide: AbstractSearchService, useClass: SearchServiceMock }
        ]
    });

    beforeEach(inject([AbstractSearchService], (_searchService) => {
        searchService = _searchService;
        compoundFilter = FilterUtil.createFilterFromDesign({
            type: 'or',
            filters: [{
                datastore: 'testDatastore1',
                database: DatasetServiceMock.DATABASES[0],
                table: DatasetServiceMock.TABLES[0],
                field: DatasetServiceMock.NAME_FIELD,
                operator: '=',
                value: 'testName1'
            } as SimpleFilterDesign, {
                datastore: 'testDatastore1',
                database: DatasetServiceMock.DATABASES[0],
                table: DatasetServiceMock.TABLES[0],
                field: DatasetServiceMock.X_FIELD,
                operator: '=',
                value: 10
            } as SimpleFilterDesign]
        } as CompoundFilterDesign, searchService);
        // TODO THOR-1078 Remove this line
        compoundFilter.filters.forEach((filter) => filter.datastore = 'testDatastore1');
    }));

    it('does have expected properties', () => {
        expect(compoundFilter.filterClause).toBeDefined();
        expect(compoundFilter.id).toBeDefined();
        expect(compoundFilter.name).toEqual('(Test Database 1 / Test Table 1 / Test Name Field = testName1) or ' +
            '(Test Database 1 / Test Table 1 / Test X Field = 10)');
        expect(compoundFilter.optional).toEqual(false);
        expect(compoundFilter.relations).toEqual([]);
        expect(compoundFilter.type).toEqual(CompoundFilterType.OR);

        expect(compoundFilter.filters.length).toEqual(2);
        expect(compoundFilter.filters[0].datastore).toEqual('testDatastore1');
        expect(compoundFilter.filters[0].database).toEqual(DatasetServiceMock.DATABASES[0]);
        expect(compoundFilter.filters[0].table).toEqual(DatasetServiceMock.TABLES[0]);
        expect(compoundFilter.filters[0].field).toEqual(DatasetServiceMock.NAME_FIELD);
        expect(compoundFilter.filters[0].operator).toEqual('=');
        expect(compoundFilter.filters[0].value).toEqual('testName1');
        expect(compoundFilter.filters[1].datastore).toEqual('testDatastore1');
        expect(compoundFilter.filters[1].database).toEqual(DatasetServiceMock.DATABASES[0]);
        expect(compoundFilter.filters[1].table).toEqual(DatasetServiceMock.TABLES[0]);
        expect(compoundFilter.filters[1].field).toEqual(DatasetServiceMock.X_FIELD);
        expect(compoundFilter.filters[1].operator).toEqual('=');
        expect(compoundFilter.filters[1].value).toEqual(10);
    });

    it('createRelationFilter should return null if substitue has bad data', () => {
        let actual = compoundFilter.createRelationFilter([{
            datastore: 'testDatastore1',
            database: DatasetServiceMock.DATABASES[0],
            table: DatasetServiceMock.TABLES[0],
            field: DatasetServiceMock.NAME_FIELD
        }], [{
            datastore: 'testDatastore1',
            database: DatasetServiceMock.DATABASES[0],
            table: DatasetServiceMock.TABLES[0],
            field: new FieldMetaData()
        }], searchService);
        expect(actual).toEqual(null);
    });

    it('createRelationFilter should return null if equivalent fields and substitue fields are not the same length', () => {
        let actual;

        actual = compoundFilter.createRelationFilter([{
            datastore: 'testDatastore1',
            database: DatasetServiceMock.DATABASES[0],
            table: DatasetServiceMock.TABLES[0],
            field: DatasetServiceMock.NAME_FIELD
        }, {
            datastore: 'testDatastore1',
            database: DatasetServiceMock.DATABASES[0],
            table: DatasetServiceMock.TABLES[0],
            field: DatasetServiceMock.X_FIELD
        }], [{
            datastore: 'testDatastore1',
            database: DatasetServiceMock.DATABASES[0],
            table: DatasetServiceMock.TABLES[0],
            field: DatasetServiceMock.TYPE_FIELD
        }], searchService);
        expect(actual).toEqual(null);

        actual = compoundFilter.createRelationFilter([{
            datastore: 'testDatastore1',
            database: DatasetServiceMock.DATABASES[0],
            table: DatasetServiceMock.TABLES[0],
            field: DatasetServiceMock.NAME_FIELD
        }], [{
            datastore: 'testDatastore1',
            database: DatasetServiceMock.DATABASES[0],
            table: DatasetServiceMock.TABLES[0],
            field: DatasetServiceMock.TYPE_FIELD
        }, {
            datastore: 'testDatastore1',
            database: DatasetServiceMock.DATABASES[0],
            table: DatasetServiceMock.TABLES[0],
            field: DatasetServiceMock.Y_FIELD
        }], searchService);
        expect(actual).toEqual(null);
    });

    it('createRelationFilter with single substitute field should return expected object', () => {
        let actual;

        let testSubstituteList = [{
            datastore: 'testDatastore2',
            database: DatasetServiceMock.DATABASES[1],
            table: DatasetServiceMock.TABLES[1],
            field: DatasetServiceMock.TYPE_FIELD
        }];

        actual = compoundFilter.createRelationFilter([{
            datastore: 'testDatastore1',
            database: DatasetServiceMock.DATABASES[0],
            table: DatasetServiceMock.TABLES[0],
            field: DatasetServiceMock.NAME_FIELD
        }], testSubstituteList, searchService);
        expect(actual.type).toEqual(CompoundFilterType.OR);
        expect(actual.optional).toEqual(false);
        expect(actual.filters.length).toEqual(2);
        expect(actual.filters[0].datastore).toEqual('testDatastore2');
        expect(actual.filters[0].database).toEqual(DatasetServiceMock.DATABASES[1]);
        expect(actual.filters[0].table).toEqual(DatasetServiceMock.TABLES[1]);
        expect(actual.filters[0].field).toEqual(DatasetServiceMock.TYPE_FIELD);
        expect(actual.filters[0].operator).toEqual('=');
        expect(actual.filters[0].value).toEqual('testName1');
        expect(actual.filters[1].datastore).toEqual('testDatastore1');
        expect(actual.filters[1].database).toEqual(DatasetServiceMock.DATABASES[0]);
        expect(actual.filters[1].table).toEqual(DatasetServiceMock.TABLES[0]);
        expect(actual.filters[1].field).toEqual(DatasetServiceMock.X_FIELD);
        expect(actual.filters[1].operator).toEqual('=');
        expect(actual.filters[1].value).toEqual(10);
    });

    it('createRelationFilter with multiple substitute fields should return expected object', () => {
        let actual;

        let testSubstituteList = [{
            datastore: 'testDatastore2',
            database: DatasetServiceMock.DATABASES[1],
            table: DatasetServiceMock.TABLES[1],
            field: DatasetServiceMock.TYPE_FIELD
        }, {
            datastore: 'testDatastore2',
            database: DatasetServiceMock.DATABASES[1],
            table: DatasetServiceMock.TABLES[1],
            field: DatasetServiceMock.Y_FIELD
        }];

        actual = compoundFilter.createRelationFilter([{
            datastore: 'testDatastore1',
            database: DatasetServiceMock.DATABASES[0],
            table: DatasetServiceMock.TABLES[0],
            field: DatasetServiceMock.NAME_FIELD
        }, {
            datastore: 'testDatastore1',
            database: DatasetServiceMock.DATABASES[0],
            table: DatasetServiceMock.TABLES[0],
            field: DatasetServiceMock.X_FIELD
        }], testSubstituteList, searchService);
        expect(actual.type).toEqual(CompoundFilterType.OR);
        expect(actual.optional).toEqual(false);
        expect(actual.filters.length).toEqual(2);
        expect(actual.filters[0].datastore).toEqual('testDatastore2');
        expect(actual.filters[0].database).toEqual(DatasetServiceMock.DATABASES[1]);
        expect(actual.filters[0].table).toEqual(DatasetServiceMock.TABLES[1]);
        expect(actual.filters[0].field).toEqual(DatasetServiceMock.TYPE_FIELD);
        expect(actual.filters[0].operator).toEqual('=');
        expect(actual.filters[0].value).toEqual('testName1');
        expect(actual.filters[1].datastore).toEqual('testDatastore2');
        expect(actual.filters[1].database).toEqual(DatasetServiceMock.DATABASES[1]);
        expect(actual.filters[1].table).toEqual(DatasetServiceMock.TABLES[1]);
        expect(actual.filters[1].field).toEqual(DatasetServiceMock.Y_FIELD);
        expect(actual.filters[1].operator).toEqual('=');
        expect(actual.filters[1].value).toEqual(10);
    });

    it('createRelationFilter should work with optional filter', () => {
        compoundFilter.optional = true;

        let testSubstituteList = [{
            datastore: 'testDatastore2',
            database: DatasetServiceMock.DATABASES[1],
            table: DatasetServiceMock.TABLES[1],
            field: DatasetServiceMock.TYPE_FIELD
        }, {
            datastore: 'testDatastore2',
            database: DatasetServiceMock.DATABASES[1],
            table: DatasetServiceMock.TABLES[1],
            field: DatasetServiceMock.Y_FIELD
        }];

        let actual = compoundFilter.createRelationFilter([{
            datastore: 'testDatastore1',
            database: DatasetServiceMock.DATABASES[0],
            table: DatasetServiceMock.TABLES[0],
            field: DatasetServiceMock.NAME_FIELD
        }, {
            datastore: 'testDatastore1',
            database: DatasetServiceMock.DATABASES[0],
            table: DatasetServiceMock.TABLES[0],
            field: DatasetServiceMock.X_FIELD
        }], testSubstituteList, searchService);
        expect(actual.type).toEqual(CompoundFilterType.OR);
        expect(actual.optional).toEqual(true);
        expect(actual.filters.length).toEqual(2);
        expect(actual.filters[0].datastore).toEqual('testDatastore2');
        expect(actual.filters[0].database).toEqual(DatasetServiceMock.DATABASES[1]);
        expect(actual.filters[0].table).toEqual(DatasetServiceMock.TABLES[1]);
        expect(actual.filters[0].field).toEqual(DatasetServiceMock.TYPE_FIELD);
        expect(actual.filters[0].operator).toEqual('=');
        expect(actual.filters[0].value).toEqual('testName1');
        expect(actual.filters[1].datastore).toEqual('testDatastore2');
        expect(actual.filters[1].database).toEqual(DatasetServiceMock.DATABASES[1]);
        expect(actual.filters[1].table).toEqual(DatasetServiceMock.TABLES[1]);
        expect(actual.filters[1].field).toEqual(DatasetServiceMock.Y_FIELD);
        expect(actual.filters[1].operator).toEqual('=');
        expect(actual.filters[1].value).toEqual(10);
    });

    it('doesAffectSearch should return expected boolean', () => {
        expect(compoundFilter.doesAffectSearch('testDatastore1', 'testDatabase1', 'testTable1')).toEqual(true);
        expect(compoundFilter.doesAffectSearch('testDatastore2', 'testDatabase1', 'testTable1')).toEqual(false);
        expect(compoundFilter.doesAffectSearch('testDatastore1', 'testDatabase2', 'testTable1')).toEqual(false);
        expect(compoundFilter.doesAffectSearch('testDatastore1', 'testDatabase1', 'testTable2')).toEqual(false);
    });

    it('isCompatibleWithDesign should return expected boolean', () => {
        // Correct, with value
        expect(compoundFilter.isCompatibleWithDesign({
            type: 'or',
            filters: [{
                datastore: 'testDatastore1',
                database: DatasetServiceMock.DATABASES[0],
                table: DatasetServiceMock.TABLES[0],
                field: DatasetServiceMock.NAME_FIELD,
                operator: '=',
                value: 'testName1'
            } as SimpleFilterDesign, {
                datastore: 'testDatastore1',
                database: DatasetServiceMock.DATABASES[0],
                table: DatasetServiceMock.TABLES[0],
                field: DatasetServiceMock.X_FIELD,
                operator: '=',
                value: 10
            } as SimpleFilterDesign]
        } as CompoundFilterDesign)).toEqual(true);

        // Correct
        expect(compoundFilter.isCompatibleWithDesign({
            type: 'or',
            filters: [{
                datastore: 'testDatastore1',
                database: DatasetServiceMock.DATABASES[0],
                table: DatasetServiceMock.TABLES[0],
                field: DatasetServiceMock.NAME_FIELD,
                operator: '='
            } as SimpleFilterDesign, {
                datastore: 'testDatastore1',
                database: DatasetServiceMock.DATABASES[0],
                table: DatasetServiceMock.TABLES[0],
                field: DatasetServiceMock.X_FIELD,
                operator: '='
            } as SimpleFilterDesign]
        } as CompoundFilterDesign)).toEqual(true);

        // Correct, with optional status
        expect(compoundFilter.isCompatibleWithDesign({
            type: 'or',
            optional: false,
            filters: [{
                datastore: 'testDatastore1',
                database: DatasetServiceMock.DATABASES[0],
                table: DatasetServiceMock.TABLES[0],
                field: DatasetServiceMock.NAME_FIELD,
                operator: '='
            } as SimpleFilterDesign, {
                datastore: 'testDatastore1',
                database: DatasetServiceMock.DATABASES[0],
                table: DatasetServiceMock.TABLES[0],
                field: DatasetServiceMock.X_FIELD,
                operator: '='
            } as SimpleFilterDesign]
        } as CompoundFilterDesign)).toEqual(true);

        // Correct, with rearranged structure
        expect(compoundFilter.isCompatibleWithDesign({
            type: 'or',
            filters: [{
                datastore: 'testDatastore1',
                database: DatasetServiceMock.DATABASES[0],
                table: DatasetServiceMock.TABLES[0],
                field: DatasetServiceMock.NAME_FIELD,
                operator: '='
            } as SimpleFilterDesign, {
                datastore: 'testDatastore1',
                database: DatasetServiceMock.DATABASES[0],
                table: DatasetServiceMock.TABLES[0],
                field: DatasetServiceMock.X_FIELD,
                operator: '='
            } as SimpleFilterDesign]
        } as CompoundFilterDesign)).toEqual(true);

        // Different datastore
        expect(compoundFilter.isCompatibleWithDesign({
            type: 'or',
            filters: [{
                datastore: 'testDatastore2',
                database: DatasetServiceMock.DATABASES[0],
                table: DatasetServiceMock.TABLES[0],
                field: DatasetServiceMock.NAME_FIELD,
                operator: '='
            } as SimpleFilterDesign, {
                datastore: 'testDatastore1',
                database: DatasetServiceMock.DATABASES[0],
                table: DatasetServiceMock.TABLES[0],
                field: DatasetServiceMock.X_FIELD,
                operator: '='
            } as SimpleFilterDesign]
        } as CompoundFilterDesign)).toEqual(false);

        // Different database
        expect(compoundFilter.isCompatibleWithDesign({
            type: 'or',
            filters: [{
                datastore: 'testDatastore1',
                database: DatasetServiceMock.DATABASES[1],
                table: DatasetServiceMock.TABLES[0],
                field: DatasetServiceMock.NAME_FIELD,
                operator: '='
            } as SimpleFilterDesign, {
                datastore: 'testDatastore1',
                database: DatasetServiceMock.DATABASES[0],
                table: DatasetServiceMock.TABLES[0],
                field: DatasetServiceMock.X_FIELD,
                operator: '='
            } as SimpleFilterDesign]
        } as CompoundFilterDesign)).toEqual(false);

        // Different table
        expect(compoundFilter.isCompatibleWithDesign({
            type: 'or',
            filters: [{
                datastore: 'testDatastore1',
                database: DatasetServiceMock.DATABASES[0],
                table: DatasetServiceMock.TABLES[1],
                field: DatasetServiceMock.NAME_FIELD,
                operator: '='
            } as SimpleFilterDesign, {
                datastore: 'testDatastore1',
                database: DatasetServiceMock.DATABASES[0],
                table: DatasetServiceMock.TABLES[0],
                field: DatasetServiceMock.X_FIELD,
                operator: '='
            } as SimpleFilterDesign]
        } as CompoundFilterDesign)).toEqual(false);

        // Different field
        expect(compoundFilter.isCompatibleWithDesign({
            type: 'or',
            filters: [{
                datastore: 'testDatastore1',
                database: DatasetServiceMock.DATABASES[0],
                table: DatasetServiceMock.TABLES[0],
                field: DatasetServiceMock.TYPE_FIELD,
                operator: '='
            } as SimpleFilterDesign, {
                datastore: 'testDatastore1',
                database: DatasetServiceMock.DATABASES[0],
                table: DatasetServiceMock.TABLES[0],
                field: DatasetServiceMock.X_FIELD,
                operator: '='
            } as SimpleFilterDesign]
        } as CompoundFilterDesign)).toEqual(false);

        // Different operator
        expect(compoundFilter.isCompatibleWithDesign({
            type: 'or',
            filters: [{
                datastore: 'testDatastore1',
                database: DatasetServiceMock.DATABASES[0],
                table: DatasetServiceMock.TABLES[0],
                field: DatasetServiceMock.NAME_FIELD,
                operator: '!='
            } as SimpleFilterDesign, {
                datastore: 'testDatastore1',
                database: DatasetServiceMock.DATABASES[0],
                table: DatasetServiceMock.TABLES[0],
                field: DatasetServiceMock.X_FIELD,
                operator: '='
            } as SimpleFilterDesign]
        } as CompoundFilterDesign)).toEqual(false);

        // Different optional status
        expect(compoundFilter.isCompatibleWithDesign({
            type: 'or',
            optional: true,
            filters: [{
                datastore: 'testDatastore1',
                database: DatasetServiceMock.DATABASES[0],
                table: DatasetServiceMock.TABLES[0],
                field: DatasetServiceMock.NAME_FIELD,
                operator: '='
            } as SimpleFilterDesign, {
                datastore: 'testDatastore1',
                database: DatasetServiceMock.DATABASES[0],
                table: DatasetServiceMock.TABLES[0],
                field: DatasetServiceMock.X_FIELD,
                operator: '='
            } as SimpleFilterDesign]
        } as CompoundFilterDesign)).toEqual(false);

        // Different value
        expect(compoundFilter.isCompatibleWithDesign({
            type: 'or',
            filters: [{
                datastore: 'testDatastore1',
                database: DatasetServiceMock.DATABASES[0],
                table: DatasetServiceMock.TABLES[0],
                field: DatasetServiceMock.NAME_FIELD,
                operator: '=',
                value: 1
            } as SimpleFilterDesign, {
                datastore: 'testDatastore1',
                database: DatasetServiceMock.DATABASES[0],
                table: DatasetServiceMock.TABLES[0],
                field: DatasetServiceMock.X_FIELD,
                operator: '='
            } as SimpleFilterDesign]
        } as CompoundFilterDesign)).toEqual(false);

        // Different type
        expect(compoundFilter.isCompatibleWithDesign({
            type: 'and',
            filters: [{
                datastore: 'testDatastore1',
                database: DatasetServiceMock.DATABASES[0],
                table: DatasetServiceMock.TABLES[0],
                field: DatasetServiceMock.NAME_FIELD,
                operator: '='
            } as SimpleFilterDesign, {
                datastore: 'testDatastore1',
                database: DatasetServiceMock.DATABASES[0],
                table: DatasetServiceMock.TABLES[0],
                field: DatasetServiceMock.X_FIELD,
                operator: '='
            } as SimpleFilterDesign]
        } as CompoundFilterDesign)).toEqual(false);

        // Different structure
        expect(compoundFilter.isCompatibleWithDesign({
            type: 'or',
            filters: [{
                datastore: 'testDatastore1',
                database: DatasetServiceMock.DATABASES[0],
                table: DatasetServiceMock.TABLES[0],
                field: DatasetServiceMock.NAME_FIELD,
                operator: '='
            } as SimpleFilterDesign, {
                datastore: 'testDatastore1',
                database: DatasetServiceMock.DATABASES[0],
                table: DatasetServiceMock.TABLES[0],
                field: DatasetServiceMock.X_FIELD,
                operator: '='
            } as SimpleFilterDesign, {
                datastore: 'testDatastore1',
                database: DatasetServiceMock.DATABASES[0],
                table: DatasetServiceMock.TABLES[0],
                field: DatasetServiceMock.NAME_FIELD,
                operator: '!='
            } as SimpleFilterDesign]
        } as CompoundFilterDesign)).toEqual(false);

        // Different structure
        expect(compoundFilter.isCompatibleWithDesign({
            type: 'or',
            filters: [{
                type: 'and',
                filters: [{
                    datastore: 'testDatastore1',
                    database: DatasetServiceMock.DATABASES[0],
                    table: DatasetServiceMock.TABLES[0],
                    field: DatasetServiceMock.NAME_FIELD,
                    operator: '='
                } as SimpleFilterDesign, {
                    datastore: 'testDatastore1',
                    database: DatasetServiceMock.DATABASES[0],
                    table: DatasetServiceMock.TABLES[0],
                    field: DatasetServiceMock.X_FIELD,
                    operator: '='
                } as SimpleFilterDesign]
            } as CompoundFilterDesign]
        } as CompoundFilterDesign)).toEqual(false);

        // Different structure
        expect(compoundFilter.isCompatibleWithDesign({
            datastore: 'testDatastore1',
            database: DatasetServiceMock.DATABASES[0],
            table: DatasetServiceMock.TABLES[0],
            field: DatasetServiceMock.NAME_FIELD,
            operator: '='
        } as SimpleFilterDesign)).toEqual(false);
    });

    it('isEquivalentToFilter should return expected boolean', () => {
        // Different datastore
        let testFilter1 = FilterUtil.createFilterFromDesign({
            type: 'and',
            filters: [{
                datastore: 'testDatastore2',
                database: DatasetServiceMock.DATABASES[0],
                table: DatasetServiceMock.TABLES[0],
                field: DatasetServiceMock.NAME_FIELD,
                operator: '=',
                value: 'testName1'
            } as SimpleFilterDesign, {
                datastore: 'testDatastore1',
                database: DatasetServiceMock.DATABASES[0],
                table: DatasetServiceMock.TABLES[0],
                field: DatasetServiceMock.X_FIELD,
                operator: '=',
                value: 10
            } as SimpleFilterDesign]
        } as CompoundFilterDesign, searchService);

        // Different database
        let testFilter2 = FilterUtil.createFilterFromDesign({
            type: 'and',
            filters: [{
                datastore: 'testDatastore1',
                database: DatasetServiceMock.DATABASES[1],
                table: DatasetServiceMock.TABLES[0],
                field: DatasetServiceMock.NAME_FIELD,
                operator: '=',
                value: 'testName1'
            } as SimpleFilterDesign, {
                datastore: 'testDatastore1',
                database: DatasetServiceMock.DATABASES[0],
                table: DatasetServiceMock.TABLES[0],
                field: DatasetServiceMock.X_FIELD,
                operator: '=',
                value: 10
            } as SimpleFilterDesign]
        } as CompoundFilterDesign, searchService);

        // Different table
        let testFilter3 = FilterUtil.createFilterFromDesign({
            type: 'and',
            filters: [{
                datastore: 'testDatastore1',
                database: DatasetServiceMock.DATABASES[0],
                table: DatasetServiceMock.TABLES[1],
                field: DatasetServiceMock.NAME_FIELD,
                operator: '=',
                value: 'testName1'
            } as SimpleFilterDesign, {
                datastore: 'testDatastore1',
                database: DatasetServiceMock.DATABASES[0],
                table: DatasetServiceMock.TABLES[0],
                field: DatasetServiceMock.X_FIELD,
                operator: '=',
                value: 10
            } as SimpleFilterDesign]
        } as CompoundFilterDesign, searchService);

        // Different field
        let testFilter4 = FilterUtil.createFilterFromDesign({
            type: 'and',
            filters: [{
                datastore: 'testDatastore1',
                database: DatasetServiceMock.DATABASES[0],
                table: DatasetServiceMock.TABLES[0],
                field: DatasetServiceMock.TYPE_FIELD,
                operator: '=',
                value: 'testName1'
            } as SimpleFilterDesign, {
                datastore: 'testDatastore1',
                database: DatasetServiceMock.DATABASES[0],
                table: DatasetServiceMock.TABLES[0],
                field: DatasetServiceMock.X_FIELD,
                operator: '=',
                value: 10
            } as SimpleFilterDesign]
        } as CompoundFilterDesign, searchService);

        // Different operator
        let testFilter5 = FilterUtil.createFilterFromDesign({
            type: 'and',
            filters: [{
                datastore: 'testDatastore1',
                database: DatasetServiceMock.DATABASES[0],
                table: DatasetServiceMock.TABLES[0],
                field: DatasetServiceMock.NAME_FIELD,
                operator: '!=',
                value: 'testName1'
            } as SimpleFilterDesign, {
                datastore: 'testDatastore1',
                database: DatasetServiceMock.DATABASES[0],
                table: DatasetServiceMock.TABLES[0],
                field: DatasetServiceMock.X_FIELD,
                operator: '=',
                value: 10
            } as SimpleFilterDesign]
        } as CompoundFilterDesign, searchService);

        // Different value
        let testFilter6 = FilterUtil.createFilterFromDesign({
            type: 'and',
            filters: [{
                datastore: 'testDatastore1',
                database: DatasetServiceMock.DATABASES[0],
                table: DatasetServiceMock.TABLES[0],
                field: DatasetServiceMock.NAME_FIELD,
                operator: '=',
                value: 1
            } as SimpleFilterDesign, {
                datastore: 'testDatastore1',
                database: DatasetServiceMock.DATABASES[0],
                table: DatasetServiceMock.TABLES[0],
                field: DatasetServiceMock.X_FIELD,
                operator: '=',
                value: 10
            } as SimpleFilterDesign]
        } as CompoundFilterDesign, searchService);

        // Different optional status
        let testFilter7 = FilterUtil.createFilterFromDesign({
            type: 'and',
            optional: true,
            filters: [{
                datastore: 'testDatastore1',
                database: DatasetServiceMock.DATABASES[0],
                table: DatasetServiceMock.TABLES[0],
                field: DatasetServiceMock.NAME_FIELD,
                operator: '=',
                value: 'testName1'
            } as SimpleFilterDesign, {
                datastore: 'testDatastore1',
                database: DatasetServiceMock.DATABASES[0],
                table: DatasetServiceMock.TABLES[0],
                field: DatasetServiceMock.X_FIELD,
                operator: '=',
                value: 10
            } as SimpleFilterDesign]
        } as CompoundFilterDesign, searchService);

        // Different type
        let testFilter8 = FilterUtil.createFilterFromDesign({
            type: 'or',
            filters: [{
                datastore: 'testDatastore1',
                database: DatasetServiceMock.DATABASES[0],
                table: DatasetServiceMock.TABLES[0],
                field: DatasetServiceMock.NAME_FIELD,
                operator: '=',
                value: 'testName1'
            } as SimpleFilterDesign, {
                datastore: 'testDatastore1',
                database: DatasetServiceMock.DATABASES[0],
                table: DatasetServiceMock.TABLES[0],
                field: DatasetServiceMock.X_FIELD,
                operator: '=',
                value: 10
            } as SimpleFilterDesign]
        } as CompoundFilterDesign, searchService);

        // Correct
        let testFilter9 = FilterUtil.createFilterFromDesign({
            type: 'or',
            filters: [{
                datastore: 'testDatastore1',
                database: DatasetServiceMock.DATABASES[0],
                table: DatasetServiceMock.TABLES[0],
                field: DatasetServiceMock.NAME_FIELD,
                operator: '=',
                value: 'testName1'
            } as SimpleFilterDesign, {
                datastore: 'testDatastore1',
                database: DatasetServiceMock.DATABASES[0],
                table: DatasetServiceMock.TABLES[0],
                field: DatasetServiceMock.X_FIELD,
                operator: '=',
                value: 10
            } as SimpleFilterDesign]
        } as CompoundFilterDesign, searchService);
        // TODO THOR-1078 Remove this line
        (testFilter9 as any).filters.forEach((filter) => filter.datastore = 'testDatastore1');

        expect(compoundFilter.isEquivalentToFilter(testFilter1)).toEqual(false);
        expect(compoundFilter.isEquivalentToFilter(testFilter2)).toEqual(false);
        expect(compoundFilter.isEquivalentToFilter(testFilter3)).toEqual(false);
        expect(compoundFilter.isEquivalentToFilter(testFilter4)).toEqual(false);
        expect(compoundFilter.isEquivalentToFilter(testFilter5)).toEqual(false);
        expect(compoundFilter.isEquivalentToFilter(testFilter6)).toEqual(false);
        expect(compoundFilter.isEquivalentToFilter(testFilter7)).toEqual(false);
        expect(compoundFilter.isEquivalentToFilter(testFilter8)).toEqual(false);
        expect(compoundFilter.isEquivalentToFilter(testFilter9)).toEqual(true);
    });

    it('toDesign should return expected object', () => {
        expect(compoundFilter.toDesign()).toEqual({
            type: 'or',
            id: compoundFilter.id,
            name: '(Test Database 1 / Test Table 1 / Test Name Field = testName1) or (Test Database 1 / Test Table 1 / Test X Field = 10)',
            optional: false,
            filters: [{
                id: compoundFilter.filters[0].id,
                name: 'Test Database 1 / Test Table 1 / Test Name Field = testName1',
                optional: false,
                datastore: 'testDatastore1',
                database: DatasetServiceMock.DATABASES[0],
                table: DatasetServiceMock.TABLES[0],
                field: DatasetServiceMock.NAME_FIELD,
                operator: '=',
                value: 'testName1'
            } as SimpleFilterDesign, {
                id: compoundFilter.filters[1].id,
                name: 'Test Database 1 / Test Table 1 / Test X Field = 10',
                optional: false,
                datastore: 'testDatastore1',
                database: DatasetServiceMock.DATABASES[0],
                table: DatasetServiceMock.TABLES[0],
                field: DatasetServiceMock.X_FIELD,
                operator: '=',
                value: 10
            } as SimpleFilterDesign]
        } as CompoundFilterDesign);
    });

    it('toString should return expected string', () => {
        expect(compoundFilter.toString()).toEqual('(Test Database 1 / Test Table 1 / Test Name Field = testName1) or ' +
            '(Test Database 1 / Test Table 1 / Test X Field = 10)');
    });

    it('toString on filter with name property should return name property', () => {
        compoundFilter.name = 'testName';
        expect(compoundFilter.toString()).toEqual('testName');
    });
});

describe('CompoundFilter (Nested Compound Filters)', () => {
    let compoundFilter: any;
    let searchService: AbstractSearchService;

    initializeTestBed('Compound Filter (Nested Compound Filters)', {
        providers: [
            { provide: AbstractSearchService, useClass: SearchServiceMock }
        ]
    });

    beforeEach(inject([AbstractSearchService], (_searchService) => {
        searchService = _searchService;
        compoundFilter = FilterUtil.createFilterFromDesign({
            type: 'and',
            filters: [{
                type: 'or',
                filters: [{
                    datastore: 'testDatastore1',
                    database: DatasetServiceMock.DATABASES[0],
                    table: DatasetServiceMock.TABLES[0],
                    field: DatasetServiceMock.X_FIELD,
                    operator: '=',
                    value: 10
                } as SimpleFilterDesign, {
                    datastore: 'testDatastore1',
                    database: DatasetServiceMock.DATABASES[0],
                    table: DatasetServiceMock.TABLES[0],
                    field: DatasetServiceMock.X_FIELD,
                    operator: '=',
                    value: 20
                } as SimpleFilterDesign]
            } as CompoundFilterDesign, {
                type: 'or',
                filters: [{
                    datastore: 'testDatastore1',
                    database: DatasetServiceMock.DATABASES[0],
                    table: DatasetServiceMock.TABLES[0],
                    field: DatasetServiceMock.NAME_FIELD,
                    operator: '=',
                    value: 'testName1'
                } as SimpleFilterDesign, {
                    datastore: 'testDatastore1',
                    database: DatasetServiceMock.DATABASES[0],
                    table: DatasetServiceMock.TABLES[0],
                    field: DatasetServiceMock.NAME_FIELD,
                    operator: '=',
                    value: 'testName2'
                } as SimpleFilterDesign]
            } as CompoundFilterDesign]
        } as CompoundFilterDesign, searchService);
        // TODO THOR-1078 Remove this line
        compoundFilter.filters.forEach((filter) => filter.filters.forEach((nestedFilter) => nestedFilter.datastore = 'testDatastore1'));
    }));

    it('does have expected properties', () => {
        expect(compoundFilter.filterClause).toBeDefined();
        expect(compoundFilter.id).toBeDefined();
        expect(compoundFilter.name).toEqual('((Test Database 1 / Test Table 1 / Test X Field = 10) or ' +
            '(Test Database 1 / Test Table 1 / Test X Field = 20)) and ' +
            '((Test Database 1 / Test Table 1 / Test Name Field = testName1) or ' +
            '(Test Database 1 / Test Table 1 / Test Name Field = testName2))');
        expect(compoundFilter.optional).toEqual(false);
        expect(compoundFilter.relations).toEqual([]);
        expect(compoundFilter.type).toEqual(CompoundFilterType.AND);

        expect(compoundFilter.filters.length).toEqual(2);
        expect(compoundFilter.filters[0].type).toEqual(CompoundFilterType.OR);
        expect(compoundFilter.filters[0].filters.length).toEqual(2);
        expect(compoundFilter.filters[0].filters[0].datastore).toEqual('testDatastore1');
        expect(compoundFilter.filters[0].filters[0].database).toEqual(DatasetServiceMock.DATABASES[0]);
        expect(compoundFilter.filters[0].filters[0].table).toEqual(DatasetServiceMock.TABLES[0]);
        expect(compoundFilter.filters[0].filters[0].field).toEqual(DatasetServiceMock.X_FIELD);
        expect(compoundFilter.filters[0].filters[0].operator).toEqual('=');
        expect(compoundFilter.filters[0].filters[0].value).toEqual(10);
        expect(compoundFilter.filters[0].filters[1].datastore).toEqual('testDatastore1');
        expect(compoundFilter.filters[0].filters[1].database).toEqual(DatasetServiceMock.DATABASES[0]);
        expect(compoundFilter.filters[0].filters[1].table).toEqual(DatasetServiceMock.TABLES[0]);
        expect(compoundFilter.filters[0].filters[1].field).toEqual(DatasetServiceMock.X_FIELD);
        expect(compoundFilter.filters[0].filters[1].operator).toEqual('=');
        expect(compoundFilter.filters[0].filters[1].value).toEqual(20);
        expect(compoundFilter.filters[1].type).toEqual(CompoundFilterType.OR);
        expect(compoundFilter.filters[1].filters.length).toEqual(2);
        expect(compoundFilter.filters[1].filters[0].datastore).toEqual('testDatastore1');
        expect(compoundFilter.filters[1].filters[0].database).toEqual(DatasetServiceMock.DATABASES[0]);
        expect(compoundFilter.filters[1].filters[0].table).toEqual(DatasetServiceMock.TABLES[0]);
        expect(compoundFilter.filters[1].filters[0].field).toEqual(DatasetServiceMock.NAME_FIELD);
        expect(compoundFilter.filters[1].filters[0].operator).toEqual('=');
        expect(compoundFilter.filters[1].filters[0].value).toEqual('testName1');
        expect(compoundFilter.filters[1].filters[1].datastore).toEqual('testDatastore1');
        expect(compoundFilter.filters[1].filters[1].database).toEqual(DatasetServiceMock.DATABASES[0]);
        expect(compoundFilter.filters[1].filters[1].table).toEqual(DatasetServiceMock.TABLES[0]);
        expect(compoundFilter.filters[1].filters[1].field).toEqual(DatasetServiceMock.NAME_FIELD);
        expect(compoundFilter.filters[1].filters[1].operator).toEqual('=');
        expect(compoundFilter.filters[1].filters[1].value).toEqual('testName2');
    });

    it('toDesign should return expected object', () => {
        expect(compoundFilter.toDesign()).toEqual({
            type: 'and',
            id: compoundFilter.id,
            name: '((Test Database 1 / Test Table 1 / Test X Field = 10) or (Test Database 1 / Test Table 1 / Test X Field = 20)) and ' +
                '((Test Database 1 / Test Table 1 / Test Name Field = testName1) or ' +
                '(Test Database 1 / Test Table 1 / Test Name Field = testName2))',
            optional: false,
            filters: [{
                type: 'or',
                id: compoundFilter.filters[0].id,
                name: '(Test Database 1 / Test Table 1 / Test X Field = 10) or (Test Database 1 / Test Table 1 / Test X Field = 20)',
                optional: false,
                filters: [{
                    id: compoundFilter.filters[0].filters[0].id,
                    name: 'Test Database 1 / Test Table 1 / Test X Field = 10',
                    optional: false,
                    datastore: 'testDatastore1',
                    database: DatasetServiceMock.DATABASES[0],
                    table: DatasetServiceMock.TABLES[0],
                    field: DatasetServiceMock.X_FIELD,
                    operator: '=',
                    value: 10
                } as SimpleFilterDesign, {
                    id: compoundFilter.filters[0].filters[1].id,
                    name: 'Test Database 1 / Test Table 1 / Test X Field = 20',
                    optional: false,
                    datastore: 'testDatastore1',
                    database: DatasetServiceMock.DATABASES[0],
                    table: DatasetServiceMock.TABLES[0],
                    field: DatasetServiceMock.X_FIELD,
                    operator: '=',
                    value: 20
                } as SimpleFilterDesign]
            } as CompoundFilterDesign, {
                type: 'or',
                id: compoundFilter.filters[1].id,
                name: '(Test Database 1 / Test Table 1 / Test Name Field = testName1) or ' +
                    '(Test Database 1 / Test Table 1 / Test Name Field = testName2)',
                optional: false,
                filters: [{
                    id: compoundFilter.filters[1].filters[0].id,
                    name: 'Test Database 1 / Test Table 1 / Test Name Field = testName1',
                    optional: false,
                    datastore: 'testDatastore1',
                    database: DatasetServiceMock.DATABASES[0],
                    table: DatasetServiceMock.TABLES[0],
                    field: DatasetServiceMock.NAME_FIELD,
                    operator: '=',
                    value: 'testName1'
                } as SimpleFilterDesign, {
                    id: compoundFilter.filters[1].filters[1].id,
                    name: 'Test Database 1 / Test Table 1 / Test Name Field = testName2',
                    optional: false,
                    datastore: 'testDatastore1',
                    database: DatasetServiceMock.DATABASES[0],
                    table: DatasetServiceMock.TABLES[0],
                    field: DatasetServiceMock.NAME_FIELD,
                    operator: '=',
                    value: 'testName2'
                } as SimpleFilterDesign]
            } as CompoundFilterDesign]
        } as CompoundFilterDesign);
    });
});

describe('FilterService with no filters', () => {
    let datasetService: DatasetService;
    let filterService: FilterService;
    let searchService: AbstractSearchService;

    initializeTestBed('Filter Service with no filters', {
        providers: [
            { provide: DatasetService, useClass: DatasetServiceMock },
            { provide: FilterService, useClass: FilterService },
            { provide: AbstractSearchService, useClass: SearchServiceMock },
            { provide: 'config', useValue: new NeonGTDConfig() }
        ]
    });

    beforeEach(inject([DatasetService, FilterService, AbstractSearchService], (_datasetService, _filterService, _searchService) => {
        datasetService = _datasetService;
        filterService = _filterService;
        searchService = _searchService;
    }));

    it('should have expected properties', () => {
        expect((filterService as any).filterCollection).toBeDefined();
        expect(((filterService as any).filterCollection as any).data.size).toEqual(0);
        expect((filterService as any).messenger).toBeDefined();
    });

    it('getFilters should return expected array', () => {
        expect(filterService.getFilters()).toEqual([]);
    });
});

describe('FilterService with filters', () => {
    let datasetService: DatasetService;
    let filterService: FilterService;
    let searchService: AbstractSearchService;
    let source1: FilterDataSource[];
    let source2: FilterDataSource[];
    let design1A: SimpleFilterDesign;
    let design1B: SimpleFilterDesign;
    let design1C: SimpleFilterDesign;
    let design1D: SimpleFilterDesign;
    let design2A: CompoundFilterDesign;
    let filter1A: any;
    let filter1B: any;
    let filter1C: any;
    let filter1D: any;
    let filter2A: any;
    let relationSource1: FilterDataSource[];
    let relationSource2: FilterDataSource[];
    let relationDesign1: SimpleFilterDesign;
    let relationDesign2: SimpleFilterDesign;
    let relationFilter1: any;
    let relationFilter2: any;

    initializeTestBed('Filter Service with filters', {
        providers: [
            { provide: DatasetService, useClass: DatasetServiceMock },
            { provide: FilterService, useClass: FilterService },
            { provide: AbstractSearchService, useClass: SearchServiceMock },
            { provide: 'config', useValue: new NeonGTDConfig() }
        ]
    });

    beforeEach(inject([DatasetService, FilterService, AbstractSearchService], (_datasetService, _filterService, _searchService) => {
        datasetService = _datasetService;
        filterService = _filterService;
        searchService = _searchService;

        source1 = [{
            datastoreName: '',
            databaseName: DatasetServiceMock.DATABASES[0].name,
            tableName: DatasetServiceMock.TABLES[0].name,
            fieldName: DatasetServiceMock.ID_FIELD.columnName,
            operator: '='
        } as FilterDataSource];
        source2 = [{
            datastoreName: '',
            databaseName: DatasetServiceMock.DATABASES[0].name,
            tableName: DatasetServiceMock.TABLES[0].name,
            fieldName: DatasetServiceMock.SIZE_FIELD.columnName,
            operator: '>'
        } as FilterDataSource, {
            datastoreName: '',
            databaseName: DatasetServiceMock.DATABASES[0].name,
            tableName: DatasetServiceMock.TABLES[0].name,
            fieldName: DatasetServiceMock.SIZE_FIELD.columnName,
            operator: '<'
        } as FilterDataSource];

        design1A = {
            optional: false,
            datastore: '',
            database: DatasetServiceMock.DATABASES[0],
            table: DatasetServiceMock.TABLES[0],
            field: DatasetServiceMock.ID_FIELD,
            operator: '=',
            value: 'testId1'
        } as SimpleFilterDesign;
        design1B = {
            optional: false,
            datastore: '',
            database: DatasetServiceMock.DATABASES[0],
            table: DatasetServiceMock.TABLES[0],
            field: DatasetServiceMock.ID_FIELD,
            operator: '=',
            value: 'testId2'
        } as SimpleFilterDesign;
        design1C = {
            optional: true,
            datastore: '',
            database: DatasetServiceMock.DATABASES[0],
            table: DatasetServiceMock.TABLES[0],
            field: DatasetServiceMock.ID_FIELD,
            operator: '=',
            value: 'testId3'
        } as SimpleFilterDesign;
        design1D = {
            optional: true,
            datastore: '',
            database: DatasetServiceMock.DATABASES[0],
            table: DatasetServiceMock.TABLES[0],
            field: DatasetServiceMock.ID_FIELD,
            operator: '=',
            value: 'testId4'
        } as SimpleFilterDesign;
        design2A = {
            type: 'and',
            optional: false,
            filters: [{
                optional: false,
                datastore: '',
                database: DatasetServiceMock.DATABASES[0],
                table: DatasetServiceMock.TABLES[0],
                field: DatasetServiceMock.SIZE_FIELD,
                operator: '>',
                value: 10
            } as SimpleFilterDesign, {
                optional: false,
                datastore: '',
                database: DatasetServiceMock.DATABASES[0],
                table: DatasetServiceMock.TABLES[0],
                field: DatasetServiceMock.SIZE_FIELD,
                operator: '<',
                value: 20
            } as SimpleFilterDesign]
        } as CompoundFilterDesign;

        filter1A = FilterUtil.createFilterFromDesign(design1A, searchService);
        filter1B = FilterUtil.createFilterFromDesign(design1B, searchService);
        filter1C = FilterUtil.createFilterFromDesign(design1C, searchService);
        filter1D = FilterUtil.createFilterFromDesign(design1D, searchService);
        filter2A = FilterUtil.createFilterFromDesign(design2A, searchService);

        design1A.id = filter1A.id;
        design1A.name = filter1A.name;
        design1B.id = filter1B.id;
        design1B.name = filter1B.name;
        design1C.id = filter1C.id;
        design1C.name = filter1C.name;
        design1D.id = filter1D.id;
        design1D.name = filter1D.name;
        design2A.id = filter2A.id;
        design2A.name = filter2A.name;
        design2A.filters[0].id = filter2A.filters[0].id;
        design2A.filters[0].name = filter2A.filters[0].name;
        design2A.filters[1].id = filter2A.filters[1].id;
        design2A.filters[1].name = filter2A.filters[1].name;

        (filterService as any).filterCollection.setFiltersInDualLists(source1, [filter1A, filter1B], [filter1C, filter1D],
            searchService);
        (filterService as any).filterCollection.setFiltersInDualLists(source2, [filter2A], [], searchService);
    }));

    afterEach(() => {
        // Services are not recreated in each test so we must reset the internal data.
        ((filterService as any).filterCollection as any).data.clear();
    });

    /**
     * Generates test relation filters and activates them in the FilterService.
     */
    let activateRelationFilters = () => {
        generateRelationFilters();
        (filterService as any).filterCollection.setFiltersInDualLists(relationSource1, [relationFilter1], [], searchService);
        (filterService as any).filterCollection.setFiltersInDualLists(relationSource2, [relationFilter2], [], searchService);
    };

    /**
     * Generates test relation filters.
     */
    let generateRelationFilters = () => {
        relationSource1 = [{
            datastoreName: '',
            databaseName: DatasetServiceMock.DATABASES[0].name,
            tableName: DatasetServiceMock.TABLES[0].name,
            fieldName: DatasetServiceMock.RELATION_FIELD_A.columnName,
            operator: '='
        } as FilterDataSource];
        relationSource2 = [{
            datastoreName: '',
            databaseName: DatasetServiceMock.DATABASES[0].name,
            tableName: DatasetServiceMock.TABLES[0].name,
            fieldName: DatasetServiceMock.RELATION_FIELD_B.columnName,
            operator: '='
        } as FilterDataSource];

        relationDesign1 = {
            optional: false,
            datastore: '',
            database: DatasetServiceMock.DATABASES[0],
            table: DatasetServiceMock.TABLES[0],
            field: DatasetServiceMock.RELATION_FIELD_A,
            operator: '=',
            value: 'testRelation'
        } as SimpleFilterDesign;
        relationDesign2 = {
            optional: false,
            datastore: '',
            database: DatasetServiceMock.DATABASES[0],
            table: DatasetServiceMock.TABLES[0],
            field: DatasetServiceMock.RELATION_FIELD_B,
            operator: '=',
            value: 'testRelation'
        } as SimpleFilterDesign;

        relationFilter1 = FilterUtil.createFilterFromDesign(relationDesign1, searchService);
        relationFilter2 = FilterUtil.createFilterFromDesign(relationDesign2, searchService);
        relationFilter1.relations = [relationFilter2.id];
        relationFilter2.relations = [relationFilter1.id];

        relationDesign1.id = relationFilter1.id;
        relationDesign1.name = relationFilter1.name;
        relationDesign2.id = relationFilter2.id;
        relationDesign2.name = relationFilter2.name;

        spyOn(datasetService, 'findRelationDataList').and.returnValue([[
            [{
                datastore: '',
                database: DatasetServiceMock.DATABASES[0],
                table: DatasetServiceMock.TABLES[0],
                field: DatasetServiceMock.RELATION_FIELD_A
            }],
            [{
                datastore: '',
                database: DatasetServiceMock.DATABASES[0],
                table: DatasetServiceMock.TABLES[0],
                field: DatasetServiceMock.RELATION_FIELD_B
            }]
        ]]);
    };

    it('should have expected properties', () => {
        expect((filterService as any).filterCollection.getDataSources()).toEqual([source1, source2]);
        expect((filterService as any).filterCollection.getFiltersInSingleList(source1)).toEqual([filter1A, filter1B, filter1C, filter1D]);
        expect((filterService as any).filterCollection.getFiltersFromRequiredList(source1)).toEqual([filter1A, filter1B]);
        expect((filterService as any).filterCollection.getFiltersFromOptionalList(source1)).toEqual([filter1C, filter1D]);
        expect((filterService as any).filterCollection.getFiltersInSingleList(source2)).toEqual([filter2A]);
        expect((filterService as any).filterCollection.getFiltersFromRequiredList(source2)).toEqual([filter2A]);
        expect((filterService as any).filterCollection.getFiltersFromOptionalList(source2)).toEqual([]);
        expect((filterService as any).messenger).toBeDefined();
    });

    it('deleteFilter should delete filter and publish a FILTERS_CHANGED event', () => {
        let spy = spyOn((filterService as any).messenger, 'publish');

        let actual = filterService.deleteFilter('testCaller', design1A, searchService);

        expect((filterService as any).filterCollection.getFiltersInSingleList(source1)).toEqual([filter1B, filter1C, filter1D]);
        expect((filterService as any).filterCollection.getFiltersFromRequiredList(source1)).toEqual([filter1B]);
        expect((filterService as any).filterCollection.getFiltersFromOptionalList(source1)).toEqual([filter1C, filter1D]);
        expect((filterService as any).filterCollection.getFiltersInSingleList(source2)).toEqual([filter2A]);

        expect(actual.size).toEqual(2);
        let keys = Array.from(actual.keys());
        expect(keys).toEqual([source1, source2]);
        expect(actual.get(keys[0])).toEqual([design1B, design1C, design1D]);
        expect(actual.get(keys[1])).toEqual([design2A]);

        expect(spy.calls.count()).toEqual(1);
        expect(spy.calls.argsFor(0)).toEqual([neonEvents.FILTERS_CHANGED, {
            change: actual,
            caller: 'testCaller'
        }]);
    });

    it('deleteFilter should also delete relation filters', () => {
        activateRelationFilters();

        let spy = spyOn((filterService as any).messenger, 'publish');

        let actual = filterService.deleteFilter('testCaller', relationDesign1, searchService);

        expect((filterService as any).filterCollection.getFiltersInSingleList(relationSource1)).toEqual([]);
        expect((filterService as any).filterCollection.getFiltersInSingleList(relationSource2)).toEqual([]);

        expect(actual.size).toEqual(4);
        let keys = Array.from(actual.keys());
        expect(keys).toEqual([source1, source2, relationSource1, relationSource2]);
        expect(actual.get(keys[0])).toEqual([design1A, design1B, design1C, design1D]);
        expect(actual.get(keys[1])).toEqual([design2A]);
        expect(actual.get(keys[2])).toEqual([]);
        expect(actual.get(keys[3])).toEqual([]);

        expect(spy.calls.count()).toEqual(1);
        expect(spy.calls.argsFor(0)).toEqual([neonEvents.FILTERS_CHANGED, {
            change: actual,
            caller: 'testCaller'
        }]);
    });

    it('deleteFilters should delete all filters and publish a FILTERS_CHANGED event', () => {
        let spy = spyOn((filterService as any).messenger, 'publish');

        let actual = filterService.deleteFilters('testCaller', searchService);

        expect((filterService as any).filterCollection.getFiltersInSingleList(source1)).toEqual([]);
        expect((filterService as any).filterCollection.getFiltersInSingleList(source2)).toEqual([]);

        expect(actual.size).toEqual(2);
        let keys = Array.from(actual.keys());
        expect(keys).toEqual([source1, source2]);
        expect(actual.get(keys[0])).toEqual([]);
        expect(actual.get(keys[1])).toEqual([]);

        expect(spy.calls.count()).toEqual(1);
        expect(spy.calls.argsFor(0)).toEqual([neonEvents.FILTERS_CHANGED, {
            change: actual,
            caller: 'testCaller'
        }]);
    });

    it('deleteFilters with filter-list-to-delete should delete argument filters', () => {
        let spy = spyOn((filterService as any).messenger, 'publish');

        let actual = filterService.deleteFilters('testCaller', searchService, [design1A]);

        expect((filterService as any).filterCollection.getFiltersInSingleList(source1)).toEqual([]);
        expect((filterService as any).filterCollection.getFiltersFromRequiredList(source1)).toEqual([]);
        expect((filterService as any).filterCollection.getFiltersFromOptionalList(source1)).toEqual([]);
        expect((filterService as any).filterCollection.getFiltersInSingleList(source2)).toEqual([filter2A]);

        expect(actual.size).toEqual(2);
        let keys = Array.from(actual.keys());
        expect(keys).toEqual([source1, source2]);
        expect(actual.get(keys[0])).toEqual([]);
        expect(actual.get(keys[1])).toEqual([design2A]);

        expect(spy.calls.count()).toEqual(1);
        expect(spy.calls.argsFor(0)).toEqual([neonEvents.FILTERS_CHANGED, {
            change: actual,
            caller: 'testCaller'
        }]);
    });

    it('deleteFilters should also delete relation filters', () => {
        activateRelationFilters();

        let spy = spyOn((filterService as any).messenger, 'publish');

        let actual = filterService.deleteFilters('testCaller', searchService, [relationDesign1]);

        expect((filterService as any).filterCollection.getFiltersInSingleList(relationSource1)).toEqual([]);
        expect((filterService as any).filterCollection.getFiltersInSingleList(relationSource2)).toEqual([]);

        expect(actual.size).toEqual(4);
        let keys = Array.from(actual.keys());
        expect(keys).toEqual([source1, source2, relationSource1, relationSource2]);
        expect(actual.get(keys[0])).toEqual([design1A, design1B, design1C, design1D]);
        expect(actual.get(keys[1])).toEqual([design2A]);
        expect(actual.get(keys[2])).toEqual([]);
        expect(actual.get(keys[3])).toEqual([]);

        expect(spy.calls.count()).toEqual(1);
        expect(spy.calls.argsFor(0)).toEqual([neonEvents.FILTERS_CHANGED, {
            change: actual,
            caller: 'testCaller'
        }]);
    });

    it('deleteFilters should not publish any event if no filters are affected', () => {
        let spy = spyOn((filterService as any).messenger, 'publish');

        let actual = filterService.deleteFilters('testCaller', searchService, [{
            datastore: '',
            database: DatasetServiceMock.DATABASES[0],
            table: DatasetServiceMock.TABLES[0],
            field: DatasetServiceMock.TEXT_FIELD,
            operator: '='
        } as SimpleFilterDesign]);

        expect(actual.size).toEqual(3);
        let keys = Array.from(actual.keys());
        expect(keys).toEqual([source1, source2, [{
            datastoreName: '',
            databaseName: DatasetServiceMock.DATABASES[0].name,
            tableName: DatasetServiceMock.TABLES[0].name,
            fieldName: DatasetServiceMock.TEXT_FIELD.columnName,
            operator: '='
        } as FilterDataSource]]);
        expect(actual.get(keys[0])).toEqual([design1A, design1B, design1C, design1D]);
        expect(actual.get(keys[1])).toEqual([design2A]);
        expect(actual.get(keys[2])).toEqual([]);

        expect(spy.calls.count()).toEqual(0);
    });

    it('exchangeFilters should add new filters and publish a FILTERS_CHANGED event', () => {
        let spy = spyOn((filterService as any).messenger, 'publish');

        let testDesign = {
            optional: false,
            datastore: '',
            database: DatasetServiceMock.DATABASES[0],
            table: DatasetServiceMock.TABLES[0],
            field: DatasetServiceMock.TEXT_FIELD,
            operator: '=',
            value: 'testText'
        } as SimpleFilterDesign;

        let testSource = [{
            datastoreName: '',
            databaseName: DatasetServiceMock.DATABASES[0].name,
            tableName: DatasetServiceMock.TABLES[0].name,
            fieldName: DatasetServiceMock.TEXT_FIELD.columnName,
            operator: '='
        } as FilterDataSource];

        let actual = filterService.exchangeFilters('testCaller', [testDesign], [], searchService);

        expect((filterService as any).filterCollection.getFiltersInSingleList(source1)).toEqual([filter1A, filter1B, filter1C, filter1D]);
        expect((filterService as any).filterCollection.getFiltersFromRequiredList(source1)).toEqual([filter1A, filter1B]);
        expect((filterService as any).filterCollection.getFiltersFromOptionalList(source1)).toEqual([filter1C, filter1D]);
        expect((filterService as any).filterCollection.getFiltersInSingleList(source2)).toEqual([filter2A]);

        let listComplete = (filterService as any).filterCollection.getFiltersInSingleList(testSource);
        expect(listComplete.length).toEqual(1);
        expect(listComplete[0].database).toEqual(DatasetServiceMock.DATABASES[0]);
        expect(listComplete[0].table).toEqual(DatasetServiceMock.TABLES[0]);
        expect(listComplete[0].field).toEqual(DatasetServiceMock.TEXT_FIELD);
        expect(listComplete[0].operator).toEqual('=');
        expect(listComplete[0].value).toEqual('testText');

        let listRequired = (filterService as any).filterCollection.getFiltersFromRequiredList(testSource);
        expect(listRequired).toEqual(listComplete);

        testDesign.id = listComplete[0].id;
        testDesign.name = listComplete[0].name;

        expect((filterService as any).filterCollection.getFiltersFromOptionalList(testSource)).toEqual([]);

        expect(actual.size).toEqual(3);
        let keys = Array.from(actual.keys());
        expect(keys).toEqual([source1, source2, testSource]);
        expect(actual.get(keys[0])).toEqual([design1A, design1B, design1C, design1D]);
        expect(actual.get(keys[1])).toEqual([design2A]);
        expect(actual.get(keys[2])).toEqual([testDesign]);

        expect(spy.calls.count()).toEqual(1);
        expect(spy.calls.argsFor(0)).toEqual([neonEvents.FILTERS_CHANGED, {
            change: actual,
            caller: 'testCaller'
        }]);
    });

    it('exchangeFilters should delete old filters and publish a FILTERS_CHANGED event', () => {
        let spy = spyOn((filterService as any).messenger, 'publish');

        let testDesign = {
            optional: false,
            datastore: '',
            database: DatasetServiceMock.DATABASES[0],
            table: DatasetServiceMock.TABLES[0],
            field: DatasetServiceMock.ID_FIELD,
            operator: '=',
            value: 'testId5'
        } as SimpleFilterDesign;

        let actual = filterService.exchangeFilters('testCaller', [testDesign], [], searchService);

        let listComplete = (filterService as any).filterCollection.getFiltersInSingleList(source1);
        expect(listComplete.length).toEqual(1);
        expect(listComplete[0].database).toEqual(DatasetServiceMock.DATABASES[0]);
        expect(listComplete[0].table).toEqual(DatasetServiceMock.TABLES[0]);
        expect(listComplete[0].field).toEqual(DatasetServiceMock.ID_FIELD);
        expect(listComplete[0].operator).toEqual('=');
        expect(listComplete[0].value).toEqual('testId5');

        let listRequired = (filterService as any).filterCollection.getFiltersFromRequiredList(source1);
        expect(listRequired).toEqual(listComplete);

        testDesign.id = listComplete[0].id;
        testDesign.name = listComplete[0].name;

        expect((filterService as any).filterCollection.getFiltersFromOptionalList(source1)).toEqual([]);
        expect((filterService as any).filterCollection.getFiltersInSingleList(source2)).toEqual([filter2A]);

        expect(actual.size).toEqual(2);
        let keys = Array.from(actual.keys());
        expect(keys).toEqual([source1, source2]);
        expect(actual.get(keys[0])).toEqual([testDesign]);
        expect(actual.get(keys[1])).toEqual([design2A]);

        expect(spy.calls.count()).toEqual(1);
        expect(spy.calls.argsFor(0)).toEqual([neonEvents.FILTERS_CHANGED, {
            change: actual,
            caller: 'testCaller'
        }]);
    });

    it('exchangeFilters should work with optional filters', () => {
        let spy = spyOn((filterService as any).messenger, 'publish');

        let testDesign = {
            optional: true,
            datastore: '',
            database: DatasetServiceMock.DATABASES[0],
            table: DatasetServiceMock.TABLES[0],
            field: DatasetServiceMock.TEXT_FIELD,
            operator: '=',
            value: 'testText'
        } as SimpleFilterDesign;

        let testSource = [{
            datastoreName: '',
            databaseName: DatasetServiceMock.DATABASES[0].name,
            tableName: DatasetServiceMock.TABLES[0].name,
            fieldName: DatasetServiceMock.TEXT_FIELD.columnName,
            operator: '='
        } as FilterDataSource];

        let actual = filterService.exchangeFilters('testCaller', [testDesign], [], searchService);

        expect((filterService as any).filterCollection.getFiltersInSingleList(source1)).toEqual([filter1A, filter1B, filter1C, filter1D]);
        expect((filterService as any).filterCollection.getFiltersFromRequiredList(source1)).toEqual([filter1A, filter1B]);
        expect((filterService as any).filterCollection.getFiltersFromOptionalList(source1)).toEqual([filter1C, filter1D]);
        expect((filterService as any).filterCollection.getFiltersInSingleList(source2)).toEqual([filter2A]);

        let listComplete = (filterService as any).filterCollection.getFiltersInSingleList(testSource);
        expect(listComplete.length).toEqual(1);
        expect(listComplete[0].database).toEqual(DatasetServiceMock.DATABASES[0]);
        expect(listComplete[0].table).toEqual(DatasetServiceMock.TABLES[0]);
        expect(listComplete[0].field).toEqual(DatasetServiceMock.TEXT_FIELD);
        expect(listComplete[0].operator).toEqual('=');
        expect(listComplete[0].value).toEqual('testText');

        let listOptional = (filterService as any).filterCollection.getFiltersFromOptionalList(testSource);
        expect(listOptional).toEqual(listComplete);

        testDesign.id = listComplete[0].id;
        testDesign.name = listComplete[0].name;

        expect((filterService as any).filterCollection.getFiltersFromRequiredList(testSource)).toEqual([]);

        expect(actual.size).toEqual(3);
        let keys = Array.from(actual.keys());
        expect(keys).toEqual([source1, source2, testSource]);
        expect(actual.get(keys[0])).toEqual([design1A, design1B, design1C, design1D]);
        expect(actual.get(keys[1])).toEqual([design2A]);
        expect(actual.get(keys[2])).toEqual([testDesign]);

        expect(spy.calls.count()).toEqual(1);
        expect(spy.calls.argsFor(0)).toEqual([neonEvents.FILTERS_CHANGED, {
            change: actual,
            caller: 'testCaller'
        }]);
    });

    it('exchangeFilters should also add new relation filters', () => {
        generateRelationFilters();

        let spy = spyOn((filterService as any).messenger, 'publish');

        let actual = filterService.exchangeFilters('testCaller', [relationDesign1], datasetService.findRelationDataList(), searchService);

        expect((filterService as any).filterCollection.getFiltersInSingleList(source1)).toEqual([filter1A, filter1B, filter1C, filter1D]);
        expect((filterService as any).filterCollection.getFiltersFromRequiredList(source1)).toEqual([filter1A, filter1B]);
        expect((filterService as any).filterCollection.getFiltersFromOptionalList(source1)).toEqual([filter1C, filter1D]);
        expect((filterService as any).filterCollection.getFiltersInSingleList(source2)).toEqual([filter2A]);

        let listComplete = (filterService as any).filterCollection.getFiltersInSingleList(relationSource1);
        expect(listComplete.length).toEqual(1);
        expect(listComplete[0].database).toEqual(DatasetServiceMock.DATABASES[0]);
        expect(listComplete[0].table).toEqual(DatasetServiceMock.TABLES[0]);
        expect(listComplete[0].field).toEqual(DatasetServiceMock.RELATION_FIELD_A);
        expect(listComplete[0].operator).toEqual('=');
        expect(listComplete[0].value).toEqual('testRelation');

        let listRequired = (filterService as any).filterCollection.getFiltersFromRequiredList(relationSource1);
        expect(listRequired).toEqual(listComplete);

        relationDesign1.id = listComplete[0].id;
        relationDesign1.name = listComplete[0].name;

        listComplete = (filterService as any).filterCollection.getFiltersInSingleList(relationSource2);
        expect(listComplete.length).toEqual(1);
        expect(listComplete[0].database).toEqual(DatasetServiceMock.DATABASES[0]);
        expect(listComplete[0].table).toEqual(DatasetServiceMock.TABLES[0]);
        expect(listComplete[0].field).toEqual(DatasetServiceMock.RELATION_FIELD_B);
        expect(listComplete[0].operator).toEqual('=');
        expect(listComplete[0].value).toEqual('testRelation');

        listRequired = (filterService as any).filterCollection.getFiltersFromRequiredList(relationSource2);
        expect(listRequired).toEqual(listComplete);

        relationDesign2.id = listComplete[0].id;
        relationDesign2.name = listComplete[0].name;

        expect((filterService as any).filterCollection.getFiltersFromOptionalList(relationSource1)).toEqual([]);
        expect((filterService as any).filterCollection.getFiltersFromOptionalList(relationSource2)).toEqual([]);

        expect(actual.size).toEqual(4);
        let keys = Array.from(actual.keys());
        expect(keys).toEqual([source1, source2, relationSource1, relationSource2]);
        expect(actual.get(keys[0])).toEqual([design1A, design1B, design1C, design1D]);
        expect(actual.get(keys[1])).toEqual([design2A]);
        expect(actual.get(keys[2])).toEqual([relationDesign1]);
        expect(actual.get(keys[3])).toEqual([relationDesign2]);

        expect(spy.calls.count()).toEqual(1);
        expect(spy.calls.argsFor(0)).toEqual([neonEvents.FILTERS_CHANGED, {
            change: actual,
            caller: 'testCaller'
        }]);
    });

    it('exchangeFilters should also delete old relation filters', () => {
        activateRelationFilters();

        let spy = spyOn((filterService as any).messenger, 'publish');

        let testDesign2 = {
            optional: false,
            datastore: '',
            database: DatasetServiceMock.DATABASES[0],
            table: DatasetServiceMock.TABLES[0],
            field: DatasetServiceMock.RELATION_FIELD_B,
            operator: '=',
            value: 'testExchangeRelation'
        } as SimpleFilterDesign;

        let actual = filterService.exchangeFilters('testCaller', [testDesign2], datasetService.findRelationDataList(), searchService);

        expect((filterService as any).filterCollection.getFiltersInSingleList(source1)).toEqual([filter1A, filter1B, filter1C, filter1D]);
        expect((filterService as any).filterCollection.getFiltersFromRequiredList(source1)).toEqual([filter1A, filter1B]);
        expect((filterService as any).filterCollection.getFiltersFromOptionalList(source1)).toEqual([filter1C, filter1D]);
        expect((filterService as any).filterCollection.getFiltersInSingleList(source2)).toEqual([filter2A]);

        let listComplete = (filterService as any).filterCollection.getFiltersInSingleList(relationSource1);
        expect(listComplete.length).toEqual(1);
        expect(listComplete[0].database).toEqual(DatasetServiceMock.DATABASES[0]);
        expect(listComplete[0].table).toEqual(DatasetServiceMock.TABLES[0]);
        expect(listComplete[0].field).toEqual(DatasetServiceMock.RELATION_FIELD_A);
        expect(listComplete[0].operator).toEqual('=');
        expect(listComplete[0].value).toEqual('testExchangeRelation');

        let listRequired = (filterService as any).filterCollection.getFiltersFromRequiredList(relationSource1);
        expect(listRequired).toEqual(listComplete);

        let testDesign1 = {
            id: listComplete[0].id,
            name: listComplete[0].name,
            optional: false,
            datastore: '',
            database: DatasetServiceMock.DATABASES[0],
            table: DatasetServiceMock.TABLES[0],
            field: DatasetServiceMock.RELATION_FIELD_A,
            operator: '=',
            value: 'testExchangeRelation'
        } as SimpleFilterDesign;

        listComplete = (filterService as any).filterCollection.getFiltersInSingleList(relationSource2);
        expect(listComplete.length).toEqual(1);
        expect(listComplete[0].database).toEqual(DatasetServiceMock.DATABASES[0]);
        expect(listComplete[0].table).toEqual(DatasetServiceMock.TABLES[0]);
        expect(listComplete[0].field).toEqual(DatasetServiceMock.RELATION_FIELD_B);
        expect(listComplete[0].operator).toEqual('=');
        expect(listComplete[0].value).toEqual('testExchangeRelation');

        listRequired = (filterService as any).filterCollection.getFiltersFromRequiredList(relationSource2);
        expect(listRequired).toEqual(listComplete);

        testDesign2.id = listComplete[0].id;
        testDesign2.name = listComplete[0].name;

        expect((filterService as any).filterCollection.getFiltersFromOptionalList(relationSource1)).toEqual([]);
        expect((filterService as any).filterCollection.getFiltersFromOptionalList(relationSource2)).toEqual([]);

        expect(actual.size).toEqual(4);
        let keys = Array.from(actual.keys());
        expect(keys).toEqual([source1, source2, relationSource1, relationSource2]);
        expect(actual.get(keys[0])).toEqual([design1A, design1B, design1C, design1D]);
        expect(actual.get(keys[1])).toEqual([design2A]);
        expect(actual.get(keys[2])).toEqual([testDesign1]);
        expect(actual.get(keys[3])).toEqual([testDesign2]);

        expect(spy.calls.count()).toEqual(1);
        expect(spy.calls.argsFor(0)).toEqual([neonEvents.FILTERS_CHANGED, {
            change: actual,
            caller: 'testCaller'
        }]);
    });

    it('exchangeFilters with filter-list-to-delete should delete argument filters', () => {
        let spy = spyOn((filterService as any).messenger, 'publish');

        let actual = filterService.exchangeFilters('testCaller', [], [], searchService, [design1A]);

        expect((filterService as any).filterCollection.getFiltersInSingleList(source1)).toEqual([]);
        expect((filterService as any).filterCollection.getFiltersFromRequiredList(source1)).toEqual([]);
        expect((filterService as any).filterCollection.getFiltersFromOptionalList(source1)).toEqual([]);
        expect((filterService as any).filterCollection.getFiltersInSingleList(source2)).toEqual([filter2A]);

        expect(actual.size).toEqual(2);
        let keys = Array.from(actual.keys());
        expect(keys).toEqual([source1, source2]);
        expect(actual.get(keys[0])).toEqual([]);
        expect(actual.get(keys[1])).toEqual([design2A]);

        expect(spy.calls.count()).toEqual(1);
        expect(spy.calls.argsFor(0)).toEqual([neonEvents.FILTERS_CHANGED, {
            change: actual,
            caller: 'testCaller'
        }]);
    });

    it('exchangeFilters with filter-list-to-delete should also delete relation filters', () => {
        activateRelationFilters();

        let spy = spyOn((filterService as any).messenger, 'publish');

        let actual = filterService.exchangeFilters('testCaller', [], [], searchService, [relationDesign1]);

        expect((filterService as any).filterCollection.getFiltersInSingleList(relationSource1)).toEqual([]);
        expect((filterService as any).filterCollection.getFiltersInSingleList(relationSource2)).toEqual([]);

        expect(actual.size).toEqual(4);
        let keys = Array.from(actual.keys());
        expect(keys).toEqual([source1, source2, relationSource1, relationSource2]);
        expect(actual.get(keys[0])).toEqual([design1A, design1B, design1C, design1D]);
        expect(actual.get(keys[1])).toEqual([design2A]);
        expect(actual.get(keys[2])).toEqual([]);
        expect(actual.get(keys[3])).toEqual([]);

        expect(spy.calls.count()).toEqual(1);
        expect(spy.calls.argsFor(0)).toEqual([neonEvents.FILTERS_CHANGED, {
            change: actual,
            caller: 'testCaller'
        }]);
    });

    it('exchangeFilters should not publish any event if no filters are affected', () => {
        let spy = spyOn((filterService as any).messenger, 'publish');

        let actual = filterService.exchangeFilters('testCaller', [], [], searchService);

        expect((filterService as any).filterCollection.getFiltersInSingleList(source1)).toEqual([filter1A, filter1B, filter1C, filter1D]);
        expect((filterService as any).filterCollection.getFiltersFromRequiredList(source1)).toEqual([filter1A, filter1B]);
        expect((filterService as any).filterCollection.getFiltersFromOptionalList(source1)).toEqual([filter1C, filter1D]);
        expect((filterService as any).filterCollection.getFiltersInSingleList(source2)).toEqual([filter2A]);

        expect(actual.size).toEqual(2);
        let keys = Array.from(actual.keys());
        expect(keys).toEqual([source1, source2]);
        expect(actual.get(keys[0])).toEqual([design1A, design1B, design1C, design1D]);
        expect(actual.get(keys[1])).toEqual([design2A]);

        expect(spy.calls.count()).toEqual(0);
    });

    it('getFilters should return expected array', () => {
        expect(filterService.getFilters()).toEqual([design1A, design1B, design1C, design1D, design2A]);
        expect(filterService.getFilters(source1)).toEqual([design1A, design1B, design1C, design1D]);
        expect(filterService.getFilters(source2)).toEqual([design2A]);
        expect(filterService.getFilters([{
            datastoreName: '',
            databaseName: DatasetServiceMock.DATABASES[0].name,
            tableName: DatasetServiceMock.TABLES[0].name,
            fieldName: DatasetServiceMock.ID_FIELD.columnName,
            operator: '!='
        } as FilterDataSource])).toEqual([]);
    });

    it('getFiltersToSearch should return expected array', () => {
        expect(filterService.getFiltersToSearch('fakeDatastore1', 'testDatabase1', 'testTable1')).toEqual([]);
        expect(filterService.getFiltersToSearch('', 'fakeDatabase1', 'testTable1')).toEqual([]);
        expect(filterService.getFiltersToSearch('', 'testDatabase1', 'fakeTable1')).toEqual([]);
        expect(filterService.getFiltersToSearch('', 'testDatabase1', 'testTable1')).toEqual([{
            type: 'and',
            filters: [{
                field: 'testIdField',
                operator: '=',
                value: 'testId1'
            }, {
                field: 'testIdField',
                operator: '=',
                value: 'testId2'
            }]
        }, {
            type: 'or',
            filters: [{
                field: 'testIdField',
                operator: '=',
                value: 'testId3'
            }, {
                field: 'testIdField',
                operator: '=',
                value: 'testId4'
            }]
        }, {
            type: 'and',
            filters: [{
                field: 'testSizeField',
                operator: '>',
                value: 10
            }, {
                field: 'testSizeField',
                operator: '<',
                value: 20
            }]
        }]);
    });

    it('getFiltersToSearch with filter-list-to-ignore should return expected array', () => {
        expect(filterService.getFiltersToSearch('', 'testDatabase1', 'testTable1', [])).toEqual([{
            type: 'and',
            filters: [{
                field: 'testIdField',
                operator: '=',
                value: 'testId1'
            }, {
                field: 'testIdField',
                operator: '=',
                value: 'testId2'
            }]
        }, {
            type: 'or',
            filters: [{
                field: 'testIdField',
                operator: '=',
                value: 'testId3'
            }, {
                field: 'testIdField',
                operator: '=',
                value: 'testId4'
            }]
        }, {
            type: 'and',
            filters: [{
                field: 'testSizeField',
                operator: '>',
                value: 10
            }, {
                field: 'testSizeField',
                operator: '<',
                value: 20
            }]
        }]);

        expect(filterService.getFiltersToSearch('', 'testDatabase1', 'testTable1', [design1A])).toEqual([{
            type: 'and',
            filters: [{
                field: 'testSizeField',
                operator: '>',
                value: 10
            }, {
                field: 'testSizeField',
                operator: '<',
                value: 20
            }]
        }]);

        expect(filterService.getFiltersToSearch('', 'testDatabase1', 'testTable1', [design2A])).toEqual([{
            type: 'and',
            filters: [{
                field: 'testIdField',
                operator: '=',
                value: 'testId1'
            }, {
                field: 'testIdField',
                operator: '=',
                value: 'testId2'
            }]
        }, {
            type: 'or',
            filters: [{
                field: 'testIdField',
                operator: '=',
                value: 'testId3'
            }, {
                field: 'testIdField',
                operator: '=',
                value: 'testId4'
            }]
        }]);

        expect(filterService.getFiltersToSearch('', 'testDatabase1', 'testTable1', [design1A, design2A])).toEqual([]);
    });

    it('setFilters should change filterCollection', () => {
        let actual;

        filterService.setFilters([], searchService);
        expect((filterService as any).filterCollection.getDataSources()).toEqual([]);

        filterService.setFilters([design1A], searchService);
        expect((filterService as any).filterCollection.getDataSources()).toEqual([source1]);
        actual = (filterService as any).filterCollection.getFiltersInSingleList(source1);
        expect(actual.length).toEqual(1);
        expect(actual[0].database).toEqual(DatasetServiceMock.DATABASES[0]);
        expect(actual[0].table).toEqual(DatasetServiceMock.TABLES[0]);
        expect(actual[0].field).toEqual(DatasetServiceMock.ID_FIELD);
        expect(actual[0].operator).toEqual('=');
        expect(actual[0].value).toEqual('testId1');
        expect(actual[0].optional).toEqual(false);
        expect((filterService as any).filterCollection.getFiltersFromRequiredList(source1).length).toEqual(1);
        expect((filterService as any).filterCollection.getFiltersFromOptionalList(source1).length).toEqual(0);

        filterService.setFilters([design1A, design1B, design1C, design1D], searchService);
        expect((filterService as any).filterCollection.getDataSources()).toEqual([source1]);
        actual = (filterService as any).filterCollection.getFiltersInSingleList(source1);
        expect(actual.length).toEqual(4);
        expect(actual[0].database).toEqual(DatasetServiceMock.DATABASES[0]);
        expect(actual[0].table).toEqual(DatasetServiceMock.TABLES[0]);
        expect(actual[0].field).toEqual(DatasetServiceMock.ID_FIELD);
        expect(actual[0].operator).toEqual('=');
        expect(actual[0].value).toEqual('testId1');
        expect(actual[0].optional).toEqual(false);
        expect(actual[1].database).toEqual(DatasetServiceMock.DATABASES[0]);
        expect(actual[1].table).toEqual(DatasetServiceMock.TABLES[0]);
        expect(actual[1].field).toEqual(DatasetServiceMock.ID_FIELD);
        expect(actual[1].operator).toEqual('=');
        expect(actual[1].value).toEqual('testId2');
        expect(actual[1].optional).toEqual(false);
        expect(actual[2].database).toEqual(DatasetServiceMock.DATABASES[0]);
        expect(actual[2].table).toEqual(DatasetServiceMock.TABLES[0]);
        expect(actual[2].field).toEqual(DatasetServiceMock.ID_FIELD);
        expect(actual[2].operator).toEqual('=');
        expect(actual[2].value).toEqual('testId3');
        expect(actual[2].optional).toEqual(true);
        expect(actual[3].database).toEqual(DatasetServiceMock.DATABASES[0]);
        expect(actual[3].table).toEqual(DatasetServiceMock.TABLES[0]);
        expect(actual[3].field).toEqual(DatasetServiceMock.ID_FIELD);
        expect(actual[3].operator).toEqual('=');
        expect(actual[3].value).toEqual('testId4');
        expect(actual[3].optional).toEqual(true);
        expect((filterService as any).filterCollection.getFiltersFromRequiredList(source1).length).toEqual(2);
        expect((filterService as any).filterCollection.getFiltersFromOptionalList(source1).length).toEqual(2);

        filterService.setFilters([design2A], searchService);
        expect((filterService as any).filterCollection.getDataSources()).toEqual([source2]);
        actual = (filterService as any).filterCollection.getFiltersInSingleList(source2);
        expect(actual.length).toEqual(1);
        expect(actual[0].type).toEqual(CompoundFilterType.AND);
        expect(actual[0].optional).toEqual(false);
        expect(actual[0].filters.length).toEqual(2);
        expect(actual[0].filters[0].database).toEqual(DatasetServiceMock.DATABASES[0]);
        expect(actual[0].filters[0].table).toEqual(DatasetServiceMock.TABLES[0]);
        expect(actual[0].filters[0].field).toEqual(DatasetServiceMock.SIZE_FIELD);
        expect(actual[0].filters[0].operator).toEqual('>');
        expect(actual[0].filters[0].value).toEqual(10);
        expect(actual[0].filters[1].database).toEqual(DatasetServiceMock.DATABASES[0]);
        expect(actual[0].filters[1].table).toEqual(DatasetServiceMock.TABLES[0]);
        expect(actual[0].filters[1].field).toEqual(DatasetServiceMock.SIZE_FIELD);
        expect(actual[0].filters[1].operator).toEqual('<');
        expect(actual[0].filters[1].value).toEqual(20);
        expect((filterService as any).filterCollection.getFiltersFromRequiredList(source2).length).toEqual(1);
        expect((filterService as any).filterCollection.getFiltersFromOptionalList(source2).length).toEqual(0);

        filterService.setFilters([design1A, design1B, design2A], searchService);
        expect((filterService as any).filterCollection.getDataSources()).toEqual([source1, source2]);
        actual = (filterService as any).filterCollection.getFiltersInSingleList(source1);
        expect(actual.length).toEqual(2);
        expect(actual[0].database).toEqual(DatasetServiceMock.DATABASES[0]);
        expect(actual[0].table).toEqual(DatasetServiceMock.TABLES[0]);
        expect(actual[0].field).toEqual(DatasetServiceMock.ID_FIELD);
        expect(actual[0].operator).toEqual('=');
        expect(actual[0].value).toEqual('testId1');
        expect(actual[0].optional).toEqual(false);
        expect(actual[1].database).toEqual(DatasetServiceMock.DATABASES[0]);
        expect(actual[1].table).toEqual(DatasetServiceMock.TABLES[0]);
        expect(actual[1].field).toEqual(DatasetServiceMock.ID_FIELD);
        expect(actual[1].operator).toEqual('=');
        expect(actual[1].value).toEqual('testId2');
        expect(actual[1].optional).toEqual(false);
        actual = (filterService as any).filterCollection.getFiltersInSingleList(source2);
        expect(actual.length).toEqual(1);
        expect(actual[0].type).toEqual(CompoundFilterType.AND);
        expect(actual[0].optional).toEqual(false);
        expect(actual[0].filters.length).toEqual(2);
        expect(actual[0].filters[0].database).toEqual(DatasetServiceMock.DATABASES[0]);
        expect(actual[0].filters[0].table).toEqual(DatasetServiceMock.TABLES[0]);
        expect(actual[0].filters[0].field).toEqual(DatasetServiceMock.SIZE_FIELD);
        expect(actual[0].filters[0].operator).toEqual('>');
        expect(actual[0].filters[0].value).toEqual(10);
        expect(actual[0].filters[1].database).toEqual(DatasetServiceMock.DATABASES[0]);
        expect(actual[0].filters[1].table).toEqual(DatasetServiceMock.TABLES[0]);
        expect(actual[0].filters[1].field).toEqual(DatasetServiceMock.SIZE_FIELD);
        expect(actual[0].filters[1].operator).toEqual('<');
        expect(actual[0].filters[1].value).toEqual(20);
    });

    it('toggleFilters should add new filters to an existing data source and publish a FILTERS_CHANGED event', () => {
        let spy = spyOn((filterService as any).messenger, 'publish');

        let testDesign = {
            optional: false,
            datastore: '',
            database: DatasetServiceMock.DATABASES[0],
            table: DatasetServiceMock.TABLES[0],
            field: DatasetServiceMock.ID_FIELD,
            operator: '=',
            value: 'testId5'
        } as SimpleFilterDesign;

        let actual = filterService.toggleFilters('testCaller', [testDesign], [], searchService);

        let listComplete = (filterService as any).filterCollection.getFiltersInSingleList(source1);
        expect(listComplete.length).toEqual(5);
        expect(listComplete[0]).toEqual(filter1A);
        expect(listComplete[1]).toEqual(filter1B);
        expect(listComplete[2].database).toEqual(DatasetServiceMock.DATABASES[0]);
        expect(listComplete[2].table).toEqual(DatasetServiceMock.TABLES[0]);
        expect(listComplete[2].field).toEqual(DatasetServiceMock.ID_FIELD);
        expect(listComplete[2].operator).toEqual('=');
        expect(listComplete[2].value).toEqual('testId5');
        expect(listComplete[3]).toEqual(filter1C);
        expect(listComplete[4]).toEqual(filter1D);

        let listRequired = (filterService as any).filterCollection.getFiltersFromRequiredList(source1);
        expect(listRequired).toEqual(listComplete.slice(0, 3));

        testDesign.id = listComplete[2].id;
        testDesign.name = listComplete[2].name;

        expect((filterService as any).filterCollection.getFiltersFromOptionalList(source1)).toEqual([filter1C, filter1D]);
        expect((filterService as any).filterCollection.getFiltersInSingleList(source2)).toEqual([filter2A]);

        expect(actual.size).toEqual(2);
        let keys = Array.from(actual.keys());
        expect(keys).toEqual([source1, source2]);
        expect(actual.get(keys[0])).toEqual([design1A, design1B, testDesign, design1C, design1D]);
        expect(actual.get(keys[1])).toEqual([design2A]);

        expect(spy.calls.count()).toEqual(1);
        expect(spy.calls.argsFor(0)).toEqual([neonEvents.FILTERS_CHANGED, {
            change: actual,
            caller: 'testCaller'
        }]);
    });

    it('toggleFilters should add new filters to a new data source and publish a FILTERS_CHANGED event', () => {
        let spy = spyOn((filterService as any).messenger, 'publish');

        let testDesign = {
            optional: false,
            datastore: '',
            database: DatasetServiceMock.DATABASES[0],
            table: DatasetServiceMock.TABLES[0],
            field: DatasetServiceMock.TEXT_FIELD,
            operator: '=',
            value: 'testText'
        } as SimpleFilterDesign;

        let testSource = [{
            datastoreName: '',
            databaseName: DatasetServiceMock.DATABASES[0].name,
            tableName: DatasetServiceMock.TABLES[0].name,
            fieldName: DatasetServiceMock.TEXT_FIELD.columnName,
            operator: '='
        } as FilterDataSource];

        let actual = filterService.toggleFilters('testCaller', [testDesign], [], searchService);

        expect((filterService as any).filterCollection.getFiltersInSingleList(source1)).toEqual([filter1A, filter1B, filter1C, filter1D]);
        expect((filterService as any).filterCollection.getFiltersFromRequiredList(source1)).toEqual([filter1A, filter1B]);
        expect((filterService as any).filterCollection.getFiltersFromOptionalList(source1)).toEqual([filter1C, filter1D]);
        expect((filterService as any).filterCollection.getFiltersInSingleList(source2)).toEqual([filter2A]);

        let listComplete = (filterService as any).filterCollection.getFiltersInSingleList(testSource);
        expect(listComplete.length).toEqual(1);
        expect(listComplete[0].database).toEqual(DatasetServiceMock.DATABASES[0]);
        expect(listComplete[0].table).toEqual(DatasetServiceMock.TABLES[0]);
        expect(listComplete[0].field).toEqual(DatasetServiceMock.TEXT_FIELD);
        expect(listComplete[0].operator).toEqual('=');
        expect(listComplete[0].value).toEqual('testText');

        let listRequired = (filterService as any).filterCollection.getFiltersFromRequiredList(testSource);
        expect(listRequired).toEqual(listComplete);

        testDesign.id = listComplete[0].id;
        testDesign.name = listComplete[0].name;

        expect((filterService as any).filterCollection.getFiltersFromOptionalList(testSource)).toEqual([]);

        expect(actual.size).toEqual(3);
        let keys = Array.from(actual.keys());
        expect(keys).toEqual([source1, source2, testSource]);
        expect(actual.get(keys[0])).toEqual([design1A, design1B, design1C, design1D]);
        expect(actual.get(keys[1])).toEqual([design2A]);
        expect(actual.get(keys[2])).toEqual([testDesign]);

        expect(spy.calls.count()).toEqual(1);
        expect(spy.calls.argsFor(0)).toEqual([neonEvents.FILTERS_CHANGED, {
            change: actual,
            caller: 'testCaller'
        }]);
    });

    it('toggleFilters should delete old argument filters and publish a FILTERS_CHANGED event', () => {
        let spy = spyOn((filterService as any).messenger, 'publish');

        let actual = filterService.toggleFilters('testCaller', [design1A, design1C], [], searchService);

        expect((filterService as any).filterCollection.getFiltersInSingleList(source1)).toEqual([filter1B, filter1D]);
        expect((filterService as any).filterCollection.getFiltersFromRequiredList(source1)).toEqual([filter1B]);
        expect((filterService as any).filterCollection.getFiltersFromOptionalList(source1)).toEqual([filter1D]);
        expect((filterService as any).filterCollection.getFiltersInSingleList(source2)).toEqual([filter2A]);

        expect(actual.size).toEqual(2);
        let keys = Array.from(actual.keys());
        expect(keys).toEqual([source1, source2]);
        expect(actual.get(keys[0])).toEqual([design1B, design1D]);
        expect(actual.get(keys[1])).toEqual([design2A]);

        expect(spy.calls.count()).toEqual(1);
        expect(spy.calls.argsFor(0)).toEqual([neonEvents.FILTERS_CHANGED, {
            change: actual,
            caller: 'testCaller'
        }]);
    });

    it('toggleFilters should add new argument filters, delete old argument filters, and publish a FILTERS_CHANGED event', () => {
        let spy = spyOn((filterService as any).messenger, 'publish');

        let testDesign = {
            optional: false,
            datastore: '',
            database: DatasetServiceMock.DATABASES[0],
            table: DatasetServiceMock.TABLES[0],
            field: DatasetServiceMock.TEXT_FIELD,
            operator: '=',
            value: 'testText'
        } as SimpleFilterDesign;

        let testSource = [{
            datastoreName: '',
            databaseName: DatasetServiceMock.DATABASES[0].name,
            tableName: DatasetServiceMock.TABLES[0].name,
            fieldName: DatasetServiceMock.TEXT_FIELD.columnName,
            operator: '='
        } as FilterDataSource];

        let actual = filterService.toggleFilters('testCaller', [testDesign, design1A], [], searchService);

        expect((filterService as any).filterCollection.getFiltersInSingleList(source1)).toEqual([filter1B, filter1C, filter1D]);
        expect((filterService as any).filterCollection.getFiltersFromRequiredList(source1)).toEqual([filter1B]);
        expect((filterService as any).filterCollection.getFiltersFromOptionalList(source1)).toEqual([filter1C, filter1D]);
        expect((filterService as any).filterCollection.getFiltersInSingleList(source2)).toEqual([filter2A]);

        let listComplete = (filterService as any).filterCollection.getFiltersInSingleList(testSource);
        expect(listComplete.length).toEqual(1);
        expect(listComplete[0].database).toEqual(DatasetServiceMock.DATABASES[0]);
        expect(listComplete[0].table).toEqual(DatasetServiceMock.TABLES[0]);
        expect(listComplete[0].field).toEqual(DatasetServiceMock.TEXT_FIELD);
        expect(listComplete[0].operator).toEqual('=');
        expect(listComplete[0].value).toEqual('testText');

        let listRequired = (filterService as any).filterCollection.getFiltersFromRequiredList(testSource);
        expect(listRequired).toEqual(listComplete);

        testDesign.id = listComplete[0].id;
        testDesign.name = listComplete[0].name;

        expect((filterService as any).filterCollection.getFiltersFromOptionalList(testSource)).toEqual([]);

        expect(actual.size).toEqual(3);
        let keys = Array.from(actual.keys());
        expect(keys).toEqual([source1, source2, testSource]);
        expect(actual.get(keys[0])).toEqual([design1B, design1C, design1D]);
        expect(actual.get(keys[1])).toEqual([design2A]);
        expect(actual.get(keys[2])).toEqual([testDesign]);

        expect(spy.calls.count()).toEqual(1);
        expect(spy.calls.argsFor(0)).toEqual([neonEvents.FILTERS_CHANGED, {
            change: actual,
            caller: 'testCaller'
        }]);
    });

    it('toggleFilters should work with optional filters', () => {
        let spy = spyOn((filterService as any).messenger, 'publish');

        let testDesign = {
            optional: true,
            datastore: '',
            database: DatasetServiceMock.DATABASES[0],
            table: DatasetServiceMock.TABLES[0],
            field: DatasetServiceMock.TEXT_FIELD,
            operator: '=',
            value: 'testText'
        } as SimpleFilterDesign;

        let testSource = [{
            datastoreName: '',
            databaseName: DatasetServiceMock.DATABASES[0].name,
            tableName: DatasetServiceMock.TABLES[0].name,
            fieldName: DatasetServiceMock.TEXT_FIELD.columnName,
            operator: '='
        } as FilterDataSource];

        let actual = filterService.toggleFilters('testCaller', [testDesign], [], searchService);

        expect((filterService as any).filterCollection.getFiltersInSingleList(source1)).toEqual([filter1A, filter1B, filter1C, filter1D]);
        expect((filterService as any).filterCollection.getFiltersFromRequiredList(source1)).toEqual([filter1A, filter1B]);
        expect((filterService as any).filterCollection.getFiltersFromOptionalList(source1)).toEqual([filter1C, filter1D]);
        expect((filterService as any).filterCollection.getFiltersInSingleList(source2)).toEqual([filter2A]);

        let listComplete = (filterService as any).filterCollection.getFiltersInSingleList(testSource);
        expect(listComplete.length).toEqual(1);
        expect(listComplete[0].database).toEqual(DatasetServiceMock.DATABASES[0]);
        expect(listComplete[0].table).toEqual(DatasetServiceMock.TABLES[0]);
        expect(listComplete[0].field).toEqual(DatasetServiceMock.TEXT_FIELD);
        expect(listComplete[0].operator).toEqual('=');
        expect(listComplete[0].value).toEqual('testText');

        let listOptional = (filterService as any).filterCollection.getFiltersFromOptionalList(testSource);
        expect(listOptional).toEqual(listComplete);

        testDesign.id = listComplete[0].id;
        testDesign.name = listComplete[0].name;

        expect((filterService as any).filterCollection.getFiltersFromRequiredList(testSource)).toEqual([]);

        expect(actual.size).toEqual(3);
        let keys = Array.from(actual.keys());
        expect(keys).toEqual([source1, source2, testSource]);
        expect(actual.get(keys[0])).toEqual([design1A, design1B, design1C, design1D]);
        expect(actual.get(keys[1])).toEqual([design2A]);
        expect(actual.get(keys[2])).toEqual([testDesign]);

        expect(spy.calls.count()).toEqual(1);
        expect(spy.calls.argsFor(0)).toEqual([neonEvents.FILTERS_CHANGED, {
            change: actual,
            caller: 'testCaller'
        }]);
    });

    it('toggleFilters should also add new relation filters', () => {
        generateRelationFilters();

        let spy = spyOn((filterService as any).messenger, 'publish');

        let actual = filterService.toggleFilters('testCaller', [relationDesign1], datasetService.findRelationDataList(), searchService);

        expect((filterService as any).filterCollection.getFiltersInSingleList(source1)).toEqual([filter1A, filter1B, filter1C, filter1D]);
        expect((filterService as any).filterCollection.getFiltersFromRequiredList(source1)).toEqual([filter1A, filter1B]);
        expect((filterService as any).filterCollection.getFiltersFromOptionalList(source1)).toEqual([filter1C, filter1D]);
        expect((filterService as any).filterCollection.getFiltersInSingleList(source2)).toEqual([filter2A]);

        let listComplete = (filterService as any).filterCollection.getFiltersInSingleList(relationSource1);
        expect(listComplete.length).toEqual(1);
        expect(listComplete[0].database).toEqual(DatasetServiceMock.DATABASES[0]);
        expect(listComplete[0].table).toEqual(DatasetServiceMock.TABLES[0]);
        expect(listComplete[0].field).toEqual(DatasetServiceMock.RELATION_FIELD_A);
        expect(listComplete[0].operator).toEqual('=');
        expect(listComplete[0].value).toEqual('testRelation');

        let listRequired = (filterService as any).filterCollection.getFiltersFromRequiredList(relationSource1);
        expect(listRequired).toEqual(listComplete);

        relationDesign1.id = listComplete[0].id;
        relationDesign1.name = listComplete[0].name;

        listComplete = (filterService as any).filterCollection.getFiltersInSingleList(relationSource2);
        expect(listComplete.length).toEqual(1);
        expect(listComplete[0].database).toEqual(DatasetServiceMock.DATABASES[0]);
        expect(listComplete[0].table).toEqual(DatasetServiceMock.TABLES[0]);
        expect(listComplete[0].field).toEqual(DatasetServiceMock.RELATION_FIELD_B);
        expect(listComplete[0].operator).toEqual('=');
        expect(listComplete[0].value).toEqual('testRelation');

        listRequired = (filterService as any).filterCollection.getFiltersFromRequiredList(relationSource2);
        expect(listRequired).toEqual(listComplete);

        relationDesign2.id = listComplete[0].id;
        relationDesign2.name = listComplete[0].name;

        expect((filterService as any).filterCollection.getFiltersFromOptionalList(relationSource1)).toEqual([]);
        expect((filterService as any).filterCollection.getFiltersFromOptionalList(relationSource2)).toEqual([]);

        expect(actual.size).toEqual(4);
        let keys = Array.from(actual.keys());
        expect(keys).toEqual([source1, source2, relationSource1, relationSource2]);
        expect(actual.get(keys[0])).toEqual([design1A, design1B, design1C, design1D]);
        expect(actual.get(keys[1])).toEqual([design2A]);
        expect(actual.get(keys[2])).toEqual([relationDesign1]);
        expect(actual.get(keys[3])).toEqual([relationDesign2]);

        expect(spy.calls.count()).toEqual(1);
        expect(spy.calls.argsFor(0)).toEqual([neonEvents.FILTERS_CHANGED, {
            change: actual,
            caller: 'testCaller'
        }]);
    });

    it('toggleFilters should keep old relation filters and add new relation filters', () => {
        activateRelationFilters();

        let spy = spyOn((filterService as any).messenger, 'publish');

        let testDesign2 = {
            optional: false,
            datastore: '',
            database: DatasetServiceMock.DATABASES[0],
            table: DatasetServiceMock.TABLES[0],
            field: DatasetServiceMock.RELATION_FIELD_B,
            operator: '=',
            value: 'testToggleRelation'
        } as SimpleFilterDesign;

        let actual = filterService.toggleFilters('testCaller', [testDesign2], datasetService.findRelationDataList(), searchService);

        expect((filterService as any).filterCollection.getFiltersInSingleList(source1)).toEqual([filter1A, filter1B, filter1C, filter1D]);
        expect((filterService as any).filterCollection.getFiltersFromRequiredList(source1)).toEqual([filter1A, filter1B]);
        expect((filterService as any).filterCollection.getFiltersFromOptionalList(source1)).toEqual([filter1C, filter1D]);
        expect((filterService as any).filterCollection.getFiltersInSingleList(source2)).toEqual([filter2A]);

        let listComplete = (filterService as any).filterCollection.getFiltersInSingleList(relationSource1);
        expect(listComplete.length).toEqual(2);
        expect(listComplete[0]).toEqual(relationFilter1);
        expect(listComplete[1].database).toEqual(DatasetServiceMock.DATABASES[0]);
        expect(listComplete[1].table).toEqual(DatasetServiceMock.TABLES[0]);
        expect(listComplete[1].field).toEqual(DatasetServiceMock.RELATION_FIELD_A);
        expect(listComplete[1].operator).toEqual('=');
        expect(listComplete[1].value).toEqual('testToggleRelation');

        let listRequired = (filterService as any).filterCollection.getFiltersFromRequiredList(relationSource1);
        expect(listRequired).toEqual(listComplete);

        let testDesign1 = {
            id: listComplete[1].id,
            name: listComplete[1].name,
            optional: false,
            datastore: '',
            database: DatasetServiceMock.DATABASES[0],
            table: DatasetServiceMock.TABLES[0],
            field: DatasetServiceMock.RELATION_FIELD_A,
            operator: '=',
            value: 'testToggleRelation'
        } as SimpleFilterDesign;

        listComplete = (filterService as any).filterCollection.getFiltersInSingleList(relationSource2);
        expect(listComplete.length).toEqual(2);
        expect(listComplete[0]).toEqual(relationFilter2);
        expect(listComplete[1].database).toEqual(DatasetServiceMock.DATABASES[0]);
        expect(listComplete[1].table).toEqual(DatasetServiceMock.TABLES[0]);
        expect(listComplete[1].field).toEqual(DatasetServiceMock.RELATION_FIELD_B);
        expect(listComplete[1].operator).toEqual('=');
        expect(listComplete[1].value).toEqual('testToggleRelation');

        listRequired = (filterService as any).filterCollection.getFiltersFromRequiredList(relationSource2);
        expect(listRequired).toEqual(listComplete);

        testDesign2.id = listComplete[1].id;
        testDesign2.name = listComplete[1].name;

        expect((filterService as any).filterCollection.getFiltersFromOptionalList(relationSource1)).toEqual([]);
        expect((filterService as any).filterCollection.getFiltersFromOptionalList(relationSource2)).toEqual([]);

        expect(actual.size).toEqual(4);
        let keys = Array.from(actual.keys());
        expect(keys).toEqual([source1, source2, relationSource1, relationSource2]);
        expect(actual.get(keys[0])).toEqual([design1A, design1B, design1C, design1D]);
        expect(actual.get(keys[1])).toEqual([design2A]);
        expect(actual.get(keys[2])).toEqual([relationDesign1, testDesign1]);
        expect(actual.get(keys[3])).toEqual([relationDesign2, testDesign2]);

        expect(spy.calls.count()).toEqual(1);
        expect(spy.calls.argsFor(0)).toEqual([neonEvents.FILTERS_CHANGED, {
            change: actual,
            caller: 'testCaller'
        }]);
    });

    it('toggleFilters should also delete old relation filters', () => {
        activateRelationFilters();

        let spy = spyOn((filterService as any).messenger, 'publish');

        let actual = filterService.toggleFilters('testCaller', [relationDesign1], datasetService.findRelationDataList(), searchService);

        expect((filterService as any).filterCollection.getFiltersInSingleList(source1)).toEqual([filter1A, filter1B, filter1C, filter1D]);
        expect((filterService as any).filterCollection.getFiltersFromRequiredList(source1)).toEqual([filter1A, filter1B]);
        expect((filterService as any).filterCollection.getFiltersFromOptionalList(source1)).toEqual([filter1C, filter1D]);
        expect((filterService as any).filterCollection.getFiltersInSingleList(source2)).toEqual([filter2A]);
        expect((filterService as any).filterCollection.getFiltersInSingleList(relationSource1)).toEqual([]);
        expect((filterService as any).filterCollection.getFiltersInSingleList(relationSource2)).toEqual([]);

        expect(actual.size).toEqual(4);
        let keys = Array.from(actual.keys());
        expect(keys).toEqual([source1, source2, relationSource1, relationSource2]);
        expect(actual.get(keys[0])).toEqual([design1A, design1B, design1C, design1D]);
        expect(actual.get(keys[1])).toEqual([design2A]);
        expect(actual.get(keys[2])).toEqual([]);
        expect(actual.get(keys[3])).toEqual([]);

        expect(spy.calls.count()).toEqual(1);
        expect(spy.calls.argsFor(0)).toEqual([neonEvents.FILTERS_CHANGED, {
            change: actual,
            caller: 'testCaller'
        }]);
    });

    it('toggleFilters should keep non-argument relation filters and delete argument relation filters', () => {
        activateRelationFilters();

        let testDesign1 = {
            optional: false,
            datastore: '',
            database: DatasetServiceMock.DATABASES[0],
            table: DatasetServiceMock.TABLES[0],
            field: DatasetServiceMock.RELATION_FIELD_A,
            operator: '=',
            value: 'testToggleRelation'
        } as SimpleFilterDesign;
        let testDesign2 = {
            optional: false,
            datastore: '',
            database: DatasetServiceMock.DATABASES[0],
            table: DatasetServiceMock.TABLES[0],
            field: DatasetServiceMock.RELATION_FIELD_B,
            operator: '=',
            value: 'testToggleRelation'
        } as SimpleFilterDesign;

        let testFilter1 = FilterUtil.createFilterFromDesign(testDesign1, searchService);
        let testFilter2 = FilterUtil.createFilterFromDesign(testDesign2, searchService);
        testFilter1.relations = [testFilter2.id];
        testFilter2.relations = [testFilter1.id];

        testDesign1.id = testFilter1.id;
        testDesign1.name = testFilter1.name;
        testDesign2.id = testFilter2.id;
        testDesign2.name = testFilter2.name;

        (filterService as any).filterCollection.setFiltersInDualLists(relationSource1, [relationFilter1, testFilter1], [], searchService);
        (filterService as any).filterCollection.setFiltersInDualLists(relationSource2, [relationFilter2, testFilter2], [], searchService);

        let spy = spyOn((filterService as any).messenger, 'publish');

        let actual = filterService.toggleFilters('testCaller', [relationDesign1], datasetService.findRelationDataList(), searchService);

        expect((filterService as any).filterCollection.getFiltersInSingleList(source1)).toEqual([filter1A, filter1B, filter1C, filter1D]);
        expect((filterService as any).filterCollection.getFiltersFromRequiredList(source1)).toEqual([filter1A, filter1B]);
        expect((filterService as any).filterCollection.getFiltersFromOptionalList(source1)).toEqual([filter1C, filter1D]);
        expect((filterService as any).filterCollection.getFiltersInSingleList(source2)).toEqual([filter2A]);
        expect((filterService as any).filterCollection.getFiltersInSingleList(relationSource1)).toEqual([testFilter1]);
        expect((filterService as any).filterCollection.getFiltersInSingleList(relationSource2)).toEqual([testFilter2]);

        expect(actual.size).toEqual(4);
        let keys = Array.from(actual.keys());
        expect(keys).toEqual([source1, source2, relationSource1, relationSource2]);
        expect(actual.get(keys[0])).toEqual([design1A, design1B, design1C, design1D]);
        expect(actual.get(keys[1])).toEqual([design2A]);
        expect(actual.get(keys[2])).toEqual([testDesign1]);
        expect(actual.get(keys[3])).toEqual([testDesign2]);

        expect(spy.calls.count()).toEqual(1);
        expect(spy.calls.argsFor(0)).toEqual([neonEvents.FILTERS_CHANGED, {
            change: actual,
            caller: 'testCaller'
        }]);
    });

    it('toggleFilters should not publish any event if no filters are affected', () => {
        let spy = spyOn((filterService as any).messenger, 'publish');

        let actual = filterService.toggleFilters('testCaller', [], [], searchService);

        expect((filterService as any).filterCollection.getFiltersInSingleList(source1)).toEqual([filter1A, filter1B, filter1C, filter1D]);
        expect((filterService as any).filterCollection.getFiltersFromRequiredList(source1)).toEqual([filter1A, filter1B]);
        expect((filterService as any).filterCollection.getFiltersFromOptionalList(source1)).toEqual([filter1C, filter1D]);
        expect((filterService as any).filterCollection.getFiltersInSingleList(source2)).toEqual([filter2A]);

        expect(actual.size).toEqual(2);
        let keys = Array.from(actual.keys());
        expect(keys).toEqual([source1, source2]);
        expect(actual.get(keys[0])).toEqual([design1A, design1B, design1C, design1D]);
        expect(actual.get(keys[1])).toEqual([design2A]);

        expect(spy.calls.count()).toEqual(0);
    });

    it('isFiltererd should return expected boolean', () => {
        let testCollection = new SingleListFilterCollection();
        expect(filterService.isFiltered(testCollection)).toEqual(false);

        testCollection.setFilters(source1, [], searchService);
        expect(filterService.isFiltered(testCollection)).toEqual(false);

        testCollection.setFilters(source1, [filter1A], searchService);
        expect(filterService.isFiltered(testCollection)).toEqual(true);
        expect(filterService.isFiltered(testCollection, design1A)).toEqual(true);
        expect(filterService.isFiltered(testCollection, design2A)).toEqual(false);

        testCollection.setFilters(source2, [filter2A], searchService);
        expect(filterService.isFiltered(testCollection)).toEqual(true);
        expect(filterService.isFiltered(testCollection, design1A)).toEqual(true);
        expect(filterService.isFiltered(testCollection, design2A)).toEqual(true);
        expect(filterService.isFiltered(testCollection, {
            datastore: '',
            database: DatasetServiceMock.DATABASES[0],
            table: DatasetServiceMock.TABLES[0],
            field: DatasetServiceMock.ID_FIELD,
            operator: '!='
        } as SimpleFilterDesign)).toEqual(false);
    });

    it('isFiltered with flexible compound filter designs should return expected boolean', () => {
        let testDesign = {
            type: 'or',
            optional: false,
            filters: [{
                optional: false,
                datastore: '',
                database: DatasetServiceMock.DATABASES[0],
                table: DatasetServiceMock.TABLES[0],
                field: DatasetServiceMock.SIZE_FIELD,
                operator: '=',
                value: 10
            } as SimpleFilterDesign, {
                optional: false,
                datastore: '',
                database: DatasetServiceMock.DATABASES[0],
                table: DatasetServiceMock.TABLES[0],
                field: DatasetServiceMock.SIZE_FIELD,
                operator: '=',
                value: 20
            } as SimpleFilterDesign, {
                optional: false,
                datastore: '',
                database: DatasetServiceMock.DATABASES[0],
                table: DatasetServiceMock.TABLES[0],
                field: DatasetServiceMock.SIZE_FIELD,
                operator: '!=',
                value: 30
            } as SimpleFilterDesign, {
                optional: false,
                datastore: '',
                database: DatasetServiceMock.DATABASES[0],
                table: DatasetServiceMock.TABLES[0],
                field: DatasetServiceMock.SIZE_FIELD,
                operator: '!=',
                value: 40
            } as SimpleFilterDesign]
        } as CompoundFilterDesign;

        let testFilter = FilterUtil.createFilterFromDesign(testDesign, searchService);

        let testSource = [{
            datastoreName: '',
            databaseName: DatasetServiceMock.DATABASES[0].name,
            tableName: DatasetServiceMock.TABLES[0].name,
            fieldName: DatasetServiceMock.SIZE_FIELD.columnName,
            operator: '='
        } as FilterDataSource, {
            datastoreName: '',
            databaseName: DatasetServiceMock.DATABASES[0].name,
            tableName: DatasetServiceMock.TABLES[0].name,
            fieldName: DatasetServiceMock.SIZE_FIELD.columnName,
            operator: '!='
        } as FilterDataSource];

        let testCollection = new SingleListFilterCollection();
        testCollection.setFilters(testSource, [testFilter], searchService);

        // Same design (should return true)
        expect(filterService.isFiltered(testCollection, {
            type: 'or',
            inflexible: false,
            filters: [{
                datastore: '',
                database: DatasetServiceMock.DATABASES[0],
                table: DatasetServiceMock.TABLES[0],
                field: DatasetServiceMock.SIZE_FIELD,
                operator: '='
            } as SimpleFilterDesign, {
                datastore: '',
                database: DatasetServiceMock.DATABASES[0],
                table: DatasetServiceMock.TABLES[0],
                field: DatasetServiceMock.SIZE_FIELD,
                operator: '='
            } as SimpleFilterDesign, {
                datastore: '',
                database: DatasetServiceMock.DATABASES[0],
                table: DatasetServiceMock.TABLES[0],
                field: DatasetServiceMock.SIZE_FIELD,
                operator: '!='
            } as SimpleFilterDesign, {
                datastore: '',
                database: DatasetServiceMock.DATABASES[0],
                table: DatasetServiceMock.TABLES[0],
                field: DatasetServiceMock.SIZE_FIELD,
                operator: '!='
            } as SimpleFilterDesign]
        } as CompoundFilterDesign)).toEqual(true);

        // Same design with different order (should return true)
        expect(filterService.isFiltered(testCollection, {
            type: 'or',
            inflexible: false,
            filters: [{
                datastore: '',
                database: DatasetServiceMock.DATABASES[0],
                table: DatasetServiceMock.TABLES[0],
                field: DatasetServiceMock.SIZE_FIELD,
                operator: '!='
            } as SimpleFilterDesign, {
                datastore: '',
                database: DatasetServiceMock.DATABASES[0],
                table: DatasetServiceMock.TABLES[0],
                field: DatasetServiceMock.SIZE_FIELD,
                operator: '!='
            } as SimpleFilterDesign, {
                datastore: '',
                database: DatasetServiceMock.DATABASES[0],
                table: DatasetServiceMock.TABLES[0],
                field: DatasetServiceMock.SIZE_FIELD,
                operator: '='
            } as SimpleFilterDesign, {
                datastore: '',
                database: DatasetServiceMock.DATABASES[0],
                table: DatasetServiceMock.TABLES[0],
                field: DatasetServiceMock.SIZE_FIELD,
                operator: '='
            } as SimpleFilterDesign]
        } as CompoundFilterDesign)).toEqual(true);

        // Same data source but too few nested filters (should return true because inflexible=false)
        expect(filterService.isFiltered(testCollection, {
            type: 'or',
            inflexible: false,
            filters: [{
                datastore: '',
                database: DatasetServiceMock.DATABASES[0],
                table: DatasetServiceMock.TABLES[0],
                field: DatasetServiceMock.SIZE_FIELD,
                operator: '='
            } as SimpleFilterDesign, {
                datastore: '',
                database: DatasetServiceMock.DATABASES[0],
                table: DatasetServiceMock.TABLES[0],
                field: DatasetServiceMock.SIZE_FIELD,
                operator: '!='
            } as SimpleFilterDesign]
        } as CompoundFilterDesign)).toEqual(true);

        // Same data source but too many nested filters (should return true because inflexible=false)
        expect(filterService.isFiltered(testCollection, {
            type: 'or',
            inflexible: false,
            filters: [{
                datastore: '',
                database: DatasetServiceMock.DATABASES[0],
                table: DatasetServiceMock.TABLES[0],
                field: DatasetServiceMock.SIZE_FIELD,
                operator: '='
            } as SimpleFilterDesign, {
                datastore: '',
                database: DatasetServiceMock.DATABASES[0],
                table: DatasetServiceMock.TABLES[0],
                field: DatasetServiceMock.SIZE_FIELD,
                operator: '='
            } as SimpleFilterDesign, {
                datastore: '',
                database: DatasetServiceMock.DATABASES[0],
                table: DatasetServiceMock.TABLES[0],
                field: DatasetServiceMock.SIZE_FIELD,
                operator: '!='
            } as SimpleFilterDesign, {
                datastore: '',
                database: DatasetServiceMock.DATABASES[0],
                table: DatasetServiceMock.TABLES[0],
                field: DatasetServiceMock.SIZE_FIELD,
                operator: '!='
            } as SimpleFilterDesign, {
                datastore: '',
                database: DatasetServiceMock.DATABASES[0],
                table: DatasetServiceMock.TABLES[0],
                field: DatasetServiceMock.SIZE_FIELD,
                operator: '!='
            } as SimpleFilterDesign]
        } as CompoundFilterDesign)).toEqual(true);
    });

    it('isFiltered with inflexible compound filter designs should return expected boolean', () => {
        let testDesign = {
            type: 'or',
            optional: false,
            filters: [{
                optional: false,
                datastore: '',
                database: DatasetServiceMock.DATABASES[0],
                table: DatasetServiceMock.TABLES[0],
                field: DatasetServiceMock.SIZE_FIELD,
                operator: '=',
                value: 10
            } as SimpleFilterDesign, {
                optional: false,
                datastore: '',
                database: DatasetServiceMock.DATABASES[0],
                table: DatasetServiceMock.TABLES[0],
                field: DatasetServiceMock.SIZE_FIELD,
                operator: '=',
                value: 20
            } as SimpleFilterDesign, {
                optional: false,
                datastore: '',
                database: DatasetServiceMock.DATABASES[0],
                table: DatasetServiceMock.TABLES[0],
                field: DatasetServiceMock.SIZE_FIELD,
                operator: '!=',
                value: 30
            } as SimpleFilterDesign, {
                optional: false,
                datastore: '',
                database: DatasetServiceMock.DATABASES[0],
                table: DatasetServiceMock.TABLES[0],
                field: DatasetServiceMock.SIZE_FIELD,
                operator: '!=',
                value: 40
            } as SimpleFilterDesign]
        } as CompoundFilterDesign;

        let testFilter = FilterUtil.createFilterFromDesign(testDesign, searchService);

        let testSource = [{
            datastoreName: '',
            databaseName: DatasetServiceMock.DATABASES[0].name,
            tableName: DatasetServiceMock.TABLES[0].name,
            fieldName: DatasetServiceMock.SIZE_FIELD.columnName,
            operator: '='
        } as FilterDataSource, {
            datastoreName: '',
            databaseName: DatasetServiceMock.DATABASES[0].name,
            tableName: DatasetServiceMock.TABLES[0].name,
            fieldName: DatasetServiceMock.SIZE_FIELD.columnName,
            operator: '!='
        } as FilterDataSource];

        let testCollection = new SingleListFilterCollection();
        testCollection.setFilters(testSource, [testFilter], searchService);

        // Same design (should return true)
        expect(filterService.isFiltered(testCollection, {
            type: 'or',
            inflexible: true,
            filters: [{
                datastore: '',
                database: DatasetServiceMock.DATABASES[0],
                table: DatasetServiceMock.TABLES[0],
                field: DatasetServiceMock.SIZE_FIELD,
                operator: '='
            } as SimpleFilterDesign, {
                datastore: '',
                database: DatasetServiceMock.DATABASES[0],
                table: DatasetServiceMock.TABLES[0],
                field: DatasetServiceMock.SIZE_FIELD,
                operator: '='
            } as SimpleFilterDesign, {
                datastore: '',
                database: DatasetServiceMock.DATABASES[0],
                table: DatasetServiceMock.TABLES[0],
                field: DatasetServiceMock.SIZE_FIELD,
                operator: '!='
            } as SimpleFilterDesign, {
                datastore: '',
                database: DatasetServiceMock.DATABASES[0],
                table: DatasetServiceMock.TABLES[0],
                field: DatasetServiceMock.SIZE_FIELD,
                operator: '!='
            } as SimpleFilterDesign]
        } as CompoundFilterDesign)).toEqual(true);

        // Same design with different order (should return true)
        expect(filterService.isFiltered(testCollection, {
            type: 'or',
            inflexible: true,
            filters: [{
                datastore: '',
                database: DatasetServiceMock.DATABASES[0],
                table: DatasetServiceMock.TABLES[0],
                field: DatasetServiceMock.SIZE_FIELD,
                operator: '!='
            } as SimpleFilterDesign, {
                datastore: '',
                database: DatasetServiceMock.DATABASES[0],
                table: DatasetServiceMock.TABLES[0],
                field: DatasetServiceMock.SIZE_FIELD,
                operator: '!='
            } as SimpleFilterDesign, {
                datastore: '',
                database: DatasetServiceMock.DATABASES[0],
                table: DatasetServiceMock.TABLES[0],
                field: DatasetServiceMock.SIZE_FIELD,
                operator: '='
            } as SimpleFilterDesign, {
                datastore: '',
                database: DatasetServiceMock.DATABASES[0],
                table: DatasetServiceMock.TABLES[0],
                field: DatasetServiceMock.SIZE_FIELD,
                operator: '='
            } as SimpleFilterDesign]
        } as CompoundFilterDesign)).toEqual(true);

        // Same data source but too few nested filters (should return false because inflexible=true)
        expect(filterService.isFiltered(testCollection, {
            type: 'or',
            inflexible: true,
            filters: [{
                datastore: '',
                database: DatasetServiceMock.DATABASES[0],
                table: DatasetServiceMock.TABLES[0],
                field: DatasetServiceMock.SIZE_FIELD,
                operator: '='
            } as SimpleFilterDesign, {
                datastore: '',
                database: DatasetServiceMock.DATABASES[0],
                table: DatasetServiceMock.TABLES[0],
                field: DatasetServiceMock.SIZE_FIELD,
                operator: '!='
            } as SimpleFilterDesign]
        } as CompoundFilterDesign)).toEqual(false);

        // Same data source but too many nested filters (should return false because inflexible=true)
        expect(filterService.isFiltered(testCollection, {
            type: 'or',
            inflexible: true,
            filters: [{
                datastore: '',
                database: DatasetServiceMock.DATABASES[0],
                table: DatasetServiceMock.TABLES[0],
                field: DatasetServiceMock.SIZE_FIELD,
                operator: '='
            } as SimpleFilterDesign, {
                datastore: '',
                database: DatasetServiceMock.DATABASES[0],
                table: DatasetServiceMock.TABLES[0],
                field: DatasetServiceMock.SIZE_FIELD,
                operator: '='
            } as SimpleFilterDesign, {
                datastore: '',
                database: DatasetServiceMock.DATABASES[0],
                table: DatasetServiceMock.TABLES[0],
                field: DatasetServiceMock.SIZE_FIELD,
                operator: '!='
            } as SimpleFilterDesign, {
                datastore: '',
                database: DatasetServiceMock.DATABASES[0],
                table: DatasetServiceMock.TABLES[0],
                field: DatasetServiceMock.SIZE_FIELD,
                operator: '!='
            } as SimpleFilterDesign, {
                datastore: '',
                database: DatasetServiceMock.DATABASES[0],
                table: DatasetServiceMock.TABLES[0],
                field: DatasetServiceMock.SIZE_FIELD,
                operator: '!='
            } as SimpleFilterDesign]
        } as CompoundFilterDesign)).toEqual(false);
    });

    it('updateCollectionWithGlobalCompatibleFilters should update argument filter collection and call redraw callback', () => {
        // Remove the filter value to make the design compatible with each filter of its data source
        design1A.value = undefined;

        let calls = 0;
        let testRedrawCallback = (filters) => {
            calls++;
            expect(filters).toEqual([filter1A, filter1B, filter1C, filter1D]);
        };

        let testBehaviorList = [{
            filterDesign: design1A,
            redrawCallback: testRedrawCallback
        } as FilterBehavior];

        let testCollection = new SingleListFilterCollection();

        filterService.updateCollectionWithGlobalCompatibleFilters(testBehaviorList, testCollection, searchService);

        expect(testCollection.getDataSources()).toEqual([source1]);
        expect(testCollection.getFilters(source1)).toEqual([filter1A, filter1B, filter1C, filter1D]);
        expect(calls).toEqual(1);
    });

    it('updateCollectionWithGlobalCompatibleFilters should copy multiple filters if multiple behaviors have compatible filters', () => {
        // Remove the filter value to make the design compatible with each filter of its data source
        design1A.value = undefined;

        let calls1 = 0;
        let testRedrawCallback1 = (filters) => {
            calls1++;
            expect(filters).toEqual([filter1A, filter1B, filter1C, filter1D]);
        };

        let calls2 = 0;
        let testRedrawCallback2 = (filters) => {
            calls2++;
            expect(filters).toEqual([filter2A]);
        };

        let testBehaviorList = [{
            filterDesign: design1A,
            redrawCallback: testRedrawCallback1
        }, {
            filterDesign: design2A,
            redrawCallback: testRedrawCallback2
        } as FilterBehavior];

        let testCollection = new SingleListFilterCollection();

        filterService.updateCollectionWithGlobalCompatibleFilters(testBehaviorList, testCollection, searchService);

        expect(testCollection.getDataSources()).toEqual([source1, source2]);
        expect(testCollection.getFilters(source1)).toEqual([filter1A, filter1B, filter1C, filter1D]);
        expect(testCollection.getFilters(source2)).toEqual([filter2A]);
        expect(calls1).toEqual(1);
        expect(calls2).toEqual(1);
    });

    it('updateCollectionWithGlobalCompatibleFilters should update existing filters', () => {
        // Remove the filter value to make the design compatible with each filter of its data source
        design1A.value = undefined;

        let calls = 0;
        let testRedrawCallback = (filters) => {
            calls++;
            expect(filters).toEqual([filter1A, filter1B, filter1C, filter1D]);
        };

        let testBehaviorList = [{
            filterDesign: design1A,
            redrawCallback: testRedrawCallback
        } as FilterBehavior];

        let testCollection = new SingleListFilterCollection();
        testCollection.setFilters(source1, [filter1A, filter1C], searchService);

        filterService.updateCollectionWithGlobalCompatibleFilters(testBehaviorList, testCollection, searchService);

        expect(testCollection.getDataSources()).toEqual([source1]);
        expect(testCollection.getFilters(source1)).toEqual([filter1A, filter1B, filter1C, filter1D]);
        expect(calls).toEqual(1);
    });

    it('updateCollectionWithGlobalCompatibleFilters should remove existing filters', () => {
        // Remove filters.
        (filterService as any).filterCollection.setFiltersInDualLists(source1, [], [], searchService);

        // Remove the filter value to make the design compatible with each filter of its data source
        design1A.value = undefined;

        let calls = 0;
        let testRedrawCallback = (filters) => {
            calls++;
            expect(filters).toEqual([]);
        };

        let testBehaviorList = [{
            filterDesign: design1A,
            redrawCallback: testRedrawCallback
        } as FilterBehavior];

        let testCollection = new SingleListFilterCollection();
        testCollection.setFilters(source1, [filter1A, filter1C], searchService);

        filterService.updateCollectionWithGlobalCompatibleFilters(testBehaviorList, testCollection, searchService);

        expect(testCollection.getDataSources()).toEqual([source1]);
        expect(testCollection.getFilters(source1)).toEqual([]);
        expect(calls).toEqual(1);
    });

    it('updateCollectionWithGlobalCompatibleFilters should not copy the same filters if behaviors have the same data source', () => {
        // Remove the filter value to make the design compatible with each filter of its data source
        design1A.value = undefined;

        let testDesign = {
            type: 'and',
            optional: false,
            filters: [{
                optional: false,
                datastore: '',
                database: DatasetServiceMock.DATABASES[0],
                table: DatasetServiceMock.TABLES[0],
                field: DatasetServiceMock.ID_FIELD,
                operator: '='
            } as SimpleFilterDesign]
        } as CompoundFilterDesign;

        let calls1 = 0;
        let testRedrawCallback1 = (filters) => {
            calls1++;
            expect(filters).toEqual([filter1A, filter1B, filter1C, filter1D]);
        };

        let calls2 = 0;
        let testRedrawCallback2 = (filters) => {
            calls2++;
            expect(filters).toEqual([filter1A, filter1B, filter1C, filter1D]);
        };

        let testBehaviorList = [{
            filterDesign: design1A,
            redrawCallback: testRedrawCallback1
        }, {
            filterDesign: testDesign,
            redrawCallback: testRedrawCallback2
        } as FilterBehavior];

        let testCollection = new SingleListFilterCollection();

        filterService.updateCollectionWithGlobalCompatibleFilters(testBehaviorList, testCollection, searchService);

        expect(testCollection.getDataSources()).toEqual([source1]);
        expect(testCollection.getFilters(source1)).toEqual([filter1A, filter1B, filter1C, filter1D]);
        expect(calls1).toEqual(1);
        expect(calls2).toEqual(1);
    });

    it('updateCollectionWithGlobalCompatibleFilters should do nothing with no compatible filters', () => {
        let testDesign = {
            optional: false,
            datastore: '',
            database: DatasetServiceMock.DATABASES[0],
            table: DatasetServiceMock.TABLES[0],
            field: DatasetServiceMock.TEXT_FIELD,
            operator: '='
        } as SimpleFilterDesign;

        let testSource = [{
            datastoreName: '',
            databaseName: DatasetServiceMock.DATABASES[0].name,
            tableName: DatasetServiceMock.TABLES[0].name,
            fieldName: DatasetServiceMock.TEXT_FIELD.columnName,
            operator: '='
        } as FilterDataSource];

        let calls = 0;
        let testRedrawCallback = (filters) => {
            calls++;
        };

        let testBehaviorList = [{
            filterDesign: testDesign,
            redrawCallback: testRedrawCallback
        } as FilterBehavior];

        let testCollection = new SingleListFilterCollection();

        filterService.updateCollectionWithGlobalCompatibleFilters(testBehaviorList, testCollection, searchService);

        expect(testCollection.getDataSources()).toEqual([testSource]);
        expect(testCollection.getFilters(testSource)).toEqual([]);
        expect(calls).toEqual(0);
    });
});
