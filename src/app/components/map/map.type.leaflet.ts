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
import { AbstractMap, BoundingBoxByDegrees, MapPoint, whiteString } from './map.type.abstract';
import { ElementRef } from '@angular/core';
import { MapLayer } from './map.component';
import * as L from 'leaflet';

export class LeafletNeonMap extends AbstractMap {
    private leafletOptions: L.MapOptions = {
        minZoom: 2,
        zoom: 2,
        center: L.latLng([0, 0]),
        zoomControl: true,
        preferCanvas: true,
        worldCopyJump: true,
        scrollWheelZoom: false,
        tap: true,
        touchZoom: true
    };
    private map: L.Map;
    private layerGroups = new Map<MapLayer, L.LayerGroup>();
    private layerControl: L.Control.Layers;
    private box: L.Rectangle;

    private hiddenPoints = new Map();

    doCustomInitialization(mapContainer: ElementRef) {
        let baseTileLayer = this.mapOptions.customServer && this.mapOptions.customServer.useCustomServer ?
            L.tileLayer.wms(this.mapOptions.customServer.mapUrl, {
                layers: this.mapOptions.customServer.layer,
                transparent: true,
                minZoom: this.leafletOptions.minZoom
            }) : new L.TileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                minZoom: this.leafletOptions.minZoom,
                attribution: '&copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors'
            }),
            monochrome = new L.TileLayer('http://{s}.tiles.wmflabs.org/bw-mapnik/{z}/{x}/{y}.png', {
                minZoom: this.leafletOptions.minZoom,
                attribution: 'Imagery from <a href="http://giscience.uni-hd.de/">' +
                'GIScience Research Group @ University of Heidelberg</a> &mdash; Map data &copy; ' +
                '<a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            }),
            baseLayers = {
                Normal: baseTileLayer,
                MonoChrome: monochrome
            };

        this.map = new L.Map(mapContainer.nativeElement, this.leafletOptions).addLayer(baseTileLayer);
        if (this.areBoundsSet()) {
            this.map.fitBounds([
                [this.mapOptions.north, this.mapOptions.west],
                [this.mapOptions.south, this.mapOptions.east]
            ]);
        }
        this.layerControl = L.control.layers(baseLayers, {});
        this.map.addControl(this.layerControl);

        this.map.on('boxzoomend', this.handleBoxZoom, this);

    }

    makeSelectionInexact() {
        return this.box && this.box.setStyle({color: this.getBoxColor()});
    }

    removeFilterBox() {
        if (this.box) {
            this.map.removeLayer(this.box);
            delete this.box;
        }
    }

    addPoints(points: MapPoint[], layer?: MapLayer, cluster?: boolean) {
        let group = this.getGroup(layer);

        for (let point of points) {

            let circleOptions = {};
            let mapIsSelected = this.mapOptions.id && point.idValue;          //is point selected record
            let pointIsSelected = point.idList.includes(this.mapOptions.id);  //check if point is in list

            circleOptions = {
                        color: point.cssColorString === whiteString ? 'gray' : point.cssColorString,
                        fillColor: point.cssColorString,
                        colorByField: point.colorByField,
                        colorByValue: point.colorByValue,
                        weight: 1,
                        stroke: mapIsSelected && pointIsSelected ? false : true,
                        opacity: mapIsSelected ? (pointIsSelected ? 0 : .2) : 1,
                        fillOpacity: mapIsSelected ? (pointIsSelected ? 1 : .1) : .3,
                        radius: Math.min(Math.floor(6 * Math.pow(point.count, .5)), 30) // Default is 10
            };

            let circle = new L.CircleMarker([point.lat, point.lng], circleOptions)/*.setRadius(6)*/;
            circle = this.addClickEventListener(circle);
            if (this.mapOptions.hoverPopupEnabled) {

                //check if popup value has been set in the map layer config, if no use default
                if (point.hoverPopupMap.size > 0) {

                    //build hover value and add to tooltip
                    circle.bindTooltip(`<span>${this.createHoverPopupString(point.hoverPopupMap)}</span>`);
                } else {
                    circle.bindTooltip(`<span>${point.name}</span><br/><span>${point.description}</span>`);
                }
            }

            group.addLayer(circle);
        }
        //TODO: cluster layer based on cluster boolean
    }

    clearLayer(layer: MapLayer) {
        this.getGroup(layer).clearLayers();

        // Remove any hidden points too
        this.hiddenPoints.set(layer, null);
    }

    destroy() {
        this.map.remove();
    }

    // =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
    // Overrides
    // =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
    sizeChanged() {
        super.sizeChanged();
        this.map.invalidateSize();
    }

    // =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
    // Drawing support
    // =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
    private getGroup(layer: MapLayer) {
        let group = this.layerGroups.get(layer);

        if (!group) {
            group = new L.LayerGroup().addTo(this.map);
            this.layerGroups.set(layer, group);
            this.layerControl.addOverlay(group, layer.title);
        }

        return group;
    }

    hidePoints(layer: MapLayer, value: string) {
        let group = this.getGroup(layer);

        let hiddenPoints: any[] = this.hiddenPoints.get(layer);
        if (!hiddenPoints) {
            hiddenPoints = [];
        }

        group.eachLayer((circle: any) => {
            if (circle.options.colorByValue === value) {
                hiddenPoints.push(circle);
                group.removeLayer(circle);
            }
        });

        this.hiddenPoints.set(layer, hiddenPoints);
    }

    unhidePoints(layer: MapLayer, value: string) {
        let group = this.getGroup(layer);

        let hiddenPoints: any[] = this.hiddenPoints.get(layer);

        if (hiddenPoints) {
            hiddenPoints = hiddenPoints.filter((circle) => {
                let matches = circle.options.colorByField === layer.colorField.columnName &&
                        circle.options.colorByValue === value;

                if (matches) {
                    group.addLayer(circle);
                }
                return !matches;
            });
        }
        this.hiddenPoints.set(layer, hiddenPoints);
    }

    unhideAllPoints(layer: MapLayer) {
        let group = this.getGroup(layer);

        let hiddenPoints: any[] = this.hiddenPoints.get(layer);

        if (hiddenPoints) {
            for (let point of hiddenPoints) {
                group.addLayer(point);
            }
        }

        this.hiddenPoints.set(layer, null);
    }

    zoomIn() {
        this.map.zoomIn(1);
    }

    zoomOut() {
        this.map.zoomOut(1);
    }

    // =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
    // Filter support
    // =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
    private handleBoxZoom(event: any) {
        let bounds: L.LatLngBounds = event.boxZoomBounds;
        this.isDrawnFilterExact = true;
        if (!this.box) {
            this.box = new L.Rectangle(bounds, {color: this.getBoxColor(), weight: 1, fill: false}).addTo(this.map);
        } else {
            this.box.setBounds(bounds).setStyle({color: this.getBoxColor()});
        }
        this.filterListener.filterByLocation(new BoundingBoxByDegrees(
            bounds.getSouth(),
            bounds.getNorth(),
            bounds.getWest(),
            bounds.getEast()
        ));
    }

    private getBoxColor() {
        return this.isDrawnFilterExact ? 'green' : 'red';
    }

    private addClickEventListener(circle: L.CircleMarker) {
        return circle.addEventListener('click', (event) => { // event is a leaflet MouseEvent
            let castEvent = event as L.LeafletMouseEvent;
            this.filterListener.filterByMapPoint(castEvent.target._latlng.lat, castEvent.target._latlng.lng);
        });
    }

    private createHoverPopupString(hoverPopupMap: Map<string, number>) {

        let result = [];

        //loop through and push values to array
        hoverPopupMap.forEach((value: number, key: string) => {
            if (value <= 1) {
                result.push(key);
            } else {
                result.push(key + '(' + value + ')');
            }
        });

        return result.join(','); // return comma separated string

    }
}
