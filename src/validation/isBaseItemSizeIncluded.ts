import { registerDecorator, ValidationArguments, ValidationOptions } from 'class-validator';

export const isBaseItemSizeIncluded = (property: string, validationOptions?: ValidationOptions) => {
  return (object: Object, propertyName: string) => {
    registerDecorator({
      name: 'isBaseItemSizeIncluded',
      target: object.constructor,
      propertyName: propertyName,
      constraints: [property],
      options: validationOptions,
      validator: {
        validate(value: any, args?: ValidationArguments): Promise<boolean> | boolean {
          const [relatedPropertyName] = args.constraints;
          const relatedValue = (args.object as any)[relatedPropertyName];
          return value.some(obj => JSON.stringify(obj) === JSON.stringify(relatedValue));
        },
      },
    });
  };
};
