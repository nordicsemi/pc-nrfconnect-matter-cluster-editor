/*
 * Copyright (c) 2025 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: LicenseRef-Nordic-4-Clause
 */

import React from 'react';
import { useDispatch } from 'react-redux';
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
import { deepClone } from '../Components/Utils';
import {
    validateAndAutoFillClusterFile,
    validateAndAutoFillExtensionFile,
    ValidationError,
} from './FileValidation';
import { SaveOptionsDialog } from './SaveOptionsDialog';
import { ValidationErrorsDialog } from './ValidationErrorsDialog';

import '../../../resources/css/component.scss';

/**
 * The OpenSavePanelButtons component provides file management controls for standard
 * Matter cluster XML files in the application.
 *
 * This component offers core file operations including:
 * - Loading XML cluster files from the filesystem
 * - Validating loaded files for required fields and proper structure
 * - Handling multiple clusters within a single file
 * - Handling multiple device types within a single file
 * - Loading files with only device types (no clusters)
 * - Saving the current cluster back to an XML file
 * - Showing appropriate dialogs for error conditions and selection options
 *
 * The component integrates with:
 * - ClusterFile singleton to manage XML file loading and serialization
 * - FileValidation module for comprehensive file validation
 * - Redux for state management (via dispatch)
 * - Event emitter system to coordinate save operations across the application
 *
 * File operations trigger appropriate UI feedback including:
 * - Validation errors dialog when required fields are missing
 * - Error dialog when attempting to load empty files (no clusters or device types)
 * - Cluster selection dialog when loading files with multiple clusters
 * - Device type selection dialog when loading files with multiple device types
 * - Warning dialog when attempting to save while a cluster extension is loaded
 *
 * This component is essential to the workflow of the Matter Manufacturer Cluster Editor,
 * as it provides the primary means for users to load and save their cluster definitions.
 *
 * @returns {JSX.Element} The rendered OpenSavePanelButtons component
 */
