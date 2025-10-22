/*
 * Copyright (c) 2025 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: LicenseRef-Nordic-4-Clause
 */

import {
    HexString,
    XMLCluster,
    XMLClusterExtension,
    XMLConfigurator,
    XMLDeviceType,
    XMLExtensionConfigurator,
    XMLFile,
} from '../defines';

export interface ValidationError {
    path: string;
    field: string;
    message?: string;
}

export interface FileValidationResult {
    isValid: boolean;
    errors: ValidationError[];
    hasMultipleClusters: boolean;
    hasMultipleDeviceTypes: boolean;
    hasMultipleExtensions: boolean;
    clusters: XMLCluster[];
    deviceTypes: XMLDeviceType[];
    extensions: XMLClusterExtension[];
}

export interface SaveValidationResult {
    shouldSaveCluster: boolean;
    shouldSaveDeviceType: boolean;
    isValid: boolean;
    errors: ValidationError[];
    noDataToSave: boolean;
}

export interface ExtensionFileValidationResult {
    isValid: boolean;
    errors: ValidationError[];
    hasMultipleExtensions: boolean;
    extensions: XMLClusterExtension[];
}

export interface AutoFilledItem {
    itemName: string;
    missingFields: string[];
}

export interface AutoFillResult {
    autoFilledFields: string[]; // Legacy flat list for logging
    autoFilledItems: AutoFilledItem[]; // Structured list for display
}

/**
 * Checks if a cluster has all required fields with non-default values.
 * Used to determine if a cluster should be included in the saved file.
 *
 * A cluster is considered valid for saving only if ALL required fields
 * (name, code, define, domain) have non-default values. This prevents
 * partial/incomplete clusters from being validated and saved.
 *
 * @function hasNonDefaultClusterValues
 * @param {XMLCluster} cluster - The cluster to check
 * @returns {boolean} - True if cluster has ALL required fields with non-default values, false otherwise
 */
function hasNonDefaultClusterValues(cluster: XMLCluster): boolean {
    if (!cluster) {
        return false;
    }

    // Check if ALL required fields have non-default values
    // If any required field is missing/default, the cluster should not be saved
    const hasName = cluster.name && cluster.name !== '';
    const hasDefine = cluster.define && cluster.define !== '';
    const hasDomain = cluster.domain && cluster.domain !== '';
    const hasCode =
        cluster.code &&
        cluster.code instanceof HexString &&
        cluster.code.toNumber() !== 0;

    // ALL required fields must have non-default values
    return !!(hasName && hasDefine && hasDomain && hasCode);
}

/**
 * Checks if a device type has all required fields with non-default values.
 * Used to determine if a device type should be included in the saved file.
 *
 * A device type is considered valid for saving only if ALL required fields
 * have non-default values. This prevents partial/incomplete device types
 * from being validated and saved.
 *
 * @function hasNonDefaultDeviceTypeValues
 * @param {XMLDeviceType} deviceType - The device type to check
 * @returns {boolean} - True if device type has ALL required fields with non-default values, false otherwise
 */
export function hasNonDefaultDeviceTypeValues(
    deviceType: XMLDeviceType
): boolean {
    if (!deviceType) {
        return false;
    }

    // Check if ALL required fields have non-default values
    const hasName = deviceType.name && deviceType.name !== '';
    const hasTypeName = deviceType.typeName && deviceType.typeName !== '';
    const hasDomain = deviceType.domain && deviceType.domain !== '';
    const hasClass = deviceType.class && deviceType.class !== '';
    const hasScope = deviceType.scope && deviceType.scope !== '';

    // Check deviceId (can be structured object with _ property or bare HexString)
    let hasDeviceId = false;
    if (deviceType.deviceId) {
        if (deviceType.deviceId._ instanceof HexString) {
            hasDeviceId = deviceType.deviceId._.toNumber() !== 0;
        } else if (deviceType.deviceId instanceof HexString) {
            hasDeviceId = (deviceType.deviceId as HexString).toNumber() !== 0;
        }
    }

    // Check profileId (can be structured object with _ property or bare HexString)
    let hasProfileId = false;
    if (deviceType.profileId) {
        if (deviceType.profileId._ instanceof HexString) {
            hasProfileId = deviceType.profileId._.toNumber() !== 0;
        } else if (deviceType.profileId instanceof HexString) {
            hasProfileId = (deviceType.profileId as HexString).toNumber() !== 0;
        }
    }

    // ALL required fields must have non-default values
    return !!(
        hasName &&
        hasTypeName &&
        hasDomain &&
        hasClass &&
        hasScope &&
        hasDeviceId &&
        hasProfileId
    );
}

