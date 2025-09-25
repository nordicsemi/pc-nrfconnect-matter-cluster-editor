/*
 * Copyright (c) 2025 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: LicenseRef-Nordic-4-Clause
 */

import React, { useCallback, useEffect, useState } from 'react';
import { Box, TextField, Tooltip } from '@mui/material';

import EditBox from '../Components/Edit/EditBox';
import InnerElementEdit from '../Components/Edit/InnerElementEdit';
import { EditRowWrapper } from '../Components/TableRow';
import {
    defaultXMLClusterAccess,
    defaultXMLCommandArgument,
} from '../defaults';
import {
    AccessCommandType,
    ArgumentCommandType,
    CommandValuesType,
    XMLCommand,
} from '../defines';
import {
    accessOptions,
    clientServerOptions,
    globalMatterTypes,
    roleOptions,
} from '../matterTypes';

/**
 * Implementation of EditBox component dedicated to XMLCommand.
 *
 * The CommandEdit component provides an interface for users to create and modify Matter commands
 * within the Matter Manufacturer Cluster Editor application. It renders form fields for all command
 * properties defined in the Matter specification, including command name, code, source, optional status,
 * response relationship, arguments, and access controls.
 *
 * This component is part of the editing workflow in the application:
 * - CommandsTable component renders a table of commands
 * - When a user clicks "Edit" or "Add" in the CommandsTable, this component is displayed
 * - User can modify command properties or create new commands
 * - Changes are saved back to the XML representation for the cluster
 *
 * Component hierarchy:
 * - Used by the Component generic in CommandsTable via the editBox prop
 * - Uses EditBox as its container component to provide the editing form
 * - Uses InnerElementEdit to handle nested element editing (arguments and access controls)
 * - Interacts with Matter type definitions from matterTypes.ts
 *
 * The component provides validation, tooltips, and specialized fields for different properties,
 * including multiline text for descriptions and dedicated sub-editors for arguments and access controls.
 *
 * @function function
 * @param {Object} props - The input props for the component.
 * @param {XMLCommand} props.element - The XML command element to be edited.
 * @param {function} props.onSave - Callback function to handle saving the command changes.
 * @param {function} props.onCancel - Callback function to handle canceling the edit.
 * @param {boolean} props.open - Boolean flag to indicate if the edit box is open.
 * @returns {JSX.Element} The rendered CommandEdit component.
 */
