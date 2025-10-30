/*
 * Copyright (c) 2025 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: LicenseRef-Nordic-4-Clause
 */

import * as React from 'react';

import ClusterFile from '../Components/ClusterFile';
import Component from '../Components/Component';
import { defaultXMLEvent } from '../defaults';
import { XMLEvent } from '../defines';
import EventDetails from './EventDetails';
import EventEdit from './EventEdit';

/**
 * Implementation of the `Component` component dedicated to `XMLEvent`.
 *
 * The EventsTable component serves as the main interface for managing Matter event definitions
 * in the Matter Manufacturer Cluster Editor application. Events in Matter are notifications that
 * a device can generate to inform other devices or controllers about state changes or important
 * occurrences.
 *
 * Key features:
 * - Displays a table of all events defined in the current cluster
 * - Allows users to add, edit, and delete event definitions
 * - Shows key properties (name, code, priority, optional status) in a tabular format
 * - Enables expanding rows to view detailed event information including fields
 *
 * Component hierarchy:
 * - Uses the generic Component wrapper to provide table functionality
 * - Uses EventDetails component to render expanded details for events
 * - Uses EventEdit component for editing event data
 * - Interacts with ClusterFile singleton to access and modify the current XML data
 *
 * Events play a crucial role in the Matter protocol by enabling asynchronous communication
 * between devices, particularly for state changes, alerts, and notifications that don't
 * fit the traditional request-response model.
 *
 * @component
 * @param {Object} props - The input props for the component.
 * @param {boolean} props.active - A boolean indicating whether the component is active.
 * @returns {JSX.Element} The rendered `EventsTable` component.
 */
const EventsTable: React.FC<{ active: boolean }> = () => {
    const loadAllEventRows = (): XMLEvent[] => {
        // If there is only one command, it is not an array so we need to make it an array
        // We must ensure that each potential array in the cluster has an array type and be
        // ready for using the map function, even if it is actually empty.
        if (!ClusterFile.XMLCurrentInstance.cluster) {
            return [];
        }

        if (
            ClusterFile.XMLCurrentInstance.cluster.event &&
            !Array.isArray(ClusterFile.XMLCurrentInstance.cluster.event)
        ) {
            ClusterFile.XMLCurrentInstance.cluster.event = [
                ClusterFile.XMLCurrentInstance.cluster.event,
            ];
        }

        if (ClusterFile.XMLCurrentInstance.cluster.event) {
            ClusterFile.XMLCurrentInstance.cluster.event.forEach(event => {
                if (event.field && !Array.isArray(event.field)) {
                    event.field = [event.field];
                }
            });
            return ClusterFile.XMLCurrentInstance.cluster.event;
        }
        return [];
    };

    const createDetails = (event: XMLEvent) => (
        <EventDetails
            $={event.$}
            description={event.description}
            field={event.field}
        />
    );

    const clearFields = (event: XMLEvent) => {
        // Remove redundant boolean fields if they are not set to true
        event.$.optional = event.$.optional || undefined;

        // Clear fields for each field in the event
        if (event.field) {
            event.field.forEach(field => {
                field.$.array = field.$.array || undefined;
            });
        }
    };

    const saveAllEventRows = (elements: XMLEvent[]) => {
        ClusterFile.XMLCurrentInstance.cluster.event = elements;
        elements.forEach(event => {
            clearFields(event);
        });
    };

    return (
        <Component<XMLEvent>
            name="Event"
            headers={['Name', 'Code', 'Priority']}
            detailsBox={createDetails}
            editBox={EventEdit}
            getCells={(event: XMLEvent) => [
                event.$.name || '',
                event.$.code.toString() || '',
                event.$.priority || 'critical',
            ]}
            loadAllRows={loadAllEventRows}
            saveAllRows={saveAllEventRows}
            emptyElement={defaultXMLEvent}
        />
    );
};

export default EventsTable;
