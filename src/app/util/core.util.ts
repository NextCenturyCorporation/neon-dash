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

export class CoreUtil {
    // eslint-disable-next-line max-len
    static URL_PATTERN = /(?:(?:https?|ftp):\/\/)?(?:\S+(?::\S*)?@)?(?:(?!10(?:\.\d{1,3}){3})(?!127(?:\.\d{1,3}){3})(?!169\.254(?:\.\d{1,3}){2})(?!192\.168(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z\x{00a1}\-\x{ffff}0-9]+-?)*[a-z\x{00a1}\-\x{ffff}0-9]+)(?:\.(?:[a-z\x{00a1}\-\x{ffff}0-9]+-?)*[a-z\x{00a1}\-\x{ffff}0-9]+)*(?:\.(?:[a-z\x{00a1}\-\x{ffff}]{2,})))(?::\d{2,5})?(?:\/[^\s]*)?/ig;

    /**
     * Add the given listener of the given event on the element with the given ID.
     */
    static addListener(listener: (event: any) => void, elementId: string, eventName: string): void {
        if (elementId && eventName) {
            const element = document.getElementById(elementId) as any;
            if (element) {
                element.addEventListener(eventName, listener);
            }
        }
    }

    static checkStringForUrl(text: string) {
        // Need to use match operator and not RegExp.exec() because use of global flag
        // eslint-disable-next-line @typescript-eslint/prefer-regexp-exec
        let matches = text.match(CoreUtil.URL_PATTERN);
        let prefixPattern = new RegExp('^(http|https|ftp)://');
        let temp;
        matches.forEach((url, index) => {
            if (!prefixPattern.test(url)) {
                temp = 'http://' + url;
                matches[index] = temp;
            }
        });
        return matches;
    }

    /**
     * Returns the object nested inside the given object using the given path string (with periods to mark each nested property).
     *
     * @arg {object} item
     * @arg {string} pathString
     * @return {object}
     */
    static deepFind(item, pathString) {
        if (item && typeof item[pathString] !== 'undefined') {
            return item[pathString];
        }
        let itemToReturn = item;
        let path = (pathString ? pathString.split('.') : []);
        for (let index = 0; index < path.length; index++) {
            if (itemToReturn instanceof Array) {
                let nestedPath = path.slice(index).join('.');
                let pieces = [];
                for (let itemInList of itemToReturn) {
                    let entryValue = CoreUtil.deepFind(itemInList, nestedPath);
                    if (entryValue instanceof Array) {
                        entryValue = CoreUtil.flatten(entryValue);
                    }
                    pieces = pieces.concat(entryValue);
                }
                return pieces;
            }
            itemToReturn = itemToReturn ? itemToReturn[path[index]] : undefined;
        }
        return itemToReturn;
    }

    /**
     * Flattens and returns the given array.
     *
     * @arg {array} input
     * @return {array}
     */
    static flatten(input) {
        return (input || []).reduce((array, element) => array.concat(Array.isArray(element) ? CoreUtil.flatten(element) : element), []);
    }

    static hasUrl(text: string) {
        let test = CoreUtil.URL_PATTERN.test(text);
        let url = [];
        let splitText = [];
        if (test) {
            url = CoreUtil.checkStringForUrl(text);
            splitText = CoreUtil.splitStringByUrl(text);
        }
        return {
            test,
            url,
            splitText
        };
    }

    /**
     * Removes the given listener of the given event on the element with the given ID.
     */
    static removeListener(listener: (event: any) => void, elementId: string, eventName: string): void {
        if (elementId && eventName) {
            const element = document.getElementById(elementId) as any;
            if (element) {
                element.removeEventListener(eventName, listener);
            }
        }
    }

    /**
     * Dynamic sorting over an array of objects
     * https://www.sitepoint.com/sort-an-array-of-objects-in-javascript/
     *
     * @arg {array} array
     * @arg {string} key
     * @arg {number} [order=1] 1 if ascending or -1 if descending
     * @return {array}
     */

    static sortArrayOfObjects(array: any[], key: string, order: number = 1) {
        return array.sort((object1, object2) => {
            if (!object1.hasOwnProperty(key) || !object2.hasOwnProperty(key)) {
                // Property doesn't exist on either object
                return 0;
            }

            const varA = (typeof object1[key] === 'string') ? object1[key].toUpperCase() : object1[key];
            const varB = (typeof object2[key] === 'string') ? object2[key].toUpperCase() : object2[key];

            let comparison = 0;
            if (varA > varB) {
                comparison = 1;
            } else if (varA < varB) {
                comparison = -1;
            }
            return comparison * order;
        });
    }

    static splitStringByUrl(text: string) {
        let textParts = text.split(CoreUtil.URL_PATTERN);
        return textParts;
    }

    /**
     * Transforms the given string or string array into a string array and returns the array.
     *
     * @arg {string|string[]} input
     * @return {string[]}
     */
    static transformToStringArray(input, delimiter: string) {
        if (Array.isArray(input)) {
            return input;
        }
        if (input !== '' && input !== null && typeof input !== 'undefined') {
            let inputValue = input.toString();
            if (inputValue.indexOf('[') === 0 && inputValue.lastIndexOf(']') === (inputValue.length - 1) &&
                typeof inputValue !== 'undefined') {
                inputValue = inputValue.substring(1, inputValue.length - 1);
            }
            return inputValue.indexOf(delimiter) > -1 ? inputValue.split(delimiter) : [inputValue];
        }
        return [];
    }

    /**
     * Removes the given listener of the given old event on the element with the given old ID and adds the listener of
     * the given new event on the element with the given new ID.
     */
    static updateListener(
        listener: (event: any) => void,
        oldElementId: string,
        oldEventName: string,
        newElementId: string,
        newEventName: string
    ): void {
        CoreUtil.removeListener(listener, oldElementId, oldEventName);
        CoreUtil.addListener(listener, newElementId, newEventName);
    }
}

