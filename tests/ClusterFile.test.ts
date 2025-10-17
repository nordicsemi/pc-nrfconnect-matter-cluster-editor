/*
 * Copyright (c) 2025 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: LicenseRef-Nordic-4-Clause
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

// Mock the xmlClusterParser module
import './__mocks__/mui.mock';
import './__mocks__/nordic-shared.mock';
import './__mocks__/eventEmitter.mock';

import { logger } from '@nordicsemiconductor/pc-nrfconnect-shared';
import { readFileSync } from 'fs';
import path from 'path';

import ClusterFile from '../src/app/Components/ClusterFile';
import eventEmitter from '../src/app/Components/EventEmitter';
import {
    defaultXMLCluster,
    defaultXMLConfigurator,
    defaultXMLDeviceType,
} from '../src/app/defaults';
import { HexString, XMLDeviceType } from '../src/app/defines';
import * as xmlParserModule from '../src/app/xmlClusterParser';

jest.mock('../src/app/xmlClusterParser', () => ({
    parseClusterXML: jest.fn(),
    serializeClusterXML: jest.fn(),
}));

describe('ClusterFile', () => {
    beforeEach(() => {
        jest.clearAllMocks();

        // Reset ClusterFile static properties
        ClusterFile.loadedClusterExtension = false;
        ClusterFile.file = undefined as any;
        ClusterFile.extensionFile = undefined as any;
        ClusterFile.fileName = '';
        ClusterFile.fileUrl = undefined as any;
        ClusterFile.content = '';
        ClusterFile.XMLCurrentInstance = JSON.parse(
            JSON.stringify(defaultXMLConfigurator)
        );
        ClusterFile.XMLBaseInstance = JSON.parse(
            JSON.stringify(defaultXMLConfigurator)
        );
    });

    describe('isMultipleCluster', () => {
        it('should return true when file contains multiple clusters', async () => {
            // Mock the parser to return multiple clusters
            (xmlParserModule.parseClusterXML as jest.Mock).mockResolvedValue({
                cluster: [{ name: 'Cluster1' }, { name: 'Cluster2' }],
            });

            const result = await ClusterFile.isMultipleCluster(
                'sample xml content'
            );
            expect(result).toBe(true);
            expect(xmlParserModule.parseClusterXML).toHaveBeenCalledWith(
                'sample xml content'
            );
        });

        it('should return false when file contains a single cluster', async () => {
            // Mock the parser to return a single cluster
            (xmlParserModule.parseClusterXML as jest.Mock).mockResolvedValue({
                cluster: [{ name: 'Cluster1' }],
            });

            const result = await ClusterFile.isMultipleCluster(
                'sample xml content'
            );
            expect(result).toBe(false);
            expect(xmlParserModule.parseClusterXML).toHaveBeenCalledWith(
                'sample xml content'
            );
        });
    });

    describe('load', () => {
        it('should load a valid cluster file successfully', async () => {
            const mockFile = new File(['sample content'], 'test.xml', {
                type: 'text/xml',
            });
            const mockContent = '<xml>sample content</xml>';
            const mockClusterFile = {
                cluster: [{ name: 'TestCluster' }],
            };

            (xmlParserModule.parseClusterXML as jest.Mock).mockResolvedValue(
                mockClusterFile
            );

            const result = await ClusterFile.load(mockFile, mockContent);

            expect(result).toBe(true);
            expect(ClusterFile.fileName).toBe('test.xml');
            expect(ClusterFile.fileUrl).toBe(mockFile);
            expect(ClusterFile.content).toBe(mockContent);
            expect(ClusterFile.file).toEqual(mockClusterFile);
            expect(ClusterFile.loadedClusterExtension).toBe(false);
            expect(xmlParserModule.parseClusterXML).toHaveBeenCalledWith(
                mockContent
            );
        });

        it('should return false when XML parsing fails', async () => {
            const mockFile = new File(['invalid content'], 'test.xml', {
                type: 'text/xml',
            });
            const mockContent = '<invalid>xml</invalid>';

            (xmlParserModule.parseClusterXML as jest.Mock).mockRejectedValue(
                new Error('Invalid XML')
            );

            const result = await ClusterFile.load(mockFile, mockContent);

            expect(result).toBe(false);
            expect(logger.error).toHaveBeenCalled();
        });

        it('should return false when the file does not contain clusters', async () => {
            const mockFile = new File(['no clusters'], 'test.xml', {
                type: 'text/xml',
            });
            const mockContent = '<xml>no clusters</xml>';

            // Mock a file with no clusters
            (xmlParserModule.parseClusterXML as jest.Mock).mockResolvedValue(
                {}
            );

            const result = await ClusterFile.load(mockFile, mockContent);

            expect(result).toBe(false);
        });

        it('should reset XMLCurrentInstance and XMLBaseInstance before loading new data', async () => {
            const mockFile = new File(['sample content'], 'test.xml', {
                type: 'text/xml',
            });
            const mockContent = '<xml>sample content</xml>';

            // Set some non-default values first
            ClusterFile.XMLCurrentInstance = {
                cluster: {
                    domain: 'test',
                    name: 'Modified',
                    code: new HexString(1234),
                    define: 'TEST',
                },
            } as any;

            ClusterFile.XMLBaseInstance = {
                cluster: {
                    domain: 'test',
                    name: 'Modified',
                    code: new HexString(1234),
                    define: 'TEST',
                },
            } as any;

            (xmlParserModule.parseClusterXML as jest.Mock).mockResolvedValue({
                cluster: [{ name: 'TestCluster' }],
            });

            await ClusterFile.load(mockFile, mockContent);

            // Verify instances were reset to default values
            expect(ClusterFile.XMLCurrentInstance.cluster.name).toBe('');
            expect(ClusterFile.XMLCurrentInstance.cluster.define).toBe('');
            expect(ClusterFile.XMLBaseInstance.cluster.name).toBe('');
            expect(ClusterFile.XMLBaseInstance.cluster.define).toBe('');
        });
    });

    describe('loadExtension', () => {
        it('should load a valid cluster extension file successfully', async () => {
            const mockFile = new File(['extension content'], 'extension.xml', {
                type: 'text/xml',
            });
            const mockContent = '<xml>extension content</xml>';
            const mockExtension = {
                clusterExtension: {
                    $: { code: '0x1234' },
                    attribute: [{ name: 'TestAttribute' }],
                    command: [{ name: 'TestCommand' }],
                    event: [{ name: 'TestEvent' }],
                },
            };

            (xmlParserModule.parseClusterXML as jest.Mock).mockResolvedValue(
                mockExtension
            );

            const result = await ClusterFile.loadExtension(
                mockFile,
                mockContent
            );

            expect(result).toBe(true);
            expect(ClusterFile.fileName).toBe('extension.xml');
            expect(ClusterFile.fileUrl).toBe(mockFile);
            expect(ClusterFile.content).toBe(mockContent);
            expect(ClusterFile.extensionFile).toEqual(mockExtension);
            expect(ClusterFile.loadedClusterExtension).toBe(true);
            expect(xmlParserModule.parseClusterXML).toHaveBeenCalledWith(
                mockContent
            );
        });

        it('should return false when file does not contain a cluster extension', async () => {
            const mockFile = new File(['not an extension'], 'test.xml', {
                type: 'text/xml',
            });
            const mockContent = '<xml>not an extension</xml>';

            (xmlParserModule.parseClusterXML as jest.Mock).mockResolvedValue(
                {}
            );

            const result = await ClusterFile.loadExtension(
                mockFile,
                mockContent
            );

            expect(result).toBe(false);
        });

        it('should return false when XML parsing fails', async () => {
            const mockFile = new File(['invalid content'], 'test.xml', {
                type: 'text/xml',
            });
            const mockContent = '<invalid>xml</invalid>';

            (xmlParserModule.parseClusterXML as jest.Mock).mockRejectedValue(
                new Error('Invalid XML')
            );

            const result = await ClusterFile.loadExtension(
                mockFile,
                mockContent
            );

            expect(result).toBe(false);
            expect(logger.error).toHaveBeenCalled();
        });
    });

    describe('initialize', () => {
        it('should correctly initialize the XMLCurrentInstance with the provided cluster', () => {
            // Setup mock file with multiple elements
            ClusterFile.file = {
                deviceType: { name: 'MockDevice' },
                enum: [{ name: 'MockEnum' }],
                struct: [{ name: 'MockStruct' }],
                cluster: [{ name: 'Cluster1' }, { name: 'Cluster2' }],
            } as any;

            const mockCluster = {
                name: 'SelectedCluster',
                code: new HexString(0x1234),
                define: 'SELECTED_CLUSTER',
                domain: 'test',
            };

            ClusterFile.initialize(mockCluster as any);

            // Check if XMLCurrentInstance is properly initialized
            expect(ClusterFile.XMLCurrentInstance.deviceType).toEqual(
                ClusterFile.file.deviceType
            );
            expect(ClusterFile.XMLCurrentInstance.enum).toEqual(
                ClusterFile.file.enum
            );
            expect(ClusterFile.XMLCurrentInstance.struct).toEqual(
                ClusterFile.file.struct
            );
            expect(ClusterFile.XMLCurrentInstance.cluster).toEqual(mockCluster);

            // Verify event is emitted
            expect(eventEmitter.emit).toHaveBeenCalledWith(
                'xmlInstanceChanged'
            );
        });

        it('should copy XMLCurrentInstance to XMLBaseInstance after setTimeout', () => {
            // Mock setTimeout to execute callback immediately
            jest.useFakeTimers();

            // Setup initial state
            ClusterFile.file = {
                deviceType: { name: 'MockDevice' },
                enum: [{ name: 'MockEnum' }],
                cluster: [{ name: 'Cluster1' }, { name: 'Cluster2' }],
            } as any;

            const mockCluster = {
                name: 'SelectedCluster',
                code: new HexString(0x1234),
                define: 'SELECTED_CLUSTER',
                domain: 'test',
            };

            // Call initialize
            ClusterFile.initialize(mockCluster as any);

            // Pre-timeout state - XMLBaseInstance shouldn't match
            // XMLCurrentInstance yet
            expect(ClusterFile.XMLBaseInstance.cluster).not.toEqual(
                mockCluster
            );

            // Fast-forward timers
            jest.runAllTimers();

            // Post-timeout state - XMLBaseInstance should now match
            // XMLCurrentInstance
            expect(ClusterFile.XMLBaseInstance.cluster).toEqual(
                ClusterFile.XMLCurrentInstance.cluster
            );
            expect(ClusterFile.XMLBaseInstance.cluster.name).toBe(
                'SelectedCluster'
            );
            expect(ClusterFile.XMLBaseInstance.deviceType).toEqual(
                ClusterFile.XMLCurrentInstance.deviceType
            );

            // Cleanup
            jest.useRealTimers();
        });
    });

    describe('getNewAttributes, getNewCommands, getNewEvents', () => {
        beforeEach(() => {
            // Setup base test data
            ClusterFile.XMLBaseInstance = {
                cluster: {
                    ...defaultXMLCluster,
                    attribute: [
                        { $: { name: 'BaseAttr1', code: new HexString(0x01) } },
                        { $: { name: 'BaseAttr2', code: new HexString(0x02) } },
                    ],
                    command: [
                        { $: { name: 'BaseCmd1', code: new HexString(0x01) } },
                    ],
                    event: [
                        {
                            $: {
                                name: 'BaseEvent1',
                                code: new HexString(0x01),
                            },
                        },
                    ],
                },
            } as any;

            ClusterFile.XMLCurrentInstance = {
                cluster: {
                    ...defaultXMLCluster,
                    attribute: [
                        { $: { name: 'BaseAttr1', code: new HexString(0x01) } },
                        { $: { name: 'BaseAttr2', code: new HexString(0x02) } },
                        { $: { name: 'NewAttr1', code: new HexString(0x03) } },
                    ],
                    command: [
                        { $: { name: 'BaseCmd1', code: new HexString(0x01) } },
                        { $: { name: 'NewCmd1', code: new HexString(0x02) } },
                        { $: { name: 'NewCmd2', code: new HexString(0x03) } },
                    ],
                    event: [
                        {
                            $: {
                                name: 'BaseEvent1',
                                code: new HexString(0x01),
                            },
                        },
                        { $: { name: 'NewEvent1', code: new HexString(0x02) } },
                    ],
                },
            } as any;
        });

        it('should return new attributes added to XMLCurrentInstance', () => {
            const newAttrs = ClusterFile.getNewAttributes();
            expect(newAttrs).toHaveLength(1);
            expect(newAttrs![0]).toEqual({
                $: { name: 'NewAttr1', code: expect.any(HexString) },
            });
        });

        it('should return new commands added to XMLCurrentInstance', () => {
            const newCmds = ClusterFile.getNewCommands();
            expect(newCmds).toHaveLength(2);
            expect(newCmds![0]).toEqual({
                $: { name: 'NewCmd1', code: expect.any(HexString) },
            });
            expect(newCmds![1]).toEqual({
                $: { name: 'NewCmd2', code: expect.any(HexString) },
            });
        });

        it('should return new events added to XMLCurrentInstance', () => {
            const newEvents = ClusterFile.getNewEvents();
            expect(newEvents).toHaveLength(1);
            expect(newEvents![0]).toEqual({
                $: { name: 'NewEvent1', code: expect.any(HexString) },
            });
        });

        it('should return all attributes if XMLBaseInstance has none', () => {
            // Set base instance to not have attributes
            ClusterFile.XMLBaseInstance = {
                cluster: {
                    ...defaultXMLCluster,
                    attribute: undefined,
                },
            } as any;

            const newAttrs = ClusterFile.getNewAttributes();
            expect(newAttrs).toHaveLength(3);
        });

        it('should return all commands if XMLBaseInstance has none', () => {
            // Set base instance to not have commands
            ClusterFile.XMLBaseInstance = {
                cluster: {
                    ...defaultXMLCluster,
                    command: undefined,
                },
            } as any;

            const newCmds = ClusterFile.getNewCommands();
            expect(newCmds).toHaveLength(3);
        });

        it('should return all events if XMLBaseInstance has none', () => {
            // Set base instance to not have events
            ClusterFile.XMLBaseInstance = {
                cluster: {
                    ...defaultXMLCluster,
                    event: undefined,
                },
            } as any;

            const newEvents = ClusterFile.getNewEvents();
            expect(newEvents).toHaveLength(2);
        });
    });

    describe('getNewDeviceType', () => {
        it('should return device type from XMLCurrentInstance if present in both instances', () => {
            const mockDeviceType = {
                name: 'TestDevice',
                typeName: 'Test Device',
                domain: 'test',
            };

            ClusterFile.XMLBaseInstance = {
                ...defaultXMLConfigurator,
                deviceType: { ...defaultXMLDeviceType },
            } as any;

            ClusterFile.XMLCurrentInstance = {
                ...defaultXMLConfigurator,
                deviceType: mockDeviceType,
            } as any;

            ClusterFile.XMLDefaultInstance = {
                ...defaultXMLConfigurator,
                deviceType: { ...defaultXMLDeviceType },
            } as any;

            const result = ClusterFile.getNewDeviceType();
            expect(result).toEqual(mockDeviceType);
        });

        it('should return device type from XMLCurrentInstance if not present in XMLBaseInstance', () => {
            const mockDeviceType = {
                name: 'TestDevice',
                typeName: 'Test Device',
                domain: 'test',
            };

            ClusterFile.XMLBaseInstance = {
                ...defaultXMLConfigurator,
                deviceType: undefined,
            } as any;

            ClusterFile.XMLCurrentInstance = {
                ...defaultXMLConfigurator,
                deviceType: mockDeviceType,
            } as any;

            const result = ClusterFile.getNewDeviceType();
            expect(result).toEqual(mockDeviceType);
        });
    });

    describe('getSerializedClusterExtension', () => {
        it('should return empty string when there are no differences between instances', () => {
            // Make sure both instances are the same
            ClusterFile.XMLCurrentInstance = JSON.parse(
                JSON.stringify(defaultXMLConfigurator)
            );
            ClusterFile.XMLBaseInstance = JSON.parse(
                JSON.stringify(defaultXMLConfigurator)
            );

            // Mock serializeClusterXML
            (xmlParserModule.serializeClusterXML as jest.Mock).mockReturnValue(
                ''
            );

            const result = ClusterFile.getSerializedClusterExtension();
            expect(result).toBe('');
        });

        it('should create and serialize a cluster extension with new elements', () => {
            // Create a base instance
            ClusterFile.XMLBaseInstance = JSON.parse(
                JSON.stringify(defaultXMLConfigurator)
            );

            // Create a current instance with a new attribute
            ClusterFile.XMLCurrentInstance = JSON.parse(
                JSON.stringify(defaultXMLConfigurator)
            );
            if (!ClusterFile.XMLCurrentInstance.cluster.attribute) {
                ClusterFile.XMLCurrentInstance.cluster.attribute = [];
            }
            ClusterFile.XMLCurrentInstance.cluster.attribute.push({
                $: {
                    name: 'NewAttribute',
                    code: new HexString(1234),
                    side: 'server',
                    define: 'NEW_ATTRIBUTE',
                    type: 'boolean',
                },
                _: 'NewAttribute',
            });

            // Mock serializeClusterXML
            (xmlParserModule.serializeClusterXML as jest.Mock).mockReturnValue(
                '<xml>serialized content</xml>'
            );

            const result = ClusterFile.getSerializedClusterExtension();
            expect(result).toBe('<xml>serialized content</xml>');
        });
    });

    describe('getSerializedCluster empty', () => {
        it('should return validation error for empty cluster file', () => {
            // Reset any previous mocks
            jest.clearAllMocks();

            const result = ClusterFile.getSerializedCluster();

            // Should return error object instead of empty string
            expect(result).toHaveProperty('error', true);
            expect(result).toHaveProperty('validationErrors');
            if ('validationErrors' in result) {
                expect(result.validationErrors.length).toBeGreaterThan(0);
            }
        });
    });

    describe('Loading test XML files', () => {
        const testClusterPath = path.join(
            __dirname,
            '__objects__/test_cluster.xml'
        );
        const testClusterExtensionPath = path.join(
            __dirname,
            '__objects__/test_cluster_extension.xml'
        );
        const testClusterExtensionWithDeviceTypePath = path.join(
            __dirname,
            '__objects__/test_cluster_extension_with_device_type.xml'
        );

        // Read the file content
        const testClusterData = readFileSync(testClusterPath, 'utf-8');
        const testClusterExtensionData = readFileSync(
            testClusterExtensionPath,
            'utf-8'
        );
        const testClusterExtensionWithDeviceTypeData = readFileSync(
            testClusterExtensionWithDeviceTypePath,
            'utf-8'
        );

        it('should load test_cluster.xml and parse it correctly', async () => {
            const mockFile = new File([testClusterData], 'test_cluster.xml', {
                type: 'text/xml',
            });

            const mockClusterFile = {
                cluster: [
                    {
                        domain: 'General',
                        name: 'MyNewCluster',
                        code: '0xFFF1FC01',
                        define: 'MY_NEW_CLUSTER',
                        description:
                            'The MyNewCluster cluster showcases a cluster manufacturer extensions',
                        attribute: [
                            {
                                $: {
                                    side: 'server',
                                    code: '0xFFF10000',
                                    define: 'MY_ATTRIBUTE',
                                    type: 'boolean',
                                    writable: true,
                                    default: false,
                                    optional: false,
                                },
                                _: 'MyAttribute',
                            },
                        ],
                        command: [
                            {
                                $: {
                                    source: 'client',
                                    code: '0xFFF10000',
                                    name: 'MyCommand',
                                    optional: false,
                                },
                                description:
                                    'Command that takes two uint8 arguments and returns their sum.',
                                arg: [
                                    { $: { name: 'arg1', type: 'int8u' } },
                                    { $: { name: 'arg2', type: 'int8u' } },
                                ],
                            },
                        ],
                        event: [
                            {
                                $: {
                                    source: 'server',
                                    code: '0xFFF10000',
                                    name: 'MyEvent',
                                    priority: 'info',
                                    optional: false,
                                },
                                description:
                                    'Event that is generated by the server.',
                                arg: [{ $: { name: 'arg1', type: 'int8u' } }],
                            },
                        ],
                    },
                ],
                enum: [
                    {
                        $: { name: 'MyNewEnum', type: 'int8u' },
                        cluster: [{ code: '0xFFF1FC01' }],
                        item: [
                            { $: { name: 'EnumValue1', value: '0' } },
                            { $: { name: 'EnumValue2', value: '1' } },
                        ],
                    },
                ],
                struct: [
                    {
                        $: { name: 'MyStruct', isFabricScoped: true },
                        cluster: [{ code: '0xFFF1FC01' }],
                        item: [
                            {
                                $: {
                                    fieldId: '1',
                                    name: 'Data',
                                    type: 'octet_string',
                                    length: 128,
                                    isFabricSensitive: true,
                                },
                            },
                        ],
                    },
                ],
                deviceType: {
                    name: 'my-new-device',
                    domain: 'CHIP',
                    typeName: 'My new device',
                    profileId: { $: { editable: false }, _: '0x0FFF' },
                    deviceId: { $: { editable: false }, _: '0x001' },
                    class: 'Simple',
                    scope: 'Endpoint',
                    clusters: {
                        $: { lockOthers: true },
                        include: [
                            {
                                $: {
                                    cluster: 'MyNewCluster',
                                    client: true,
                                    server: true,
                                    clientLocked: false,
                                    serverLocked: false,
                                },
                            },
                        ],
                    },
                },
            };

            (xmlParserModule.parseClusterXML as jest.Mock).mockResolvedValue(
                mockClusterFile
            );

            const result = await ClusterFile.load(mockFile, testClusterData);

            expect(result).toBe(true);
            expect(ClusterFile.fileName).toBe('test_cluster.xml');
            expect(ClusterFile.fileUrl).toBe(mockFile);
            expect(ClusterFile.content).toBe(testClusterData);
            expect(ClusterFile.file).toEqual(mockClusterFile);
            expect(ClusterFile.loadedClusterExtension).toBe(false);
            expect(xmlParserModule.parseClusterXML).toHaveBeenCalledWith(
                testClusterData
            );

            // Check if we have one cluster
            expect(ClusterFile.file.cluster.length).toBe(1);
            expect(ClusterFile.file.cluster[0].name).toBe('MyNewCluster');
            expect(ClusterFile.file.cluster[0].code).toBe('0xFFF1FC01');

            // Check if we have enums and structs
            expect(ClusterFile.file.enum).toBeDefined();
            expect(ClusterFile.file.enum?.length).toBe(1);
            expect(ClusterFile.file.struct).toBeDefined();
            expect(ClusterFile.file.struct?.length).toBe(1);

            // Check if we have a device type
            expect(ClusterFile.file.deviceType).toBeDefined();
            expect((ClusterFile.file.deviceType as XMLDeviceType).name).toBe(
                'my-new-device'
            );
        });

        it('should load test_cluster_extension.xml and parse it correctly', async () => {
            const mockFile = new File(
                [testClusterExtensionData],
                'test_cluster_extension.xml',
                {
                    type: 'text/xml',
                }
            );

            const mockClusterExtensionFile = {
                cluster: [
                    {
                        domain: 'General',
                        name: 'MyNewCluster',
                        code: '0xFFF1FC01',
                        define: 'MY_NEW_CLUSTER',
                        description:
                            'The MyNewCluster cluster showcases a cluster manufacturer extensions',
                        attribute: [
                            {
                                $: {
                                    side: 'server',
                                    code: '0xFFF10000',
                                    define: 'MY_ATTRIBUTE',
                                    type: 'boolean',
                                    writable: true,
                                    default: false,
                                    optional: false,
                                },
                                _: 'MyAttribute',
                            },
                        ],
                        command: [
                            {
                                $: {
                                    source: 'client',
                                    code: '0xFFF10000',
                                    name: 'MyCommand',
                                    response: 'MyCommandResponse',
                                    optional: false,
                                },
                                description:
                                    'Command that takes two uint8 arguments and returns their sum.',
                                arg: [
                                    { $: { name: 'arg1', type: 'int8u' } },
                                    { $: { name: 'arg2', type: 'int8u' } },
                                ],
                            },
                        ],
                        event: [
                            {
                                $: {
                                    source: 'server',
                                    code: '0xFFF10000',
                                    name: 'MyEvent',
                                    priority: 'info',
                                    optional: false,
                                },
                                description:
                                    'Event that is generated by the server.',
                                arg: [{ $: { name: 'arg1', type: 'int8u' } }],
                            },
                        ],
                    },
                ],
            };

            (xmlParserModule.parseClusterXML as jest.Mock).mockResolvedValue(
                mockClusterExtensionFile
            );

            const result = await ClusterFile.load(
                mockFile,
                testClusterExtensionData
            );

            expect(result).toBe(true);
            expect(ClusterFile.fileName).toBe('test_cluster_extension.xml');
            expect(ClusterFile.fileUrl).toBe(mockFile);
            expect(ClusterFile.content).toBe(testClusterExtensionData);
            expect(ClusterFile.file).toEqual(mockClusterExtensionFile);
            expect(ClusterFile.loadedClusterExtension).toBe(false);
            expect(xmlParserModule.parseClusterXML).toHaveBeenCalledWith(
                testClusterExtensionData
            );

            // Check if we have a cluster with the expected properties
            expect(ClusterFile.file.cluster).toBeDefined();
            expect(ClusterFile.file.cluster.length).toBe(1);
            expect(ClusterFile.file.cluster[0].name).toBe('MyNewCluster');
            expect(ClusterFile.file.cluster[0].code).toBe('0xFFF1FC01');

            // Check if we have attributes, commands, and events
            expect(ClusterFile.file.cluster[0].attribute).toBeDefined();
            expect(ClusterFile.file.cluster[0].attribute?.length).toBe(1);
            expect(ClusterFile.file.cluster[0].command).toBeDefined();
            expect(ClusterFile.file.cluster[0].command?.length).toBe(1);
            expect(ClusterFile.file.cluster[0].event).toBeDefined();
            expect(ClusterFile.file.cluster[0].event?.length).toBe(1);
        });

        it('should load test_cluster_extension_with_device_type.xml and parse it correctly', async () => {
            const mockFile = new File(
                [testClusterExtensionWithDeviceTypeData],
                'test_cluster_extension_with_device_type.xml',
                {
                    type: 'text/xml',
                }
            );

            const mockClusterExtensionWithDeviceTypeFile = {
                cluster: [
                    {
                        domain: 'General',
                        name: 'MyNewCluster',
                        code: '0xFFF1FC01',
                        define: 'MY_NEW_CLUSTER',
                        description:
                            'The MyNewCluster cluster showcases a cluster manufacturer extensions',
                        attribute: [
                            {
                                $: {
                                    side: 'server',
                                    code: '0xFFF10000',
                                    define: 'MY_ATTRIBUTE',
                                    type: 'boolean',
                                    writable: true,
                                    default: false,
                                    optional: false,
                                },
                                _: 'MyAttribute',
                            },
                        ],
                        command: [
                            {
                                $: {
                                    source: 'client',
                                    code: '0xFFF10000',
                                    name: 'MyCommand',
                                    response: 'MyCommandResponse',
                                    optional: false,
                                },
                                description:
                                    'Command that takes two uint8 arguments and returns their sum.',
                                arg: [
                                    { $: { name: 'arg1', type: 'int8u' } },
                                    { $: { name: 'arg2', type: 'int8u' } },
                                ],
                            },
                        ],
                        event: [
                            {
                                $: {
                                    source: 'server',
                                    code: '0xFFF10000',
                                    name: 'MyEvent',
                                    priority: 'info',
                                    optional: false,
                                },
                                description:
                                    'Event that is generated by the server.',
                                arg: [{ $: { name: 'arg1', type: 'int8u' } }],
                            },
                        ],
                        deviceType: {
                            name: 'my-new-device',
                            domain: 'CHIP',
                            typeName: 'My new device',
                            profileId: { $: { editable: false }, _: '0x0FFF' },
                            deviceId: { $: { editable: false }, _: '0x001' },
                            class: 'Simple',
                            scope: 'Endpoint',
                            clusters: {
                                $: { lockOthers: true },
                                include: [
                                    {
                                        $: {
                                            cluster: 'MyNewCluster',
                                            client: true,
                                            server: true,
                                            clientLocked: false,
                                            serverLocked: false,
                                        },
                                    },
                                ],
                            },
                        },
                    },
                ],
                deviceType: {
                    name: 'my-new-device',
                    domain: 'CHIP',
                    typeName: 'My new device',
                    profileId: { $: { editable: false }, _: '0x0FFF' },
                    deviceId: { $: { editable: false }, _: '0x001' },
                    class: 'Simple',
                    scope: 'Endpoint',
                    clusters: {
                        $: { lockOthers: true },
                        include: [
                            {
                                $: {
                                    cluster: 'MyNewCluster',
                                    client: true,
                                    server: true,
                                    clientLocked: false,
                                    serverLocked: false,
                                },
                            },
                        ],
                    },
                },
            };

            (xmlParserModule.parseClusterXML as jest.Mock).mockResolvedValue(
                mockClusterExtensionWithDeviceTypeFile
            );

            const result = await ClusterFile.load(
                mockFile,
                testClusterExtensionWithDeviceTypeData
            );

            expect(result).toBe(true);
            expect(ClusterFile.fileName).toBe(
                'test_cluster_extension_with_device_type.xml'
            );
            expect(ClusterFile.fileUrl).toBe(mockFile);
            expect(ClusterFile.content).toBe(
                testClusterExtensionWithDeviceTypeData
            );
            expect(ClusterFile.file).toEqual(
                mockClusterExtensionWithDeviceTypeFile
            );
            expect(ClusterFile.loadedClusterExtension).toBe(false);
            expect(xmlParserModule.parseClusterXML).toHaveBeenCalledWith(
                testClusterExtensionWithDeviceTypeData
            );

            // Check if we have a cluster with the expected properties
            expect(ClusterFile.file.cluster).toBeDefined();
            expect(ClusterFile.file.cluster.length).toBe(1);
            expect(ClusterFile.file.cluster[0].name).toBe('MyNewCluster');
            expect(ClusterFile.file.cluster[0].code).toBe('0xFFF1FC01');

            // Check if we have a device type
            expect(ClusterFile.file.deviceType).toBeDefined();
            expect((ClusterFile.file.deviceType as XMLDeviceType).name).toBe(
                'my-new-device'
            );

            // Check if the deviceType has clusters
            expect(
                (ClusterFile.file.deviceType as XMLDeviceType).clusters
            ).toBeDefined();
            expect(
                (ClusterFile.file.deviceType as XMLDeviceType).clusters?.include
                    .length
            ).toBe(1);
        });
    });

    describe('Multiple DeviceTypes handling', () => {
        it('should correctly handle a file with multiple device types', async () => {
            const mockFile = new File(
                ['multiple device types content'],
                'multiple_device_types.xml',
                {
                    type: 'text/xml',
                }
            );
            const mockContent = '<xml>multiple device types</xml>';

            const mockMultipleDeviceTypesFile = {
                cluster: [
                    {
                        domain: 'General',
                        name: 'TestCluster',
                        code: '0xFFF1FC01',
                        define: 'TEST_CLUSTER',
                        description: 'Test cluster',
                    },
                ],
                deviceType: [
                    {
                        name: 'device-type-1',
                        domain: 'CHIP',
                        typeName: 'Device Type 1',
                        profileId: { $: { editable: false }, _: '0x0FFF' },
                        deviceId: { $: { editable: false }, _: '0x001' },
                        class: 'Simple',
                        scope: 'Endpoint',
                        clusters: {
                            $: { lockOthers: true },
                            include: [
                                {
                                    $: {
                                        cluster: 'TestCluster',
                                        client: true,
                                        server: true,
                                        clientLocked: false,
                                        serverLocked: false,
                                    },
                                },
                            ],
                        },
                    },
                    {
                        name: 'device-type-2',
                        domain: 'CHIP',
                        typeName: 'Device Type 2',
                        profileId: { $: { editable: false }, _: '0x0FFF' },
                        deviceId: { $: { editable: false }, _: '0x002' },
                        class: 'Simple',
                        scope: 'Endpoint',
                        clusters: {
                            $: { lockOthers: false },
                            include: [
                                {
                                    $: {
                                        cluster: 'TestCluster',
                                        client: false,
                                        server: true,
                                        clientLocked: false,
                                        serverLocked: false,
                                    },
                                },
                            ],
                        },
                    },
                ],
            };

            (xmlParserModule.parseClusterXML as jest.Mock).mockResolvedValue(
                mockMultipleDeviceTypesFile
            );

            const result = await ClusterFile.load(mockFile, mockContent);

            expect(result).toBe(true);
            expect(ClusterFile.fileName).toBe('multiple_device_types.xml');
            expect(ClusterFile.fileUrl).toBe(mockFile);
            expect(ClusterFile.content).toBe(mockContent);
            expect(ClusterFile.file).toEqual(mockMultipleDeviceTypesFile);

            // Check if deviceType is an array
            expect(Array.isArray(ClusterFile.file.deviceType)).toBe(true);

            // Check the number of device types
            expect(
                (ClusterFile.file.deviceType as XMLDeviceType[]).length
            ).toBe(2);

            // Verify first device type
            const deviceType1 = (
                ClusterFile.file.deviceType as XMLDeviceType[]
            )[0];
            expect(deviceType1.name).toBe('device-type-1');
            expect(deviceType1.typeName).toBe('Device Type 1');
            expect(deviceType1.deviceId._).toBe('0x001');

            // Verify second device type
            const deviceType2 = (
                ClusterFile.file.deviceType as XMLDeviceType[]
            )[1];
            expect(deviceType2.name).toBe('device-type-2');
            expect(deviceType2.typeName).toBe('Device Type 2');
            expect(deviceType2.deviceId._).toBe('0x002');
        });

        it('should correctly handle a file with a single device type (not array)', async () => {
            const mockFile = new File(
                ['single device type content'],
                'single_device_type.xml',
                {
                    type: 'text/xml',
                }
            );
            const mockContent = '<xml>single device type</xml>';

            const mockSingleDeviceTypeFile = {
                cluster: [
                    {
                        domain: 'General',
                        name: 'TestCluster',
                        code: '0xFFF1FC01',
                        define: 'TEST_CLUSTER',
                        description: 'Test cluster',
                    },
                ],
                deviceType: {
                    name: 'device-type-1',
                    domain: 'CHIP',
                    typeName: 'Device Type 1',
                    profileId: { $: { editable: false }, _: '0x0FFF' },
                    deviceId: { $: { editable: false }, _: '0x001' },
                    class: 'Simple',
                    scope: 'Endpoint',
                    clusters: {
                        $: { lockOthers: true },
                        include: [
                            {
                                $: {
                                    cluster: 'TestCluster',
                                    client: true,
                                    server: true,
                                    clientLocked: false,
                                    serverLocked: false,
                                },
                            },
                        ],
                    },
                },
            };

            (xmlParserModule.parseClusterXML as jest.Mock).mockResolvedValue(
                mockSingleDeviceTypeFile
            );

            const result = await ClusterFile.load(mockFile, mockContent);

            expect(result).toBe(true);
            expect(ClusterFile.fileName).toBe('single_device_type.xml');
            expect(ClusterFile.file).toEqual(mockSingleDeviceTypeFile);

            // Check if deviceType is NOT an array
            expect(Array.isArray(ClusterFile.file.deviceType)).toBe(false);

            // Verify device type properties
            const deviceType = ClusterFile.file.deviceType as XMLDeviceType;
            expect(deviceType.name).toBe('device-type-1');
            expect(deviceType.typeName).toBe('Device Type 1');
            expect(deviceType.deviceId._).toBe('0x001');
        });
    });
});
