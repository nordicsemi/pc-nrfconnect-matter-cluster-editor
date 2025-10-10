/*
 * Copyright (c) 2025 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: LicenseRef-Nordic-4-Clause
 */

import React from 'react';
import { useDispatch } from 'react-redux';
import { List, ListItem, ListItemButton, ListItemText } from '@mui/material';
import {
    Button,
    DialogButton,
    InfoDialog,
    logger,
    Overlay,
    telemetry,
    useHotKey,
} from '@nordicsemiconductor/pc-nrfconnect-shared';

import ClusterFile from '../Components/ClusterFile';
import eventEmitter from '../Components/EventEmitter';
import { XMLCluster } from '../defines';

import '../../../resources/css/component.scss';

/**
 * The OpenSavePanelButtons component provides file management controls for standard
 * Matter cluster XML files in the application.
 *
 * This component offers core file operations including:
 * - Loading XML cluster files from the filesystem
 * - Handling multiple clusters within a single file
 * - Saving the current cluster back to an XML file
 * - Showing appropriate dialogs for error conditions and selection options
 *
 * The component integrates with:
 * - ClusterFile singleton to manage XML file loading and serialization
 * - Redux for state management (via dispatch)
 * - Event emitter system to coordinate save operations across the application
 *
 * File operations trigger appropriate UI feedback including:
 * - Error dialog when attempting to load empty files
 * - Cluster selection dialog when loading files with multiple clusters
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
    const [localClustersList, setLocalClustersList] = React.useState<
        XMLCluster[]
    >([]);
    const [fileWarning, setFileWarning] = React.useState(false);
    const [fileWarningText, setFileWarningText] = React.useState('');
    const [fileWarningTitle, setFileWarningTitle] = React.useState('Error');

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
                                        // Cluster file does not contain any clusters or cluster extension
                                        setFileWarning(true);
                                        setFileWarningText(
                                            'The file does not contain any clusters or cluster extension. Please load a valid cluster file.'
                                        );
                                        setFileWarningTitle('Invalid file');
                                        logger.error('Invalid file', file.name);
                                    }
                                }
                            );
                        } else {
                            ClusterFile.isMultipleCluster(content).then(
                                multipleClusters => {
                                    if (multipleClusters) {
                                        setLocalClustersList(
                                            ClusterFile.file.cluster
                                        );
                                        setMultipleClustersOpen(true);
                                    } else if (
                                        !Array.isArray(ClusterFile.file.cluster)
                                    ) {
                                        ClusterFile.initialize(
                                            ClusterFile.file.cluster
                                        );
                                    }
                                    dispatch({
                                        type: 'LOAD_FILE',
                                        payload: content,
                                    });
                                }
                            );
                        }
                    });
                };
                reader.readAsText(file);
            }
        };
        input.click();
    };

    const openSaveAllFileWindow = () => {
        const content = ClusterFile.getSerializedCluster();

        if (content === '') {
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
            eventEmitter.emit('xmlInstanceSave');
            setTimeout(openSaveAllFileWindow, 100);
        }
    };

    const handleCancelLoad = () => {
        setMultipleClustersOpen(false);
    };

    const loadClusterFromMultiple = (cluster: XMLCluster) => {
        ClusterFile.initialize(cluster);
        setMultipleClustersOpen(false);
    };

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
                        contain at least one cluster or cluster extension.
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
            <InfoDialog
                isVisible={multipleClustersOpen}
                onHide={() => setMultipleClustersOpen(false)}
                title="Multiple clusters in the single file"
                footer={
                    <DialogButton onClick={handleCancelLoad}>
                        Cancel
                    </DialogButton>
                }
            >
                This file contains multiple clusters, but only one can be loaded
                at a time.
                <br />
                Please select one cluster from the list below to load and edit:
                <List
                    sx={{
                        width: '100%',
                        maxHeight: 300,
                        bgcolor: 'background.paper',
                        overflow: 'auto',
                    }}
                    className="multipleClusterSelection"
                >
                    {localClustersList.map(cluster => (
                        <ListItem
                            component="div"
                            disablePadding
                            key={cluster.name}
                        >
                            <ListItemButton
                                onClick={() => loadClusterFromMultiple(cluster)}
                            >
                                <ListItemText primary={cluster.name} />
                            </ListItemButton>
                        </ListItem>
                    ))}
                </List>
            </InfoDialog>
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
