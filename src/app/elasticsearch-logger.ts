import { HttpClient } from '@angular/common/http';

export class LogMessage {
    componentName: string;
    time: Date;
    logMessage: string;
}

export class ElasticsearchLogger {
    private url: string;

    constructor(private http: HttpClient) {
        this.url = 'http://localhost:9200/logindex/messages';
    }

    public doLog(component: string, message: string): void {
        let  fullMsg = new LogMessage();
        fullMsg.componentName = component;
        fullMsg.time = new Date();
        fullMsg.logMessage = message;
        console.log(message);
        const req =  this.http.post(this.url, JSON.stringify(fullMsg)).subscribe(
            (res) => {
                console.log(res);
            },
            (err) => {
                console.log('Error occured!! ');
            });
    }
}
