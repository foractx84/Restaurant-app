import { registerDecorator, ValidationArguments, ValidationOptions } from 'class-validator';

/**
 * Custom announcement type validation.
 * Checks if type "modal" and type "embed", and if of value "modal", then "description" and "title" are required.
 * @param property
 * @param validationOptions
 */
export const validateAnnouncementType = (property: string, validationOptions?: ValidationOptions) => {
  return (object: Object, propertyName: string) => {
    registerDecorator({
      name: 'validateAnnouncementType',
      target: object.constructor,
      propertyName: propertyName,
      constraints: [property],
      options: validationOptions,
      validator: {
        validate(value: any, args?: ValidationArguments): Promise<boolean> | boolean {
          if (value === 'modal' || value === 'drawer') {
            const isNotEmpty = (val: string) => val && val?.trim()?.length > 0;
            return isNotEmpty(args.object?.['description']) && isNotEmpty(args.object?.['title']);
          } else if (value === 'embed') {
            return true;
          }
          return false;
        },
      },
    });
  };
};

/**
 * Custom announcement type validation.
 * Checks if type "modal", "drawer", or "embed" (for editing announcement, changing the announcement type).
 * @param property
 * @param validationOptions
 */
export const validateEditAnnouncementType = (property: string, validationOptions?: ValidationOptions) => {
  return (object: Object, propertyName: string) => {
    registerDecorator({
      name: 'validateAnnouncementType',
      target: object.constructor,
      propertyName: propertyName,
      constraints: [property],
      options: validationOptions,
      validator: {
        validate(value: any, args?: ValidationArguments): Promise<boolean> | boolean {
          if (value === 'modal' || value === 'drawer' || value === 'embed') {
            return true;
          }
          return false;
        },
      },
    });
  };
};
