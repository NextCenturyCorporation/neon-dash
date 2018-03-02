var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
/*
 * Copyright 2017 Next Century Corporation
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
 *
 */
import { Component, ElementRef, Inject, ViewChild } from '@angular/core';
import { MatSnackBar } from '@angular/material';
import { NeonGTDConfig } from './../../neon-gtd-config';
import { PropertyService } from '../../services/property.service';
import * as JSONEditor from 'jsoneditor';
import * as _ from 'lodash';
var ConfigEditorComponent = /** @class */ (function () {
    function ConfigEditorComponent(neonConfig, snackBar, propertyService) {
        this.neonConfig = neonConfig;
        this.snackBar = snackBar;
        this.propertyService = propertyService;
        this.CONFIG_PROP_NAME = 'config';
        this.DEFAULT_SNACK_BAR_DURATION = 3000;
        this.snackBar = snackBar;
        this.currentConfig = neonConfig;
        if (this.currentConfig.errors) {
            delete this.currentConfig.errors;
        }
        this.editorOptions = this.getJsonEditorOptions();
        this.editorData = _.cloneDeep(this.currentConfig);
        this.modes = [
            {
                value: 'tree',
                viewValue: 'Tree'
            },
            {
                value: 'code',
                viewValue: 'Code'
            },
            {
                value: 'form',
                viewValue: 'Form'
            },
            {
                value: 'view',
                viewValue: 'Tree (read only)'
            },
            {
                value: 'text',
                viewValue: 'Text (read only)'
            }
        ];
        // 'tree' (default), 'view', 'form', 'code', 'text
    }
    ConfigEditorComponent.prototype.ngOnInit = function () {
        // Do nothing.
    };
    ConfigEditorComponent.prototype.ngAfterViewInit = function () {
        this.editor = new JSONEditor(this.editorRef.nativeElement, this.editorOptions, this.editorData);
    };
    ConfigEditorComponent.prototype.close = function () {
        this.configEditorRef.closeAll();
    };
    ConfigEditorComponent.prototype.changeMode = function (evt) {
        this.editorOptions.mode = evt.value;
        this.editor.setMode(evt.value);
    };
    ConfigEditorComponent.prototype.save = function () {
        var _this = this;
        var text = JSON.stringify(this.editor.get());
        this.propertyService.setProperty(this.CONFIG_PROP_NAME, text, function (response) {
            _this.snackBar.open('Configuration updated successfully.  Refresh to reflect changes.', 'OK', { duration: _this.DEFAULT_SNACK_BAR_DURATION });
        }, function (response) {
            _this.snackBar.open('Error attempting to save configuration', 'OK', { duration: _this.DEFAULT_SNACK_BAR_DURATION });
            console.warn('Error attempting to save configuration:');
            console.warn(response);
        });
    };
    ConfigEditorComponent.prototype.delete = function () {
        var _this = this;
        this.propertyService.deleteProperty(this.CONFIG_PROP_NAME, function (response) {
            _this.snackBar.open('Configuration deleted from Property Service successfully.  ' +
                'Configuration will be loaded from internal \'json\' or \'yaml\' files.', 'OK', { duration: _this.DEFAULT_SNACK_BAR_DURATION });
        }, function (response) {
            _this.snackBar.open('Error attempting to delete property configuration', 'OK', { duration: _this.DEFAULT_SNACK_BAR_DURATION });
            console.warn('Error attempting to delete property configuration:');
            console.warn(response);
        });
    };
    ConfigEditorComponent.prototype.reset = function () {
        this.editorData = _.cloneDeep(this.currentConfig);
        this.editor.set(this.editorData);
    };
    ConfigEditorComponent.prototype.getJsonEditorOptions = function () {
        return {
            escapeUnicode: false,
            sortObjectKeys: false,
            history: true,
            mode: 'tree',
            search: true,
            indentation: 2
        };
    };
    __decorate([
        ViewChild('JsonEditorComponent'),
        __metadata("design:type", ElementRef)
    ], ConfigEditorComponent.prototype, "editorRef", void 0);
    ConfigEditorComponent = __decorate([
        Component({
            selector: 'app-config-editor',
            templateUrl: 'config-editor.component.html',
            styleUrls: ['config-editor.component.scss']
        }),
        __param(0, Inject('config')),
        __metadata("design:paramtypes", [NeonGTDConfig, MatSnackBar,
            PropertyService])
    ], ConfigEditorComponent);
    return ConfigEditorComponent;
}());
export { ConfigEditorComponent };
//# sourceMappingURL=config-editor.component.js.map