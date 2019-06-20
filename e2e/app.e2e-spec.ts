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

/* eslint-disable no-await-in-loop */
import { NeonGtdPage } from './app.po';
import './util';
import { ElementFinder, by, browser } from 'protractor';

describe('neon-gtd App', () => {
    let page: NeonGtdPage;

    beforeAll(() => {
        page = new NeonGtdPage();
        page.goTo('/');
    });

    beforeEach(() => {
        browser.navigate().to('/');
    });

    it('should load the dashboard', async() => {
        expect(await page.toolbarTitle.asText).toBeTruthy();
    });

    it('should verify counts', async() => {
        const all = await page.visualizations.all;

        expect(all.length).toBeGreaterThan(1);

        const counts = [];

        for (const vis of all) {
            const info = await page.getPageInfo(vis);
            if (info && info.start) {
                counts.push(info.count);
            }
        }

        const [first, ...remainder] = counts;

        expect(counts.length).toBeGreaterThan(1);

        for (const count of remainder) {
            expect(first).toEqual(count);
        }
    });

    it('should verify pagination', async() => {
        let pageable: ElementFinder;

        for (const vis of await page.visualizations.all) {
            const info = await page.getPageInfo(vis);

            if (info.start) { // We have a pageable
                pageable = vis;
                break;
            }
        }
        expect(pageable).toBeDefined();

        let infoA = await page.getPageInfo(pageable);
        await pageable.element(by.buttonText('Next')).click();
        let infoB = await page.getPageInfo(pageable);

        expect(infoB.start).toBeGreaterThan(infoA.end);
        expect(infoB.count).toEqual(infoA.count);
        expect(infoB.end - infoB.start).toEqual(infoA.end - infoA.start);
    });

    it('counts should vary on selecting a filter', async() => {
        let pageable: ElementFinder;

        for (const vis of await page.visualizations.all) {
            const info = await page.getPageInfo(vis);

            if (info.start) { // We have a pageable
                pageable = vis;
                break;
            }
        }
        expect(pageable).toBeDefined();

        let infoA = await page.getPageInfo(pageable);

        const query = [['.ldc_uyg_jul_18.ui_out.topic', '=', 'Search﹒and﹒Rescue', 'or']];
        browser.navigate().to(`/?filter=${JSON.stringify(query)}`);

        for (const vis of await page.visualizations.all) {
            const info = await page.getPageInfo(vis);

            if (info.start) { // We have a pageable
                pageable = vis;
                break;
            }
        }
        expect(pageable).toBeDefined();

        let infoB = await page.getPageInfo(pageable);

        expect(infoA.count).toBeGreaterThan(infoB.count);
    });
});
