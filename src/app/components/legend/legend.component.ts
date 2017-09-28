import {
    Component,
    OnInit,
    OnDestroy,
    ViewEncapsulation,
    ChangeDetectionStrategy,
    ViewChild,
    Input
} from '@angular/core';


@Component({
    selector: 'app-legend',
    templateUrl: './legend.component.html',
    styleUrls: ['./legend.component.scss'],
    encapsulation: ViewEncapsulation.Emulated, changeDetection: ChangeDetectionStrategy.Default
})
export class LegendComponent implements OnInit,
    OnDestroy {
    @Input() data: LegendItem[];
    @Input() groups: LegendGroup[];
    @ViewChild('menu') menu: any;
    public menuIcon: string;

    constructor() {
        //private connectionService: ConnectionService, private datasetService: DatasetService, private filterService: FilterService,
        //private exportService: ExportService, private injector: Injector, private themesService: ThemesService) {
        this.menuIcon = 'keyboard_arrow_down';
    }

    ngOnInit() {
    }

    ngOnDestroy() {

    }

    getIcon(active: boolean): string {
        if (active) {
            return 'check_box';
        } else {
            return 'check_box_outline_blank';
        }
    }

    onMenuOpen() {
        this.menuIcon = 'keyboard_arrow_up';
    }

    onMenuClose() {
        this.menuIcon = 'keyboard_arrow_down';
    }
}

export class LegendGroup {
    name: string;
    data: LegendItem[];
    hasName?: boolean;
}

export class LegendItem {
    prettyName: string;
    accessName: string;
    activeColor: string;
    inactiveColor: string;
    active: boolean;

    constructor(name: string) {
        this.prettyName = name;
        this.accessName = name;
        this.active = true;
    }
}
