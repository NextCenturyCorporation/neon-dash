# Next Century Component Library

## Table of Content

* [What is the Next Century Component Library?](#what-is-the-next-century-component-library)
* [Why should I use the Next Century Component Library?](#why-should-i-use-the-next-century-component-library)
* [What are the parts of the Next Century Component Library?](#what-are-the-parts-of-the-next-century-component-library)
  * [Search and Filter](#search-and-filter)
  * [Visualizations](#visualizations)
  * [Services](#services)
  * [The Data Server](#the-data-server)
* [How does the Next Century Component Library work?](#how-does-the-next-century-component-library-work)
* [How can I use the Next Century Component Library too?](#how-can-i-use-the-next-century-component-library-too)
  * [Requirements](#requirements)
  * [Basic Interactions](#basic-interactions)
  * [Custom Transformations](#custom-transformations)
  * [NCCL Visualizations](#nccl-visualizations)
  * [Angular](#angular)
  * [React](#react)
  * [Vue](#vue)
* [Questions](#questions)
  * [What is a field key?](#what-is-a-field-key)
  * [What are externally set filters?](#what-are-externally-set-filters)
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

## What are the parts of the Next Century Component Library?

### Search and Filter

### Visualizations

### Services

### The Data Server

## How does the Next Century Component Library work?

## How can I use the Next Century Component Library too?

### Requirements

* [Web Components Polyfills](https://www.npmjs.com/package/@webcomponents/webcomponentsjs)
* A deployed instance of the [NCCL Data Server](https://github.com/NextCenturyCorporation/neon-server) (formerly called the Neon Server)

### Basic Interactions

#### Initializing Services and Core Elements

```js
// Initialize services
const filterService = new FilterService();
const searchService = new SearchService(new ConnectionService());

// Initialize dataset
const fieldArray = []; // Fields will be automatically detected if not defined.
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

// Initialize NCCL filter components
document.getElementById('filter1').init(datasetObject, filterService);

// Initialize NCCL search components
document.getElementById('search1').init(datasetObject, filterService, searchService);
```

#### Search

```html
<visualization-element id="vis1"></visualization-element>

<next-century-search
    id="search1"
    data-host="localhost"
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
    data-host="localhost"
    data-type="elasticsearchrest"
    search-field-key="es1.index_name.index_type.category_field"
    server="http://localhost:8090/"
    vis-draw-function="drawData"
    vis-element-id="vis1"
>
    <next-century-aggregation
        field-key="es1.index_name.index_type.category_field"
        name="_records"
        type="count"
    >
    </next-century-aggregation>

    <next-century-group
        field-key="es1.index_name.index_type.category_field"
    >
    </next-century-group>
</next-century-search>
```

#### Search and Filter

```html
<visualization-element id="vis1"></visualization-element>

<next-century-search
    id="search1"
    data-host="localhost"
    data-type="elasticsearchrest"
    search-field-key="es1.index_name.index_type.*"
    server="http://localhost:8090/"
    vis-draw-function="drawData"
    vis-element-id="vis1"
>
</next-century-search>

<next-century-filter
    id="filter1"
    list-field-key="es1.index_name.index_type.unique_id"
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
    data-host="localhost"
    data-type="elasticsearchrest"
    search-field-key="es1.index_name.index_type.category_field"
    server="http://localhost:8090/"
    vis-draw-function="drawData"
    vis-element-id="vis1"
>
    <next-century-aggregation
        field-key="es1.index_name.index_type.category_field"
        name="_records"
        type="count"
    >
    </next-century-aggregation>

    <next-century-group
        field-key="es1.index_name.index_type.category_field"
    >
    </next-century-group>
</next-century-search>

<next-century-filter
    id="filter1"
    list-field-key="es1.index_name.index_type.category_field"
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
    data-host="localhost"
    data-type="elasticsearchrest"
    search-field-key="es1.index_name.index_type.*"
    server="http://localhost:8090/"
    vis-draw-function="drawData"
    vis-element-id="vis1"
>
    <next-century-aggregation
        field-key="es1.index_name.index_type.category_field"
        name="_records"
        type="count"
    >
    </next-century-aggregation>

    <next-century-group
        field-key="es1.index_name.index_type.category_field"
    >
    </next-century-group>

    <next-century-group
        field-key="es1.index_name.index_type.text_field"
    >
    </next-century-group>
</next-century-search>

<next-century-filter
    id="filter1"
    list-field-key="es1.index_name.index_type.category_field"
    list-operator="="
    search-element-id="search1"
    vis-element-id="vis1"
    vis-filter-input-function="changeSelectedCategory"
    vis-filter-output-event="categorySelected"
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

### Custom Transformations

### Angular

### React

TODO

### Vue

TODO

## Questions

### What is a field key?

A **field key** is a string containing a **unique datastore identifier**, **database name**, **table name**, and **field name**, separated by dots (i.e. `datastore_id.database_name.table_name.field_name`).  Remember that, with Elasticsearch, we equate **indexes** with databases and **index mapping types** with tables.

### What are externally set filters?

Most filterable visualizations have a way to generate filters by interacting with the visualization itself (like clicking on an element).  However, sometimes we want a visualization to show a filter that was generated outside the visualization.  For example:

* We have two visualizations, a legend and a data list, and, when an option in the legend is selected (and generates a filter), we want to highlight that selected value in the data list.
* We have two separate line charts showing different data over the same time period and, when a time period is selected in one chart (and generates a filter), we want to highlight that selected time period in the second chart.

An **externally set filter** is a filter that is applicable to the visualization but was not originally generated by the visualization.  This way, you have the option to change or redraw your visualization based on these filters.

## License

The Next Century Component Library is made available by [Next Century](http://www.nextcentury.com) under the [Apache 2 Open Source License](http://www.apache.org/licenses/LICENSE-2.0.txt). You may freely download, use, and modify, in whole or in part, the source code or release packages. Any restrictions or attribution requirements are spelled out in the license file. The Next Century Component Library attribution information can be found in the [LICENSE](./LICENSE) file. For more information about the Apache license, please visit the [The Apache Software Foundation’s License FAQ](http://www.apache.org/foundation/license-faq.html).

## Contact

Email: [neon-support@nextcentury.com](mailto:neon-support@nextcentury.com)
