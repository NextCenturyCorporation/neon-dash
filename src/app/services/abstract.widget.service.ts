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
import { BaseNeonComponent } from '../components/base-neon-component/base-neon.component';
import { BaseLayeredNeonComponent } from '../components/base-neon-component/base-layered-neon.component';
import { Color, ColorSet } from '../color';

/**
 * A service for everything a Neon widget needs.
 *
 * @class AbstractWidgetService
 * @abstract
 */
@Injectable()
export abstract class AbstractWidgetService {
    /**
     * Returns the color for the given value from an existing color set for the given database/table/field or creates a new color set if
     * none exists.
     *
     * @arg {string} databaseName
     * @arg {string} tableName
     * @arg {string} fieldName
     * @arg {string|string[]} value
     * @return {Color}
     * @abstract
     */
    public abstract getColor(databaseName: string, tableName: string, fieldName: string, value: string | string[]): Color;

    /**
     * Returns the unique key for the given database/table/field.
     *
     * @arg {string} databaseName
     * @arg {string} tableName
     * @arg {string} fieldName
     * @return {string}
     * @abstract
     */
    public abstract getColorKey(databaseName: string, tableName: string, fieldName: string): string;

    /**
     * Returns the color set for the given database/table/field key.
     *
     * @arg {string} colorKey
     * @return {ColorSet}
     * @abstract
     */
    public abstract getColorSet(colorKey: string): ColorSet;

    /**
     * Returns the ID for the current application theme.
     *
     * @return {string}
     * @abstract
     */
    public abstract getTheme(): string;

    /**
     * Returns the list of available application themes.
     *
     * @return {{id:string,name:string}[]}
     * @abstract
     */
    public abstract getThemes(): { id: string, name: string }[];

    /**
     * Sets the current application theme to the theme with the given ID.
     *
     * @arg {string} id
     * @abstract
     */
    public abstract setTheme(id: string): void;
}
