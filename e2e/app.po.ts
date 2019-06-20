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
import { browser, by, ElementFinder, By } from 'protractor';

interface PageInfo { start?: number, end?: number, count: number }

/* eslint-disable no-invalid-this */
/* eslint-disable no-await-in-loop */
export class NeonGtdPage {
    root = By.css('app-dashboard');
    toolbar = this.root.nest('mat-toolbar');
    toolbarTitle = this.toolbar.nest('.dashboard-name');
    visualizations = By.css('app-visualization-injector>*:last-child');

    goTo(path = '/', query: Record<string, string> = {}) {
        return browser.get(`${path}?${new URLSearchParams(query).toString()}`);
    }

    async getPageInfo(element: ElementFinder): Promise<PageInfo | undefined> {
        const text = await element.element(By.css('mat-toolbar .info.text')).getText();
        const cleaned = text.replace(/[^0-9]+/g, ' ').trim();

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

    async findVisualization(predicate: (element: ElementFinder) => Promise<boolean> | boolean): Promise<ElementFinder | undefined> {
        for (const vis of await this.visualizations.all) {
            if (await predicate(vis)) {
                return vis;
            }
        }
        return undefined;
    }

    getFirstPageableViz(): Promise<ElementFinder | undefined> {
        return this.findVisualization(async (vis) => {
            const info = await this.getPageInfo(vis);
            return info && !!info.start;
        });
    }
}
