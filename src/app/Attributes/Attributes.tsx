/*
 * Copyright (c) 2025 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: LicenseRef-Nordic-4-Clause
 */

import * as React from 'react';

import ClusterFile from '../Components/ClusterFile';
import Component from '../Components/Component';
import { defaultXMLAttribute } from '../defaults';
import { XMLAttribute } from '../defines';
import AttributeDetails from './AttributeDetails';
import AttributeEdit from './AttributeEdit';

/**
 * Implementation of the `Component` component dedicated to `XMLAttribute`.
 *
 * The AttributesTable component is a central UI element in the Matter Manufacturer Cluster Editor
 * that displays and manages Matter attribute definitions. It presents attribute data from the loaded
 * XML cluster file in a tabular format, allowing users to view, add, edit, and delete attributes.
 *
 * This component serves as the main interface for attribute management in the application:
 * - It loads attribute data from the current XML cluster file
 * - It renders attributes in a table showing key properties (name, side, code, type, etc.)
 * - It enables users to expand rows to see detailed attribute information
 * - It provides functionality to edit existing attributes or create new ones
 * - It handles synchronization between UI state and the XML data structure
 *
 * Component hierarchy:
 * - Uses the generic Component wrapper to provide table functionality
 * - Uses AttributeDetails component to render expanded details for attributes
 * - Uses AttributeEdit component for editing attribute data
 * - Interacts with ClusterFile singleton to access and modify the current XML data
 *
 * The component manages XML data synchronization, ensuring that text fields like description
 * and name are kept in sync across different representation properties in the XML structure.
 *
 * @param {Object} props - The input props for the component.
 * @param {boolean} props.active - A flag indicating whether the component is active.
 *
 * @returns {JSX.Element} The rendered `AttributesTable` component.
 */
const AttributesTable: React.FC<{ active: boolean }> = () => {
    const loadAllAttributeRows = (): XMLAttribute[] => {
        // If there is only one Attribute, it is not an array so we need to make it an array
        // We must ensure that each potential array in the cluster has an array type and be
        // ready for using the map function, even if it is actually empty.
        if (!ClusterFile.XMLCurrentInstance.cluster) {
            return [];
        }

        if (
            ClusterFile.XMLCurrentInstance.cluster.attribute &&
            !Array.isArray(ClusterFile.XMLCurrentInstance.cluster.attribute)
        ) {
            ClusterFile.XMLCurrentInstance.cluster.attribute = [
                ClusterFile.XMLCurrentInstance.cluster.attribute,
            ];
        }

        if (ClusterFile.XMLCurrentInstance.cluster.attribute) {
            ClusterFile.XMLCurrentInstance.cluster.attribute.forEach(
                attribute => {
                    if (attribute.access && !Array.isArray(attribute.access)) {
                        attribute.access = [attribute.access];
                    }

                    // Synchronize description and _ which contains the same values.
                    if (attribute.description) {
                        attribute._ = attribute.description;
                    }
                    attribute.description = attribute._;
                }
            );
            return ClusterFile.XMLCurrentInstance.cluster.attribute;
        }
        return [];
    };

    const createDetails = (attribute: XMLAttribute) => (
        <AttributeDetails
            _={attribute._ || attribute.description || attribute.$.name || ''}
            $={attribute.$}
            access={attribute.access}
        />
    );

    const saveAllAttributeRows = (attributes: XMLAttribute[]) => {
        ClusterFile.XMLCurrentInstance.cluster.attribute = attributes;
        // Synchronize description, name and _ which contains the same values.
        attributes.forEach(attribute => {
            if (!attribute._) {
                attribute._ = attribute.description || attribute.$.name;
            }

            // Remove redundant description and name fields, because we are using the _ field
            delete attribute.description;
            attribute.$.name = "";
        });
    };

    return (
        <Component<XMLAttribute>
            name="Attribute"
            headers={['Name', 'Side', 'Code', 'Type', 'Default']}
            detailsBox={createDetails}
            editBox={AttributeEdit}
            getCells={(attribute: XMLAttribute) => [
                attribute._,
                attribute.$.side || '',
                attribute.$.code.toString() || '',
                attribute.$.type || '',
                attribute.$.default !== undefined
                    ? attribute.$.default.toString()
                    : '',
            ]}
            loadAllRows={loadAllAttributeRows}
            saveAllRows={saveAllAttributeRows}
            emptyElement={defaultXMLAttribute}
        />
    );
};

export default AttributesTable;
