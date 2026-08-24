import { ValidatorConstraint, ValidatorConstraintInterface } from 'class-validator';
import { MenuDisclaimer } from '@/enums/menuDisclaimer';
import { CreateMenuDisclaimersInterface, CreateMenuDisclaimersResponseInterface } from '@/interfaces/disclaimers.interface';

@ValidatorConstraint({ name: 'menuDisclaimer', async: false })
export class CustomMenuDisclaimerPositionValidation implements ValidatorConstraintInterface {
  validate(menuDisclaimer: string) {
    return menuDisclaimer === MenuDisclaimer.top || menuDisclaimer === MenuDisclaimer.bottom;
  }

  defaultMessage() {
    return 'Provided category must be "menu top bar" or "menu bottom bar"';
  }
}

@ValidatorConstraint({ name: 'disclaimers', async: false })
export class MenuDisclaimersUniqueValidation implements ValidatorConstraintInterface {
  validate(disclaimers: CreateMenuDisclaimersInterface[]) {
    const positions = disclaimers.map(disclaimer => disclaimer.position);
    if (positions.length !== new Set(positions).size) {
      return false;
    }
    return true;
  }

  defaultMessage() {
    return 'Provided menu disclaimer positions must not be duplicates';
  }
}

@ValidatorConstraint({ name: 'disclaimers', async: false })
export class MenuDisclaimersUniqueMessageIDValidation implements ValidatorConstraintInterface {
  validate(disclaimers: CreateMenuDisclaimersResponseInterface[]) {
    const messageIDs = disclaimers.map(disclaimer => disclaimer.messageID);
    if (messageIDs.length !== new Set(messageIDs).size) {
      return false;
    }
    return true;
  }

  defaultMessage() {
    return 'Provided menu disclaimer ids must not be duplicates';
  }
}
