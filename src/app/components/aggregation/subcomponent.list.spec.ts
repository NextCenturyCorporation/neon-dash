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

'use strict';

import { ListSubcomponent } from './subcomponent.list';
import { AggregationSubcomponentListener } from './subcomponent.aggregation.abstract';
import { ElementRef } from '@angular/core';

class TestAggregationSubcomponentListener implements AggregationSubcomponentListener {
    getHiddenCanvas(): ElementRef {
        return null;
    }

    subcomponentRequestsDeselect() {
        // Do nothing.
    }

    subcomponentRequestsFilter(__group: string, __value: any, __doNotReplace?: boolean) {
        // Do nothing.
    }

    subcomponentRequestsFilterOnBounds(__beginX: any, __beginY: any, __endX: any, __endY: any, __doNotReplace?: boolean) {
        // Do nothing.
    }

    subcomponentRequestsFilterOnDomain(__beginX: any, __endX: any, __doNotReplace?: boolean) {
        // Do nothing.
    }

    subcomponentRequestsRedraw(__event?) {
        // Do nothing.
    }

    subcomponentRequestsSelect(__x: number, __y: number, __width: number, __height: number) {
        // Do nothing.
    }
}

class TestListSubcomponent extends ListSubcomponent {
    public fireClickEvent(event) {
        this.handleClickEvent(event);
    }

    public getSelectedData() {
        return this.selectedData;
    }

    public setSelectedData(selectedData) {
        this.selectedData = selectedData;
    }
}

