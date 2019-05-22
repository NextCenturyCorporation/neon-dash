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
import { By } from '@angular/platform-browser';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { APP_BASE_HREF, CommonModule } from '@angular/common';

import 'hammerjs';

import { AddVisualizationComponent } from './components/add-visualization/add-visualization.component';
import { AppComponent } from './app.component';
import { AnnotationViewerComponent } from './components/annotation-viewer/annotation-viewer.component';
import { AboutNeonComponent } from './components/about-neon/about-neon.component';
import { AggregationComponent } from './components/aggregation/aggregation.component';
import { DashboardSelectorComponent } from './components/dashboard-selector/dashboard-selector.component';
import { DataMessageComponent } from './components/data-message/data-message.component';
import { DataTableComponent } from './components/data-table/data-table.component';
import { DocumentViewerComponent } from './components/document-viewer/document-viewer.component';
import { ExportControlComponent } from './components/export-control/export-control.component';
import { FilterBuilderComponent } from './components/filter-builder/filter-builder.component';
import { FiltersComponent } from './components/filters/filters.component';
import { CurrentFiltersComponent } from './components/current-filters/current-filters.component';
import { GearComponent } from './components/gear/gear.component';
import { LegendComponent } from './components/legend/legend.component';
import { MapComponent } from './components//map/map.component';
import { OptionsListComponent } from './components/options-list/options-list.component';
import { SampleComponent } from './components/sample/sample.component';
import { SaveStateComponent } from './components/save-state/save-state.component';
import { SettingsComponent } from './components/settings/settings.component';
import { TaxonomyViewerComponent } from './components/taxonomy-viewer/taxonomy-viewer.component';
import { TextCloudComponent } from './components/text-cloud/text-cloud.component';
import { TimelineComponent } from './components/timeline/timeline.component';
import { UnsharedFilterComponent } from './components/unshared-filter/unshared-filter.component';
import { VisualizationContainerComponent } from './components/visualization-container/visualization-container.component';
import { VisualizationInjectorComponent } from './components/visualization-injector/visualization-injector.component';
import { WikiViewerComponent } from './components/wiki-viewer/wiki-viewer.component';

import { Dashboard, Datastore } from './dataset';
import { NeonGTDConfig } from './neon-gtd-config';
import { NeonGridItem } from './neon-grid-item';
import { neonEvents } from './neon-namespaces';

import { AbstractSearchService } from './services/abstract.search.service';
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
import { NetworkGraphComponent } from './components/network-graph/network-graph.component';
import { NgxGraphModule } from '@swimlane/ngx-graph';
import { NgxChartsModule } from '@swimlane/ngx-charts';
import { MediaViewerComponent } from './components/media-viewer/media-viewer.component';
import { ThumbnailGridComponent } from './components/thumbnail-grid/thumbnail-grid.component';
import { NewsFeedComponent } from './components/news-feed/news-feed.component';
import { MatAutocompleteModule } from '@angular/material';
import { QueryBarComponent } from './components/query-bar/query-bar.component';
import { DashboardDropdownComponent } from './components/dashboard-dropdown/dashboard-dropdown.component';
import { DetailsThumbnailSubComponent } from './components/thumbnail-grid/subcomponent.details-view';
import { TitleThumbnailSubComponent } from './components/thumbnail-grid/subcomponent.title-view';
import { CardThumbnailSubComponent } from './components/thumbnail-grid/subcomponent.card-view';
import { TreeModule } from 'angular-tree-component';
import { DatasetServiceMock } from '../testUtils/MockServices/DatasetServiceMock';
import { SearchServiceMock } from '../testUtils/MockServices/SearchServiceMock';
import * as neon from 'neon-framework';
import { initializeTestBed } from '../testUtils/initializeTestBed';

