export const Converter = {
  bytesToSizeConverter: (bytes: number): string => {
    if (bytes == 0) {
      return '0 Byte';
    }
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
    // Find that final size unit. 0 -> Bytes, 1 -> KB, 2 -> MB and so on.
    const indexOfUnitInSizesArray = Math.floor(
      Math.log(bytes) / Math.log(1024),
    );
    return (
      parseFloat((bytes / Math.pow(1024, indexOfUnitInSizesArray)).toFixed(2)) +
      ' ' +
      sizes[indexOfUnitInSizesArray]
    );
  },
  imageToBase64: (imgUrl: string, callback: (dataUrl: string) => void) => {
    // Ref: https://levelup.gitconnected.com/how-to-convert-image-to-base64-by-javascript-d110556de37f
    const image = new Image();
    image.crossOrigin = 'anonymous';
    image.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      canvas.height = image.naturalHeight;
      canvas.width = image.naturalWidth;
      ctx?.drawImage(image, 0, 0);
      const dataUrl = canvas.toDataURL();
      callback(dataUrl);
    };
    image.src = imgUrl;
  },
  // Convert px (i.e. 15px) string to number (15).
  pixelToNumber: (pixelString: string): number => {
    return parseInt(pixelString.replace('px', '') ?? 0, 10);
  },
};
