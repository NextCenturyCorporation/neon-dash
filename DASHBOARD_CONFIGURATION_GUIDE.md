# **Neon Dashboard Configuration Guide**

## **Table of Contents**
* [**The Configuration File**](#the-configuration-file)
  * [**Note on Elasticsearch**](#note-on-elasticsearch)
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
    * [**Relations Object**](#relations-object)
    * [**Relations Object Example**](#relations-object-example)
    * [**Contributors Object**](#contributors-object)
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

To load a preconfigured Neon Dashboard, create a Neon Dashboard configuration file at [**app/config/config.json**] or [**app/config/config.yaml**].  If **config.json** is present, **config.yaml** will be ignored.

Sample configuration files are available in the git repository at [**app/config/sample.config.json**](./src/app/config/sample.config.json) and [**app/config/sample.config.yaml**](./src/app/config/sample.config.yaml).

## **The Configuration File**

The configuration file contains the following properties:
* **"datastores"** - (Object, Required) Configures the datastores that are available in the Neon Dashboard.  Please see [**Datastores Object**](#datastores-object) for details.
* **"dashboards"** - (Object, Required) Configures the dashboards that are available in the Neon Dashboard.  Please see [**Dashboards Object**](#dashboards-object) for details.
* **"layouts"** - (Object, Required) Configures the visualization layouts that are available in the Neon Dashboard.  The **"layouts"** property is a JSON object that maps unique layout names to arrays of visualization objects.  Please see [**Visualization Object**](#visualization-object) for details.

### **Note on Elasticsearch**

ES datastores do not have **databases** or **tables** but do have **indexes** and **types**.  In Neon, and its configuration file, **database** properties refer to ES **indexes** and **table** properties refer to ES **types**.

### **Datastores Object**

#### **Datastores Overview**
* The **"datastores"** property is a JSON object that maps unique datastore IDs to **datastore** JSON objects.
* The **datastore** object contains the **"host"**, **"type"**, and **"databases"** properties.
* The **"databases"** property is a JSON object that maps unique database names to **database** JSON objects.
* The **database** object contains the **"tables"** property.
* The **"tables"** property is a JSON object that maps unique table names to **table** JSON objects.
* The **table** object contains optional properties.

#### **Datastores Example**
```yaml
datastores:
    datastore_id_1:
        host: localhost
        type: elasticsearchrest
        databases:
            database_name_1:
                prettyName: Database 1
                tables:
                    table_name_1:
                        prettyName: Table 1
    datastore_id_2:
        host: http://1.2.3.4:9200
        type: elasticsearchrest
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
* **"type"** - (String, Required) The type of datastore:  elasticsearchrest.

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
* **"type"** - (String, Optional) The field type in datastore terminology.  If not included, Neon will determine the field type automatically.

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
* The **dashboard selector** object contains **"choices"** and **"name"** properties.
* The **"choices"** property is a JSON object that maps unique choice IDs to choices for the selector which are either **dashboard selector** objects or **dashboard** objects.
* The **dashboard** object contains **"name"**, **"layout"**, **"tables"**, and **"fields"** properties, as well as other optional properties.

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
* **"contributors"** - (Object, Optional) A JSON object that contains dashboard contributors.  Please see [**Contributors Object**](#contributors-object).
* **"fields"** - (String, Optional) A JSON object that maps the unique field keys to field paths for the fields that are used in this dashboard.  Please see [**Table and Field Paths**](#table-and-field-paths).
* **"layout"** - (String, Required) The layout for the dashboard.
* **"name"** - (String, Required) The name of this choice.  The dashboard name (shown in the navbar) will be composed from this **"name"** and the **"name"** of each parent choice.
* **"options"** - (Object, Optional) A JSON object that contains dashboard options.  Please see [**Dashboard Options Object**](#dashboard-options-object).
* **"relations"** - (Object, Optional) A JSON object that contains dashboard relations.  Please see [**Relations Object**](#relations-object).
* **"tables"** - (String, Required) A JSON object that maps the unique table keys to table paths for all of the tables that are used in this dashboard.  Please see [**Table and Field Paths**](#table-and-field-paths).
* **"visualizationTitles"** - (Object, Optional) A JSON object that maps unique title keys to strings.

#### **Table and Field Paths**
* A **table path** is a string composed of a **datastore ID**, **database name**, and **table name** separated by periods.
* A **field path** is a string composed of a **datastore ID**, **database name**, **table name**, and **field name** separated by periods.

#### **Dashboard Options Object**
The dashboard's **"options"** property is a JSON object that can have the following properties:
* **"connectOnLoad"** - (Boolean, Optional) Whether this dataset is automatically displayed when the dashboard is first loaded.  If multiple dashboards have this value set to true, only the first one with this field will be loaded. Default: false.
* **"simpleFilter"** - (Object, Optional) Whether to show the **simple filter** in the navbar and the field on which to filter.  Contains properties **"tableKey"**, **"fieldKey"**, and optionally **"placeholder"**.  The **"tableKey"** must match a key from the dashboard's **"tables"** and the **"fieldKey"** must match a key from the dashboard's **"fields"**.  If **"simpleFilter"** is not defined, the **simple filter** is not shown.

#### **Dashboard Options Object Example**
```yaml
options:
    connectOnLoad: true
    simpleFilter:
        tableKey: table_key
        fieldKey: text_field_key
        placeholder: "Search..."
```

#### **Relations Object**
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

#### **Contributors Object**

TODO

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
* **contributionKeys**
* **filter** - An object with `lhs`, `operator`, and `rhs` string properties that sets a hidden background filter on the visualization.
* **hideUnfiltered** - Whether to hide all the visualization data if it is unfiltered.  Default:  `false`
* **limit** - The query results limit.  Default:  varies
* **title** - The visualization title shown in the UI.  If the string equals a title key in the **"visualizationTitles"** from the **"dashboards"** config then the visualization uses the title defined there.  Default:  the visualization name
* **unsharedFilterField** - The unshared filter field name.
* **unsharedFilterValue** - The unshared filter value.

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

Required:
* **sortField** - The field name for the query sorting.

Optional:
* **allColumnStatus** - Whether to show or hide the data columns on load.  Options:  `'show'`, `'hide'`.  Default:  `'show'`
* **arrayFilterOperator** - The operator to use on multiple filters.  Default:  `'and'`.  Options:  `'and'`, `'or'`
* **colorField** - The field name for RGB or HEX colors.
* **customColumnWidths** - An array of arrays.  Each nested array contains exactly two elements:  a field name (or field key) and a width number.
* **customEventsToPublish** - An array of objects with a string `id` (event name) and an array `fields` of objects with a string `field` (field name).  Default:  `[]`
* **exceptionToStatus** - The array of fields names to exempt from **allColumStatus**.
* **fieldsConfig** - An array of objects with `name` and `hide` properties to configure the columns that are shown on initialization and their order.  Overrides **exceptionToStatus**.  Default:  `[]`
* **filterable** - Whether the visualization is filterable.  Default:  `false`
* **filterFields** - The array of field names to use for the filters.
* **heatmapDivisor** - The divisor used with **heatmapField**.  Default:  `0` (none)
* **heatmapField** - The field name for coloring the rows with an orange-to-blue heatmap.
* **idField** - The field name for the unique IDs.  Sends **select_id** events.
* **ignoreSelf** - Whether the visualization will ignore its own filters.  Default:  `true`
* **reorderable** - Whether columns are reorderable.  Default:  `true`
* **singleFilter** - Whether to only allow a single filter at a time.  Default:  `false`
* **skinny** - Whether to show the table with skinny styling.  Default:  `false`
* **sortDescending** - Whether to sort the rows descending.  Default:  `true`

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
* **idField** - The field name for the unique IDs.
* **sortField** - The field name for the query sorting.

Optional:
* **contentField** - The field for the news content.
* **dateField** - The field for the news date.
* **filterField** - The field name to use for the filter.
* **id** - The ID to show on initialization.  Default:  `''` (none)
* **ignoreSelf** - Whether the visualization will ignore its own filters.  Default:  `false`
* **primaryTitleField** - The field for the news primary title.
* **secondaryTitleField** - The field for the news secondary title.
* **sortDescending** - Whether to sort the elements descending.  Default:  `false`

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
* **sortField** - The field name for the media query sorting.

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
