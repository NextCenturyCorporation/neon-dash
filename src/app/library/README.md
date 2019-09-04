# Next Century Component Library

## Table of Content

* [What is the Next Century Component Library?](#what-is-the-next-century-component-library)
* [Why should I use the Next Century Component Library?](#why-should-i-use-the-next-century-component-library)
* [How does the Next Century Component Library work?](#how-does-the-next-century-component-library-work)
* [What are the parts of the Next Century Component Library?](#what-are-the-parts-of-the-next-century-component-library)
  * [Search and Filter](#search-and-filter)
  * [Visualizations](#visualizations)
  * [Services](#services)
  * [Datasets](#datasets)
  * [The Data Server](#the-data-server)
* [How can I use the Next Century Component Library too?](#how-can-i-use-the-next-century-component-library-too)
  * [Dependencies](#dependencies)
  * [The Basics](#the-basics)
  * [Using NCCL Visualization Components](#using-nccl-visualization-components)
  * [Using My Visualization Elements](#using-my-visualization-elements)
  * [Using Custom Data Transformations](#using-custom-data-transformations)
  * [Developing in Angular](#developing-in-angular)
  * [Developing in React](#developing-in-react)
  * [Developing in Vue](#developing-in-vue)
* [Questions](#questions)
  * [What is a field key?](#what-is-a-field-key)
  * [What is a filter design?](#what-is-a-filter-design)
  * [What is externally filtered data?](#what-is-externally-filtered-data)
* [The Neon Dashboard](#the-neon-dashboard)
* [Documentation Links](#documentation-links)
* [License](#license)
* [Contact](#contact)

## What is the Next Century Component Library?

The **Next Century Component Library** (or **NCCL**) offers lightweight tools to easily facilitate the integration of **searching**, **filtering**, and **big data visualization** capabilities into your application.

The NCCL is **framework-agnostic** so it can be used with Angular, React, Vue, and more.

## Why should I use the Next Century Component Library?

The NCCL offers multiple benefits over other available big data visualization libraries:

* The NCCL is **free** and **open-source**
* The NCCL supports **different types of datastores** (see the full list [here](https://github.com/NextCenturyCorporation/neon-server#datastore-support))
* The NCCL lets you **view and filter on data from separate datastores at the same time**
* The NCCL operates on your own datastores -- it **doesn't need to load and save a copy of your data first** (though we have suggestions on how you should [configure your datastores](https://github.com/NextCenturyCorporation/neon-server#datastore-configuration) so you can make the best use out of the NCCL).

## How does the Next Century Component Library work?

#### Setup

* Import Web Component polyfills and the NCCL (**Core Components**) into your codebase.
* Define NCCL **Search** and **Filter** DOM elements for each of your application's data visualizations (or import and use the **Visualization Components** from the NCCL).
* Create **Dataset**, **FilterService**, and **SearchService** objects and use them to initialize your NCCL **Search** and **Filter** DOM elements.
* Separately, deploy the NCCL **Data Server** so that it can facilitate communication between your application and your datastores.

#### Runtime

1. When a **Search** DOM element (a.k.a. "**Search Component**") is initialized (typically on page load), it will automatically run a search query using its configured attributes, dataset, and services.  The query request is sent using the **SearchService** to the **Data Server** which passes the query to the datastore and returns the query results back to that **Search Component**.
2. The **Search Component** transforms the query results into a [search data object](#search-data-object), combining each result with the query's corresponding aggregations and its filtered status.
3. The **Search Component** sends the search data object to its corresponding visualization, either by calling the visualization's draw function itself or by emitting an event that notifies the application to send the search data object to the visualization.
4. The visualization renders the search data.
5. When user interaction with a visualization should generate a filter on some data (for example, clicking on an element), that visualization will dispatch an event to notify its corresponding **Filter** DOM element.
6. When a **Filter** DOM element (a.k.a. "**Filter Component**") is notified with a filter event from its corresponding visualization, it will create a new filter and send it to the **FilterService**.
7. When the **FilterService** is sent a filter, it notifies each relevant **Search Component** to automatically run a new search query using that filter and have its visualization re-render the search data (see 1-4).  A Search Component is relevant if the datastore, database, and table in its `search-field-key` match a datastore, database, and table in the new filter(s).
8. Additionally, when the **FilterService** is sent a filter, it also notifies each relevant **Filter Component** to pass the [externally filtered data](#what-is-externally-filtered-data) onto its corresponding visualization if needed.  A Filter Component is relevant if its [filter designs](#what-is-a-filter-design) match the new filter(s).

## What are the parts of the Next Century Component Library?

### Search and Filter

The NCCL's **Search** and **Filter** components are its core capabilities.

### Visualizations

TODO

### Services

TODO

### Datasets

TODO

### The Data Server

TODO

## How can I use the Next Century Component Library too?

### Dependencies

* [Web Components Polyfills](https://www.npmjs.com/package/@webcomponents/webcomponentsjs)
* A deployed instance of the [NCCL Data Server](https://github.com/NextCenturyCorporation/neon-server) (formerly called the Neon Server)

### The Basics

#### Initializing NCCL Core Services and Components

1. Create a single copy of each of the [Services](#services) to share with ALL of your Components.
2. Create a single [Dataset](#datasets) containing each of your datastores, databases, and tables.
3. Initialize each of your [Filter Components](#search-and-filter) with the Dataset and FilterService.
4. Initialize each of your [Search Components](#search-and-filter) with the Dataset, FilterService, and SearchService.

```js
// Create a single copy of each of the core Services to share with ALL of your NCCL Components.
const filterService = new FilterService();
const searchService = new SearchService(new ConnectionService());

// Create a single Dataset containing each of your datastores, databases, and tables.
const fieldArray = []; // Fields will be automatically detected by the NCCL if not defined here.
const tableObject = TableMetaData.get({
    name: 'table_name',
    prettyName: 'Table Name',
    fields: fieldArray
});
const databaseObject = DatabaseMetaData.get({
    name: 'database_name',
    prettyName: 'Database Name',
    tables: {
        table_name: tableObject
    }
});
const datastoreObject = DatastoreMetaData.get({
    name: 'datastore_id',
    host: 'localhost',
    type: 'elasticsearchrest',
    databases: {
        database_name: databaseObject
    }
});
const datasetObject = Dataset.get({
    datastores: {
        datastore_id: datastoreObject
    }
});

// Initialize each of your Filter Components with the Dataset and FilterService.
document.getElementById('filter1').init(datasetObject, filterService);

// Initialize each of your Search Components with the Dataset, FilterService, and SearchService.
document.getElementById('search1').init(datasetObject, filterService, searchService);
```

#### Search

1. You will start with a specific Visualization element. Give it an `id` attribute.
2. Define a Search element and give it an `id` attribute.
3. This Search element will be querying a specific datastore.  Give your Search element a `data-type` attribute containing the [type of this datastore](#) and a `data-host` attribute containing the `hostname:port` of this datastore WITHOUT any `http` prefix (or just `hostname` if using the default port).
4. This Search element will be querying one or more fields in a specific table.  Give your Search element a `search-field-key` attribute containing the [field-key](#field-key) of the specific query field, or replace the field in the field key with a `*` (wildcard symbol) if querying multiple fields in the table.
5. Give your Search element a `server` attribute containing the hostname of your deployed NCCL Data Server WITH the `http` prefix if needed.
6. Unless this Visualization element does not have an applicable "draw" function (see [Using My Visualization Elements](#using-my-visualization-elements) below), give your Search element a `vis-element-id` attribute containing the ID of your Visualization element and a `vis-draw-function` attribute containing the name of the "draw" function defined on your Visualization element.

```html
<visualization-element id="vis1"></visualization-element>

<next-century-search
    id="search1"
    data-host="localhost:9200"
    data-type="elasticsearchrest"
    search-field-key="es1.index_name.index_type.*"
    server="http://localhost:8090/"
    vis-draw-function="drawData"
    vis-element-id="vis1"
>
</next-century-search>
```

#### Search with Aggregations and Groups

```html
<visualization-element id="vis1"></visualization-element>

<next-century-search
    id="search1"
    data-host="localhost:9200"
    data-type="elasticsearchrest"
    search-field-key="es1.index_name.index_type.username_field"
    server="http://localhost:8090/"
    vis-draw-function="drawData"
    vis-element-id="vis1"
>
    <next-century-aggregation
        field-key="es1.index_name.index_type.username_field"
        name="_records"
        type="count"
    >
    </next-century-aggregation>

    <next-century-group
        field-key="es1.index_name.index_type.username_field"
    >
    </next-century-group>
</next-century-search>
```

#### Search and Filter

```html
<visualization-element id="vis1"></visualization-element>

<next-century-search
    id="search1"
    data-host="localhost:9200"
    data-type="elasticsearchrest"
    search-field-key="es1.index_name.index_type.*"
    server="http://localhost:8090/"
    vis-draw-function="drawData"
    vis-element-id="vis1"
>
</next-century-search>

<next-century-filter
    id="filter1"
    list-field-key="es1.index_name.index_type.id_field"
    list-operator="="
    search-element-id="search1"
    vis-element-id="vis1"
    vis-filter-input-function="changeSelectedData"
    vis-filter-output-event="dataSelected"
>
</next-century-filter>
```

#### Filter with Aggregations and Groups

```html
<visualization-element id="vis1"></visualization-element>

<next-century-search
    id="search1"
    data-host="localhost:9200"
    data-type="elasticsearchrest"
    search-field-key="es1.index_name.index_type.username_field"
    server="http://localhost:8090/"
    vis-draw-function="drawData"
    vis-element-id="vis1"
>
    <next-century-aggregation
        field-key="es1.index_name.index_type.username_field"
        name="_records"
        type="count"
    >
    </next-century-aggregation>

    <next-century-group
        field-key="es1.index_name.index_type.username_field"
    >
    </next-century-group>
</next-century-search>

<next-century-filter
    id="filter1"
    list-field-key="es1.index_name.index_type.username_field"
    list-operator="="
    search-element-id="search1"
    vis-element-id="vis1"
    vis-filter-input-function="changeSelectedData"
    vis-filter-output-event="dataSelected"
>
</next-century-filter>
```

#### Multiple Filters

```html
<visualization-element id="vis1"></visualization-element>

<next-century-search
    id="search1"
    data-host="localhost:9200"
    data-type="elasticsearchrest"
    search-field-key="es1.index_name.index_type.*"
    server="http://localhost:8090/"
    vis-draw-function="drawData"
    vis-element-id="vis1"
>
    <next-century-aggregation
        field-key="es1.index_name.index_type.username_field"
        name="_records"
        type="count"
    >
    </next-century-aggregation>

    <next-century-group
        field-key="es1.index_name.index_type.username_field"
    >
    </next-century-group>

    <next-century-group
        field-key="es1.index_name.index_type.text_field"
    >
    </next-century-group>
</next-century-search>

<next-century-filter
    id="filter1"
    list-field-key="es1.index_name.index_type.username_field"
    list-operator="="
    search-element-id="search1"
    vis-element-id="vis1"
    vis-filter-input-function="changeSelectedUsername"
    vis-filter-output-event="usernameSelected"
>
</next-century-filter>

<next-century-filter
    id="filter2"
    list-field-key="es1.index_name.index_type.text_field"
    list-operator="="
    search-element-id="search1"
    vis-element-id="vis1"
    vis-filter-input-function="changeSelectedText"
    vis-filter-output-event="textSelected"
>
</next-century-filter>
```

### Using NCCL Visualization Components

TODO

### Using My Visualization Elements

To use your own Visualization Elements:

1. It's best if your Visualization Element has a "draw" function that accepts an array of [search data objects](#search-data-object).  If it does not, you will need to add a `dataReceived` event listener to a Search Component and use [custom data transformations](#using-custom-data-transformations) to notify your Visualization Element to render the search data.
2. If you want your Visualization Element to generate search filters, your Visualization Element should emit filter events with a `detail->values` property containing a [filter data object](#filter-data-object).  If it does not, you will need to use [custom data transformations](#using-custom-data-transformations) to call the `updateFilters` function on the Filter Component in order to create the new filters.

#### Search Data Object

A search data object contains three properties: `aggregations`, an object containing the names and values of all aggregations returned by the search query; `fields`, an object containing the names and values of all fields returned by the search query; and `filtered`, a boolean indicating if the record is filtered based on the Search Component's [filter designs](#what-is-a-filter-design).

For example:

```js
{
  aggregations: {},
  fields: {
    date_field: '2019-09-01T05:00:00',
    id_field: 'id_1',
    latitude_field: 38.904722,
    longitude_field: -77.016389,
    text_field: 'The quick brown fox jumps over the lazy dog.',
    username_field: 'user_A'
  },
  filtered: false
}
```

Or:

```js
{
  aggregations: {
    _records: 1234
  },
  fields: {
    username_field: 'user_A'
  },
  filtered: false
}
```

#### Filter Data Object

TODO

### Using Custom Data Transformations

TODO

### Developing in Angular

TODO

### Developing in React

TODO

### Developing in Vue

TODO

## Questions

### What is a field key?

A **field key** is a string containing a **unique datastore identifier**, **database name**, **table name**, and **field name**, separated by dots (i.e. `datastore_id.database_name.table_name.field_name`).  Remember that, with Elasticsearch, we equate **indexes** with databases and **index mapping types** with tables.

### What is a filter design?

TODO

### What is externally filtered data?

Most filterable visualizations have a way to generate filters by interacting with the visualization itself (like clicking on an element).  However, sometimes we want a visualization to show a filter that was generated outside the visualization.  For example:

* We have two visualizations, a legend and a data list, and, when an option in the legend is selected (and generates a filter), we want to highlight that selected value in the data list.
* We have two separate line charts showing different data over the same time period and, when a time period is selected in one chart (and generates a filter), we want to highlight that selected time period in the second chart.

An **externally set filter** is a filter that is applicable to the visualization but was not originally generated by the visualization.  This way, you have the option to change or redraw your visualization based on these filters.

## The Neon Dashboard

TODO

## Documentation Links

* Web Components [(MDN Web Docs)](https://developer.mozilla.org/en-US/docs/Web/Web_Components/Using_custom_elements) [(Google Developer Guides)](https://developers.google.com/web/fundamentals/web-components/)
* Dispatching Events [(MDN Web Docs)](https://developer.mozilla.org/en-US/docs/Web/Guide/Events/Creating_and_triggering_events)

## License

The Next Century Component Library is made available by [Next Century](http://www.nextcentury.com) under the [Apache 2 Open Source License](http://www.apache.org/licenses/LICENSE-2.0.txt). You may freely download, use, and modify, in whole or in part, the source code or release packages. Any restrictions or attribution requirements are spelled out in the license file. The Next Century Component Library attribution information can be found in the [LICENSE](./LICENSE) file. For more information about the Apache license, please visit the [The Apache Software Foundation’s License FAQ](http://www.apache.org/foundation/license-faq.html).

## Contact

Email: [neon-support@nextcentury.com](mailto:neon-support@nextcentury.com)
