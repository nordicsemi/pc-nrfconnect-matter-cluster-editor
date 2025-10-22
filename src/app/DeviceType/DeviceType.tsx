/*
 * Copyright (c) 2025 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: LicenseRef-Nordic-4-Clause
 */

import React, { useCallback } from 'react';

import ClusterFile from '../Components/ClusterFile';
import Component from '../Components/Component';
import BooleanField from '../Components/Edit/BooleanField';
import InputAndBoolField from '../Components/Edit/InputAndBoolField';
import eventEmitter from '../Components/EventEmitter';
import PageCard from '../Components/PageCard';
import {
    defaultXMLDeviceClusterInclude,
    defaultXMLDeviceClusters,
    defaultXMLDeviceType,
} from '../defaults';
import { HexString, XMLDeviceClusterInclude, XMLDeviceType } from '../defines';
import {
    matterDeviceTypeClasses,
    matterDeviceTypeScopes,
    matterDomains,
} from '../matterTypes';
import DeviceTypeDetails from './DeviceTypeDetails';
import DeviceTypeEdit from './DeviceTypeEdit';

/**
 * The DeviceType component manages the configuration and display of Matter device type definitions.
 *
 * This component serves as the main interface for defining Matter device types in the Matter
 * Manufacturer Cluster Editor application. Device types in Matter specify the capabilities,
 * behavior, and required clusters for specific types of devices within the Matter ecosystem.
 *
 * Key features:
 * - Allows users to define device type properties (name, domain, class, scope, etc.)
 * - Manages device IDs and profile IDs with editable flags
 * - Provides a table of cluster includes with their required attributes, commands, and events
 * - Handles data synchronization with the XML file structure
 *
 * Component hierarchy:
 * - Uses PageCard for the device type metadata form
 * - Uses Component for the cluster includes table
 * - Uses DeviceTypeDetails to display detailed information about cluster includes
 * - Uses DeviceTypeEdit for editing cluster includes
 * - Interacts with ClusterFile singleton to access and modify XML data
 * - Listens to and emits events via eventEmitter for coordinating changes
 *
 * This component represents a critical part of the application as device type definitions
 * determine how a Matter device presents itself on the network and what functionality
 * it supports according to the Matter specification.
 *
 * @returns {JSX.Element} The rendered DeviceType component
 */
