export type MockApiResponseMetaType = {
  message: string;
  details?: Record<string, never | string>;
  slug?: string;
  status_code?: number;
  success?: boolean;
  type?: string;
};

const defaultMetaObject = {
  details: {},
  message: '',
  slug: '',
  status_code: 200,
  success: true,
  type: '',
};

export const mockApiResponseUtil = <Type>(
  data: Type,
  meta: MockApiResponseMetaType,
) => {
  return {
    data: data,
    meta: { ...defaultMetaObject, ...meta }, // Overriding defaultMetaObject.
  };
};
