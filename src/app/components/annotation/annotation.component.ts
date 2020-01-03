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
import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';

@Component({
    selector: 'app-annotation',
    templateUrl: 'annotation.component.html',
    styleUrls: ['annotation.component.scss']
})

export class AnnotationComponent {
    public confirmDialogRef: any;
    public confirmMessage: string = '';
    public target: string;
    public title: string;
    public confirmText: string = 'Confirm';
    public cancelText: string = 'Cancel';

    constructor(
        @Inject(MAT_DIALOG_DATA) public data: any,
        public dialogRef: MatDialogRef<AnnotationComponent>
    ) {
        this.target = data.target;
        this.title = data.title;
        this.confirmMessage = data.confirmMessage;
        this.confirmText = data.confirmText || this.confirmText;
        this.cancelText = data.cancelText || this.cancelText;
    }
}
