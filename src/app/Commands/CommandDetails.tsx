/*
 * Copyright (c) 2025 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: LicenseRef-Nordic-4-Clause
 */

import * as React from 'react';

import DetailsBox, { DetailsItem } from '../Components/Details/DetailsBox';
import { XMLCommand } from '../defines';

/**
 * Implementation of content for DetailBox component.
 *
 * The CommandDetails component displays detailed information about Matter commands in a structured format.
 * It is a presentation component that renders command metadata including description, response relationship,
 * arguments, and access privileges when the user expands a command row in the CommandsTable.
 *
 * This component is part of the Matter Manufacturer Cluster Editor application, which allows users to view,
 * edit, and manage Matter commands defined in cluster XML files. It serves as the details view when a user
 * expands a command row in the CommandsTable component.
 *
 * Component hierarchy:
 * - CommandsTable uses CommandDetails to render expanded command details
 * - CommandDetails uses DetailsBox as its container component
 * - CommandDetails uses DetailsItem for individual detail sections
 *
 * The component organizes command data into logical sections:
 * - Command description at the top (when available)
 * - Response relationship (when defined)
 * - Arguments with their properties (name, type, nullability, optional status)
 * - Access privileges with operation types and required roles
 *
 * The XMLCommand interface is defined in defines.ts and represents command data from Matter cluster XML files,
 * following the Matter specification structure.
 *
 * @param {Object} props - The input props for the component.
 * @param {string} props.description - A description of the command.
 * @param {Object} props.$ - An object containing additional command details.
 * @param {string} [props.$.response] - An optional response string.
 * @param {Array} [props.arg] - An optional array of arguments for the command.
 * @param {Array} [props.access] - An optional array of access control details.
 * @param {Object} props.arg.$ - An object containing argument properties.
 * @param {string} props.arg.$.name - The name of the argument.
 * @param {string} props.arg.$.type - The type of the argument.
 * @param {Object} props.access.$ - An object containing access control properties.
 * @param {string} props.access.$.op - The operation type for access control.
 * @param {string} props.access.$.role - The role required for access control.
 * @returns {JSX.Element} The rendered `CommandDetails` component.
 */
const CommandDetails: React.FC<XMLCommand> = ({
    description,
    $,
    arg,
    access,
}) => (
    <DetailsBox
        description={description}
        innerElements={[
            {
                name: 'Argument',
                element:
                    arg?.map(argument => ({
                        name: argument.$.name,
                        type: argument.$.type,
                        isNullable: argument.$.isNullable,
                        optional: argument.$.optional,
                        array: argument.$.array,
                    })) || [],
                size: 'xl',
            },
            {
                name: 'Privilege',
                element:
                    access?.map(acc => ({
                        name: acc.$.op,
                        type: acc.$.role || '',
                    })) || [],
                size: 'sm',
            },
        ]}
    >
        {$.response != null && (
            <DetailsItem>
                <strong>Response: </strong>
                {$.response}
            </DetailsItem>
        )}
    </DetailsBox>
);

export default CommandDetails;
