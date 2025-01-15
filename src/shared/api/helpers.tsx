import { toast } from '@aus-platform/design-system';
import { isArray, isEmpty } from 'lodash';
import { inputFieldNameMapper } from '../enums';
import { TokenManager, isAppOpenInIframe } from '../helpers';
import {
  ApiErrorResponse,
  ApiFieldErrorsDetails,
  ApiFormErrorDetails,
  ApiResponse,
  AuthHeader,
} from '.';

export const handleFormInputMessage = (
  isSuccess: boolean,
  isError: boolean,
  data: ApiResponse | undefined,
  error: ApiErrorResponse | undefined | null,
  setErrors: CallableFunction = () => {},
  setFormError: CallableFunction = () => {},
) => {
  if (isSuccess && data) {
    toast.success(data.meta?.message);
  }

  if (isError && error && error.meta.status_code !== 401) {
    // Handle form level errors.
    if (error.meta.details?.form && !isArray(error.meta.details.form)) {
      const message = error.meta.details.form.message;
      setFormError(message);
    }
    // TODO: Optimise the "else-if" condition below.
    else if (error.meta.details?.form && isArray(error.meta.details.form)) {
      const formError = error.meta.details.form.map((value) => value.message);
      setFormError(formError);
    }
    // Handle fields level errors.
    else if (error.meta.details) {
      const field_errors = {};
      for (const [key, values] of Object.entries(error.meta.details)) {
        field_errors[inputFieldNameMapper(key)] = [];
        for (const value of values) {
          field_errors[inputFieldNameMapper(key)] += [value.message];
        }
      }
      setErrors(field_errors);
    }
    // Handle application level errors.
    else {
      toast.error(error.meta.message);
    }
  }
};

export const handleResponseMessage = (
  isSuccess: boolean,
  isError: boolean,
  data: ApiResponse | undefined,
  error: ApiErrorResponse | undefined | null,
) => {
  if (isSuccess && data) {
    toast.success(data.meta?.message);
  }

  if (isError && error && error.meta.status_code !== 401) {
    if (!isEmpty(error.meta.details)) {
      handleValidationErrorDetails(error.meta.details);
    } else {
      toast.error(
        error.meta.message ? error.meta.message : getErrorMessages(error),
      );
    }
  }
};

export const handleResponseSuccessMessage = (
  isSuccess: boolean,
  data: ApiResponse | undefined | null,
) => {
  if (isSuccess && data) {
    toast.success(data.meta?.message);
  }
};

export const handleResponseErrorMessage = (
  isError: boolean,
  error: ApiErrorResponse | undefined | null,
) => {
  if (isError && error && error.meta.status_code !== 401) {
    toast.error(
      error.meta.message ? error.meta.message : getErrorMessages(error),
    );
  }
};

export const handleValidationErrorDetails = (
  details: ApiFormErrorDetails | ApiFieldErrorsDetails,
) => {
  toast.error(
    <div className="ms-2">
      <div className="body-txt-3">Validation Error</div>
      <ul>
        {Object.keys(details).map((detailKey, index) => {
          const detailValue = details[detailKey];
          if (isArray(detailValue)) {
            return detailValue.map((detail, detailIndex) => (
              <li
                key={'validation-array-detail' + detailIndex}
              >{`${detail['message']}`}</li>
            ));
          }
          return (
            <li
              key={'validation-detail' + index}
            >{`${detailValue['message']}`}</li>
          );
        })}
      </ul>
    </div>,
  );
};

export const getErrorMessages = (error: ApiErrorResponse) => {
  const messages = (
    <>
      {Object.entries(error.data).map(([key, err]) => {
        if (typeof err !== 'string') {
          return;
        }

        return (
          <div key={key}>
            <>
              <b>{key}</b>: {err}
              <br />
            </>
          </div>
        );
      })}
    </>
  );
  return messages;
};

export const getAuthHeader = () => {
  const authHeader: AuthHeader = {};

  if (isAppOpenInIframe()) {
    const orgAccessToken = sessionStorage.getItem('orgAccessToken');
    if (orgAccessToken) {
      authHeader['X-Org-Access-Token'] = orgAccessToken;
    }
  } else if (TokenManager.getToken()) {
    authHeader['Authorization'] = `Bearer ${TokenManager.getToken()}`;
  }

  return authHeader;
};

/**
 * The function uses XMLHttpRequest to load an image tile with custom URL parameters
 * and headers, including a bearer token for authorization.
 * @param {tile} - This represents a tile object loaded with an image fetched using the `src` URL.
 * @param {src} - This represents the URL from which the image tile will be loaded.
 */
export const tileLoadFunction = (tile, src) => {
  const client = new XMLHttpRequest();

  // Adding custom URL params/headers.
  client.open('GET', src);
  client.responseType = 'arraybuffer';
  const bearerToken = TokenManager.getToken();
  client.setRequestHeader('Authorization', `Bearer ${bearerToken}`);

  client.onload = function () {
    const arrayBufferView = new Uint8Array(this.response);
    const blob = new Blob([arrayBufferView], { type: 'image/png' });
    const urlCreator = window.URL || (window as any).webkitURL;
    const imageUrl = urlCreator.createObjectURL(blob);
    tile.getImage().src = imageUrl;
  };

  client.send();
};

export const infiniteQueryPageHandler = (lastPage, allPages, lastPageParam) => {
  let itemsFetched = 0;
  allPages.forEach((page) => (itemsFetched += page.data.geotagImages.length));
  if (itemsFetched < lastPage.data.total) {
    return (lastPageParam as number) + 1;
  }
};
