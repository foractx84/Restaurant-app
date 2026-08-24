import { hasVideoExtension } from '@/validation/validateHasVideoExtension';
import { IsVideoMimeType } from '@/validation/validateVideoExtensionTypes';
import { IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';

export class VideoSignedURLDto {
  @IsString()
  @IsNotEmpty()
  @IsVideoMimeType({ message: 'Invalid video MIME type' })
  extension: string;
}

export class LinkLongFormVideoToMediaLibraryDto {
  @MinLength(1)
  @IsString()
  @IsNotEmpty()
  @hasVideoExtension({ message: 'Invalid video file extension' })
  videoUUID: string; // this includes the extension of the video -> some_uuid.mp4 (notice mp4 is included) in the request or it throws error.

  @MinLength(1)
  @IsString()
  @IsOptional()
  originalFileName: string; // this is the original name of the file, it isnt passed up then it defaults to the videoUUID
}
