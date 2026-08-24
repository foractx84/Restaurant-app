import { ValidationArguments, ValidatorConstraint, ValidatorConstraintInterface } from 'class-validator';

@ValidatorConstraint({ name: 'isValidSelectionRange', async: false })
export class isValidSelectionRange implements ValidatorConstraintInterface {
  validate(maximumSelections: number, args: ValidationArguments) {
    const { minimumSelections } = args.object as { minimumSelections?: number };
    if (maximumSelections == null || minimumSelections == null) {
      return true;
    }
    return maximumSelections >= minimumSelections;
  }

  defaultMessage() {
    return 'maximumSelections must be greater than or equal to minimumSelections';
  }
}
