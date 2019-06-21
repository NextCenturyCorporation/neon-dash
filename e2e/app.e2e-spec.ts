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
import { by, ElementFinder, $ } from 'protractor';

describe('neon-gtd App', () => {
    let page: NeonGtdPage;

    beforeAll(() => {
        page = new NeonGtdPage();
    });

    beforeEach(async () => {
        await page.goTo('/');
    });

    it('should load the dashboard', async () => {
        expect(await page.toolbarTitle.asText).toBeTruthy();
    });

    it('should verify counts', async () => {
        const all = await page.visualizations.all;

        expect(all.length).toBeGreaterThan(1);

        const counts = [];

        for (const vis of all) {
            const info = await page.getVizPageInfo(vis);
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

    it('should verify pagination', async () => {
        let pageable = await page.getFirstPageableViz();
        expect(pageable).toBeDefined();

        let infoA = await page.getVizPageInfo(pageable);
        await pageable.element(by.buttonText('Next')).click();
        let infoB = await page.getVizPageInfo(pageable);

        expect(infoB.start).toBeGreaterThan(infoA.end);
        expect(infoB.count).toEqual(infoA.count);
        expect(infoB.end - infoB.start).toEqual(infoA.end - infoA.start);
    });

    it('counts should vary on selecting a filter', async () => {
        let pageableA: ElementFinder = await page.getFirstCountableViz();
        expect(pageableA).toBeDefined();

        let infoA = await page.getVizPageInfo(pageableA);
        let tagA = await pageableA.getTagName();

        const legendary: ElementFinder = await page.getVizByTagName('app-aggregation');
        await page.clickLegendItem(legendary);

        let pageableB: ElementFinder = await page.getFirstCountableViz();
        expect(pageableB).toBeDefined();

        let infoB = await page.getVizPageInfo(pageableB);
        expect(tagA).toEqual(await pageableB.getTagName());
        expect(infoA.count).toBeGreaterThan(infoB.count);
    });

    it('widget should have settings', async () => {
        let pageableA: ElementFinder = await page.getFirstCountableViz();
        expect(pageableA).toBeDefined();
        const title = await page.getVizTitle(pageableA);

        await pageableA.element(by.buttonText('settings')).click();

        const settings: ElementFinder = await page.getSettingsPanel();

        expect(settings).toBeDefined();
        expect(await settings.element(by.buttonText('Cancel'))).toBeDefined();

        const applyBtn = settings.element(by.buttonText('Apply Changes'));
        expect(await applyBtn).toBeDefined();
        expect(await applyBtn.isEnabled()).toBeFalsy();

        await settings.element(by.css('input[placeholder=Title]')).sendKeys('s');  // make plural
        expect(await applyBtn.isEnabled()).toBeTruthy();
        await applyBtn.click();

        const titleAfter = await page.getVizTitle(pageableA);
        expect(titleAfter).toEqual(title + 's');
    });

    it('global search should filter values', async () => {
        let pageableA: ElementFinder = await page.getFirstCountableViz();
        expect(pageableA).toBeDefined();
        const { count } = await page.getVizPageInfo(pageableA);

        const input = $('app-simple-filter input');

        await input.sendKeys('---+++---');
        await input.submit();

        const { count: count2 } = await page.getVizPageInfo(pageableA);

        expect(count).toBeGreaterThan(0);
        expect(count2).toEqual(0)
    });
});
