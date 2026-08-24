import { atomizeChangeset, diff } from 'json-diff-ts';
import { enrichOperation } from '@menu-sync/processor/diff-enricher';
import { mergeUpdateOperations } from '@menu-sync/processor/merge-operations';
import { operationsExpander } from '@menu-sync/processor/operations-expander';
import { sortOperationsGenerator } from '@menu-sync/processor/sort-operations-generator';
import { commandFactory } from '@menu-sync/commands/command-factory';
import { orderCommands } from '@menu-sync/processor/order-commands';
import { IAtomicSyncChange } from '@menu-sync/interfaces/menu-sync.interface';
import { NormalizedMenu, NormalizedMenuHour, NormalizedMenuHours } from '@interfaces/platformIntegration.interface';

jest.mock('@utils/logger', () => ({
  logger: {
    debug: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
  },
}));

/**
 * Mirrors the composite-key function `MenuSyncProcessor.process` passes to `diff()` for hour
 * timespans (which have no surrogate id). Duplicated here since the pipeline stages are tested
 * directly rather than through `MenuSyncProcessor`, which would require a full `MenuUpdateContext`.
 */
const hourCompositeKey = (timespan: NormalizedMenuHour, shouldReturnKeyName: boolean): string =>
  shouldReturnKeyName ? 'compositeKey' : `${timespan.startTime}-${timespan.endTime}`;

const RESTAURANT_ID = 42;
const LOCATION_ID = 225569;

/** Runs every pipeline stage `MenuSyncProcessor.process` runs up to (but not including) command execution. */
const runPipeline = (oldData: NormalizedMenu[], newData: NormalizedMenu[]) => {
  const changes = diff(oldData, newData, {
    embeddedObjKeys: {
      '.': 'id',
      '.sections': 'id',
      '.sections.items': 'id',
      '.sections.items.modifierGroups': 'id',
      '.sections.items.modifierGroups.modifiers': 'id',
      '.hours.Monday': hourCompositeKey,
      '.hours.Tuesday': hourCompositeKey,
      '.hours.Wednesday': hourCompositeKey,
      '.hours.Thursday': hourCompositeKey,
      '.hours.Friday': hourCompositeKey,
      '.hours.Saturday': hourCompositeKey,
      '.hours.Sunday': hourCompositeKey,
    },
  });

  const atomicOps = atomizeChangeset(changes);
  const atomicSyncOps: IAtomicSyncChange[] = sortOperationsGenerator(oldData, newData, RESTAURANT_ID, atomicOps);
  const enrichedOps = atomicSyncOps.map(op => enrichOperation(op, newData, RESTAURANT_ID, LOCATION_ID));
  const mergedOps = mergeUpdateOperations(enrichedOps);
  const expandedOps = operationsExpander(mergedOps);
  const commands = expandedOps.map(commandFactory);
  return orderCommands(commands);
};

const commandNames = (commands: ReturnType<typeof runPipeline>): string[] => commands.map(c => c.constructor.name);

const EMPTY_HOURS: NormalizedMenuHours = { Monday: [], Tuesday: [], Wednesday: [], Thursday: [], Friday: [], Saturday: [], Sunday: [] };

const modifier = (overrides: Partial<NormalizedMenu['sections'][number]['items'][number]['modifierGroups'][number]['modifiers'][number]> = {}) => ({
  id: 'mod-1',
  name: 'Extra Cheese',
  price: 150,
  description: 'More cheese',
  ...overrides,
});

const modifierGroup = (overrides: Partial<ReturnType<typeof baseMenu>['sections'][number]['items'][number]['modifierGroups'][number]> = {}) => ({
  id: 'group-1',
  name: 'Toppings',
  modifiers: [modifier()],
  ...overrides,
});

const item = (overrides: Partial<ReturnType<typeof baseMenu>['sections'][number]['items'][number]> = {}) => ({
  id: 'item-1',
  name: 'Cheeseburger',
  description: 'Beef patty with cheese',
  price: 500,
  modifierGroups: [modifierGroup()],
  ...overrides,
});

const section = (overrides: Partial<ReturnType<typeof baseMenu>['sections'][number]> = {}) => ({
  id: 'section-1',
  name: 'Burgers',
  description: '',
  items: [item()],
  ...overrides,
});

