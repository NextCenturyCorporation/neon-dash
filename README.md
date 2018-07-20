# Neon Dashboard
The Neon Dashboard (neon-dash) is a sample analysis dashboard built upon the [Neon Framework][5]. It includes a number of geo-spatial and temporal data visualizations built as [Angular][13] components that use the Neon framework to query and filter data served by [MongoDB][8], [Elasticsearch 1.7][14] or an [Apache Spark][9] server. 

[Neon][5] is a software platform designed to help developers integrate disparate visualization widgets with your data stores. It includes a **Data Access API** that makes it easy to query an underlying database directly from JavaScript or RESTful endpoints. Additionally, the [Neon][5] **Interaction API** provides capabilities for inter-widget communication and shared data filters, allowing multiple visualizations to interact without being explicityly aware of one another.

This project was generated with [angular-cli][ng-cli].

## Prerequisites
Building the **neon-dash** application requires [Node.js][Node.js] (Version 6.9.x or higher).  Once node has been installed, you should install the [Angular Command Line Interface][ng-cli] with the following command: 

		npm install -g @angular/cli

Now, install the dependencies:

		npm install

## Run Development Server

Start a [Neon server][neon] running on port 8080. As an alternate to building the server, you can use the [Neon Quickstart Docker Image][neon-quickstart].

Run `npm start` for a dev server. Navigate to `http://localhost:4200/`. The app will automatically reload if you change any of the source files.

## Build for Deployment

If you need to deliver the application to someone else, so need the war file, run `npm run build` to build the project. The build artifacts will be stored in the `dist/` directory. Use the `--prod` flag for a production build.

## Generating Documentation

Run `npm run docs` to generate the documentation into the `docs/` directory.

## Running unit tests

