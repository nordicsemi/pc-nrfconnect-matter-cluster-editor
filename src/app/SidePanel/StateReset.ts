/*
 * Copyright (c) 2025 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: LicenseRef-Nordic-4-Clause
 */

import ClusterFile from '../Components/ClusterFile';
import eventEmitter from '../Components/EventEmitter';
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
    // Reset instances to defaults (using direct reference to preserve HexString instances)
    ClusterFile.XMLCurrentInstance = defaultXMLConfigurator;
    ClusterFile.XMLBaseInstance = defaultXMLConfigurator;

    // Reset file to default structure
    ClusterFile.file = defaultXMLFile;

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

    // Emit event to notify UI components
    eventEmitter.emit('xmlInstanceChanged');
};
