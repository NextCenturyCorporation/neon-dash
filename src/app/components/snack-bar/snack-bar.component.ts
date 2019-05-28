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
import { Component } from '@angular/core';

@Component({
    selector: 'app-snack-bar',
    templateUrl: 'snack-bar.component.html',
    styleUrls: ['snack-bar.component.scss']
})
export class SnackBarComponent {
    public snackBarRef: any;
    public messages: {
        type: string;
        display: string[];
    }[] = [];

    public addErrors(messageType: string, newMessages: string[]) {
        // This method smells weird to me, but this is the implementation i came up with
        let msgObj = {
            type: messageType,
            display: newMessages
        };
        for (let e of this.messages) {
            if (e.type === messageType) {
                for (let msg of newMessages) {
                    e.display.push(msg);
                }
                return;
            }
        }
        this.messages.push(msgObj);
    }

    public close(index) {
        if (index < 0 || !this.messages || index >= this.messages.length) {
            // TODO ERROR in the error reporting!
            return;
        }
        this.messages.splice(index, 1);
        if (this.messages.length === 0) {
            this.closeAll();
        }
    }

    public closeAll() {
        if (this.snackBarRef && this.snackBarRef.dismiss) {
            this.snackBarRef.afterDismissed().subscribe(() => {
                this.messages = [];
            });
            this.snackBarRef.dismiss();
        }
    }
}
