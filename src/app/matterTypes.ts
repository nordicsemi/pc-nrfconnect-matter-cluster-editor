/*
 * Copyright (c) 2025 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: LicenseRef-Nordic-4-Clause
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import { app } from '@electron/remote';
import { getAppFile } from '@nordicsemiconductor/pc-nrfconnect-shared';
import { XMLParser } from 'fast-xml-parser';
import { existsSync, readFileSync } from 'fs';
import path from 'path';

export interface MatterType {
    id: string;
    name: string;
    description: string;
    size?: string;
    discrete?: string;
    analog?: string;
    signed?: string;
    composite?: string;
}

export interface TransformedMatterType {
    id: string;
    name: string;
    description: string;
    size?: number;
    discrete: boolean;
    analog: boolean;
    signed: boolean;
    composite: boolean;
}

export interface TypesData {
    configurator: { atomic: { type: MatterType[] } };
}

let typesCache: TransformedMatterType[] | null = null;

function getTypesXmlPath(): string {
    const appPath = app.getAppPath();
    const resourcesPath = path.join(appPath, 'resources');
    let typesXmlPath = path.join(resourcesPath, 'types.xml');

    if (!existsSync(typesXmlPath)) {
        // The application might be running from a launcher, so we should check the
        // resources through a different API
        typesXmlPath = getAppFile('resources/types.xml');
        if (!typesXmlPath) {
            throw new Error('types.xml file not found');
        }
    }

    return typesXmlPath;
}

export function loadMatterTypes(): TransformedMatterType[] {
    // Return cached types if available
    if (typesCache !== null) {
        return typesCache;
    }

    try {
        const xmlFilePath = getTypesXmlPath();
        const xmlContent = readFileSync(xmlFilePath, 'utf-8');

        const parser = new XMLParser({
            ignoreAttributes: false,
            attributeNamePrefix: '',
            textNodeName: '_text',
        });

        const parsed = parser.parse(xmlContent) as TypesData;
        const types = Array.isArray(parsed.configurator.atomic.type)
            ? parsed.configurator.atomic.type
            : [parsed.configurator.atomic.type];

        // Transform the types to ensure all properties are properly typed
        const transformedTypes = types.map(type => ({
            id: type.id,
            name: type.name,
            description: type.description,
            size: type.size ? parseInt(type.size, 10) : undefined,
            discrete: type.discrete === 'true',
            analog: type.analog === 'true',
            signed: type.signed === 'true',
            composite: type.composite === 'true',
        }));

        // Cache the transformed types
        typesCache = transformedTypes;
        return transformedTypes;
    } catch (error) {
        console.error('Error loading Matter types:', error);
        return [];
    }
}

export function getMatterTypeById(
    id: string
): TransformedMatterType | undefined {
    const types = loadMatterTypes();
    return types.find(type => type.id === id);
}

export function getMatterTypeByName(
    name: string
): TransformedMatterType | undefined {
    const types = loadMatterTypes();
    return types.find(type => type.name === name);
}

export function validateValue(
    type: TransformedMatterType,
    value: any
): boolean {
    if (!type) return false;

    if (type.composite) {
        return typeof value === 'string';
    }

    if (type.discrete) {
        return Number.isInteger(value);
    }

    if (type.analog) {
        if (type.signed) {
            const maxValue = 2 ** ((type.size || 1) * 8 - 1) - 1;
            const minValue = -(2 ** ((type.size || 1) * 8 - 1));
            return (
                typeof value === 'number' &&
                value >= minValue &&
                value <= maxValue
            );
        }
        const maxValue = 2 ** ((type.size || 1) * 8) - 1;
        return typeof value === 'number' && value >= 0 && value <= maxValue;
    }

    return false;
}

// Load types only once when component mounts
export const globalMatterTypes = loadMatterTypes().map(type => type.name);

export const clientServerOptions = ['client', 'server'];

export const priorityOptions = ['critical', 'info', 'debug'];

export const accessOptions = ['read', 'write', 'invoke'];

export const roleOptions = ['none', 'view', 'operate', 'manage', 'administer'];

export const apiMaturityOptions = [
    'provisional',
    'internal',
    'stable',
    'deprecated',
];

export const matterDomains = [
    'General',
    'CHIP',
    'Appliances',
    'Robots',
    'Measurement & Sensing',
    'HVAC',
    'Energy Measurement',
    'Closures',
    'Lighting',
    'Network Infrastructure',
    'Media',
];

export const matterDeviceTypeClasses = ['Utility', 'Simple', 'Dynamic'];

export const matterDeviceTypeScopes = ['Node', 'Endpoint'];

export const isTypeNumeric = (type: string) =>
    type === 'int8u' ||
    type === 'int16u' ||
    type === 'int24u' ||
    type === 'int32u' ||
    type === 'int40u' ||
    type === 'int48u' ||
    type === 'int56u' ||
    type === 'int64u' ||
    type === 'int8s' ||
    type === 'int16s' ||
    type === 'int24s' ||
    type === 'int32s' ||
    type === 'int40s' ||
    type === 'int48s' ||
    type === 'int56s' ||
    type === 'int64s' ||
    type === 'single' ||
    type === 'double';
