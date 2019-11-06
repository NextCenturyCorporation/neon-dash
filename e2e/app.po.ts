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
import { browser, ElementFinder, By, by, $$, $, until } from 'protractor';

interface PageInfo { start?: number, end?: number, count: number }

/* eslint-disable no-invalid-this */
/* eslint-disable no-await-in-loop */
export class NeonGtdPage {
    root = 'app-dashboard';
    toolbar = `${this.root} mat-toolbar`;
    toolbarTitle = `${this.toolbar} .dashboard-name`;
    visualizations = `${this.root} app-visualization-injector>*:not(div)`;

    goTo(path = '/', query: Record<string, string> = {}, fragment: string = '') {
        const url = `${path}?${new URLSearchParams(query).toString()}#${fragment}`;
        return browser.get(url);
    }

    async getVizWrapper(viz: ElementFinder): Promise<ElementFinder | undefined> {
        let out = viz.element(by.xpath('..'));
        while (out) {
            if ((await out.getTagName()) === 'app-visualization-container') {
                return out;
            }
            out = out.element(by.xpath('..'));
        }
        return undefined;
    }

    async getVizPageInfo(element: ElementFinder): Promise<PageInfo | undefined> {
        const text = await (element.element(By.css('mat-toolbar .info.text')).getText());
        const cleaned = text.replace(/,/g, '').replace(/[^0-9]+/g, ' ').trim();

        if (cleaned) {
            const parts = cleaned.split(/\s/).map((val) => parseInt(val, 10));
            if (parts.length === 1) {
                return { count: parts[0] };
            }
            const [start, end, count] = parts;
            return { start, end, count };
        }

        return undefined;
    }

    async findViz(predicate: (element: ElementFinder) => Promise<boolean> | boolean): Promise<ElementFinder | undefined> {
        for (const vis of await $$(this.visualizations)) {
            if (await predicate(vis)) {
                return vis;
            }
        }
        return undefined;
    }

    getVizByTagName(name: string): Promise<ElementFinder | undefined> {
        return this.findViz(async (el) => {
            return (await el.getTagName()) === name;
        });
    }

    getVizByTitle(title: string): Promise<ElementFinder | undefined> {
        return this.findViz(async (el) => {
            return (await this.getVizTitle(el)) === title;
        });
    }

    getFirstPageableViz(): Promise<ElementFinder | undefined> {
        return this.findViz(async (vis) => {
            const info = await this.getVizPageInfo(vis);
            return info && !!info.start;
        });
    }

    getFirstCountableViz(): Promise<ElementFinder | undefined> {
        return this.findViz(async (vis) => {
            const info = await this.getVizPageInfo(vis);
            return info && !!info.count;
        });
    }

    async clickLegendItem(vis: ElementFinder, name?: string) {
        // Grab first legend item
        await vis.element(by.css('.legend-button')).click();

        // Go global for popup
        const button = $$('.mat-menu-content button[role=menuitem]').filter(async (el) => {
            const isVisible = await el.isDisplayed();
            if (isVisible && name) {
                return (await el.getText()).includes(name);
            } else {
                return isVisible;
            }
        }).first();

        expect(await button.isDisplayed()).toBeTruthy();
        await button.click();
    }

    async getSettingsPanel(): Promise<ElementFinder> {
        return $('mat-sidenav app-gear');
    }

    getVizTitle(viz: ElementFinder) {
        return viz.element(by.css('mat-toolbar .header')).getText();
    }
}
