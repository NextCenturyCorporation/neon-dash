var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
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
import { AbstractMap, BoundingBoxByDegrees, whiteString } from './map.type.abstract';
import * as L from 'leaflet';
var LeafletNeonMap = /** @class */ (function (_super) {
    __extends(LeafletNeonMap, _super);
    function LeafletNeonMap() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.mapOptions = {
            minZoom: 2,
            zoom: 2,
            center: L.latLng([0, 0]),
            zoomControl: true,
            preferCanvas: true,
            worldCopyJump: true
        };
        _this.layerGroups = new Map();
        _this.hiddenPoints = new Map();
        return _this;
    }
    LeafletNeonMap.prototype.doCustomInitialization = function (mapContainer) {
        var customOption = this.optionsFromConfig.customServer, mOptions = this.mapOptions, baseTileLayer = customOption && customOption.useCustomServer ?
            L.tileLayer.wms(customOption.mapUrl, {
                layers: customOption.layer,
                transparent: true,
                minZoom: mOptions.minZoom
            }) : new L.TileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            minZoom: mOptions.minZoom,
            attribution: '&copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors'
        }), monochrome = new L.TileLayer('http://{s}.tiles.wmflabs.org/bw-mapnik/{z}/{x}/{y}.png', {
            minZoom: mOptions.minZoom,
            attribution: 'Imagery from <a href="http://giscience.uni-hd.de/">' +
                'GIScience Research Group @ University of Heidelberg</a> &mdash; Map data &copy; ' +
                '<a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        }), baseLayers = {
            Normal: baseTileLayer,
            MonoChrome: monochrome
        };
        this.map = new L.Map(mapContainer.nativeElement, this.mapOptions).addLayer(baseTileLayer);
        if (this.areBoundsSet()) {
            this.map.fitBounds([
                [this.optionsFromConfig.north, this.optionsFromConfig.west],
                [this.optionsFromConfig.south, this.optionsFromConfig.east]
            ]);
        }
        this.layerControl = L.control.layers(baseLayers, {});
        this.map.addControl(this.layerControl);
        this.map.on('boxzoomend', this.handleBoxZoom, this);
    };
    LeafletNeonMap.prototype.makeSelectionInexact = function () {
        return this.box && this.box.setStyle({ color: this.getBoxColor() });
    };
    LeafletNeonMap.prototype.removeFilterBox = function () {
        if (this.box) {
            this.map.removeLayer(this.box);
            delete this.box;
        }
    };
    LeafletNeonMap.prototype.addPoints = function (points, layer, cluster) {
        var group = this.getGroup(layer);
        for (var _i = 0, points_1 = points; _i < points_1.length; _i++) {
            var point = points_1[_i];
            var circlOptions = {
                color: point.cssColorString === whiteString ? 'gray' : point.cssColorString,
                fillColor: point.cssColorString,
                weight: 1,
                colorByField: point.colorByField,
                colorByValue: point.colorByValue,
                radius: Math.min(Math.floor(6 * Math.pow(point.count, .5)), 30) // Default is 10
            }, circle = new L.CircleMarker([point.lat, point.lng], circlOptions) /*.setRadius(6)*/;
            if (this.optionsFromConfig.hoverPopupEnabled) {
                circle.bindTooltip("<span>" + point.name + "</span><br/><span>" + point.description + "</span>");
            }
            group.addLayer(circle);
        }
        //TODO: cluster layer based on cluster boolean
    };
    LeafletNeonMap.prototype.clearLayer = function (layer) {
        this.getGroup(layer).clearLayers();
        // Remove any hidden points too
        this.hiddenPoints.set(layer, null);
    };
    LeafletNeonMap.prototype.destroy = function () {
        this.map.remove();
    };
    // =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
    // Overrides
    // =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
    LeafletNeonMap.prototype.sizeChanged = function () {
        _super.prototype.sizeChanged.call(this);
        this.map.invalidateSize();
    };
    // =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
    // Drawing support
    // =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
    LeafletNeonMap.prototype.getGroup = function (layer) {
        var group = this.layerGroups.get(layer);
        if (!group) {
            group = new L.LayerGroup().addTo(this.map);
            this.layerGroups.set(layer, group);
            this.layerControl.addOverlay(group, layer.title);
        }
        return group;
    };
    LeafletNeonMap.prototype.hidePoints = function (layer, value) {
        var group = this.getGroup(layer);
        var hiddenPoints = this.hiddenPoints.get(layer);
        if (!hiddenPoints) {
            hiddenPoints = [];
        }
        group.eachLayer(function (circle) {
            if (circle.options.colorByValue === value) {
                hiddenPoints.push(circle);
                group.removeLayer(circle);
            }
        });
        this.hiddenPoints.set(layer, hiddenPoints);
    };
    LeafletNeonMap.prototype.unhidePoints = function (layer, value) {
        var group = this.getGroup(layer);
        var hiddenPoints = this.hiddenPoints.get(layer);
        if (hiddenPoints) {
            hiddenPoints = hiddenPoints.filter(function (circle) {
                var matches = circle.options.colorByField === layer.colorField.columnName &&
                    circle.options.colorByValue === value;
                if (matches) {
                    group.addLayer(circle);
                }
                return !matches;
            });
        }
        this.hiddenPoints.set(layer, hiddenPoints);
    };
    LeafletNeonMap.prototype.unhideAllPoints = function (layer) {
        var group = this.getGroup(layer);
        var hiddenPoints = this.hiddenPoints.get(layer);
        if (hiddenPoints) {
            for (var _i = 0, hiddenPoints_1 = hiddenPoints; _i < hiddenPoints_1.length; _i++) {
                var point = hiddenPoints_1[_i];
                group.addLayer(point);
            }
        }
        this.hiddenPoints.set(layer, null);
    };
    // =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
    // Filter support
    // =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
    LeafletNeonMap.prototype.handleBoxZoom = function (event) {
        var bounds = event.boxZoomBounds;
        this.isDrawnFilterExact = true;
        if (!this.box) {
            this.box = new L.Rectangle(bounds, { color: this.getBoxColor(), weight: 1, fill: false }).addTo(this.map);
        }
        else {
            this.box.setBounds(bounds).setStyle({ color: this.getBoxColor() });
        }
        this.filterListener.filterByLocation(new BoundingBoxByDegrees(bounds.getSouth(), bounds.getNorth(), bounds.getWest(), bounds.getEast()));
    };
    LeafletNeonMap.prototype.getBoxColor = function () {
        return this.isDrawnFilterExact ? 'green' : 'red';
    };
    return LeafletNeonMap;
}(AbstractMap));
export { LeafletNeonMap };
//# sourceMappingURL=map.type.leaflet.js.map