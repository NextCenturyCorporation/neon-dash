import { Component, OnInit, OnDestroy, ViewEncapsulation, ChangeDetectionStrategy, ChangeDetectorRef, Injector } from '@angular/core';

@Component({
  selector: 'app-snack-bar',
  templateUrl: 'snack-bar.component.html',
  styleUrls: ['snack-bar.component.scss']
})
export class SnackBarComponent {
    public snackBarRef: any;
    public messages: {
      type: string,
      display: string[]
    }[] = [];

    public addErrors(messageType: string, newMessages: string[]) {
        //This method smells weird to me, but this is the implementation i came up with
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
            //TODO ERROR in the error reporting!
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