Run `ng test` to execute the unit tests via [Karma](https://karma-runner.github.io).

## Running end-to-end tests

Run `ng e2e` to execute the end-to-end tests via [Protractor](http://www.protractortest.org/). 
Before running the tests make sure you are serving the app via `ng serve`.

## Code scaffolding

If you wish to create a new component, run `ng generate component <component-name>` to generate the appropriate files as a basis. You can also use `ng generate directive/pipe/service/route/class`.

## Pre-Commit Hooks

This project is set up to run `ng lint` before all commits. This will add a delay before you are able to make a commit.
The hook can be skipped by using `git commit -n` - Only use this if the changes are only to non-Typescript files.

## Further help

To get more help on the `angular-cli` use `ng --help` or go check out the [Angular-CLI README](https://github.com/angular/angular-cli/blob/master/README.md).

## View an example application
To see an example of this project, check out our [demo server](http://demo.neonframework.org/neon-gtd/app/#). Read more about how to use it and how it interacts with Neon [here][neon-dash-guide].

## Build and run the example

**Note**: These examples are for deploying the webapp to `/neon-dash/` in a web container.
Change all instances of `neon-dash` in the instructions if you want to use a different relative URL.

Running the application requires a functioning Neon deployment.  Links to the Neon deployment instructions and the command line instructions to build **neon-dash** follow:

1. [Build and Deploy a Neon server][2], drop the [latest neon.war][neon-war] in a web application container such as [Tomcat][tomcat], or use the [Neon Quickstart Docker Image][neon-quickstart].

2. Clone the neon-dash repo

        git clone https://github.com/NextCenturyCorporation/neon-dash.git
        cd neon-dash/
        
3. Copy the sample NEON-DASH configuration file to the app config folder or supply your own.  The configuration file specifies the default datasets and visualizations to display.  It is described in detail [here][15].  The sample configuration file is setup for the sample earthquake data referenced in step 1.

        # Copy either the YAML or JSON config file.  If Neon-Dash cannot find one, 
        # it will look for the other.  
        cp app/config/sample.config.yaml app/config/config.yaml
        cp app/config/sample.config.json app/config/config.json

4. Use npm to download dependencies, then build the application:

        npm install
        ng build --base-href /neon-dash/

5. Deploy the built webapp to your container from step 1.

*For Tomcat*: Create a `neon-dash` directory under the <apache-tomcat>/webapps folder. Copy all the built files under `dist/` to this directory.

*For Others*: The built app requires that the Neon server is accessible as the `/neon` URL on the host. For other deployments, you can deploy the Neon-Dash project on a standard web server such as nginx or Apache, and proxy `/neon` to your Neon server.

6. If running against a stock, localhost Tomcat instance, browse to the [http://localhost:8080/neon-dash/][neon-dash-localhost] to verify its installation.  The [Users Guide][neon-dash-guide] describes its basic use.

[neon-dash-localhost]: http://localhost:8080/neon-dash/
[neon-dash-guide]: https://github.com/NextCenturyCorporation/neon-dash/wiki/Neon-Dashboard-User-Guide

## Documentation

**[Neon Git Repo][6]** - Visit the main Neon project and download its source code.

**[Neon Wiki][1]** - Visit the Neon wiki for more information on what Neon can do for you.

**[Build Instructions][2]** - Includes instructions for building the Neon WAR file from source code and lists Neon's external dependencies.

**[Deploying Neon][3]** - Includes instructions for deploying the Neon application to a web application container (e.g., Jetty or Tomcat).

**[Developer Quick Start Guide][4]** - A quick tour of how to develop apps that use Neon.

## Apache 2 Open Source License

Neon and  are made available by [Next Century][18] under the [Apache 2 Open Source License][16]. You may freely download, use, and modify, in whole or in part, the source code or release packages. Any restrictions or attribution requirements are spelled out in the license file. Neon and  attribution information can be found in the LICENSE.TXT file and licenses folder in each of the [Neon Git Repository][neon] and [ Git Repository][neon-dash]. For more information about the Apache license, please visit the [The Apache Software Foundation’s License FAQ][17].

## References

verdi-favicon.icon : ArtsyBee, CC0 Creative Commons, uploaded 7 February 2016, [*lion-1181521_960_720.png*][19]

volume_up.svg : Material Design, Google, updated 12 November 2014, [*ic_volume_up_24px.svg*][20]

youtube_logo.png : Brand Resources, YouTube, updated 2018, [*yt_logo_rgb_light.png*][21]

## Additional Information

Email: neon-support@nextcentury.com

Website: [http://neonframework.org][5]

Copyright 2017 Next Century Corporation

[neon]: https://github.com/NextCenturyCorporation/neon
[neon-dash]: https://github.com/NextCenturyCorporation/neon-dash
[neon-quickstart]: https://hub.docker.com/r/nextcentury/neon-quickstart/
[neon-war]: https://s3.amazonaws.com/neonframework.org/neon/versions/latest/neon.war
[ng-cli]: https://github.com/angular/angular-cli
[Node.js]: https://nodejs.org/en/
[tomcat]: http://tomcat.apache.org/

[1]: https://github.com/NextCenturyCorporation/neon/wiki
[2]: https://github.com/NextCenturyCorporation/neon/wiki/Build-Instructions
[3]: https://github.com/NextCenturyCorporation/neon/wiki/Deploying-Neon
[4]: https://github.com/NextCenturyCorporation/neon#quick-start-build-and-run-the-example
[5]: http://neonframework.org
[6]: http://github.com/NextCenturyCorporation/neon
[7]: http://www.owfgoss.org
[8]: http://www.mongodb.org
[9]: http://spark.apache.org/
[10]: https://www.npmjs.org/
[11]: http://gruntjs.com/
[12]: http://bower.io/
[13]: https://angularjs.org/
[14]: https://www.elastic.co/products/elasticsearch
[15]: https://github.com/NextCenturyCorporation/neon-dash/wiki/Neon-Dashboard-Configuration-Guide
[16]: http://www.apache.org/licenses/LICENSE-2.0.txt
[17]: http://www.apache.org/foundation/license-faq.html
[18]: http://www.nextcentury.com
[19]: https://pixabay.com/en/lion-egyptian-ancient-egypt-1181521/
[20]: https://github.com/google/material-design-icons/blob/master/av/svg/production/ic_volume_up_24px.svg
[21]: https://www.youtube.com/yt/about/brand-resources/#logos-icons-colors