describe('App', () => {
    let fixture: ComponentFixture<AppComponent>;
    let getService = (type: any) => fixture.debugElement.injector.get(type);
    let debugElement: DebugElement;
    let component: AppComponent;
    let spyOnInit;

    initializeTestBed('App', {
          declarations: [
              AddVisualizationComponent,
              AppComponent,
              AboutNeonComponent,
              AggregationComponent,
              AnnotationViewerComponent,
              CardThumbnailSubComponent,
              DashboardDropdownComponent,
              DashboardSelectorComponent,
              DataMessageComponent,
              DataTableComponent,
              DetailsThumbnailSubComponent,
              DocumentViewerComponent,
              ExportControlComponent,
              FilterBuilderComponent,
              FiltersComponent,
              GearComponent,
              CurrentFiltersComponent,
              LegendComponent,
              MapComponent,
              MediaViewerComponent,
              NetworkGraphComponent,
              NewsFeedComponent,
              OptionsListComponent,
              QueryBarComponent,
              SampleComponent,
              SaveStateComponent,
              SettingsComponent,
              SimpleFilterComponent,
              TaxonomyViewerComponent,
              TextCloudComponent,
              ThumbnailGridComponent,
              TimelineComponent,
              TitleThumbnailSubComponent,
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
              ReactiveFormsModule,
              TreeModule.forRoot()
          ],
          providers: [
              { provide: 'config', useValue: new NeonGTDConfig() },
              { provide: APP_BASE_HREF, useValue: '/' },
              ConnectionService,
              { provide: DatasetService, useClass: DatasetServiceMock },
              FilterService,
              ParameterService,
              { provide: AbstractSearchService, useClass: SearchServiceMock },
              { provide: AbstractWidgetService, useClass: WidgetService }
          ]
      });

    beforeEach(() => {
        fixture = TestBed.createComponent(AppComponent);
        component = fixture.componentInstance;
        spyOnInit = spyOn(component, 'ngOnInit');
        fixture.detectChanges();
        debugElement = fixture.debugElement;
    });

    it('should include top level layout components', async(() => {
        expect(debugElement.nativeElement.querySelectorAll('mat-sidenav-container')).toBeTruthy();
        expect(debugElement.nativeElement.querySelectorAll('app-dashboard-selector')).toBeTruthy();
        // Since the about pane and options pane are rendered only after a user opens their sidenav area,
        // these should not exist upon initial render.
        expect(debugElement.nativeElement.querySelectorAll('app-right-panel')).toBeTruthy();
    }));

    it('should be showing the correct defaults', async(() => {
        expect(component.currentPanel).toEqual('dashboardLayouts');
        expect(component.rightPanelTitle).toEqual('Dashboard Layouts');

        expect(component.showCustomConnectionButton).toEqual(true);
        expect(component.showFiltersComponentIcon).toEqual(true);
        expect(component.showVisShortcut).toEqual(true);

        expect(component.createFiltersComponent).toEqual(false);
    }));

    it('should be showing correct filter icons', async(() => {
        expect(component.filtersIcon).toEqual('filters');
        (component as any).isFiltered = () => true;
        component.changeDetection.detectChanges();
        expect(component.filtersIcon).toEqual('filters_active');
    }));

    it('should correctly toggle the panels', async(() => {
        component.setPanel('aboutNeon', 'About Neon');
        expect(component.currentPanel).toEqual('aboutNeon');
        expect(component.rightPanelTitle).toEqual('About Neon');

        component.setPanel('addVis', 'Visualization');
        expect(component.currentPanel).toEqual('addVis');
        expect(component.rightPanelTitle).toEqual('Visualization');

        component.setPanel('dashboardLayouts', 'Dashboard Layouts');
        expect(component.currentPanel).toEqual('dashboardLayouts');
        expect(component.rightPanelTitle).toEqual('Dashboard Layouts');

        component.setPanel('saveState', 'Save States');
        expect(component.currentPanel).toEqual('saveState');
        expect(component.rightPanelTitle).toEqual('Save States');

        component.setPanel('settings', 'Settings');
        expect(component.currentPanel).toEqual('settings');
        expect(component.rightPanelTitle).toEqual('Settings');

    }));

    it('toggle filters component', async(() => {
        component.showFiltersComponentIcon = false;
        expect(debugElement.nativeElement.querySelectorAll('app-filters').length === 0).toBeTruthy();
        component.showFiltersComponentIcon = true;
        component.createFiltersComponent = true;
        component.toggleFiltersDialog();
        expect(debugElement.nativeElement.querySelectorAll('app-filters')).toBeTruthy();
    }));

    it('check that the messenger subscribes to the correct channels and that the callbacks update the correct booleans', async(() => {
        let spyOnShowFiltersComponentIcon = spyOn(component, 'updateShowFiltersComponentIcon');
        let spyOnShowVisualShortcut = spyOn(component, 'updateShowVisShortcut');
        let message = {
            showFiltersComponentIcon: false,
            showVisShortcut: false
        };

        expect(spyOnInit.calls.count()).toEqual(1);
        component.ngOnInit();
        expect(spyOnInit.calls.count()).toEqual(2);
        component.updateShowVisShortcut(message);
        component.updateShowFiltersComponentIcon(message);

        expect(spyOnShowFiltersComponentIcon.calls.argsFor(0)).toEqual([{
            showFiltersComponentIcon: false,
            showVisShortcut: false
        }]);

        expect(spyOnShowVisualShortcut.calls.argsFor(0)).toEqual([{
            showFiltersComponentIcon: false,
            showVisShortcut: false
        }]);

        expect(spyOnShowFiltersComponentIcon.calls.count()).toEqual(1);
        expect(spyOnShowVisualShortcut.calls.count()).toEqual(1);
    }));

    it('getShowVisShortcut does update showVisShortcut', async(() => {
        component.updateShowVisShortcut({
            showVisShortcut: false
        });
        component.changeDetection.detectChanges();
        expect(component.showVisShortcut).toEqual(false);
        expect(debugElement.query(By.css('#showVisShortcutButton'))).toBeNull();
        component.updateShowVisShortcut({
            showVisShortcut: true
        });
        component.changeDetection.detectChanges();
        expect(component.showVisShortcut).toEqual(true);
        component.changeDetection.detectChanges();
        expect(debugElement.query(By.css('#showVisShortcutButton'))).not.toBeNull();
    }));

    it('updateShowFiltersComponentIcon does update showFiltersComponent', async(() => {
        component.updateShowFiltersComponentIcon({
            showFiltersComponentIcon: false
        });
        component.changeDetection.detectChanges();
        expect(component.showFiltersComponentIcon).toEqual(false);
        expect(debugElement.query(By.css('#showFiltersComponentIcon'))).toBeNull();
        component.updateShowFiltersComponentIcon({
            showFiltersComponentIcon: true
        });
        component.changeDetection.detectChanges();
        expect(component.showFiltersComponentIcon).toEqual(true);
        component.changeDetection.detectChanges();
        expect(debugElement.query(By.css('#showFiltersComponentIcon'))).not.toBeNull();
    }));

    it('addWidget does add the given widget with specified position to the grid', () => {
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
    });

    it('addWidget does prefer position inside config object', () => {
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
    });

    it('addWidget does set the position of the given widget with unspecified position and add it to the end of the grid', () => {
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
    });

    it('addWidget does set the position of the given widget with unspecified position and add it to the middle of the grid', () => {
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
    });

    it('clearDashboard does delete all elements from the grid', () => {
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
    });

    it('contractWidget does update the size and position of the given widget to its previous config', () => {
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
    });

    it('deleteWidget does delete the widget from the grid', () => {
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
    });

    it('expandWidget does update the size and position of the given widget and save its previous config', () => {
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
    });

    it('findAutoShowDashboard does return expected object', () => {
        expect((component as any).findAutoShowDashboard({})).toEqual(null);

        let noShowDashboard = new Dashboard();

        expect((component as any).findAutoShowDashboard({
            noShow: noShowDashboard
        })).toEqual(null);

        noShowDashboard.options = {
            connectOnLoad: false
        };

        expect((component as any).findAutoShowDashboard({
            noShow: noShowDashboard
        })).toEqual(null);

        let showDashboard = new Dashboard();
        showDashboard.options = {
            connectOnLoad: true
        };

        expect((component as any).findAutoShowDashboard({
            show: showDashboard
        })).toEqual(showDashboard);

        let parentDashboard = new Dashboard();
        parentDashboard.choices = {
            show: showDashboard
        };

        expect((component as any).findAutoShowDashboard({
            parent: parentDashboard
        })).toEqual(showDashboard);

        parentDashboard.choices.noShow = noShowDashboard;

        expect((component as any).findAutoShowDashboard({
            parent: parentDashboard
        })).toEqual(showDashboard);
    });

    it('getMaxColInUse does return expected number', () => {
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
    });

    it('getMaxRowInUse does return expected number', () => {
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
    });

    it('moveWidgetToBottom does update the row of the given widget', () => {
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
    });

    it('moveWidgetToTop does update the row of the given widget', () => {
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
    });

    it('refreshDashboard does emit an event', () => {
        let spy = spyOn(component.messageSender, 'publish');
        component.refreshDashboard();
        expect(spy.calls.count()).toEqual(1);
        expect(spy.calls.argsFor(0)).toEqual([neonEvents.DASHBOARD_REFRESH, {}]);
    });

    it('registerWidget does update the global collection of widgets', () => {
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
    });

    it('registerWidget does not re-register the same widget', () => {
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
    });

    it('resizeGrid does resize the grid', () => {
        let spy = spyOn(component.grid, 'triggerResize');
        (component as any).resizeGrid();
        expect(spy.calls.count()).toEqual(1);
    });

    it('showDashboardState does work as expected', () => {
        let spyDashboards = spyOn(component.datasetService, 'setCurrentDashboard');
        let spyDatastores = spyOn(component.datasetService, 'setActiveDataset');
        let spyFilter = spyOn(component.filterService, 'setFiltersFromConfig');
        let spySender = spyOn(component.messageSender, 'publish');
        let spySimpleFilter = spyOn(component.simpleFilter, 'updateSimpleFilterConfig');

        let testDatastore1: Datastore = new Datastore('testName1', 'testHost1', 'testType1');
        let testDatastore2: Datastore = new Datastore('testName2', 'testHost2', 'testType2');
        let testDashboard: Dashboard = new Dashboard();
        testDashboard.datastores = [testDatastore1, testDatastore2];
        testDashboard.layoutObject = ['a', 'b', 'c', 'd'];
        testDashboard.filters = ['x', 'y'];

        (component as any).showDashboardState({
            dashboard: testDashboard
        });

        expect(spyDashboards.calls.count()).toEqual(1);
        expect(spyDashboards.calls.argsFor(0)).toEqual([testDashboard]);

        expect(spyDatastores.calls.count()).toEqual(1);
        // TODO THOR-1062 Permit multiple datastores.
        expect(spyDatastores.calls.argsFor(0)).toEqual([testDatastore1]);

        expect(spyFilter.calls.count()).toEqual(1);
        expect(spyFilter.calls.argsFor(0)[0]).toEqual(['x', 'y']);

        expect(spySender.calls.count()).toEqual(5);
        expect(spySender.calls.argsFor(0)).toEqual([neonEvents.DASHBOARD_CLEAR, {}]);
        expect(spySender.calls.argsFor(1)).toEqual([neonEvents.WIDGET_ADD, {
            widgetGridItem: 'a'
        }]);
        expect(spySender.calls.argsFor(2)).toEqual([neonEvents.WIDGET_ADD, {
            widgetGridItem: 'b'
        }]);
        expect(spySender.calls.argsFor(3)).toEqual([neonEvents.WIDGET_ADD, {
            widgetGridItem: 'c'
        }]);
        expect(spySender.calls.argsFor(4)).toEqual([neonEvents.WIDGET_ADD, {
            widgetGridItem: 'd'
        }]);

        expect(spySimpleFilter.calls.count()).toEqual(1);

        expect(component.showDashboardSelector).toEqual(false);
    });

    it('showDashboardStateOnPageLoad with no parameter state, parameter dataset, or auto-show dashboard does work as expected', () => {
        let spyLoad = spyOn((component as any).parameterService, 'loadState');
        let spySender = spyOn(component.messageSender, 'publish');

        spyOn((component as any).parameterService, 'findActiveDatasetInUrl').and.returnValue(null);
        spyOn((component as any).parameterService, 'findDashboardStateIdInUrl').and.returnValue(null);
        spyOn((component as any).parameterService, 'findFilterStateIdInUrl').and.returnValue(null);

        (component as any).dashboards = new Dashboard();

        (component as any).showDashboardStateOnPageLoad();

        expect(spyLoad.calls.count()).toEqual(0);
        expect(spySender.calls.count()).toEqual(0);
    });

    it('showDashboardStateOnPageLoad with parameter state but no parameter dataset or auto-show dashboard does work as expected', () => {
        let spyLoad = spyOn((component as any).parameterService, 'loadState');
        let spySender = spyOn(component.messageSender, 'publish');

        spyOn((component as any).parameterService, 'findActiveDatasetInUrl').and.returnValue(null);
        spyOn((component as any).parameterService, 'findDashboardStateIdInUrl').and.returnValue('testStateName');
        spyOn((component as any).parameterService, 'findFilterStateIdInUrl').and.returnValue('testFilterStateId');

        (component as any).dashboards = new Dashboard();

        (component as any).showDashboardStateOnPageLoad();

        expect(spyLoad.calls.count()).toEqual(1);
        expect(spyLoad.calls.argsFor(0)).toEqual(['testStateName', 'testFilterStateId']);
        expect(spySender.calls.count()).toEqual(0);
    });

    it('showDashboardStateOnPageLoad with auto-show dashboard but no parameter state or parameter dataset does work as expected', () => {
        let spyLoad = spyOn((component as any).parameterService, 'loadState');
        let spySender = spyOn(component.messageSender, 'publish');

        spyOn((component as any).parameterService, 'findActiveDatasetInUrl').and.returnValue(null);
        spyOn((component as any).parameterService, 'findDashboardStateIdInUrl').and.returnValue(null);
        spyOn((component as any).parameterService, 'findFilterStateIdInUrl').and.returnValue(null);

        let showDashboard = new Dashboard();
        showDashboard.datastores = [new Datastore('testDatastoreName1', 'testDatastoreHost1', 'testDatastoreType1')];
        showDashboard.options = {
            connectOnLoad: true
        };
        let testDashboard = new Dashboard();
        testDashboard.choices = {
            test: showDashboard
        };
        (component as any).dashboards = testDashboard;

        (component as any).showDashboardStateOnPageLoad();

        expect(spyLoad.calls.count()).toEqual(0);
        expect(spySender.calls.count()).toEqual(1);
        expect(spySender.calls.argsFor(0)).toEqual([neonEvents.DASHBOARD_STATE, {
            dashboard: showDashboard
        }]);
    });

    it('showDashboardStateOnPageLoad with parameter state and auto-show dashboard does work as expected', () => {
        let spyLoad = spyOn((component as any).parameterService, 'loadState');
        let spySender = spyOn(component.messageSender, 'publish');

        spyOn((component as any).parameterService, 'findActiveDatasetInUrl').and.returnValue(null);
        spyOn((component as any).parameterService, 'findDashboardStateIdInUrl').and.returnValue('testStateName');
        spyOn((component as any).parameterService, 'findFilterStateIdInUrl').and.returnValue('testFilterStateId');

        let showDashboard = new Dashboard();
        showDashboard.datastores = [new Datastore('testDatastoreName1', 'testDatastoreHost1', 'testDatastoreType1')];
        showDashboard.options = {
            connectOnLoad: true
        };
        let testDashboard = new Dashboard();
        testDashboard.choices = {
            test: showDashboard
        };
        (component as any).dashboards = testDashboard;

        (component as any).showDashboardStateOnPageLoad();

        expect(spyLoad.calls.count()).toEqual(1);
        expect(spyLoad.calls.argsFor(0)).toEqual(['testStateName', 'testFilterStateId']);
        expect(spySender.calls.count()).toEqual(1);
        expect(spySender.calls.argsFor(0)).toEqual([neonEvents.DASHBOARD_STATE, {
            dashboard: showDashboard
        }]);
    });

    it('showDashboardStateOnPageLoad with matching parameter dataset and auto-show dashboard does work as expected', () => {
        let spyLoad = spyOn((component as any).parameterService, 'loadState');
        let spySender = spyOn(component.messageSender, 'publish');

        spyOn((component as any).parameterService, 'findActiveDatasetInUrl').and.returnValue('testDatastoreName1');
        spyOn((component as any).parameterService, 'findDashboardStateIdInUrl').and.returnValue(null);
        spyOn((component as any).parameterService, 'findFilterStateIdInUrl').and.returnValue(null);

        let showDashboard = new Dashboard();
        showDashboard.datastores = [new Datastore('testDatastoreName1', 'testDatastoreHost1', 'testDatastoreType1')];
        showDashboard.options = {
            connectOnLoad: true
        };
        let testDashboard = new Dashboard();
        testDashboard.choices = {
            test: showDashboard
        };
        (component as any).dashboards = testDashboard;

        (component as any).showDashboardStateOnPageLoad();

        expect(spyLoad.calls.count()).toEqual(0);
        expect(spySender.calls.count()).toEqual(1);
        expect(spySender.calls.argsFor(0)).toEqual([neonEvents.DASHBOARD_STATE, {
            dashboard: showDashboard
        }]);
    });

    it('showDashboardStateOnPageLoad with parameter dataset but no parameter state or auto-show dashboard does work as expected', () => {
        // TODO THOR-1131
    });

    it('unregisterWidget does update the global collection of widgets', () => {
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
    });

    it('widgetFits does return expected boolean', () => {
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
    });

    it('widgetOverlaps does return expected boolean', () => {
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
    });
});
