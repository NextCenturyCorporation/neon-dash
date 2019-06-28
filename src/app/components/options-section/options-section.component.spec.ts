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
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { OptionsSectionComponent } from '../options-section/options-section.component';
import { OptionsSectionModule } from '../options-section/options-section.module';

import { Injector } from '@angular/core';
import { AbstractWidgetService } from '../../services/abstract.widget.service';
import { WidgetService } from '../../services/widget.service';
import { AbstractSearchService } from '../../services/abstract.search.service';
import { SearchServiceMock } from '../../../testUtils/MockServices/SearchServiceMock';
import { DashboardService } from '../../services/dashboard.service';
import { DashboardServiceMock } from '../../../testUtils/MockServices/DashboardServiceMock';
import { initializeTestBed } from '../../../testUtils/initializeTestBed';
import {
    WidgetFieldOption,
    WidgetFreeTextOption, WidgetSelectOption,
    OptionChoices
} from '../../models/widget-option';
import { WidgetOptionCollection } from '../../models/widget-option-collection';
import { DashboardState } from '../../models/dashboard-state';

describe('Component: Options-Section', () => {
    let component: OptionsSectionComponent;
    let fixture: ComponentFixture<OptionsSectionComponent>;

    initializeTestBed('options section component', {
        providers: [
            { provide: DashboardService, useClass: DashboardServiceMock },
            { provide: AbstractSearchService, useClass: SearchServiceMock },
            { provide: AbstractWidgetService, useClass: WidgetService },
            Injector
        ],
        imports: [
            OptionsSectionModule
        ]
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(OptionsSectionComponent);
        component = fixture.componentInstance;
    });

    it('getIconForOptions does return expected string', () => {
        component.collapseOptionalOptions = true;
        expect(component.getIconForOptions()).toEqual('keyboard_arrow_down');
        component.collapseOptionalOptions = false;
        expect(component.getIconForOptions()).toEqual('keyboard_arrow_up');
    });

    it('toggleOptionalOptions does update collapseOptionalOptions', () => {
        expect(component.collapseOptionalOptions).toEqual(true);
        component.toggleOptionalOptions();
        expect(component.collapseOptionalOptions).toEqual(false);
    });

    it('optionSectionResetOptions sets collapseOptionalOptions to true', () => {
        component.collapseOptionalOptions = false;
        expect(component.collapseOptionalOptions).toEqual(false);
        component.optionSectionResetOptions();
        expect(component.collapseOptionalOptions).toEqual(true);
    });

    it('getRequiredFields removes options from list and returns a new list', () => {
        let optionList: any = new WidgetOptionCollection(() => [], new DashboardState(), 'Test Title', 100);

        optionList.append(new WidgetFieldOption('field', '', true));
        optionList.append(new WidgetFreeTextOption('freeText', '', ''));
        optionList.append(new WidgetSelectOption('select', '', false, OptionChoices.NoFalseYesTrue));
        optionList.append(new WidgetSelectOption('hidden', '', false, OptionChoices.NoFalseYesTrue, true));
        expect(component.getRequiredFields(optionList)).toEqual(['field']);
    });

    it('getRequiredNonFields removes options from list and returns a new list', () => {
        let optionList: any = new WidgetOptionCollection(() => [], new DashboardState(), 'Test Title', 100);

        optionList.append(new WidgetFieldOption('field', '', true));
        optionList.append(new WidgetFreeTextOption('freeText', '', ''));
        optionList.append(new WidgetSelectOption('select', '', false, OptionChoices.NoFalseYesTrue));
        optionList.append(new WidgetSelectOption('hidden', '', false, OptionChoices.NoFalseYesTrue, true));
        expect(component.getRequiredNonFields(optionList)).toEqual(['select']);
    });

    it('getOptionalNonFields removes options from list and returns a new list', () => {
        let optionList: any = new WidgetOptionCollection(() => [], new DashboardState(), 'Test Title', 100);

        optionList.append(new WidgetFieldOption('field', '', true));
        optionList.append(new WidgetFreeTextOption('freeText', '', ''));
        optionList.append(new WidgetSelectOption('select', '', false, OptionChoices.NoFalseYesTrue));
        optionList.append(new WidgetSelectOption('hidden', '', false, OptionChoices.NoFalseYesTrue, true));
        expect(component.getOptionalNonFields(optionList)).toEqual(['freeText']);
    });

    it('getOptionalFields removes options from list and returns a new list', () => {
        let optionList: any = new WidgetOptionCollection(() => [], new DashboardState(), 'Test Title', 100);

        optionList.append(new WidgetFieldOption('field', '', true));
        optionList.append(new WidgetFreeTextOption('freeText', '', ''));
        optionList.append(new WidgetSelectOption('select', '', false, OptionChoices.NoFalseYesTrue));
        optionList.append(new WidgetSelectOption('hidden', '', false, OptionChoices.NoFalseYesTrue, true));
        expect(component.getOptionalFields(optionList)).toEqual([]);
    });
});
