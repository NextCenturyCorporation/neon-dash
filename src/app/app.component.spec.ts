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
import { ComponentFixture, async, TestBed } from '@angular/core/testing';
import { DebugElement, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { APP_BASE_HREF, CommonModule } from '@angular/common';

import 'hammerjs';

import { AddVisualizationComponent } from './components/add-visualization/add-visualization.component';
import { AppComponent } from './app.component';
import { AnnotationViewerComponent } from './components/annotation-viewer/annotation-viewer.component';
import { AboutNeonComponent } from './components/about-neon/about-neon.component';
import { AggregationComponent } from './components/aggregation/aggregation.component';
import { BarChartComponent } from './components/bar-chart/bar-chart.component';
import { DatasetSelectorComponent } from './components/dataset-selector/dataset-selector.component';
import { DataTableComponent } from './components/data-table/data-table.component';
import { DocumentViewerComponent } from './components/document-viewer/document-viewer.component';
import { ExportControlComponent } from './components/export-control/export-control.component';
import { FilterBuilderComponent } from './components/filter-builder/filter-builder.component';
import { LegendComponent } from './components/legend/legend.component';
import { LineChartComponent } from './components/line-chart/line-chart.component';
import { MapComponent } from './components//map/map.component';
import { SampleComponent } from './components/sample/sample.component';
import { SaveStateComponent } from './components/save-state/save-state.component';
import { ScatterPlotComponent } from './components/scatter-plot/scatter-plot.component';
import { SettingsComponent } from './components/settings/settings.component';
import { TextCloudComponent } from './components/text-cloud/text-cloud.component';
import { TimelineComponent } from './components/timeline/timeline.component';
import { UnsharedFilterComponent } from './components/unshared-filter/unshared-filter.component';
import { VisualizationContainerComponent } from './components/visualization-container/visualization-container.component';
import { VisualizationInjectorComponent } from './components/visualization-injector/visualization-injector.component';
import { WikiViewerComponent } from './components/wiki-viewer/wiki-viewer.component';

import { NeonGTDConfig } from './neon-gtd-config';
import { NeonGridItem } from './neon-grid-item';

import { AbstractWidgetService } from './services/abstract.widget.service';
import { ConnectionService } from './services/connection.service';
import { DatasetService } from './services/dataset.service';
import { FilterService } from './services/filter.service';
import { ParameterService } from './services/parameter.service';
import { WidgetService } from './services/widget.service';

import { NgGridModule } from 'angular2-grid';

import { NgxDatatableModule } from '@swimlane/ngx-datatable';
import { AppMaterialModule } from './app.material.module';
import { HttpModule } from '@angular/http';
import { HttpClientModule } from '@angular/common/http';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { SimpleFilterComponent } from './components/simple-filter/simple-filter.component';
import { ChartComponent } from './components/chart/chart.component';
import { NetworkGraphComponent } from './components/network-graph/network-graph.component';
import { NgxGraphModule } from '@swimlane/ngx-graph';
import { NgxChartsModule } from '@swimlane/ngx-charts';
import { MediaViewerComponent } from './components/media-viewer/media-viewer.component';
import { ThumbnailGridComponent } from './components/thumbnail-grid/thumbnail-grid.component';
import { NewsFeedComponent } from './components/news-feed/news-feed.component';
import { MatAutocompleteModule } from '@angular/material';
import { QueryBarComponent } from './components/query-bar/query-bar.component';
import {
    ThumbnailDetailsContractedComponent,
    ThumbnailDetailsExpandedComponent
} from './components/thumbnail-grid/thumbnail-details.component';
import { DashboardDropdownComponent } from './components/dashboard-dropdown/dashboard-dropdown.component';

describe('App', () => {
    let fixture: ComponentFixture<AppComponent>;
    let debugElement: DebugElement;
    let component: AppComponent;

    beforeEach(() => {
        TestBed.configureTestingModule({
            declarations: [
                ChartComponent,
                AddVisualizationComponent,
                AppComponent,
                AboutNeonComponent,
                AggregationComponent,
                AnnotationViewerComponent,
                BarChartComponent,
                ChartComponent,
                DashboardDropdownComponent,
                DatasetSelectorComponent,
                DataTableComponent,
                DocumentViewerComponent,
                ExportControlComponent,
                FilterBuilderComponent,
                LegendComponent,
                LineChartComponent,
                MapComponent,
                MediaViewerComponent,
                NetworkGraphComponent,
                NewsFeedComponent,
                QueryBarComponent,
                SampleComponent,
                SaveStateComponent,
                ScatterPlotComponent,
                SettingsComponent,
                SimpleFilterComponent,
                TextCloudComponent,
                ThumbnailDetailsContractedComponent,
                ThumbnailDetailsExpandedComponent,
                ThumbnailGridComponent,
                TimelineComponent,
                UnsharedFilterComponent,
                VisualizationContainerComponent,
                VisualizationInjectorComponent,
                WikiViewerComponent
            ],
            imports: [
                FormsModule,
                AppMaterialModule,
                MatAutocompleteModule,
                NgxChartsModule,
                NgGridModule,
                NgxGraphModule,
                NgxDatatableModule,
                HttpModule,
                HttpClientModule,
                BrowserAnimationsModule,
                ReactiveFormsModule
            ],
            providers: [
                { provide: 'config', useValue: new NeonGTDConfig() },
                { provide: APP_BASE_HREF, useValue: '/' },
                DatasetService,
                ConnectionService,
                FilterService,
                ParameterService,
                { provide: AbstractWidgetService, useClass: WidgetService }
            ]
        });

        fixture = TestBed.createComponent(AppComponent);
        debugElement = fixture.debugElement;
        component = fixture.componentInstance;
    });

    afterEach(() => {
        fixture.detectChanges();
    });

    it('should include top level layout components', async(() => {
        expect(debugElement.nativeElement.querySelectorAll('mat-sidenav-container')).toBeTruthy();
        expect(debugElement.nativeElement.querySelectorAll('app-dataset-selector')).toBeTruthy();
        // Since the about pane and options pane are rendered only after a user opens their sidenav area,
        // these should not exist upon initial render.
        expect(debugElement.nativeElement.querySelectorAll('app-right-panel').length === 0).toBeTruthy();
    }));

    it('should be showing the correct defaults', async(() => {
        expect(component.currentPanel).toEqual('dashboardLayouts');
        expect(component.rightPanelTitle).toEqual('Dashboard Layouts');

        expect(component.showCustomConnectionButton).toEqual(true);
        expect(component.showFilterBuilder).toEqual(false);
        expect(component.showFilterTrayButton).toEqual(true);
        expect(component.showSimpleSearch).toEqual(false);
        expect(component.showVisShortcut).toEqual(true);

        expect(component.createFilterBuilder).toEqual(false);
    }));

    it('addWidget does add the given widget with specified position to the grid', async(() => {
        let widgetGridItem1: NeonGridItem = {
            col: 2,
            config: {},
            row: 2,
            sizex: 3,
            sizey: 3
        };

        component.addWidget({
            widgetGridItem: widgetGridItem1
        });

        expect(component.widgetGridItems).toEqual([{
            col: 2,
            config: {
                borderSize: 10,
                col: 2,
                dragHandle: '.drag-handle',
                row: 2,
                sizex: 3,
                sizey: 3
            },
            id: widgetGridItem1.id,
            row: 2,
            sizex: 3,
            sizey: 3
        }]);
    }));

    it('addWidget does prefer position inside config object', async(() => {
        let widgetGridItem1: NeonGridItem = {
            col: 2,
            config: {
                col: 4,
                row: 4,
                sizex: 5,
                sizey: 5
            },
            row: 2,
            sizex: 3,
            sizey: 3
        };

        component.addWidget({
            widgetGridItem: widgetGridItem1
        });

        expect(component.widgetGridItems).toEqual([{
            col: 2,
            config: {
                borderSize: 10,
                col: 4,
                dragHandle: '.drag-handle',
                row: 4,
                sizex: 5,
                sizey: 5
            },
            id: widgetGridItem1.id,
            row: 2,
            sizex: 3,
            sizey: 3
        }]);
    }));

    it('addWidget does set the position of the given widget with unspecified position and add it to the end of the grid', async(() => {
        let widgetGridItem1: NeonGridItem = {
            config: {}
        };

        component.addWidget({
            widgetGridItem: widgetGridItem1
        });

        expect(component.widgetGridItems).toEqual([{
            config: {
                borderSize: 10,
                col: 1,
                dragHandle: '.drag-handle',
                row: 1,
                sizex: 4,
                sizey: 4
            },
            id: widgetGridItem1.id
        }]);

        let widgetGridItem2: NeonGridItem = {
            config: {}
        };

        component.addWidget({
            widgetGridItem: widgetGridItem2
        });

        expect(component.widgetGridItems).toEqual([{
            config: {
                borderSize: 10,
                col: 1,
                dragHandle: '.drag-handle',
                row: 1,
                sizex: 4,
                sizey: 4
            },
            id: widgetGridItem1.id
        }, {
            config: {
                borderSize: 10,
                col: 5,
                dragHandle: '.drag-handle',
                row: 1,
                sizex: 4,
                sizey: 4
            },
            id: widgetGridItem2.id
        }]);

        let widgetGridItem3: NeonGridItem = {
            config: {}
        };

        component.addWidget({
            widgetGridItem: widgetGridItem3
        });

        expect(component.widgetGridItems).toEqual([{
            config: {
                borderSize: 10,
                col: 1,
                dragHandle: '.drag-handle',
                row: 1,
                sizex: 4,
                sizey: 4
            },
            id: widgetGridItem1.id
        }, {
            config: {
                borderSize: 10,
                col: 5,
                dragHandle: '.drag-handle',
                row: 1,
                sizex: 4,
                sizey: 4
            },
            id: widgetGridItem2.id
        }, {
            config: {
                borderSize: 10,
                col: 9,
                dragHandle: '.drag-handle',
                row: 1,
                sizex: 4,
                sizey: 4
            },
            id: widgetGridItem3.id
        }]);

        let widgetGridItem4: NeonGridItem = {
            config: {}
        };

        component.addWidget({
            widgetGridItem: widgetGridItem4
        });

        expect(component.widgetGridItems).toEqual([{
            config: {
                borderSize: 10,
                col: 1,
                dragHandle: '.drag-handle',
                row: 1,
                sizex: 4,
                sizey: 4
            },
            id: widgetGridItem1.id
        }, {
            config: {
                borderSize: 10,
                col: 5,
                dragHandle: '.drag-handle',
                row: 1,
                sizex: 4,
                sizey: 4
            },
            id: widgetGridItem2.id
        }, {
            config: {
                borderSize: 10,
                col: 9,
                dragHandle: '.drag-handle',
                row: 1,
                sizex: 4,
                sizey: 4
            },
            id: widgetGridItem3.id
        }, {
            config: {
                borderSize: 10,
                col: 1,
                dragHandle: '.drag-handle',
                row: 5,
                sizex: 4,
                sizey: 4
            },
            id: widgetGridItem4.id
        }]);
    }));

    it('addWidget does set the position of the given widget with unspecified position and add it to the middle of the grid', async(() => {
        component.widgetGridItems = [{
            config: {
                borderSize: 10,
                col: 1,
                dragHandle: '.drag-handle',
                row: 1,
                sizex: 12,
                sizey: 4
            },
            id: 'a'
        }, {
            config: {
                borderSize: 10,
                col: 1,
                dragHandle: '.drag-handle',
                row: 5,
                sizex: 4,
                sizey: 4
            },
            id: 'b'
        }, {
            config: {
                borderSize: 10,
                col: 9,
                dragHandle: '.drag-handle',
                row: 5,
                sizex: 4,
                sizey: 4
            },
            id: 'c'
        }, {
            config: {
                borderSize: 10,
                col: 1,
                dragHandle: '.drag-handle',
                row: 9,
                sizex: 12,
                sizey: 4
            },
            id: 'd'
        }];

        let widgetGridItem1: NeonGridItem = {
            config: {}
        };

        component.addWidget({
            widgetGridItem: widgetGridItem1
        });

        expect(component.widgetGridItems).toEqual([{
            config: {
                borderSize: 10,
                col: 1,
                dragHandle: '.drag-handle',
                row: 1,
                sizex: 12,
                sizey: 4
            },
            id: 'a'
        }, {
            config: {
                borderSize: 10,
                col: 1,
                dragHandle: '.drag-handle',
                row: 5,
                sizex: 4,
                sizey: 4
            },
            id: 'b'
        }, {
            config: {
                borderSize: 10,
                col: 9,
                dragHandle: '.drag-handle',
                row: 5,
                sizex: 4,
                sizey: 4
            },
            id: 'c'
        }, {
            config: {
                borderSize: 10,
                col: 1,
                dragHandle: '.drag-handle',
                row: 9,
                sizex: 12,
                sizey: 4
            },
            id: 'd'
        }, {
            config: {
                borderSize: 10,
                col: 5,
                dragHandle: '.drag-handle',
                row: 5,
                sizex: 4,
                sizey: 4
            },
            id: widgetGridItem1.id
        }]);
    }));

    it('clearDashboard does delete all elements from the grid', async(() => {
        component.widgetGridItems = [{
            config: {
                borderSize: 10,
                col: 1,
                dragHandle: '.drag-handle',
                row: 1,
                sizex: 1,
                sizey: 1
            },
            id: 'a'
        }, {
            config: {
                borderSize: 10,
                col: 2,
                dragHandle: '.drag-handle',
                row: 2,
                sizex: 1,
                sizey: 1
            },
            id: 'b'
        }];

        component.clearDashboard();

        expect(component.widgetGridItems).toEqual([]);
    }));

    it('contractWidget does update the size and position of the given widget to its previous config', async(() => {
        let widgetGridItem1: NeonGridItem = {
            config: {
                col: 1,
                row: 1,
                sizex: 12,
                sizey: 12
            },
            previousConfig: {
                col: 2,
                row: 2,
                sizex: 4,
                sizey: 4
            }
        };

        component.contractWidget({
            widgetGridItem: widgetGridItem1
        });

        expect(widgetGridItem1).toEqual({
            config: {
                col: 2,
                row: 2,
                sizex: 4,
                sizey: 4
            },
            previousConfig: {
                col: 2,
                row: 2,
                sizex: 4,
                sizey: 4
            }
        });
    }));

    it('deleteWidget does delete the widget from the grid', async(() => {
        component.widgetGridItems = [{
            config: {
                borderSize: 10,
                col: 1,
                dragHandle: '.drag-handle',
                row: 1,
                sizex: 1,
                sizey: 1
            },
            id: 'a'
        }, {
            config: {
                borderSize: 10,
                col: 2,
                dragHandle: '.drag-handle',
                row: 2,
                sizex: 1,
                sizey: 1
            },
            id: 'b'
        }];

        component.deleteWidget({
            id: 'a'
        });

        expect(component.widgetGridItems).toEqual([{
            config: {
                borderSize: 10,
                col: 2,
                dragHandle: '.drag-handle',
                row: 2,
                sizex: 1,
                sizey: 1
            },
            id: 'b'
        }]);
    }));

    it('expandWidget does update the size and position of the given widget and save its previous config', async(() => {
        let widgetGridItem1: NeonGridItem = {
            config: {
                col: 2,
                row: 2,
                sizex: 4,
                sizey: 4
            }
        };

        let spy = spyOn(component, 'getVisibleRowCount').and.returnValue(50);

        component.expandWidget({
            widgetGridItem: widgetGridItem1
        });

        expect(widgetGridItem1).toEqual({
            config: {
                col: 1,
                row: 2,
                sizex: 12,
                sizey: 50
            },
            previousConfig: {
                col: 2,
                row: 2,
                sizex: 4,
                sizey: 4
            }
        });
    }));

    it('getMaxColInUse does return expected number', async(() => {
        expect(component.getMaxColInUse()).toEqual(0);

        component.widgetGridItems = [{
            config: {
                borderSize: 10,
                col: 1,
                dragHandle: '.drag-handle',
                row: 1,
                sizex: 1,
                sizey: 1
            },
            id: 'a'
        }];

        expect(component.getMaxColInUse()).toEqual(1);

        component.widgetGridItems = [{
            config: {
                borderSize: 10,
                col: 1,
                dragHandle: '.drag-handle',
                row: 1,
                sizex: 1,
                sizey: 1
            },
            id: 'a'
        }, {
            config: {
                borderSize: 10,
                col: 2,
                dragHandle: '.drag-handle',
                row: 2,
                sizex: 1,
                sizey: 1
            },
            id: 'b'
        }];

        expect(component.getMaxColInUse()).toEqual(2);
    }));

    it('getMaxRowInUse does return expected number', async(() => {
        expect(component.getMaxRowInUse()).toEqual(0);

        component.widgetGridItems = [{
            config: {
                borderSize: 10,
                col: 1,
                dragHandle: '.drag-handle',
                row: 1,
                sizex: 1,
                sizey: 1
            },
            id: 'a'
        }];

        expect(component.getMaxRowInUse()).toEqual(1);

        component.widgetGridItems = [{
            config: {
                borderSize: 10,
                col: 1,
                dragHandle: '.drag-handle',
                row: 1,
                sizex: 1,
                sizey: 1
            },
            id: 'a'
        }, {
            config: {
                borderSize: 10,
                col: 2,
                dragHandle: '.drag-handle',
                row: 2,
                sizex: 1,
                sizey: 1
            },
            id: 'b'
        }];

        expect(component.getMaxRowInUse()).toEqual(2);
    }));

    it('moveWidgetToBottom does update the row of the given widget', async(() => {
        let widgetGridItem1: NeonGridItem = {
            config: {
                col: 1,
                row: 1,
                sizex: 4,
                sizey: 4
            }
        };

        component.moveWidgetToBottom({
            widgetGridItem: widgetGridItem1
        });

        expect(widgetGridItem1.config.row).toEqual(1);

        component.widgetGridItems = [{
            config: {
                borderSize: 10,
                col: 1,
                dragHandle: '.drag-handle',
                row: 1,
                sizex: 1,
                sizey: 1
            },
            id: 'a'
        }, {
            config: {
                borderSize: 10,
                col: 2,
                dragHandle: '.drag-handle',
                row: 2,
                sizex: 1,
                sizey: 1
            },
            id: 'b'
        }];

        component.moveWidgetToBottom({
            widgetGridItem: widgetGridItem1
        });

        expect(widgetGridItem1.config.row).toEqual(3);
    }));

    it('moveWidgetToTop does update the row of the given widget', async(() => {
        let widgetGridItem1: NeonGridItem = {
            config: {
                col: 1,
                row: 2,
                sizex: 4,
                sizey: 4
            }
        };

        component.moveWidgetToTop({
            widgetGridItem: widgetGridItem1
        });

        expect(widgetGridItem1.config.row).toEqual(1);
    }));

    it('refreshDashboard does resize the grid', async(() => {
        let spy = spyOn(component.grid, 'triggerResize');
        component.refreshDashboard();
        expect(spy.calls.count()).toEqual(1);
    }));

    it('registerWidget does update the global collection of widgets', async(() => {
        expect(Array.from(component.widgets.keys())).toEqual([]);

        component.registerWidget({
            id: 'a',
            widget: null
        });

        expect(Array.from(component.widgets.keys())).toEqual(['a']);

        component.registerWidget({
            id: 'b',
            widget: null
        });

        expect(Array.from(component.widgets.keys())).toEqual(['a', 'b']);
    }));

    it('registerWidget does not re-register the same widget', async(() => {
        expect(Array.from(component.widgets.keys())).toEqual([]);

        component.registerWidget({
            id: 'a',
            widget: null
        });

        expect(Array.from(component.widgets.keys())).toEqual(['a']);

        component.registerWidget({
            id: 'a',
            widget: null
        });

        expect(Array.from(component.widgets.keys())).toEqual(['a']);
    }));

    it('unregisterWidget does update the global collection of widgets', async(() => {
        component.widgets.set('a', null);
        component.widgets.set('b', null);

        expect(Array.from(component.widgets.keys())).toEqual(['a', 'b']);

        component.unregisterWidget({
            id: 'a'
        });

        expect(Array.from(component.widgets.keys())).toEqual(['b']);

        component.unregisterWidget({
            id: 'b'
        });

        expect(Array.from(component.widgets.keys())).toEqual([]);
    }));

    it('widgetFits does return expected boolean', async(() => {
        let widgetGridItem1: NeonGridItem = {
            config: {
                col: 2,
                row: 2,
                sizex: 2,
                sizey: 2
            }
        };

        expect(component.widgetFits(widgetGridItem1)).toEqual(true);

        component.widgetGridItems = [{
            config: {
                borderSize: 10,
                col: 1,
                dragHandle: '.drag-handle',
                row: 1,
                sizex: 1,
                sizey: 1
            },
            id: 'a'
        }];

        expect(component.widgetFits(widgetGridItem1)).toEqual(true);

        component.widgetGridItems = [{
            config: {
                borderSize: 10,
                col: 1,
                dragHandle: '.drag-handle',
                row: 1,
                sizex: 2,
                sizey: 2
            },
            id: 'a'
        }];

        expect(component.widgetFits(widgetGridItem1)).toEqual(false);

        component.widgetGridItems = [{
            config: {
                borderSize: 10,
                col: 2,
                dragHandle: '.drag-handle',
                row: 2,
                sizex: 1,
                sizey: 1
            },
            id: 'a'
        }];

        expect(component.widgetFits(widgetGridItem1)).toEqual(false);

        component.widgetGridItems = [{
            config: {
                borderSize: 10,
                col: 1,
                dragHandle: '.drag-handle',
                row: 1,
                sizex: 4,
                sizey: 1
            },
            id: 'a'
        }, {
            config: {
                borderSize: 10,
                col: 1,
                dragHandle: '.drag-handle',
                row: 2,
                sizex: 1,
                sizey: 4
            },
            id: 'b'
        }];

        expect(component.widgetFits(widgetGridItem1)).toEqual(true);

        component.widgetGridItems = [{
            config: {
                borderSize: 10,
                col: 1,
                dragHandle: '.drag-handle',
                row: 1,
                sizex: 4,
                sizey: 1
            },
            id: 'a'
        }, {
            config: {
                borderSize: 10,
                col: 1,
                dragHandle: '.drag-handle',
                row: 2,
                sizex: 4,
                sizey: 1
            },
            id: 'b'
        }];

        expect(component.widgetFits(widgetGridItem1)).toEqual(false);
    }));

    it('widgetOverlaps does return expected boolean', async(() => {
        expect(component.widgetOverlaps({
            config: {
                col: 1,
                row: 1,
                sizex: 1,
                sizey: 1
            }
        }, {
            config: {
                col: 2,
                row: 1,
                sizex: 1,
                sizey: 1
            }
        })).toEqual(false);

        expect(component.widgetOverlaps({
            config: {
                col: 1,
                row: 1,
                sizex: 1,
                sizey: 1
            }
        }, {
            config: {
                col: 1,
                row: 2,
                sizex: 1,
                sizey: 1
            }
        })).toEqual(false);

        expect(component.widgetOverlaps({
            config: {
                col: 1,
                row: 1,
                sizex: 2,
                sizey: 1
            }
        }, {
            config: {
                col: 2,
                row: 1,
                sizex: 1,
                sizey: 1
            }
        })).toEqual(true);

        expect(component.widgetOverlaps({
            config: {
                col: 1,
                row: 1,
                sizex: 1,
                sizey: 2
            }
        }, {
            config: {
                col: 1,
                row: 2,
                sizex: 1,
                sizey: 1
            }
        })).toEqual(true);

        expect(component.widgetOverlaps({
            config: {
                col: 2,
                row: 1,
                sizex: 1,
                sizey: 1
            }
        }, {
            config: {
                col: 1,
                row: 1,
                sizex: 1,
                sizey: 1
            }
        })).toEqual(false);

        expect(component.widgetOverlaps({
            config: {
                col: 1,
                row: 2,
                sizex: 1,
                sizey: 1
            }
        }, {
            config: {
                col: 1,
                row: 1,
                sizex: 1,
                sizey: 1
            }
        })).toEqual(false);

        expect(component.widgetOverlaps({
            config: {
                col: 2,
                row: 1,
                sizex: 1,
                sizey: 1
            }
        }, {
            config: {
                col: 1,
                row: 1,
                sizex: 2,
                sizey: 1
            }
        })).toEqual(true);

        expect(component.widgetOverlaps({
            config: {
                col: 1,
                row: 2,
                sizex: 1,
                sizey: 1
            }
        }, {
            config: {
                col: 1,
                row: 1,
                sizex: 1,
                sizey: 2
            }
        })).toEqual(true);

        expect(component.widgetOverlaps({
            config: {
                col: 1,
                row: 1,
                sizex: 4,
                sizey: 4
            }
        }, {
            config: {
                col: 2,
                row: 2,
                sizex: 1,
                sizey: 1
            }
        })).toEqual(true);

        expect(component.widgetOverlaps({
            config: {
                col: 1,
                row: 1,
                sizex: 4,
                sizey: 4
            }
        }, {
            config: {
                col: 3,
                row: 3,
                sizex: 4,
                sizey: 4
            }
        })).toEqual(true);
    }));
});
