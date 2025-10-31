/*
 * Copyright (c) 2025 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: LicenseRef-Nordic-4-Clause
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import { logger, telemetry } from '@nordicsemiconductor/pc-nrfconnect-shared';

import { defaultXMLCluster, defaultXMLConfigurator } from '../defaults';
import {
    HexString,
    XMLAttribute,
    XMLCluster,
    XMLClusterExtension,
    XMLCommand,
    XMLConfigurator,
    XMLDeviceType,
    XMLEnum,
    XMLEvent,
    XMLExtensionConfigurator,
    XMLFile,
    XMLStruct,
} from '../defines';
import {
    hasNonDefaultDeviceTypeValues,
    validateForSave,
} from '../SidePanel/FileValidation';
import { parseClusterXML, serializeClusterXML } from '../xmlClusterParser';
import eventEmitter from './EventEmitter';
import { deepClone } from './Utils';
/**
 * Static class for Matter cluster file management.
 *
 * This class provides functionality to load, parse, modify, and serialize Matter cluster XML files.
 * It maintains two instances of the XML configuration:
 * - XMLCurrentInstance: tracks user modifications
 * - XMLBaseInstance: stores the original state for comparison
 *
 * The class supports both standard cluster files and cluster extension files.
 *
 * @class ClusterFile
 * @example
 * const fileInput = document.getElementById('fileInput');
 * fileInput.addEventListener('change', async (event) => {
 *   const file = event.target.files[0];
 *   if (file) {
 *     const content = await file.text();
 *     const success = await ClusterFile.load(file, content);
 *
 *     if (success) {
 *       if (await ClusterFile.isMultipleCluster(content)) {
 *         const clusters = ClusterFile.file.cluster;
 *         ClusterFile.initialize(clusters[0]);
 *       } else {
 *         console.log('Loaded cluster:', ClusterFile.XMLCurrentInstance.cluster.name);
 *       }
 *     }
 *   }
 * });
 *
 * const saveExtensionButton = document.getElementById('saveExtensionButton');
 * saveExtensionButton.addEventListener('click', () => {
 *   const serializedExtension = ClusterFile.getSerializedClusterExtension();
 *   if (serializedExtension) {
 *     console.log('Extension XML:', serializedExtension);
 *   }
 * });
 */
class ClusterFile {
    static loadedClusterExtension = false;
    static file: XMLFile;
    static extensionFile: XMLExtensionConfigurator;
    static fileName: string;
    static fileUrl: File;
    static content: string;
    static originalClusters: XMLCluster[] = [];
    static originalDeviceTypes: XMLDeviceType[] = [];
    static originalClusterExtensions: XMLClusterExtension[] = [];
    static editingClusterIndex = -1;
    static editingDeviceTypeIndex = -1;
    static editingExtensionIndex = -1;

    // Available items for side panel lists (these are working copies that get updated with user changes)
    static availableClusters: XMLCluster[] = [];
    static availableDeviceTypes: XMLDeviceType[] = [];
    static availableExtensions: XMLClusterExtension[] = [];

    /**
     * The current instance of the cluster file.
     * This instance is used to track the changes provided by the user.
     */
    static XMLCurrentInstance: XMLConfigurator = deepClone(
        defaultXMLConfigurator
    );

    /**
     * The base instance of the cluster file.
     * This instance is used to compare the changes with the original file to generate the cluster extension.
     */
    static XMLBaseInstance: XMLConfigurator = deepClone(defaultXMLConfigurator);

    static XMLDefaultInstance: XMLConfigurator = deepClone(
        defaultXMLConfigurator
    );

    /**
     * Checks if the cluster file contains multiple clusters.
     *
     * @function ClusterFile.isMultipleCluster
     * @param {string} content - The content of the cluster file.
     * @returns {boolean} True if the cluster file contains multiple clusters, false otherwise.
     *
     * @example
     * const content = await file.text();
     * const hasMultipleClusters = await ClusterFile.isMultipleCluster(content);
     * if (hasMultipleClusters) {
     *   console.log('File contains multiple clusters');
     * }
     */
    static async isMultipleCluster(content: string) {
        const result = (await parseClusterXML(content)) as XMLFile;
        if (!result.cluster) {
            return false;
        }
        return result.cluster.length > 1;
    }

    /**
     * Loads the cluster file.
     *
     * This function loads the provided file asynchronously and parses it to the XMLFile interface.
     * If the parsing fails, or the provided file does not contain any clusters, the function returns false.
     *
     * @function ClusterFile.load
     * @param {File} fileUrl - The file URL of the cluster file.
     * @param {string} content - The content of the cluster file.
     * @returns {boolean} True if the cluster file is loaded, false otherwise.
     *
     * @example
     * const fileInput = document.getElementById('fileInput');
     *
     * fileInput.addEventListener('change', async (event) => {
     *   const file = event.target.files[0];
     *   if (file) {
     *     try {
     *       const content = await file.text();
     *       const loaded = await ClusterFile.load(file, content);
     *
     *       if (loaded) {
     *         console.log('Successfully loaded cluster file:', file.name);
     *         eventEmitter.emit('xmlInstanceChanged');
     *       } else {
     *         console.error('Failed to load cluster file: Invalid format or no clusters found');
     *       }
     *     } catch (error) {
     *       console.error('Error reading file:', error);
     *     }
     *   }
     * });
     */
    static async load(fileUrl: File, content: string): Promise<boolean> {
        try {
            // Clear XMLCurrentInstance and XMLBaseInstance before loading new data
            // Create deep copies to ensure they are independent objects (use deepClone to preserve HexString)
            this.XMLCurrentInstance = deepClone(defaultXMLConfigurator);
            this.XMLBaseInstance = deepClone(defaultXMLConfigurator);

            this.fileUrl = fileUrl;
            this.content = content;
            this.fileName = fileUrl.name;
            const configurator = await parseClusterXML(content);
            this.file = configurator as XMLFile;
            logger.info('Loaded cluster file:', fileUrl.name);
            telemetry.sendEvent('Loaded cluster file');
            this.loadedClusterExtension = false;

            // Store original clusters and device types for preservation
            if (this.file.cluster) {
                this.originalClusters = Array.isArray(this.file.cluster)
                    ? [...this.file.cluster]
                    : [this.file.cluster];
            } else {
                this.originalClusters = [];
            }

            if (this.file.deviceType) {
                this.originalDeviceTypes = Array.isArray(this.file.deviceType)
                    ? [...this.file.deviceType]
                    : [this.file.deviceType];
            } else {
                this.originalDeviceTypes = [];
            }

            // Store original cluster extensions
            if (this.file.clusterExtension) {
                this.originalClusterExtensions = Array.isArray(
                    this.file.clusterExtension
                )
                    ? [...this.file.clusterExtension]
                    : [this.file.clusterExtension];
            } else {
                this.originalClusterExtensions = [];
            }

            // Reset editing indices
            this.editingClusterIndex = -1;
            this.editingDeviceTypeIndex = -1;
            this.editingExtensionIndex = -1;

            return (
                Array.isArray(this.file.cluster) ||
                this.file.cluster !== undefined ||
                this.file.deviceType !== undefined
            );
        } catch (error) {
            telemetry.sendEvent('Error parsing XML file while loading cluster');
            logger.error('Error parsing XML:', error);
            return false;
        }
    }

