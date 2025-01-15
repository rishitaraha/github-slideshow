export enum ProcessingMessageType {
  ExportDsmOrtho = 'exportDsmOrtho',
  ConnectionStatus = 'connectionStatus',
  AuthenticationFailed = 'authenticationFailed',
  PathChanged = 'pathChanged',
  RaAccessToken = 'raAccessToken',
}

export enum ProcessingConnectionStatus {
  Closed = 'closed',
}
