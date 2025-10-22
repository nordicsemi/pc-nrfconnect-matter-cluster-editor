/*
 * Copyright (c) 2025 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: LicenseRef-Nordic-4-Clause
 */

import * as React from 'react';

import DetailsBox, { DetailsItem } from '../Components/Details/DetailsBox';
import ListPropertiesDetails from '../Components/Details/ListPropertiesDetails';
import { XMLDeviceClusterInclude } from '../defines';

/**
 * The DeviceTypeDetails component displays detailed information about a cluster include within a Matter device type.
 *
 * This component renders expanded details for a cluster include row in the device type editor. It shows:
 * - The cluster name
 * - Client/server roles and their locked status
 * - Lists of required attributes, commands, and events for the cluster
 *
 * In the Matter specification, device types define what clusters a device must support and with what
 * configuration. This component shows the detailed requirements for a specific cluster within a
 * device type definition, which is crucial for proper device type implementation.
 *
 * Component hierarchy:
 * - Used by the DeviceType component to display expanded details for a cluster include
 * - Uses DetailsBox as its container component
 * - Uses DetailsItem for displaying the cluster name
 * - Uses ListPropertiesDetails to display client/server properties
 *
 * @param {XMLDeviceClusterInclude} props - The device cluster include data
 * @param {Object} props.$ - Object containing basic cluster include properties
 * @param {string} props.$.cluster - The name of the cluster
 * @param {boolean} [props.$.client] - Whether the cluster is used as a client
 * @param {boolean} [props.$.server] - Whether the cluster is used as a server
 * @param {boolean} [props.$.clientLocked] - Whether the client role is locked
 * @param {boolean} [props.$.serverLocked] - Whether the server role is locked
 * @param {string[]} [props.requireAttribute] - Array of required attribute names
 * @param {string[]} [props.requireCommand] - Array of required command names
 * @param {string[]} [props.requireEvent] - Array of required event names
 * @returns {JSX.Element} The rendered DeviceTypeDetails component
 */
const DeviceTypeDetails: React.FC<XMLDeviceClusterInclude> = ({
    $,
    requireAttribute,
    requireCommand,
    requireEvent,
    features,
}) => (
    <DetailsBox
        innerElements={[
            {
                name: 'Required Attribute',
                element: requireAttribute
                    ? requireAttribute.map(attr => ({ name: attr }))
                    : [],
            },
            {
                name: 'Required Command',
                element: requireCommand
                    ? requireCommand.map(cmd => ({ name: cmd }))
                    : [],
            },
            {
                name: 'Required Event',
                element: requireEvent
                    ? requireEvent.map(evt => ({ name: evt }))
                    : [],
            },
            {
                name: 'Feature',
                element:
                    features && features.feature
                        ? (Array.isArray(features.feature)
                              ? features.feature
                              : [features.feature]
                          ).map(feature => ({
                              name: feature.$.name,
                          }))
                        : [],
            },
        ]}
    >
        <DetailsItem>
            <strong>Name: </strong>
            {$.cluster}
        </DetailsItem>
        <ListPropertiesDetails
            textToDisplay="Properties:"
            items={[
                $.client ? 'Client' : null,
                $.server ? 'Server' : null,
                $.clientLocked ? 'Client Locked' : null,
                $.serverLocked ? 'Server Locked' : null,
            ]}
        />
    </DetailsBox>
);

export default DeviceTypeDetails;