    /**
     * Loads the cluster extension file.
     *
     * This function loads the provided file asynchronously and parses it to the XMLExtensionConfigurator interface.
     * If the parsing fails, or the provided file does not contain any cluster extension, the function returns false.
     * The function will update the XMLCurrentInstance with the extension data and emit an 'xmlInstanceChanged' event.
     *
     * @function ClusterFile.loadExtension
     * @param {File} fileUrl - The file URL of the cluster extension file.
     * @param {string} content - The content of the cluster extension file.
     * @returns {boolean} True if the cluster extension file is loaded, false otherwise.
     *
     * @example
     * const extensionInput = document.getElementById('extensionInput');
     *
     * extensionInput.addEventListener('change', async (event) => {
     *   const file = event.target.files[0];
     *   if (file) {
     *     try {
     *       const content = await file.text();
     *       const loaded = await ClusterFile.loadExtension(file, content);
     *
     *       if (loaded) {
     *         console.log('Successfully loaded extension file:', file.name);
     *         updateExtensionUI();
     *       } else {
     *         console.error('Failed to load extension: Invalid format or no extension data found');
     *       }
     *     } catch (error) {
     *       console.error('Error reading extension file:', error);
     *     }
     *   }
     * });
     *
     * function updateExtensionUI() {
     *   const attributes = ClusterFile.XMLCurrentInstance.cluster.attribute || [];
     *   const commands = ClusterFile.XMLCurrentInstance.cluster.command || [];
     *   const events = ClusterFile.XMLCurrentInstance.cluster.event || [];
     *
     *   console.log(`Loaded ${attributes.length} attributes, ${commands.length} commands, ${events.length} events`);
     * }
     */
    static async loadExtension(
        fileUrl: File,
        content: string
    ): Promise<boolean> {
        try {
            this.fileUrl = fileUrl;
            this.content = content;
            this.fileName = fileUrl.name;
            const configurator = await parseClusterXML(content);
            this.extensionFile = configurator as XMLExtensionConfigurator;
            if (!this.extensionFile.clusterExtension) {
                return false;
            }

            // Store original cluster extensions
            if (Array.isArray(this.extensionFile.clusterExtension)) {
                this.originalClusterExtensions =
                    this.extensionFile.clusterExtension;
            } else {
                this.originalClusterExtensions = [
                    this.extensionFile.clusterExtension,
                ];
            }

            // Reset editing index
            this.editingExtensionIndex = -1;

            // If single extension, initialize it directly
            if (this.originalClusterExtensions.length === 1) {
                this.initializeExtension(this.originalClusterExtensions[0], 0);
            }
            // If multiple extensions, caller needs to handle selection
            // Don't initialize here, let Buttons.tsx show the selection dialog

            telemetry.sendEvent('Loaded cluster exension file');
            logger.info('Loaded cluster extension file:', fileUrl.name);
            return true;
        } catch (error) {
            telemetry.sendErrorReport(
                'Error parsing XML while loading cluster extension'
            );
            logger.error('Error parsing XML:', error);
            return false;
        }
    }

    /**
     * Saves current changes back to the appropriate working array before switching elements.
     * This ensures changes are preserved when navigating between multiple items.
     *
     * @function saveCurrentChanges
     * @returns {void}
     */
    static saveCurrentChanges() {
        // First, emit 'xmlInstanceSave' to ensure all table data (attributes, commands, events)
        // is persisted from UI state to XMLCurrentInstance before we save it
        eventEmitter.emit('xmlInstanceSave');

        // Save cluster changes
        if (
            this.editingClusterIndex >= 0 &&
            this.editingClusterIndex < this.availableClusters.length &&
            this.XMLCurrentInstance.cluster
        ) {
            this.availableClusters[this.editingClusterIndex] = deepClone(
                this.XMLCurrentInstance.cluster
            );
        }

        // Save device type changes
        if (
            this.editingDeviceTypeIndex >= 0 &&
            this.editingDeviceTypeIndex < this.availableDeviceTypes.length &&
            this.XMLCurrentInstance.deviceType
        ) {
            this.availableDeviceTypes[this.editingDeviceTypeIndex] = deepClone(
                this.XMLCurrentInstance.deviceType
            );
        }

        // Save extension changes
        if (
            this.editingExtensionIndex >= 0 &&
            this.editingExtensionIndex < this.availableExtensions.length &&
            this.loadedClusterExtension &&
            this.XMLCurrentInstance.cluster
        ) {
            // Create updated extension object with current cluster data
            const updatedExtension: XMLClusterExtension = {
                $: {
                    code: deepClone(
                        this.XMLCurrentInstance.cluster.code as HexString
                    ),
                },
            };

            // Copy attributes, commands, and events if they exist
            if (this.XMLCurrentInstance.cluster.attribute) {
                updatedExtension.attribute = deepClone(
                    this.XMLCurrentInstance.cluster.attribute
                );
            }

            if (this.XMLCurrentInstance.cluster.command) {
                updatedExtension.command = deepClone(
                    this.XMLCurrentInstance.cluster.command
                );
            }

            if (this.XMLCurrentInstance.cluster.event) {
                updatedExtension.event = deepClone(
                    this.XMLCurrentInstance.cluster.event
                );
            }

            // Update the extension in the array
            this.availableExtensions[this.editingExtensionIndex] =
                updatedExtension;
        }
    }

