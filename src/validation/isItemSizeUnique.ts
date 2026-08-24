import { ValidatorConstraint, ValidatorConstraintInterface } from 'class-validator';
import { CreateItemSizeDto } from '@dtos/itemSize.dto';

@ValidatorConstraint({ name: 'allItemSizes', async: false })
export class isItemSizeUnique implements ValidatorConstraintInterface {
  validate(allItemSizes: CreateItemSizeDto[]) {
    const labels = allItemSizes.map(itemSize => itemSize.label.toLowerCase());
    const labelsSet = new Set(labels);
    return labels.length === labelsSet.size;
  }

  defaultMessage() {
    return 'Item size labels must be unique.';
  }
}
