import { Component, OnInit, ViewEncapsulation, ChangeDetectionStrategy, Injector } from '@angular/core';

@Component({
    selector: 'app-text-cloud',
    templateUrl: './text-cloud.component.html',
    styleUrls: ['./text-cloud.component.scss'],
    encapsulation: ViewEncapsulation.Emulated,
    changeDetection: ChangeDetectionStrategy.Default
})
export class TextCloudComponent implements OnInit {

    private title: string;
    private database: string;
    private table: string;
    private dataField: string;

    constructor(private injector: Injector) {
        this.title = this.injector.get('title', null);
        this.database = this.injector.get('database', null);
        this.table = this.injector.get('table', null);
        this.dataField = this.injector.get('dataField', null);
    }

    ngOnInit() {
    }

}