const OpenSavePanelButtons = () => {
    const dispatch = useDispatch();

    const [fileWarning, setFileWarning] = React.useState(false);
    const [fileWarningText, setFileWarningText] = React.useState('');
    const [fileWarningTitle, setFileWarningTitle] = React.useState('Error');
    const [validationErrors, setValidationErrors] = React.useState<
        ValidationError[]
    >([]);
    const [validationErrorsOpen, setValidationErrorsOpen] =
        React.useState(false);
    const [saveOptionsOpen, setSaveOptionsOpen] = React.useState(false);
    const [autoFillNotification, setAutoFillNotification] =
        React.useState(false);
    const [autoFillMessage, setAutoFillMessage] = React.useState('');

    const handleLoad = () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.xml';
        input.onchange = (event: Event) => {
            const file = (event.target as HTMLInputElement).files?.[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = () => {
                    const content = reader.result as string;
                    ClusterFile.load(file, content).then(loaded => {
                        if (!loaded) {
                            // check if the file contains a cluster extension
                            ClusterFile.loadExtension(file, content).then(
                                extensionLoaded => {
                                    if (!extensionLoaded) {
                                        // Cluster file does not contain any clusters, device types, or cluster extension
                                        setFileWarning(true);
                                        setFileWarningText(
                                            'The file does not contain any clusters, device types, or cluster extension. Please load a valid file.'
                                        );
                                        setFileWarningTitle('Invalid file');
                                        logger.error('Invalid file', file.name);
                                    } else {
                                        // Validate and auto-fill the loaded extension file
                                        const validationResult =
                                            validateAndAutoFillExtensionFile(
                                                ClusterFile.extensionFile
                                            );

                                        // Show notification if fields were auto-filled
                                        if (
                                            validationResult.autoFilledItems
                                                .length > 0
                                        ) {
                                            const formattedMessage =
                                                validationResult.autoFilledItems
                                                    .map(
                                                        item =>
                                                            `${
                                                                item.itemName
                                                            }: ${item.missingFields.join(
                                                                ', '
                                                            )}`
                                                    )
                                                    .join('\n');
                                            setAutoFillMessage(
                                                `Some required fields were missing and have been filled with zeroes:\n\n${formattedMessage}\n\nReview and update them if needed.`
                                            );
                                            setAutoFillNotification(true);
                                            logger.info(
                                                'Auto-filled fields:',
                                                validationResult.autoFilledFields
                                            );
                                        }

                                        // Clear all available items and store extensions for side panel (use deepClone from Utils to preserve HexString instances)
                                        ClusterFile.availableClusters = [];
                                        ClusterFile.availableDeviceTypes = [];
                                        ClusterFile.availableExtensions =
                                            validationResult.extensions.map(
                                                ext => deepClone(ext)
                                            );

                                        // Handle multiple cluster extensions - don't auto-load
                                        if (
                                            validationResult.hasMultipleExtensions
                                        ) {
                                            // Don't initialize any extension, let user click
                                            logger.info(
                                                'Multiple extensions found; select one from the side panel'
                                            );
                                        } else if (
                                            validationResult.extensions
                                                .length === 1
                                        ) {
                                            // Single extension: loadExtension() already called
                                            // initializeExtension(); do not call it again or the
                                            // code would be zeroed by stale React state in saveCurrentChanges().
                                        }
                                        // Emit event to update side panel
                                        eventEmitter.emit(
                                            'availableItemsChanged'
                                        );

                                        dispatch({
                                            type: 'LOAD_FILE',
                                            payload: content,
                                        });
                                    }
                                }
                            );
                        } else {
                            // Validate and auto-fill the loaded file
                            const validationResult =
                                validateAndAutoFillClusterFile(
                                    ClusterFile.file
                                );

                            // Show notification if fields were auto-filled
                            if (validationResult.autoFilledItems.length > 0) {
                                const formattedMessage =
                                    validationResult.autoFilledItems
                                        .map(
                                            item =>
                                                `${
                                                    item.itemName
                                                }: ${item.missingFields.join(
                                                    ', '
                                                )}`
                                        )
                                        .join('\n');
                                setAutoFillMessage(
                                    `Some required fields were missing and have been filled with default values:\n\n${formattedMessage}\n\nReview and update them.`
                                );
                                setAutoFillNotification(true);
                                logger.info(
                                    'Auto-filled fields:',
                                    validationResult.autoFilledFields
                                );
                            }

                            // Clear all available items and store items for side panel (use deepClone from Utils to preserve HexString instances)
                            ClusterFile.availableClusters =
                                validationResult.clusters.map(cluster =>
                                    deepClone(cluster)
                                );
                            ClusterFile.availableDeviceTypes =
                                validationResult.deviceTypes.map(dt =>
                                    deepClone(dt)
                                );
                            ClusterFile.availableExtensions =
                                validationResult.extensions.map(ext =>
                                    deepClone(ext)
                                );

                            // Handle multiple clusters - don't auto-load
                            if (validationResult.hasMultipleClusters) {
                                // Don't initialize any cluster, let user click
                                logger.info(
                                    'Multiple clusters found; select one from the side panel'
                                );
                            } else if (validationResult.clusters.length === 1) {
                                // Single cluster, auto-load it
                                ClusterFile.initialize(
                                    validationResult.clusters[0]
                                );
                            } else if (validationResult.clusters.length === 0) {
                                // No clusters - check if we should auto-load an extension
                                // Handle multiple cluster extensions - don't auto-load
                                if (validationResult.hasMultipleExtensions) {
                                    // Don't initialize any extension, let user click
                                    logger.info(
                                        'Multiple extensions found; select one from the side panel'
                                    );
                                } else if (
                                    validationResult.extensions.length === 1
                                ) {
                                    // Single extension and no cluster, auto-load the extension
                                    ClusterFile.initializeExtension(
                                        validationResult.extensions[0],
                                        0
                                    );
                                    eventEmitter.emit('xmlInstanceChanged');
                                } else {
                                    // No clusters and no extensions, only device types
                                    logger.info(
                                        'No clusters or extensions found; loading device type only'
                                    );
                                }
                            }

                            // Handle multiple device types - don't auto-load
                            if (validationResult.hasMultipleDeviceTypes) {
                                // Don't initialize any device type, let user click
                                logger.info(
                                    'Multiple device types found; select one from the side panel'
                                );
                            } else if (
                                validationResult.deviceTypes.length === 1
                            ) {
                                // Single device type, auto-load it
                                ClusterFile.XMLCurrentInstance.deviceType =
                                    validationResult.deviceTypes[0];
                                eventEmitter.emit('xmlInstanceChanged');
                            }

                            // Emit event to update side panel
                            eventEmitter.emit('availableItemsChanged');

                            dispatch({
                                type: 'LOAD_FILE',
                                payload: content,
                            });
                        }
                    });
                };
                reader.readAsText(file);
            }
        };
        input.click();
    };

    const openSaveAllFileWindow = (saveWithOriginals = false) => {
        // Save current changes before serializing
        ClusterFile.saveCurrentChanges();

        const result = saveWithOriginals
            ? ClusterFile.getSerializedClusterWithOriginals()
            : ClusterFile.getSerializedCluster();

        if (result.error) {
            if (result.noDataToSave) {
                // Handle "no data to save" case with informational dialog
                setFileWarning(true);
                setFileWarningText(result.message || 'No data to save');
                setFileWarningTitle('No Data');
                logger.info('No data to save');
            } else if (result.validationErrors) {
                setValidationErrors(result.validationErrors);
                setValidationErrorsOpen(true);
                logger.error(
                    'Validation errors during save:',
                    result.validationErrors
                );
            } else {
                setFileWarning(true);
                setFileWarningText(result.message || 'Failed to save');
                setFileWarningTitle('Save Error');
                logger.error('Save error:', result.message);
            }
            return;
        }

        const content = result.xml;
        if (!content || content === '') {
            setFileWarning(true);
            setFileWarningText('No data to be saved.');
            setFileWarningTitle('No data');
            logger.info('No data to be saved.');
            return;
        }

        const blob = new Blob([content], { type: 'text/xml' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = ClusterFile.fileName;
        a.click();
        URL.revokeObjectURL(url);
        telemetry.sendEvent('Saved the cluster to XML file');
        logger.info('Saved the cluster');
    };

    const handleSave = () => {
        // Save current changes before saving to file
        ClusterFile.saveCurrentChanges();

        // Emit an event and wait 100ms for all listeners to finish
        // Before showing the window
        if (ClusterFile.loadedClusterExtension) {
            setFileWarning(true);
            setFileWarningText(
                'Cluster extension is loaded. Cannot save as a cluster file. To save the cluster extension, please use the "Save extension to file" button.'
            );
            setFileWarningTitle('Extension loaded');
            logger.info(
                'Tried to save a cluster, while cluster extension has been loaded'
            );
        } else {
            // Check if file had multiple clusters or device types
            const hasMultipleItems =
                ClusterFile.originalClusters.length > 1 ||
                ClusterFile.originalDeviceTypes.length > 1;

            if (hasMultipleItems) {
                // Show dialog to choose save strategy
                eventEmitter.emit('xmlInstanceSave');
                setTimeout(() => setSaveOptionsOpen(true), 100);
            } else {
                // Single item or no original items, save directly
                eventEmitter.emit('xmlInstanceSave');
                setTimeout(() => openSaveAllFileWindow(false), 100);
            }
        }
    };

    useHotKey({
        hotKey: 'ctrl+o',
        title: 'Load from file',
        isGlobal: false,
        action: handleLoad,
    });
    useHotKey({
        hotKey: 'ctrl+s',
        title: 'Save to file',
        isGlobal: false,
        action: handleSave,
    });

    return (
        <div>
            <Overlay
                tooltipId="load-file-tooltip"
                placement="right"
                tooltipChildren={
                    <div>
                        Use this button to load an XML file. The file must
                        contain at least one cluster, device type, or cluster
                        extension.
                    </div>
                }
            >
                <Button
                    variant="secondary"
                    onClick={handleLoad}
                    disabled={false}
                    className="w-100"
                >
                    Load from file
                </Button>
            </Overlay>
            <div style={{ marginBottom: '10px' }} />
            <Overlay
                tooltipId="save-file-tooltip"
                placement="right"
                tooltipChildren={
                    <div>
                        Use this button to save the current cluster as an XML
                        file.
                        <br />
                        If a cluster extension is loaded, the cluster extension
                        will be saved instead.
                    </div>
                }
            >
                <Button
                    variant="primary"
                    onClick={handleSave}
                    disabled={false}
                    className="w-100"
                >
                    Save to file
                </Button>
            </Overlay>
            <ValidationErrorsDialog
                isVisible={validationErrorsOpen}
                onHide={() => setValidationErrorsOpen(false)}
                errors={validationErrors}
            />
            <InfoDialog
                isVisible={autoFillNotification}
                onHide={() => setAutoFillNotification(false)}
                title="Warning"
            >
                <div style={{ whiteSpace: 'pre-line' }}>{autoFillMessage}</div>
            </InfoDialog>
            <SaveOptionsDialog
                isVisible={saveOptionsOpen}
                onHide={() => setSaveOptionsOpen(false)}
                onSaveEditedOnly={() => {
                    setSaveOptionsOpen(false);
                    openSaveAllFileWindow(false);
                }}
                onSaveWithOriginals={() => {
                    setSaveOptionsOpen(false);
                    openSaveAllFileWindow(true);
                }}
                itemType={
                    ClusterFile.originalClusters.length > 1
                        ? 'cluster'
                        : 'deviceType'
                }
            />
            <InfoDialog
                isVisible={fileWarning}
                onHide={() => setFileWarning(false)}
                title={fileWarningTitle}
            >
                {fileWarningText}
            </InfoDialog>
        </div>
    );
};

export default OpenSavePanelButtons;