function baseMenu(overrides: Partial<NormalizedMenu> = {}): NormalizedMenu {
  return {
    id: 'menu-1',
    name: 'Main Menu',
    description: '',
    hours: EMPTY_HOURS,
    sections: [section()],
    ...overrides,
  };
}

describe('menu-sync pipeline (diff -> commandFactory -> orderCommands)', () => {
  it('produces no commands when old and new menus are identical', () => {
    const oldData = [baseMenu()];
    const newData = [baseMenu()];

    expect(runPipeline(oldData, newData)).toHaveLength(0);
  });

  it('adds a new item to an existing section as AddItemCommand', () => {
    const oldData = [baseMenu()];
    const newItem = item({ id: 'item-2', name: 'Fries', price: 300, modifierGroups: [] });
    const newData = [baseMenu({ sections: [section({ items: [item(), newItem] })] })];

    const commands = runPipeline(oldData, newData);

    // A SortItemsCommand accompanies the add so the section's remaining sort_order values stay correct.
    expect(commandNames(commands)).toEqual(['AddItemCommand', 'SortItemsCommand']);
  });

  it('adds a new section (with a nested item and modifier) as one AddSectionCommand, without separate child ADD commands', () => {
    const oldData = [baseMenu()];
    const newSection = section({ id: 'section-2', name: 'Drinks', items: [item({ id: 'item-3', name: 'Soda', modifierGroups: [] })] });
    const newData = [baseMenu({ sections: [section(), newSection] })];

    const commands = runPipeline(oldData, newData);

    expect(commandNames(commands)).toEqual(['AddSectionCommand', 'SortSectionsCommand']);
  });

  it('updates an item price as UpdateItemCommand', () => {
    const oldData = [baseMenu()];
    const newData = [baseMenu({ sections: [section({ items: [item({ price: 650 })] })] })];

    const commands = runPipeline(oldData, newData);

    expect(commandNames(commands)).toEqual(['UpdateItemCommand']);
    expect(commands[0]).toMatchObject({ op: expect.objectContaining({ value: { price: 650 } }) });
  });

  it('updates a modifier name as UpdateModifierCommand', () => {
    const oldData = [baseMenu()];
    const newData = [
      baseMenu({ sections: [section({ items: [item({ modifierGroups: [modifierGroup({ modifiers: [modifier({ name: 'Cheddar' })] })] })] })] }),
    ];

    const commands = runPipeline(oldData, newData);

    expect(commandNames(commands)).toEqual(['UpdateModifierCommand']);
  });

  it('removes an item and cascades to remove its modifier group and modifier first (children before parent)', () => {
    const oldData = [baseMenu()];
    const newData = [baseMenu({ sections: [section({ items: [] })] })];

    const commands = runPipeline(oldData, newData);

    expect(commandNames(commands)).toEqual(['RemoveModifierCommand', 'RemoveModifierGroupCommand', 'RemoveItemCommand']);
  });

  it('removes a modifier without touching its sibling modifiers', () => {
    const oldData = [
      baseMenu({
        sections: [
          section({ items: [item({ modifierGroups: [modifierGroup({ modifiers: [modifier(), modifier({ id: 'mod-2', name: 'Bacon' })] })] })] }),
        ],
      }),
    ];
    const newData = [baseMenu({ sections: [section({ items: [item({ modifierGroups: [modifierGroup({ modifiers: [modifier()] })] })] })] })];

    const commands = runPipeline(oldData, newData);

    expect(commandNames(commands)).toEqual(['RemoveModifierCommand', 'SortModifiersCommand']);
  });

  it('orders a mixed changeset as REMOVEs, then ADDs, then UPDATEs (per EXECUTION_ORDER)', () => {
    const oldData = [
      baseMenu({
        sections: [
          section({
            items: [item(), item({ id: 'item-removed', name: 'Onion Rings', modifierGroups: [] })],
          }),
        ],
      }),
    ];
    const newData = [
      baseMenu({
        sections: [
          section({
            items: [item({ price: 550 }), item({ id: 'item-added', name: 'Fries', price: 300, modifierGroups: [] })],
          }),
        ],
      }),
    ];

    const commands = runPipeline(oldData, newData);

    expect(commandNames(commands)).toEqual(['RemoveItemCommand', 'AddItemCommand', 'UpdateItemCommand', 'SortItemsCommand']);
  });
});
