import { Resource } from 'cesium';
import { getAuthHeader, handleRefreshToken } from './shared/api';

// Storing the reference to the original fetch method.
const originalResourceFetchMethod = Resource.prototype.fetch;

// Override the fetch method.
Resource.prototype.fetch = function (options) {
  this.headers = {
    ...getAuthHeader(),
  };

  return originalResourceFetchMethod.call(this, options)?.catch((error) => {
    if (error.statusCode == 401) {
      return handleRefreshToken().then(() => this.fetch(options));
    }
    throw error;
  });
};
