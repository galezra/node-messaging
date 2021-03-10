/**
 * bandwidthLib
 *
 * This file was automatically generated by APIMATIC v2.0 ( https://apimatic.io ).
 */

import { basicAuthAuthenticationProvider } from './authentication';
import {
  AuthParams,
  ClientInterface,
  SdkRequestBuilder,
  SdkRequestBuilderFactory,
  Server,
} from './clientInterface';
import { Configuration, Environment } from './configuration';
import { DEFAULT_CONFIGURATION } from './defaultConfiguration';
import { ApiError } from './errors/apiError';
import { HttpClient } from './http/httpClient';
import { pathTemplate, SkipEncode } from './http/pathTemplate';
import {
  AuthenticatorInterface,
  createRequestBuilderFactory,
  HttpClientInterface,
} from './http/requestBuilder';

const USER_AGENT = 'APIMATIC 2.0';

export class Client implements ClientInterface {
  private _config: Readonly<Configuration>;
  private _requestBuilderFactory: SdkRequestBuilderFactory;

  constructor(config?: Partial<Configuration>) {
    this._config = {
      ...DEFAULT_CONFIGURATION,
      ...config,
    };
    this._requestBuilderFactory = createRequestHandlerFactory(
      server => getBaseUri(server, this._config),
      basicAuthAuthenticationProvider(this._config),
      new HttpClient({
        timeout: this._config.timeout,
        clientConfigOverrides: this._config.unstable_httpClientOptions,
      }),
      [
        withErrorHandlers,
        withUserAgent,
        withAuthenticationByDefault,
      ]
    );
  }

  public getRequestBuilderFactory(): SdkRequestBuilderFactory {
    return this._requestBuilderFactory;
  }

  /**
   * Clone this client and override given configuration options
   */
  public withConfiguration(config: Partial<Configuration>) {
    return new Client({ ...this._config, ...config });
  }
}

function createHttpClientAdapter(client: HttpClient): HttpClientInterface {
  return async (request, requestOptions) => {
    return await client.executeRequest(request, requestOptions);
  };
}

function getBaseUri(server: Server = 'MessagingDefault', config: Configuration): string {
  if (config.environment === Environment.Production) {
    if (server === 'MessagingDefault') {
      return 'https://messaging.bandwidth.com/api/v2';
    }
  }
  if (config.environment === Environment.Custom) {
    if (server === 'MessagingDefault') {
      return pathTemplate`${new SkipEncode(config.baseUrl)}`;
    }
  }
  throw new Error('Could not get Base URL. Invalid environment or server.');
}

function createRequestHandlerFactory(
  baseUrlProvider: (server?: Server) => string,
  authProvider: AuthenticatorInterface<AuthParams>,
  httpClient: HttpClient,
  addons: ((rb: SdkRequestBuilder) => void)[]
): SdkRequestBuilderFactory {
  const requestBuilderFactory = createRequestBuilderFactory(
    createHttpClientAdapter(httpClient),
    baseUrlProvider,
    ApiError,
    authProvider
  );

  return tap(requestBuilderFactory, ...addons);
}

function tap(
  requestBuilderFactory: SdkRequestBuilderFactory,
  ...callback: ((requestBuilder: SdkRequestBuilder) => void)[]
): SdkRequestBuilderFactory {
  return (...args) => {
    const requestBuilder = requestBuilderFactory(...args);
    callback.forEach(c => c(requestBuilder));
    return requestBuilder;
  };
}

function withErrorHandlers(rb: SdkRequestBuilder) {
  rb.defaultToError(ApiError);
}

function withUserAgent(rb: SdkRequestBuilder) {
  rb.header('user-agent', USER_AGENT);
}

function withAuthenticationByDefault(rb: SdkRequestBuilder) {
  rb.authenticate(true);
}
