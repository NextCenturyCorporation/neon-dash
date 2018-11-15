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

import { neonEvents } from '../neon-namespaces';

import * as neon from 'neon-framework';

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
    public static EXPORT_FORMAT: any[] = [{
        name: 'csv',
        value: 0
    }, {
        name: 'xlsx',
        value: 1
    }];

    private widgetExportCallbacks: ExportInfo[] = [];

    // This should match up with the value field of the entry that has selected initialized to true
    // in the formats array of fileFormats.js.
    private format: number = 0;

    private messenger: neon.eventing.Messenger;

    constructor() {
        this.messenger = new neon.eventing.Messenger();
        this.messenger.subscribe(neonEvents.WIDGET_REGISTER, this.registerExport.bind(this));
        this.messenger.subscribe(neonEvents.WIDGET_UNREGISTER, this.unregisterExport.bind(this));
    }

    /**
     * Registers a function to this  so that it can be executed as part of a bulk operation. Should be called by visualization
     * widgets upon being created.
     *
     * @arg {{id:string,export:Function}} eventMessage
     */
    registerExport(eventMessage: { id: string, export: Function }) {
        this.widgetExportCallbacks.push({
            id: eventMessage.id,
            callback: eventMessage.export
        });
    }

    /**
     * Unregisters a function with the given ID from this  Should be called by visualization widgets upon being destroyed.
     *
     * @arg {{id:string}} eventMessage
     */
    unregisterExport(eventMessage: { id: string }): void {
        let x: number = this.widgetExportCallbacks.length - 1;
        for (x; x >= 0; x--) {
            if ((this.widgetExportCallbacks[x]).id === eventMessage.id) {
                this.widgetExportCallbacks.splice(x, 1);
                return;
            }
        }
    }

    /**
     * Returns a list of all objects currently registered to this  so the functions they have references to can
     * be used for bulk operations.
     * @return {Array} The list of objects subsrcibed to this
     */
    getWidgetExportCallbacks(): ExportInfo[] {
        return this.widgetExportCallbacks;
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
        return ExportService.EXPORT_FORMAT;
    }

    /**
     * Returns the numeric value of the file format in which widgets should request exports.
     * @return {Number} The file format in which widgets should request exports.
     */
    getFileFormat(): number {
        return this.format;
    }
}
