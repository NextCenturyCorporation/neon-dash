var LogMessage = /** @class */ (function () {
    function LogMessage() {
    }
    return LogMessage;
}());
export { LogMessage };
var ElasticsearchLogger = /** @class */ (function () {
    function ElasticsearchLogger(http) {
        this.http = http;
        this.url = 'http://localhost:9200/logindex/messages';
    }
    ElasticsearchLogger.prototype.doLog = function (component, message) {
        /* tslint:disable:no-console */
        var fullMsg = new LogMessage();
        fullMsg.componentName = component;
        fullMsg.time = new Date();
        fullMsg.logMessage = message;
        console.log(message);
        var req = this.http.post(this.url, JSON.stringify(fullMsg)).subscribe(function (res) {
            console.log(res);
        }, function (err) {
            console.log('Error occured!! ');
        });
        /* tslint:enable:no-console */
    };
    return ElasticsearchLogger;
}());
export { ElasticsearchLogger };
//# sourceMappingURL=elasticsearch-logger.js.map