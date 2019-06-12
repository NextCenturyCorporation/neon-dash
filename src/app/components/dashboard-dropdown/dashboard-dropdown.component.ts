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
import {
    Component,
    EventEmitter,
    Input,
    Output,
    ViewChild,
    ChangeDetectorRef,
    ChangeDetectionStrategy
} from '@angular/core';
import { NeonDashboardConfig, NeonDashboardChoiceConfig } from '../../model/types';
import * as _ from 'lodash';

@Component({
    selector: 'app-dashboard-dropdown',
    templateUrl: 'dashboard-dropdown.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class DashboardDropdownComponent {
    @Input() dashboards: NeonDashboardConfig;
    @Output() selectionChange = new EventEmitter();
    @ViewChild('nextDropdown') nextDropdown: DashboardDropdownComponent;

    public selectedDashboard: NeonDashboardConfig;

    constructor(public changeDetection: ChangeDetectorRef) { }

    get choices(): Record<string, NeonDashboardConfig> {
        return 'choices' in this.dashboards ? this.dashboards.choices : {};
    }

    /**
     * Returns all keys for current dashboard choices.
     *
     * @return {String[]}
     */
    getDashboardKeys() {
        return Object.keys(this.choices);
    }

    /**
     * Returns the name property associated with the dashboard choice specified.
     *
     * @arg {String} key for dashboard choice
     * @return {String}
     */
    getDashboardName(key: string) {
        return key in this.choices ? this.choices[key].name : '';
    }

    /**
     * When the selectedDashboard changes, call detectChanges and emit appropriate event.
     */
    emitSelectedDashboard() {
        this.changeDetection.detectChanges();

        // If no more choices/dropdowns exist, emit the chosen dashboard
        // otherwise, emit undefined
        if (!this.hasMoreChoices()) {
            this.selectionChange.emit(this.selectedDashboard);
        } else if (this.selectedDashboard) {
            this.selectionChange.emit();
        }
    }

    /**
     * Checks to see if there are more dashboard choices available from the selectedDashboard chosen.
     */
    hasMoreChoices(): boolean {
        const dash = this.selectedDashboard || {};
        if (!('choices' in dash)) {
            return false;
        }
        return !_.isEmpty(dash.choices) &&
            !!_.findKey(this.choices, dash);
    }

    /**
     * Propagates selection back up to parent component.
     *
     * @arg {any} $event
     */
    onChildSelectionChange($event) {
        this.selectionChange.emit($event);
    }

    /**
     * Used to select correct choices from dropdown(s) if connectOnLoad is set to true for one of the dashboards in the config.
     * 
     * @arg dashboard
     * @arg paths - paths to use to access dashboard choices
     * @arg indexToUse - index to use to access path within paths array
     * @arg dropdown
     */
    selectDashboardChoice(
        dashboard: NeonDashboardChoiceConfig,
        paths: string[],
        indexToUse: number,
        dropdown: DashboardDropdownComponent
    ) {
        let path = paths[indexToUse];
        dropdown.dashboards = dashboard;
        dropdown.selectedDashboard = dashboard.choices[path];
        dropdown.emitSelectedDashboard();

        if (this.hasMoreChoices()) {
            let newIndex = indexToUse + 1;
            this.nextDropdown.selectDashboardChoice(
                dashboard.choices[path],
                paths,
                newIndex,
                this.nextDropdown
            );
        }
    }
}
