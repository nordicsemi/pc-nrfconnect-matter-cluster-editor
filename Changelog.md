## 0.1.0 - 2025-06-24

-   Initial public release.

## 1.0.0

-   Fixed an issue where saving to an XML file would result in missing fields.
-   Resolved a problem where "false" and 0 values were not correctly saved in
    the XML file.
-   Removed the "array" type from the type list and added a dedicated button to
    mark a field as an array.
-   Fixed a bug where the edit box fields were not displayed for existing items.
-   Improved attribute name saving: now only the "name" field is stored for each
    attribute, as required by the ZAP tool specification.
-   Added validation for all required fields in clusters and device types.
-   Added support for loading and editing XML files with multiple device types.
-   Added smart save functionality that preserves unedited clusters and device
    types when saving multi-item files.
-   Added validation before save to prevent incomplete or invalid data from
    being saved.
-   Added dialog to choose save strategy: save only edited item or save all
    items with edits.
-   Improved UI for selecting items from multi-cluster/multi-device-type files.
-   Added field validation abstraction in edit boxes for reusable validation
    logic.
