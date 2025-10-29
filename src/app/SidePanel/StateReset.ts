/*
 * Copyright (c) 2025 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: LicenseRef-Nordic-4-Clause
 */

import ClusterFile from '../Components/ClusterFile';
import eventEmitter from '../Components/EventEmitter';
import { deepClone } from '../Components/Utils';
import { defaultXMLConfigurator, defaultXMLFile } from '../defaults';
import { XMLExtensionConfigurator } from '../defines';

/**
 * Resets all ClusterFile state to initial default values.
 * Clears loaded files, clusters, device types, and editing indices.
 *
 * @function resetClusterFileState
 * @returns {void}
 */
export const resetClusterFileState = (): void => {
    // Reset instances to defaults (using deep clones to avoid reference sharing)
    ClusterFile.XMLCurrentInstance = deepClone(defaultXMLConfigurator);
    ClusterFile.XMLBaseInstance = deepClone(defaultXMLConfigurator);

    // Reset file to default structure
    ClusterFile.file = deepClone(defaultXMLFile);

    // Clear extension file (no default available in defaults.ts)
    ClusterFile.extensionFile = {} as XMLExtensionConfigurator;

    // Clear file metadata
    ClusterFile.fileName = '';
    ClusterFile.fileUrl = {} as File;
    ClusterFile.content = '';

    // Clear original data arrays
    ClusterFile.originalClusters = [];
    ClusterFile.originalDeviceTypes = [];
    ClusterFile.originalClusterExtensions = [];

    // Reset editing indices
    ClusterFile.editingClusterIndex = -1;
    ClusterFile.editingDeviceTypeIndex = -1;
    ClusterFile.editingExtensionIndex = -1;

    // Clear extension flag
    ClusterFile.loadedClusterExtension = false;

    // Clear available items arrays for side panel
    ClusterFile.availableClusters = [];
    ClusterFile.availableDeviceTypes = [];
    ClusterFile.availableExtensions = [];

    // Emit events to notify UI components
    eventEmitter.emit('xmlInstanceChanged');
    eventEmitter.emit('availableItemsChanged');
};
