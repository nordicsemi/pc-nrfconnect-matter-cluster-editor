/*
 * Copyright (c) 2025 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: LicenseRef-Nordic-4-Clause
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

// Define interfaces matching the structure of all cluster elements according to
// the cluster XML file

export class HexString {
    private value: string;

    constructor(input: number | string) {
        if (typeof input === 'number') {
            this.value = `0x${input
                .toString(16)
                .toUpperCase()
                .padStart(4, '0')}`;
        } else {
            this.value = HexString.sanitizeHexString(input);
        }
    }

    public toString(): string {
        return this.value;
    }

    public toNumber(): number {
        return parseInt(this.value, 16);
    }

    public static fromNumber(num: number): HexString {
        return new HexString(num);
    }

    public static fromString(str: string): HexString {
        return new HexString(str);
    }

    /**
     * Validates if a character is a valid hexadecimal character
     * @param {string} char Character to validate
     * @returns {boolean} True if character is valid hex (0-9, a-f, A-F)
     */
    public static isValidHexChar(char: string): boolean {
        return /^[0-9a-fA-F]$/.test(char);
    }

    /**
     * Removes any non-hexadecimal characters from a string and formats it properly
     * @param {string} input String to sanitize
     * @returns {string} Properly formatted hex string with '0x' prefix
     */
    public static sanitizeHexString(input: string): string {
        // Check if input starts with 0x or 0X
        const hasHexPrefix = input.startsWith('0x') || input.startsWith('0X');

        // Remove the prefix if it exists before filtering
        const inputWithoutPrefix = hasHexPrefix ? input.substring(2) : input;

        // Filter out non-hex characters
        const hexOnly = inputWithoutPrefix.replace(/[^0-9a-fA-F]/g, '');

        if (!hexOnly) {
            return '0x0';
        }

        // Remove leading zeros (except if it would result in an empty string)
        const withoutLeadingZeros = hexOnly.replace(/^0+(?=.)/, '');

        // Add the prefix back and ensure lowercase
        return `0x${withoutLeadingZeros.toLowerCase()}`;
    }
}

export interface XMLDeviceTypeIds {
    $: {
        editable: boolean;
    };
    _: HexString;
}

export interface XMLDeviceType {
    name: string;
    domain: string;
    typeName: string;
    profileId: XMLDeviceTypeIds;
    deviceId: XMLDeviceTypeIds;
    class: string;
    scope: string;
    clusters: XMLDeviceClusters;
}

export interface XMLDeviceClusters {
    $: {
        lockOthers?: boolean;
    };
    include: XMLDeviceClusterInclude[];
}

export interface XMLDeviceClusterInclude {
    $: {
        cluster: string;
        client?: boolean;
        server?: boolean;
        clientLocked?: boolean;
        serverLocked?: boolean;
    };
    requireAttribute?: string[];
    requireCommand?: string[];
    requireEvent?: string[];
    features?: {
        feature: XMLDeviceClusterFeatures[];
    };
}

export interface XMLDeviceClusterFeatures {
    $: {
        code: string;
        name: string;
    };
    mandatoryConform?: boolean;
}

export interface XMLFile {
    enum?: XMLEnum[];
    struct?: XMLStruct[];
    cluster: XMLCluster[];
    deviceType?: XMLDeviceType | XMLDeviceType[];
    clusterExtension?: XMLClusterExtension | XMLClusterExtension[];
}

export interface XMLConfigurator {
    enum?: XMLEnum[];
    struct?: XMLStruct[];
    cluster: XMLCluster;
    deviceType?: XMLDeviceType;
}

export interface XMLEnumItem {
    $: { name: string; value: string };
}

export interface XMLClusterCode {
    $: { code: HexString };
}

export interface XMLEnum {
    $: { name: string; type: string; array?: boolean };
    cluster: XMLClusterCode[];
    item?: XMLEnumItem[];
}

export interface XMLStructItem {
    $: {
        fieldId: string;
        name: string;
        type: string;
        array?: boolean;
        length?: number;
        minLength?: number;
        min?: number;
        max?: number;
        isNullable?: boolean;
        isFabricSensitive?: boolean;
    };
}

export interface XMLStruct {
    $: { name: string; isFabricScoped?: boolean };
    cluster: XMLClusterCode[];
    item: XMLStructItem[];
}

export interface XMLClusterDomain {
    $: { name: string };
}

export interface XMLCluster {
    domain: string | XMLClusterDomain;
    name: string;
    code: HexString;
    define: string;
    description?: string;
    attribute?: XMLAttribute[];
    command?: XMLCommand[];
    event?: XMLEvent[];
}

export interface XMLExtensionConfigurator {
    clusterExtension: XMLClusterExtension | XMLClusterExtension[];
}

export interface XMLClusterExtension {
    $: { code: string | HexString };
    attribute?: XMLAttribute[];
    command?: XMLCommand[];
    event?: XMLEvent[];
    deviceType?: XMLDeviceType;
}

export interface XMLAttribute {
    $: {
        name: string;
        side: string;
        code: HexString;
        define: string;
        type: string;
        array?: boolean;
        length?: number;
        min?: number;
        max?: number;
        default?: any;
        isNullable?: boolean;
        reportable?: boolean;
        writable?: boolean;
        optional?: boolean;
        apiMaturity?: string;
    };
    // Description is treated as a name
    access?: XMLClusterAccess[];
    description?: string;
    _?: string;
}

export interface XMLCommand {
    $: {
        source: string;
        code: HexString;
        name: string;
        response?: string;
        optional?: boolean;
        disableDefaultResponse?: boolean;
    };
    description?: string;
    arg?: XMLCommandArgument[];
    access?: XMLClusterAccess[];
}

export interface XMLCommandArgument {
    $: {
        name: string;
        type: string;
        isNullable?: boolean;
        optional?: boolean;
        array?: boolean;
    };
}

export interface XMLClusterAccess {
    $: { op: string; role?: string; privilege?: string };
}

export interface XMLEvent {
    $: {
        code: HexString;
        side: string;
        name: string;
        priority: string;
        optional?: boolean;
    };
    description?: string;
    field?: XMLEventField[];
}

export interface XMLEventField {
    $: { id: HexString; name: string; type: string; array?: boolean };
}

// Types
export type CommandValuesType = XMLCommand['$'];
export type AccessCommandType = XMLClusterAccess['$'];
export type ArgumentCommandType = XMLCommandArgument['$'];
export type FeatureValuesType = XMLDeviceClusterFeatures['$'];
