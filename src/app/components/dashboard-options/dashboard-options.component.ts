import { Component, Input, OnInit } from '@angular/core';

import { ThemesService } from '../../services/themes.service';

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

    constructor(private themesService: ThemesService) { }

    ngOnInit() {
        this.exportFormat = DashboardOptionsComponent.CSV;
        this.formData.currentTheme = this.themesService.getCurrentTheme().id;
    }

    setCurrentTheme(themeId: any) {
        if (themeId) {
            this.themesService.setCurrentTheme(themeId);
        }
    }

    toggleExportFormat(event: Event) {
        event.preventDefault()
        console.log(event);
    }

}
