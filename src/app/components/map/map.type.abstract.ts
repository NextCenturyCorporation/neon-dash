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
import { Color } from '../../services/color-scheme.service';
import { FieldMetaData } from '../../dataset';
import { ElementRef } from '@angular/core';

export const whiteString = new Color(255, 255, 255).toRgb();

export enum MapType {leaflet, cesium}

// create array of name/value pairs for map types
export const MapTypePairs: {name: string, value: number}[] =
    Object.keys(MapType).filter((key) => Number.isNaN(Number.parseInt(key))).map((name) => ({name: name, value: MapType[name]}));

export class MapLayer {
    title: string;
    latitudeField: FieldMetaData;
    longitudeField: FieldMetaData;
    sizeField: FieldMetaData;
    colorField: FieldMetaData;
    dateField: FieldMetaData;
}

export interface OptionsFromConfig {
    title: string;
    database: string;
    table: string;
    latitudeField: string;
    longitudeField: string;
    sizeField: string;
    colorField: string;
    dateField: string;
    limit: number;
    unsharedFilterField: Object;
    unsharedFilterValue: string;
    layers: {
        title: string;
        database: string;
        table: string;
        latitudeField: string;
        longitudeField: string;
        sizeField: string;
        colorField: string;
        dateField: string
    }[];
    clustering: string;
    minClusterSize: number;
    clusterPixelRange: number;
    hoverSelect: {
        hoverTime: number;
    };
    hoverPopupEnabled: boolean;
    west: number;
    east: number;
    north: number;
    south: number;
    mapType: MapType | string;
    geoServer: {
        useGeoserver: boolean,
        mapUrl: string,
        layer: string
    };
    singleColor: boolean;
}

export class BoundingBoxByDegrees {
    constructor(
        public south: number,
        public north: number,
        public west: number,
        public east: number
    ) {}
}

export class MapPoint {
    constructor(
        public name: string,
        public lat: number,
        public lng: number,
        public count: number,
        public cssColorString: string,
        public description: string
    ) {}
}

export interface FilterListener {
    filterByLocation(box: BoundingBoxByDegrees);
}

export abstract class AbstractMap {
    protected optionsFromConfig: OptionsFromConfig;
    protected filterListener: FilterListener;
    protected isDrawnFilterExact = true;

    initialize(mapContainer: ElementRef, optionsFromConfig: OptionsFromConfig, filterListener: FilterListener) {
        this.optionsFromConfig = optionsFromConfig;
        this.filterListener = filterListener;
        this.doCustomInitialization(mapContainer);
    }

    abstract doCustomInitialization(mapContainer: ElementRef);

    // Location Filter
    isExact() { return this.isDrawnFilterExact; }
    markInexact() {
        this.isDrawnFilterExact = false;
        this.makeSelectionInexact();
    }
    abstract makeSelectionInexact();
    abstract removeFilterBox();

    // Drawing
    abstract addPoints(points: MapPoint[], layer?: MapLayer, cluster?: boolean);
    abstract clearLayer(layer: MapLayer);

    sizeChanged() {
        // Do nothing for most cases
    }

    abstract destroy();

    // utility
    areBoundsSet() {
        return this.optionsFromConfig.west != null && this.optionsFromConfig.east != null &&
            this.optionsFromConfig.north != null && this.optionsFromConfig.south != null;
    }
}
