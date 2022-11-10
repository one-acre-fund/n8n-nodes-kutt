import {
	IAuthenticateGeneric,
	ICredentialTestRequest,
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

export class KuttCredentialsApi implements ICredentialType {
	name = 'kuttCredentialsApi';
	displayName = 'Kutt Credentials API';
	properties: INodeProperties[] = [
		{
			displayName: 'API Base',
			name: 'baseUrl',
			default: 'https://kutt.it/api/v2',
			type: 'string',
		},
		{
			displayName: 'API Token',
			name: 'token',
			default: '',
			type: 'string',
			typeOptions: {
				password: true,
			},
		},
	];

	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {
			headers: {
				'X-API-KEY': '={{$credentials.token}}',
			},
		},
	};

	test: ICredentialTestRequest = {
		request: {
			baseURL: '={{$credentials.baseUrl}}',
			url: 'health',
		},
	};
}
