import { ValidatorConstraint, ValidatorConstraintInterface } from 'class-validator';
import { passwordIsValid } from '@/utils/passwordUtils';

@ValidatorConstraint({ name: 'isValidPassword', async: false })
export class isValidPassword implements ValidatorConstraintInterface {
  validate(password: string) {
    return passwordIsValid(password);
  }

  defaultMessage() {
    return 'Password is invalid!';
  }
}
