

/* ************************************************************************************************
 *                                             ERRORS                                             *
 ************************************************************************************************ */
type IErrorCode = 'INVALID_TEMPLATE_NAME' | 'INVALID_CONFIG_VALUE' | 'NOT_A_PATH_ELEMENT';
const ERRORS: { [key in IErrorCode]: IErrorCode } = {
  INVALID_TEMPLATE_NAME: 'INVALID_TEMPLATE_NAME',
  INVALID_CONFIG_VALUE: 'INVALID_CONFIG_VALUE',
  NOT_A_PATH_ELEMENT: 'NOT_A_PATH_ELEMENT',
};





/* ************************************************************************************************
 *                                         MODULE EXPORTS                                         *
 ************************************************************************************************ */
export {
  ERRORS,
};
