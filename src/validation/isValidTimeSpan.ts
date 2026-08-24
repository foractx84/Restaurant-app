import { registerDecorator, ValidationArguments, ValidationOptions } from 'class-validator';

/**
 * Custom time span validation. Add to the end date of a timespan to ensure that the start date is always before
 * @param property
 * @param validationOptions
 */
export const isValidTimeSpan = (property: string, validationOptions?: ValidationOptions) => {
  return (object: Object, propertyName: string) => {
    registerDecorator({
      name: 'isValidTimeSpan',
      target: object.constructor,
      propertyName: propertyName,
      constraints: [property],
      options: validationOptions,
      validator: {
        validate(value: any, args?: ValidationArguments): Promise<boolean> | boolean {
          const [relatedPropertyName] = args.constraints;
          const relatedValue = (args.object as any)[relatedPropertyName];
          return new Date(relatedValue) < new Date(value);
        },
      },
    });
  };
};
