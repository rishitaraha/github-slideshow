import { SitesOptionType } from '../../types';
import { AddSiteInput } from '../types';
import { SiteTypes } from 'shared/api';

export const siteTypeOptions: SitesOptionType[] = [
  { label: 'Mine Site', value: SiteTypes.MINE_SITE },
  { label: 'Wagon Site', value: SiteTypes.WAGON_SITE },
  { label: 'Crushed Site', value: SiteTypes.CRUSHED_SITE },
  { label: 'Uncrushed Site', value: SiteTypes.UNCRUSHED_SITE },
  { label: 'Urban Land', value: SiteTypes.URBAN_LAND },
];

export const siteInputState: AddSiteInput = {
  siteName: '',
  siteType: siteTypeOptions[0],
  baseDSM: null,
  legendImage: null,
  longitude: '',
  latitude: '',
  siteBoundary: '',
};
