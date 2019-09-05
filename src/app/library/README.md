# Next Century Component Library

## Table of Content

* [What is the Next Century Component Library?](#what-is-the-next-century-component-library)
* [Why should I use the Next Century Component Library?](#why-should-i-use-the-next-century-component-library)
* [What are the parts of the Next Century Component Library?](#what-are-the-parts-of-the-next-century-component-library)
  * [Search](#search)
  * [Filter](#filter)
  * [Aggregation](#aggregation)
  * [Group](#group)
  * [Visualizations](#visualizations)
  * [Services](#services)
  * [Datasets](#datasets)
  * [The Data Server](#the-data-server)
* [How does the Next Century Component Library work?](#how-does-the-next-century-component-library-work)
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

The **Next Century Component Library** (or NCCL) allows you to rapidly integrate **searching** and **filtering** capabilities into your **big data visualization application** with simple, easy-to-use components that interact directly with your datastores.

The NCCL also offers a collection of configurable **data visualizations** that you can integrate into your own application.

The NCCL's core components are **framework-agnostic** so they can be used with Angular, React, Vue, and more.

## Why should I use the Next Century Component Library?

The Next Century Component Library grants multiple unique benefits over other data visualization libraries:

* It is **free** and **open-source**
* It supports **different types of datastores** (see the full list [here](https://github.com/NextCenturyCorporation/neon-server#datastore-support))
* It lets you **view and filter on data from separate datastores at the same time**
* It operates on your own datastores, so it **doesn't need to load and save a copy of your data** in order to work (though we have suggestions on how you should [configure your datastores](https://github.com/NextCenturyCorporation/neon-server#datastore-configuration) so you can make the best use out of the NCCL).

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

### Search

The **Search Component** builds and runs search queries (using the SearchService), transforms query results, and sends data to its corresponding visualization element.  It also appends filters (from the FilterService) to its search queries and saves [filter designs](#what-is-a-filter-design) from its corresponding Filter Component(s) so they can be used to generate the [search data](#search-data-object) and if `enable-ignore-self-filter` is true.

### Filter

The **Filter Component** listens to filter events from its corresponding visualization element, creates [filter designs](#what-is-a-filter-design) from the filtered values, and sends the filter designs to the FilterService.  It also listens when filters are changed by other sources and, if they match its internal filter designs, sends the [externally filtered data](#what-is-externally-filtered-data) to the visualization element.

#### Types of Filters

1. **List Filters** are the most common type of filter.  They require that all records have values in a specific field that satify a specific operator (like "equals" or "not equals") and one or more values.  By default, a record needs only to satisfy one of the listed values; however, if the `list-intersection` attribute on the Filter Component is true, a record must match ALL of the listed values.

Example:

```js
{
    fieldKey: 'es1.index_name.index_type.field_name',
    operator: '=',
    values: ['a', 'b', 'c']
}
```

2. **Bounds Filters** are intended for use with numeric data in visualizations like maps and scatter plots.  They require that all records have values in two specific fields that fall within two specific ranges.

Example:

```js
{
    fieldKey1: 'es1.index_name.index_type.x_field',
    begin1: 1,
    end1: 2,
    fieldKey2: 'es1.index_name.index_type.y_field',
    begin2: 3,
    end2: 4
}
```

3. **Domain Filters** are intended for use with date or numeric data in visualizations like histograms or line charts.  They require that all records have data in a specific field that

Example:

```js
{
    fieldKey: 'es1.index_name.index_type.date_field',
    begin: 1,
    end: 2
}
```

4. **Pair Filters** require that all records have values in two specific fields that satisfy corresponding operators (like "equals" or "not equals") on two corresponding values.  By default, a record needs only to satisfy one of the two values; however, if the `pair-intersection` attribute on the Filter Component is true, a record must match BOTH of the values.

Example:

```js
    fieldKey1: 'es1.index_name.index_type.field_1',
    operator1: '=',
    value1: 'a',
    fieldKey2: 'es1.index_name.index_type.field_2',
    operator2: '!=',
    value2: 'b'
```

5. **Compound Filters**

TODO

Example:

```js
{
    intersection: true,
    filters: [{
      fieldKey: 'es1.index_name.index_type.field_name',
      operator: '=',
      values: ['a', 'b', 'c']
    }, {
      fieldKey: 'es1.index_name.index_type.date_field',
      begin: 1,
      end: 2
    }]
}
```

#### Filter Operators

* Equals (`=`)
* Not Equals (`!=`)
* Contains (`contains`)
* Not Contains (`not contains`)
* Greater Than (`>`)
* Less Than (`<`)
* Greter Than or Equal To (`>=`)
* Less Than or Equal To (`<=`)

Note that a filter on `field != null` or `field = null` is equivalent to an "exists" or "not exists" filter, respectively.

### Aggregation

The **Aggregation Component** lets you define an [aggregate function](https://en.wikipedia.org/wiki/Aggregate_function) on a field in your search query, like the corresponding SQL functions ([COUNT, AVG, SUM](https://www.w3schools.com/sql/sql_count_avg_sum.asp), [MIN, MAX](https://www.w3schools.com/sql/sql_min_max.asp)).

#### Types of Aggregations

* Count (`'count'`), the default
* Average (`'avg'`)
* Maximum (`'max'`)
* Minimum (`'min'`)
* Sum (`'sum'`)

### Group

The **Group Component** lets you define a data grouping on a field in your search query, often combined with an [aggregate function](#aggregation), like the corresponding SQL function ([GROUP_BY](https://www.w3schools.com/sql/sql_groupby.asp)).  You can also have a "date group" on a date field using a specific time interval.

#### Types of Groups

* Non-Date Group, the default
* Date Group on Year (`'year'`)
* Date Group on Month (`'month'`)
* Date Group on Day of the Month (`'dayOfMonth'`)
* Date Group on Hour (`'hour'`)
* Date Group on Minute (`'minute'`)

### Visualizations

TODO

### Services

#### FilterService

TODO

#### SearchService

TODO

#### ConnectionService

TODO

### Datasets

TODO

### The Data Server

The NCCL [**Data Server**](https://github.com/NextCenturyCorporation/neon-server), formerly called the "Neon Server", is a Java REST Server that serves as an intermediary between your frontend application and your datastores.  Its job is to provide datastore adapters, run datastore queries, transform query results, and perform optional data processing.  The [**Search Component**](#search) sends queries to it and receives query results from it using the [SearchService](#searchservice).  As a standalone application, the NCCL Data Server must be deployed separately from your frontend application.

## How can I use the Next Century Component Library too?

### Dependencies

* [Web Components Polyfills](https://www.npmjs.com/package/@webcomponents/webcomponentsjs)
* A deployed instance of the [NCCL Data Server](https://github.com/NextCenturyCorporation/neon-server)

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
2. If you want your Visualization Element to generate search filters, your Visualization Element should emit filter events with a `values` property in its [event detail](https://developer.mozilla.org/en-US/docs/Web/API/CustomEvent/detail) containing a [filter data array](#filter-data-array).  If it does not, you will need to use [custom data transformations](#using-custom-data-transformations) to call the `updateFilters` function on the Filter Component in order to create the new filters.

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

#### Filter Data Array

A filter data array contains filtered values in a format depending on the [type of filter](#types-of-filters) that will be created.  Values should be `boolean`, `number`, or `string` primitives, `Date` objects, or `null`.

A **List Filter** contains data in one of two formats:  first, it may be a single value, not in an array (yes, the name "filter data array" is confusing in this case); second, it may be an array of one or more values.  All of the values will be included in the filter.

A **Bounds Filter** contains exactly four values in a specific order: `begin1, begin2, end1, end2`, where `begin1` and `end1` correspond to `fieldKey1` while `begin2` and `end2` correspond to `fieldKey2`.

A **Domain Filter** contains exactly two values in a specific order: `begin, end1`.

A **Pair Filter** contains exactly two values in a specific order: `value1, value2`, where `value1` corresponds to `fieldKey1` while `value2` corresponds to `fieldKey2`.

Any filter data array may be nested inside another array.  In this case, a filter will be created using each nested filter data array.

Examples:

```js
const listFilterData1 = 'a';
const listFilterData2 = ['a', 'b', 'c'];
const listFilterData3 = [['a'], ['b', 'c']];

const boundsFilterData1 = [1, 2, 3, 4];
const boundsFilterData2 = [[1, 2, 3, 4], [5, 6, 7, 8]];

const domainFilterData1 = [1, 2];
const domainFilterData2 = [[1, 2], [3, 4]];

const pairFilterData1 = ['a', 'b'];
const pairFilterData2 = [['a', 'b'], ['c', 'd']];
```

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

A **filter design** contains the data needed to create specific filter, including [field key(s)](#what-is-a-field-key), operator(s), values, and [filter type](#types-of-filters).  The FilterService transforms filter designs into filter objects that it then saves and gives to the Search Component.

However, a filter design can also be made without filter values.  In this case, it's used to match all filters with the same field keys, operators, and filter type (and nested format for compound filters) but different values.  Each Filter Component creates filters of a specific design; the Search Component uses the filter designs from its corresponding Filter Components to identify [externally filtered data](#what-is-externally-filtered-data).

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
