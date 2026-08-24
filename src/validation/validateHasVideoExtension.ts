import { VIDEO_MIME_TYPES } from '@/constants/videoMimeTypes.constants';
import { registerDecorator, ValidationOptions, ValidationArguments } from 'class-validator';

export function hasVideoExtension(validationOptions?: ValidationOptions) {
  return function (object: any, propertyName: string) {
    registerDecorator({
      name: 'isVideoExtension',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          const extension = value.split('.').pop();
          return VIDEO_MIME_TYPES.includes(extension);
        },
        defaultMessage(args: ValidationArguments) {
          return `${args.property} must have a valid video extension (${VIDEO_MIME_TYPES.join(', ')})`;
        },
      },
    });
  };
}
