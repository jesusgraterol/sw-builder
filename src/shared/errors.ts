// the errors that can be thrown by the package
type IErrorCode = 'INVALID_TEMPLATE_NAME' | 'INVALID_CONFIG_VALUE' | 'NOT_A_PATH_ELEMENT';
export const ERRORS: { [key in IErrorCode]: IErrorCode } = {
  INVALID_TEMPLATE_NAME: 'INVALID_TEMPLATE_NAME',
  INVALID_CONFIG_VALUE: 'INVALID_CONFIG_VALUE',
  NOT_A_PATH_ELEMENT: 'NOT_A_PATH_ELEMENT',
};
