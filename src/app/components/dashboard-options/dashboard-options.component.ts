import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'dashboard-options',
  templateUrl: './dashboard-options.component.html',
  styleUrls: ['./dashboard-options.component.scss']
})
export class DashboardOptionsComponent implements OnInit {

    public static CSV: string = 'CSV';
    public static XLSX: string = 'XLSX';

    private exportFormat: string;
    private formData: any = {
        exportFormat: 'CSV',
        currentTheme: 'neon-green-theme',
        newStateName: '',
        loadStateName: '',
        deleteStateName: ''
    };

    constructor() { }

    ngOnInit() {
        this.exportFormat = DashboardOptionsComponent.CSV;
    }

    toggleExportFormat(event: Event) {
        event.preventDefault()
        console.log(event);
    }

}
