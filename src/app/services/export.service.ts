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

export interface ExportInfo {
    id: number | string;
    callback: Function;
}

/**
 * This provides an Angular for registering and unregistering widgets on a page and their export methods, as well as getting those widgets
 * and getting/setting the type of file the page is set to export.
 *
 * @class neonDemo.ExportService
 * @constructor
 */
@Injectable()
export class ExportService {

   /**
    * Which one of these is made with "selected: true" should be the same as the declared initial value for
    * format inside of exportService.js.
    * The value field of each format should match up with the static final ints declared in ExportService.groovy,
    * and serves as a psuedo-enum value.
    */
    public static AVAILABLE_FORMATS: any[] = [{
        name: 'csv',
        value: 0
    }, {
        name: 'xlsx',
        value: 1
    }];

    private widgets: ExportInfo[] = [];

    // This should match up with the value field of the entry that has selected initialized to true
    // in the formats array of fileFormats.js.
    private format: number = 0;

    // The limit clause with which to replace the limit clauses on queries when exporting.
    private limitClause: any = {
        limit: 100000
    };

    // These will tell a query to not ignore any filters - useful for visualizations like the timeline
    // that ignore their own filters by default.
    private ignoreFilters_: boolean = false;
    private ignoredFilterIds_: string[] = [];

    // The current widget registration number. Incremented when a new widget is registered.
    private widgetNumber: number = -1;

    constructor() {
        // Do nothing.
    }

    /**
     * Registers a function to this  so that it can be executed as part of a bulk operation. Should be called by visualization
     * widgets upon being created.
     * @param bundleFunction {Function} The function to register.
     * @return {Number} The registration ID of the widget that called this method.
     */
    register(bundleFunction: Function) {
        this.widgetNumber += 1;
        this.widgets.push({
            id: this.widgetNumber,
            callback: bundleFunction
        });
        return this.widgetNumber;
    }

    /**
     * Unregisters a function with the given ID from this  Should be called by visualization widgets upon being destroyed.
     * @param uuid {String} The unique ID of the function being unregistered.
     */
    unregister(uuid: number): void {
        let x: number = this.widgets.length - 1;
        for (x; x >= 0; x--) {
            if ((this.widgets[x]).id === uuid) {
                this.widgets.splice(x, 1);
                return;
            }
        }
    }

    /**
     * Returns a list of all objects currently registered to this  so the functions they have references to can
     * be used for bulk operations.
     * @return {Array} The list of objects subsrcibed to this
     */
    getWidgets(): ExportInfo[] {
        return this.widgets;
    }

    /**
     * Sets the file format in which widgets should request exports, given as a number that corresponds to an extension (for a list of
     * numeric values and which file extensions they correspond to, check in fileFormats.js or Exportgroovy).
     * @param {Number} fileFormat The new file format in which widgets should request exports.
     */
    setFileFormat(fileFormat: number) {
        this.format = fileFormat;
    }

    /**
     * Returns the available formats.
     * @return {Object} An object containing a name field for the extension and a value field that acts as the ID for this type.
     */
    getFileFormats(): any[] {
        return ExportService.AVAILABLE_FORMATS;
    }

    /**
     * Returns the numeric value of the file format in which widgets should request exports.
     * @return {Number} The file format in which widgets should request exports.
     */
    getFileFormat(): number {
        return this.format;
    }

    /**
     * Returns the limit clause that should be given to queries going to export.
     * We want to remove limits on data returned as much as possible, but also don't want to overwhelm the server's memory.
     * @return {Object} The limit clause that should be given to queries going to export.
     */
    getLimitClause(): any {
        return this.limitClause;
    }

    /**
     * Returns the limit clause that should be given to queries going to export.
     * For visualizations like the timeline, this works with getIgnoredFilterIds to ensure the export will contain only "active" data.
     * @return {boolean} Whether or not queries going to export should ignore filters.
     */
    getIgnoreFilters(): boolean {
        return this.ignoreFilters_;
    }

    /**
     * Returns the list of ignored filter ids that should be given to queries going to export.
     * For visualizations like the timeline, this works with getIgnoreFilters to ensure the export will contain only "active" data.
     * @return {Array} The list of filter ids to ignore that should be given to queries going to export.
     */
    getIgnoredFilterIds(): string[] {
        return this.ignoredFilterIds_;
    }
}
