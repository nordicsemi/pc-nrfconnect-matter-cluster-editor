/*
 * Copyright (c) 2025 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: LicenseRef-Nordic-4-Clause
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import * as xml2js from 'xml2js';
import { parseBooleans, parseNumbers } from 'xml2js/lib/processors';

import { HexString, XMLExtensionConfigurator, XMLFile } from './defines';

/**
 * This file contains the parser and serializer functions for the XML
 * configurator.
 */

function parseNumbersAndHex(
    hexString: string
): HexString | number | string | null {
    // Handle empty strings - return them as null to avoid NaN conversion
    if (hexString === '') {
        return null;
    }

    if (
        String(hexString).startsWith('0x') ||
        String(hexString).startsWith('0X')
    ) {
        return HexString.fromString(hexString);
    }
    return parseNumbers(hexString);
}

/**
 * Parser function to parse the XML file and save the data to the appropriate
 * interfaces.
 *
 * @param {string} xmlString an input XML file string
 * @returns {Promise<XMLFile> } a XMLConfiguration structure that
 *     contains the parsed cluster elements.
 */
export async function parseClusterXML(
    xmlString: string
): Promise<XMLFile | XMLExtensionConfigurator> {
    const parser = new xml2js.Parser({
        explicitArray: false,
        attrNameProcessors: [parseNumbersAndHex, parseBooleans],
        tagNameProcessors: [parseNumbersAndHex, parseBooleans],
        valueProcessors: [parseNumbersAndHex, parseBooleans],
        attrValueProcessors: [parseNumbersAndHex, parseBooleans],
    });
    const result = await parser.parseStringPromise(xmlString);
    return result.configurator as XMLFile | XMLExtensionConfigurator;
}

const convertHexStrings = (obj: any): any => {
    // Preserve boolean false and numeric 0; only coerce undefined/null or empty string
    if (obj === undefined || obj === null) return null;

    if (obj === '') {
        return null;
    }

    // Force booleans to explicit string values so they appear in XML as attr="true|false"
    if (typeof obj === 'boolean') {
        return obj ? 'true' : 'false';
    }

    if (obj instanceof HexString) {
        return obj.toString();
    }

    if (Array.isArray(obj)) {
        return obj.map(item => convertHexStrings(item));
    }

    if (typeof obj === 'object') {
        const converted = { ...obj };
        Object.keys(converted).forEach(key => {
            converted[key] = convertHexStrings(converted[key]);
        });
        return converted;
    }

    return obj;
};

/**
 * Collapse elements that contain only text (no child elements) into a single line.
 * This keeps pretty printing for the overall document, but avoids introducing
 * newlines around text-only (`_`) fields.
 */
const collapseTextOnlyElements = (xml: string): string => {
    let result = xml;
    // 1) Collapse pure text-only elements to one line
    result = result.replace(
        /<([A-Za-z0-9:_-]+)([^>]*)>\r?\n[ \t]*([^<\r\n]+)\r?\n[ \t]*<\/\1>/g,
        '<$1$2>$3</$1>'
    );

    // 2) For mixed-content where a text node precedes the first child element,
    //    inline that text immediately after the opening tag (remove surrounding newlines)
    result = result.replace(
        /<([A-Za-z0-9:_-]+)([^>]*)>\r?\n[ \t]*([^<\r\n]+)\r?\n([ \t]*<)/g,
        '<$1$2>$3$4'
    );

    // 3) If the content ends with a single self-closing child element, bring the closing tag
    //    onto the same line as the child to fully inline the parent element
    result = result.replace(
        /<([A-Za-z0-9:_-]+)([^>]*)>([^<]*<[^>]+\/>)[ \t]*\r?\n[ \t]*<\/\1>/g,
        '<$1$2>$3</$1>'
    );

    return result;
};

/**
 * Serializer function to convert the XMLFile structure to the XML file.
 *
 * @param {XMLFile} config a XMLConfiguration structure that contains
 *     the cluster elements
 * @returns {string} a string that contains the XML file that can be used to
 *     save the content into a file.
 */
export function serializeClusterXML(
    config: XMLFile | XMLExtensionConfigurator
): string {
    const builder = new xml2js.Builder({
        rootName: 'configurator',
        attrkey: '$',
        // Enable pretty print for structure; we'll collapse text-only nodes after build
        renderOpts: {
            pretty: true,
        },
    });
    let xml = builder.buildObject(convertHexStrings(config));
    xml = collapseTextOnlyElements(xml);
    return xml;
}
