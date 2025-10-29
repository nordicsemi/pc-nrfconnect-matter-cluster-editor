# {{app_name}}

The {{app_name}} provides a graphical user interface for creating and editing Matter clusters, cluster extensions, and device types in accordance with the Matter Data Model. It is available as one of the applications in [nRF Connect for Desktop](https://docs.nordicsemi.com/bundle/nrf-connect-desktop/page/index.html).

To work with Matter using Nordic Semiconductor devices, read the [Matter protocol documentation in the {{NCS}}](https://docs.nordicsemi.com/bundle/ncs-latest/page/nrf/protocols/matter/index.html). For more information about the Matter Data Model, see the [Matter Data Model and device types](https://docs.nordicsemi.com/bundle/ncs-latest/page/nrf/protocols/matter/overview/data_model.html) page.

## Overview

The Matter Data Model defines clusters that are common for all manufacturers and can be used as a base for devices.
Sometimes, it is necessary to create a new cluster for a specific device, or extend an existing cluster to add new attributes, commands, or events that are specific to the device.

The {{app_name}} allows you to perform such operations using a graphical user interface.
If the desired device type is not listed in the Matter Device Type Library specification, you can use the tool to create a new one, and include it in the project.

The app supports the following features:

- Creating a new manufacturer-specific cluster that contains attributes, commands, and events.
- Creating extensions to the existing clusters defined in the Matter data model.
- Adding new enumerations and structures.
- Creating a new device type that is not listed in the Matter Device Type Library Specification.
- Opening and editing XML files that contain multiple clusters, device types, or cluster extensions.

Based on your edits, the tool generates a new XML file with the cluster definition or an extension to the existing cluster.
You can use the XML file as an argument in the Matter west commands to add the XML file to the Matter ZCL database.

## Installation

You can run the {{app_name}} when you [download and install nRF Connect for Desktop](https://www.nordicsemi.com/Products/Development-tools/nRF-Connect-for-Desktop/Download).

## Supported devices

The {{app_name}} has no specific device requirements.

## Application source code

The code of the application is open source and [available on GitHub](https://github.com/NordicSemiconductor/pc-nrfconnect-matter-cluster-editor).
Feel free to fork the repository and clone it for secondary development or feature contributions.