/**
 * Validates a cluster and returns any validation errors found.
 *
 * @function validateCluster
 * @param {XMLCluster} cluster - The cluster to validate
 * @param {number} clusterIndex - The index of the cluster in the file (for error reporting)
 * @returns {ValidationError[]} - Array of validation errors
 */
function validateCluster(
    cluster: XMLCluster,
    clusterIndex: number
): ValidationError[] {
    const errors: ValidationError[] = [];
    const basePath =
        clusterIndex > 0 ? `cluster ${clusterIndex + 1}` : 'cluster';

    // Check required cluster fields
    if (!cluster.name || cluster.name.trim() === '') {
        errors.push({
            path: basePath,
            field: 'name',
        });
    }

    if (!cluster.code) {
        errors.push({
            path: basePath,
            field: 'code',
        });
    }

    if (!cluster.define || cluster.define.trim() === '') {
        errors.push({
            path: basePath,
            field: 'define',
        });
    }

    if (
        !cluster.domain ||
        (typeof cluster.domain === 'string' && cluster.domain.trim() === '')
    ) {
        errors.push({
            path: basePath,
            field: 'domain',
        });
    }

    // Validate attributes if present
    if (cluster.attribute && Array.isArray(cluster.attribute)) {
        cluster.attribute.forEach((attr, attrIndex) => {
            const attrPath = `${basePath}.attribute[${attrIndex}]`;

            if (!attr.$) {
                errors.push({
                    path: attrPath,
                    field: '$',
                });
                return;
            }

            if (!attr.$.code) {
                errors.push({
                    path: attrPath,
                    field: 'code',
                });
            }

            if (!attr.$.type || attr.$.type.trim() === '') {
                errors.push({
                    path: attrPath,
                    field: 'type',
                });
            }

            if (!attr.$.side || attr.$.side.trim() === '') {
                errors.push({
                    path: attrPath,
                    field: 'side',
                });
            }
        });
    }

    // Validate commands if present
    if (cluster.command && Array.isArray(cluster.command)) {
        cluster.command.forEach((cmd, cmdIndex) => {
            const cmdPath = `${basePath}.command[${cmdIndex}]`;

            if (!cmd.$) {
                errors.push({
                    path: cmdPath,
                    field: '$',
                });
                return;
            }

            if (!cmd.$.code) {
                errors.push({
                    path: cmdPath,
                    field: 'code',
                });
            }

            if (!cmd.$.name || cmd.$.name.trim() === '') {
                errors.push({
                    path: cmdPath,
                    field: 'name',
                });
            }

            if (!cmd.$.source || cmd.$.source.trim() === '') {
                errors.push({
                    path: cmdPath,
                    field: 'source',
                });
            }
        });
    }

    // Validate events if present
    if (cluster.event && Array.isArray(cluster.event)) {
        cluster.event.forEach((evt, evtIndex) => {
            const evtPath = `${basePath}.event[${evtIndex}]`;

            if (!evt.$) {
                errors.push({
                    path: evtPath,
                    field: '$',
                });
                return;
            }

            if (!evt.$.code) {
                errors.push({
                    path: evtPath,
                    field: 'code',
                });
            }

            if (!evt.$.name || evt.$.name.trim() === '') {
                errors.push({
                    path: evtPath,
                    field: 'name',
                });
            }

            if (!evt.$.priority || evt.$.priority.trim() === '') {
                errors.push({
                    path: evtPath,
                    field: 'priority',
                });
            }
        });
    }

    return errors;
}

/**
 * Validates a device type and returns any validation errors found.
 *
 * @function validateDeviceType
 * @param {XMLDeviceType} deviceType - The device type to validate
 * @param {number} deviceTypeIndex - The index of the device type (for error reporting)
 * @returns {ValidationError[]} - Array of validation errors
 */
