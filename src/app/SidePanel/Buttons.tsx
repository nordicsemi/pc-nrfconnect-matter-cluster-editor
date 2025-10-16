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
import {
    HexString,
    XMLCluster,
    XMLClusterExtension,
    XMLDeviceType,
} from '../defines';
import {
    validateClusterFile,
    validateExtensionFile,
    ValidationError,
} from './FileValidation';
import { MultipleEntriesDialog } from './MultipleEntriesDialog';
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

    const [multipleClustersOpen, setMultipleClustersOpen] =
        React.useState(false);
    const [multipleDeviceTypesOpen, setMultipleDeviceTypesOpen] =
        React.useState(false);
    const [multipleExtensionsOpen, setMultipleExtensionsOpen] =
        React.useState(false);
    const [localClustersList, setLocalClustersList] = React.useState<
        XMLCluster[]
    >([]);
    const [localDeviceTypesList, setLocalDeviceTypesList] = React.useState<
        XMLDeviceType[]
    >([]);
    const [localExtensionsList, setLocalExtensionsList] = React.useState<
        XMLClusterExtension[]
    >([]);
    const [fileWarning, setFileWarning] = React.useState(false);
    const [fileWarningText, setFileWarningText] = React.useState('');
    const [fileWarningTitle, setFileWarningTitle] = React.useState('Error');
    const [validationErrors, setValidationErrors] = React.useState<
        ValidationError[]
    >([]);
    const [validationErrorsOpen, setValidationErrorsOpen] =
        React.useState(false);
    const [saveOptionsOpen, setSaveOptionsOpen] = React.useState(false);

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
                                        // Validate the loaded extension file
                                        const validationResult =
                                            validateExtensionFile(
                                                ClusterFile.extensionFile
                                            );

                                        // Check for validation errors
                                        if (!validationResult.isValid) {
                                            setValidationErrors(
                                                validationResult.errors
                                            );
                                            setValidationErrorsOpen(true);
                                            logger.error(
                                                'Extension file validation errors:',
                                                validationResult.errors
                                            );
                                            return;
                                        }

                                        // Handle multiple cluster extensions
                                        if (
                                            validationResult.hasMultipleExtensions
                                        ) {
                                            setLocalExtensionsList(
                                                validationResult.extensions
                                            );
                                            setMultipleExtensionsOpen(true);
                                        }
                                        // Single extension is already initialized in loadExtension

                                        dispatch({
                                            type: 'LOAD_FILE',
                                            payload: content,
                                        });
                                    }
                                }
                            );
                        } else {
                            // Validate the loaded file
                            const validationResult = validateClusterFile(
                                ClusterFile.file
                            );

                            // Check for validation errors
                            if (!validationResult.isValid) {
                                setValidationErrors(validationResult.errors);
                                setValidationErrorsOpen(true);
                                logger.error(
                                    'File validation errors:',
                                    validationResult.errors
                                );
                                return;
                            }

                            // Handle multiple clusters
                            if (validationResult.hasMultipleClusters) {
                                setLocalClustersList(validationResult.clusters);
                                setMultipleClustersOpen(true);
                            } else if (validationResult.clusters.length === 1) {
                                ClusterFile.initialize(
                                    validationResult.clusters[0]
                                );
                            } else if (validationResult.clusters.length === 0) {
                                // No clusters, only device types
                                // Initialize with a default cluster structure
                                logger.info(
                                    'No clusters found, loading device type only'
                                );
                            }

                            // Handle multiple device types
                            if (validationResult.hasMultipleDeviceTypes) {
                                setLocalDeviceTypesList(
                                    validationResult.deviceTypes
                                );
                                setMultipleDeviceTypesOpen(true);
                            } else if (
                                validationResult.deviceTypes.length === 1
                            ) {
                                // Single device type, load it directly
                                ClusterFile.XMLCurrentInstance.deviceType =
                                    validationResult.deviceTypes[0];
                                eventEmitter.emit('xmlInstanceChanged');
                            }

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
        const result = saveWithOriginals
            ? ClusterFile.getSerializedClusterWithOriginals()
            : ClusterFile.getSerializedCluster();

        if (result.error) {
            if (result.validationErrors) {
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

    const loadClusterFromMultiple = (cluster: XMLCluster) => {
        // Find the index of the selected cluster in the validation results
        const clusterIndex = localClustersList.findIndex(
            c => c.name === cluster.name
        );
        ClusterFile.initialize(cluster, clusterIndex);
        setMultipleClustersOpen(false);
    };

    const loadDeviceTypeFromMultiple = (deviceType: XMLDeviceType) => {
        // Find the index of the selected device type in the validation results
        const deviceTypeIndex = localDeviceTypesList.findIndex(
            dt => dt.name === deviceType.name
        );
        ClusterFile.editingDeviceTypeIndex = deviceTypeIndex;
        ClusterFile.XMLCurrentInstance.deviceType = deviceType;
        eventEmitter.emit('xmlInstanceChanged');
        setMultipleDeviceTypesOpen(false);
    };

    const loadExtensionFromMultiple = (extension: XMLClusterExtension) => {
        // Find the index of the selected extension in the validation results
        const extensionIndex = localExtensionsList.findIndex(
            ext => ext.$.code === extension.$.code
        );
        ClusterFile.initializeExtension(extension, extensionIndex);
        setMultipleExtensionsOpen(false);
    };

    // Create display objects for extensions with name property for MultipleEntriesDialog
    const extensionDisplayList = localExtensionsList.map((ext, index) => ({
        ...ext,
        name: `Extension ${index + 1} (Code: ${
            ext.$.code instanceof HexString ? ext.$.code.toString() : ext.$.code
        })`,
    }));

    useHotKey({
        hotKey: 'ctrl+o',
        title: 'Load cluster or cluster extension',
        isGlobal: false,
        action: handleLoad,
    });
    useHotKey({
        hotKey: 'ctrl+s',
        title: 'Save cluster to file',
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
                    Save cluster to file
                </Button>
            </Overlay>
            <MultipleEntriesDialog
                isVisible={multipleClustersOpen}
                onHide={() => setMultipleClustersOpen(false)}
                onLoad={loadClusterFromMultiple}
                title="cluster"
                entries={localClustersList}
            />
            <MultipleEntriesDialog
                isVisible={multipleDeviceTypesOpen}
                onHide={() => setMultipleDeviceTypesOpen(false)}
                onLoad={loadDeviceTypeFromMultiple}
                title="device type"
                entries={localDeviceTypesList}
            />
            <MultipleEntriesDialog
                isVisible={multipleExtensionsOpen}
                onHide={() => setMultipleExtensionsOpen(false)}
                onLoad={loadExtensionFromMultiple}
                title="cluster extension"
                entries={extensionDisplayList}
            />
            <ValidationErrorsDialog
                isVisible={validationErrorsOpen}
                onHide={() => setValidationErrorsOpen(false)}
                errors={validationErrors}
            />
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
