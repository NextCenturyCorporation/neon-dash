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
import { ElementRef } from '@angular/core';

export const whiteString = 'rgb(255,255,255)';

export enum MapType { Leaflet }

// Create array of name/value pairs for map types
export const MapTypePairs: { name: string, value: number }[] =
    Object.keys(MapType).filter((key) => Number.isNaN(Number.parseInt(key, 10))).map((name) => ({ name: name, value: MapType[name] }));

export class BoundingBoxByDegrees {
    constructor(
        public south: number,
        public north: number,
        public west: number,
        public east: number
    ) { }
}

export class MapPoint {
    constructor(
        public idValue: string,
        public idList: string[],
        public filterList: Map<string, any>[],
        public filterFields: Map<string, any>,
        public name: string,
        public lat: number,
        public lng: number,
        public count: number,
        public cssColorString: string,
        public description: string,
        public colorByField: string,
        public colorByValue: string,
        public hoverPopupMap: Map<string, number>
    ) { }
}

export interface FilterListener {
    filterByLocation(box: BoundingBoxByDegrees);
    filterByMapPoint(filters: Map<string, any>[], lat: number, lng: number);
}

export abstract class AbstractMap {
    protected mapOptions: any;
    protected filterListener: FilterListener;
    protected isDrawnFilterExact = true;

    initialize(mapContainer: ElementRef, mapOptions: any, filterListener: FilterListener) {
        this.mapOptions = mapOptions;
        this.filterListener = filterListener;
        this.doCustomInitialization(mapContainer);
    }

    abstract doCustomInitialization(mapContainer: ElementRef);

    // Location Filter
    isExact() {
        return this.isDrawnFilterExact;
    }

    markInexact() {
        this.isDrawnFilterExact = false;
        this.makeSelectionInexact();
    }

    abstract makeSelectionInexact();
    abstract removeFilterBox();

    // Drawing
    abstract addPoints(points: MapPoint[], layer?: any, cluster?: boolean, layerTitle?: string);
    abstract clearLayer(layer: any);

    sizeChanged() {
        // Do nothing for most cases
    }

    /**
     * Hide points from the map by layer and value
     * @param layer the layer of the points to hide
     * @param value the value to hide
     */
    abstract hidePoints(layer: any, value: string);

    /**
     * Unhide points from the map by layer and value
     * @param layer the layer of the points to unhide
     * @param value the value to unhide
     */
    abstract unhidePoints(layer: any, value: string);

    /**
     * Unhide all points for a layer
     * @param layer the layer
     */
    abstract unhideAllPoints(layer: any);

    abstract destroy();

    abstract zoomOut();
    abstract zoomIn();
    abstract drawBoundary(topLeft: [number, number], bottomRight: [number, number]): void;

    // Utility
    areBoundsSet() {
        return typeof this.mapOptions.west !== 'undefined' && typeof this.mapOptions.east !== 'undefined' &&
            typeof this.mapOptions.north !== 'undefined' && typeof this.mapOptions.south !== 'undefined' &&
            this.mapOptions.west !== null && this.mapOptions.east !== null &&
            this.mapOptions.north !== null && this.mapOptions.south !== null;
    }
}
