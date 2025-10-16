/*
 * Copyright (c) 2025 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: LicenseRef-Nordic-4-Clause
 */

import { XMLCluster, XMLDeviceType, XMLFile } from '../defines';

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
    clusters: XMLCluster[];
    deviceTypes: XMLDeviceType[];
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
    } else if (
        typeof deviceType.deviceId === 'object' &&
        !deviceType.deviceId._
    ) {
        errors.push({
            path: basePath,
            field: 'deviceId',
        });
    }

    if (!deviceType.profileId) {
        errors.push({
            path: basePath,
            field: 'profileId',
        });
    } else if (
        typeof deviceType.profileId === 'object' &&
        !deviceType.profileId._
    ) {
        errors.push({
            path: basePath,
            field: 'profileId',
        });
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
    let hasMultipleClusters = false;
    let hasMultipleDeviceTypes = false;
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
        clusters,
        deviceTypes,
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
