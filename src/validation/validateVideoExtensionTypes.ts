import { VIDEO_MIME_TYPES } from '@/constants/videoMimeTypes.constants';
import { registerDecorator, ValidationOptions, ValidationArguments } from 'class-validator';

export function IsVideoMimeType(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'isVideoMimeType',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          return VIDEO_MIME_TYPES.includes(value);
        },
        defaultMessage(args: ValidationArguments) {
          return `${args.property} must be a valid video MIME type`;
        },
      },
    });
  };
}
