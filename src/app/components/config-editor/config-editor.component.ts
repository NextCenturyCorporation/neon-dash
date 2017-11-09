import { Component, OnInit, AfterViewInit, OnDestroy, ViewEncapsulation, ElementRef,
  ChangeDetectionStrategy, ChangeDetectorRef, Injector, Inject, ViewChild } from '@angular/core';

import { MatSnackBar, MatDialog } from '@angular/material';
import { NeonGTDConfig } from './../../neon-gtd-config';
import { PropertyService } from '../../services/property.service';
import * as JSONEditor from 'jsoneditor';
declare var editor: any;
//import { JsonEditorComponent, JsonEditorOptions } from 'ng2-jsoneditor';
import * as _ from 'lodash';

@Component({
  selector: 'app-config-editor',
  templateUrl: 'config-editor.component.html',
  styleUrls: ['config-editor.component.scss'],
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
        private propertyService: PropertyService) {
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
        //'tree' (default), 'view', 'form', 'code', 'text
    }

    ngOnInit(): void {

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
            this.snackBar.open('Configuration updated successfully.  Refresh to reflect changes.',
              'OK', {duration: this.DEFAULT_SNACK_BAR_DURATION});
        },
        (response) => {
            this.snackBar.open('Error attempting to save configuration', 'OK', {duration: this.DEFAULT_SNACK_BAR_DURATION});
            console.warn('Error attempting to save configuration:');
            console.warn(response);
        }
      );
    }

    public delete() {
        this.propertyService.deleteProperty(this.CONFIG_PROP_NAME, (response) => {
            this.snackBar.open('Configuration deleted from Property Service successfully.  ' +
              'Configuration will be loaded from internal \'json\' or \'yaml\' files.', 'OK',
               {duration: this.DEFAULT_SNACK_BAR_DURATION});
        },
        (response) => {
            this.snackBar.open('Error attempting to delete property configuration', 'OK', {duration: this.DEFAULT_SNACK_BAR_DURATION});
            console.warn('Error attempting to delete property configuration:');
            console.warn(response);
        }
      );
    }

    public reset() {
        //this.prettyText = JSON.stringify(this.currentConfig, null, 2);
        //this.text = JSON.stringify(this.currentConfig);
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
          indentation: 2,
       };
    }
}
