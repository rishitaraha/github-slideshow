import { isNil } from 'lodash';

export const generateUid = (uid: number, detail: string) => {
  const paddedUid = isNil(uid)
    ? '-----'
    : ('00000' + uid).substring(uid.toString().length);
  return `${detail}` + paddedUid;
};

export const copyUidOnClick = (serialId, uidDetail) => {
  navigator.clipboard.writeText(generateUid(serialId, uidDetail));
};
