import { registerDecorator, ValidationArguments, ValidationOptions } from 'class-validator';

/**
 * Dependency values validation.
 * Used to ensure that if a certain sibling value is indicated then it exists in the request
 * For example see CreateProfilePageRequestBodyDto where if navLink is provided,
 * it has the dependency of urlPath having to be provided
 * @param dependency - value that will be validated against
 * @param validationOptions
 */
export const hasDependency = (dependency: string, validationOptions?: ValidationOptions) => {
  return (object: Object, propertyName: string) => {
    registerDecorator({
      name: 'hasDependency',
      target: object.constructor,
      propertyName: propertyName,
      constraints: [dependency],
      options: {
        ...validationOptions,
        message:
          validationOptions?.message ||
          `'${dependency}' required with '${propertyName}'. Please provide '${dependency}' or remove '${propertyName}' and try again.`,
      },
      validator: {
        validate(value: string, args?: ValidationArguments): boolean {
          const [dependencyName] = args.constraints;
          const dependencyValue = (args.object as unknown as string)[dependencyName];

          if (value != null && value !== '') {
            return !!dependencyValue;
          }

          return true;
        },
      },
    });
  };
};
