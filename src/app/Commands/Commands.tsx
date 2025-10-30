/*
 * Copyright (c) 2025 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: LicenseRef-Nordic-4-Clause
 */

import * as React from 'react';

import ClusterFile from '../Components/ClusterFile';
import Component from '../Components/Component';
import { defaultXMLCommand } from '../defaults';
import { XMLCommand } from '../defines';
import CommandDetails from './CommandDetails';
import CommandEdit from './CommandEdit';

/**
 * Implementation of the `Component` component dedicated to `XMLCommand`.
 *
 * The CommandsTable component is a central UI element in the Matter Manufacturer Cluster Editor
 * that displays and manages Matter command definitions. It presents command data from the loaded
 * XML cluster file in a tabular format, allowing users to view, add, edit, and delete commands.
 *
 * This component serves as the main interface for command management in the application:
 * - It loads command data from the current XML cluster file
 * - It renders commands in a table showing key properties (name, code, source, etc.)
 * - It enables users to expand rows to see detailed command information
 * - It provides functionality to edit existing commands or create new ones
 * - It handles synchronization between UI state and the XML data structure
 *
 * Component hierarchy:
 * - Uses the generic Component wrapper to provide table functionality
 * - Uses CommandDetails component to render expanded details for commands
 * - Uses CommandEdit component for editing command data
 * - Interacts with ClusterFile singleton to access and modify the current XML data
 *
 * Commands in Matter protocol define operations that can be invoked between devices,
 * including their arguments, access controls, and response relationships.
 *
 * @component
 * @param {Object} props - The component props.
 * @param {boolean} props.active - Indicates whether the component is active.
 *
 * @returns {JSX.Element} The rendered `CommandsTable` component.
 */
const CommandsTable: React.FC<{ active: boolean }> = () => {
    const loadAllCommandRows = (): XMLCommand[] => {
        // If there is only one command, it is not an array so we need to make it an array
        // We must ensure that each potential array in the cluster has an array type and be
        // ready for using the map function, even if it is actually empty.
        if (!ClusterFile.XMLCurrentInstance.cluster) {
            return [];
        }

        if (
            ClusterFile.XMLCurrentInstance.cluster.command &&
            !Array.isArray(ClusterFile.XMLCurrentInstance.cluster.command)
        ) {
            ClusterFile.XMLCurrentInstance.cluster.command = [
                ClusterFile.XMLCurrentInstance.cluster.command,
            ];
        }

        if (ClusterFile.XMLCurrentInstance.cluster.command) {
            ClusterFile.XMLCurrentInstance.cluster.command.forEach(command => {
                if (command.arg && !Array.isArray(command.arg)) {
                    command.arg = [command.arg];
                }
                if (command.access && !Array.isArray(command.access)) {
                    command.access = [command.access];
                }
            });
            return ClusterFile.XMLCurrentInstance.cluster.command;
        }
        return [];
    };

    const createDetails = (command: XMLCommand) => (
        <CommandDetails
            $={command.$}
            description={command.description}
            arg={command.arg}
            access={command.access}
        />
    );

    const clearFields = (command: XMLCommand) => {
        // Remove redundant boolean fields if they are not set to true
        command.$.optional = command.$.optional || undefined;
        command.$.disableDefaultResponse =
            command.$.disableDefaultResponse || undefined;
    };

    const saveAllCommandRows = (commands: XMLCommand[]) => {
        ClusterFile.XMLCurrentInstance.cluster.command = commands;
        commands.forEach(command => {
            clearFields(command);
        });
    };

    return (
        <Component<XMLCommand>
            name="Command"
            headers={['Name', 'Code', 'Source']}
            detailsBox={createDetails}
            editBox={CommandEdit}
            getCells={(command: XMLCommand) => [
                command.$.name || '',
                command.$.code.toString() || '',
                command.$.source || '',
            ]}
            loadAllRows={loadAllCommandRows}
            saveAllRows={saveAllCommandRows}
            emptyElement={defaultXMLCommand}
        />
    );
};

export default CommandsTable;
