import { useSearchParams } from 'react-router-dom';

export const useQueryParam = (key) => {
  const [searchParams] = useSearchParams();
  return searchParams.get(key);
};
