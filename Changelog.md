## 0.1.0 - 2025-06-24

-   Initial public release.

## 0.2.0

-   Fixed an issue where saving to an XML file would result in missing fields.
-   Resolved a problem where "false" and 0 values were not correctly saved in
    the XML file.
-   Removed the "array" type from the type list and added a dedicated button to
    mark a field as an array.
-   Fixed a bug where the edit box fields were not displayed for existing items.
-   Improved attribute name saving: now only the "name" field is stored for each
    attribute, as required by the ZAP tool specification.
