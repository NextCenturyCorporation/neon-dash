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
import { by, ElementFinder, $, Key, browser, $$ } from 'protractor';

describe('neon-gtd App', () => {
    let page: NeonGtdPage;

    beforeAll(() => {
        page = new NeonGtdPage();
    });

    beforeEach(async () => {
        await page.goTo('/config.yaml');
    });

    it('should load the dashboard', async () => {
        expect(await $(page.toolbarTitle).getText()).toBeTruthy();
    });

    it('should verify counts', async () => {
        const all = await $$(page.visualizations);

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
        let vizA: ElementFinder = await page.getFirstCountableViz();
        expect(vizA).toBeDefined();

        let infoA = await page.getVizPageInfo(vizA);
        let titleA = await page.getVizTitle(vizA);

        const legendary: ElementFinder = await page.getVizByTagName('app-aggregation');
        await page.clickLegendItem(legendary);

        let vizB: ElementFinder = await page.getVizByTitle(titleA);
        expect(vizB).toBeDefined();

        let infoB = await page.getVizPageInfo(vizB);
        expect(infoA.count).toBeGreaterThan(infoB.count);
    });

    it('widget should have settings', async () => {
        let vizA: ElementFinder = await page.getFirstCountableViz();
        expect(vizA).toBeDefined();
        const title = await page.getVizTitle(vizA);

        await vizA.element(by.buttonText('settings')).click();

        const settings: ElementFinder = await page.getSettingsPanel();

        expect(settings).toBeDefined();
        expect(await settings.element(by.buttonText('Cancel'))).toBeDefined();

        const applyBtn = settings.element(by.buttonText('Apply Changes'));
        expect(await applyBtn).toBeDefined();
        expect(await applyBtn.isEnabled()).toBeFalsy();

        await settings.$('input[placeholder=Title]').sendKeys('s');  // make plural
        expect(await applyBtn.isEnabled()).toBeTruthy();
        await applyBtn.click();

        const titleAfter = await page.getVizTitle(vizA);
        expect(titleAfter).toEqual(title + 's');
    });

    it('global search should filter values', async () => {
        let vizA: ElementFinder = await page.getFirstCountableViz();
        expect(vizA).toBeDefined();

        const { count } = await page.getVizPageInfo(vizA);
        const titleA = await page.getVizTitle(vizA)

        const input = $('app-simple-filter input');

        await input.sendKeys(...'---+++---'.split(''), Key.RETURN);
        await browser.waitForAngular();


        let vizB: ElementFinder = await page.getVizByTitle(titleA);
        expect(vizB).toBeDefined();

        const info = await page.getVizPageInfo(vizB);

        expect(count).toBeGreaterThan(0);
        expect(info).toBeUndefined();
    });

    it('should be able to remove visualizations', async () => {
        let vizA: ElementFinder = await page.getFirstCountableViz();
        const titleA = await page.getVizTitle(vizA);
        expect(vizA).toBeDefined();

        const parent: ElementFinder = await page.getVizWrapper(vizA) as any;
        expect(parent).toBeDefined();

        const border = await parent.$('.visualization-border>div');
        await browser.actions().mouseMove(border).perform();

        const actions = parent.$('.visualization-toolbar');

        await actions.$('button[aria-label=Close]').click();

        let vizB: ElementFinder = await page.getVizByTitle(titleA);

        expect(vizB).toBeUndefined();
    })
});