    /**
     * Initializes a specific cluster extension from multiple extensions.
     *
     * This function sets up the XMLCurrentInstance and XMLBaseInstance with the selected
     * cluster extension's attributes, commands, and events. It is called either automatically
     * when a single extension is loaded, or manually after the user selects an extension
     * from multiple available extensions.
     *
     * @function ClusterFile.initializeExtension
     * @param {XMLClusterExtension} extension - The cluster extension to initialize
     * @param {number} extensionIndex - The index of the extension in the original array
     * @returns {void}
     */
    static initializeExtension(
        extension: XMLClusterExtension,
        extensionIndex = 0
    ) {
        // Save current changes before switching
        this.saveCurrentChanges();

        this.editingExtensionIndex = extensionIndex;
        // Reset cluster index since we're editing an extension (mutual exclusivity)
        this.editingClusterIndex = -1;

        // Clear XMLCurrentInstance and XMLBaseInstance
        this.XMLCurrentInstance = {
            cluster: {
                domain: '',
                name: 'Cluster Extension',
                code: new HexString(0),
                define: '',
                description: '',
            },
        };

        this.XMLBaseInstance = {
            cluster: {
                domain: '',
                name: 'Cluster Extension',
                code: new HexString(0),
                define: '',
                description: '',
            },
        };

        // Read from the working array to get any saved changes, or fall back to parameter
        // This supports both change preservation (when availableExtensions is populated) and
        // backward compatibility (when called with just an extension parameter, e.g., in tests or initial load)
        let workingExtension: XMLClusterExtension;
        if (
            this.availableExtensions.length > extensionIndex &&
            this.availableExtensions[extensionIndex]
        ) {
            // Use saved version from availableExtensions (preserves changes when switching)
            workingExtension = deepClone(
                this.availableExtensions[extensionIndex]
            );
        } else {
            // Fall back to parameter (for initial load or tests)
            workingExtension = extension;
            // Also populate availableExtensions for consistency
            if (extension) {
                this.availableExtensions[extensionIndex] = deepClone(extension);
            }
        }

        // Copy extension attributes, commands and events
        this.XMLCurrentInstance.cluster.code = workingExtension.$
            .code as HexString;

        if (workingExtension.attribute) {
            this.XMLCurrentInstance.cluster.attribute =
                workingExtension.attribute;
        }

        if (workingExtension.command) {
            this.XMLCurrentInstance.cluster.command = workingExtension.command;
        }

        if (workingExtension.event) {
            this.XMLCurrentInstance.cluster.event = workingExtension.event;
        }

        this.loadedClusterExtension = true;

        eventEmitter.emit('xmlInstanceChanged');
    }

    /**
     * Initializes the current instance of the cluster file.
     *
     * This function copies all elements except cluster from the XMLFile to the XMLCurrentInstance.
     * It should be called after choosing a single cluster from the multiple clusters available in the cluster file.
     *
     * @function ClusterFile.initialize
     * @param {XMLCluster} xmlCluster - The cluster to be added to the XMLCurrentInstance.
     * @param {number} clusterIndex - The index of the cluster being edited (default: 0)
     * @returns {void}
     */
    static initialize(xmlCluster: XMLCluster, clusterIndex = 0) {
        // Save current changes before switching
        this.saveCurrentChanges();

        this.editingClusterIndex = clusterIndex;
        // Reset extension index since we're editing a cluster (mutual exclusivity)
        this.editingExtensionIndex = -1;
        // Mark that we're not editing an extension
        this.loadedClusterExtension = false;
        // Reset XMLCurrentInstance to clean state
        this.XMLCurrentInstance = {
            cluster: deepClone(defaultXMLCluster),
        };

        // Copy all elements except cluster from XMLFile to XMLCurrentInstance
        if (this.file) {
            Object.keys(this.file).forEach(key => {
                if (key !== 'cluster') {
                    (this.XMLCurrentInstance as any)[key] = (this.file as any)[
                        key
                    ];
                }
            });
        }

        // Read from the working array to get any saved changes, or fall back to parameter
        // This supports both change preservation (when availableClusters is populated) and
        // backward compatibility (when called with just a cluster parameter, e.g., in tests)
        if (
            this.availableClusters.length > clusterIndex &&
            this.availableClusters[clusterIndex]
        ) {
            // Use saved version from availableClusters (preserves changes when switching)
            this.XMLCurrentInstance.cluster = deepClone(
                this.availableClusters[clusterIndex]
            );
        } else {
            // Fall back to parameter (for initial load or tests)
            // Clone the parameter to ensure we have an independent copy
            this.XMLCurrentInstance.cluster = deepClone(xmlCluster);
            // Also populate availableClusters for consistency
            if (xmlCluster) {
                this.availableClusters[clusterIndex] = deepClone(xmlCluster);
            }
        }
        eventEmitter.emit('xmlInstanceChanged');

        // Wait for emit to finish and copy XMLCurrentInstance to XMLBaseInstance
        setTimeout(() => {
            // Copy current instance (use deepClone to preserve HexString)
            this.XMLBaseInstance = deepClone(this.XMLCurrentInstance);
        }, 100);

        // Convert HexString to XMLDeviceTypeIds structure if needed
        if (this.XMLCurrentInstance.deviceType?.deviceId) {
            // Check if deviceId is a HexString and convert it to XMLDeviceTypeIds structure
            if (
                this.XMLCurrentInstance.deviceType.deviceId instanceof HexString
            ) {
                this.XMLCurrentInstance.deviceType.deviceId = {
                    $: {
                        editable: false,
                    },
                    _: this.XMLCurrentInstance.deviceType.deviceId,
                };
            }
        }

        if (this.XMLCurrentInstance.deviceType?.profileId) {
            // Check if profileId is a HexString and convert it to XMLDeviceTypeIds structure
            if (
                this.XMLCurrentInstance.deviceType.profileId instanceof
                HexString
            ) {
                this.XMLCurrentInstance.deviceType.profileId = {
                    $: {
                        editable: false,
                    },
                    _: this.XMLCurrentInstance.deviceType.profileId,
                };
            }
        }
    }

