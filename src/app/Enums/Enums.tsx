/*
 * Copyright (c) 2025 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: LicenseRef-Nordic-4-Clause
 */

import * as React from 'react';

import ClusterFile from '../Components/ClusterFile';
import Component from '../Components/Component';
import { defaultXMLEnum } from '../defaults';
import { XMLEnum } from '../defines';
import EnumDetails from './EnumDetail';
import EnumEdit from './EnumEdit';

/**
 * EnumsTable component is an implementation of the Component component dedicated to handling XMLEnum objects.
 *
 * This component serves as the main interface for managing enumeration definitions in the Matter
 * Manufacturer Cluster Editor application. Enumerations in Matter define named constants that
 * represent a set of discrete values used across attributes, commands, and events.
 *
 * Key features:
 * - Displays a table of all enumerations defined in the current cluster XML file
 * - Allows users to add, edit, and delete enum definitions
 * - Shows the name and type of each enumeration in a tabular format
 * - Enables expanding rows to view detailed enum information including enum items
 *
 * Component hierarchy:
 * - Uses the generic Component wrapper to provide table functionality
 * - Uses EnumDetails component to render expanded details for enums
 * - Uses EnumEdit component for editing enum data
 * - Interacts with ClusterFile singleton to access and modify the current XML data
 *
 * Enumerations are fundamental data structures in the Matter specification that provide
 * semantic meaning to numeric values, improving code readability and maintainability in
 * Matter implementations.
 *
 * @component
 * @param {Object} props - The input props for the EnumsTable component.
 * @param {boolean} props.active - A boolean indicating whether the component is active.
 * @returns {JSX.Element} A functional component that renders a table of enums.
 */
const EnumsTable: React.FC<{ active: boolean }> = () => {
    const loadAllEnumRows = (): XMLEnum[] => {
        // If there is only one Enum, it is not an array so we need to make it an array
        // We must ensure that each potential array in the cluster has an array type and be
        // ready for using the map function, even if it is actually empty.
        if (!ClusterFile.XMLCurrentInstance.enum) {
            return [];
        }

        if (
            ClusterFile.XMLCurrentInstance.enum &&
            !Array.isArray(ClusterFile.XMLCurrentInstance.enum)
        ) {
            ClusterFile.XMLCurrentInstance.enum = [
                ClusterFile.XMLCurrentInstance.enum,
            ];
        }

        if (ClusterFile.XMLCurrentInstance.enum) {
            ClusterFile.XMLCurrentInstance.enum.forEach(enumItem => {
                if (enumItem.item && !Array.isArray(enumItem.item)) {
                    enumItem.item = [enumItem.item];
                }
                if (enumItem.cluster && !Array.isArray(enumItem.cluster)) {
                    enumItem.cluster = [enumItem.cluster];
                }
            });
            return ClusterFile.XMLCurrentInstance.enum;
        }
        return [];
    };

    const createDetails = (enumItem: XMLEnum) => (
        <EnumDetails
            $={enumItem.$}
            item={enumItem.item}
            cluster={enumItem.cluster}
        />
    );

    const clearFields = (enumItem: XMLEnum) => {
        // Remove redundant boolean fields if they are not set to true
        enumItem.$.array = enumItem.$.array || undefined;
    };

    const saveAllEnumRows = (elements: XMLEnum[]) => {
        ClusterFile.XMLCurrentInstance.enum = elements;
        elements.forEach(enumItem => {
            clearFields(enumItem);
        });
    };

    return (
        <Component<XMLEnum>
            name="Enum"
            headers={['Name', 'Type']}
            detailsBox={createDetails}
            editBox={EnumEdit}
            getCells={(enumItem: XMLEnum) => [
                enumItem.$.name || '',
                enumItem.$.type || '',
            ]}
            loadAllRows={loadAllEnumRows}
            saveAllRows={saveAllEnumRows}
            emptyElement={defaultXMLEnum}
        />
    );
};

export default EnumsTable;
