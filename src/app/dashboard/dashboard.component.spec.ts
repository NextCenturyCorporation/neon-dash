/**
 * Copyright 2019 Next Century Corporation
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
 */
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { DebugElement, NgModuleFactoryLoader } from '@angular/core';
import { By } from '@angular/platform-browser';
import { APP_BASE_HREF } from '@angular/common';

import { DashboardComponent } from './dashboard.component';

import { NeonConfig, NeonDashboardLeafConfig, NeonLayoutConfig } from '../models/types';
import { NeonGridItem } from '../models/neon-grid-item';
import { neonEvents } from '../models/neon-namespaces';

import { AbstractSearchService } from 'nucleus/dist/core/services/abstract.search.service';
import { InjectableColorThemeService } from '../services/injectable.color-theme.service';
import { DashboardService } from '../services/dashboard.service';
import { InjectableFilterService } from '../services/injectable.filter.service';

import { DashboardServiceMock, EmptyDashboardServiceMock } from '../services/mock.dashboard-service';
import { SearchServiceMock } from 'nucleus/dist/core/services/mock.search.service';
import { initializeTestBed } from '../../testUtils/initializeTestBed';

import { ConfigService } from '../services/config.service';
import { ConfigUtil } from '../util/config.util';
import { GearModule } from '../components/gear/gear.module';

const Modules = {
    './components/gear/gear.module#GearModule': GearModule
};

import { AppLazyModule } from '../app-lazy.module';
import { DashboardModule } from './dashboard.module';
import { HttpClientModule } from '@angular/common/http';
import { GridState } from '../models/grid-state';
import { take } from 'rxjs/operators';

