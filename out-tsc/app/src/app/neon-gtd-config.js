var DashboardConfig = /** @class */ (function () {
    function DashboardConfig() {
    }
    return DashboardConfig;
}());
export { DashboardConfig };
var HelpConfig = /** @class */ (function () {
    function HelpConfig() {
    }
    return HelpConfig;
}());
export { HelpConfig };
var UserAleConfig = /** @class */ (function () {
    function UserAleConfig() {
    }
    return UserAleConfig;
}());
export { UserAleConfig };
var NeonGTDConfig = /** @class */ (function () {
    function NeonGTDConfig() {
        this.userAle = {
            enable: false
        };
        this.dashboard = {
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
        this.help = {
            guide: './app/help/Neon-Dashboard-User-Guide.pdf',
            webVideo: '',
            localVideo: ''
        };
        this.datasets = [];
        this.layouts = {};
        this.translationKeys = {};
    }
    return NeonGTDConfig;
}());
export { NeonGTDConfig };
//# sourceMappingURL=neon-gtd-config.js.map