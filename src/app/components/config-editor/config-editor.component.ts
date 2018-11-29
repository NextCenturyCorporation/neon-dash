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
import { Component, OnInit, AfterViewInit, OnDestroy, ViewEncapsulation, ElementRef,
  ChangeDetectionStrategy, ChangeDetectorRef, Injector, Inject, ViewChild } from '@angular/core';

import { MatSnackBar, MatDialog } from '@angular/material';
import { NeonGTDConfig } from './../../neon-gtd-config';

import { AbstractWidgetService } from '../../services/abstract.widget.service';
import { PropertyService } from '../../services/property.service';

import * as JSONEditor from 'jsoneditor';
declare var editor: any;
import * as _ from 'lodash';
import { windowCount } from 'rxjs/operator/windowCount';

@Component({
  selector: 'app-config-editor',
  templateUrl: 'config-editor.component.html',
  styleUrls: ['config-editor.component.scss']
})
export class ConfigEditorComponent implements AfterViewInit, OnInit {
    @ViewChild('JsonEditorComponent') editorRef: ElementRef;
    public CONFIG_PROP_NAME: string = 'config';
    public configEditorRef: any;
    public currentConfig: NeonGTDConfig;
    public editorData: NeonGTDConfig;
    public editorOptions: any;
    public DEFAULT_SNACK_BAR_DURATION: number = 3000;
    public modes: any[];
    public editor: any;

    constructor(@Inject('config') private neonConfig: NeonGTDConfig, public snackBar: MatSnackBar,
        protected propertyService: PropertyService, protected widgetService: AbstractWidgetService) {
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

    ngOnInit(): void {
        // Do nothing.
    }

    ngAfterViewInit() {
        this.editor = new JSONEditor(this.editorRef.nativeElement, this.editorOptions, this.editorData);
    }

    public close() {
        this.configEditorRef.closeAll();
    }

    public changeMode(evt) {
        this.editorOptions.mode = evt.value;
        this.editor.setMode(evt.value);
    }

    public save() {
        let text = JSON.stringify(this.editor.get());
        this.propertyService.setProperty(this.CONFIG_PROP_NAME, text,
        (response) => {
            this.snackBar.open('Configuration updated successfully.  Refresh to reflect changes.', 'OK', {
                panelClass: this.widgetService.getTheme(),
                duration: this.DEFAULT_SNACK_BAR_DURATION
            });
        },
        (response) => {
            this.snackBar.open('Error attempting to save configuration', 'OK', {
                panelClass: this.widgetService.getTheme(),
                duration: this.DEFAULT_SNACK_BAR_DURATION
            });
            console.warn('Error attempting to save configuration:');
            console.warn(response);
        }
      );
    }

    public delete() {
        if (window.confirm('Are you sure you want to delete this?')) {
            this.propertyService.deleteProperty(this.CONFIG_PROP_NAME, (response) => {
                this.snackBar.open('Configuration deleted from Property Service successfully.  ' +
                    'Configuration will be loaded from internal \'json\' or \'yaml\' files.', 'OK', {
                        panelClass: this.widgetService.getTheme(),
                        duration: this.DEFAULT_SNACK_BAR_DURATION
                    }
                );
            },
            (response) => {
                this.snackBar.open('Error attempting to delete property configuration', 'OK', {
                    panelClass: this.widgetService.getTheme(),
                    duration: this.DEFAULT_SNACK_BAR_DURATION
                });
                console.warn('Error attempting to delete property configuration:');
                console.warn(response);
            });
        }
    }

    public reset() {
        this.editorData = _.cloneDeep(this.currentConfig);
        this.editor.set(this.editorData);
    }

    public getJsonEditorOptions() {
       return {
          escapeUnicode: false,
          sortObjectKeys: false,
          history: true,
          mode: 'tree',
          search: true,
          indentation: 2
       };
    }
}
