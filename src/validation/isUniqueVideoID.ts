import { LinkMenuItemAndMediaAndThumbnailsDto } from '@dtos/menuItem.dto';
import { registerDecorator, ValidationArguments, ValidationOptions } from 'class-validator';

export function IsUniqueVideoID(validationOptions?: ValidationOptions) {
  return function (object: any, propertyName: string) {
    registerDecorator({
      name: 'isUniqueVideoID',
      target: object.constructor,
      propertyName: propertyName,
      constraints: [],
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          const items = args.object[propertyName];
          const uniqueItems = new Set(items.map((item: LinkMenuItemAndMediaAndThumbnailsDto) => item.videoID));
          return items.length === uniqueItems.size;
        },
        defaultMessage(args: ValidationArguments) {
          return 'videoID values must be unique.';
        },
      },
    });
  };
}
