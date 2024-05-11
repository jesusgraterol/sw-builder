import { IBaseParsedArgs } from 'argv-utils';

/* ************************************************************************************************
 *                                              TYPES                                             *
 ************************************************************************************************ */

/**
 * Module Args
 * The args that can bt passed to the sw-builder CLI
 */
interface IModuleArgs extends IBaseParsedArgs {
  config?: string
}

/**
 * Template Name
 * The list of templates supported by the sw-builder.
 */
type ITemplateName = 'base';

/**
 * Base Configuration
 * The configuration required to build the 'base' template. This interface should be extended by
 * other templates.
 */
interface IBaseConfig {
  // the dir path in which the build's output is placed
  outDir: string,

  // the name of the template that will be generated
  template: ITemplateName,

  // the list of asset paths that will be traversed and included in the cache
  includeToPrecache: string[],

  // the list of file paths that will be ignored
  excludeFromPrecache: string[],
}





/* ************************************************************************************************
 *                                         MODULE EXPORTS                                         *
 ************************************************************************************************ */
export type {
  IModuleArgs,
  ITemplateName,
  IBaseConfig,
};
