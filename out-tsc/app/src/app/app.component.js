var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
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
import { Component, Inject, QueryList, ViewChild, ViewChildren, ViewContainerRef } from '@angular/core';
import { DashboardOptionsComponent } from './components/dashboard-options/dashboard-options.component';
import { NeonGTDConfig } from './neon-gtd-config';
import { MatDialog, MatDialogConfig, MatSnackBar } from '@angular/material';
import { ActiveGridService } from './services/active-grid.service';
import { DatasetService } from './services/dataset.service';
import { ThemesService } from './services/themes.service';
import { NgGrid } from 'angular2-grid';
import { VisualizationContainerComponent } from './components/visualization-container/visualization-container.component';
import { AddVisualizationComponent } from './components/add-visualization/add-visualization.component';
import { FilterTrayComponent } from './components/filter-tray/filter-tray.component';
import { SnackBarComponent } from './components/snack-bar/snack-bar.component';
import * as L from 'leaflet'; // imported for use of DomUtil.enable/disableTextSelection
var AppComponent = /** @class */ (function () {
    function AppComponent(datasetService, themesService, activeGridService, dialog, viewContainerRef, neonConfig, snackBar) {
        this.datasetService = datasetService;
        this.themesService = themesService;
        this.activeGridService = activeGridService;
        this.dialog = dialog;
        this.viewContainerRef = viewContainerRef;
        this.neonConfig = neonConfig;
        this.snackBar = snackBar;
        // Used to determine which pane is show in the right sidenav
        this.showAbout = true;
        this.showAddVisualizationButton = false;
        this.showFilterTrayButton = false;
        this.gridItems = [];
        this.datasets = [];
        this.gridConfig = {
            resizable: true,
            margins: [10, 0, 0, 10],
            min_cols: 1,
            max_cols: 24,
            min_rows: 0,
            max_rows: 0,
            min_width: 50,
            min_height: 50,
            maintain_ratio: true,
            auto_style: true,
            auto_resize: true,
            cascade: 'up',
            fix_to_grid: true,
            limit_to_screen: true
        };
        // TODO: Default to false and set to true only after a dataset has been selected.
        this.showAddVisualizationButton = true;
        this.showFilterTrayButton = true;
        this.datasets = this.datasetService.getDatasets();
        this.themesService = themesService;
        this.neonConfig = neonConfig;
        this.snackBar = snackBar;
        if (neonConfig.errors && neonConfig.errors.length > 0) {
            var snackBarRef = this.snackBar.openFromComponent(SnackBarComponent, {
                viewContainerRef: this.viewContainerRef
            });
            snackBarRef.instance.snackBarRef = snackBarRef;
            snackBarRef.instance.addErrors('Configuration Errors', neonConfig.errors);
        }
    }
    AppComponent.prototype.gridItemsToString = function () {
        return JSON.stringify(this.gridItems);
    };
    AppComponent.prototype.getDatasets = function () {
        return this.datasets;
    };
    AppComponent.prototype.openAddVisualizationDialog = function () {
        var _this = this;
        var config = new MatDialogConfig();
        config.viewContainerRef = this.viewContainerRef;
        this.addVisDialogRef = this.dialog.open(AddVisualizationComponent, config);
        L.DomUtil.disableTextSelection();
        this.addVisDialogRef.afterClosed().subscribe(function () {
            _this.addVisDialogRef = null;
            L.DomUtil.enableTextSelection();
        });
    };
    AppComponent.prototype.openFilterTrayDialog = function () {
        var _this = this;
        var config = new MatDialogConfig();
        config.viewContainerRef = this.viewContainerRef;
        this.filterTrayDialogRef = this.dialog.open(FilterTrayComponent, config);
        this.filterTrayDialogRef.afterClosed().subscribe(function () {
            _this.filterTrayDialogRef = null;
        });
    };
    AppComponent.prototype.onResizeStart = function (i, event) {
        this.visualizations.toArray()[i].onResizeStart();
    };
    AppComponent.prototype.onResizeStop = function (i, event) {
        this.showItemLocation(event);
        this.visualizations.toArray()[i].onResizeStop();
    };
    AppComponent.prototype.onDragStop = function (i, event) {
        this.showItemLocation(event);
    };
    AppComponent.prototype.ngAfterViewInit = function () {
        // child is set
        /* NOTE:
         * There was an issue with Angular Material beta 12 and angular2-grid,
         * where the grid would initially be multiple times larger than the rest of the page
         * until the window has been resized.
         * To work around this, trigger a resize event in the grid on page load so that it measures
         * correctly
         */
        this.activeGridService.triggerResize();
    };
    AppComponent.prototype.ngOnInit = function () {
        this.gridItems = this.activeGridService.getGridItems();
        this.activeGridService.setGrid(this.grid);
        this.activeGridService.setGridConfig(this.gridConfig);
    };
    AppComponent.prototype.ngOnDestroy = function () {
        // Do nothing.
    };
    AppComponent.prototype.toggleDashboardOptions = function () {
        if (this.dashboardOptionsComponent) {
            this.dashboardOptionsComponent.loadStateNames();
        }
        this.showAbout = false;
    };
    AppComponent.prototype.showItemLocation = function (event) {
        /**
         * COMMENTED OUT!  If you are debugging, you can uncomment this, and see what is going on
         * as you move grid items.  It should not be in production code.
         * if (event == null) {
         *   return;
         * }
         * let str = `row: ${event.row} col: ${event.col} sizex: ${event.sizex} sizey: ${event.sizey}`;
         * console.log(str);
         */
    };
    __decorate([
        ViewChild(DashboardOptionsComponent),
        __metadata("design:type", DashboardOptionsComponent)
    ], AppComponent.prototype, "dashboardOptionsComponent", void 0);
    __decorate([
        ViewChild(NgGrid),
        __metadata("design:type", NgGrid)
    ], AppComponent.prototype, "grid", void 0);
    __decorate([
        ViewChildren(VisualizationContainerComponent),
        __metadata("design:type", QueryList)
    ], AppComponent.prototype, "visualizations", void 0);
    AppComponent = __decorate([
        Component({
            selector: 'app-root',
            templateUrl: './app.component.html',
            styleUrls: [
                '../../node_modules/angular2-grid/NgGrid.css',
                './app.component.scss'
            ]
        }),
        __param(5, Inject('config')),
        __metadata("design:paramtypes", [DatasetService, ThemesService,
            ActiveGridService, MatDialog,
            ViewContainerRef, NeonGTDConfig, MatSnackBar])
    ], AppComponent);
    return AppComponent;
}());
export { AppComponent };
//# sourceMappingURL=app.component.js.map