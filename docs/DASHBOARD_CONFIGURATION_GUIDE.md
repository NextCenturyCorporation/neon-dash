# **Neon Dashboard Configuration Guide**

## **Table of Contents**
* [**The Configuration File**](#the-configuration-file)
  * [**Note on Elasticsearch**](#note-on-elasticsearch)
  * [**Note on PostgreSQL**](#note-on-postgresql)
  * [**Datastores Object**](#datastores-object)
    * [**Datastores Overview**](#datastores-overview)
    * [**Datastores Example**](#datastores-example)
    * [**Datastore Properties**](#datastore-properties)
    * [**Database Properties**](#database-properties)
    * [**Table Properties**](#table-properties)
    * [**Fields Array**](#fields-array)
    * [**Labels Object**](#labels-object)
  * [**Dashboards Object**](#dashboards-object)
    * [**Dashboards Overview**](#dashboards-overview)
    * [**Dashboards Example**](#dashboards-example)
    * [**Dashboard Selector Properties**](#dashboard-selector-properties)
    * [**Dashboard Properties**](#dashboard-properties)
    * [**Table and Field Paths**](#table-and-field-paths)
    * [**Dashboard Options Object**](#dashboard-options-object)
    * [**Dashboard Options Object Example**](#dashboard-options-object-example)
    * [**Color Maps Object**](#color-maps-object)
    * [**Color Maps Object Example**](#color-maps-object-example)
    * [**Contributor Objects**](#contributor-objects)
    * [**Custom Request Objects**](#custom-request-objects)
    * [**Custom Requests Object Example**](#custom-requests-object-example)
    * [**Filter Objects**](#filter-objects)
    * [**Filters Object Examples**](#filters-object-example)
    * [**Relation Objects**](#relation-objects)
    * [**Relations Object Example**](#relations-object-example)
  * [**Layouts Example**](#layouts-example)
  * [**Visualization Object**](#visualization-object)
  * [**Visualization Bindings**](#visualization-bindings)
    * [**Note on Field Bindings**](#note-on-field-bindings)
    * [**Bindings For All Visualizations**](#bindings-for-all-visualizations)
    * [**Aggregation Bindings**](#aggregation-bindings)
    * [**Annotation Viewer Bindings**](#aggregation-bindings)
    * [**Data Table Bindings**](#data-table-bindings)
    * [**Document Viewer Bindings**](#document-viewer-bindings)
    * [**Map Bindings**](#map-bindings)
    * [**Media Viewer Bindings**](#media-viewer-bindings)
    * [**Network Graph Bindings**](#network-graph-bindings)
    * [**News Feed Bindings**](#news-feed-bindings)
    * [**Text Cloud Bindings**](#text-cloud-bindings)
    * [**Thumbnail Grid Bindings**](#thumbnail-grid-bindings)
    * [**Timeline Bindings**](#timeline-bindings)
    * [**Wiki Viewer Bindings**](#wiki-viewer-bindings)
    * [**Document Viewer Metadata Object Options**](#document-viewer-metadata-object-options)
    * [**Map Layer Object Options**](#map-layer-object-options)
  * [**Other Properties**](#other-properties)

To load a preconfigured Neon Dashboard, create a Neon Dashboard configuration file at **app/config/config.json** or **app/config/config.yaml**.  If **config.json** is present, **config.yaml** will be ignored.

Sample configuration files are available in the git repository at [**app/config/sample.config.json**](./src/app/config/sample.config.json) and [**app/config/sample.config.yaml**](./src/app/config/sample.config.yaml).

## **The Configuration File**

The configuration file contains the following required properties:
* **"datastores"** - (Object, Required) Configures the datastores that are available in the Neon Dashboard.  Please see [**Datastores Object**](#datastores-object) for details.
* **"dashboards"** - (Object, Optional) Configures the dashboards that are available in the Neon Dashboard.  Please see [**Dashboards Object**](#dashboards-object) for details.
* **"layouts"** - (Object, Optional) Configures the visualization layouts that are available in the Neon Dashboard.  The **"layouts"** property is a JSON object that maps unique layout names to arrays of visualization objects.  Please see [**Visualization Object**](#visualization-object) for details.

Please see [**Other Properties**](#other-properties) for details about other optional configuration file properties.

### **Note on Elasticsearch**

Elasticsearch does not have **databases** or **tables**; instead, it has **indexes** and **mapping types**. In Neon, we consider **indexes** to be the equivalent of **databases** and **mapping types** to be the equivalent of **tables**.

### **Note on PostgreSQL**

PostgreSQL connections are always database-specific, so any `postgresql` datastore in your config file must have a `host` property that ends with a slash and the database name, like `host:port/database`. In Neon, we consider PostgreSQL **schemas** to be the equivalent of **databases**.

### **Datastores Object**

#### **Datastores Overview**
* The **"datastores"** property is a JSON object that maps unique datastore IDs to **datastore** JSON objects.
* Each **datastore** object contains the **"host"**, **"type"**, and **"databases"** properties.
* The **"databases"** property is a JSON object that maps unique database names to **database** JSON objects.
* Each **database** object contains the **"tables"** property.
* The **"tables"** property is a JSON object that maps unique table names to **table** JSON objects.
* Each **table** object contains optional properties.

#### **Datastores Example**
```yaml
datastores:
    datastore_id_1:
        host: localhost
        type: elasticsearch
        databases:
            database_name_1:
                prettyName: Database 1
                tables:
                    table_name_1:
                        prettyName: Table 1
    datastore_id_2:
        host: http://1.2.3.4:9200
        type: elasticsearch
        databases:
            database_name_2:
                prettyName: Database 2
                tables:
                    table_name_2:
                        prettyName: Table 2
            database_name_3:
                prettyName: Database 3
                tables:
                    table_name_3:
                        prettyName: Table 3
                    table_name_4:
                        prettyName: Table 4
```

#### **Datastore Properties**
* **"databases"** - (Object, Required) The databases for the datastore.  Please see [**Databases Properties**](#databases-properties).
* **"host"** - (String, Required) The hostname and port of the datastore server.
* **"type"** - (String, Required) The type of datastore, like "elasticsearch" or "mysql".

#### **Database Properties**
* **"prettyName"** - (String, Optional) The pretty name for the database show in the UI.
* **"tables"** - (Object, Required) The tables for the database.  Please see [**Tables Properties**](#tables-properties).

#### **Table Properties**
* **"fields"** - (Array, Optional) The fields for the table.  Please see [**Fields Array**](#fields-array).
* **"labelOptions"** - (Object, Optional) The labels to swap with values for fields in the table.  Please see [**Labels Object**](#labels-object).
* **"prettyName"** - (String, Optional) The pretty name for the table to show in the UI.

#### **Fields Array**
The **"fields"** property is an array of JSON objects with the following properties:
* **"columnName"** - (String, Required) The field name.
* **"hide"** - (Boolean, Optional) Whether to hide the field in the UI.  Default:  false
* **"prettyName"** - (String, Optional) The pretty name for the field to show in the UI.
* **"type"** - (String, Optional) The field type in datastore terminology.  If not included, Neon will determine the field type automatically.  Please see [**Field Types**](https://github.com/NextCenturyCorporation/nucleus-data-server/blob/master/README.md#field-types) for the full list.

#### **Fields Example**
```yaml
fields:
    - columnName: dateField
      prettyName: Date
      type: date
    - columnName: nameField
      prettyName: Name
      type: keyword
    - columnName: textField
      prettyName: Text
      type: text
    - columnName: idField
      hide: true
```

#### **Labels Object**
The **"labelOptions"** property is a JSON object that maps field names to **substitution** JSON objects.  The **substitution** object maps values stored in the field to pretty labels that the UI will swap with the values whenever they are shown in visualizations in the dashboard.

#### **Labels Example**
```yaml
labelOptions:
    nameField:
        alice: Alice
        bob: Bob
        carol: Carol
```

### **Dashboards Object**

#### **Dashboards Overview**
* The **"dashboards"** property is a JSON object that corresponds to either a **dashboard selector** or a **dashboard** itself.
* Each **dashboard selector** object contains **"choices"** and **"name"** properties.
* The **"choices"** property is a JSON object that maps unique choice IDs to choices for the selector which are either **dashboard selector** objects or **dashboard** objects.
* Each **dashboard** object contains **"name"**, **"layout"**, and other optional properties.

#### **Dashboards Example**
```yaml
dashboards:
    category: "Select a thing..."
    choices:
        choice_id_1:
            name: Choice 1
            category: "Select a sub-thing..."
            choices:
                choice_id_1_a:
                    name: Choice 1-A
                    layout: layout_id_1_a
                    tables:
                        table_key: datastore_1.database_1.table_1
                    fields:
                        date_field_key: datastore_1.database_1.table_1.dateField
                        name_field_key: datastore_1.database_1.table_1.nameField
                        text_field_key: datastore_1.database_1.table_1.textField
                        type_field_key: datastore_1.database_1.table_1.typeField
```

#### **Dashboard Selector Properties**
* **"category"** - (String, Optional) The text shown above the dropdown for the choices in this object.  Default:  "Select an option..."
* **"choices"** - (String, Required) A JSON object that maps unique choice IDs to either **dashboard selector** objects or **dashboard** objects.
* **"name"** - (String, Required) The name of this choice.  The top-level **dashboard selector** object does not need a **"name"**.

#### **Dashboard Properties**
* **"contributors"** - (Object, Optional) A JSON object that maps contributor keys to contributor objects.  Neon will show contributors at the bottom of each widget unless that widget configures its own **"contributorKeys"** (see [**Visualization Bindings**](#visualization-bindings)).  Please see [**Contributor Objects**](#contributor-objects).
* **"fields"** - (String, Optional) A JSON object that maps the unique field keys to field paths for the fields that are used in this dashboard.  Please see [**Table and Field Paths**](#table-and-field-paths).
* **"filters"** - (String, Optional) A JSON array that contains dashboard filters that are added to the dashboard on load.  Please see [**Filter Object**](#filter-object).
* **"layout"** - (String, Required) The layout for the dashboard.
* **"name"** - (String, Required) The name of this choice.  The dashboard name (shown in the navbar) will be composed from this **"name"** and the **"name"** of each parent choice.
* **"options"** - (Object, Optional) A JSON object that contains dashboard options.  Please see [**Dashboard Options Object**](#dashboard-options-object).
* **"relations"** - (Object, Optional) A JSON object that contains dashboard relations.  Please see [**Relations Object**](#relations-object).
* **"tables"** - (String, Optional) A JSON object that maps the unique table keys to table paths for all of the tables that are used in this dashboard.  Please see [**Table and Field Paths**](#table-and-field-paths).
* **"visualizationTitles"** - (Object, Optional) A JSON object that maps unique title keys to strings.

#### **Table and Field Paths**
* A **table path** is a string composed of a **datastore ID**, **database name**, and **table name** separated by periods.
* A **field path** is a string composed of a **datastore ID**, **database name**, **table name**, and **field name** separated by periods.

#### **Dashboard Options Object**
The dashboard's **"options"** property is a JSON object that can have the following properties:
* **"colorMaps"** - (Object, Optional) A JSON object that contains the specific colors used on specific fields and values.  Please see [**Color Maps Object**](#color-maps-object).
* **"connectOnLoad"** - (Boolean, Optional) Whether this dataset is automatically displayed when the dashboard is first loaded.  If multiple dashboards have this value set to true, only the first one with this field will be loaded.  If no dashboards have this value set to true, the first one will be loaded.  Default: false.
* **"customRequests"** - (Object, Optional) A JSON object that contains the data for the REST endpoints that can be accessed within the UI.  Please see [**Custom Request Objects**](#custom-request-objects).
* **"customRequestsDisplayLabel"** - (String, Optional) The display label for the navbar menu item to access the configured **"customRequests"**.  Default:  "Custom Requests"
* **"hideFilterValues"** - (Boolean, Optional) Whether to hide the filtered values within the navbar filter chip elements.  This option can be toggled within the UI.  Default:  false
* **"simpleFilter"** - (Object, Optional) Whether to show the **simple filter** (search box) in the navbar and the field on which to filter.  Contains properties **"tableKey"**, **"fieldKey"**, and optionally **"placeholder"**.  The **"tableKey"** must match a key from the dashboard's **"tables"** and the **"fieldKey"** must match a key from the dashboard's **"fields"**.  If **"simpleFilter"** is not defined, the **simple filter** is not shown.

#### **Dashboard Options Object Example**
```yaml
options:
    connectOnLoad: true
    simpleFilter:
        tableKey: table_key
        fieldKey: text_field_key
        placeholder: "Search..."
```

#### **Color Maps Object**
The **"colorMaps"** property is a JSON object that maps database names to table names to field names to values and colors.  Whenever a dashboard is configured to show a color for one of the listed values, the configured color is used.  Colors can be either hex or RGB strings.

#### **Color Maps Object Example**
```yaml
colorMaps:
  database_1:
    table_1:
      field_1:
        value_1: '#FF0000'
        value_2: '#00FF00'
        value_3: '#0000FF'
```

#### **Contributor Objects**

Each **contributor** object can have the following properties:

* **"abbreviation"** - (String, Required) The contributor's abbreviation to show in the widgets.
* **"contactEmail"** - (String, Optional) The contributor's contact email address.
* **"contactName"** - (String, Optional) The contributor's contact name.
* **"description"** - (String, Optional) The contributor's description.
* **"logo"** - (String, Optional) The contributor's logo.  This file path must be located within the Neon Dashboard's `src/app/assets/custom/` folder.
* **"orgName"** - (String, Optional) The contributor's organization name.
* **"website"** - (String, Optional) The contributor's website.

#### **Custom Request Objects**

Each **custom request** object can have the following properties:

* **"date"** - (String, Optional) If set, Neon will automatically append the current timestamp to the request's body as a property named by this string.  Default:  none
* **"endpoint"** - (String, Required) The REST endpoint for the request.
* **"id"** - (String, Optional) If set, Neon will automatically generate a unique ID for the request and append it to the request body as a property named by this string.  Default:  none
* **"notes"** - (String, Optional) Notes for the request to show the user.  Default:  none
* **"pretty"** - (String, Required) The pretty name for the request to show the user.
* **"properties"** - (String, Optional) An array of JSON objects for the request body.  Neon will show a dropdown or text input box for each object.  Each object can have:
  * **"choices"** - (Array, Optional) An array of JSON objects that Neon will show as choices in a dropdown; if not defined, Neon will show a text input box.  Each object must have a **"pretty"** property containing the pretty name to show in the dropdown and a **"value"** property containing the actual value to send in the request body.
  * **"name"** - (String, Required) The actual name for the property in the request body.
  * **"pretty"** - (String, Required) The pretty name for the property to show the user.
  * **"value"** - (String, Optional) The default value to show in the text input box.  Default:  none
* **"type"** - (String, Optional) The request type (GET, POST, PUT, or DELETE).  Default:  "POST" if **"properties"** exist, otherwise "GET"
* **"showResponse"** - (Boolean, Optional) Whether to show the request's response.  Default:  false

#### **Custom Requests Object Example**

```yaml
customRequests:
    - endpoint: http://localhost:1234/add
      type: post
      date: creationDate
      id: employeeId
      pretty: Add New Employee
      properties:
          - name: name
            pretty: Employee Name
          - name: type
            pretty: Employee Category
            choices:
              - value: eng
                pretty: Engineering
              - value: admin
                pretty: Administration
    - endpoint: http://localhost:5678/restart
      type: get
      pretty: Restart Analytic Module
```

#### **Filter Objects**

TODO

#### **Filters Object Example**

TODO

#### **Relation Objects**
**Relations** are a way of defining fields that, whenever filtered, cause the Neon Dashboard to automatically generate additional filters on corresponding fields in other datastores/databases/tables.

The **"relations"** property is an array of **relation** objects.  Each **relation** object contains two or more field paths (or arrays of field paths) that correspond to one another.  If a **relation** object contains an array of field paths, the filter must contain each field within the array.  Additionally, a **relation** object containing arrays of field paths must ensure each array is the same size.

#### **Relations Object Example**
```yaml
relations:
    - - datastore_1.database_1.table_1._id
      - datastore_1.database_1.table_2.docId
      - datastore_2.database_2.table_3.rowId
    - - - datastore_1.database_1.table_1.latitude
        - datastore_1.database_1.table_1.longitude
      - - datastore_1.database_1.table_2.latitude
        - datastore_1.database_1.table_2.longitude
```

### **Layouts Example**
```yaml
layouts:
    layout_1:
        - type: dataTable
          col: 1
          row: 1
          sizex: 4
          sizey: 6
        - type: map
          col: 5
          row: 1
          sizex: 4
          sizey: 6
          bindings:
              layers:
                  tableKey: table_key_1
                  latitudeField: latitude_field_key
                  longitudeField: longitude_field_key
        - type: aggregation
          col: 9
          row: 1
          sizex: 4
          sizey: 6
          bindings:
              tableKey: table_key_1
              title: Totals
              type: bar-v
              xField: id_field_key
}
```

### **Visualization Object**

The **visualization** object can have the following properties:

**"type"** - (String, Required) The type of visualization:

* Aggregation:  **"aggregation"**
* Annotation Viewer:  **"annotationViewer"** (*WIP*)
* Data Table:  **"dataTable"**
* Document Viewer:  **"documentViewer"**
* Map:  **"map"**
* Media Viewer:  **"mediaViewer"**
* Network Graph:  **"networkGraph"**
* News Feed:  **"newsFeed"**
* Text Cloud:  **"textCloud"**
* Thumbnail Grid:  **"thumbnailGrid"**
* Timeline:  **"timeline"** (*deprecated*)
* Wiki Viewer:  **"wikiViewer"**

**"col"** - (Number, Optional) The starting column position of the visualization (between 1 and 12 inclusive). Note that if another visualization is in that spot, the visualization will appear in the next available position.

**"row"** - (Number, Optional) The starting row position of the visualization (1 or higher). Note that if another visualization is in that spot, the visualization will appear in the next available position.

**"sizex"** - (Number, Optional) The starting width of the visualization (1 or higher).  The width is divided into 12 columns.  Therefore, a visualization with a **sizeX** of 4 would have a width of 1/3rd of the screen.

**"sizey"** - (Number, Optional) The starting height of the visualization (1 or higher).  The height of a visualization is directly proportional to its width.

**"bindings"** - (Object, Optional) The data bindings used by the visualization. Whenever visualizations are created (by loading a dashboard or dataset) they will use the data bindings defined in the **layouts** property of the configuration file to set their starting database, table, fields, and other options. If no data binding is set for a database, table, or field, a visualization will use the first option in the appropriate dropdown (or no option). We suggest that you configure bindings for visualization objects in the **layouts** property so the dashboard shows the desired data whenever the corresponding dataset is loaded.

### **Visualization Bindings**

#### **Note on Field Bindings**

Any field binding may be a field key (in the **"fields"** from the **"dashboards"** config) or just a field name.  However, the binding will try to resolve the string as a field key first, then a field name.  So if you want to set a field binding on a field name, but that field name string is also used as a field key, then the field binding will be set to the field key and not the field name.  We recommend that you define your field keys with strings that probably won't also be used as field names within your datastores in order to avoid this unlikely issue.

(Example - Don't do this!)
```yaml
datastores:
    datastore_1:
        host: localhost
        type: elasticsearchrest
        databases:
            database_1:
                tables:
                    table_1:
                        fields:
                            - columnName: field_1
                            - columnName: field_2
dashboards:
    name: Dashboard 1
    layout: layout_1
    tables:
        table_key_1: datastore_1.database_1.table_1
    fields:
        field_1: datastore_1.database_1.table_1.field_2
layouts:
    layout_1:
        - type: dataTable
          bindings:
              // This will resolve as the field key "field_1" that maps to the field name "field_2"!
              sortField: field_1
```

#### **Bindings For All Visualizations**

Required:
* **database** - The name of the database.  Only needed if `tableKey` is not defined.
* **table** - The table name.  Only needed if `tableKey` is not defined.
* **tableKey** - A table key defined in the **"tables"** from the **"dashboards"** config.  Overrides `database` and `table`.

Optional:
* **contributionKeys** - An array of contributor keys from [the dashboard's **"contributors"** property](#dashboard-properties).  If not defined, this widget will show all of the configured contributors.  This can be an empty array.
* **filter** - An object, or an array of objects, that each have `lhs`, `operator`, and `rhs` string properties; each configured object generates a hidden filter for the visualization.
* **hideUnfiltered** - Whether to hide all the visualization data if it is unfiltered.  Default:  `false`
* **limit** - The query results limit.  Default:  varies
* **title** - The visualization title shown in the UI.  If the string equals a title key in the **"visualizationTitles"** from the **"dashboards"** config then the visualization uses the title defined there.  Default:  the visualization name

#### **Aggregation Bindings**

Required:
* **type** - The visualization type.  Options:  `'bar-h'`, `'bar-v'`, `'doughnut'`, `'histogram'`, `'line'`, `'list'`, `'line-xy'`, `'pie'`, `'scatter'`, `'scatter-xy'`.
* **xField** - The field name for the X-axis data.

Required if **type** is `'list-xy'` or`'scatter-xy'`:
* **yField** - The field name for the Y-axis data.

Optional:
* **aggregation** - The aggregation type.  Options:  `'count'`, `'average'`, `'sum'`, `'max'`, `'min'`.  Default:  `'count'`
* **aggregationField** - The field name for all queries with non-count **aggregation** types.
* **axisLabelX** - The x-axis label.  Default:  the xField name
* **axisLabelY** - The y-axis label.  Default:  the yField name
* **countByAggregation** - If `true`, shows the total number of aggregation elements in the visualization title.  If `false`, shows the sum of aggregation elements in the visualization title.  Default:  `false`
* **dualView** - Whether to show a dual view with main and zoomed visualizations.  Ignored unless **type** is `'histogram'`, `'line'`, or `'line-xy'`.  Options:  `'on'` (always on), `'filter'` (only show zoom on filter), or other (always off).  Default:  `''` (none)
* **granularity** - The granularity of any date axis.  Options:  `'minute'`, `'hour'`, `'day'`, `'month'`, `'year'`.  Default:  `'year'`
* **groupField** - The field name for the groups in the visualization (stacked bars, separate lines, pie layers, etc.).
* **hideGridLines** - Whether to hide grid lines.  Default:  `false`
* **hideGridTicks** - Whether to hide grid ticks.  Default:  `false`
* **ignoreSelf** - Whether the visualization will ignore its own filters.  Default:  `false`
* **lineCurveTension** - The bezier curve tension of lines (between 0 and 1).  Default:  `0.3`
* **lineFillArea** - Whether to fill the area below lines.  Default:  `false`
* **logScaleX** - Whether to use a log scale for the X-axis.  Default:  `false`
* **logScaleY** - Whether to use a log scale for the Y-axis.  Default:  `false`
* **notFilterable** - Whether the visualization is not filterable.  Default:  `false`
* **requireAll** - Whether to AND all of the filters rather than OR them.  Default:  `false`
* **savePrevious** - Whether to save previous data that may be hidden once filtered.  Default:  `false`
* **scaleMaxX** - The maximum value of the X-axis.  If none, it will be set automatically.  Default:  `''` (none)
* **scaleMinX** - The minimum value of the X-axis.  If none, it will be set automatically.  Default:  `''` (none)
* **scaleMaxY** - The maximum value of the Y-axis.  If none, it will be set automatically.  Default:  `''` (none)
* **scaleMinY** - The minimum value of the Y-axis.  If none, it will be set automatically.  Default:  `''` (none)
* **showHeat** - Whether to show heat in a `list` visualization.  Default:  `false`
* **showLegend** - Whether to show the legend whenever needed.  Default:  `true`
* **sortByAggregation** - Whether to sort by the aggregation value (high to low) rather than alphabetically.  Default:  `false`
* **timeFill** - Whether to fill the visualization with missing times for any date axis based on the **granularity**.  Default:  `false`
* **yPercentage** - The percentage of the visualization width used for the Y-axis.  Default:  `0.3`

#### **Annotation Viewer Bindings**
TODO

#### **Data Table Bindings**

Optional:
* **allColumnStatus** - (Deprecated; please use **showFields**) Whether to show or hide the data columns on load.  Options:  `'show'`, `'hide'`.  Default:  `'show'`
* **arrayFilterOperator** - The operator to use on multiple filters.  Default:  `'and'`.  Options:  `'and'`, `'or'`
* **colorField** - The field name for RGB or HEX colors.
* **customColumnWidths** - An array of arrays.  Each nested array contains exactly two elements:  a field name (or field key) and a width number.
* **customEventsToPublish** - An array of objects with a string `id` (event name) and an array `fields` of objects with a string `field` (field name).  Default:  `[]`
* **exceptionToStatus** - (Deprecated; please use **showFields**) The array of fields names to exempt from **allColumStatus**.
* **fieldsConfig** - (Deprecated; please use **showFields**) An array of objects with `name` and `hide` properties to configure the columns that are shown on initialization and their order.  Overrides **exceptionToStatus**.  Default:  `[]`
* **filterable** - Whether the visualization is filterable.  Default:  `false`
* **filterFields** - The array of field names to use for the filters.
* **heatmapDivisor** - The divisor used with **heatmapField**.  Default:  `0` (none)
* **heatmapField** - The field name for coloring the rows with an orange-to-blue heatmap.
* **idField** - The field name for the unique IDs.  Sends **select_id** events.
* **ignoreSelf** - Whether the visualization will ignore its own filters.  Default:  `true`
* **reorderable** - Whether columns are reorderable.  Default:  `true`
* **showFields** - An array of field names of fields to show in the table.  If not defined, shows all fields in the table.
* **singleFilter** - Whether to only allow a single filter at a time.  Default:  `false`
* **skinny** - Whether to show the table with skinny styling.  Default:  `false`
* **sortDescending** - Whether to sort the rows descending.  Default:  `true`
* **sortField** - The field name for the query sorting.

#### **Document Viewer Bindings**

Required:
* **dataField** - The field name for the main text data.

Optional:
* **dateField** - The field name for the dates.
* **hideSource** - Whether to hide the source button.  Default:  `false`
* **idField** - The field name for the unique IDs.  Sends **select_id** events.
* **metadataFields** - The array of fields to show in the Document Viewer in addition to document text.  Please see [**Document Viewer Metadata Object Options**](#document-viewer-metadata-object-options)
* **nameWidthCss** - The CSS for the width of the name (left column).
* **popoutFields** - The array of fields to show in the Document Viewer popout.  Please see [**Document Viewer Metadata Object Options**](#document-viewer-metadata-object-options)
* **showSelect** - Whether to show the select button.  Default:  `false`
* **showText** - Whether to show the text button.  Default:  `false`
* **sortDescending** - Whether to sort the documents descending.  Default:  `true`
* **sortField** - The field name for the query sorting.

#### **Map Bindings**

Optional:
* **clusterPixelRange** - The clustering pixel range.  Default:  `15`
* **customServer** A custom map server object with `useCustomServer`, `mapUrl`, and `layer` string properties.
* **disableCtrlZoom** - Whether to disable ctrl-zoom behavior.  Default:  `false`
* **east** - The right bounds of the map view on initialization (between -180 and 180).
* **hoverPopupEnabled** - Whether to enable hover popups.  Default:  `false`
* **hoverSelect** - A configuration object with a `hoverTime` number property.
* **layers** - An array of layer configuration objects.  Please see [**Map Layer Object Options**](#map-layer-object-options)
* **mapType** - The map type.  Options:  `'Leaflet'`, `'Cesium'`.  Default:  `'Leaflet'`
* **minClusterSize** - The minimum clustering size.  Default:  `5`
* **north** - The top bounds of the map view on initialization (between -90 and 90).
* **showPointDataOnHover** - Whether to show point coordinates whenever you hover over a point.  Default:  `false`
* **singleColor** - Whether to only show points in a single color.  Default:  `false`
* **south** - The bottom bounds of the map view on initialization (between -90 and 90).
* **title** - The visualization title shown in the UI.  Default:  the visualization name
* **west** - The left bounds of the map view on initialization (between -180 and 180).

#### **Media Viewer Bindings**

Required:
* **idField** - The field name for the unique IDs.  Listens for **select_id** events.
* **linkFields** - The array of field names for the media links.

Optional:
* **autoplay** - Whether to autoplay videos.  Default:  `false`
* **border** - The border color.  Options:  `'blue'`, `'grey'`, `'red'`, `'yellow'`.  Default:  `''` (none)
* **clearMedia** - Whether to clear all media before querying.  Default:  `false`
* **customEventsToReceive** - An array of objects with a string `id` (event name) and an array `fields` of objects with a string `field` (field name) and a string `label` (pretty name).  Added given link data as media to existing tabs (with slider if needed).  Default:  `[]`
* **delimiter** - The delimiter for the linkField.  Default:  `','`
* **id** - The ID to show on initialization.  Default:  `''` (none)
* **linkPrefix** - The prefix to add to the start of all links.  Default:  `''` (none)
* **maskField** - The field name for the mask media links.
* **maskLinkPrefix** - The prefix to add to the start of all mask links.  Default:  `''` (none)
* **nameField** - The field name for the media names.
* **oneTabPerArray** - If `true`, shows all elements from an array in the linkField within a single tab.  If `false`, shows all elements from an array in the linkField within separate tabs.  Default:  `false`
* **resize** - Whether to resize the media to fit the visualization.  Default:  `true`
* **sliderValue** - The initial value for the slider (between 0 and 100) shown under images with masks.  Default:  `0`
* **sortField** - The field name for the query sorting.
* **typeField** - The field name for the media types with values `'img'`, `'vid'`, or other.
* **typeMap** - An object of extensions mapped to media types (`'img'`, `'vid'`, or other), like `{"jpg": "img", "mov": "vid", "png": "img"}`.  Ignored if **typeField** is populated.  Default:  `{}`
* **url** - Shows the media at the given URL.  Default:  `''` (none)

#### **Network Graph Bindings**
TODO

#### **News Feed Bindings**

Required:
* **contentField** - The field for the dropdown content.
* **dateField** - The field for the date.
* **idField** - The field name for the unique IDs.

Optional:
* **contentLabel** - The label for the dropdown content.
* **filterField** - The field name to use for the filter.
* **id** - The ID to show on initialization.  Default:  `''` (none)
* **ignoreSelf** - Whether the visualization will ignore its own filters.  Default:  `false`
* **multiOpen** - Whether multiple dropdowns can be open at the same time.  Default:  `false`
* **secondaryContentField** - The field for the secondary dropdown content.
* **secondaryContentLabel** - The label for the secondary dropdown content.
* **sortDescending** - Whether to sort the elements descending.  Default:  `false`
* **sortField** - The field name for the query sorting.
* **titleContentField** - The field for the title.  Default:  the `contentField`

#### **Text Cloud Bindings**

Required:
* **dataField** - The field name for the text data.

Optional:
* **ignoreSelf** - Whether the visualization will ignore its own filters.  Default:  `true`
* **paragraphs** - Whether to show the text elements in separate paragraphs within the visualization.  Default:  `false`
* **showCounts** - Whether to show the counts next to the text elements.  Default:  `false`
* **sizeAggregation** - The capitalized aggregation type.  Options:  `'COUNT'`, `'AVG'`, `'SUM'`, `'MIN'`, `'MAX'`.  Default:  `'AVG'`
* **sizeField** - The field name for the text size.

#### **Thumbnail Grid Bindings**

Required:
* **linkField** - The field name for the media links.

Optional:
* **ascending** - Whether to sort ascending.  Default:  `false`
* **autoplay** - Whether to autoplay videos.  Default:  `false`
* **border** - The border type from the following list.  Overrides **categoryField**.  Default:  `''`
  * `'percentField'` (uses the **percentField** and **borderPercentThreshold**)
  * `'percentCompare'` (uses the **compareField**, **percentField**, and **borderCompareValue**, and **borderPercentThreshold**)
  * A color.  Options:  `'blue'`, `'grey'`, `'red'`, `'yellow'`
* **borderCompareValue** - The value to compare to the value in **compareField** if **border** is `'percentCompare'`.  Default:  `''` (none)
* **borderPercentThreshold** - The threshold to compare to the value in **percentField** if **border** is either `'percentCompare'` or `'percentField'`.  Default:  `0.5`
* **canvasSize**
* **categoryField** - The field name for the media category to compare to the **objectIdField** and set the border if **border** is not set.
* **compareField** - The field name to compare to the **borderCompareValue** if **border** is `'percentCompare'`.
* **customEventsToPublish** - An array of objects with a string `id` (event name) and an array `fields` of objects with a string `field` (field name).  Default:  `[]`
* **cropAndScale** - Whether to crop and/or scale the media in the grid.  Options:  `'scale'`, `'crop'`, `'both'`.  Default:  `''` (none)
* **defaultLabel** - The default label to show for the media if their **objectNameField** and **predictedNameField** are empty.  Default:  `''` (none)
* **defaultPercent** - The default percent to show for the media if their **percentField** is empty.  Default:  `''` (none)
* **detailedThumbnails**
* **filterField** - The field name to use for the filter.
* **idField** - The field name for the unique IDs.
* **ignoreSelf** - Whether the visualization will ignore its own filters.  Default:  `false`
* **linkPrefix** - The prefix to add to the start of all links.  Default:  `''` (none)
* **nameField** - The field name for the media names shown in the title tooltip.
* **objectIdField** - The field name for the media identifier to compare to the **categoryField** and set the border if **border** is not set.
* **objectNameField** - The field name for the media names shown in the labels.
* **openOnMouseClick** - Whether to open the media in a new tab on mouse click.  Default:  `true`
* **percentField** - The field name for the media percents.
* **predictedNameField** - The field name for the media names shown in the labels.
* **showLabelName**
* **sortDescending** - Whether to sort the documents descending.  Default:  `true`
* **sortField** - The field name for the media query sorting.
* **textMap** - An object with the optional properties `actual`, `name`, and `prediction` mapped to labels shown in the title tooltip.  Default:  `{ actual: 'Actual', name: '', prediction: 'Prediction' }`
* **truncateLabel**
* **typeField** - The field name for the media types (with values `'img'`, `'vid'`, or other).
* **typeMap** - An object of extensions mapped to media types (`'img'`, `'vid'`, or other), like `{"jpg": "img", "mov": "vid", "png": "img"}`.  Ignored if **typeField** is populated.  Default:  `{}`
* **viewType** - The view type.  Options:  `card`, `details`, `title`.  Default:  `title`

#### **Timeline Bindings**

Required:
* **dateField** - The field name for the dates.

Optional:
* **granularity** - The date granularity.  Options:  `'minute'`, `'hour'`, `'day'`, `'month'`, `'year'`.  Default:  `'day'`
* **yLabel** - The Y-axis label.  Default:  `'Count'`

#### **Wiki Viewer Bindings**

Required:
* **idField** - The field name for the unique IDs.  Listens for **select_id** events.
* **linkField** - The field name for the wikipedia links.

Optional:
* **id** - The ID to show on initialization.  Default:  `''` (none)

#### **Document Viewer Metadata Object Options**

Example:
```JSON
{
    "type": "document-viewer",
    "sizex": 4,
    "sizey": 4,
    "row":   0,
    "col":   0,
    "bindings": {
        "title": "myTitle",
        "metadataFields": [
            {
                "name": "Date",
                "field": "dateRecorded"
            },
            {
                "name": "Location",
                "field": "location.name"
            },
            {
                "name": "Poster",
                "field": "postedBy"
            }
        ]
    }
}
```

The Document Viewer can display a configurable set of data in addition to document text. The **metadataFields** option is used to specify what additional fields should be shown (the "field" option of each entry in the list) as well as what label it should have (the "name" option).

#### **Map Layer Object Options**

Required:
* **database** - The name of the database.  Only needed if `tableKey` is not defined.
* **latitudeField** - The name of the latitude field.
* **longitudeField** - The name of the longitude field.
* **table** - The name of the table.  Only needed if `tableKey` is not defined.
* **tableKey** - A table key defined in the **"tables"** from the **"dashboards"** config.  Overrides `database` and `table`.

Optional:
* **cluster** - Whether to cluster the points in the map layer.
* **colorField** - The name of the color field.
* **dateField** - The name of the date field.
* **hoverPopupField** - The name of the hover popup field.
* **idField** - The name of the ID field.
* **sizeField** - The name of the size field.
* **title** - A label for the map layer displayed in the UI. Default: The map **title**.

### **Other Properties**

Optional configuration file properties:
* **"about"** - A string or object containing data for the About panel.  Please see the [**About Property Examples**](#about-property-examples).
* **"hideImport"** - Whether to hide the import navbar menu item.  Default:  false
* **"neonServerUrl"** - The URL for the Neon Server.  Default: `"../neon"`
* **"neonTools"** - An object containing data for the Tools panel.  Please see the [**Neon Tools Property Examples**](#neon-tools-property-examples).
* **"projectIcon"** - The icon for the application tab in the web browser.  Default: `"src/assets/favicon.blue.ico"`
* **"projectTitle"** - The text for the application tab in the web browser.  Default: `"Neon"`

#### **About Property Examples**

String example:

```yaml
about: |
    <div class="about-subheader">
    <H2>Team</H2>
    </div>
    <p>This version of Neon is sponsored by Next Century Corporation.</p>
    <p><a href="http://nextcentury.com" target="_blank">Website</a></p>
    <p>Team Lead:  Thomas Schellenberg</p>
    <p><img class="center" src="./assets/icons/dashboard/ncc_logo.png"></p>
    <hr>
```

Object example:

```yaml
about:
    info:
        data: "This version of Neon is sponsored by Next Century Corporation."
        header: "Team"
        icon: "./assets/icons/dashboard/ncc_logo.png"
        leader: "Team Lead:  Thomas Schellenberg"
        link: "http://nextcentury.com"
    memberList:
        data:
          - Person 1
          - Person 2
          - Person 3
          - Person 4
        header: Team Members
    misc:
        - data: "Description for Section X"
          header: "Section X"
        - data: "Description for Section Y"
          header: "Section Y"
```

#### **Neon Tools Property Examples**

Note:  All of the image file paths referenced under `neonTools->contributors->img->src` must be located within the Neon Dashboard's `src/app/assets/custom/` folder.

```yaml
neonTools:
    programName: My Program
    programSponsor: My Company
    programManager: My Manager
    principalInvestigator: My PI
    contributors:
        - name: 'Contributor 1'
          img:
              src: 'contributor_1.jpg'
          contact:
              firstName: 'Contact First Name 1'
              lastName: 'Contact Last Name 1'
              phone: 'Contact Phone Number 1'
              email: 'contact_1@contributor_1.com'
        - name: 'Contributor 2'
          img:
              src: 'contributor_2.png'
          contact:
              firstName: 'Contact First Name 2'
              lastName: 'Contact Last Name 2'
              phone: 'Contact Phone Number 2'
              email: 'contact_2@contributor_2.edu'
```