function validateDeviceType(
    deviceType: XMLDeviceType,
    deviceTypeIndex: number
): ValidationError[] {
    const errors: ValidationError[] = [];
    const basePath =
        deviceTypeIndex > 0
            ? `deviceType ${deviceTypeIndex + 1}`
            : 'deviceType';

    // Check required device type fields
    if (!deviceType.name || deviceType.name.trim() === '') {
        errors.push({
            path: basePath,
            field: 'name',
        });
    }

    if (!deviceType.typeName || deviceType.typeName.trim() === '') {
        errors.push({
            path: basePath,
            field: 'typeName',
        });
    }

    if (!deviceType.domain || deviceType.domain.trim() === '') {
        errors.push({
            path: basePath,
            field: 'domain',
        });
    }

    if (!deviceType.deviceId) {
        errors.push({
            path: basePath,
            field: 'deviceId',
        });
    } else if (typeof deviceType.deviceId === 'object') {
        // deviceId can be structured object with _ property or bare HexString
        const isStructured = deviceType.deviceId._ instanceof HexString;
        const isBareHexString = deviceType.deviceId instanceof HexString;

        if (!isStructured && !isBareHexString) {
            errors.push({
                path: basePath,
                field: 'deviceId',
            });
        }
    }

    if (!deviceType.profileId) {
        errors.push({
            path: basePath,
            field: 'profileId',
        });
    } else if (typeof deviceType.profileId === 'object') {
        // profileId can be structured object with _ property or bare HexString
        const isStructured = deviceType.profileId._ instanceof HexString;
        const isBareHexString = deviceType.profileId instanceof HexString;

        if (!isStructured && !isBareHexString) {
            errors.push({
                path: basePath,
                field: 'profileId',
            });
        }
    }

    if (!deviceType.class || deviceType.class.trim() === '') {
        errors.push({
            path: basePath,
            field: 'class',
        });
    }

    if (!deviceType.scope || deviceType.scope.trim() === '') {
        errors.push({
            path: basePath,
            field: 'scope',
        });
    }

    return errors;
}

/**
 * Validates the loaded cluster file and checks for multiple instances.
 *
 * This function validates all clusters and device types in the file,
 * checks that at least one of them is present, and detects multiple
 * instances for user selection dialogs.
 *
 * @function validateClusterFile
 * @param {XMLFile} file - The parsed XML file
 * @returns {FileValidationResult} - Validation result with errors and multiple instance flags
 */
export function validateClusterFile(file: XMLFile): FileValidationResult {
    const errors: ValidationError[] = [];
    let clusters: XMLCluster[] = [];
    let deviceTypes: XMLDeviceType[] = [];
    let extensions: XMLClusterExtension[] = [];
    let hasMultipleClusters = false;
    let hasMultipleDeviceTypes = false;
    let hasMultipleExtensions = false;
    let hasClusters = false;
    let hasDeviceTypes = false;

    // Check for clusters
    if (file.cluster) {
        hasClusters = true;
        // Handle multiple clusters
        if (Array.isArray(file.cluster)) {
            clusters = file.cluster;
            hasMultipleClusters = file.cluster.length > 1;

            // Validate each cluster
            file.cluster.forEach((cluster, index) => {
                const clusterErrors = validateCluster(cluster, index);
                errors.push(...clusterErrors);
            });
        } else {
            // Single cluster (shouldn't normally happen but handle it)
            clusters = [file.cluster];
            const clusterErrors = validateCluster(file.cluster, 0);
            errors.push(...clusterErrors);
        }
    }

    // Check for device types
    if (file.deviceType) {
        hasDeviceTypes = true;
        if (Array.isArray(file.deviceType)) {
            deviceTypes = file.deviceType;
            hasMultipleDeviceTypes = file.deviceType.length > 1;

            // Validate each device type
            file.deviceType.forEach((deviceType, index) => {
                const deviceTypeErrors = validateDeviceType(deviceType, index);
                errors.push(...deviceTypeErrors);
            });
        } else {
            // Single device type
            deviceTypes = [file.deviceType];
            const deviceTypeErrors = validateDeviceType(file.deviceType, 0);
            errors.push(...deviceTypeErrors);
        }
    }

    // Check for cluster extensions
    if (file.clusterExtension) {
        if (Array.isArray(file.clusterExtension)) {
            extensions = file.clusterExtension;
            hasMultipleExtensions = file.clusterExtension.length > 1;

            // Validate each extension has a code
            file.clusterExtension.forEach((extension, index) => {
                if (!extension.$ || !extension.$.code) {
                    errors.push({
                        path: `cluster extension ${index + 1}`,
                        field: 'code',
                        message: 'Cluster extension must have a code',
                    });
                }
            });
        } else {
            // Single cluster extension
            extensions = [file.clusterExtension];

            if (!file.clusterExtension.$ || !file.clusterExtension.$.code) {
                errors.push({
                    path: 'cluster extension',
                    field: 'code',
                    message: 'Cluster extension must have a code',
                });
            }
        }
    }

    // Check if at least one of clusters or device types is present
    if (!hasClusters && !hasDeviceTypes) {
        errors.push({
            path: 'root',
            field: 'cluster/deviceType',
            message:
                'File must contain at least one cluster or one device type',
        });
    }

    return {
        isValid: errors.length === 0,
        errors,
        hasMultipleClusters,
        hasMultipleDeviceTypes,
        hasMultipleExtensions,
        clusters,
        deviceTypes,
        extensions,
    };
}