describe('Dashboard', () => {
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
            { provide: APP_BASE_HREF, useValue: '/' },
            { provide: DashboardService, useClass: DashboardServiceMock },
            InjectableFilterService,
            { provide: AbstractSearchService, useClass: SearchServiceMock },
            InjectableColorThemeService
        ]
    }, false);

    beforeEach(() => {
        const spyNgModuleFactoryLoader = TestBed.get(NgModuleFactoryLoader);
        spyNgModuleFactoryLoader.stubbedModules = Modules;

        fixture = TestBed.createComponent(DashboardComponent);
        component = fixture.componentInstance;

        spyOnInit = spyOn(component, 'ngOnInit');
        fixture.detectChanges();
        debugElement = fixture.debugElement;
    });

    it('should include top level layout components', () => {
        expect(debugElement.nativeElement.querySelectorAll('mat-sidenav-container')).toBeTruthy();
        expect(debugElement.nativeElement.querySelectorAll('app-dashboard-selector')).toBeTruthy();
        // Since the about pane and options pane are rendered only after a user opens their sidenav area,
        // these should not exist upon initial render.
        expect(debugElement.nativeElement.querySelectorAll('app-right-panel')).toBeTruthy();
    });

    it('should be showing the correct defaults', () => {
        expect(component.showCustomConnectionButton).toEqual(true);
        expect(component.showFilterTray).toEqual(true);
        expect(component.showVisualizationsShortcut).toEqual(true);

        expect(component.createFiltersComponent).toEqual(false);
    });

    it('should correctly toggle the panels', () => {
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
    });

    it('should navigate on filters changed', () => {
        let spyOnRouter = spyOn(component.router, 'navigate');
        component.onFiltersChanged('testCaller');
        expect(spyOnRouter.calls.count()).toEqual(1);
        const [path, params] = spyOnRouter.calls.argsFor(0);
        expect(path).toEqual(['/']);
        expect(params.queryParams).toEqual({
            dashboard: ConfigUtil.DEFAULT_CONFIG_NAME
        });
        expect(params.fragment).toBeTruthy();
    });

    it('toggle filters component', () => {
        component.showDashboardSelector = false;
        component.showFiltersComponent = false;
        component.toggleFiltersDialog();
        expect(component.showDashboardSelector).toEqual(false);
        expect(component.showFiltersComponent).toEqual(true);

        component.showDashboardSelector = false;
        component.showFiltersComponent = true;
        component.toggleFiltersDialog();
        expect(component.showDashboardSelector).toEqual(false);
        expect(component.showFiltersComponent).toEqual(false);

        component.showDashboardSelector = true;
        component.showFiltersComponent = false;
        component.toggleFiltersDialog();
        expect(component.showDashboardSelector).toEqual(false);
        expect(component.showFiltersComponent).toEqual(true);

        component.showDashboardSelector = true;
        component.showFiltersComponent = true;
        component.toggleFiltersDialog();
        expect(component.showDashboardSelector).toEqual(false);
        expect(component.showFiltersComponent).toEqual(false);
    });

    it('check that the messenger subscribes to the correct channels and that the callbacks update the correct booleans', () => {
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
    });

    it('updateShowVisualizationsShortcut does update showVisualizationsShortcut', () => {
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
    });

    it('updateShowFilterTray does update showFiltersComponent', () => {
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
    });

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

        expect(component.gridState.activeWidgetList).toEqual([{
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
        expect(component.gridState.tabs.length).toEqual(1);
        expect(component.gridState.tabs[0].name).toEqual('');
        expect(component.gridState.activeWidgetList).toEqual([]);

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

        expect(component.gridState.tabs.length).toEqual(1);
        expect(component.gridState.tabs[0].name).toEqual('tab1');
        expect(component.gridState.activeWidgetList).toEqual([{
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

        expect(component.gridState.tabs.length).toEqual(1);
        expect(component.gridState.tabs[0].name).toEqual('tab1');
        expect(component.gridState.activeWidgetList).toEqual([{
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

        expect(component.gridState.tabs.length).toEqual(2);
        expect(component.gridState.tabs[0].name).toEqual('tab1');
        expect(component.gridState.activeWidgetList).toEqual([{
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
        expect(component.gridState.tabs[1].name).toEqual('tab2');
        expect(component.gridState.tabs[1].list).toEqual([{
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

        expect(component.gridState.activeWidgetList).toEqual([{
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

        expect(component.gridState.activeWidgetList).toEqual([{
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

        expect(component.gridState.activeWidgetList).toEqual([{
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

        expect(component.gridState.activeWidgetList).toEqual([{
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
        component.gridState.tabs[0].list = [{
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

        expect(component.gridState.activeWidgetList).toEqual([{
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
        component.gridState.tabs[0].list = [{
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

        component.gridState.clear();

        expect(component.gridState.activeWidgetList).toEqual([]);
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

        component.gridState.tabs[0].list = [widgetGridItemToDelete, {
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

        expect(component.gridState.activeWidgetList).toEqual([{
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

    it('getMaxColInUse does return expected number', () => {
        expect(component.gridState.getMaxColInUse()).toEqual(0);

        component.gridState.tabs[0].list = [{
            id: 'a',
            borderSize: 10,
            col: 1,
            dragHandle: '.drag-handle',
            row: 1,
            sizex: 1,
            sizey: 1
        }];

        expect(component.gridState.getMaxColInUse()).toEqual(1);

        component.gridState.tabs[0].list = [{
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

        expect(component.gridState.getMaxColInUse()).toEqual(2);
    });

    it('getMaxRowInUse does return expected number', () => {
        expect(component.gridState.getMaxRowInUse()).toEqual(0);

        component.gridState.tabs[0].list = [{
            id: 'a',
            borderSize: 10,
            col: 1,
            dragHandle: '.drag-handle',
            row: 1,
            sizex: 1,
            sizey: 1
        }];

        expect(component.gridState.getMaxRowInUse()).toEqual(1);

        component.gridState.tabs[0].list = [{
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

        expect(component.gridState.getMaxRowInUse()).toEqual(2);
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

        component.gridState.tabs[0].list = [{
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

    it('retrieveFullDashboardTitle does return expected string', () => {
        expect(component.retrieveFullDashboardTitle([])).toEqual('');
        expect(component.retrieveFullDashboardTitle(['a'])).toEqual('');
        expect(component.retrieveFullDashboardTitle(['a', 'b'])).toEqual('b');
        expect(component.retrieveFullDashboardTitle(['a', 'b', 'c'])).toEqual('b / c');
        expect(component.retrieveFullDashboardTitle(['a', 'b', 'c', 'd'])).toEqual('b / c / d');
        expect(component.retrieveFullDashboardTitle(['a', 'b', 'c', 'd', 'e'])).toEqual('b / c / d / e');
    });
});

describe('Dashboard Custom', () => {
    let fixture: ComponentFixture<DashboardComponent>;
    let component: DashboardComponent;
    let configService: ConfigService;

    initializeTestBed('Dashboard Custom', {
        imports: [
            AppLazyModule,
            DashboardModule,
            HttpClientModule,
            RouterTestingModule
        ],
        providers: [
            { provide: APP_BASE_HREF, useValue: '/' },
            { provide: DashboardService, useClass: EmptyDashboardServiceMock },
            InjectableFilterService,
            { provide: AbstractSearchService, useClass: SearchServiceMock },
            InjectableColorThemeService
        ]
    }, false);

    beforeEach(() => {
        const spyNgModuleFactoryLoader = TestBed.get(NgModuleFactoryLoader);
        spyNgModuleFactoryLoader.stubbedModules = Modules;

        fixture = TestBed.createComponent(DashboardComponent);
        component = fixture.componentInstance;
        configService = component.dashboardService['configService'];
        fixture.detectChanges();
    });

    it('setting active dashboard does work as expected', (done) => {
        let spySender = spyOn(component.messageSender, 'publish');
        let spySimpleFilter = spyOn(component.simpleFilter, 'updateSimpleFilterDesign');

        const config = NeonConfig.get({
            projectTitle: 'Test Config',
            datastores: {
                testName1: { host: 'testHost1', type: 'testType1', databases: DashboardServiceMock.DATABASES },
                testName2: { host: 'testHost2', type: 'testType2', databases: DashboardServiceMock.DATABASES }
            },
            layouts: {
                DISCOVERY: [
                    {
                        name: 'a'
                    },
                    {
                        name: 'b'
                    },
                    {
                        hide: true,
                        name: 'c'
                    },
                    {
                        name: 'd'
                    }
                ] as NeonLayoutConfig[]
            }
        });

        let testDashboard = NeonDashboardLeafConfig.get({
            category: 'Select an option...',
            fullTitle: ['Test Title'],
            layout: 'DISCOVERY',
            name: 'Test Name',
            options: {
                connectOnLoad: true
            }
        });

        component.dashboardService.stateSource.pipe(take(1)).subscribe((state) => {
            fixture.detectChanges();

            expect(state.dashboard).toEqual(testDashboard);
            expect(state.datastores).toEqual([config.datastores.testName1, config.datastores.testName2]);

            expect(spySender.calls.count()).toEqual(4);
            expect(spySender.calls.argsFor(0)).toEqual([neonEvents.WIDGET_ADD, {
                gridName: '',
                widgetGridItem: {
                    name: 'a'
                }
            }]);
            expect(spySender.calls.argsFor(1)).toEqual([neonEvents.WIDGET_ADD, {
                gridName: '',
                widgetGridItem: {
                    name: 'b'
                }
            }]);
            expect(spySender.calls.argsFor(2)).toEqual([neonEvents.WIDGET_ADD, {
                gridName: '',
                widgetGridItem: {
                    name: 'd'
                }
            }]);
            expect(spySender.calls.argsFor(3)).toEqual([neonEvents.DASHBOARD_REFRESH, {}]);

            expect(spySimpleFilter.calls.count()).toEqual(1);

            expect(component.showDashboardSelector).toEqual(false);

            done();
        });

        component.dashboardService.configSource.pipe(take(1)).subscribe(() => {
            component.dashboardService.setActiveDashboard(testDashboard);
        });

        configService.setActive({
            ...config,
            dashboards: testDashboard
        });

        fixture.detectChanges();
    });

    it('setting active dashboard does work with tabs', (done) => {
        let spySender = spyOn(component.messageSender, 'publish');
        let spySimpleFilter = spyOn(component.simpleFilter, 'updateSimpleFilterDesign');

        const config = NeonConfig.get({
            projectTitle: 'Test Config',
            datastores: {
                testName1: { host: 'testHost1', type: 'testType1', databases: DashboardServiceMock.DATABASES },
                testName2: { host: 'testHost2', type: 'testType2', databases: DashboardServiceMock.DATABASES }
            },
            layouts: {
                DISCOVERY: {
                    tab1: [{
                        name: 'a'
                    }],
                    tab2: [{
                        name: 'b'
                    }, {
                        hide: true,
                        name: 'c'
                    }, {
                        name: 'd'
                    }]
                }
            }
        });

        let testDashboard = NeonDashboardLeafConfig.get({
            category: 'Select an option...',
            fullTitle: ['Test Title'],
            layout: 'DISCOVERY',
            name: 'Test Name',
            options: {
                connectOnLoad: true
            }
        });

        component.dashboardService.stateSource.pipe(take(1)).subscribe((state) => {
            fixture.detectChanges();

            expect(state.dashboard).toEqual(testDashboard);
            expect(state.datastores).toEqual([config.datastores.testName1, config.datastores.testName2]);

            expect(spySender.calls.count()).toEqual(4);

            expect(spySender.calls.argsFor(0)).toEqual([neonEvents.WIDGET_ADD, {
                gridName: 'tab1',
                widgetGridItem: {
                    name: 'a'
                }
            }]);

            expect(spySender.calls.argsFor(1)).toEqual([neonEvents.WIDGET_ADD, {
                gridName: 'tab2',
                widgetGridItem: {
                    name: 'b'
                }
            }]);
            expect(spySender.calls.argsFor(2)).toEqual([neonEvents.WIDGET_ADD, {
                gridName: 'tab2',
                widgetGridItem: {
                    name: 'd'
                }
            }]);

            expect(spySimpleFilter.calls.count()).toEqual(1);

            expect(component.showDashboardSelector).toEqual(false);

            done();
        });

        component.dashboardService.configSource.pipe(take(1)).subscribe(() => {
            component.dashboardService.setActiveDashboard(testDashboard);
        });

        configService.setActive({
            ...config,
            dashboards: testDashboard
        });

        fixture.detectChanges();
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
        let gridItem: NeonGridItem = {
            col: 2,
            row: 2,
            sizex: 2,
            sizey: 2
        };

        expect(GridState.widgetFits(gridItem, [])).toEqual(true);

        expect(GridState.widgetFits(gridItem, [{
            id: 'a',
            borderSize: 10,
            col: 1,
            dragHandle: '.drag-handle',
            row: 1,
            sizex: 1,
            sizey: 1
        }])).toEqual(true);

        expect(GridState.widgetFits(gridItem, [{
            id: 'a',
            borderSize: 10,
            col: 1,
            dragHandle: '.drag-handle',
            row: 1,
            sizex: 2,
            sizey: 2
        }])).toEqual(false);

        expect(GridState.widgetFits(gridItem, [{
            id: 'a',
            borderSize: 10,
            col: 2,
            dragHandle: '.drag-handle',
            row: 2,
            sizex: 1,
            sizey: 1
        }])).toEqual(false);

        expect(GridState.widgetFits(gridItem, [{
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
        }])).toEqual(true);

        expect(GridState.widgetFits(gridItem, [{
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
        }])).toEqual(false);
    });

    it('widgetOverlaps does return expected boolean', () => {
        expect(GridState.widgetOverlaps(
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

        expect(GridState.widgetOverlaps(
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

        expect(GridState.widgetOverlaps(
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

        expect(GridState.widgetOverlaps(
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

        expect(GridState.widgetOverlaps(
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

        expect(GridState.widgetOverlaps(
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

        expect(GridState.widgetOverlaps(
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

        expect(GridState.widgetOverlaps(
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

        expect(GridState.widgetOverlaps(
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

        expect(GridState.widgetOverlaps(
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