    /**
     * Gets the new attributes of the cluster.
     *
     * This function compares the current cluster with the base cluster and returns the new attributes.
     *
     * @function ClusterFile.getNewAttributes
     * @param {boolean} compareToDefault - Whether to compare to the default cluster.
     * @returns {XMLAttribute[]} The new attributes of the cluster.
     */
    static getNewAttributes(compareToDefault = false) {
        const diffAttributes: XMLAttribute[] = [];

        if (
            compareToDefault &&
            this.XMLCurrentInstance.cluster.attribute &&
            JSON.stringify(this.XMLCurrentInstance.cluster.attribute) !==
                JSON.stringify(this.XMLDefaultInstance.cluster.attribute)
        ) {
            for (
                let i = 0;
                i < this.XMLCurrentInstance.cluster.attribute.length;
                i += 1
            ) {
                diffAttributes.push(
                    this.XMLCurrentInstance.cluster.attribute[i]
                );
            }
        }

        if (compareToDefault) {
            return this.XMLCurrentInstance.cluster.attribute;
        }

        // The base cluster has attributes
        if (
            this.XMLCurrentInstance.cluster.attribute &&
            this.XMLBaseInstance.cluster.attribute
        ) {
            const diffLen =
                this.XMLCurrentInstance.cluster.attribute.length -
                this.XMLBaseInstance.cluster.attribute.length;
            for (let i = 0; i < diffLen; i += 1) {
                diffAttributes.push(
                    this.XMLCurrentInstance.cluster.attribute[
                        i + this.XMLBaseInstance.cluster.attribute.length
                    ]
                );
            }
        }
        // The base cluster has no attributes
        if (
            this.XMLCurrentInstance.cluster.attribute &&
            !this.XMLBaseInstance.cluster.attribute
        ) {
            for (
                let i = 0;
                i < this.XMLCurrentInstance.cluster.attribute.length;
                i += 1
            ) {
                diffAttributes.push(
                    this.XMLCurrentInstance.cluster.attribute[i]
                );
            }
        }

        return diffAttributes;
    }

    /**
     * Gets the new commands of the cluster.
     *
     * This function compares the current cluster with the base cluster and returns the new commands.
     *
     * @function ClusterFile.getNewCommands
     * @param {boolean} compareToDefault - Whether to compare to the default cluster.
     * @returns {XMLCommand[]} The new commands of the cluster.
     */
    static getNewCommands(compareToDefault = false) {
        const diffCommands: XMLCommand[] = [];

        if (
            compareToDefault &&
            this.XMLCurrentInstance.cluster.command &&
            JSON.stringify(this.XMLCurrentInstance.cluster.command) !==
                JSON.stringify(this.XMLDefaultInstance.cluster.command)
        ) {
            for (
                let i = 0;
                i < this.XMLCurrentInstance.cluster.command.length;
                i += 1
            ) {
                diffCommands.push(this.XMLCurrentInstance.cluster.command[i]);
            }
        }

        if (compareToDefault) {
            return this.XMLCurrentInstance.cluster.command;
        }

        // The base cluster has commands
        if (
            this.XMLCurrentInstance.cluster.command &&
            this.XMLBaseInstance.cluster.command
        ) {
            const diffLen =
                this.XMLCurrentInstance.cluster.command.length -
                this.XMLBaseInstance.cluster.command.length;
            for (let i = 0; i < diffLen; i += 1) {
                diffCommands.push(
                    this.XMLCurrentInstance.cluster.command[
                        i + this.XMLBaseInstance.cluster.command.length
                    ]
                );
            }
        }

        // The base cluster has no commands
        if (
            this.XMLCurrentInstance.cluster.command &&
            !this.XMLBaseInstance.cluster.command
        ) {
            for (
                let i = 0;
                i < this.XMLCurrentInstance.cluster.command.length;
                i += 1
            ) {
                diffCommands.push(this.XMLCurrentInstance.cluster.command[i]);
            }
        }

        return diffCommands;
    }

