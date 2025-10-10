## 1.0.0 2025-10-30

### Added

-   Validation for all required fields in clusters and device types when loading
    an XML file.
-   Ability to display multiple clusters, device types, and extensions in the
    side panel for easy switching when the loaded XML file contains multiple
    items.
-   Validation before saving to prevent incomplete or invalid data from being
    stored.
-   Dialog for choosing a save strategy: either saving only the edited item or
    saving all items along with the current edits.
-   A new **Clear all** button in the **Utility** section to reset the editor to
    its initial state.
-   Automated actions to update all related fields automatically when a field
    value changes.
-   Telemetry to gather statistics about the application usage.

### Changed

-   Parent dialog now shows a greyed-out background with reduced opacity when
    child dialogs are open.

### Fixed

-   Issue where saving to an XML file would result in missing fields.
-   Issue where `false` and `0` values would not be correctly saved in the XML
    file.
-   Issue with the saving mechanism of the cluster extension to ensure that
    `deviceType` is excluded if it does not have all required non-default
    values.
-   Issue with the saving mechanism of the cluster and the cluster extension
    that would add empty description fields to the cluster itself and to
    attributes, commands, and events.
-   Issue with `DeviceType` cluster assignments that would not be saved to the
    XML file.
-   Issue where box fields for editing would not be displayed for existing
    items.
-   Issue with incorrect storage of the `name` field for each item in the XML
    file.

### Removed

-   The "array" type from the type list, which was replaced by the new button
    for marking a field as an array.

## 0.1.0 - 2025-06-24

-   Initial public release.
