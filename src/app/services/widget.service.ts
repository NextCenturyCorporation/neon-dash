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
import { AbstractWidgetService } from './abstract.widget.service';
import { BaseNeonComponent } from '../components/base-neon-component/base-neon.component';
import { BaseLayeredNeonComponent } from '../components/base-neon-component/base-layered-neon.component';
import { Color, ColorSet } from '../color';
import { DatasetService } from './dataset.service';
import * as neon from 'neon-framework';

/**
 * A service for everything a Neon Dashboard widget needs.
 *
 * @class WidgetService
 */
@Injectable()
export class WidgetService extends AbstractWidgetService {
    public static THEME_DARK: { id: string, name: string } = {
        id: 'neon-dark',
        name: 'Dark'
    };

    public static THEME_GREEN: { id: string, name: string } = {
        id: 'neon-green',
        name: 'Green'
    };

    public static THEME_TEAL: { id: string, name: string } = {
        id: 'neon-teal',
        name: 'Teal'
    };

    // TODO Let different databases and tables in the same dataset have different color maps.
    private colorKeyToColorSet: Map<string, ColorSet> = new Map<string, ColorSet>();
    private currentThemeId: string = WidgetService.THEME_TEAL.id;
    private messenger: neon.eventing.Messenger;

    constructor(protected datasetService: DatasetService) {
        super();
        this.messenger = new neon.eventing.Messenger();
        this.messenger.subscribe(DatasetService.UPDATE_DATA_CHANNEL, this.resetColorMap);
        this.resetColorMap();
    }

    /**
     * Returns the color for the given value from an existing color set for the given database/table/field or creates a new color set if
     * none exists.
     *
     * @arg {string} databaseName
     * @arg {string} tableName
     * @arg {string} fieldName
     * @arg {string|string[]} value
     * @return {Color}
     * @override
     */
    public getColor(databaseName: string, tableName: string, fieldName: string, value: string | string[]): Color {
        let colorKey = this.getColorKey(databaseName, tableName, fieldName);
        let colorSet = this.colorKeyToColorSet.get(colorKey);
        if (!colorSet) {
            colorSet = new ColorSet(colorKey, databaseName, tableName, fieldName);
            this.colorKeyToColorSet.set(colorKey, colorSet);
        }
        let colorValue = (value instanceof Array) ? value.join() : value;
        return colorSet.getColorForValue(colorValue);
    }

    /**
     * Returns the unique key for the given database/table/field.
     *
     * @arg {string} databaseName
     * @arg {string} tableName
     * @arg {string} fieldName
     * @return {string}
     * @override
     */
    public getColorKey(databaseName: string, tableName: string, fieldName: string): string {
        return databaseName + '_' + tableName + '_' + fieldName;
    }

    /**
     * Returns the color set for the given database/table/field key.
     *
     * @arg {string} colorKey
     * @return {ColorSet}
     * @override
     */
    public getColorSet(colorKey: string): ColorSet {
        return this.colorKeyToColorSet.get(colorKey);
    }

    /**
     * Returns the ID for the current application theme.
     *
     * @return {string}
     * @override
     */
    public getTheme(): string {
        return this.currentThemeId;
    }

    /**
     * Returns the list of available application themes.
     *
     * @return {{id:string,name:string}[]}
     * @override
     */
    public getThemes(): { id: string, name: string }[] {
        return [
            // TODO THOR-853 Add dark theme
            // WidgetService.THEME_DARK,
            // TODO THOR-852 Add green theme
            // WidgetService.THEME_GREEN,
            WidgetService.THEME_TEAL
        ];
    }

    /**
     * Resets the color map and initializes it with colors of the current dashboard from the config.
     */
    public resetColorMap() {
        this.colorKeyToColorSet = new Map<string, ColorSet>();
        if (this.datasetService.getCurrentDashboardOptions()) {
            let dashboardOptions = this.datasetService.getCurrentDashboardOptions();
            let colorMaps = dashboardOptions.colorMaps || {};
            Object.keys(colorMaps).forEach((databaseName) => {
                Object.keys(colorMaps[databaseName]).forEach((tableName) => {
                    Object.keys(colorMaps[databaseName][tableName]).forEach((fieldName) => {
                        let valueToColor = new Map<string, Color>();
                        Object.keys(colorMaps[databaseName][tableName][fieldName]).forEach((valueName) => {
                            let color = colorMaps[databaseName][tableName][fieldName][valueName];
                            let isRGB = (color.indexOf('#') < 0);
                            valueToColor.set(valueName, isRGB ? Color.fromRgbString(color) : Color.fromHexString(color));
                        });
                        let colorKey = this.getColorKey(databaseName, tableName, fieldName);
                        let colorSet = new ColorSet(colorKey, databaseName, tableName, fieldName, valueToColor);
                        this.colorKeyToColorSet.set(colorKey, colorSet);
                    });
                });
            });
        }

    }

    /**
     * Sets the current application theme to the theme with the given ID.
     *
     * @arg {string} id
     * @override
     */
    public setTheme(id: string): void {
        this.currentThemeId = id;
    }
}
