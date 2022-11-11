import { IExecuteFunctions } from 'n8n-core';
import {
	IDataObject,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	NodeOperationError,
} from 'n8n-workflow';

import { kuttApiRequest } from './GenericFunctions';

export class Kutt implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Kutt',
		subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
		documentationUrl: 'https://github.com/one-acre-fund/n8n-nodes-kutt',
		name: 'kutt',
		// eslint-disable-next-line n8n-nodes-base/node-class-description-icon-not-svg
		icon: 'file:kutt.svg',
		group: ['transform'],
		version: 1,
		description: 'A node to shorten URLs',
		defaults: {
			name: 'Kutt',
		},
		inputs: ['main'],
		outputs: ['main'],
		credentials: [
			{
				name: 'kuttCredentialsApi',
				required: true,
			},
		],
		properties: [
			// Resources
			{
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				noDataExpression: true,
				options: [
					{
						name: 'Link',
						value: 'link',
						description: 'Manipulate Links',
					},
				],
				default: 'link',
				required: true,
			},

			// Operations
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				required: true,
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['link'],
					},
				},
				default: 'create',
				options: [
					{
						name: 'Create',
						value: 'create',
						action: 'Create link',
					},
					{
						name: 'Delete',
						value: 'delete',
						action: 'Delete link',
					},
					{
						name: 'Get All',
						value: 'list',
						action: 'Get all links',
					},
					{
						name: 'Get One',
						value: 'get',
						action: 'Get link',
					},
				],
			},

			// options for: create link
			{
				displayName: 'Target URL',
				name: 'target',
				type: 'string',
				default: '',
				description: 'The target URL to point to',
				required: true,
				displayOptions: {
					show: {
						resource: ['link'],
						operation: ['create'],
					},
				},
			},

			{
				displayName: 'ID',
				name: 'linkId',
				type: 'string',
				default: '',
				required: true,
				description: 'Link ID',
				displayOptions: {
					show: {
						resource: ['link'],
						operation: ['get', 'delete'],
					},
				},
			},

			{
				displayName: 'Options',
				name: 'createOptions',
				placeholder: 'Add Option',
				type: 'collection',
				default: {},
				displayOptions: {
					show: {
						resource: ['link'],
						operation: ['create'],
					},
				},
				options: [
					{
						displayName: 'Description',
						name: 'description',
						type: 'string',
						default: '',
					},
					{
						displayName: 'Expiration Time',
						description:
							'Expiration time in plain English, see https://www.npmjs.com/package/ms for supported formats',
						name: 'expire_in',
						type: 'string',
						default: '',
						placeholder: 'e.g. 2 days/5h...',
					},
					{
						displayName: 'Password',
						description: 'To password-protect your short link',
						name: 'password',
						type: 'string',
						typeOptions: {
							password: true,
						},
						default: '',
					},
					{
						displayName: 'Custom URL',
						description: 'To specify your own short link ID',
						name: 'customurl',
						type: 'string',
						default: '',
					},
					{
						displayName: 'Domain',
						name: 'domain',
						type: 'string',
						default: '',
					},
					{
						displayName: 'Reuse',
						description: 'Whether to try and reuse an existing short link',
						name: 'reuse',
						type: 'boolean',
						default: false,
					},
				],
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();

		// tslint:disable-next-line: no-any
		let returnData: any[] = [];
		// tslint:disable-next-line: no-any
		let responseData: any;
		const resource = this.getNodeParameter('resource', 0) as string;
		const operation = this.getNodeParameter('operation', 0) as string;

		if (resource === 'link') {
			// *********************************************************************
			//                             Link
			// *********************************************************************

			if (operation === 'list') {
				// ----------------------------------
				//          Link::list
				// ----------------------------------
				responseData = await kuttApiRequest.call(this, {
					url: `links`,
					scroll: true,
				});

				returnData = returnData.concat(responseData);
			}

			if (operation === 'get') {
				// ----------------------------------
				//          Link::get
				// ----------------------------------
				for (let i = 0; i < items.length; i++) {
					const linkId = this.getNodeParameter('linkId', i, null) as string;

					responseData = await kuttApiRequest.call(this, {
						url: `links/${linkId}/stats`,
					});

					returnData = returnData.concat(responseData);
				}
			}

			if (operation === 'delete') {
				// ----------------------------------
				//          Link::delete
				// ----------------------------------
				for (let i = 0; i < items.length; i++) {
					const linkId = this.getNodeParameter('linkId', i, null) as string;

					responseData = await kuttApiRequest.call(this, {
						method: 'DELETE',
						url: `links/${linkId}`,
					});

					returnData = returnData.concat(responseData);
				}
			}

			if (operation === 'create') {
				// ----------------------------------
				//          Link::create
				// ----------------------------------
				for (let i = 0; i < items.length; i++) {
					const target = this.getNodeParameter('target', i, '') as string;
					const createOptions = this.getNodeParameter('createOptions', i, {}) as IDataObject;

					responseData = await kuttApiRequest.call(this, {
						method: 'POST',
						url: `links`,
						body: {
							target,
							...(createOptions.description && { description: createOptions.description }),
							...(createOptions.expire_in && { expire_in: createOptions.expire_in }),
							...(createOptions.password && { password: createOptions.password }),
							...(createOptions.customurl && { customurl: createOptions.customurl }),
							...(createOptions.reuse && { reuse: createOptions.reuse }),
							...(createOptions.domain && { domain: createOptions.domain }),
						},
					});

					returnData = returnData.concat(responseData);
				}
			}
		}

		return [this.helpers.returnJsonArray(returnData)];
	}
}