/**
 * Formats validation errors into a human-readable message.
 *
 * @function formatValidationErrors
 * @param {ValidationError[]} errors - Array of validation errors
 * @returns {string} - Formatted error message
 *
 */
export function formatValidationErrors(errors: ValidationError[]): string {
    if (errors.length === 0) {
        return '';
    }

    const errorMessages = errors.map(
        error =>
            `${error.path} ${error.field} ${
                error.message ?? 'is not found in the XML file'
            }`
    );

    return `The following required fields are missing or invalid:${errorMessages.join(
        '\n'
    )}`;
}

/**
 * Validates the current instance before saving.
 * Checks if cluster/device type have non-default values and validates their required fields.
 *
 * @function validateForSave
 * @param {XMLConfigurator} currentInstance - The current XML instance to validate
 * @returns {SaveValidationResult} - Validation result with save flags and errors
 */
export function validateForSave(
    currentInstance: XMLConfigurator
): SaveValidationResult {
    const errors: ValidationError[] = [];
    let shouldSaveCluster = false;
    let shouldSaveDeviceType = false;
    let noDataToSave = false;

    // Check if cluster has non-default values
    if (currentInstance.cluster) {
        shouldSaveCluster = hasNonDefaultClusterValues(currentInstance.cluster);

        // If cluster has some values, validate them
        if (shouldSaveCluster) {
            const clusterErrors = validateCluster(currentInstance.cluster, 0);
            errors.push(...clusterErrors);
        }
    }

    // Check if device type has non-default values
    if (currentInstance.deviceType) {
        shouldSaveDeviceType = hasNonDefaultDeviceTypeValues(
            currentInstance.deviceType
        );

        // If device type has some values, validate them
        if (shouldSaveDeviceType) {
            const deviceTypeErrors = validateDeviceType(
                currentInstance.deviceType,
                0
            );
            errors.push(...deviceTypeErrors);
        }
    }

    // At least one must have non-default values
    if (!shouldSaveCluster && !shouldSaveDeviceType) {
        noDataToSave = true;
    }

    return {
        shouldSaveCluster,
        shouldSaveDeviceType,
        isValid: errors.length === 0 && !noDataToSave,
        errors,
        noDataToSave,
    };
}

/**
 * Validates a cluster extension file and detects multiple cluster extensions.
 *
 * This function processes extension files to:
 * - Check if the file contains at least one cluster extension
 * - Detect if multiple cluster extensions are present
 * - Validate each cluster extension has required fields
 *
 * @param {XMLExtensionConfigurator} extensionFile - The parsed extension file
 * @returns {ExtensionFileValidationResult} - Validation result with extension list and multi-extension flag
 */
export function validateExtensionFile(
    extensionFile: XMLExtensionConfigurator
): ExtensionFileValidationResult {
    const errors: ValidationError[] = [];
    let extensions: XMLClusterExtension[] = [];
    let hasMultipleExtensions = false;

    // Check for cluster extensions
    if (!extensionFile.clusterExtension) {
        errors.push({
            path: 'root',
            field: 'clusterExtension',
            message:
                'Extension file must contain at least one cluster extension',
        });

        return {
            isValid: false,
            errors,
            hasMultipleExtensions: false,
            extensions: [],
        };
    }

    // Handle multiple cluster extensions
    if (Array.isArray(extensionFile.clusterExtension)) {
        extensions = extensionFile.clusterExtension;
        hasMultipleExtensions = extensionFile.clusterExtension.length > 1;

        // Validate each extension has a code
        extensionFile.clusterExtension.forEach((extension, index) => {
            if (!extension.$ || !extension.$.code) {
                errors.push({
                    path: `cluster extension ${index + 1}`,
                    field: 'code',
                    message: 'Cluster extension must have a code',
                });
            }
        });
    } else {
        // Single cluster extension
        extensions = [extensionFile.clusterExtension];

        if (
            !extensionFile.clusterExtension.$ ||
            !extensionFile.clusterExtension.$.code
        ) {
            errors.push({
                path: 'cluster extension',
                field: 'code',
                message: 'Cluster extension must have a code',
            });
        }
    }

    return {
        isValid: errors.length === 0,
        errors,
        hasMultipleExtensions,
        extensions,
    };
}

