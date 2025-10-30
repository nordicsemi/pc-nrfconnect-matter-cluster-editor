/*
 * Copyright (c) 2025 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: LicenseRef-Nordic-4-Clause
 */

import * as React from 'react';

import ClusterFile from '../Components/ClusterFile';
import Component from '../Components/Component';
import { defaultXMLStruct } from '../defaults';
import { XMLStruct } from '../defines';
import { isTypeNumeric } from '../matterTypes';
import StructDetails from './StructDetail';
import StructEdit from './StructEdit';

/**
 * Implementation of the `Component` component dedicated to `XMLStruct`.
 *
 * The StructTable component serves as the main interface for managing Matter structure definitions
 * in the Matter Manufacturer Cluster Editor application. Structures in Matter define complex data
 * types composed of multiple fields, used for representing complex data models across attributes,
 * commands, and events.
 *
 * Key features:
 * - Displays a table of all structures defined in the current cluster XML file
 * - Allows users to add, edit, and delete structure definitions
 * - Shows each structure's name and fabric scoped status in a tabular format
 * - Enables expanding rows to view detailed structure information including fields
 *
 * Component hierarchy:
 * - Uses the generic Component wrapper to provide table functionality
 * - Uses StructDetails component to render expanded details for structures
 * - Uses StructEdit component for editing structure data
 * - Interacts with ClusterFile singleton to access and modify the current XML data
 *
 * Structures are essential building blocks in the Matter protocol as they allow for defining
 * complex data types that can be used throughout a cluster's interface, promoting consistency
 * and reusability in the data model.
 *
 * @component
 * @param {Object} props - The input props for the component.
 * @param {boolean} props.active - A boolean indicating if the component is active.
 *
 * @returns {JSX.Element} A React functional component that renders a table of XML structures.
 */
const StructTable: React.FC<{ active: boolean }> = () => {
    const loadAllStructRows = (): XMLStruct[] => {
        // If there is only one struct, it is not an array so we need to make it an array
        // We must ensure that each potential array in the cluster has an array type and be
        // ready for using the map function, even if it is actually empty.
        if (
            ClusterFile.XMLCurrentInstance.struct &&
            !Array.isArray(ClusterFile.XMLCurrentInstance.struct)
        ) {
            ClusterFile.XMLCurrentInstance.struct = [
                ClusterFile.XMLCurrentInstance.struct,
            ];
        }

        if (ClusterFile.XMLCurrentInstance.struct) {
            ClusterFile.XMLCurrentInstance.struct.forEach(structItem => {
                if (structItem.item && !Array.isArray(structItem.item)) {
                    structItem.item = [structItem.item];
                }
                if (structItem.cluster && !Array.isArray(structItem.cluster)) {
                    structItem.cluster = [structItem.cluster];
                }
            });
            return ClusterFile.XMLCurrentInstance.struct;
        }
        return [];
    };

    const clearFields = (structItem: XMLStruct) => {
        // Remove redundant boolean fields if they are not set to true
        structItem.$.isFabricScoped = structItem.$.isFabricScoped || undefined;

        // Clear fields for each item in the struct
        if (structItem.item) {
            structItem.item.forEach(item => {
                // Remove redundant boolean fields if they are not set to true
                item.$.array = item.$.array || undefined;
                item.$.isNullable = item.$.isNullable || undefined;
                item.$.isFabricSensitive =
                    item.$.isFabricSensitive || undefined;

                // For non-numeric types we cannot have min and max values
                if (!isTypeNumeric(item.$.type)) {
                    item.$.min = undefined;
                    item.$.max = undefined;
                }

                // For non-array types we cannot have length or minLength values
                if (!item.$.array) {
                    item.$.length = undefined;
                    item.$.minLength = undefined;
                }
            });
        }
    };

    const saveAllStructRows = (structs: XMLStruct[]) => {
        ClusterFile.XMLCurrentInstance.struct = structs;
        structs.forEach(structItem => {
            clearFields(structItem);
        });
    };

    const createDetails = (structItem: XMLStruct) => (
        <StructDetails
            $={structItem.$}
            item={structItem.item}
            cluster={structItem.cluster}
        />
    );

    return (
        <Component<XMLStruct>
            name="Structure"
            headers={['Name']}
            detailsBox={createDetails}
            editBox={StructEdit}
            getCells={(structItem: XMLStruct) => [structItem.$.name || '']}
            loadAllRows={loadAllStructRows}
            saveAllRows={saveAllStructRows}
            emptyElement={defaultXMLStruct}
        />
    );
};

export default StructTable;
