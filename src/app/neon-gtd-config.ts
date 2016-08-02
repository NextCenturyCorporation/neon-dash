import { Dataset } from './dataset';

export class DashboardConfig {
    gridsterColumns: number;
    gridsterMargins: number;
    hideNavbarItems: boolean;
    hideAdvancedConfig: boolean;
    hideFilterStatusTray: boolean;
    hideErrorNotifications: boolean;
    hideHeaders: boolean;
    hideCloseButton: boolean;
    showVideoOnLoad: boolean;
    showImport: boolean;
    showExport: boolean;
    translationKeys: Object[];
}

export class HelpConfig {
    guide: string;
    webVideo: string;
    localVideo: string;
}

export class OpenCPUConfig {
    enableOpenCpu: boolean;
    enableLogging: boolean;
    useAlerts: boolean;
    enableAnomalyDetection: boolean;
    enableStl2: boolean;
    enableMmpp: boolean;
    url: string;
}

export class UserAleConfig {
    enable: boolean;
}

export class NeonGTDConfig {
    userAle: UserAleConfig = {
        enable: false
    };
    dashboard: DashboardConfig = {
        gridsterColumns: 24,
        gridsterMargins: 10,
        hideNavbarItems: false,
        hideAdvancedConfig: false,
        hideFilterStatusTray: false,
        hideErrorNotifications: false,
        hideHeaders: false,
        hideCloseButton: false,
        showVideoOnLoad: false,
        showImport: false,
        showExport: true,
        translationKeys: []
    };
    help: HelpConfig = {
        guide: './app/help/Neon-Dashboard-User-Guide.pdf',
        webVideo: '',
        localVideo: ''
    };
    opencpu: OpenCPUConfig = {
        enableOpenCpu: false,
        enableLogging: false,
        useAlerts: false,
        enableAnomalyDetection: true,
        enableStl2: false,
        enableMmpp: false,
        url: ''
    };
    datasets: Dataset[] = [];
}
