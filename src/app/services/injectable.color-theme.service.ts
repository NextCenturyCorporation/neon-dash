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
import { Injectable } from '@angular/core';
import { ColorThemeService } from './color-theme.service';
import { Color, ColorSet } from '../models/color';
import { Theme } from './abstract.color-theme.service';

@Injectable()
export class InjectableColorThemeService {
    private _service = new ColorThemeService();

    public getColor(databaseName: string, tableName: string, fieldName: string, value: string | string[]): Color {
        return this._service.getColor(databaseName, tableName, fieldName, value);
    }

    public getColorKey(databaseName: string, tableName: string, fieldName: string): string {
        return this._service.getColorKey(databaseName, tableName, fieldName);
    }

    public getColorSet(colorKey: string): ColorSet {
        return this._service.getColorSet(colorKey);
    }

    public getTheme(): string {
        return this._service.getTheme();
    }

    public getThemes(): Theme[] {
        return this._service.getThemes();
    }

    public getThemeAccentColorHex(): string {
        return this._service.getThemeAccentColorHex();
    }

    public getThemeMainColorHex(): string {
        return this._service.getThemeMainColorHex();
    }

    public initializeColors(colors: Record<string, Record<string, Record<string, Record<string, string>>>>): void {
        this._service.initializeColors(colors);
    }

    public setTheme(id: string): void {
        this._service.setTheme(id);
    }
}
