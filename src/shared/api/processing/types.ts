export type ProcessingConnectionResponseType = {
  id?: string;
  processing_org_id: string;
  processing_org_name: string;
  connection_token: string;
};

export type ProcessingConnectionData = {
  id?: string;
  processingOrgId: string;
  processingOrgName: string;
  connectionToken: string;
};

export type CreateProcessingConnectionPayloadType = {
  processingOrgId: string;
  connectionToken: string;
};

export type CreateProcessingOrgPayloadType = {
  orgName: string;
};

export type ExportedFileInfo = {
  bucket: string;
  key: string;
};

export type ExportFilesFromProcessingPayloadType = {
  iterationId: string;
  dsm?: ExportedFileInfo;
  orthoLayerName?: string;
  orthomosaic?: ExportedFileInfo;
};
