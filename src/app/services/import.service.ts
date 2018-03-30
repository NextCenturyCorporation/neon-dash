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
import * as _ from 'lodash';

/**
 * This provides an Angular service for keeping track of various pieces of information relevant to importing custom data,
 * to easily pass them from place to place.
 *
 * @class ImportService
 */
@Injectable()
export class ImportService {

    // The maximum file size allowed to be uploaded, in bytes.
    static MAX_SIZE = 30000000;

    private userName: string;
    private databaseName: string;
    private dateString: string;

    getUserName(): string {
        return this.userName;
    }

    setUserName(name: string) {
        this.userName = name;
    }

    getDatabaseName(): string {
        return this.databaseName;
    }

    setDatabaseName(dbName: string) {
        this.databaseName = dbName;
    }

    getDateString(): string {
        return this.dateString;
    }

    setDateString(dateString: string) {
        this.dateString = dateString;
    }

    /**
     * Gets the maximum allowable file input size, in either bytes or a human-readable string depending on
     * the value of the input parameter.
     * @param {boolean} Whether or not the output should be an integer number of bytes or in a human-readable string.
     * @return The maximum allowable file input size, either as a string if readable is true, or as an integer if
     * readable is false.
     */
    getMaxSize(readable: boolean): any {
        return readable ? this.sizeToReadable(ImportService.MAX_SIZE) : ImportService.MAX_SIZE;
    }

    /**
     * Given an array of objects, assumed to each have a name field and a type field at the very least,
     * returns a new array of objects identical to the input array but with all fields except for name
     * and type removed. It also puts any values of pairs of type OBJECT into objectFTPairs of the
     * associated pair.
     * @param fieldtypePairs {Array} The array of objects, each with at least a name and a type field.
     * @return {Array} An array identical to the input array, but with all fields except for name, type,
     * and objectFTPairs removed.
     */
    getFieldsAndTypes(fieldTypePairs: any[]): any[] {
        let toReturn = fieldTypePairs;
        let toRemoveIndices = [];

        fieldTypePairs.forEach((pair, index) => {
            if (pair.keys && pair.keys.length && pair.type === 'OBJECT') {
                let objectFTPairs = [];

                // Find and save in pair all objectFTPairs that are associated with pair and save the index to remove later
                pair.keys.forEach((key) => {
                    let indx = _.findIndex(toReturn, {
                        name: pair.name + '__' + key
                    });
                    objectFTPairs.push({
                        name: key,
                        type: toReturn[indx].type
                    });
                    toRemoveIndices.push(indx);
                });

                toReturn[index] = {
                    name: pair.name,
                    type: pair.type,
                    objectFTPairs: objectFTPairs
                };
            } else if (pair.keys && pair.keys.length && pair.type !== 'OBJECT') {
                // Find all objectFTPairs that are associated with pair and save the index to remove later
                pair.keys.forEach((key) => {
                    let indx = _.findIndex(toReturn, {
                        name: pair.name + '__' + key
                    });
                    toRemoveIndices.push(indx);
                });

                toReturn[index] = {
                    name: pair.name,
                    type: pair.type
                };
            }
        });
        return [];
    }

    /**
     * Takes an integer and makes it more easily human-readable, assuming the number's units
     * are bytes. If the number is returned in anything other than bytes (if a number >= 1000
     * is given), this method returns up to one decimal point.
     * For instance, an input of 1023 would return 1 kB , while an input of 1058 would return 1.1 kB.
     * @param size {Integer} A number, assumed to be of bytes, to translate into human-reabable form.
     * @return {String} A human-readable version of the input number, with units attached.
     */
    sizeToReadable(size: number): string {
        let nameList = ['bytes', 'kB', 'mB', 'gB', 'tB', 'pB'];
        let name = 0;
        let readableSize = size;
        while (readableSize > 1000) {
            readableSize /= 1000;
            name++;
        }
        return (Math.round(readableSize * 10) / 10) + ' ' + nameList[name];
    }
}
