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
}

/**
 * Template Name
 * The list of templates supported by the sw-builder.
 */
export const TemplateNameSchema = z.enum(['base', 'firebase-fcm']);

export type ITemplateName = z.infer<typeof TemplateNameSchema>;