/**
 * Auto-fills missing required fields in a cluster with appropriate default values.
 *
 * @function autoFillClusterFields
 * @param {XMLCluster} cluster - The cluster to auto-fill
 * @param {ValidationError[]} errors - Array of validation errors for this cluster
 * @returns {string[]} - Array of field names that were auto-filled
 */
export function autoFillClusterFields(
    cluster: XMLCluster,
    errors: ValidationError[]
): string[] {
    const autoFilledFields: string[] = [];

    errors.forEach(error => {
        // Only auto-fill top-level cluster fields, not nested elements
        if (!error.path.includes('[')) {
            switch (error.field) {
                case 'name':
                    if (!cluster.name || cluster.name.trim() === '') {
                        cluster.name = 'Unnamed Cluster';
                        autoFilledFields.push(`${error.path}.name`);
                    }
                    break;
                case 'code':
                    if (!cluster.code) {
                        cluster.code = new HexString(0);
                        autoFilledFields.push(`${error.path}.code`);
                    }
                    break;
                case 'define':
                    if (!cluster.define || cluster.define.trim() === '') {
                        cluster.define = 'UNDEFINED_CLUSTER';
                        autoFilledFields.push(`${error.path}.define`);
                    }
                    break;
                case 'domain':
                    if (
                        !cluster.domain ||
                        (typeof cluster.domain === 'string' &&
                            cluster.domain.trim() === '')
                    ) {
                        cluster.domain = 'General';
                        autoFilledFields.push(`${error.path}.domain`);
                    }
                    break;
            }
        }
    });

    return autoFilledFields;
}

/**
 * Auto-fills missing required fields in a device type with appropriate default values.
 *
 * @function autoFillDeviceTypeFields
 * @param {XMLDeviceType} deviceType - The device type to auto-fill
 * @param {ValidationError[]} errors - Array of validation errors for this device type
 * @returns {string[]} - Array of field names that were auto-filled
 */
export function autoFillDeviceTypeFields(
    deviceType: XMLDeviceType,
    errors: ValidationError[]
): string[] {
    const autoFilledFields: string[] = [];

    errors.forEach(error => {
        switch (error.field) {
            case 'name':
                if (!deviceType.name || deviceType.name.trim() === '') {
                    deviceType.name = 'Unnamed Device Type';
                    autoFilledFields.push(`${error.path}.name`);
                }
                break;
            case 'typeName':
                if (!deviceType.typeName || deviceType.typeName.trim() === '') {
                    deviceType.typeName = 'MA-undefined';
                    autoFilledFields.push(`${error.path}.typeName`);
                }
                break;
            case 'domain':
                if (!deviceType.domain || deviceType.domain.trim() === '') {
                    deviceType.domain = 'General';
                    autoFilledFields.push(`${error.path}.domain`);
                }
                break;
            case 'class':
                if (!deviceType.class || deviceType.class.trim() === '') {
                    deviceType.class = 'Simple';
                    autoFilledFields.push(`${error.path}.class`);
                }
                break;
            case 'scope':
                if (!deviceType.scope || deviceType.scope.trim() === '') {
                    deviceType.scope = 'Endpoint';
                    autoFilledFields.push(`${error.path}.scope`);
                }
                break;
            case 'deviceId':
                if (!deviceType.deviceId) {
                    deviceType.deviceId = {
                        $: { editable: false },
                        _: new HexString(0),
                    };
                    autoFilledFields.push(`${error.path}.deviceId`);
                }
                break;
            case 'profileId':
                if (!deviceType.profileId) {
                    deviceType.profileId = {
                        $: { editable: false },
                        _: new HexString(0),
                    };
                    autoFilledFields.push(`${error.path}.profileId`);
                }
                break;
        }
    });

    return autoFilledFields;
}