    /**
     * Gets the new events of the cluster.
     *
     * This function compares the current cluster with the base cluster and returns the new events.
     *
     * @function ClusterFile.getNewEvents
     * @param {boolean} compareToDefault - Whether to compare to the default cluster.
     * @returns {XMLEvent[]} The new events of the cluster.
     */
    static getNewEvents(compareToDefault = false) {
        const diffEvents: XMLEvent[] = [];

        if (
            compareToDefault &&
            this.XMLCurrentInstance.cluster.event &&
            JSON.stringify(this.XMLCurrentInstance.cluster.event) !==
                JSON.stringify(this.XMLDefaultInstance.cluster.event)
        ) {
            for (
                let i = 0;
                i < this.XMLCurrentInstance.cluster.event.length;
                i += 1
            ) {
                diffEvents.push(this.XMLCurrentInstance.cluster.event[i]);
            }
        }

        if (compareToDefault) {
            return this.XMLCurrentInstance.cluster.event;
        }

        // The base cluster has events
        if (
            this.XMLCurrentInstance.cluster.event &&
            this.XMLBaseInstance.cluster.event
        ) {
            const diffLen =
                this.XMLCurrentInstance.cluster.event.length -
                this.XMLBaseInstance.cluster.event.length;
            for (let i = 0; i < diffLen; i += 1) {
                diffEvents.push(
                    this.XMLCurrentInstance.cluster.event[
                        i + this.XMLBaseInstance.cluster.event.length
                    ]
                );
            }
        }
        // The base cluster has no events
        if (
            this.XMLCurrentInstance.cluster.event &&
            !this.XMLBaseInstance.cluster.event
        ) {
            for (
                let i = 0;
                i < this.XMLCurrentInstance.cluster.event.length;
                i += 1
            ) {
                diffEvents.push(this.XMLCurrentInstance.cluster.event[i]);
            }
        }

        return diffEvents;
    }

    static getNewEnums() {
        const diffEnums: XMLEnum[] = [];
        // The base cluster has enums
        if (this.XMLCurrentInstance.enum && this.XMLBaseInstance.enum) {
            const diffLen =
                this.XMLCurrentInstance.enum.length -
                this.XMLBaseInstance.enum.length;
            for (let i = 0; i < diffLen; i += 1) {
                diffEnums.push(this.XMLCurrentInstance.enum[i]);
            }
        }
        // The base cluster has no enums
        if (this.XMLCurrentInstance.enum && !this.XMLBaseInstance.enum) {
            diffEnums.push(...this.XMLCurrentInstance.enum);
        }

        return diffEnums;
    }

    static getNewStructs() {
        const diffStructs: XMLStruct[] = [];
        // The base cluster has structs
        if (this.XMLCurrentInstance.struct && this.XMLBaseInstance.struct) {
            const diffLen =
                this.XMLCurrentInstance.struct.length -
                this.XMLBaseInstance.struct.length;
            for (let i = 0; i < diffLen; i += 1) {
                diffStructs.push(this.XMLCurrentInstance.struct[i]);
            }
        }
        // The base cluster has no structs
        if (this.XMLCurrentInstance.struct && !this.XMLBaseInstance.struct) {
            diffStructs.push(...this.XMLCurrentInstance.struct);
        }

        return diffStructs;
    }

    static getClusterDiff() {
        const diffCluster: XMLCluster[] = [];

        if (this.XMLCurrentInstance.cluster) {
            if (
                JSON.stringify(this.XMLCurrentInstance.cluster) ===
                JSON.stringify(this.XMLDefaultInstance.cluster)
            ) {
                return [];
            }
        }

        const newAttributes = this.getNewAttributes(true);
        const newCommands = this.getNewCommands(true);
        const newEvents = this.getNewEvents(true);

        diffCluster.push({
            domain: this.XMLCurrentInstance.cluster?.domain || '',
            name: this.XMLCurrentInstance.cluster?.name || '',
            code: this.XMLCurrentInstance.cluster?.code || '',
            define: this.XMLCurrentInstance.cluster?.define || '',
            attribute: newAttributes,
            command: newCommands,
            event: newEvents,
        });

        return diffCluster;
    }

    /**
     * Gets the new device type of the cluster.
     *
     * This function compares the current cluster with the base cluster and returns the new device type.
     *
     * @function ClusterFile.getNewDeviceType
     * @param {boolean} compareToDefault - Whether to compare to the default cluster.
     * @returns {XMLDeviceType} The new device type of the cluster.
     */
    static getNewDeviceType(compareToDefault = false) {
        if (this.XMLCurrentInstance.deviceType) {
            if (
                compareToDefault &&
                JSON.stringify(this.XMLCurrentInstance.deviceType) ===
                    JSON.stringify(this.XMLDefaultInstance.deviceType)
            ) {
                return '';
            }
            if (
                JSON.stringify(this.XMLCurrentInstance.deviceType) ===
                JSON.stringify(this.XMLBaseInstance.deviceType)
            ) {
                return '';
            }
        }

        return this.XMLCurrentInstance.deviceType;
    }

    /**
     * Sends telemetry metrics for cluster extension save operation.
     * Only sends counts of elements, not their content.
     *
     * @function ClusterFile.sendClusterExtensionSaveMetrics
     * @param {XMLAttribute[]} attributes - The attributes to count
     * @param {XMLCommand[]} commands - The commands to count
     * @param {XMLEvent[]} events - The events to count
     * @param {XMLDeviceType | string} deviceType - The device type (if any)
     * @returns {void}
     */
    private static sendClusterExtensionSaveMetrics(
        attributes: XMLAttribute[],
        commands: XMLCommand[],
        events: XMLEvent[],
        deviceType: XMLDeviceType | string
    ) {
        const metrics = {
            attributesCount: attributes?.length || 0,
            commandsCount: commands?.length || 0,
            eventsCount: events?.length || 0,
            hasDeviceType: !!deviceType && deviceType !== '',
        };

        telemetry.sendEvent('Saved cluster extension', metrics);
        logger.info('Cluster extension save metrics:', metrics);
    }

