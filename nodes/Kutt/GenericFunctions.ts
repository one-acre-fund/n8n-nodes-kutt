import { IExecuteFunctions, ILoadOptionsFunctions } from 'n8n-core';

import { IDataObject, IHookFunctions, IHttpRequestOptions, IWebhookFunctions } from 'n8n-workflow';

export async function kuttApiRequest(
	this: IExecuteFunctions | IWebhookFunctions | IHookFunctions | ILoadOptionsFunctions,
	option: IDataObject = {},
	// tslint:disable:no-any
): Promise<any> {
	const credentials = (await this.getCredentials('kuttCredentialsApi')) as IDataObject;

	const options: IHttpRequestOptions = {
		baseURL: String(credentials.baseUrl),
		url: '',
		headers: {
			'X-API-KEY': credentials.token,
		},
		json: true,
	};
	if (Object.keys(option)) {
		Object.assign(options, option);
	}

	const scrollValue = option.scroll as boolean;
	// This is the max limit supported by the kutt API
	const LIMIT = 50;
	if (scrollValue) {
		let skip = 0;
		let response: any[] = [];
		let fetchMore = true;
		while (fetchMore) {
			if (options.qs) {
				options.qs.skip = skip;
				options.qs.limit = LIMIT;
			} else {
				options.qs = { skip, limit: LIMIT };
			}

			const batch = await this.helpers.httpRequest(options);
			if (batch && batch['data'] && batch['data'].length) {
				response = response.concat(batch['data']);
			}
			fetchMore = batch && batch.total && batch.total > response.length;
			skip = response.length;
		}
		return response;
	} else {
		return await this.helpers.httpRequest(options);
	}
}
