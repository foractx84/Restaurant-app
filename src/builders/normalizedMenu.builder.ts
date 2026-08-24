import {
  NormalizedMenu,
  NormalizedMenuHour,
  NormalizedMenuHours,
  NormalizedMenuItem,
  NormalizedMenuSection,
  NormalizedModifier,
  NormalizedModifierGroup,
} from '@interfaces/platformIntegration.interface';

export class NormalizedMenuBuilder {
  private menu: Partial<NormalizedMenu> = {};

  setID = (id: string): this => {
    this.menu.id = id;
    return this;
  };

  setName = (name: string): this => {
    this.menu.name = name;
    return this;
  };

  setDescription = (description: string): this => {
    this.menu.description = description ?? '';
    return this;
  };

  setHours = (hours: NormalizedMenuHours): this => {
    this.menu.hours = hours;
    return this;
  };

  setSections = (sections: NormalizedMenuSection[]): this => {
    this.menu.sections = sections ?? [];
    return this;
  };

  build(): NormalizedMenu {
    // validate required fields
    if (!this.menu.id || !this.menu.name) {
      throw new Error('id and name are required');
    }
    return this.menu as NormalizedMenu;
  }
}

export class NormalizedMenuHoursBuilder {
  private hours: Partial<NormalizedMenuHours> = {};

  setMonday = (timespans: NormalizedMenuHour[]): this => {
    this.hours.Monday = timespans ?? [];
    return this;
  };

  setTuesday = (timespans: NormalizedMenuHour[]): this => {
    this.hours.Tuesday = timespans ?? [];
    return this;
  };

  setWednesday = (timespans: NormalizedMenuHour[]): this => {
    this.hours.Wednesday = timespans ?? [];
    return this;
  };

  setThursday = (timespans: NormalizedMenuHour[]): this => {
    this.hours.Thursday = timespans ?? [];
    return this;
  };

  setFriday = (timespans: NormalizedMenuHour[]): this => {
    this.hours.Friday = timespans ?? [];
    return this;
  };

  setSaturday = (timespans: NormalizedMenuHour[]): this => {
    this.hours.Saturday = timespans ?? [];
    return this;
  };

  setSunday = (timespans: NormalizedMenuHour[]): this => {
    this.hours.Sunday = timespans ?? [];
    return this;
  };

  build(): NormalizedMenuHours {
    // validate required fields
    if (Object.keys(this.hours).length === 0) {
      throw new Error('values are required');
    }
    return this.hours as NormalizedMenuHours;
  }
}

export class NormalizedMenuSectionBuilder {
  private section: Partial<NormalizedMenuSection> = {};

  setID = (id: string): this => {
    this.section.id = id;
    return this;
  };

  setName = (name: string): this => {
    this.section.name = name;
    return this;
  };

  setDescription = (description: string): this => {
    this.section.description = description ?? '';
    return this;
  };

  setItems = (items: NormalizedMenuItem[]): this => {
    this.section.items = items ?? [];
    return this;
  };

  build(): NormalizedMenuSection {
    // validate required fields
    if (!this.section.id || !this.section.name) {
      throw new Error('id and name are required');
    }
    return this.section as NormalizedMenuSection;
  }
}

export class NormalizedMenuItemBuilder {
  private item: Partial<NormalizedMenuItem> = {};

  setID = (id: string): this => {
    this.item.id = id;
    return this;
  };

  setName = (name: string): this => {
    this.item.name = name;
    return this;
  };

  setDescription = (description: string): this => {
    this.item.description = description ?? '';
    return this;
  };

  setPrice = (price: number): this => {
    this.item.price = price;
    return this;
  };

  // setImageURLs = (imageURLs: { link: string }[]): this => {
  //   this.item.imageURLs = imageURLs ?? [];
  //   return this;
  // };

  setModifierGroups = (modifierGroups: NormalizedModifierGroup[]): this => {
    this.item.modifierGroups = modifierGroups ?? [];
    return this;
  };

  setIsHidden = (isHidden: boolean): this => {
    this.item.isHidden = isHidden;
    return this;
  };

  build(): NormalizedMenuItem {
    // validate required fields
    if (!this.item.id || !this.item.name) {
      throw new Error('id and name are required');
    }
    return this.item as NormalizedMenuItem;
  }
}

export class NormalizedModifierGroupsBuilder {
  private modifierGroup: Partial<NormalizedModifierGroup> = {};

  setID = (id: string): this => {
    this.modifierGroup.id = id;
    return this;
  };

  setName = (name: string): this => {
    this.modifierGroup.name = name;
    return this;
  };
  setModifiers = (modifiers: NormalizedModifier[]): this => {
    this.modifierGroup.modifiers = modifiers ?? [];
    return this;
  };

  setMinimumSelections = (minimumSelections: number | null): this => {
    this.modifierGroup.minimumSelections = minimumSelections;
    return this;
  };

  setMaximumSelections = (maximumSelections: number | null): this => {
    this.modifierGroup.maximumSelections = maximumSelections;
    return this;
  };

  setMaxPerModifierSelectionQuantity = (maxPerModifierSelectionQuantity: number | null): this => {
    this.modifierGroup.maxPerModifierSelectionQuantity = maxPerModifierSelectionQuantity;
    return this;
  };

  build(): NormalizedModifierGroup {
    // validate required fields
    if (!this.modifierGroup.id || !this.modifierGroup.name) {
      throw new Error('id and name are required');
    }
    return this.modifierGroup as NormalizedModifierGroup;
  }
}

export class NormalizedModifierBuilder {
  private modifier: Partial<NormalizedModifier> = {};

  setID = (id: string): this => {
    this.modifier.id = id;
    return this;
  };

  setName = (name: string): this => {
    this.modifier.name = name;
    return this;
  };
  setPrice = (price: number): this => {
    this.modifier.price = price;
    return this;
  };

  setDescription = (description: string): this => {
    this.modifier.description = description ?? '';
    return this;
  };

  setIsHidden = (isHidden: boolean): this => {
    this.modifier.isHidden = isHidden;
    return this;
  };

  build(): NormalizedModifier {
    // validate required fields
    if (!this.modifier.id || !this.modifier.name) {
      throw new Error('id and name are required');
    }
    return this.modifier as NormalizedModifier;
  }
}
