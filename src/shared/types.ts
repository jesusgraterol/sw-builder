import { z } from 'zod';
import { IBaseParsedArgs } from 'argv-utils';

// the name of the environment in which the sw-builder is running
export type IEnvironment = 'development' | 'staging' | 'production';

/**
 * Module Args
 * The args that can bt passed to the sw-builder CLI
 */
export interface IModuleArgs extends IBaseParsedArgs {
  config?: string;
  environment?: IEnvironment;
  firebaseConfigProcessEnvKey?: string;
}

/**
 * Template Name
 * The list of templates supported by the sw-builder.
 */
export const TemplateNameSchema = z.enum(['base', 'firebase-fcm']);

export type ITemplateName = z.infer<typeof TemplateNameSchema>;

/**
 * Base Configuration
 * The configuration required to build the 'base' template. This type should be turned into a
 * discriminated union once more templates are introduced.
 */
export type IBaseConfig = {
  // the dir path in which the build's output is placed
  outDir: string;

  // the name of the template that will be generated
  template: ITemplateName;

  // the list of asset paths that will be traversed and included in the cache
  includeToPrecache: string[];

  // the list of file names that will be ignored
  excludeFilesFromPrecache: string[];

  // the list of MIME Types that won't be cached when the app sends HTTP GET requests
  excludeMIMETypesFromCache: string[];
};
