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
import { NeonConfig, NeonDatastoreConfig } from '../types';
import { NeonGridItem } from '../neon-grid-item';
import { neonEvents } from '../neon-namespaces';

import { AbstractSearchService } from '../services/abstract.search.service';
import { AbstractWidgetService } from '../services/abstract.widget.service';
import { DashboardService } from '../services/dashboard.service';
import { FilterService } from '../services/filter.service';
import { ParameterService } from '../services/parameter.service';
import { WidgetService } from '../services/widget.service';

import { DashboardServiceMock } from '../../testUtils/MockServices/DashboardServiceMock';
import { SearchServiceMock } from '../../testUtils/MockServices/SearchServiceMock';
import { initializeTestBed } from '../../testUtils/initializeTestBed';

import { ConfigService } from '../services/config.service';
import { GearModule } from '../components/gear/gear.module';

const Modules = {
    './components/gear/gear.module#GearModule': GearModule
};

import { AppLazyModule } from '../app-lazy.module';
import { DashboardModule } from './dashboard.module';
import { HttpClientModule } from '@angular/common/http';
import { NeonDashboardConfig } from '../types';

fdescribe('Dashboard', () => {
    let fixture: ComponentFixture<DashboardComponent>;
    let debugElement: DebugElement;
    let component: DashboardComponent;
    let spyOnInit;

    initializeTestBed('Dashboard', {
        imports: [
            AppLazyModule,
            DashboardModule,
            HttpClientModule,
            RouterTestingModule
        ],
        providers: [
            { provide: ConfigService, useValue: ConfigService.as(new NeonConfig()) },
            { provide: APP_BASE_HREF, useValue: '/' },
            { provide: DashboardService, useClass: DashboardServiceMock },
            FilterService,
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
        expect(component.showFilterTray).toEqual(true);
        expect(component.showVisualizationsShortcut).toEqual(true);

        expect(component.createFiltersComponent).toEqual(false);
    }));

    it('should be showing correct filter icons', async(() => {
        expect(component.filtersIcon).toEqual('filters');
        component['isFiltered'] = () => true;
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
        component.showFilterTray = false;
        expect(debugElement.nativeElement.querySelectorAll('app-filters').length).toEqual(0);
        component.showFilterTray = true;
        component.createFiltersComponent = true;
        component.toggleFiltersDialog();
        expect(debugElement.nativeElement.querySelectorAll('app-filters')).toBeTruthy();
    }));

    it('check that the messenger subscribes to the correct channels and that the callbacks update the correct booleans', async(() => {
        let spyOnFilterTray = spyOn(component, 'updateShowFilterTray');
        let spyOnVisualizationsShortcut = spyOn(component, 'updateShowVisualizationsShortcut');
        let message = {
            show: false
        };

        expect(spyOnInit.calls.count()).toEqual(1);
        component.ngOnInit();
        expect(spyOnInit.calls.count()).toEqual(2);
        component['updateShowVisualizationsShortcut'](message);
        component['updateShowFilterTray'](message);

        expect(spyOnFilterTray.calls.argsFor(0)).toEqual([{
            show: false
        }]);

        expect(spyOnVisualizationsShortcut.calls.argsFor(0)).toEqual([{
            show: false
        }]);

        expect(spyOnFilterTray.calls.count()).toEqual(1);
        expect(spyOnVisualizationsShortcut.calls.count()).toEqual(1);
    }));

    it('updateShowVisualizationsShortcut does update showVisualizationsShortcut', async(() => {
        component['updateShowVisualizationsShortcut']({
            show: false
        });
        component.changeDetection.detectChanges();
        expect(component.showVisualizationsShortcut).toEqual(false);
        expect(debugElement.query(By.css('#showVisualizationsShortcutButton'))).toBeNull();
        component['updateShowVisualizationsShortcut']({
            show: true
        });
        component.changeDetection.detectChanges();
        expect(component.showVisualizationsShortcut).toEqual(true);
        component.changeDetection.detectChanges();
        expect(debugElement.query(By.css('#showVisualizationsShortcutButton'))).not.toBeNull();
    }));

    it('updateShowFilterTray does update showFiltersComponent', async(() => {
        component['updateShowFilterTray']({
            show: false
        });
        component.changeDetection.detectChanges();
        expect(component.showFilterTray).toEqual(false);
        expect(debugElement.query(By.css('#showFilterTrayButton'))).toBeNull();
        component['updateShowFilterTray']({
            show: true
        });
        component.changeDetection.detectChanges();
        expect(component.showFilterTray).toEqual(true);
        component.changeDetection.detectChanges();
        expect(debugElement.query(By.css('#showFilterTrayButton'))).not.toBeNull();
    }));

    it('addWidget does add the given widget with specified position to the grid', () => {
        let widgetGridItem1: NeonGridItem = {
            col: 2,
            row: 2,
            sizex: 3,
            sizey: 3
        };

        component['addWidget']({
            widgetGridItem: widgetGridItem1
        });

        expect(component.tabbedGrid[0].list).toEqual([{
            id: widgetGridItem1.id,
            borderSize: 10,
            col: 2,
            dragHandle: '.drag-handle',
            row: 2,
            sizex: 3,
            sizey: 3
        }]);
    });

    it('addWidget does work with tabs', () => {
        expect(component.tabbedGrid.length).toEqual(1);
        expect(component.tabbedGrid[0].name).toEqual('');
        expect(component.tabbedGrid[0].list).toEqual([]);

        let widgetGridItem1: NeonGridItem = {
            col: 1,
            row: 1,
            sizex: 2,
            sizey: 2
        };

        component['addWidget']({
            gridName: 'tab1',
            widgetGridItem: widgetGridItem1
        });

        expect(component.tabbedGrid.length).toEqual(1);
        expect(component.tabbedGrid[0].name).toEqual('tab1');
        expect(component.tabbedGrid[0].list).toEqual([{
            id: widgetGridItem1.id,
            borderSize: 10,
            col: 1,
            dragHandle: '.drag-handle',
            row: 1,
            sizex: 2,
            sizey: 2
        }]);

        let widgetGridItem2: NeonGridItem = {
            col: 3,
            row: 3,
            sizex: 4,
            sizey: 4
        };

        component['addWidget']({
            gridName: 'tab1',
            widgetGridItem: widgetGridItem2
        });

        expect(component.tabbedGrid.length).toEqual(1);
        expect(component.tabbedGrid[0].name).toEqual('tab1');
        expect(component.tabbedGrid[0].list).toEqual([{
            id: widgetGridItem1.id,
            borderSize: 10,
            col: 1,
            dragHandle: '.drag-handle',
            row: 1,
            sizex: 2,
            sizey: 2
        }, {
            id: widgetGridItem2.id,
            borderSize: 10,
            col: 3,
            dragHandle: '.drag-handle',
            row: 3,
            sizex: 4,
            sizey: 4
        }]);

        let widgetGridItem3: NeonGridItem = {
            col: 5,
            row: 5,
            sizex: 6,
            sizey: 6
        };

        component['addWidget']({
            gridName: 'tab2',
            widgetGridItem: widgetGridItem3
        });

        expect(component.tabbedGrid.length).toEqual(2);
        expect(component.tabbedGrid[0].name).toEqual('tab1');
        expect(component.tabbedGrid[0].list).toEqual([{
            id: widgetGridItem1.id,
            borderSize: 10,
            col: 1,
            dragHandle: '.drag-handle',
            row: 1,
            sizex: 2,
            sizey: 2
        }, {
            id: widgetGridItem2.id,
            borderSize: 10,
            col: 3,
            dragHandle: '.drag-handle',
            row: 3,
            sizex: 4,
            sizey: 4
        }]);
        expect(component.tabbedGrid[1].name).toEqual('tab2');
        expect(component.tabbedGrid[1].list).toEqual([{
            id: widgetGridItem3.id,
            borderSize: 10,
            col: 5,
            dragHandle: '.drag-handle',
            row: 5,
            sizex: 6,
            sizey: 6
        }]);
    });

    it('addWidget does set the position of the given widget with unspecified position and add it to the end of the grid', () => {
        let widgetGridItem1 = {
            col: 0, row: 0
        } as NeonGridItem;

        component['addWidget']({
            widgetGridItem: widgetGridItem1
        });

        expect(component.tabbedGrid[0].list).toEqual([{
            id: widgetGridItem1.id,
            borderSize: 10,
            col: 1,
            dragHandle: '.drag-handle',
            row: 1,
            sizex: 4,
            sizey: 4
        }]);

        let widgetGridItem2 = {
            col: 0, row: 0
        } as NeonGridItem;

        component['addWidget']({
            widgetGridItem: widgetGridItem2
        });

        expect(component.tabbedGrid[0].list).toEqual([{
            id: widgetGridItem1.id,
            borderSize: 10,
            col: 1,
            dragHandle: '.drag-handle',
            row: 1,
            sizex: 4,
            sizey: 4
        }, {
            id: widgetGridItem2.id,
            borderSize: 10,
            col: 5,
            dragHandle: '.drag-handle',
            row: 1,
            sizex: 4,
            sizey: 4
        }]);

        let widgetGridItem3 = {
            col: 0, row: 0
        } as NeonGridItem;

        component['addWidget']({
            widgetGridItem: widgetGridItem3
        });

        expect(component.tabbedGrid[0].list).toEqual([{
            id: widgetGridItem1.id,
            borderSize: 10,
            col: 1,
            dragHandle: '.drag-handle',
            row: 1,
            sizex: 4,
            sizey: 4
        }, {
            id: widgetGridItem2.id,
            borderSize: 10,
            col: 5,
            dragHandle: '.drag-handle',
            row: 1,
            sizex: 4,
            sizey: 4
        }, {
            id: widgetGridItem3.id,
            borderSize: 10,
            col: 9,
            dragHandle: '.drag-handle',
            row: 1,
            sizex: 4,
            sizey: 4
        }]);

        let widgetGridItem4 = {
            col: 0, row: 0
        } as NeonGridItem;

        component['addWidget']({
            widgetGridItem: widgetGridItem4
        });

        expect(component.tabbedGrid[0].list).toEqual([{
            id: widgetGridItem1.id,
            borderSize: 10,
            col: 1,
            dragHandle: '.drag-handle',
            row: 1,
            sizex: 4,
            sizey: 4
        }, {
            id: widgetGridItem2.id,
            borderSize: 10,
            col: 5,
            dragHandle: '.drag-handle',
            row: 1,
            sizex: 4,
            sizey: 4
        }, {
            id: widgetGridItem3.id,
            borderSize: 10,
            col: 9,
            dragHandle: '.drag-handle',
            row: 1,
            sizex: 4,
            sizey: 4
        }, {
            id: widgetGridItem4.id,
            borderSize: 10,
            col: 1,
            dragHandle: '.drag-handle',
            row: 5,
            sizex: 4,
            sizey: 4
        }]);
    });

    it('addWidget does set the position of the given widget with unspecified position and add it to the middle of the grid', () => {
        component.tabbedGrid[0].list = [{
            id: 'a',
            borderSize: 10,
            col: 1,
            dragHandle: '.drag-handle',
            row: 1,
            sizex: 12,
            sizey: 4
        }, {
            id: 'b',
            borderSize: 10,
            col: 1,
            dragHandle: '.drag-handle',
            row: 5,
            sizex: 4,
            sizey: 4
        }, {
            id: 'c',
            borderSize: 10,
            col: 9,
            dragHandle: '.drag-handle',
            row: 5,
            sizex: 4,
            sizey: 4
        }, {
            id: 'd',
            borderSize: 10,
            col: 1,
            dragHandle: '.drag-handle',
            row: 9,
            sizex: 12,
            sizey: 4
        }];

        let widgetGridItem1 = {
            col: 0, row: 0
        } as NeonGridItem;

        component['addWidget']({
            widgetGridItem: widgetGridItem1
        });

        expect(component.tabbedGrid[0].list).toEqual([{
            id: 'a',
            borderSize: 10,
            col: 1,
            dragHandle: '.drag-handle',
            row: 1,
            sizex: 12,
            sizey: 4
        }, {
            id: 'b',
            borderSize: 10,
            col: 1,
            dragHandle: '.drag-handle',
            row: 5,
            sizex: 4,
            sizey: 4
        }, {
            id: 'c',
            borderSize: 10,
            col: 9,
            dragHandle: '.drag-handle',
            row: 5,
            sizex: 4,
            sizey: 4
        }, {
            id: 'd',
            borderSize: 10,
            col: 1,
            dragHandle: '.drag-handle',
            row: 9,
            sizex: 12,
            sizey: 4
        }, {
            id: widgetGridItem1.id,
            borderSize: 10,
            col: 5,
            dragHandle: '.drag-handle',
            row: 5,
            sizex: 4,
            sizey: 4
        }]);
    });

    it('clearDashboard does delete all elements from the grid', () => {
        component.tabbedGrid[0].list = [{
            id: 'a',
            borderSize: 10,
            col: 1,
            dragHandle: '.drag-handle',
            row: 1,
            sizex: 1,
            sizey: 1
        }, {
            id: 'b',
            borderSize: 10,
            col: 2,
            dragHandle: '.drag-handle',
            row: 2,
            sizex: 1,
            sizey: 1
        }];

        component['clearDashboard']();

        expect(component.tabbedGrid[0].list).toEqual([]);
    });

    it('contractWidget does update the size and position of the given widget to its previous config', () => {
        let widgetGridItem1: NeonGridItem = {
            col: 1,
            row: 1,
            sizex: 12,
            sizey: 12,
            previousConfig: {
                col: 2,
                row: 2,
                sizex: 4,
                sizey: 4
            }
        };

        component['contractWidget']({
            widgetGridItem: widgetGridItem1
        });

        expect(widgetGridItem1).toEqual({
            col: 2,
            row: 2,
            sizex: 4,
            sizey: 4,
            previousConfig: {
                col: 2,
                row: 2,
                sizex: 4,
                sizey: 4
            }
        });
    });

    it('deleteWidget does delete the widget from the grid', () => {
        let widgetGridItemToDelete = {
            hide: false,
            id: 'a',
            borderSize: 10,
            col: 1,
            dragHandle: '.drag-handle',
            row: 1,
            sizex: 1,
            sizey: 1
        };

        component.tabbedGrid[0].list = [widgetGridItemToDelete, {
            id: 'b',
            borderSize: 10,
            col: 2,
            dragHandle: '.drag-handle',
            row: 2,
            sizex: 1,
            sizey: 1
        }];

        component['deleteWidget']({
            id: 'a'
        });

        expect(component.tabbedGrid[0].list).toEqual([{
            id: 'b',
            borderSize: 10,
            col: 2,
            dragHandle: '.drag-handle',
            row: 2,
            sizex: 1,
            sizey: 1
        }]);
        expect(widgetGridItemToDelete.hide).toEqual(true);
    });

    it('expandWidget does update the size and position of the given widget and save its previous config', () => {
        let widgetGridItem1: NeonGridItem = {
            col: 2,
            row: 2,
            sizex: 4,
            sizey: 4
        };

        spyOn(component, 'getVisibleRowCount').and.returnValue(50);

        component['expandWidget']({
            widgetGridItem: widgetGridItem1
        });

        expect(widgetGridItem1).toEqual({
            col: 1,
            row: 2,
            sizex: 12,
            sizey: 50,
            previousConfig: {
                col: 2,
                row: 2,
                sizex: 4,
                sizey: 4
            }
        });
    });

    // A
    // it('findAutoShowDashboard does return expected object', () => {
    //     expect(component['findAutoShowDashboard']({})).toEqual(null);

    //     let noShowDashboard = Dashboard.get();

    //     expect(component['findAutoShowDashboard']({
    //         noShow: noShowDashboard
    //     })).toEqual(null);

    //     noShowDashboard.options = {
    //         connectOnLoad: false
    //     };

    //     expect(component['findAutoShowDashboard']({
    //         noShow: noShowDashboard
    //     })).toEqual(null);

    //     let showDashboard = Dashboard.get();
    //     showDashboard.options = {
    //         connectOnLoad: true
    //     };

    //     expect(component['findAutoShowDashboard']({
    //         show: showDashboard
    //     })).toEqual(showDashboard);

    //     let parentDashboard = Dashboard.get();
    //     parentDashboard.choices = {
    //         show: showDashboard
    //     };

    //     expect(component['findAutoShowDashboard']({
    //         parent: parentDashboard
    //     })).toEqual(showDashboard);

    //     parentDashboard.choices.noShow = noShowDashboard;

    //     expect(component['findAutoShowDashboard']({
    //         parent: parentDashboard
    //     })).toEqual(showDashboard);
    // });

    it('getMaxColInUse does return expected number', () => {
        expect(component['getMaxColInUse']()).toEqual(0);

        component.tabbedGrid[0].list = [{
            id: 'a',
            borderSize: 10,
            col: 1,
            dragHandle: '.drag-handle',
            row: 1,
            sizex: 1,
            sizey: 1
        }];

        expect(component['getMaxColInUse']()).toEqual(1);

        component.tabbedGrid[0].list = [{
            id: 'a',
            borderSize: 10,
            col: 1,
            dragHandle: '.drag-handle',
            row: 1,
            sizex: 1,
            sizey: 1
        }, {
            id: 'b',
            borderSize: 10,
            col: 2,
            dragHandle: '.drag-handle',
            row: 2,
            sizex: 1,
            sizey: 1
        }];

        expect(component['getMaxColInUse']()).toEqual(2);
    });

    it('getMaxRowInUse does return expected number', () => {
        expect(component['getMaxRowInUse']()).toEqual(0);

        component.tabbedGrid[0].list = [{
            id: 'a',
            borderSize: 10,
            col: 1,
            dragHandle: '.drag-handle',
            row: 1,
            sizex: 1,
            sizey: 1
        }];

        expect(component['getMaxRowInUse']()).toEqual(1);

        component.tabbedGrid[0].list = [{
            id: 'a',
            borderSize: 10,
            col: 1,
            dragHandle: '.drag-handle',
            row: 1,
            sizex: 1,
            sizey: 1
        }, {
            id: 'b',
            borderSize: 10,
            col: 2,
            dragHandle: '.drag-handle',
            row: 2,
            sizex: 1,
            sizey: 1
        }];

        expect(component['getMaxRowInUse']()).toEqual(2);
    });

    it('moveWidgetToBottom does update the row of the given widget', () => {
        let widgetGridItem1: NeonGridItem = {
            col: 1,
            row: 1,
            sizex: 4,
            sizey: 4
        };

        component['moveWidgetToBottom']({
            widgetGridItem: widgetGridItem1
        });

        expect(widgetGridItem1.row).toEqual(1);

        component.tabbedGrid[0].list = [{
            id: 'a',
            borderSize: 10,
            col: 1,
            dragHandle: '.drag-handle',
            row: 1,
            sizex: 1,
            sizey: 1
        }, {
            id: 'b',
            borderSize: 10,
            col: 2,
            dragHandle: '.drag-handle',
            row: 2,
            sizex: 1,
            sizey: 1
        }];

        component['moveWidgetToBottom']({
            widgetGridItem: widgetGridItem1
        });

        expect(widgetGridItem1.row).toEqual(3);
    });

    it('moveWidgetToTop does update the row of the given widget', () => {
        let widgetGridItem1: NeonGridItem = {
            col: 1,
            row: 2,
            sizex: 4,
            sizey: 4
        };

        component['moveWidgetToTop']({
            widgetGridItem: widgetGridItem1
        });

        expect(widgetGridItem1.row).toEqual(1);
    });

    it('refreshDashboard does emit an event', () => {
        let spy = spyOn(component.messageSender, 'publish');
        component.refreshDashboard();
        expect(spy.calls.count()).toEqual(1);
        expect(spy.calls.argsFor(0)).toEqual([neonEvents.DASHBOARD_REFRESH, {}]);
    });

    it('registerWidget does update the global collection of widgets', () => {
        expect(Array.from(component.widgets.keys())).toEqual([]);

        component['registerWidget']({
            id: 'a',
            widget: null
        });

        expect(Array.from(component.widgets.keys())).toEqual(['a']);

        component['registerWidget']({
            id: 'b',
            widget: null
        });

        expect(Array.from(component.widgets.keys())).toEqual(['a', 'b']);
    });

    it('registerWidget does not re-register the same widget', () => {
        expect(Array.from(component.widgets.keys())).toEqual([]);

        component['registerWidget']({
            id: 'a',
            widget: null
        });

        expect(Array.from(component.widgets.keys())).toEqual(['a']);

        component['registerWidget']({
            id: 'a',
            widget: null
        });

        expect(Array.from(component.widgets.keys())).toEqual(['a']);
    });

    it('resizeGrid does resize the grid', () => {
        let spy = spyOn(component.grid, 'triggerResize');
        component['resizeGrid']();
        expect(spy.calls.count()).toEqual(1);
    });

    it('showDashboardState does work as expected', () => {
        let spyDashboards = spyOn(component.dashboardService, 'setActiveDashboard');
        let spyDatastores = spyOn(component.dashboardService, 'setActiveDatastore');
        let spyFilter = spyOn(component.filterService, 'setFiltersFromConfig');
        let spySender = spyOn(component.messageSender, 'publish');
        let spySimpleFilter = spyOn(component.simpleFilter, 'updateSimpleFilterConfig');

        const config = NeonConfig.get({
            datastores: {
                testName1: { host: 'testHost1', type: 'testType1' },
                testName2: { host: 'testHost2', type: 'testType2' }
            },
            layouts: {
                DISCOVERY: [{
                    tab1: [{
                        name: 'a',
                    }],
                    tab2: [{
                        name: 'b'
                    }, {
                        hide: true,
                        name: 'c'
                    }, {
                        name: 'd'
                    }]
                }]
            }
        });

        let testDashboard = NeonDashboardConfig.get({
            filters: ['x', 'y']
        });

        component.dashboardService.setConfig(config);

        component['showDashboardState']({
            dashboard: testDashboard
        });

        expect(spyDashboards.calls.count()).toEqual(1);
        expect(spyDashboards.calls.argsFor(0)).toEqual([testDashboard]);

        expect(spyDatastores.calls.count()).toEqual(1);
        // TODO THOR-1062 Permit multiple datastores.
        expect(spyDatastores.calls.argsFor(0)).toEqual([config.datastores.testName1]);

        expect(spyFilter.calls.count()).toEqual(1);
        expect(spyFilter.calls.argsFor(0)[0]).toEqual(['x', 'y']);

        expect(spySender.calls.count()).toEqual(4);
        expect(spySender.calls.argsFor(0)).toEqual([neonEvents.DASHBOARD_RESET, {}]);
        expect(spySender.calls.argsFor(1)).toEqual([neonEvents.WIDGET_ADD, {
            gridName: '',
            widgetGridItem: {
                name: 'a'
            }
        }]);
        expect(spySender.calls.argsFor(2)).toEqual([neonEvents.WIDGET_ADD, {
            gridName: '',
            widgetGridItem: {
                name: 'b'
            }
        }]);
        expect(spySender.calls.argsFor(3)).toEqual([neonEvents.WIDGET_ADD, {
            gridName: '',
            widgetGridItem: {
                name: 'd'
            }
        }]);

        expect(spySimpleFilter.calls.count()).toEqual(1);

        expect(component.showDashboardSelector).toEqual(false);
    });

    it('showDashboardState does work with tabs', () => {
        let spyDashboards = spyOn(component.dashboardService, 'setActiveDashboard');
        let spyDatastores = spyOn(component.dashboardService, 'setActiveDatastore');
        let spyFilter = spyOn(component.filterService, 'setFiltersFromConfig');
        let spySender = spyOn(component.messageSender, 'publish');
        let spySimpleFilter = spyOn(component.simpleFilter, 'updateSimpleFilterConfig');

        const config = NeonConfig.get({
            datastores: {
                testName1: { host: 'testHost1', type: 'testType1' },
                testName2: { host: 'testHost2', type: 'testType2' }
            },
            layouts: {
                DISCOVERY: [{
                    tab1: [{
                        name: 'a',
                    }],
                    tab2: [{
                        name: 'b'
                    }, {
                        hide: true,
                        name: 'c'
                    }, {
                        name: 'd'
                    }]
                }]
            }
        });

        component.dashboardService.setConfig(config);


        let testDashboard = NeonDashboardConfig.get({
            filters: ['x', 'y']
        });

        component['showDashboardState']({
            dashboard: testDashboard
        });

        expect(spyDashboards.calls.count()).toEqual(1);
        expect(spyDashboards.calls.argsFor(0)).toEqual([testDashboard]);

        expect(spyDatastores.calls.count()).toEqual(1);
        // TODO THOR-1062 Permit multiple datastores.
        expect(spyDatastores.calls.argsFor(0)).toEqual([config.datastores.testDatastore1]);

        expect(spyFilter.calls.count()).toEqual(1);
        expect(spyFilter.calls.argsFor(0)[0]).toEqual(['x', 'y']);

        expect(spySender.calls.count()).toEqual(4);
        expect(spySender.calls.argsFor(0)).toEqual([neonEvents.DASHBOARD_RESET, {}]);
        expect(spySender.calls.argsFor(1)).toEqual([neonEvents.WIDGET_ADD, {
            gridName: 'tab1',
            widgetGridItem: {
                name: 'a'
            }
        }]);
        expect(spySender.calls.argsFor(2)).toEqual([neonEvents.WIDGET_ADD, {
            gridName: 'tab2',
            widgetGridItem: {
                name: 'b'
            }
        }]);
        expect(spySender.calls.argsFor(3)).toEqual([neonEvents.WIDGET_ADD, {
            gridName: 'tab2',
            widgetGridItem: {
                name: 'd'
            }
        }]);

        expect(spySimpleFilter.calls.count()).toEqual(1);

        expect(component.showDashboardSelector).toEqual(false);
    });

    it('showDashboardStateOnPageLoad should auto-show dashboard as expected', () => {
        let spySender = spyOn(component.messageSender, 'publish');

        component['dashboards'] = NeonDashboardConfig.get();

        component['showDashboardStateOnPageLoad']();

        expect(spySender.calls.count()).toEqual(0);
    });

    it('showDashboardStateOnPageLoad with auto-show dashboard but no parameter state or parameter dataset does work as expected', () => {
        let spySender = spyOn(component.messageSender, 'publish');

        let showDashboard = NeonDashboardConfig.get({
            options: {
                connectOnLoad: true
            }
        });
        // showDashboard.datastores = {
        //     testDataStoreName1: { name: 'testDatastoreName1', host: 'testDatastoreHost1', type: 'testDatastoreType1', databases: {} }
        // };
        showDashboard.options = {
            connectOnLoad: true
        };
        let testDashboard = NeonDashboardConfig.get();
        testDashboard.choices = {
            test: showDashboard
        };
        component['dashboards'] = testDashboard;

        component['showDashboardStateOnPageLoad']();

        expect(spySender.calls.count()).toEqual(1);
        expect(spySender.calls.argsFor(0)).toEqual([neonEvents.DASHBOARD_STATE, {
            dashboard: showDashboard
        }]);
    });

    it('showDashboardStateOnPageLoad with parameter state and auto-show dashboard does work as expected', () => {
        let spySender = spyOn(component.messageSender, 'publish');
        let showDashboard = NeonDashboardConfig.get();

        // showDashboard.datastores = {
        //     testDatastoreName1: { name: 'testDatastoreName1', host: 'testDatastoreHost1', type: 'testDatastoreType1', databases: {} }
        // };
        showDashboard.options = {
            connectOnLoad: true
        };
        let testDashboard = NeonDashboardConfig.get();
        testDashboard.choices = {
            test: showDashboard
        };
        component['dashboards'] = testDashboard;

        component['showDashboardStateOnPageLoad']();

        expect(spySender.calls.count()).toEqual(1);
        expect(spySender.calls.argsFor(0)).toEqual([neonEvents.DASHBOARD_STATE, {
            dashboard: showDashboard
        }]);
    });

    it('showDashboardStateOnPageLoad with matching parameter dataset and auto-show dashboard does work as expected', () => {
        let spySender = spyOn(component.messageSender, 'publish');

        let showDashboard = NeonDashboardConfig.get();
        // showDashboard.datastores = {
        //     testDatastoreName1: { name: 'testDatastoreName1', host: 'testDatastoreHost1', type: 'testDatastoreType1', databases: {} }
        // };
        showDashboard.options = {
            connectOnLoad: true
        };
        let testDashboard = NeonDashboardConfig.get();
        testDashboard.choices = {
            test: showDashboard
        };
        component['dashboards'] = testDashboard;

        component['showDashboardStateOnPageLoad']();

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

        component['unregisterWidget']({
            id: 'a'
        });

        expect(Array.from(component.widgets.keys())).toEqual(['b']);

        component['unregisterWidget']({
            id: 'b'
        });

        expect(Array.from(component.widgets.keys())).toEqual([]);
    });

    it('widgetFits does return expected boolean', () => {
        let widgetGridItem1: NeonGridItem = {
            col: 2,
            row: 2,
            sizex: 2,
            sizey: 2
        };

        expect(component['widgetFits'](widgetGridItem1)).toEqual(true);

        component.tabbedGrid[0].list = [{
            id: 'a',
            borderSize: 10,
            col: 1,
            dragHandle: '.drag-handle',
            row: 1,
            sizex: 1,
            sizey: 1
        }];

        expect(component['widgetFits'](widgetGridItem1)).toEqual(true);

        component.tabbedGrid[0].list = [{
            id: 'a',
            borderSize: 10,
            col: 1,
            dragHandle: '.drag-handle',
            row: 1,
            sizex: 2,
            sizey: 2
        }];

        expect(component['widgetFits'](widgetGridItem1)).toEqual(false);

        component.tabbedGrid[0].list = [{
            id: 'a',
            borderSize: 10,
            col: 2,
            dragHandle: '.drag-handle',
            row: 2,
            sizex: 1,
            sizey: 1
        }];

        expect(component['widgetFits'](widgetGridItem1)).toEqual(false);

        component.tabbedGrid[0].list = [{
            id: 'a',
            borderSize: 10,
            col: 1,
            dragHandle: '.drag-handle',
            row: 1,
            sizex: 4,
            sizey: 1
        }, {
            id: 'b',
            borderSize: 10,
            col: 1,
            dragHandle: '.drag-handle',
            row: 2,
            sizex: 1,
            sizey: 4
        }];

        expect(component['widgetFits'](widgetGridItem1)).toEqual(true);

        component.tabbedGrid[0].list = [{
            id: 'a',
            borderSize: 10,
            col: 1,
            dragHandle: '.drag-handle',
            row: 1,
            sizex: 4,
            sizey: 1
        }, {
            id: 'b',
            borderSize: 10,
            col: 1,
            dragHandle: '.drag-handle',
            row: 2,
            sizex: 4,
            sizey: 1
        }];

        expect(component['widgetFits'](widgetGridItem1)).toEqual(false);
    });

    it('widgetOverlaps does return expected boolean', () => {
        expect(component['widgetOverlaps'](
            {
                col: 1,
                row: 1,
                sizex: 1,
                sizey: 1
            }, {
                col: 2,
                row: 1,
                sizex: 1,
                sizey: 1
            }
        )).toEqual(false);

        expect(component['widgetOverlaps'](
            {
                col: 1,
                row: 1,
                sizex: 1,
                sizey: 1
            }, {
                col: 1,
                row: 2,
                sizex: 1,
                sizey: 1
            }
        )).toEqual(false);

        expect(component['widgetOverlaps'](
            {
                col: 1,
                row: 1,
                sizex: 2,
                sizey: 1
            }, {
                col: 2,
                row: 1,
                sizex: 1,
                sizey: 1
            }
        )).toEqual(true);

        expect(component['widgetOverlaps'](
            {
                col: 1,
                row: 1,
                sizex: 1,
                sizey: 2
            }, {
                col: 1,
                row: 2,
                sizex: 1,
                sizey: 1
            }
        )).toEqual(true);

        expect(component['widgetOverlaps'](
            {
                col: 2,
                row: 1,
                sizex: 1,
                sizey: 1
            }, {
                col: 1,
                row: 1,
                sizex: 1,
                sizey: 1
            }
        )).toEqual(false);

        expect(component['widgetOverlaps'](
            {
                col: 1,
                row: 2,
                sizex: 1,
                sizey: 1
            }, {
                col: 1,
                row: 1,
                sizex: 1,
                sizey: 1
            }
        )).toEqual(false);

        expect(component['widgetOverlaps'](
            {
                col: 2,
                row: 1,
                sizex: 1,
                sizey: 1
            }, {
                col: 1,
                row: 1,
                sizex: 2,
                sizey: 1
            }
        )).toEqual(true);

        expect(component['widgetOverlaps'](
            {
                col: 1,
                row: 2,
                sizex: 1,
                sizey: 1
            }, {
                col: 1,
                row: 1,
                sizex: 1,
                sizey: 2
            }
        )).toEqual(true);

        expect(component['widgetOverlaps'](
            {
                col: 1,
                row: 1,
                sizex: 4,
                sizey: 4
            }, {
                col: 2,
                row: 2,
                sizex: 1,
                sizey: 1
            }
        )).toEqual(true);

        expect(component['widgetOverlaps'](
            {
                col: 1,
                row: 1,
                sizex: 4,
                sizey: 4
            }, {
                col: 3,
                row: 3,
                sizex: 4,
                sizey: 4
            }
        )).toEqual(true);
    });
});
