# Neon Dashboard Event Guide

Events listed in:  [**src/neon-namespaces.ts**](./src/neon-namespaces.ts)

Event Channel | Intent | Event Payload
--------------|--------|--------------
DASHBOARD_MESSAGE | Shows an error message. | { error?: Error | Exception | string, message: string }
DASHBOARD_REFRESH | Signals a resize on all of the widgets. | {}
SELECT_ID | Selects a data item in the dashboard.  Some visualizations will update to highlight this data selection. | { item: any, metadata: any }
SHOW_OPTION_MENU | Opens the options menu from the navbar to show a specific visualization's options. | { changeOptions: Function, createLayer: Function, deleteLayer: Function, exportData: Function, finalizeCreateLayer: Function, finalizeDeleteLayer: Function, handleChangeSubcomponentType: Function, options: WidgetOptionCollection }
TOGGLE_FILTER_TRAY | Toggles the filter tray in the navbar. | { show: boolean }
TOGGLE_SIMPLE_SEARCH | Toggles the simple search in the navbar. | { show: boolean }
TOGGLE_VISUALZATIONS_SHORTCUT | Toggles the visualizations shortcut in the navbar. | { show: boolean }
WIDGET_ADD | Adds a new widget to the dashboard. | { widgetGridItem: NeonGridItem }
WIDGET_CONTRACT | Contracts a widget within the dashboard. | { widgetGridItem: NeonGridItem }
WIDGET_DELETE | Deletes a widget from the dashboard. | { id: string }
WIDGET_EXPAND | Expands a widget within the dashboard. | { widgetGridItem: NeonGridItem }
WIDGET_MOVE_TO_BOTTOM | Moves a widget to the bottom of the dashboard. | { widgetGridItem: NeonGridItem }
WIDGET_MOVE_TO_TOP | Moves a widget to the top of the dashboard. | { widgetGridItem: NeonGridItem }
WIDGET_REGISTER | Registers a widget with the dashboard. | { id: string, widget: BaseNeonComponent }
WIDGET_UNREGISTER | Unregisters a widget with the dashboard. | { id: string }
