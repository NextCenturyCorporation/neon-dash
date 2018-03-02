var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
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
import { Component, ViewContainerRef, Input } from '@angular/core';
import { MatSnackBar, MatSnackBarConfig } from '@angular/material';
import { ConnectionService } from '../../services/connection.service';
import { ErrorNotificationService } from '../../services/error-notification.service';
import { ExportService } from '../../services/export.service';
import { ThemesService } from '../../services/themes.service';
var ExportControlComponent = /** @class */ (function () {
    function ExportControlComponent(connectionService, errorNotificationService, exportService, matSnackBar, themesService, viewContainerRef) {
        this.connectionService = connectionService;
        this.errorNotificationService = errorNotificationService;
        this.exportService = exportService;
        this.matSnackBar = matSnackBar;
        this.themesService = themesService;
        this.viewContainerRef = viewContainerRef;
        this.handleExportClick = this.handleExportClick.bind(this);
        this.exportFormat = 0;
    }
    ExportControlComponent.prototype.ngOnInit = function () {
        this.exportFormat = this.exportService.getFileFormats()[0].value;
        this.buttonText = (this.exportTarget === 'all' ? ' Export All Visualizations ' : 'Export to File');
        if (this.buttonTextOverride) {
            this.buttonText = this.buttonTextOverride;
        }
    };
    ExportControlComponent.prototype.setExportFormat = function (value) {
        // Do nothing.
    };
    ExportControlComponent.prototype.toggleExportFormat = function (event) {
        event.preventDefault();
    };
    ExportControlComponent.prototype.exportSuccess = function (queryResults) {
        var config = new MatSnackBarConfig();
        config.viewContainerRef = this.viewContainerRef;
        config.duration = 3000;
        this.matSnackBar.open('Export In Progress...', 'OK', config);
        window.location.assign('/neon/services/exportservice/generateZip/' + queryResults.data);
    };
    ExportControlComponent.prototype.exportFail = function (response) {
        var config = new MatSnackBarConfig();
        config.viewContainerRef = this.viewContainerRef;
        if (response.responseJSON) {
            this.matSnackBar.open('Error: ' + response.responseJSON.error, 'Close', config);
        }
        else {
            this.matSnackBar.open('Error: The export service failed to respond properly.', 'Close', config);
        }
    };
    ExportControlComponent.prototype.handleExportClick = function () {
        var exportAll = this.exportTarget === 'all';
        this.export(exportAll);
    };
    ExportControlComponent.prototype.export = function (exportAll) {
        this.exportService.setFileFormat(this.exportFormat);
        var connection = this.connectionService.getActiveConnection();
        var config = new MatSnackBarConfig();
        config.viewContainerRef = this.viewContainerRef;
        var data = {
            // TODO Change this hardcoded value to something like a user ID.
            name: (exportAll ? 'All_Widgets' : 'Export'),
            data: []
        };
        if (!connection) {
            this.matSnackBar.open('Please select a dataset before exporting.', 'OK', config);
            return;
        }
        var localExportId = this.exportId;
        var widgetObjects = this.exportService.getWidgets()
            .filter(function (widget) {
            return exportAll || widget.id === localExportId;
        })
            .map(function (widget) { return widget.callback(); });
        for (var _i = 0, widgetObjects_1 = widgetObjects; _i < widgetObjects_1.length; _i++) {
            var widgetObject = widgetObjects_1[_i];
            if (Array.isArray(widgetObject)) {
                for (var _a = 0, widgetObject_1 = widgetObject; _a < widgetObject_1.length; _a++) {
                    var widgetObjectIndx = widgetObject_1[_a];
                    for (var _b = 0, _c = widgetObjectIndx.data; _b < _c.length; _b++) {
                        var widgetObjectItem = _c[_b];
                        data.data.push(widgetObjectItem);
                    }
                }
            }
            else {
                for (var _d = 0, _e = widgetObject.data; _d < _e.length; _d++) {
                    var widgetObjectItem = _e[_d];
                    data.data.push(widgetObjectItem);
                }
            }
        }
        if (this.exportService.getWidgets().length === 0) {
            this.matSnackBar.open('There are no visualizations to export.', 'OK', config);
            return;
        }
        if (data && data.data && data.data.length === 1) {
            data.name = data.data[0].name;
        }
        connection.executeExport(data, this.exportSuccess.bind(this), this.exportFail.bind(this), this.exportService.getFileFormat());
    };
    __decorate([
        Input(),
        __metadata("design:type", String)
    ], ExportControlComponent.prototype, "exportTarget", void 0);
    __decorate([
        Input(),
        __metadata("design:type", Boolean)
    ], ExportControlComponent.prototype, "hideFormats", void 0);
    __decorate([
        Input(),
        __metadata("design:type", Number)
    ], ExportControlComponent.prototype, "exportId", void 0);
    __decorate([
        Input(),
        __metadata("design:type", String)
    ], ExportControlComponent.prototype, "buttonTextOverride", void 0);
    ExportControlComponent = __decorate([
        Component({
            selector: 'app-export-control',
            templateUrl: './export-control.component.html',
            styleUrls: ['./export-control.component.scss']
        }),
        __metadata("design:paramtypes", [ConnectionService,
            ErrorNotificationService,
            ExportService,
            MatSnackBar,
            ThemesService,
            ViewContainerRef])
    ], ExportControlComponent);
    return ExportControlComponent;
}());
export { ExportControlComponent };
//# sourceMappingURL=export-control.component.js.map