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
import { Inject, Injectable } from '@angular/core';

import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { SimpleFilter } from '../dataset';
import * as neon from 'neon-framework';

class ActivePanel {
    public type: string;
    public title: string;
}

@Injectable()
export class RightPanelService {
    private activePanel: ActivePanel;
    //right panel
    public showAboutNeon: boolean = false;
    public showAddVis: boolean = false;
    public showDashboardLayouts: boolean = false;
    public showGear: boolean = false;
    public showSaveState: boolean = false;
    public showSettings: boolean = false;
    //Toolbar
    public showSimpleSearch: boolean = false;
    public showVisShortcut: boolean = true;

    constructor() {
        this.activePanel = new ActivePanel();
    }

    changeActivePanel(type: string, title: string) {
        this.resetPanel();
        this.activePanel.type = type;
        this.activePanel.title = title;
    }

    resetPanel() {
        this.showAboutNeon = false;
        this.showAddVis = false;
        this.showDashboardLayouts = false;
        this.showGear = false;
        this.showSaveState = false;
        this.showSettings = false;
    }
}
