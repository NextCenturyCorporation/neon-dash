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
 import * as _ from 'lodash';

@Injectable()
export class ThemesService {
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

    private currentTheme: string = ThemesService.THEME_TEAL.id;

    constructor() {
        // Do nothing.
    }

    getCurrentTheme(): string {
        return this.currentTheme;
    }

    getThemes(): { id: string, name: string }[] {
        return [
            // TODO THOR-853 Add dark theme
            // ThemesService.THEME_DARK,
            // TODO THOR-852 Add green theme
            // ThemesService.THEME_GREEN,
            ThemesService.THEME_TEAL
        ];
    }

    setCurrentTheme(id: string) {
        this.currentTheme = id;
    }
}
