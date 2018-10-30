var fs = require('fs');
var stream = fs.createWriteStream('NOTICE.md');
var endOfLine = require('os').EOL;
var crawler = require('npm-license-crawler'),
    options = {
        start: process.cwd(),
        onlyDirectDependencies: true
    };

crawler.dumpLicenses(options, function(error, res) {
    if (error) {
        console.error('Error:', error);
    } else {
        stream.write(
            'The following 3rd party libraries are used by the Neon Geo Temporal Dashboard:' +
                endOfLine +
                endOfLine
        );

        //Create table
        // Header
        stream.write('| Software  | License |' + endOfLine);
        // Required at least 3 dashes separating each header cell
        stream.write('| ---  | --- |' + endOfLine);
        for (var property in res) {
            // software column
            stream.write('| ' + property + ' | ');

            // license column as link
            stream.write(
                '[' +
                    res[property].licenses +
                    '](' +
                    res[property].licenseUrl +
                    ') |'
            );
            stream.write(endOfLine);
        }

        // Close the stream
        stream.end();
    }
});
