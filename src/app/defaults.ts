/*
 * Copyright (c) 2025 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: LicenseRef-Nordic-4-Clause
 */

import {
    HexString,
    XMLAttribute,
    XMLCluster,
    XMLClusterAccess,
    XMLClusterCode,
    XMLCommand,
    XMLCommandArgument,
    XMLConfigurator,
    XMLDeviceClusterFeatures,
    XMLDeviceClusterInclude,
    XMLDeviceClusters,
    XMLDeviceType,
    XMLEnum,
    XMLEnumItem,
    XMLEvent,
    XMLEventField,
    XMLFile,
    XMLStruct,
    XMLStructItem,
} from './defines';

/**
 * This file contains all default values for the XML elements.
 * Thanks to that we can define the empty fields for all required elements
 * in the editor.
 *
 * This means that if the raw interfaces are used the editor does not know
 * about the nested or optional elements, so it cannot create a dialog window to fill them.
 * Thanks to the default values the editor can create the dialog windows for all elements defined here.
 */

export const defaultXMLClusterAccess: XMLClusterAccess = {
    $: {
        op: '',
        role: '',
    },
};

export const defaultXMLClusterCode: XMLClusterCode = {
    $: {
        code: new HexString(0),
    },
};

export const defaultXMLStructItem: XMLStructItem = {
    $: {
        fieldId: '',
        name: '',
        type: '',
        array: false,
        length: 0,
        minLength: 0,
        min: 0,
        max: 0,
        isNullable: false,
        isFabricSensitive: false,
    },
};

export const defaultXMLCommandArgument: XMLCommandArgument = {
    $: {
        name: '',
        type: '',
        isNullable: false,
        optional: false,
        array: false,
    },
};

export const defaultXMLEventField: XMLEventField = {
    $: {
        id: new HexString(0),
        name: '',
        type: '',
        array: false,
    },
};

export const defaultXMLEnumItem: XMLEnumItem = {
    $: {
        name: '',
        value: '',
    },
};

export const defaultXMLAttribute: XMLAttribute = {
    $: {
        name: '',
        side: '',
        code: new HexString(0),
        define: '',
        type: '',
        array: false,
        length: 0,
        min: 0,
        max: 0,
        default: undefined,
        writable: false,
        reportable: false,
        isNullable: false,
        optional: false,
        apiMaturity: '',
    },
    access: [],
    description: '',
    _: '',
};

export const defaultXMLCommand: XMLCommand = {
    $: {
        name: '',
        code: new HexString(0),
        source: '',
        response: '',
        optional: false,
        disableDefaultResponse: false,
    },
    description: '',
    arg: [],
    access: [],
};

export const defaultXMLEvent: XMLEvent = {
    $: {
        name: '',
        code: new HexString(0),
        side: '',
        priority: '',
        optional: false,
    },
    description: '',
    field: [],
};

export const defaultXMLEnum: XMLEnum = {
    $: {
        name: '',
        type: '',
        array: false,
    },
    cluster: [],
    item: [],
};

export const defaultXMLStruct: XMLStruct = {
    $: {
        name: '',
        isFabricScoped: false,
    },
    cluster: [],
    item: [],
};

export const defaultXMLCluster: XMLCluster = {
    domain: '',
    name: '',
    code: new HexString(0),
    define: '',
    description: '',
    attribute: [],
    command: [],
    event: [],
};

export const defaultXMLDeviceClusters: XMLDeviceClusters = {
    $: {
        lockOthers: false,
    },
    include: [],
};

export const defaultXMLDeviceType: XMLDeviceType = {
    name: '',
    typeName: '',
    domain: '',
    class: '',
    scope: '',
    profileId: {
        $: {
            editable: false,
        },
        _: new HexString(0x00),
    },
    deviceId: {
        $: {
            editable: false,
        },
        _: new HexString(0x00),
    },
    clusters: {
        $: {
            lockOthers: false,
        },
        include: [],
    },
};

export const defaultXMLDeviceClusterFeatures: XMLDeviceClusterFeatures = {
    $: {
        code: '',
        name: '',
    },
    mandatoryConform: false,
};

export const defaultXMLDeviceClusterInclude: XMLDeviceClusterInclude = {
    $: {
        cluster: '',
        client: false,
        server: false,
        clientLocked: false,
        serverLocked: false,
    },
    requireAttribute: [],
    requireCommand: [],
    requireEvent: [],
};

export const defaultXMLConfigurator: XMLConfigurator = {
    enum: [],
    struct: [],
    cluster: defaultXMLCluster,
    deviceType: defaultXMLDeviceType,
};

export const defaultXMLFile: XMLFile = {
    enum: [],
    struct: [],
    cluster: [defaultXMLCluster],
    deviceType: defaultXMLDeviceType,
};
