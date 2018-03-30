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
    public static THEMES: any[] = [{
        id: 'neon-green-theme',
        name: 'Neon Green'
    }, {
        id: 'neon-green-dark-theme',
        name: 'Neon Green (dark)'
    }];

    private currentTheme: any = ThemesService.THEMES[0];

    constructor() {
        // Do nothing.
    }

    getThemes(): string[] {
        return ThemesService.THEMES;
    }

    getCurrentTheme() {
        return this.currentTheme;
    }

    setCurrentTheme(theme: string) {
        let index: number = _.findIndex(ThemesService.THEMES, (item) => {
            return item.id === theme;
        });

        if (index >= 0) {
            this.currentTheme = ThemesService.THEMES[index];
        } else {
            throw Error(theme + ' is not an available theme');
        }
    }
}