    /**
     * Gets the serialized cluster extension.
     *
     * This function compares the current cluster with the base cluster and returns the serialized cluster extension.
     *
     * @function ClusterFile.getSerializedClusterExtension
     * @returns {string} The serialized cluster extension.
     */
    /**
     * Removes empty description fields from an array of items (attributes, commands, or events).
     * If description is empty string or undefined, removes it from the object.
     *
     * @function ClusterFile.cleanEmptyDescriptions
     * @param {any[]} items - Array of items to clean
     * @returns {any[]} - Cleaned array with empty descriptions removed
     */
    private static cleanEmptyDescriptions(items: any[]): any[] {
        if (!items || items.length === 0) {
            return items;
        }

        return items.map(item => {
            const cleanedItem = { ...item };
            if (
                cleanedItem.description === '' ||
                cleanedItem.description === undefined
            ) {
                delete cleanedItem.description;
            }
            return cleanedItem;
        });
    }

    /**
     * Removes empty description fields from a cluster and its nested elements.
     * This includes the cluster's own description and descriptions in attributes, commands, and events.
     *
     * @function ClusterFile.cleanClusterDescriptions
     * @param {XMLCluster} cluster - The cluster to clean
     * @returns {XMLCluster} - Cleaned cluster with empty descriptions removed
     */
    private static cleanClusterDescriptions(cluster: XMLCluster): XMLCluster {
        const cleanedCluster = { ...cluster };

        // Remove cluster's own empty description
        if (
            cleanedCluster.description === '' ||
            cleanedCluster.description === undefined
        ) {
            delete cleanedCluster.description;
        }

        // Clean descriptions in nested arrays
        if (
            cleanedCluster.attribute &&
            Array.isArray(cleanedCluster.attribute)
        ) {
            cleanedCluster.attribute = this.cleanEmptyDescriptions(
                cleanedCluster.attribute
            );
        }

        if (cleanedCluster.command && Array.isArray(cleanedCluster.command)) {
            cleanedCluster.command = this.cleanEmptyDescriptions(
                cleanedCluster.command
            );
        }

        if (cleanedCluster.event && Array.isArray(cleanedCluster.event)) {
            cleanedCluster.event = this.cleanEmptyDescriptions(
                cleanedCluster.event
            );
        }

        return cleanedCluster;
    }

    /**
     * Cleans a device type by ensuring clusters structure is properly preserved.
     * DeviceTypes don't typically have description fields, but this ensures
     * the clusters.include array is maintained.
     *
     * @function ClusterFile.cleanDeviceTypeDescriptions
     * @param {XMLDeviceType} deviceType - The device type to clean
     * @returns {XMLDeviceType} - Cleaned device type with proper structure
     */
    private static cleanDeviceTypeDescriptions(
        deviceType: XMLDeviceType
    ): XMLDeviceType {
        const cleanedDeviceType: any = { ...deviceType };

        // Remove deviceType's own empty description if it exists (it's an extra field not in type)
        if (
            'description' in cleanedDeviceType &&
            (cleanedDeviceType.description === '' ||
                cleanedDeviceType.description === undefined)
        ) {
            delete cleanedDeviceType.description;
        }

        // Ensure clusters structure is preserved
        // If clusters.include exists and has items, keep it
        // If it's empty but clusters object exists, still keep the structure
        if (cleanedDeviceType.clusters) {
            cleanedDeviceType.clusters = { ...cleanedDeviceType.clusters };

            // Ensure include array exists
            if (!cleanedDeviceType.clusters.include) {
                cleanedDeviceType.clusters.include = [];
            }
        }

        return cleanedDeviceType as XMLDeviceType;
    }

    static getSerializedClusterExtension() {
        const newAttributes = this.getNewAttributes();
        const newCommands = this.getNewCommands();
        const newEvents = this.getNewEvents();
        const newDeviceType = this.getNewDeviceType();

        if (
            newAttributes?.length === 0 &&
            newCommands?.length === 0 &&
            newEvents?.length === 0 &&
            newDeviceType === null
        ) {
            return '';
        }

        const clusterExtensionObject: XMLClusterExtension = {
            $: { code: this.XMLCurrentInstance.cluster.code.toString() },
        };

        clusterExtensionObject.$.code =
            this.XMLCurrentInstance.cluster.code.toString();

        // Clean empty descriptions from attributes, commands, and events
        clusterExtensionObject.attribute = this.cleanEmptyDescriptions(
            newAttributes || []
        );
        clusterExtensionObject.command = this.cleanEmptyDescriptions(
            newCommands || []
        );
        clusterExtensionObject.event = this.cleanEmptyDescriptions(
            newEvents || []
        );

        // Only include deviceType if it has ALL required fields with non-default values
        if (
            newDeviceType &&
            typeof newDeviceType !== 'string' &&
            hasNonDefaultDeviceTypeValues(newDeviceType)
        ) {
            clusterExtensionObject.deviceType = newDeviceType;
        }

        const clusterExtensionInstance: XMLExtensionConfigurator = {
            clusterExtension: clusterExtensionObject,
        };

        // Send telemetry about what was saved
        this.sendClusterExtensionSaveMetrics(
            newAttributes || [],
            newCommands || [],
            newEvents || [],
            newDeviceType || ''
        );

        return serializeClusterXML(clusterExtensionInstance);
    }

