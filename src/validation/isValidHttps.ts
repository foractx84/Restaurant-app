import { registerDecorator, ValidationOptions, ValidatorConstraint, ValidatorConstraintInterface, ValidationArguments } from 'class-validator';

@ValidatorConstraint({ async: false })
export class IsHttpsUrlConstraint implements ValidatorConstraintInterface {
  validate(url: any, args: ValidationArguments) {
    // This regex checks for "https://" and include a domain name with underscores allowed
    // since there are so many top level domains out there and impossible to cover them all,
    // this regex checks for just a ".<string>" or ".<string>." format, where string can be ANY value
    const httpsDomainRegex = /^https:\/\/[a-zA-Z0-9-_]+(\.[a-zA-Z0-9-_]+)*\.[a-zA-Z]{2,}(\/[^\s]*)?$/;
    return typeof url === 'string' && httpsDomainRegex.test(url);
  }

  defaultMessage(args: ValidationArguments) {
    return 'URL must start with "https://" and include a domain like .com, .edu, .org, etc.';
  }
}

export function IsHttpsUrl(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsHttpsUrlConstraint,
    });
  };
}