/**
 * Validates a cluster file and auto-fills missing required fields with default values.
 *
 * @function validateAndAutoFillClusterFile
 * @param {XMLFile} file - The parsed XML file
 * @returns {FileValidationResult} - Validation result with auto-filled fields list
 */
export function validateAndAutoFillClusterFile(
    file: XMLFile
): FileValidationResult & AutoFillResult {
    // First, validate to find all errors
    const validationResult = validateClusterFile(file);
    const allAutoFilledFields: string[] = [];
    const autoFilledItems: AutoFilledItem[] = [];

    // Auto-fill clusters
    if (validationResult.clusters.length > 0) {
        validationResult.clusters.forEach((cluster, index) => {
            const clusterErrors = validationResult.errors.filter(
                error =>
                    error.path === 'cluster' ||
                    error.path === `cluster ${index + 1}`
            );
            const autoFilled = autoFillClusterFields(cluster, clusterErrors);
            allAutoFilledFields.push(...autoFilled);

            if (autoFilled.length > 0) {
                const itemName = cluster.name || `Cluster ${index + 1}`;
                const missingFields = autoFilled.map(
                    field => field.split('.').pop() || field
                );
                autoFilledItems.push({ itemName, missingFields });
            }
        });
    }

    // Auto-fill device types
    if (validationResult.deviceTypes.length > 0) {
        validationResult.deviceTypes.forEach((deviceType, index) => {
            const deviceTypeErrors = validationResult.errors.filter(
                error =>
                    error.path === 'deviceType' ||
                    error.path === `deviceType ${index + 1}`
            );
            const autoFilled = autoFillDeviceTypeFields(
                deviceType,
                deviceTypeErrors
            );
            allAutoFilledFields.push(...autoFilled);

            if (autoFilled.length > 0) {
                const itemName = deviceType.name || `Device Type ${index + 1}`;
                const missingFields = autoFilled.map(
                    field => field.split('.').pop() || field
                );
                autoFilledItems.push({ itemName, missingFields });
            }
        });
    }

    // Auto-fill cluster extensions
    if (validationResult.extensions.length > 0) {
        validationResult.extensions.forEach((extension, index) => {
            if (!extension.$ || !extension.$.code) {
                if (!extension.$) {
                    extension.$ = { code: new HexString(0) };
                } else {
                    extension.$.code = new HexString(0);
                }
                const fieldPath = `cluster extension ${index + 1}.code`;
                allAutoFilledFields.push(fieldPath);

                const itemName = `Extension ${index + 1}`;
                autoFilledItems.push({
                    itemName,
                    missingFields: ['code'],
                });
            }
        });
    }

    // Re-validate after auto-filling to check if all required fields are now valid
    const revalidationResult = validateClusterFile(file);

    return {
        ...revalidationResult,
        autoFilledFields: allAutoFilledFields,
        autoFilledItems,
    };
}

/**
 * Validates an extension file and auto-fills missing required fields with default values.
 *
 * @function validateAndAutoFillExtensionFile
 * @param {XMLExtensionConfigurator} extensionFile - The parsed extension file
 * @returns {ExtensionFileValidationResult} - Validation result with auto-filled fields list
 */
export function validateAndAutoFillExtensionFile(
    extensionFile: XMLExtensionConfigurator
): ExtensionFileValidationResult & AutoFillResult {
    // First, validate to find all errors
    const validationResult = validateExtensionFile(extensionFile);
    const allAutoFilledFields: string[] = [];
    const autoFilledItems: AutoFilledItem[] = [];

    // Auto-fill extension codes if missing
    if (validationResult.extensions.length > 0) {
        validationResult.extensions.forEach((extension, index) => {
            if (!extension.$ || !extension.$.code) {
                if (!extension.$) {
                    extension.$ = { code: new HexString(0) };
                } else {
                    extension.$.code = new HexString(0);
                }
                const fieldPath = `cluster extension ${index + 1}.code`;
                allAutoFilledFields.push(fieldPath);

                const itemName = `Extension ${index + 1}`;
                autoFilledItems.push({
                    itemName,
                    missingFields: ['code'],
                });
            }
        });
    }

    // Re-validate after auto-filling
    const revalidationResult = validateExtensionFile(extensionFile);

    return {
        ...revalidationResult,
        autoFilledFields: allAutoFilledFields,
        autoFilledItems,
    };
}
