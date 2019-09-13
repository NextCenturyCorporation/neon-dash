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

import { ColorOptions, SizeOptions, TextCloud } from '../components/text-cloud/text-cloud-namespace';
import { CoreUtil } from '../util/core.util';
import { NextCenturyElement } from './next-century.core.element.webcomponent';

export class NextCenturyTextCloud extends NextCenturyElement {
    private _data: any[] = [];
    private _filtered: any[] = [];
    private _shadowRoot: ShadowRoot;
    private _textCloudObject;
    private _visElement: HTMLElement;

    static get observedAttributes(): string[] {
        return [
            'color-accent',
            'color-text',
            'enable-counts',
            'enable-paragraphs',
            'aggregation-field',
            'aggregation-label',
            'text-field'
        ];
    }

    constructor() {
        super();
        const template = document.createElement('template');
        template.innerHTML = `
            <style>
                :host .text-cloud {
                    display: inline-block;
                    overflow-wrap: break-word;
                }

                :host .text-cloud .text {
                    cursor: pointer;
                    display: inline-block;
                    padding: 5px;
                }

                :host .text-cloud .text:hover {
                    color: var(--color-data-item-selectable-dark, dimgrey) !important;
                    text-decoration: none;
                }

                :host .text-cloud .filtered:not(:hover) {
                    color: var(--color-data-item-selectable-dark, dimgrey) !important;
                }

                :host .text-cloud .paragraphs {
                    display: block;
                }

                :host([hidden]) {
                    display: none;
                }
            </style>
        `;

        this._shadowRoot = this.attachShadow({
            mode: 'open'
        });
        this._shadowRoot.appendChild(template.content.cloneNode(true));
        this._visElement = document.createElement('div');
        this._shadowRoot.appendChild(this._visElement);
        this._createTextCloudVisualization();
    }

    public attributeChangedCallback(name: string, oldValue: any, newValue: any): void {
        super.attributeChangedCallback(name, oldValue, newValue);

        if (name === 'color-accent' || name === 'color-text') {
            this._createTextCloudVisualization();
        } else {
            this._redrawData();
        }
    }

    /**
     * Changes the filtered text to the given text or array of text and redraws the visualization using the existing data.
     */
    public changeFilteredText(text: any|any[]): void {
        // If text is "a", transform to ["a"]; if text is ["a", "b"], keep it; if text is [["a"], ["b", "c"]], transform to ["a", "b", "c"]
        const filtered: any[] = !Array.isArray(text) ? [text] : ((!text.length || !Array.isArray(text[0])) ? text :
            text.reduce((list, part) => list.concat(part), []));
        if (this._filtered.length !== filtered.length || this._filtered.some((value, index) => value !== filtered[index])) {
            this._filtered = filtered;
            this._redrawData();
        }
    }

    /**
     * Draws the visualization using the given data array.
     */
    public drawData(data: any[]): void {
        const aggregationField = this.getAttribute('aggregation-field');
        const textField = this.getAttribute('text-field');

        this._data = !textField ? [] : data.map((item) => ({
            key: CoreUtil.deepFind(item, textField),
            keyTranslated: CoreUtil.deepFind(item, textField),
            selected: item.filtered,
            value: aggregationField ? CoreUtil.deepFind(item, aggregationField) : 1
        })).filter((item) => !!item.key);

        this._redrawData();
    }

    /**
     * Toggles the filtered status of the given text cloud data item.
     */
    public toggleFilter(item: any): void {
        const index = this._filtered.indexOf(item.key);
        if (index >= 0) {
            this._filtered.splice(index, 1);
            item.selected = false;
        } else {
            this._filtered.push(item.key);
            item.selected = true;
        }

        this._redrawData();

        this.dispatchEvent(new CustomEvent('filter', {
            detail: {
                values: this._filtered
            }
        }));
    }

    private _createTextCloudVisualization(): void {
        const accentColorHex = this.getAttribute('color-accent') || '#0000FF';
        const textColorHex = this.getAttribute('color-text') || '#111111';
        this._textCloudObject = new TextCloud(new SizeOptions(80, 140, '%'), new ColorOptions(textColorHex, accentColorHex));
        this._redrawData();
    }

    private _redrawData(): void {
        const aggregationLabel = this.getAttribute('aggregation-label');
        const showCounts = !!this.getAttribute('enable-counts');
        const showParagraphs = !!this.getAttribute('enable-paragraphs');

        let newElement = document.createElement('div');
        newElement.className = 'text-cloud';
        this._shadowRoot.replaceChild(newElement, this._visElement);
        this._visElement = newElement;

        const textCloudData = this._textCloudObject.createTextCloud(this._data);
        textCloudData.forEach((item) => {
            let elementClasses = ['text'].concat(item.selected ? 'filtered' : []).concat(showParagraphs ? 'paragraphs' : []);

            let itemElement = document.createElement('div');
            itemElement.className = elementClasses.join(' ');
            itemElement.onclick = () => {
                this.toggleFilter(item);
            };
            itemElement.style.color = item.color;
            itemElement.style['font-size'] = item.fontSize;
            itemElement.title = (aggregationLabel ? (aggregationLabel + ': ') : '') + item.value;

            let termElement = document.createElement('span');
            termElement.innerHTML = item.key;
            itemElement.appendChild(termElement);

            if (showCounts) {
                let countsElement = document.createElement('span');
                countsElement.innerHTML = item.value;
                itemElement.appendChild(countsElement);
            }

            this._visElement.appendChild(itemElement);
        });
    }
}

window.customElements.define('next-century-text-cloud', NextCenturyTextCloud);
