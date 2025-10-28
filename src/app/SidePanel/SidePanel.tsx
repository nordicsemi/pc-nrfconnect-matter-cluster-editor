/*
 * Copyright (c) 2025 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: LicenseRef-Nordic-4-Clause
 */

import React, { useEffect, useState } from 'react';
import { Group, SidePanel } from '@nordicsemiconductor/pc-nrfconnect-shared';

import ClusterFile from '../Components/ClusterFile';
import eventEmitter from '../Components/EventEmitter';
import { deepClone } from '../Components/Utils';
import { XMLCluster, XMLClusterExtension, XMLDeviceType } from '../defines';
import OpenSavePanelButtons from './Buttons';
import ExtensionButtons from './ExtensionButtons';
import { ItemsList } from './ItemsList';
import UtilityButtons from './UtilityButtons';

/**
 * The SidePanel component provides the main file management interface for the Matter
 * Manufacturer Cluster Editor application.
 *
 * This component organizes file operations into three main sections:
 * 1. XML Cluster file operations, for working with standard Matter cluster definitions
 * 2. XML Cluster extension file operations, for working with extension/custom cluster definitions
 * 3. Utility operations, for clearing state and other utility functions
 *
 * Additionally, when multiple items (clusters, device types, or extensions) are loaded,
 * this component displays collapsible sections allowing users to select which item to edit.
 *
 * These operations include opening files, saving files, creating new files, and exporting files
 * in formats suitable for Matter implementation. The side panel is a critical part of the
 * application's workflow, enabling users to manage the XML files that define Matter clusters.
 *
 * Component hierarchy:
 * - Uses the SidePanel and Group components from pc-nrfconnect-shared
 * - Contains OpenSavePanelButtons for standard cluster file operations
 * - Contains ExtensionButtons for extension cluster file operations
 * - Contains UtilityButtons for utility operations like clearing state
 * - Contains ItemsList components for displaying available clusters, device types, and extensions
 *
 * The side panel is always visible in the application layout, providing consistent
 * access to file operations regardless of which editor tab is active.
 *
 * @returns {JSX.Element} The rendered SidePanel component
 */
export default () => {
    const [availableClusters, setAvailableClusters] = useState<XMLCluster[]>(
        []
    );
    const [availableDeviceTypes, setAvailableDeviceTypes] = useState<
        XMLDeviceType[]
    >([]);
    const [availableExtensions, setAvailableExtensions] = useState<
        XMLClusterExtension[]
    >([]);
    const [currentClusterIndex, setCurrentClusterIndex] = useState(-1);
    const [currentDeviceTypeIndex, setCurrentDeviceTypeIndex] = useState(-1);
    const [currentExtensionIndex, setCurrentExtensionIndex] = useState(-1);
    const [loadedFileName, setLoadedFileName] = useState<string>('');

    useEffect(() => {
        const updateAvailableItems = () => {
            setAvailableClusters([...ClusterFile.availableClusters]);
            setAvailableDeviceTypes([...ClusterFile.availableDeviceTypes]);
            setAvailableExtensions([...ClusterFile.availableExtensions]);
            setLoadedFileName(ClusterFile.fileName);
            // Also update the current indices
            setCurrentClusterIndex(ClusterFile.editingClusterIndex);
            setCurrentDeviceTypeIndex(ClusterFile.editingDeviceTypeIndex);
            setCurrentExtensionIndex(ClusterFile.editingExtensionIndex);
        };

        const handleXmlInstanceChanged = () => {
            // Update selected indices from ClusterFile
            setCurrentClusterIndex(ClusterFile.editingClusterIndex);
            setCurrentDeviceTypeIndex(ClusterFile.editingDeviceTypeIndex);
            setCurrentExtensionIndex(ClusterFile.editingExtensionIndex);
        };

        eventEmitter.on('availableItemsChanged', updateAvailableItems);
        eventEmitter.on('xmlInstanceChanged', handleXmlInstanceChanged);

        return () => {
            eventEmitter.off('availableItemsChanged', updateAvailableItems);
            eventEmitter.off('xmlInstanceChanged', handleXmlInstanceChanged);
        };
    }, []);

    const handleClusterClick = (cluster: XMLCluster, index: number) => {
        ClusterFile.initialize(cluster, index);
        eventEmitter.emit('xmlInstanceChanged');
    };

    const handleDeviceTypeClick = (
        deviceType: XMLDeviceType,
        index: number
    ) => {
        // Save current changes before switching
        ClusterFile.saveCurrentChanges();

        ClusterFile.editingDeviceTypeIndex = index;
        // Read from the working array to get any saved changes (use deepClone from Utils to preserve HexString instances)
        ClusterFile.XMLCurrentInstance.deviceType = deepClone(
            ClusterFile.availableDeviceTypes[index]
        );
        eventEmitter.emit('xmlInstanceChanged');
    };

    const handleExtensionClick = (
        extension: XMLClusterExtension,
        index: number
    ) => {
        ClusterFile.initializeExtension(extension, index);
        eventEmitter.emit('xmlInstanceChanged');
    };

    // Show file info if any items are loaded
    const hasLoadedItems =
        availableClusters.length > 0 ||
        availableDeviceTypes.length > 0 ||
        availableExtensions.length > 0;

    return (
        <SidePanel>
            <Group heading="XML Cluster file">
                <OpenSavePanelButtons />
            </Group>
            <Group heading="XML Cluster extension file">
                <ExtensionButtons />
            </Group>
            <Group heading="Utility">
                <UtilityButtons />
            </Group>

            {/* Loaded file section */}
            {hasLoadedItems && loadedFileName && (
                <Group heading="Loaded File">
                    <div className="tw-truncate tw-text-sm tw-text-gray-700">
                        {loadedFileName}
                    </div>
                </Group>
            )}

            {hasLoadedItems && (
                <Group heading="Elements in the file">
                    <ItemsList
                        title="Clusters"
                        items={availableClusters}
                        currentIndex={currentClusterIndex}
                        onItemClick={handleClusterClick}
                        isVisible={availableClusters.length >= 1}
                    />

                    <ItemsList
                        title="Device Types"
                        items={availableDeviceTypes}
                        currentIndex={currentDeviceTypeIndex}
                        onItemClick={handleDeviceTypeClick}
                        isVisible={availableDeviceTypes.length >= 1}
                    />

                    <ItemsList
                        title="Extensions"
                        items={availableExtensions}
                        currentIndex={currentExtensionIndex}
                        onItemClick={handleExtensionClick}
                        isVisible={availableExtensions.length >= 1}
                    />
                </Group>
            )}
        </SidePanel>
    );
};