const CommandEdit: React.FC<EditRowWrapper<XMLCommand>> = ({
    element: command,
    onSave,
    onCancel,
    open,
}) => {
    const [localCommand, setLocalCommand] = useState<XMLCommand>(command);

    useEffect(() => {
        setLocalCommand(command);
    }, [command]);

    const handleValueChange = useCallback(
        (value: CommandValuesType): void => {
            if (JSON.stringify(value) !== JSON.stringify(localCommand.$)) {
                setLocalCommand(prev => {
                    const updatedCommand = {
                        ...prev,
                        $: value,
                    };
                    setTimeout(() => {
                        onSave(updatedCommand);
                    }, 0);
                    return updatedCommand;
                });
            } else {
                onSave(localCommand);
            }
        },
        [localCommand, onSave]
    );

    const handleDescriptionChange = (value: string) => {
        setLocalCommand(prev => ({
            ...prev,
            description: value,
        }));
    };

    const handleAccessTooltip = (field: string) => {
        const tooltips: { [key: string]: string } = {
            op: "The type of access. The valid values are 'read', 'write' and 'invoke'.",
            role: "The role of the access. The valid values are 'view', 'operate', 'manage' and 'administer'.",
        };
        return tooltips[field] || '';
    };

    const handleArgumentTooltip = (field: string) => {
        const tooltips: { [key: string]: string } = {
            name: 'The name of the argument. It shall be unique within the command.',
            type: 'The data type of the argument. The valid values are listed in the src/app/zap-templates/zcl/data-model/chip/chip-types.xml file, relative to the Matter project root directory.',
            isNullable:
                "The flag indicating if the argument can be null. The valid values are 'true' and 'false'.",
            optional:
                "The flag indicating if the command is optional or mandatory. The valid values are 'true' and 'false'.",
            array:
                "The flag indicating if the argument is an array. The valid values are 'true' and 'false'.",
        };
        return tooltips[field] || '';
    };

    const handleFieldTooltip = (field: string) => {
        const tooltips: { [key: string]: string } = {
            name: 'The name of the command. It shall be unique within the cluster.',
            code: 'The code of the command. It shall be unique within the cluster. The code is a 32-bit combination of the manufacturer code and command ID. The most significant 16 bits are the manufacturer code (range test codes is 0xFFF1 - 0xFFF4). The least significant 16 bits are the command ID within 0x0000 - 0x00FF range.',
            source: "The source of the command. The valid values are 'client' and 'server'.",
            optional:
                "The flag indicating if the command is optional or mandatory. The valid values are 'true' and 'false'.",
            response:
                'The name of the command that is a response to the current command. This field shall be empty, if command does not require response.',
            disableDefaultResponse:
                "The flag indicating if the default response is disabled. The valid values are 'true' and 'false'.",
            description:
                'The command description that explains the purpose of the command and its use cases.',
        };
        return tooltips[field] || '';
    };

    const handleOptionalArgument = (field: string) => {
        if (field === 'name' || field === 'type') {
            return false;
        }
        return true;
    };

    return (
        <EditBox<CommandValuesType>
            value={localCommand.$}
            open={open}
            onSave={newValue => {
                handleValueChange(newValue);
            }}
            onCancel={onCancel}
            onTooltipDisplay={field => handleFieldTooltip(field)}
            isOptional={field => {
                if (
                    field === 'name' ||
                    field === 'code' ||
                    field === 'source'
                ) {
                    return false;
                }
                return true;
            }}
            isDisabled={() => false}
            dropdownFields={{
                source: clientServerOptions,
            }}
            treatAsHex={(field: keyof CommandValuesType) => field === 'code'}
        >
            <Tooltip
                title={handleFieldTooltip('description')}
                arrow
                placement="right"
            >
                <TextField
                    label="Description"
                    variant="outlined"
                    multiline
                    value={localCommand.description}
                    onChange={e => handleDescriptionChange(e.target.value)}
                />
            </Tooltip>

            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 8 }}>
                <InnerElementEdit
                    buttonLabel="Arguments"
                    listOfElements={
                        (localCommand.arg || []).map(
                            arg => arg.$
                        ) as ArgumentCommandType[]
                    }
                    onSave={(updatedArg: ArgumentCommandType[]) => {
                        setLocalCommand(prev => ({
                            ...prev,
                            arg: updatedArg.map(arg => ({ $: arg })),
                        }));
                    }}
                    onTooltipDisplay={handleArgumentTooltip}
                    isOptional={handleOptionalArgument}
                    defaultPrototype={defaultXMLCommandArgument.$}
                    typeFields={{
                        type: globalMatterTypes,
                    }}
                />
                <InnerElementEdit
                    buttonLabel="Accesses"
                    listOfElements={
                        (localCommand.access || []).map(
                            access => access.$
                        ) as AccessCommandType[]
                    }
                    onSave={(updatedAccess: AccessCommandType[]) => {
                        setLocalCommand(prev => ({
                            ...prev,
                            access: updatedAccess.map(access => ({
                                $: access,
                            })),
                        }));
                    }}
                    onTooltipDisplay={handleAccessTooltip}
                    isOptional={() => false}
                    defaultPrototype={defaultXMLClusterAccess.$}
                    dropdownFields={{
                        op: accessOptions,
                        role: roleOptions,
                    }}
                />
            </Box>
        </EditBox>
    );
};

export default CommandEdit;
