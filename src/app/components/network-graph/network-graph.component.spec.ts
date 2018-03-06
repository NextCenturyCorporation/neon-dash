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
import { ComponentFixture, inject, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import {
    ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, Injector, ViewEncapsulation,
    NO_ERRORS_SCHEMA, CUSTOM_ELEMENTS_SCHEMA
} from '@angular/core';
import { } from 'jasmine-core';
import * as neon from 'neon-framework';
import { APP_BASE_HREF } from '@angular/common';
import { NetworkGraphComponent } from './network-graph.component';
import { ExportControlComponent } from '../export-control/export-control.component';
import { ActiveGridService } from '../../services/active-grid.service';
import { ExportService } from '../../services/export.service';
import { ConnectionService } from '../../services/connection.service';
import { DatasetService } from '../../services/dataset.service';
import { DatabaseMetaData, FieldMetaData, TableMetaData } from '../../dataset';
import { TranslationService } from '../../services/translation.service';
import { FilterService } from '../../services/filter.service';
import { ThemesService } from '../../services/themes.service';
import { ErrorNotificationService } from '../../services/error-notification.service';
import { NeonGTDConfig } from '../../neon-gtd-config';
import { neonMappings, neonVariables } from '../../neon-namespaces';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { AppMaterialModule } from '../../app.material.module';
import { UnsharedFilterComponent } from '../unshared-filter/unshared-filter.component';
import { VisualizationService } from '../../services/visualization.service';
import { ColorSchemeService } from '../../services/color-scheme.service';
import { LegendComponent } from '../legend/legend.component';
import { BaseNeonComponent } from '../base-neon-component/base-neon.component';
import { NgxGraphModule } from '@swimlane/ngx-graph';
import { animate, style, transition as ngTransition, trigger } from '@angular/animations';
import { BaseChartComponent, ChartComponent, calculateViewDimensions, ViewDimensions, ColorHelper
} from '@swimlane/ngx-charts';
@Component({
    selector: 'app-network-graph',
    templateUrl: './network-graph.component.html',
    styleUrls: ['./network-graph.component.scss'],
    encapsulation: ViewEncapsulation.Emulated,
    changeDetection: ChangeDetectionStrategy.OnPush
})

class TestNetworkGraphComponent extends NetworkGraphComponent {
    constructor(activeGridService: ActiveGridService, connectionService: ConnectionService, datasetService: DatasetService,
        filterService: FilterService, exportService: ExportService, injector: Injector, themesService: ThemesService,
        colorSchemeSrv: ColorSchemeService, ref: ChangeDetectorRef, visualizationService: VisualizationService) {
        super(activeGridService, connectionService, datasetService, filterService, exportService, injector,
            themesService, colorSchemeSrv, ref, visualizationService);
    }
}

describe('Component: NetworkGraph', () => {
    let testConfig: NeonGTDConfig = new NeonGTDConfig();
    let component: TestNetworkGraphComponent;
    let fixture: ComponentFixture<TestNetworkGraphComponent>;

    beforeEach(() => {
        TestBed.configureTestingModule({
            declarations: [
                ChartComponent,
                LegendComponent,
                NetworkGraphComponent,
                ExportControlComponent,
                UnsharedFilterComponent
            ],
            providers: [
                ActiveGridService,
                ConnectionService,
                DatasetService,
                FilterService,
                ExportService,
                TranslationService,
                ErrorNotificationService,
                VisualizationService,
                ThemesService,
                Injector,
                ColorSchemeService,
                { provide: APP_BASE_HREF, useValue : '/' },
                { provide: 'config', useValue: testConfig },
                { provide: 'title', useValue: 'NetworkGraph with Config Title' },
                { provide: 'database', useValue: 'NetworkGraphDatabase' },
                { provide: 'table', useValue: 'testTable' },
                { provide: 'nodeField', useValue: 'testNodeField' },
                { provide: 'linkField', useValue: 'testLinkField' },
                { provide: 'limit', useValue: 'testLimit' }
            ],
            imports: [
                BrowserAnimationsModule,
                AppMaterialModule,
                FormsModule
            ],
            schemas: [ CUSTOM_ELEMENTS_SCHEMA ]
        });
        fixture = TestBed.createComponent(NetworkGraphComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create an instance', (() => {
        expect(component).toBeTruthy();
    }));
});
