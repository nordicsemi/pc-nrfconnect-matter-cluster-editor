/*
 * Copyright (c) 2025 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: LicenseRef-Nordic-4-Clause
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import React, { useCallback, useState } from 'react';
import { Box } from '@mui/material';

import EditBox from '../Components/Edit/EditBox';
import ElementListEdit from '../Components/Edit/ElementListEdit';
import InnerElementEdit from '../Components/Edit/InnerElementEdit';
import { EditRowWrapper } from '../Components/TableRow';
import {
    defaultXMLDeviceClusterFeatures,
    defaultXMLDeviceClusterInclude,
} from '../defaults';
import { FeatureValuesType, XMLDeviceClusterInclude } from '../defines';

type XMLDeviceClusterIncludeType = XMLDeviceClusterInclude['$'];

/**
 * The DeviceTypeEdit component provides an interface for editing cluster include configurations
 * for Matter device types.
 *
 * This component allows users to define how a specific cluster is used within a device type,
 * including:
 * - Client/server roles and their locked status
 * - Required attributes, commands and events
 * - Required features with their conformance settings
 *
 * In the Matter specification, device types must define which clusters they support and how
 * those clusters are configured. This editor allows for precise configuration of those
 * relationships, which is essential for proper device type implementation.
 *
 * Component hierarchy:
 * - Used by the DeviceType component via the editBox prop of the Component generic
 * - Uses EditBox as its container component
 * - Uses ElementListEdit for managing lists of required attributes, commands, and events
 * - Uses InnerElementEdit for managing feature configurations
 *
 * The component provides comprehensive tooltips and validation to guide users in creating
 * valid device type cluster configurations according to the Matter specification.
 *
 * @param {Object} props - The component props
 * @param {XMLDeviceClusterInclude} props.element - The cluster include element to edit
 * @param {Function} props.onSave - Callback function called when changes are saved
 * @param {Function} props.onCancel - Callback function called when editing is canceled
 * @param {boolean} props.open - Whether the edit dialog is open
 * @returns {JSX.Element} The rendered DeviceTypeEdit component
 */
const DeviceTypeEdit: React.FC<EditRowWrapper<XMLDeviceClusterInclude>> = ({
    element: clusters,
    onSave,
    onCancel,
    open,
}) => {
    const [localClusters, setLocalClusters] =
        useState<XMLDeviceClusterInclude>(clusters);

    const handleClusterTooltip = (field: string) => {
        const tooltips: { [key: string]: string } = {
            cluster:
                'The name of the cluster that is required for this device type.',
            client: 'Indicates whether the cluster uses client attributes and commands.',
            server: 'Indicates whether the cluster uses server attributes and commands.',
            clientLocked:
                'Prevent the cluster to use other client attributes, commands or events than defined below.',
            serverLocked:
                'Prevent the cluster to use other server attributes, commands or events than defined below.',
        };
        return tooltips[field] || '';
    };

    const handleClusterElementTooltip = (type: string) => {
        const tooltips: { [key: string]: string } = {
            requireAttribute:
                'The exact names of the attributes that are required for this cluster.',
            requireCommand:
                'The exact names of the commands that are required for this cluster.',
            requireEvent:
                'The exact names of the events that are required for this cluster.',
            features: 'The features that are required for this cluster.',
        };
        return tooltips[type] || '';
    };

    const handleFeatureTooltip = (field: string) => {
        const tooltips: { [key: string]: string } = {
            code: 'The codename of the feature. For example if the feature is called DoorLock, the code should be like DL. If there is no specific codename, use 00.',
            name: 'The name of the feature.',
            mandatoryConform:
                'Indicates if the feature is mandatory to conform to.',
        };
        return tooltips[field] || '';
    };

    const handleOptional = (field: string) =>
        field === 'clientLocked' || field === 'serverLocked';

    const handleElementChange = (field: string, value: any) => {
        setLocalClusters(prev => ({
            ...prev,
            [field]: value,
        }));
    };

    const handleIsValid = (
        field: string,
        items: XMLDeviceClusterIncludeType
    ) => {
        const invalidMessages: string[] = [];
        if (items.client === false && items.server === false) {
            invalidMessages.push(
                'At least one of client or server must be true.'
            );
        }
        return { isValid: invalidMessages.length === 0, invalidMessages };
    };

    const handleValueChange = useCallback(
        (value: XMLDeviceClusterIncludeType): void => {
            if (JSON.stringify(value) !== JSON.stringify(localClusters.$)) {
                setLocalClusters(prev => {
                    const updatedCluster = {
                        ...prev,
                        $: value,
                    };
                    setTimeout(() => {
                        onSave(updatedCluster);
                    }, 0);
                    return updatedCluster;
                });
            } else {
                onSave(localClusters);
            }
        },
        [localClusters, onSave]
    );

    return (
        <EditBox<XMLDeviceClusterIncludeType>
            value={localClusters.$}
            onSave={handleValueChange}
            onCancel={onCancel}
            onTooltipDisplay={handleClusterTooltip}
            isOptional={handleOptional}
            isDisabled={() => false}
            isValid={handleIsValid}
            open={open}
            displayNote={
                'You can require attributes, commands and events for the cluster.' +
                'Fields marked with * are mandatory to be filled.'
            }
            mainTitle="Describe the cluster to be assigned to the device type here."
            defaultPrototype={defaultXMLDeviceClusterInclude.$}
        >
            <Box sx={{ display: 'flex', gap: 2 }}>
                <ElementListEdit
                    element={localClusters}
                    onElementChange={handleElementChange}
                    arrayName="requireAttribute"
                    buttonLabel="Required Attributes"
                    tooltip={handleClusterElementTooltip('requireAttribute')}
                    buttonTooltip="Assign a required attribute to the cluster."
                />
                <ElementListEdit
                    element={localClusters}
                    onElementChange={handleElementChange}
                    arrayName="requireCommand"
                    buttonLabel="Required Commands"
                    tooltip={handleClusterElementTooltip('requireCommand')}
                    buttonTooltip="Assign a required command to the cluster."
                />
                <ElementListEdit
                    element={localClusters}
                    onElementChange={handleElementChange}
                    arrayName="requireEvent"
                    buttonLabel="Required Events"
                    tooltip={handleClusterElementTooltip('requireEvent')}
                    buttonTooltip="Assign a required event to the cluster."
                />
            </Box>
            <InnerElementEdit
                buttonLabel="Features"
                listOfElements={
                    (localClusters.features?.feature || []).map(
                        feature => feature.$
                    ) as FeatureValuesType[]
                }
                onSave={(updatedFeatures: FeatureValuesType[]) => {
                    setLocalClusters(prev => ({
                        ...prev,
                        features: {
                            feature: updatedFeatures.map(feature => ({
                                $: feature,
                            })),
                        },
                    }));
                }}
                onTooltipDisplay={handleFeatureTooltip}
                defaultPrototype={defaultXMLDeviceClusterFeatures.$}
                isOptional={() => false}
                buttonTooltip="Assign a feature to the cluster."
            />
        </EditBox>
    );
};

export default DeviceTypeEdit;
