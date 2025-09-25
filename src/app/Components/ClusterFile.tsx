/*
 * Copyright (c) 2025 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: LicenseRef-Nordic-4-Clause
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import { logger } from '@nordicsemiconductor/pc-nrfconnect-shared';

import { defaultXMLConfigurator } from '../defaults';
import {
    HexString,
    XMLAttribute,
    XMLCluster,
    XMLCommand,
    XMLConfigurator,
    XMLDeviceType,
    XMLEnum,
    XMLEvent,
    XMLExtensionConfigurator,
    XMLFile,
    XMLStruct,
} from '../defines';
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

    /**
     * The current instance of the cluster file.
     * This instance is used to track the changes provided by the user.
     */
    static XMLCurrentInstance: XMLConfigurator = defaultXMLConfigurator;

    /**
     * The base instance of the cluster file.
     * This instance is used to compare the changes with the original file to generate the cluster extension.
     */
    static XMLBaseInstance: XMLConfigurator = defaultXMLConfigurator;

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
            // Create deep copies to ensure they are independent objects
            this.XMLCurrentInstance = JSON.parse(
                JSON.stringify(defaultXMLConfigurator)
            );
            this.XMLBaseInstance = JSON.parse(
                JSON.stringify(defaultXMLConfigurator)
            );

            this.fileUrl = fileUrl;
            this.content = content;
            this.fileName = fileUrl.name;
            const configurator = await parseClusterXML(content);
            this.file = configurator as XMLFile;
            logger.info('Loaded cluster file:', fileUrl.name);
            this.loadedClusterExtension = false;
            return (
                Array.isArray(this.file.cluster) ||
                this.file.cluster !== undefined || this.file.deviceType !== undefined
            );
        } catch (error) {
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

            // Copy extension attributes, commands and events
            this.XMLCurrentInstance.cluster.code = this.extensionFile
                .clusterExtension.$.code as HexString;

            if (this.extensionFile.clusterExtension.attribute) {
                this.XMLCurrentInstance.cluster.attribute =
                    this.extensionFile.clusterExtension.attribute;
            }

            if (this.extensionFile.clusterExtension.command) {
                this.XMLCurrentInstance.cluster.command =
                    this.extensionFile.clusterExtension.command;
            }

            if (this.extensionFile.clusterExtension.event) {
                this.XMLCurrentInstance.cluster.event =
                    this.extensionFile.clusterExtension.event;
            }

            this.loadedClusterExtension = true;

            eventEmitter.emit('xmlInstanceChanged');
            logger.info('Loaded cluster extension file:', fileUrl.name);
            return true;
        } catch (error) {
            logger.error('Error parsing XML:', error);
            return false;
        }
    }

    /**
     * Initializes the current instance of the cluster file.
     *
     * This function copies all elements except cluster from the XMLFile to the XMLCurrentInstance.
     * It should be called after choosing a single cluster from the multiple clusters available in the cluster file.
     *
     * @function ClusterFile.initialize
     * @param {XMLCluster} xmlCluster - The cluster to be added to the XMLCurrentInstance.
     * @returns {void}
     */
    static initialize(xmlCluster: XMLCluster) {
        // Reset XMLCurrentInstance to clean state
        this.XMLCurrentInstance = JSON.parse(
            JSON.stringify(defaultXMLConfigurator)
        );

        // Copy all elements except cluster from XMLFile to XMLCurrentInstance
        Object.keys(this.file).forEach(key => {
            if (key !== 'cluster') {
                (this.XMLCurrentInstance as any)[key] = (this.file as any)[key];
            }
        });

        this.XMLCurrentInstance.cluster = xmlCluster;
        eventEmitter.emit('xmlInstanceChanged');

        // Wait for emit to finish and copy XMLCurrentInstance to XMLBaseInstance
        setTimeout(() => {
            // Reset XMLBaseInstance to clean state before copying
            this.XMLBaseInstance = JSON.parse(
                JSON.stringify(defaultXMLConfigurator)
            );

            this.XMLBaseInstance = JSON.parse(
                JSON.stringify(this.XMLCurrentInstance)
            );
        }, 100);

        // Convert HexString to XMLDeviceTypeIds structure if needed
        if (this.XMLCurrentInstance.deviceType?.deviceId) {
            // Check if deviceId is a HexString and convert it to XMLDeviceTypeIds structure
            if (this.XMLCurrentInstance.deviceType.deviceId instanceof HexString) {
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
            if (this.XMLCurrentInstance.deviceType.profileId instanceof HexString) {
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

        if(compareToDefault){
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

        if(compareToDefault){
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

        if(compareToDefault){
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
                return "";
            }
            if (
                JSON.stringify(this.XMLCurrentInstance.deviceType) ===
                JSON.stringify(this.XMLBaseInstance.deviceType)
            ) {
                return "";
            }
        }

        return this.XMLCurrentInstance.deviceType;
    }

    /**
     * Gets the serialized cluster extension.
     *
     * This function compares the current cluster with the base cluster and returns the serialized cluster extension.
     *
     * @function ClusterFile.getSerializedClusterExtension
     * @returns {string} The serialized cluster extension.
     */
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
            return "";
        }

        const clusterExtensionInstance: XMLExtensionConfigurator = {
            clusterExtension: {
                $: { code: this.XMLCurrentInstance.cluster.code.toString() },
            },
        };

        clusterExtensionInstance.clusterExtension.$.code =
            this.XMLCurrentInstance.cluster.code.toString();
        clusterExtensionInstance.clusterExtension.attribute = newAttributes;
        clusterExtensionInstance.clusterExtension.command = newCommands;
        clusterExtensionInstance.clusterExtension.event = newEvents;
        clusterExtensionInstance.clusterExtension.deviceType =
            newDeviceType as XMLDeviceType;
        return serializeClusterXML(clusterExtensionInstance);
    }

    /**
     * Gets the serialized cluster.
     *
     * This function returns the serialized cluster.
     *
     * @function ClusterFile.getSerializedCluster
     * @returns {string} The serialized cluster.
     */
    static getSerializedCluster() {
        // Always serialize the fully loaded/initialized content, not only diffs,
        // so that enums and structs are preserved even without modifications.
        const xmlFile: any = {} as any;

        if (this.XMLCurrentInstance.cluster) {
            xmlFile.cluster = [
                this.XMLCurrentInstance.cluster as unknown as XMLCluster,
            ];
        }

        if (this.XMLCurrentInstance.enum) {
            xmlFile.enum = this.XMLCurrentInstance.enum;
        }

        if (this.XMLCurrentInstance.struct) {
            xmlFile.struct = this.XMLCurrentInstance.struct;
        }

        if (this.XMLCurrentInstance.deviceType !== undefined) {
            xmlFile.deviceType = this.XMLCurrentInstance
                .deviceType as XMLDeviceType;
        }

        // Persist clusterExtension if present (prefer current instance, fallback to original file)
        // It allows to keep all the cluster extension entries in the same xml file as the cluster.
        const currentExt = (this.XMLCurrentInstance as any)?.clusterExtension;
        const originalExt = (this.file as any)?.clusterExtension;
        if (currentExt || originalExt) {
            xmlFile.clusterExtension = currentExt || originalExt;
        }

        return serializeClusterXML(xmlFile);
    }
}

export default ClusterFile;
