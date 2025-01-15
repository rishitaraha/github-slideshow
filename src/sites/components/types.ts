import { SitesOptionType } from '../types';

export type AddSiteInput = {
  siteName: string;
  siteType: SitesOptionType;
  baseDSM: File | null;
  legendImage: File | null;
  longitude: string;
  latitude: string;
  siteBoundary: string;
  mapBoxId?: string;
};
