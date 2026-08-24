import { ValidatorConstraint, ValidatorConstraintInterface } from 'class-validator';
import { Category } from '@/enums/category';

@ValidatorConstraint({ name: 'category', async: false })
export class CustomCategoryValidation implements ValidatorConstraintInterface {
  validate(category: string) {
    return category === Category.FOOD || category === Category.DRINK;
  }

  defaultMessage() {
    return 'Provided category must be "food" or "drink"';
  }
}
