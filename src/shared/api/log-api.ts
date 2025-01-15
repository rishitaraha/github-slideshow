import { v4 as uuidv4 } from 'uuid';
import axios from 'axios';
import { OrgMetaManager, TokenManager } from '../helpers';
import { EnvVariables } from '../env-variables';

const logServerApi = axios.create({
  baseURL: !!EnvVariables.logServerUrl
    ? EnvVariables.logServerUrl.toString()
    : undefined,
});

logServerApi.interceptors.request.use((req) => {
  if (TokenManager.getToken() && req.headers) {
    req.headers['Authorization'] = `Bearer ${TokenManager.getToken()}`;
    req.headers['X-REQUEST-ID'] = uuidv4();
  }
  if (OrgMetaManager.getOrgId()) {
    const updatedId = OrgMetaManager.getOrgId();
    if (updatedId !== 'undefined' || '') {
      if (req.data) {
        req.data['org_id'] = updatedId;
      } else if (!req.url?.includes('?')) {
        req.url = req.url?.concat('?org_id=', updatedId || '');
      } else {
        req.url = req.url?.concat('&org_id=', updatedId || '');
      }
    }
  }

  return req;
});

export default logServerApi;