    /**
     * Gets the serialized cluster extension XML with original extensions preserved.
     *
     * This method is used when a file originally contained multiple cluster extensions
     * and the user wants to save all of them (with edits applied to the one being edited).
     * It merges the current edited extension back into the original extensions array.
     *
     * @function ClusterFile.getSerializedClusterExtensionWithOriginals
     * @returns {string} - The serialized XML string with all extensions
     */
    static getSerializedClusterExtensionWithOriginals(): string {
        const newAttributes = this.getNewAttributes();
        const newCommands = this.getNewCommands();
        const newEvents = this.getNewEvents();
        const newDeviceType = this.getNewDeviceType();

        if (
            newAttributes?.length === 0 &&
            newCommands?.length === 0 &&
            newEvents?.length === 0 &&
            newDeviceType === null
        ) {
            return '';
        }

        // Create the edited extension object
        const editedExtension: XMLClusterExtension = {
            $: { code: this.XMLCurrentInstance.cluster.code.toString() },
        };

        editedExtension.$.code =
            this.XMLCurrentInstance.cluster.code.toString();

        // Clean empty descriptions from attributes, commands, and events
        editedExtension.attribute = this.cleanEmptyDescriptions(
            newAttributes || []
        );
        editedExtension.command = this.cleanEmptyDescriptions(
            newCommands || []
        );
        editedExtension.event = this.cleanEmptyDescriptions(newEvents || []);

        // Only include deviceType if it has ALL required fields with non-default values
        if (
            newDeviceType &&
            typeof newDeviceType !== 'string' &&
            hasNonDefaultDeviceTypeValues(newDeviceType)
        ) {
            editedExtension.deviceType = newDeviceType;
        }

        // Clone original extensions array
        const extensionsToSave = [...this.originalClusterExtensions];

        // Replace the edited extension at its index
        if (
            this.editingExtensionIndex >= 0 &&
            this.editingExtensionIndex < extensionsToSave.length
        ) {
            extensionsToSave[this.editingExtensionIndex] = editedExtension;
        } else {
            // If index is invalid, just add it to the array
            extensionsToSave.push(editedExtension);
        }

        const clusterExtensionInstance: XMLExtensionConfigurator = {
            clusterExtension:
                extensionsToSave.length === 1
                    ? extensionsToSave[0]
                    : extensionsToSave,
        };

        // Send telemetry about what was saved
        this.sendClusterExtensionSaveMetrics(
            newAttributes || [],
            newCommands || [],
            newEvents || [],
            newDeviceType || ''
        );

        return serializeClusterXML(clusterExtensionInstance);
    }

    /**
     * Sends telemetry metrics for cluster save operation.
     * Only sends counts of elements, not their content.
     *
     * @function ClusterFile.sendClusterSaveMetrics
     * @param {XMLCluster} cluster - The cluster to count elements from
     * @param {XMLEnum[]} enums - The enums to count
     * @param {XMLStruct[]} structs - The structs to count
     * @param {boolean} hasDeviceType - Whether device type is present
     * @param {boolean} hasClusterExtension - Whether cluster extension is present
     * @returns {void}
     */
    private static sendClusterSaveMetrics(
        cluster: XMLCluster | undefined,
        enums: XMLEnum[] | undefined,
        structs: XMLStruct[] | undefined,
        hasDeviceType: boolean,
        hasClusterExtension: boolean
    ) {
        const metrics = {
            attributesCount: cluster?.attribute?.length || 0,
            commandsCount: cluster?.command?.length || 0,
            eventsCount: cluster?.event?.length || 0,
            enumsCount: enums?.length || 0,
            structsCount: structs?.length || 0,
            hasDeviceType,
            hasClusterExtension,
        };

        telemetry.sendEvent('Saved cluster', metrics);
        logger.info('Cluster save metrics:', metrics);
    }

    /**
     * Gets the serialized cluster.
     *
     * This function validates the current instance and returns the serialized cluster.
     * Only includes cluster and device type if they have non-default values.
     *
     * @function ClusterFile.getSerializedCluster
     * @returns {object} Object with either {error: false, xml: string} or {error: true, validationErrors: array} or {error: true, message: string}
     */
    static getSerializedCluster(): any {
        const xmlFile: any = {} as any;

        // Validate before save
        const validation = validateForSave(this.XMLCurrentInstance);

        // Handle "no data to save" case separately
        if (validation.noDataToSave) {
            return {
                error: true,
                noDataToSave: true,
                message: 'No data to save. Please fill in the required fields.',
            };
        }

        if (!validation.isValid) {
            // Return validation errors to caller
            return { error: true, validationErrors: validation.errors };
        }

        if (!validation.shouldSaveCluster && !validation.shouldSaveDeviceType) {
            return {
                error: true,
                message:
                    'No valid data to save. Both cluster and device type have default values.',
            };
        }

        // Include cluster only if it has non-default values
        if (validation.shouldSaveCluster && this.XMLCurrentInstance.cluster) {
            // Clean empty descriptions from cluster before saving
            const cleanedCluster = this.cleanClusterDescriptions(
                this.XMLCurrentInstance.cluster
            );
            xmlFile.cluster = [cleanedCluster as unknown as XMLCluster];
        }

        // Include device type only if it has non-default values
        if (
            validation.shouldSaveDeviceType &&
            this.XMLCurrentInstance.deviceType
        ) {
            // Clean empty descriptions from device type before saving
            const cleanedDeviceType = this.cleanDeviceTypeDescriptions(
                this.XMLCurrentInstance.deviceType
            );
            xmlFile.deviceType = cleanedDeviceType as XMLDeviceType;
        }

        // Preserve enums and structs
        if (this.XMLCurrentInstance.enum) {
            // enum can be a single object or an array
            if (Array.isArray(this.XMLCurrentInstance.enum)) {
                if (this.XMLCurrentInstance.enum.length > 0) {
                    xmlFile.enum = this.XMLCurrentInstance.enum;
                }
            } else {
                xmlFile.enum = this.XMLCurrentInstance.enum;
            }
        }

        if (this.XMLCurrentInstance.struct) {
            // struct can be a single object or an array
            if (Array.isArray(this.XMLCurrentInstance.struct)) {
                if (this.XMLCurrentInstance.struct.length > 0) {
                    xmlFile.struct = this.XMLCurrentInstance.struct;
                }
            } else {
                xmlFile.struct = this.XMLCurrentInstance.struct;
            }
        }

        // Persist clusterExtension if present (prefer current instance, fallback to original file)
        // It allows to keep all the cluster extension entries in the same xml file as the cluster.
        const currentExt = (this.XMLCurrentInstance as any)?.clusterExtension;
        const originalExt = (this.file as any)?.clusterExtension;
        if (currentExt || originalExt) {
            xmlFile.clusterExtension = currentExt || originalExt;
        }

        // Send telemetry about what was saved
        this.sendClusterSaveMetrics(
            validation.shouldSaveCluster
                ? this.XMLCurrentInstance.cluster
                : undefined,
            this.XMLCurrentInstance.enum,
            this.XMLCurrentInstance.struct,
            validation.shouldSaveDeviceType,
            !!(currentExt || originalExt)
        );

        return { error: false, xml: serializeClusterXML(xmlFile) };
    }