const DeviceType: React.FC = () => {
    const [localDeviceType, setLocalDeviceType] =
        React.useState<XMLDeviceType>(defaultXMLDeviceType);

    const handleDeviceTypeChange = useCallback((value: XMLDeviceType) => {
        setLocalDeviceType(value);
        // Also update the ClusterFile's current instance so changes are preserved
        ClusterFile.XMLCurrentInstance.deviceType = value;
    }, []);

    React.useEffect(() => {
        const loadDeviceTypeData = () => {
            if (ClusterFile.XMLCurrentInstance.deviceType) {
                if (!ClusterFile.XMLCurrentInstance.deviceType.clusters) {
                    ClusterFile.XMLCurrentInstance.deviceType.clusters =
                        defaultXMLDeviceClusters;
                }
                setLocalDeviceType(ClusterFile.XMLCurrentInstance.deviceType);
            }
        };

        eventEmitter.on('xmlInstanceChanged', loadDeviceTypeData);
        return () => {
            eventEmitter.off('xmlInstanceChanged', loadDeviceTypeData);
        };
    });

    const loadAllRows = (): XMLDeviceClusterInclude[] => {
        // For each cluster, ensure include and its properties are arrays
        if (ClusterFile.XMLCurrentInstance.deviceType?.clusters?.include) {
            if (
                !Array.isArray(
                    ClusterFile.XMLCurrentInstance.deviceType.clusters.include
                )
            ) {
                ClusterFile.XMLCurrentInstance.deviceType.clusters.include = [
                    ClusterFile.XMLCurrentInstance.deviceType.clusters.include,
                ];
            }

            ClusterFile.XMLCurrentInstance.deviceType.clusters.include.forEach(
                include => {
                    if (
                        include.requireAttribute &&
                        !Array.isArray(include.requireAttribute)
                    ) {
                        include.requireAttribute = [include.requireAttribute];
                    }
                    if (
                        include.requireCommand &&
                        !Array.isArray(include.requireCommand)
                    ) {
                        include.requireCommand = [include.requireCommand];
                    }
                    if (
                        include.requireEvent &&
                        !Array.isArray(include.requireEvent)
                    ) {
                        include.requireEvent = [include.requireEvent];
                    }
                    if (
                        include.features &&
                        include.features.feature &&
                        !Array.isArray(include.features.feature)
                    ) {
                        include.features.feature = [include.features.feature];
                    }
                }
            );
            return ClusterFile.XMLCurrentInstance.deviceType.clusters.include;
        }
        return [];
    };

    const saveAllRows = (elements: XMLDeviceClusterInclude[]) => {
        if (ClusterFile.XMLCurrentInstance.deviceType) {
            // Ensure clusters structure exists
            if (!ClusterFile.XMLCurrentInstance.deviceType.clusters) {
                ClusterFile.XMLCurrentInstance.deviceType.clusters = {
                    $: { lockOthers: false },
                    include: [],
                };
            }
            // Update include array
            ClusterFile.XMLCurrentInstance.deviceType.clusters.include =
                elements;

            // Update localDeviceType to keep state in sync
            setLocalDeviceType(prevDeviceType => ({
                ...prevDeviceType,
                clusters: {
                    $: prevDeviceType.clusters?.$ || { lockOthers: false },
                    include: elements,
                },
            }));
        }
    };

    React.useEffect(() => {
        const saveDeviceTypeData = () => {
            // Only update the top-level deviceType fields, not the clusters
            // The clusters are already updated by saveAllRows
            if (ClusterFile.XMLCurrentInstance.deviceType) {
                ClusterFile.XMLCurrentInstance.deviceType.name =
                    localDeviceType.name;
                ClusterFile.XMLCurrentInstance.deviceType.typeName =
                    localDeviceType.typeName;
                ClusterFile.XMLCurrentInstance.deviceType.domain =
                    localDeviceType.domain;
                ClusterFile.XMLCurrentInstance.deviceType.class =
                    localDeviceType.class;
                ClusterFile.XMLCurrentInstance.deviceType.scope =
                    localDeviceType.scope;
                ClusterFile.XMLCurrentInstance.deviceType.profileId =
                    localDeviceType.profileId;
                ClusterFile.XMLCurrentInstance.deviceType.deviceId =
                    localDeviceType.deviceId;
                // Don't overwrite clusters - it's already managed by saveAllRows
            }
        };

        eventEmitter.on('xmlInstanceSave', saveDeviceTypeData);
        return () => {
            eventEmitter.off('xmlInstanceSave', saveDeviceTypeData);
        };
    });

    const handleFieldTooltip = (field: string) => {
        const tooltips: { [key: string]: string } = {
            name: 'The unique identifier for the device type, formatted with dashes. Example: "lighting-color-light". ',
            typeName:
                'A human-readable actual name that describes the device type. Example: "Color Light". ',
            domain:
                'The domain categorizes the device type within a specific area of application, for example lighting, appliances, etc. ' +
                'Enter the domain name manually, or select from the dropdown list.',
            class:
                'If your device is a Utility, select Utility. ' +
                'If your device is an Application, select Simple or Dynamic. ' +
                'Utility device type supports configuration and settings, while Application device type are typically the most common endpoints on a node in the network. ' +
                'The simple device type supports local control that is persistent, independent and unsupervised. It can be only an Application. For example, sensors, actuators, lights, on/off switches, etc. ' +
                'The dynamic device types supports intelligent and supervisory services such as commissioning, monitoring, trend analysis, scheduling and central management.',
            scope:
                'Choose "Node" if the device is a Utility type scoped to a node. ' +
                'A device with a "Node" scope shall support clusters that represent the entire node. ' +
                'Choose "Endpoint" if the device represents the physical device or product. ' +
                'All other classes of device types are "Endpoint" scoped.',
            profileId:
                'The profile ID reflects the current version of the Matter specification where the major version is the most significant byte (0x01), the minor version is the second most significant byte (0x04), and the dot version is the third most significant byte (0x02).' +
                'For example, the profile ID for Matter 1.4 is 0x0104, 0x010402 for Matter 1.4.2, etc. ' +
                'Editable means that the profile ID can be changed through Matter network.',
            deviceId:
                'A unique identifier for the device, essential for device recognition. ' +
                'A custom device ID shall be unique and consist of the manufacturer code and device ID. ' +
                'The most significant 16 bits are the manufacturer code (range test codes is 0xFFF1 - 0xFFF4). ' +
                'The least significant 16 bits are the attribute ID within 0x0000 - 0x4FFF range. ' +
                'Editable means that the device ID can be changed through Matter network.',
            lockOthers:
                'If true, the device should not use other clusters than the ones defined below. ' +
                'This is useful to prevent the device from using other clusters that are not assigned to the device type.',
        };
        return tooltips[field] || '';
    };

    const getCells = (element: XMLDeviceClusterInclude) => [
        element.$.cluster,
        element.requireAttribute?.length,
        element.requireCommand?.length,
        element.requireEvent?.length,
    ];

    return (
        <>
            <PageCard
                title={localDeviceType.typeName || 'Device Type'}
                data={localDeviceType}
                tooltipCallback={handleFieldTooltip}
                useNrfconnect
                typeFields={{
                    domain: matterDomains,
                }}
                dropdownFields={{
                    class: matterDeviceTypeClasses,
                    scope: matterDeviceTypeScopes,
                }}
                onChange={handleDeviceTypeChange}
                isOptionalCallback={() => false}
            >
                <InputAndBoolField
                    field="Profile ID"
                    stringValue={localDeviceType.profileId._}
                    boolValue={localDeviceType.profileId.$.editable || false}
                    boolLabel="Editable"
                    tooltip={handleFieldTooltip('profileId')}
                    useNrfconnect
                    onChangeString={value => {
                        const updatedValue = { ...localDeviceType };
                        if (value instanceof HexString) {
                            updatedValue.profileId._ = value;
                        } else {
                            updatedValue.profileId._ = new HexString(value);
                        }
                        setLocalDeviceType(updatedValue);
                    }}
                    onChangeBool={value => {
                        const updatedValue = { ...localDeviceType };
                        updatedValue.profileId.$ = {
                            ...updatedValue.profileId.$,
                            editable: value,
                        };
                        setLocalDeviceType(updatedValue);
                    }}
                    required
                />

                <InputAndBoolField
                    field="Device ID"
                    stringValue={localDeviceType.deviceId._}
                    boolValue={localDeviceType.deviceId.$.editable || false}
                    boolLabel="Editable"
                    tooltip={handleFieldTooltip('deviceId')}
                    useNrfconnect
                    onChangeString={value => {
                        const updatedValue = { ...localDeviceType };
                        if (value instanceof HexString) {
                            updatedValue.deviceId._ = value;
                        } else {
                            updatedValue.deviceId._ = new HexString(value);
                        }
                        setLocalDeviceType(updatedValue);
                    }}
                    onChangeBool={value => {
                        const updatedValue = { ...localDeviceType };
                        updatedValue.deviceId.$ = {
                            ...updatedValue.deviceId.$,
                            editable: value,
                        };
                        setLocalDeviceType(updatedValue);
                    }}
                    required
                />
                <BooleanField
                    field="Lock Others"
                    value={localDeviceType.clusters.$?.lockOthers ?? false}
                    onChange={value => {
                        const updatedValue = { ...localDeviceType };
                        updatedValue.clusters.$ = {
                            ...updatedValue.clusters.$,
                            lockOthers: value,
                        };
                        setLocalDeviceType(updatedValue);
                    }}
                    required={false}
                    disabled={false}
                    tooltip={handleFieldTooltip('lockOthers')}
                    leftLabel
                />
            </PageCard>
            <Component<XMLDeviceClusterInclude>
                name="Cluster assignment to device type"
                headers={['Cluster name', 'Attributes', 'Commands', 'Events']}
                detailsBox={DeviceTypeDetails}
                editBox={DeviceTypeEdit}
                getCells={getCells}
                loadAllRows={loadAllRows}
                saveAllRows={saveAllRows}
                emptyElement={defaultXMLDeviceClusterInclude}
                description="A device type may specify optional clusters that are recommended as enhancements. Here you can assign or remove clusters from the device type."
            />
        </>
    );
};

export default DeviceType;
