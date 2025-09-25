/*
 * Copyright (c) 2025 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: LicenseRef-Nordic-4-Clause
 */

/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable no-nested-ternary */

import './__mocks__/mui.mock';
import './__mocks__/nordic-shared.mock';
import './__mocks__/eventEmitter.mock';

import { readFileSync } from 'fs';
import path from 'path';

import ClusterFile from '../src/app/Components/ClusterFile';
import { HexString } from '../src/app/defines';
import { parseClusterXML } from '../src/app/xmlClusterParser';

describe('Manufacturer cluster round-trip', () => {
    const mfgXmlPath = path.join(__dirname, '__objects__/test_mfg_cluster.xml');
    const mfgXml = readFileSync(mfgXmlPath, 'utf-8');

    beforeEach(() => {
        jest.clearAllMocks();
        // Reset ClusterFile static state similar to other tests
        ClusterFile.loadedClusterExtension = false;
        ClusterFile.file = undefined as any;
        ClusterFile.extensionFile = undefined as any;
        ClusterFile.fileName = '';
        ClusterFile.fileUrl = undefined as any;
        ClusterFile.content = '';
        // Reset current/base instances to defaults via load() when called
    });

    const getFirstCluster = (file: any) => {
        const c = (file as any).cluster;
        if (!c) return undefined;
        return Array.isArray(c) ? c[0] : c;
    };

    it('loads and round-trips (order-insensitive)', async () => {
        // Load the XML file using the real parser through ClusterFile
        const mockFile = new File([mfgXml], 'test_mfg_cluster.xml', {
            type: 'text/xml',
        });

        const loaded = await ClusterFile.load(mockFile, mfgXml);
        expect(loaded).toBe(true);
        // Initialize the current instance with the single cluster
        const clusterFromFile = getFirstCluster(ClusterFile.file)!;
        expect(clusterFromFile).toBeDefined();

        jest.useFakeTimers();
        ClusterFile.initialize(clusterFromFile);
        // Allow base instance to be synced
        jest.runAllTimers();

        // Save to XML (round-trip) and compare semantically with original
        const serializedOriginal = ClusterFile.getSerializedCluster();
        expect(typeof serializedOriginal).toBe('string');
        expect(serializedOriginal.length).toBeGreaterThan(0);

        const parsedOriginal = (await parseClusterXML(mfgXml)) as any;
        const parsedRoundTrip = (await parseClusterXML(
            serializedOriginal
        )) as any;

        const originalCluster = getFirstCluster(parsedOriginal);
        const roundTripCluster = getFirstCluster(parsedRoundTrip);

        // Core cluster coherence
        expect(roundTripCluster).toBeDefined();
        expect(roundTripCluster.name).toBe(originalCluster.name);
        expect(`${roundTripCluster.code}`).toBe(`${originalCluster.code}`);
        expect(roundTripCluster.define).toBe(originalCluster.define);

        // Attributes/commands/events presence and basic counts
        const origAttr = originalCluster.attribute
            ? Array.isArray(originalCluster.attribute)
                ? originalCluster.attribute
                : [originalCluster.attribute]
            : [];
        const rtAttr = roundTripCluster.attribute
            ? Array.isArray(roundTripCluster.attribute)
                ? roundTripCluster.attribute
                : [roundTripCluster.attribute]
            : [];
        expect(rtAttr.length).toBe(origAttr.length);

        const origCmd = originalCluster.command
            ? Array.isArray(originalCluster.command)
                ? originalCluster.command
                : [originalCluster.command]
            : [];
        const rtCmd = roundTripCluster.command
            ? Array.isArray(roundTripCluster.command)
                ? roundTripCluster.command
                : [roundTripCluster.command]
            : [];
        expect(rtCmd.length).toBe(origCmd.length);

        const origEvt = originalCluster.event
            ? Array.isArray(originalCluster.event)
                ? originalCluster.event
                : [originalCluster.event]
            : [];
        const rtEvt = roundTripCluster.event
            ? Array.isArray(roundTripCluster.event)
                ? roundTripCluster.event
                : [roundTripCluster.event]
            : [];
        expect(rtEvt.length).toBe(origEvt.length);

        // Device type coherence
        expect(parsedRoundTrip.deviceType).toBeDefined();
        expect(parsedRoundTrip.deviceType.name).toBe(
            parsedOriginal.deviceType.name
        );

        // Enums present in original (LEDActionEnum) and preserved in round-trip
        expect(parsedOriginal.enum).toBeDefined();
        const originalEnums = Array.isArray(parsedOriginal.enum)
            ? parsedOriginal.enum
            : [parsedOriginal.enum];
        expect(originalEnums[0].$?.name).toBe('LEDActionEnum');
        const rtEnums = Array.isArray(parsedRoundTrip.enum)
            ? parsedRoundTrip.enum
            : [parsedRoundTrip.enum];
        expect(rtEnums[0].$?.name).toBe('LEDActionEnum');

        // Structs not present in this sample; remain absent after round-trip
        expect(parsedOriginal.struct).toBeUndefined();
        expect(parsedRoundTrip.struct).toBeUndefined();

        // Cluster extension persisted in round-trip
        expect(parsedOriginal.clusterExtension).toBeDefined();
        expect(parsedRoundTrip.clusterExtension).toBeDefined();
        const origExt = parsedOriginal.clusterExtension;
        const rtExt = parsedRoundTrip.clusterExtension;
        // Compare key extension bits
        expect(`${rtExt.$.code}`).toBe(`${origExt.$.code}`);
        const extAttr = Array.isArray(rtExt.attribute)
            ? rtExt.attribute[0]
            : rtExt.attribute;
        expect(extAttr.$.define).toBe('RANDOM_NUMBER');
        expect(extAttr.$.optional).toBe(false);
        expect(extAttr.$.writable).toBe(true);

        // False-valued fields should persist after round-trip
        // Check USER_LED attribute flags
        const rtAttrs = Array.isArray(roundTripCluster.attribute)
            ? roundTripCluster.attribute
            : [roundTripCluster.attribute];
        const userLed = rtAttrs.find(
            (a: any) => a.$ && (a.$ as any).define === 'USER_LED'
        );
        expect(userLed).toBeDefined();
        expect(userLed.$.writable).toBe(false);
        expect(userLed.$.reportable).toBe(false);
        expect(userLed.$.isNullable).toBe(false);
        expect(userLed.$.optional).toBe(false);
        expect(userLed.$.length).toBe(0);
        expect(userLed.$.type).toBe('boolean');
        expect(userLed.$.apiMaturity).toBe('provisional');
        expect(userLed.$.code).toBeDefined();
        expect(`${userLed._}`.trim()).toBe('UserLED');

        // Check deviceType include flags (client=false should persist)
        const dt = parsedRoundTrip.deviceType;
        const includes = Array.isArray(dt.clusters.include)
            ? dt.clusters.include
            : [dt.clusters.include];
        expect(includes.length).toBeGreaterThan(0);
        const inc0 = includes[0].$;
        expect(inc0.cluster).toBe('NordicDevKit');
        expect(inc0.client).toBe(false);
        expect(inc0.server).toBe(true);
        expect(inc0.clientLocked).toBe(false);
        expect(inc0.serverLocked).toBe(false);

        // Command and event optional flags should persist
        const rtCmds = Array.isArray(roundTripCluster.command)
            ? roundTripCluster.command
            : [roundTripCluster.command];
        expect(rtCmds[0].$?.optional).toBe(false);
        const rtEvts = Array.isArray(roundTripCluster.event)
            ? roundTripCluster.event
            : [roundTripCluster.event];
        expect(rtEvts[0].$?.optional).toBe(false);

        jest.useRealTimers();
    });

    it('modifies cluster values and re-saves as expected', async () => {
        // Load and initialize again to isolate from other tests
        const mockFile = new File([mfgXml], 'test_mfg_cluster.xml', {
            type: 'text/xml',
        });

        const loaded = await ClusterFile.load(mockFile, mfgXml);
        expect(loaded).toBe(true);
        const clusterFromFile = getFirstCluster(ClusterFile.file)!;
        expect(clusterFromFile).toBeDefined();

        jest.useFakeTimers();
        ClusterFile.initialize(clusterFromFile);
        jest.runAllTimers();

        const originalParsed = (await parseClusterXML(mfgXml)) as any;
        const originalCluster = getFirstCluster(originalParsed);

        // Perform modifications in the app state
        const c = ClusterFile.XMLCurrentInstance.cluster!;
        c.name = `${c.name}X`;
        c.define = `${c.define}_X`;
        c.description = `${c.description || ''} changed`;
        if (c.attribute && c.attribute.length > 0) {
            const attrs = Array.isArray(c.attribute)
                ? c.attribute
                : [c.attribute];
            const nameAttr =
                attrs.find(
                    a => a.$ && (a.$ as any).define === 'DEV_KIT_NAME'
                ) || attrs[0];
            nameAttr._ = `${nameAttr._ || ''}X`;
            if (nameAttr.$) {
                (nameAttr.$ as any).default = 'Nordic Development Kit X';
                (nameAttr.$ as any).writable = false;
            }
        }
        if (c.command) {
            const cmds = Array.isArray(c.command) ? c.command : [c.command];
            if (cmds[0] && cmds[0].$) {
                (cmds[0].$ as any).name = `${(cmds[0].$ as any).name}X`;
            }
        }
        if (c.event) {
            const evs = Array.isArray(c.event) ? c.event : [c.event];
            if (evs[0] && evs[0].$) {
                (evs[0].$ as any).priority = 'critical';
            }
        }
        if (ClusterFile.XMLCurrentInstance.deviceType) {
            ClusterFile.XMLCurrentInstance.deviceType.typeName = `${ClusterFile.XMLCurrentInstance.deviceType.typeName} X`;
            const did = new HexString(0xfff10002);
            const pid = new HexString(0x0fff);
            (ClusterFile.XMLCurrentInstance.deviceType as any).deviceId = did;
            (ClusterFile.XMLCurrentInstance.deviceType as any).profileId = pid;
        }

        const serializedModified = ClusterFile.getSerializedCluster();
        expect(serializedModified.length).toBeGreaterThan(0);
        const parsedModified = (await parseClusterXML(
            serializedModified
        )) as any;
        const modifiedCluster = getFirstCluster(parsedModified);

        // Verify modified cluster fields took effect
        expect(modifiedCluster.name).toBe(`${originalCluster.name}X`);
        expect(modifiedCluster.define).toBe(`${originalCluster.define}_X`);
        if (modifiedCluster.attribute) {
            const mAttrs = Array.isArray(modifiedCluster.attribute)
                ? modifiedCluster.attribute
                : [modifiedCluster.attribute];
            const mNameAttr =
                mAttrs.find(
                    (a: any) => a.$ && (a.$ as any).define === 'DEV_KIT_NAME'
                ) || mAttrs[0];
            expect(`${mNameAttr._}`).toContain('X');
            expect(mNameAttr.$.default).toBe('Nordic Development Kit X');
            expect(mNameAttr.$.writable).toBe(false);
        }
        if (modifiedCluster.command) {
            const cm0 = Array.isArray(modifiedCluster.command)
                ? modifiedCluster.command[0]
                : modifiedCluster.command;
            expect(`${cm0.$.name}`).toContain('X');
        }
        if (modifiedCluster.event) {
            const ev0 = Array.isArray(modifiedCluster.event)
                ? modifiedCluster.event[0]
                : modifiedCluster.event;
            expect(`${ev0.$.priority}`).toBe('critical');
        }

        // Device type was updated and present
        expect(parsedModified.deviceType).toBeDefined();
        expect(parsedModified.deviceType.typeName).toContain(' X');

        // Enums are preserved in full serialization
        const modEnums = Array.isArray(parsedModified.enum)
            ? parsedModified.enum
            : [parsedModified.enum];
        expect(modEnums[0].$?.name).toBe('LEDActionEnum');
        // Structs still not present in this sample
        expect(parsedModified.struct).toBeUndefined();

        jest.useRealTimers();
    });
});
