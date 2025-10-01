/*
 * Copyright (c) 2025 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: LicenseRef-Nordic-4-Clause
 */

import React, { useCallback, useEffect, useState } from 'react';
import { Box } from '@mui/material';

import EditBox from '../Components/Edit/EditBox';
import InnerElementEdit from '../Components/Edit/InnerElementEdit';
import TextInputField from '../Components/Edit/TextInputField';
import { EditRowWrapper } from '../Components/TableRow';
import { defaultXMLEventField } from '../defaults';
import { HexString, XMLEvent, XMLEventField } from '../defines';
import {
    clientServerOptions,
    globalMatterTypes,
    priorityOptions,
} from '../matterTypes';

type EventValuesType = XMLEvent['$'];
type ArgumentEventType = XMLEventField['$'];

/**
 * Implementation of EditBox component dedicated to XMLEvent.
 *
 * The EventEdit component provides an interface for users to create and modify Matter event
 * definitions within the Matter Manufacturer Cluster Editor application. It allows users to:
 * - Define event properties like name, code, priority, and optional status
 * - Add a descriptive text explaining the event's purpose
 * - Configure field definitions that specify the event payload structure
 *
 * This component is part of the editing workflow in the application:
 * - EventsTable component renders a table of events
 * - When a user clicks "Edit" or "Add" in the EventsTable, this component is displayed
 * - User can modify event properties or create new events
 * - Changes are saved back to the XML representation for the cluster
 *
 * Component hierarchy:
 * - Used by the Component generic in EventsTable via the editBox prop
 * - Uses EditBox as its container component to provide the editing form
 * - Uses TextInputField for the event description
 * - Uses InnerElementEdit to handle nested element editing for event fields
 *
 * In the Matter specification, events enable devices to broadcast notifications about state
 * changes or important occurrences. The structure of these events, including their priority
 * and payload fields, is critical for proper communication between Matter devices.
 *
 * @param {Object} props - The input props for the component.
 * @param {XMLEvent} props.element - The XMLEvent object to be edited.
 * @param {Function} props.onSave - Callback function to handle saving the event changes.
 * @param {Function} props.onCancel - Callback function to handle canceling the edit.
 * @param {boolean} props.open - Boolean flag to indicate if the edit box is open.
 *
 * @returns {JSX.Element} The rendered EventEdit component.
 */
const EventEdit: React.FC<EditRowWrapper<XMLEvent>> = ({
    element: event,
    onSave,
    onCancel,
    open,
}) => {
    const [localEvent, setLocalEvent] = useState<XMLEvent>(event);

    useEffect(() => {
        setLocalEvent(event);
    }, [event]);

    const handleDescriptionChange = (value: string | HexString) => {
        setLocalEvent(prev => ({
            ...prev,
            description: value instanceof HexString ? value.toString() : value,
        }));
    };

    const handleValueChange = useCallback(
        (value: EventValuesType): void => {
            if (JSON.stringify(value) !== JSON.stringify(localEvent.$)) {
                setLocalEvent(prev => {
                    const updatedEvent = {
                        ...prev,
                        $: value,
                    };
                    setTimeout(() => {
                        onSave(updatedEvent);
                    }, 0);
                    return updatedEvent;
                });
            } else {
                onSave(localEvent);
            }
        },
        [localEvent, onSave]
    );

    const handleFieldsTooltip = (field: string) => {
        const tooltips: { [key: string]: string } = {
            id: 'The numeric identifier of the field. It shall be unique within the event.',
            name: 'The name of the field. It shall be unique within the event.',
            type: 'The data type of the field. The valid values are listed in the src/app/zap-templates/zcl/data-model/chip/chip-types.xml file, relative to the Matter project root directory.',
            array: "The flag indicating if the field is an array. The valid values are 'true' and 'false'.",
        };
        return tooltips[field] || '';
    };

    const handleFieldTooltip = (field: string) => {
        const tooltips: { [key: string]: string } = {
            name: 'The name of the event. It shall be unique within the cluster.',
            code: 'The code of the event. It shall be unique within the cluster. The code is 32-bit combination of the manufacturer code and event ID. The most significant 16 bits are the manufacturer code (range test codes is 0xFFF1 - 0xFFF4). \n The least significant 16 bits are the event ID within 0x0000 - 0x00FF range.',
            side: 'The source of the event. It indicates the origin of the event. The valid values are "server" and "client".',
            priority:
                "The priority of the event. The valid values are 'debug', 'info', and 'critical'.",
            optional:
                "The flag indicating if the event is optional or mandatory. The valid values are 'true' and 'false'.",
            description:
                'The event description that explains the purpose of the event and its use cases.',
        };
        return tooltips[field] || '';
    };

    const handleOptional = (field: string) => {
        if (
            field === 'name' ||
            field === 'code' ||
            field === 'priority' ||
            field === 'side'
        ) {
            return false;
        }
        return true;
    };

    return (
        <EditBox<EventValuesType>
            value={localEvent.$}
            open={open}
            onSave={newValue => {
                handleValueChange(newValue);
            }}
            onTooltipDisplay={field => handleFieldTooltip(field)}
            isOptional={handleOptional}
            isDisabled={() => false}
            onCancel={onCancel}
            treatAsHex={(field: keyof EventValuesType) => field === 'code'}
            dropdownFields={{
                priority: priorityOptions,
                side: clientServerOptions,
            }}
        >
            <TextInputField
                field="Description"
                value={localEvent.description || ''}
                onChange={handleDescriptionChange}
                tooltip={handleFieldTooltip('description')}
                fullWidth
            />

            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 8 }}>
                <InnerElementEdit
                    buttonLabel="Fields"
                    listOfElements={
                        (localEvent.field || []).map(
                            field => field.$
                        ) as ArgumentEventType[]
                    }
                    onSave={(updatedAccess: ArgumentEventType[]) => {
                        setLocalEvent(prev => ({
                            ...prev,
                            field: updatedAccess.map(field => ({ $: field })),
                        }));
                    }}
                    onTooltipDisplay={handleFieldsTooltip}
                    isOptional={() => false}
                    defaultPrototype={defaultXMLEventField.$}
                    typeFields={{
                        type: globalMatterTypes,
                    }}
                />
            </Box>
        </EditBox>
    );
};

export default EventEdit;
