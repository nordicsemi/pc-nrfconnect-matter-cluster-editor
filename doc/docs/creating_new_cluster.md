# Creating a new Matter cluster

This guide describes how to create a new Matter cluster and save it as an XML file using the Matter Cluster Editor app.

Creating a new Matter cluster involves defining the cluster's basic properties and adding the necessary elements (commands, attributes, events, enumerations, and structures) that make up the cluster's functionality.

{{matter_requirements}}
Make also sure that you are familiar with the cluster's intended functionality, its requirements, and the required fields and their valid values.

To create a new cluster definition, complete the following steps:

1. Open the Clusters tab and fill in the required fields marked with the asterisk.<br/>
   See [Overview](overview.md#cluster-tab) for more information about the fields.

2. Open one by one the Commands, Attributes, and Events tabs and add the required elements to the cluster.<br/>
   Click the **Add** button on the top of each element tab to add a new element to the cluster.
   See [Overview](overview.md#commands-tab) for more information about the fields.

3. Open one by one the Enums and Structures tabs and add the required elements.<br/>
   The enums and structures do not belong to the cluster, but you can assign them to one or more clusters.
   See [Overview](overview.md#enums-tab) for more information about the fields.

4. Click the **Save** button to save the cluster to a file.<br/>
   The cluster name should be unique across all available clusters in the Matter Data Model.

The Matter Cluster Editor app validates that all required fields are filled and saves the file. If there are any errors, you will see an [error message](overview.md#notifications).