    /**
     * Gets the serialized cluster with all original items preserved.
     *
     * This function validates the current instance and returns the serialized cluster
     * with all original clusters and device types, replacing only the edited one.
     *
     * @function ClusterFile.getSerializedClusterWithOriginals
     * @returns {object} Object with either {error: false, xml: string} or {error: true, validationErrors: array}
     */
    static getSerializedClusterWithOriginals(): any {
        const xmlFile: any = {} as any;

        // Validate current edits
        const validation = validateForSave(this.XMLCurrentInstance);

        // Handle "no data to save" case separately
        if (validation.noDataToSave) {
            return {
                error: true,
                noDataToSave: true,
                message: 'No data to save. Please fill in the required fields.',
            };
        }

        if (!validation.isValid) {
            return { error: true, validationErrors: validation.errors };
        }

        // Build clusters array
        if (this.originalClusters.length > 0) {
            // Use availableClusters which contains all modifications
            if (this.availableClusters.length > 0) {
                // Clean empty descriptions from all modified clusters before saving
                xmlFile.cluster = this.availableClusters.map(cluster =>
                    this.cleanClusterDescriptions(cluster)
                );
            } else {
                // Fallback to originals if no modifications
                xmlFile.cluster = [...this.originalClusters];
            }
        } else if (validation.shouldSaveCluster) {
            // Clean empty descriptions from cluster before saving
            const cleanedCluster = this.cleanClusterDescriptions(
                this.XMLCurrentInstance.cluster
            );
            xmlFile.cluster = [cleanedCluster];
        }

        // Build device types array
        if (this.originalDeviceTypes.length > 1) {
            // Use availableDeviceTypes which contains all modifications
            if (this.availableDeviceTypes.length > 0) {
                // Clean empty descriptions from all modified device types before saving
                xmlFile.deviceType = this.availableDeviceTypes.map(deviceType =>
                    this.cleanDeviceTypeDescriptions(deviceType)
                );
            } else {
                // Fallback to originals if no modifications
                xmlFile.deviceType = [...this.originalDeviceTypes];
            }
        } else if (this.originalDeviceTypes.length === 1) {
            // Single device type - use available or current
            if (
                this.availableDeviceTypes.length > 0 &&
                this.availableDeviceTypes[0]
            ) {
                // Clean empty descriptions from device type before saving
                const cleanedDeviceType = this.cleanDeviceTypeDescriptions(
                    this.availableDeviceTypes[0]
                );
                xmlFile.deviceType = cleanedDeviceType;
            } else if (
                validation.shouldSaveDeviceType &&
                this.XMLCurrentInstance.deviceType
            ) {
                // Clean empty descriptions from device type before saving
                const cleanedDeviceType = this.cleanDeviceTypeDescriptions(
                    this.XMLCurrentInstance.deviceType
                );
                xmlFile.deviceType = cleanedDeviceType;
            }
        } else if (
            validation.shouldSaveDeviceType &&
            this.XMLCurrentInstance.deviceType
        ) {
            // No original device types, but current has valid data
            // Clean empty descriptions from device type before saving
            const cleanedDeviceType = this.cleanDeviceTypeDescriptions(
                this.XMLCurrentInstance.deviceType
            );
            xmlFile.deviceType = cleanedDeviceType;
        }

        // Preserve enums and structs
        if (this.XMLCurrentInstance.enum) {
            // enum can be a single object or an array
            if (Array.isArray(this.XMLCurrentInstance.enum)) {
                if (this.XMLCurrentInstance.enum.length > 0) {
                    xmlFile.enum = this.XMLCurrentInstance.enum;
                }
            } else {
                xmlFile.enum = this.XMLCurrentInstance.enum;
            }
        }

        if (this.XMLCurrentInstance.struct) {
            // struct can be a single object or an array
            if (Array.isArray(this.XMLCurrentInstance.struct)) {
                if (this.XMLCurrentInstance.struct.length > 0) {
                    xmlFile.struct = this.XMLCurrentInstance.struct;
                }
            } else {
                xmlFile.struct = this.XMLCurrentInstance.struct;
            }
        }

        // Build cluster extensions array
        if (this.originalClusterExtensions.length > 0) {
            // Use availableExtensions which contains all modifications
            if (this.availableExtensions.length > 0) {
                xmlFile.clusterExtension = [...this.availableExtensions];
            } else {
                // Fallback to originals if no modifications
                xmlFile.clusterExtension = [...this.originalClusterExtensions];
            }
        } else {
            // Persist clusterExtension if present in current instance
            const currentExt = (this.XMLCurrentInstance as any)
                ?.clusterExtension;
            if (currentExt) {
                xmlFile.clusterExtension = currentExt;
            }
        }

        // Send telemetry about what was saved
        this.sendClusterSaveMetrics(
            validation.shouldSaveCluster
                ? this.XMLCurrentInstance.cluster
                : undefined,
            this.XMLCurrentInstance.enum,
            this.XMLCurrentInstance.struct,
            validation.shouldSaveDeviceType,
            !!xmlFile.clusterExtension
        );

        return { error: false, xml: serializeClusterXML(xmlFile) };
    }
}

export default ClusterFile;
