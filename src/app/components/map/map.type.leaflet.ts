/**
 * Copyright 2021 CACI (formerly Next Century Corporation)
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
import { AbstractMap, BoundingBoxByDegrees, MapPoint } from './map.type.abstract';
import { ElementRef } from '@angular/core';
import * as L from 'leaflet';
import 'leaflet.markercluster';

let styleImport: any;

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
    private layerGroups = new Map<any, L.LayerGroup>();
    private layerControl: L.Control.Layers;
    private box: L.Rectangle;

    private hiddenPoints = new Map();

    constructor() {
        super();
        if (!styleImport) {
            for (const src of [
                'assets/leaflet/dist/leaflet.css',
                'assets/leaflet.markercluster/dist/MarkerCluster.Default.css'
            ]) {
                styleImport = document.createElement('link');
                styleImport.rel = 'stylesheet';
                styleImport.href = src;
                document.head.appendChild(styleImport);
            }
        }
    }

    doCustomInitialization(mapContainer: ElementRef) {
        let baseTileLayer = this.mapOptions.customServer && this.mapOptions.customServer.useCustomServer ?
            L.tileLayer.wms(this.mapOptions.customServer.mapUrl, {
                layers: this.mapOptions.customServer.layer,
                transparent: true,
                minZoom: this.leafletOptions.minZoom
            }) : new L.TileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                minZoom: this.leafletOptions.minZoom,
                attribution: '&copy; <a href="https://openstreetmap.org">OpenStreetMap</a> contributors'
            });
        let monochrome = new L.TileLayer(
            'https://stamen-tiles.a.ssl.fastly.net/toner-lite/{z}/{x}/{y}.png', {
                minZoom: this.leafletOptions.minZoom,
                attribution: 'Map tiles by Stamen Design, under CC BY 3.0. Data by OpenStreetMap, under ODbL.'
            }
        );
        let baseLayers = {
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

        this.map.on('boxzoomend', this.handleBoxZoom.bind(this), this);
    }

    makeSelectionInexact() {
        return this.box && this.box.setStyle({ color: this.getBoxColor() });
    }

    removeFilterBox() {
        if (this.box) {
            this.map.removeLayer(this.box);
            delete this.box;
        }
    }

    addPoints(points: MapPoint[], layer?: any, cluster?: boolean, layerTitle?: string) {
        let layerGroup = this.layerGroups.get(layer);

        // If title is updated for an existing layerGroup, we need to
        // remove and add layer back to the control layer with the new title
        if (layerGroup && layerTitle) {
            this.layerControl.removeLayer(layerGroup);
            this.layerControl.addOverlay(layerGroup, layerTitle);
        }

        if (!layerGroup) {
            layerGroup = !cluster ? new L.LayerGroup() : (L as any).markerClusterGroup({
                // Override default function to add neon-cluster class to cluster icons.
                iconCreateFunction: (clusterPoint) => new L.DivIcon({
                    html: '<div><span>' + clusterPoint.getChildCount() + '</span></div>',
                    className: 'marker-cluster neon-cluster',
                    iconSize: new L.Point(40, 40)
                }),
                maxClusterRadius: 20,
                spiderLegPolylineOptions: {
                    // TODO Use theme color (color-text-main)
                    color: '#333',
                    opacity: 1,
                    weight: 2
                }
            });
            this.layerGroups.set(layer, layerGroup);
            this.layerControl.addOverlay(layerGroup, layerTitle);
            this.map.addLayer(layerGroup);
        }

        for (let point of points) {
            let mapIsSelected = this.mapOptions.id && point.idValue; // Is point selected record
            let pointIsSelected = point.idList.includes(this.mapOptions.id); // Check if point is in list

            let circleOptions = {
                // TODO Use theme color (color-text-main)
                filters: point.filterList,
                color: '#333',
                colorByField: point.colorByField,
                colorByValue: point.colorByValue,
                fillColor: point.cssColorString,
                fillOpacity: mapIsSelected ? (pointIsSelected ? 1 : 0.1) : 0.6,
                opacity: mapIsSelected ? (pointIsSelected ? 0 : 0.2) : 1,
                radius: Math.min(Math.floor(6 * Math.pow(point.count, 0.5)), 30), // Default is 10
                stroke: !(mapIsSelected && pointIsSelected),
                weight: 1
            };

            let circle = new L.CircleMarker([point.lat, point.lng], circleOptions)/* .setRadius(6)*/;
            circle = this.addClickEventListener(circle);

            let tooltip = this.mapOptions.showPointDataOnHover ? `<span>${point.name}</span><br/><span>${point.description}</span>` : '';

            if (point.hoverPopupMap.size > 0) {
                // Build hover value and add to tooltip
                let hoverPopupString = this.createHoverPopupString(point.hoverPopupMap);
                tooltip += (tooltip ? '<br/>' : '') + (hoverPopupString !== '' ? `<span>${hoverPopupString}</span>` : '');
            }

            if (tooltip) {
                circle.bindTooltip(tooltip);
            }

            layerGroup.addLayer(circle);
        }
    }

    clearLayer(layer: any) {
        if (this.layerGroups.has(layer)) {
            this.layerGroups.get(layer).clearLayers();
        }

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

    hidePoints(layer: any, value: string) {
        let hiddenPoints: any[] = this.hiddenPoints.get(layer);
        if (!hiddenPoints) {
            hiddenPoints = [];
        }

        let layerGroup = this.layerGroups.get(layer);
        layerGroup.eachLayer((circle: any) => {
            if (circle.options.colorByValue === value) {
                hiddenPoints.push(circle);
                layerGroup.removeLayer(circle);
            }
        });

        this.hiddenPoints.set(layer, hiddenPoints);
    }

    unhidePoints(layer: any, value: string) {
        let hiddenPoints: any[] = this.hiddenPoints.get(layer);

        if (hiddenPoints) {
            let layerGroup = this.layerGroups.get(layer);

            hiddenPoints = hiddenPoints.filter((circle) => {
                let matches = circle.options.colorByValue === value;

                if (matches) {
                    layerGroup.addLayer(circle);
                }
                return !matches;
            });
        }
        this.hiddenPoints.set(layer, hiddenPoints);
    }

    unhideAllPoints(layer: any) {
        let hiddenPoints: any[] = this.hiddenPoints.get(layer);

        if (hiddenPoints) {
            let layerGroup = this.layerGroups.get(layer);
            for (let point of hiddenPoints) {
                layerGroup.addLayer(point);
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

    drawBox(bounds: L.LatLngBoundsExpression) {
        if (!this.box) {
            this.box = new L.Rectangle(bounds, { color: this.getBoxColor(), weight: 1, fill: false }).addTo(this.map);
        } else {
            this.box.setBounds(bounds);
        }
    }

    // =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
    // Filter support
    // =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
    drawBoundary(topLeft: [number, number], bottomRight: [number, number]): void {
        this.drawBox([topLeft, bottomRight]);
        setTimeout(this.map.fitBounds.bind(this.map, [topLeft, bottomRight], { animate: false }), 250);
    }

    private handleBoxZoom(event: any) {
        let bounds: L.LatLngBounds = event.boxZoomBounds;
        this.isDrawnFilterExact = true;
        this.drawBox(bounds);
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
        return circle.addEventListener('click', (event) => { // Event is a leaflet MouseEvent
            let castEvent = event as L.LeafletMouseEvent;
            // The _preSpiderfyLatlng property will be attached to clusters.
            let lat: number = castEvent.target._preSpiderfyLatlng ? castEvent.target._preSpiderfyLatlng.lat : castEvent.target._latlng.lat;
            let lng: number = castEvent.target._preSpiderfyLatlng ? castEvent.target._preSpiderfyLatlng.lng : castEvent.target._latlng.lng;
            this.filterListener.filterByMapPoint(castEvent.target.options.filters, lat, lng);
        });
    }

    private createHoverPopupString(hoverPopupMap: Map<string, number>) {
        let result = [];

        // Loop through and push values to array
        hoverPopupMap.forEach((value: number, key: string) => {
            if (value <= 1) {
                result.push(key);
            } else {
                result.push(key + '(' + value + ')');
            }
        });

        return result.join(','); // Return comma separated string
    }
}
