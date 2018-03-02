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
export var whiteString = new Color(255, 255, 255).toRgb();
export var MapType;
(function (MapType) {
    MapType[MapType["Leaflet"] = 0] = "Leaflet";
    MapType[MapType["Cesium"] = 1] = "Cesium";
})(MapType || (MapType = {}));
// create array of name/value pairs for map types
export var MapTypePairs = Object.keys(MapType).filter(function (key) { return Number.isNaN(Number.parseInt(key)); }).map(function (name) { return ({ name: name, value: MapType[name] }); });
var MapLayer = /** @class */ (function () {
    function MapLayer() {
    }
    return MapLayer;
}());
export { MapLayer };
var BoundingBoxByDegrees = /** @class */ (function () {
    function BoundingBoxByDegrees(south, north, west, east) {
        this.south = south;
        this.north = north;
        this.west = west;
        this.east = east;
    }
    return BoundingBoxByDegrees;
}());
export { BoundingBoxByDegrees };
var MapPoint = /** @class */ (function () {
    function MapPoint(name, lat, lng, count, cssColorString, description, colorByField, colorByValue) {
        this.name = name;
        this.lat = lat;
        this.lng = lng;
        this.count = count;
        this.cssColorString = cssColorString;
        this.description = description;
        this.colorByField = colorByField;
        this.colorByValue = colorByValue;
    }
    return MapPoint;
}());
export { MapPoint };
var AbstractMap = /** @class */ (function () {
    function AbstractMap() {
        this.isDrawnFilterExact = true;
    }
    AbstractMap.prototype.initialize = function (mapContainer, optionsFromConfig, filterListener) {
        this.optionsFromConfig = optionsFromConfig;
        this.filterListener = filterListener;
        this.doCustomInitialization(mapContainer);
    };
    // Location Filter
    AbstractMap.prototype.isExact = function () { return this.isDrawnFilterExact; };
    AbstractMap.prototype.markInexact = function () {
        this.isDrawnFilterExact = false;
        this.makeSelectionInexact();
    };
    AbstractMap.prototype.sizeChanged = function () {
        // Do nothing for most cases
    };
    // utility
    AbstractMap.prototype.areBoundsSet = function () {
        return this.optionsFromConfig.west != null && this.optionsFromConfig.east != null &&
            this.optionsFromConfig.north != null && this.optionsFromConfig.south != null;
    };
    return AbstractMap;
}());
export { AbstractMap };
//# sourceMappingURL=map.type.abstract.js.map