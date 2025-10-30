/*
 * Copyright (c) 2025 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: LicenseRef-Nordic-4-Clause
 */

import * as React from 'react';

import DetailsBox, { DetailsItem } from '../Components/Details/DetailsBox';
import ListPropertiesDetails from '../Components/Details/ListPropertiesDetails';
import { XMLAttribute } from '../defines';

/**
 * Implementation of content for DetailBox component dedicated to XMLAttribute.
 *
 * The AttributeDetails component displays detailed information about Matter attributes in a structured format.
 * It is a presentation component that renders attribute metadata including access privileges, property flags,
 * C/C++ defines, API maturity, array length, and range values when applicable.
 *
 * This component is part of the Matter Manufacturer Cluster Editor application, which allows users to view,
 * edit, and manage Matter attributes defined in cluster XML files. It serves as the details view when a user
 * expands an attribute row in the AttributesTable component.
 *
 * Component hierarchy:
 * - AttributesTable uses AttributeDetails to render expanded attribute details
 * - AttributeDetails uses DetailsBox as its container component
 * - AttributeDetails uses ListPropertiesDetails to display attribute properties in a list format
 * - AttributeDetails uses DetailsItem for individual detail sections
 *
 * The XMLAttribute interface is defined in defines.ts and represents attribute data from Matter cluster XML files,
 * following the Matter specification structure.
 *
 * @param {XMLAttribute} props - The properties for the AttributeDetails component.
 * @param {string} props.description - A description of the attribute.
 * @param {Array<{ $: { op: string, role: string } }>} props.access - An array of access objects, each containing an operation and a role.
 * @param {object} props.rest - Additional properties of the attribute.
 * @param {object} props.rest.$ - Nested properties of the attribute.
 * @returns {JSX.Element} The rendered `AttributeDetails` component.
 */
const AttributeDetails: React.FC<XMLAttribute> = ({ $, access }) => (
    <DetailsBox
        innerElements={[
            {
                name: 'Privilege',
                element:
                    access?.map(acc => ({
                        op: acc.$.op,
                        role: acc.$.role || acc.$.privilege,
                    })) || [],
                size: 'sm',
            },
        ]}
    >
        <ListPropertiesDetails
            textToDisplay="Properties:"
            items={[
                $.isNullable ? 'Nullable' : null,
                $.reportable ? 'Reportable' : null,
                $.writable ? 'Writable' : null,
                $.optional ? 'Optional' : null,
                $.array ? 'Array' : null,
            ]}
        />
        <DetailsItem>
            <strong>C/C++ Define: </strong>
            {$.define}
        </DetailsItem>
        {$.apiMaturity != null && (
            <DetailsItem>
                <strong>Api Maturity: </strong>
                {$.apiMaturity}
            </DetailsItem>
        )}
        {$.length != null && (
            <DetailsItem>
                <strong>Array length: </strong>
                {$.length}
            </DetailsItem>
        )}
        {($.min === 0 || $.min) && $.max != null && (
            <DetailsItem>
                <strong>Range: </strong>
                from {String($.min)} to {String($.max)}
            </DetailsItem>
        )}
    </DetailsBox>
);

export default AttributeDetails;
