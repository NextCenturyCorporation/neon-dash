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
import { AbstractMap, BoundingBoxByDegrees, MapLayer, MapPoint, whiteString } from './map.type.abstract';
import { ElementRef } from '@angular/core';
import * as L from 'leaflet';

export class LeafletNeonMap extends AbstractMap {
    private mapOptions: L.MapOptions = {
        minZoom: 2,
        zoom: 2,
        center: L.latLng([0, 0]),
        zoomControl: false,
        preferCanvas: true,
        worldCopyJump: true
    };
    private map: L.Map;
    private layerGroups = new Map<MapLayer, L.LayerGroup>();
    private layerControl: L.Control.Layers;
    private box: L.Rectangle;

    private hiddenPoints = new Map();

    doCustomInitialization(mapContainer: ElementRef) {
        let geoOption = this.optionsFromConfig.geoServer,
            mOptions = this.mapOptions,
            baseTileLayer = geoOption && geoOption.offline ?
                L.tileLayer.wms(geoOption.mapUrl, {
                    layers: geoOption.layer,
                    transparent: true,
                    minZoom: mOptions.minZoom
                }) : new L.TileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                    minZoom: mOptions.minZoom,
                    attribution: '&copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors'
                }),
            monochrome = new L.TileLayer('http://{s}.tiles.wmflabs.org/bw-mapnik/{z}/{x}/{y}.png', {
                minZoom: mOptions.minZoom,
                attribution: 'Imagery from <a href="http://giscience.uni-hd.de/">' +
                'GIScience Research Group @ University of Heidelberg</a> &mdash; Map data &copy; ' +
                '<a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            }),
            baseLayers = {
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
            let circlOptions = {
                    color: point.cssColorString === whiteString ? 'gray' : point.cssColorString,
                    fillColor: point.cssColorString,
                    weight: 1,
                    colorByField: point.colorByField,
                    colorByValue: point.colorByValue,
                    radius: Math.min(Math.floor(6 * Math.pow(point.count, .5)), 30) // Default is 10
                },
                circle = new L.CircleMarker([point.lat, point.lng], circlOptions)/*.setRadius(6)*/;

            if (this.optionsFromConfig.hoverPopupEnabled) {
                circle.bindTooltip(`<span>${point.name}</span><br/><span>${point.description}</span>`);
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

        group.eachLayer((circle: L.Layer) => {
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
}
