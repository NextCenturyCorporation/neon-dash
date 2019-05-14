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
import { RouterTestingModule } from '@angular/router/testing';
import { DebugElement, NgModuleFactoryLoader } from '@angular/core';
import { By } from '@angular/platform-browser';
import { APP_BASE_HREF } from '@angular/common';

import { DashboardComponent } from './dashboard.component';
import { NeonGTDConfig } from '../neon-gtd-config';
import { NeonGridItem } from '../neon-grid-item';

import { AbstractSearchService } from '../services/abstract.search.service';
import { AbstractWidgetService } from '../services/abstract.widget.service';
import { ConnectionService } from '../services/connection.service';
import { DatasetService } from '../services/dataset.service';
import { FilterService } from '../services/filter.service';
import { ParameterService } from '../services/parameter.service';
import { WidgetService } from '../services/widget.service';

import { DatasetServiceMock } from '../../testUtils/MockServices/DatasetServiceMock';
import { FilterServiceMock } from '../../testUtils/MockServices/FilterServiceMock';
import { SearchServiceMock } from '../../testUtils/MockServices/SearchServiceMock';
import * as neon from 'neon-framework';
import { initializeTestBed } from '../../testUtils/initializeTestBed';

import { DashboardModule } from './dashboard.module';

import { ConfigService } from '../services/config.service';
import { HttpClientModule } from '@angular/common/http';
import { AggregationModule } from '../components/aggregation/aggregation.module';
import { DataTableModule } from '../components/data-table/data-table.module';
import { DocumentViewerModule } from '../components/document-viewer/document-viewer.module';
import { FilterBuilderModule } from '../components/filter-builder/filter-builder.module';
import { MediaViewerModule } from '../components/media-viewer/media-viewer.module';
import { NetworkGraphModule } from '../components/network-graph/network-graph.module';
import { NewsFeedModule } from '../components/news-feed/news-feed.module';
import { TaxonomyViewerModule } from '../components/taxonomy-viewer/taxonomy-viewer.module';
import { TextCloudModule } from '../components/text-cloud/text-cloud.module';
import { ThumbnailGridModule } from '../components/thumbnail-grid/thumbnail-grid.module';
import { TimelineModule } from '../components/timeline/timeline.module';
import { WikiViewerModule } from '../components/wiki-viewer/wiki-viewer.module';
import { GearModule } from '../components/gear/gear.module';
import { SaveStateModule } from '../components/save-state/save-state.module';
import { SettingsModule } from '../components/settings/settings.module';
import { AnnotationViewerModule } from '../components/annotation-viewer/annotation-viewer.module';
import { MapModule } from '../components/map/map.module';
import { QueryBarModule } from '../components/query-bar/query-bar.module';
import { AboutNeonModule } from '../components/about-neon/about-neon.module';
import { AddVisualizationModule } from '../components/add-visualization/add-visualization.module';
import { ReactiveComponentLoaderModule } from '@wishtack/reactive-component-loader';

const Modules = {
  './components/aggregation/aggregation.module': AggregationModule,
  './components/annotation-viewer/annotation-viewer.module': AnnotationViewerModule,
  './components/data-table/data-table.module': DataTableModule,
  './components/document-viewer/document-viewer.module': DocumentViewerModule,
  './components/filter-builder/filter-builder.module': FilterBuilderModule,
  './components/map/map.module': MapModule,
  './components/media-viewer/media-viewer.module': MediaViewerModule,
  './components/network-graph/network-graph.module': NetworkGraphModule,
  './components/news-feed/news-feed.module': NewsFeedModule,
  './components/query-bar/query-bar.module': QueryBarModule,
  './components/taxonomy-viewer/taxonomy-viewer.module': TaxonomyViewerModule,
  './components/text-cloud/text-cloud.module': TextCloudModule,
  './components/thumbnail-grid/thumbnail-grid.module': ThumbnailGridModule,
  './components/timeline/timeline.module': TimelineModule,
  './components/wiki-viewer/wiki-viewer.module': WikiViewerModule,
  './components/about-neon/about-neon.module': AboutNeonModule,
  './components/gear/gear.module': GearModule,
  './components/save-state/save-state.module': SaveStateModule,
  './components/settings/settings.module': SettingsModule,
  './components/add-visualization/add-visualization.module': AddVisualizationModule
};

describe('Dashboard', () => {
  let fixture: ComponentFixture<DashboardComponent>;
  let getService = (type: any) => fixture.debugElement.injector.get(type);
  let debugElement: DebugElement;
  let component: DashboardComponent;
  let spyOnInit;

  initializeTestBed('Dashboard', {
    imports: [
      DashboardModule,
      ReactiveComponentLoaderModule.forRoot(),
      RouterTestingModule,
      HttpClientModule
    ],
    providers: [
      { provide: ConfigService, useValue: ConfigService.as(new NeonGTDConfig()) },
      { provide: APP_BASE_HREF, useValue: '/' },
      ConnectionService,
      { provide: DatasetService, useClass: DatasetServiceMock },
      { provide: FilterService, useClass: FilterServiceMock },
      ParameterService,
      { provide: AbstractSearchService, useClass: SearchServiceMock },
      { provide: AbstractWidgetService, useClass: WidgetService }
    ]
  });

  beforeEach(() => {
    const spyNgModuleFactoryLoader = TestBed.get(NgModuleFactoryLoader);
    spyNgModuleFactoryLoader.stubbedModules = Modules;

    fixture = TestBed.createComponent(DashboardComponent);
    component = fixture.componentInstance;
    component.createGear = false; // TODO: This needs to be figured out why gear is breaking the tests
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
    getService(FilterService).addFilter(null, 'testName', DatasetServiceMock.DATABASES[0].name, DatasetServiceMock.TABLES[0].name,
      neon.query.where('testFilterField', '=', 'value1'), 'testFilterField');
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

  it('check that the messagenger subscribes to the correct channels and that the callbacks update the correct booleans', async(() => {
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
