import { useEffect, useState } from 'react';
import { Converter } from '../utils';

export const useBase64ImageString = (stringToConvert: string) => {
  const [base64String, setBase64String] = useState('');

  useEffect(() => {
    Converter.imageToBase64(stringToConvert, (url) => {
      setBase64String(url);
    });
  }, []);

  return { base64String };
};
