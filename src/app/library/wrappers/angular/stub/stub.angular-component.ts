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

import { ChangeDetectionStrategy, Component, ViewEncapsulation } from '@angular/core';

// TODO Change your visualization's filenames, selector, and class name.
@Component({
    selector: 'app-next-century-angular-stub',
    templateUrl: './stub.angular-component.html',
    // TODO Add the path to your CSS/SCSS/Less file to styleUrls.
    styleUrls: [],
    encapsulation: ViewEncapsulation.Emulated,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class NextCenturyStubAngularComponent {
    public data: any[] = [];
    public filteredValues: any[] = [];

    private _listeners: ((event: any) => void)[] = [];

    constructor() {
        // TODO Update constructor as needed.
    }

    /**
     * Saves the given listener to call whenever this visualization changes its filtered values.  Invoked by a Filter Component.
     */
    public addEventListener(__name: string, listener: (event: any) => void) {
        this._listeners.push(listener);
    }

    /**
     * Changes the filtered data in this visualization to the values in the given filter data.  Invoked by a Filter Component.
     */
    public changeFilteredData(filterData: any|any[]): void {
        // Documentation on filterData:  https://github.com/NextCenturyCorporation/component-library#filter-data-array

        // TODO If the values in filterData and this.filteredValues are different, set this.filteredValues to the new values.

        // Do NOT notify this._listeners here!
    }

    /**
     * Draws the given search data as HTML elements in this visualization.  Invoked by a Search Component.
     */
    public drawData(searchData: any[]): void {
        // Documentation on searchData:  https://github.com/NextCenturyCorporation/component-library#search-data-object

        // TODO Set this.data to the searchData array, transformed as needed by this visualization.

        // Note:  You may need to add a ChangeDetectorRef to your constructor and call detectChanges() on it here.
    }

    /**
     * Creates or changes the filtered values based on the given item from the visualization's data array.  Invoked by user interaction.
     */
    public filterDataItem(item: any): void {
        // TODO Update this.filteredValues based on the given item from this.data

        // Notify the Filter Component listeners of the new filtered values to simulate a filter-output event.
        // Pass an object argument containing a "detail" object property containing a "values" array property with this.filteredValues
        this._listeners.forEach((listener: (event: any) => void) => {
            listener({
                detail: {
                    values: this.filteredValues
                }
            });
        });
    }

    /**
     * Removes the given filter-output listener from this visualization's listener list.  Invoked by a Filter Component.
     */
    public removeEventListener(__name: string, __listener: (event: any) => void): void {
        // TODO Define this function but don't worry about its behavior unless your application destroys a lot of elements.
    }
}
