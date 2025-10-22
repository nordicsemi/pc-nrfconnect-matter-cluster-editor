/*
 * Copyright (c) 2025 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: LicenseRef-Nordic-4-Clause
 */

import React from 'react';
import {
    Button,
    InfoDialog,
    logger,
    Overlay,
    telemetry,
    useHotKey,
} from '@nordicsemiconductor/pc-nrfconnect-shared';

import ClusterFile from '../Components/ClusterFile';
import eventEmitter from '../Components/EventEmitter';
import { SaveOptionsDialog } from './SaveOptionsDialog';

/**
 * The ExtensionButtons component provides file management controls specifically for
 * Matter cluster extension files in the application.
 *
 * Cluster extensions in Matter allow for adding custom attributes, commands, and events
 * to existing standard clusters without modifying the original cluster definitions. This
 * component enables users to save these extensions as separate XML files.
 *
 * The component offers:
 * - Saving cluster extensions to XML files
 * - Validation to ensure extensions contain actual changes
 * - Warning dialogs for error conditions (no changes, no cluster loaded)
 *
 * The component integrates with:
 * - ClusterFile singleton to manage extension serialization
 * - Event emitter system to coordinate save operations across the application
 *
 * This functionality is crucial for Matter device manufacturers who need to extend
 * standard Matter clusters with custom functionality while maintaining compatibility
 * with the core Matter specification.
 *
 * @returns {JSX.Element} The rendered ExtensionButtons component
 */
const ExtensionButtons = () => {
    const [extensionWarningOpen, extensionWarningOpenSet] =
        React.useState(false);
    const [extensionWarningText, extensionWarningTextSet] = React.useState('');
    const [saveOptionsOpen, setSaveOptionsOpen] = React.useState(false);

    const openSaveExtensionFileWindow = (saveWithOriginals = false) => {
        // Save current changes before serializing
        ClusterFile.saveCurrentChanges();

        const raw = saveWithOriginals
            ? ClusterFile.getSerializedClusterExtensionWithOriginals()
            : ClusterFile.getSerializedClusterExtension();

        if (raw === '') {
            extensionWarningTextSet(
                'No new attributes, commands, or events compared to the original cluster. Extension cannot be created.'
            );
            extensionWarningOpenSet(true);
            logger.info(
                'No new attributes, commands, or events compared to the original cluster. Extension cannot be created.'
            );
            return;
        }

        if (!ClusterFile.fileName) {
            extensionWarningTextSet(
                'No cluster file has been loaded to create an extension from. Unable to create extension.'
            );
            extensionWarningOpenSet(true);
            logger.info(
                'No cluster file has been loaded to create an extension from. Unable to create extension.'
            );
            return;
        }

        if (raw === null) {
            extensionWarningTextSet(
                'No new attributes, commands, or events compared to the original cluster. Extension cannot be created.'
            );
            extensionWarningOpenSet(true);
            return;
        }

        const blob = new Blob([raw], { type: 'text/xml' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = ClusterFile.fileName.replace('.xml', '_extension.xml');
        a.click();
        URL.revokeObjectURL(url);
        telemetry.sendEvent('Saved cluster extension to XML file');
        logger.info('Extension saved to file');
    };

    const handleSaveExtension = () => {
        // Emit an event and wait 100ms for all listeners to finish
        // Before showing the window
        eventEmitter.emit('xmlInstanceSave');

        // Check if file had multiple cluster extensions
        const hasMultipleExtensions =
            ClusterFile.originalClusterExtensions.length > 1;

        if (hasMultipleExtensions) {
            // Show dialog to choose save strategy
            setTimeout(() => setSaveOptionsOpen(true), 100);
        } else {
            // Single extension or no original extensions, save directly
            setTimeout(() => openSaveExtensionFileWindow(false), 100);
        }
    };

    useHotKey({
        hotKey: 'ctrl+shift+s',
        title: 'Save extension to file',
        isGlobal: false,
        action: handleSaveExtension,
    });

    return (
        <div>
            <Overlay
                tooltipId="save-extension-tooltip"
                placement="right"
                tooltipChildren={
                    <div>
                        Use this button to save all changes made to the cluster
                        as a cluster extension.
                        <br />
                        This will only save the attributes, commands and events
                        that were added to the original cluster.
                    </div>
                }
            >
                <Button
                    variant="primary"
                    onClick={handleSaveExtension}
                    disabled={false}
                    className="w-100"
                >
                    Save extension to file
                </Button>
            </Overlay>
            <InfoDialog
                isVisible={extensionWarningOpen}
                onHide={() => extensionWarningOpenSet(false)}
                title="Extension cannot be saved"
            >
                {extensionWarningText}
            </InfoDialog>
            <SaveOptionsDialog
                isVisible={saveOptionsOpen}
                onHide={() => setSaveOptionsOpen(false)}
                onSaveEditedOnly={() => {
                    setSaveOptionsOpen(false);
                    openSaveExtensionFileWindow(false);
                }}
                onSaveWithOriginals={() => {
                    setSaveOptionsOpen(false);
                    openSaveExtensionFileWindow(true);
                }}
                itemType="clusterExtension"
            />
        </div>
    );
};

export default ExtensionButtons;
