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
import { Injectable } from '@angular/core';
/**
 * This provides an Angular for registering and unregistering widgets on a page and their export methods, as well as getting those widgets
 * and getting/setting the type of file the page is set to export.
 *
 * @class neonDemo.ExportService
 * @constructor
 */
var ExportService = /** @class */ (function () {
    function ExportService() {
        this.widgets = [];
        // This should match up with the value field of the entry that has selected initialized to true
        // in the formats array of fileFormats.js.
        this.format = 0;
        // The limit clause with which to replace the limit clauses on queries when exporting.
        this.limitClause = {
            limit: 100000
        };
        // These will tell a query to not ignore any filters - useful for visualizations like the timeline
        // that ignore their own filters by default.
        this.ignoreFilters_ = false;
        this.ignoredFilterIds_ = [];
        // The current widget registration number. Incremented when a new widget is registered.
        this.widgetNumber = -1;
        // Do nothing.
    }
    ExportService_1 = ExportService;
    /**
     * Registers a function to this  so that it can be executed as part of a bulk operation. Should be called by visualization
     * widgets upon being created.
     * @param bundleFunction {Function} The function to register.
     * @return {Number} The registration ID of the widget that called this method.
     */
    ExportService.prototype.register = function (bundleFunction) {
        this.widgetNumber += 1;
        this.widgets.push({
            id: this.widgetNumber,
            callback: bundleFunction
        });
        return this.widgetNumber;
    };
    /**
     * Unregisters a function with the given ID from this  Should be called by visualization widgets upon being destroyed.
     * @param uuid {String} The unique ID of the function being unregistered.
     */
    ExportService.prototype.unregister = function (uuid) {
        var x = this.widgets.length - 1;
        for (x; x >= 0; x--) {
            if ((this.widgets[x]).id === uuid) {
                this.widgets.splice(x, 1);
                return;
            }
        }
    };
    /**
     * Returns a list of all objects currently registered to this  so the functions they have references to can
     * be used for bulk operations.
     * @return {Array} The list of objects subsrcibed to this
     */
    ExportService.prototype.getWidgets = function () {
        return this.widgets;
    };
    /**
     * Sets the file format in which widgets should request exports, given as a number that corresponds to an extension (for a list of
     * numeric values and which file extensions they correspond to, check in fileFormats.js or Exportgroovy).
     * @param {Number} fileFormat The new file format in which widgets should request exports.
     */
    ExportService.prototype.setFileFormat = function (fileFormat) {
        this.format = fileFormat;
    };
    /**
     * Returns the available formats.
     * @return {Object} An object containing a name field for the extension and a value field that acts as the ID for this type.
     */
    ExportService.prototype.getFileFormats = function () {
        return ExportService_1.AVAILABLE_FORMATS;
    };
    /**
     * Returns the numeric value of the file format in which widgets should request exports.
     * @return {Number} The file format in which widgets should request exports.
     */
    ExportService.prototype.getFileFormat = function () {
        return this.format;
    };
    /**
     * Returns the limit clause that should be given to queries going to export.
     * We want to remove limits on data returned as much as possible, but also don't want to overwhelm the server's memory.
     * @return {Object} The limit clause that should be given to queries going to export.
     */
    ExportService.prototype.getLimitClause = function () {
        return this.limitClause;
    };
    /**
     * Returns the limit clause that should be given to queries going to export.
     * For visualizations like the timeline, this works with getIgnoredFilterIds to ensure the export will contain only "active" data.
     * @return {boolean} Whether or not queries going to export should ignore filters.
     */
    ExportService.prototype.getIgnoreFilters = function () {
        return this.ignoreFilters_;
    };
    /**
     * Returns the list of ignored filter ids that should be given to queries going to export.
     * For visualizations like the timeline, this works with getIgnoreFilters to ensure the export will contain only "active" data.
     * @return {Array} The list of filter ids to ignore that should be given to queries going to export.
     */
    ExportService.prototype.getIgnoredFilterIds = function () {
        return this.ignoredFilterIds_;
    };
    /**
     * Which one of these is made with "selected: true" should be the same as the declared initial value for
     * format inside of exportService.js.
     * The value field of each format should match up with the static final ints declared in ExportService.groovy,
     * and serves as a psuedo-enum value.
     */
    ExportService.AVAILABLE_FORMATS = [{
            name: 'csv',
            value: 0
        }, {
            name: 'xlsx',
            value: 1
        }];
    ExportService = ExportService_1 = __decorate([
        Injectable(),
        __metadata("design:paramtypes", [])
    ], ExportService);
    return ExportService;
    var ExportService_1;
}());
export { ExportService };
//# sourceMappingURL=export.service.js.map