describe('ListSubcomponent', () => {
    let listener;
    let subcomponent;

    beforeEach(() => {
        listener = new TestAggregationSubcomponentListener();
        subcomponent = new TestListSubcomponent({}, listener, null);
    });

    it('click does add to selectedData', () => {
        let spy1 = spyOn(listener, 'subcomponentRequestsFilter');
        let spy2 = spyOn(subcomponent, 'select');

        let isClassSet = false;
        let mockTarget = {
            getAttribute: (attribute) => attribute === 'class' ? 'testClass' : (attribute === 'group' ? 'testGroup' : 'testValue'),
            setAttribute: (attribute, value) => {
                expect(attribute).toEqual('class');
                expect(value).toEqual('testClass active');
                isClassSet = true;
            }
        };

        subcomponent.fireClickEvent({
            currentTarget: mockTarget
        });

        expect(isClassSet).toEqual(true);
        expect(spy1.calls.count()).toEqual(1);
        expect(spy1.calls.argsFor(0)).toEqual(['testGroup', 'testValue', false]);
        expect(spy2.calls.count()).toEqual(1);
        expect(subcomponent.getSelectedData()).toEqual([{
            element: mockTarget,
            group: 'testGroup',
            value: 'testValue'
        }]);
    });

    it('click does replace selectedData', () => {
        let spy1 = spyOn(listener, 'subcomponentRequestsFilter');
        let spy2 = spyOn(subcomponent, 'select');

        subcomponent.setSelectedData([{
            element: {},
            group: 'testOtherGroup',
            value: 'testOtherValue'
        }]);

        let isClassSet = false;
        let mockTarget = {
            getAttribute: (attribute) => attribute === 'class' ? 'testClass' : (attribute === 'group' ? 'testGroup' : 'testValue'),
            setAttribute: (attribute, value) => {
                expect(attribute).toEqual('class');
                expect(value).toEqual('testClass active');
                isClassSet = true;
            }
        };

        subcomponent.fireClickEvent({
            currentTarget: mockTarget
        });

        expect(isClassSet).toEqual(true);
        expect(spy1.calls.count()).toEqual(1);
        expect(spy1.calls.argsFor(0)).toEqual(['testGroup', 'testValue', false]);
        expect(spy2.calls.count()).toEqual(1);
        expect(subcomponent.getSelectedData()).toEqual([{
            element: mockTarget,
            group: 'testGroup',
            value: 'testValue'
        }]);
    });

    it('click does not replace selectedData if ctrlKey=true', () => {
        let spy1 = spyOn(listener, 'subcomponentRequestsFilter');
        let spy2 = spyOn(subcomponent, 'select');

        subcomponent.setSelectedData([{
            element: {},
            group: 'testOtherGroup',
            value: 'testOtherValue'
        }]);

        let isClassSet = false;
        let mockTarget = {
            getAttribute: (attribute) => attribute === 'class' ? 'testClass' : (attribute === 'group' ? 'testGroup' : 'testValue'),
            setAttribute: (attribute, value) => {
                expect(attribute).toEqual('class');
                expect(value).toEqual('testClass active');
                isClassSet = true;
            }
        };

        subcomponent.fireClickEvent({
            ctrlKey: true,
            currentTarget: mockTarget
        });

        expect(isClassSet).toEqual(true);
        expect(spy1.calls.count()).toEqual(1);
        expect(spy1.calls.argsFor(0)).toEqual(['testGroup', 'testValue', true]);
        expect(spy2.calls.count()).toEqual(0);
        expect(subcomponent.getSelectedData()).toEqual([{
            element: {},
            group: 'testOtherGroup',
            value: 'testOtherValue'
        }, {
            element: mockTarget,
            group: 'testGroup',
            value: 'testValue'
        }]);
    });

    it('click does not replace selectedData if metaKey=true', () => {
        let spy1 = spyOn(listener, 'subcomponentRequestsFilter');
        let spy2 = spyOn(subcomponent, 'select');

        subcomponent.setSelectedData([{
            element: {},
            group: 'testOtherGroup',
            value: 'testOtherValue'
        }]);

        let isClassSet = false;
        let mockTarget = {
            getAttribute: (attribute) => attribute === 'class' ? 'testClass' : (attribute === 'group' ? 'testGroup' : 'testValue'),
            setAttribute: (attribute, value) => {
                expect(attribute).toEqual('class');
                expect(value).toEqual('testClass active');
                isClassSet = true;
            }
        };

        subcomponent.fireClickEvent({
            metaKey: true,
            currentTarget: mockTarget
        });

        expect(isClassSet).toEqual(true);
        expect(spy1.calls.count()).toEqual(1);
        expect(spy1.calls.argsFor(0)).toEqual(['testGroup', 'testValue', true]);
        expect(spy2.calls.count()).toEqual(0);
        expect(subcomponent.getSelectedData()).toEqual([{
            element: {},
            group: 'testOtherGroup',
            value: 'testOtherValue'
        }, {
            element: mockTarget,
            group: 'testGroup',
            value: 'testValue'
        }]);
    });

    it('click does not add existing item to selectedData', () => {
        let spy1 = spyOn(listener, 'subcomponentRequestsFilter');
        let spy2 = spyOn(subcomponent, 'select');

        subcomponent.setSelectedData([{
            element: {},
            group: 'testGroup',
            value: 'testValue'
        }]);

        let isClassSet = false;
        let mockTarget = {
            getAttribute: (attribute) => attribute === 'class' ? 'testClass' : (attribute === 'group' ? 'testGroup' : 'testValue'),
            setAttribute: (attribute, value) => {
                expect(attribute).toEqual('class');
                expect(value).toEqual('testClass active');
                isClassSet = true;
            }
        };

        subcomponent.fireClickEvent({
            currentTarget: mockTarget
        });

        expect(isClassSet).toEqual(false);
        expect(spy1.calls.count()).toEqual(0);
        expect(spy2.calls.count()).toEqual(0);
        expect(subcomponent.getSelectedData()).toEqual([{
            element: {},
            group: 'testGroup',
            value: 'testValue'
        }]);
    });

    /* TODO
    it('select with no items does deselect and remove all selectedData', () => {
        let isClassSet1 = false;
        let isClassSet2 = false;

        let item1 = {
            element: {
                getAttribute: (attribute) => attribute === 'class' ? 'testClassA active testClassB' : '',
                setAttribute: (attribute, value) => {
                    expect(attribute).toEqual('class');
                    expect(value).toEqual('testClassA testClassB');
                    isClassSet1 = true;
                }
            },
            value: 'testValue1'
        };

        let item2 = {
            element: {
                getAttribute: (attribute) => attribute === 'class' ? 'testClassC active testClassD' : '',
                setAttribute: (attribute, value) => {
                    expect(attribute).toEqual('class');
                    expect(value).toEqual('testClassC testClassD');
                    isClassSet2 = true;
                }
            },
            value: 'testValue2'
        };

        subcomponent.setSelectedData([item1, item2]);

        subcomponent.select([]);

        expect(isClassSet1).toEqual(true);
        expect(isClassSet2).toEqual(true);
        expect(subcomponent.getSelectedData()).toEqual([]);
    });

    it('select with a single item does deselect and remove the item', () => {
        let isClassSet1 = false;
        let isClassSet2 = false;

        let item1 = {
            element: {
                getAttribute: (attribute) => attribute === 'class' ? 'testClassA active testClassB' : '',
                setAttribute: (attribute, value) => {
                    expect(attribute).toEqual('class');
                    expect(value).toEqual('testClassA testClassB');
                    isClassSet1 = true;
                }
            },
            value: 'testValue1'
        };

        let item2 = {
            element: {
                getAttribute: (attribute) => attribute === 'class' ? 'testClassC active testClassD' : '',
                setAttribute: (attribute, value) => {
                    expect(attribute).toEqual('class');
                    expect(value).toEqual('testClassC testClassD');
                    isClassSet2 = true;
                }
            },
            value: 'testValue2'
        };

        subcomponent.setSelectedData([item1, item2]);

        subcomponent.select('testValue1');

        expect(isClassSet1).toEqual(false);
        expect(isClassSet2).toEqual(true);
        expect(subcomponent.getSelectedData()).toEqual([item1]);
    });
    */

    it('getMinimumDimensions does return expected object', () => {
        expect(subcomponent.getMinimumDimensions()).toEqual({
            height: undefined,
            width: undefined
        });
    });
});
