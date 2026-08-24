import { app } from '@/server';
import { getConnection, In } from 'typeorm';
import { ormConnection } from '@/utils/dbUtils';
import { ModifierEntity } from '@/entities/modifier.entity';
import { ModifierGroupEntity } from '@/entities/modifierGroup.entity';
import { ModifierGroupToModifierLinkEntity } from '@/entities/modifierGroupToModifierLink.entity';
import { ModifierPriceOverrideEntity } from '@/entities/modifierPriceOverride.entity';
import ModifierGroupToModifierLinkModel from '@models/modifierGroupToModifierLink.model';
import ModifierPriceOverrideModel from '@models/modifierPriceOverride.model';

jest.mock('@/utils/GCP_bucket', () => require('../../../__mocks__/GCP_bucket'));
jest.mock('@/utils/logger', () => {
  const logger = { info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() };
  return { __esModule: true, logger: logger, initializeLogger: jest.fn() };
});

const RESTAURANT_ID = 1;
const modifierGroupToModifierLinkModel = new ModifierGroupToModifierLinkModel();
const modifierPriceOverrideModel = new ModifierPriceOverrideModel();

const createdModifierIDs: number[] = [];
const createdModifierGroupIDs: number[] = [];

const createModifier = async (name: string, price = 0): Promise<ModifierEntity> => {
  const repository = await ormConnection();
  const modifier = await repository.save(ModifierEntity, new ModifierEntity(name, null, price, null, false, RESTAURANT_ID));
  createdModifierIDs.push(modifier.modifierID);
  return modifier;
};

const createModifierGroup = async (label: string, overrides: Partial<ModifierGroupEntity> = {}): Promise<ModifierGroupEntity> => {
  const repository = await ormConnection();
  const group = new ModifierGroupEntity(label, label, false, RESTAURANT_ID);
  Object.assign(group, overrides);
  const saved = await repository.save(ModifierGroupEntity, group);
  createdModifierGroupIDs.push(saved.modifierGroupID);
  return saved;
};

describe('Modifier schema extensions for Otter (min/max, nesting, price overrides)', () => {
  beforeAll(async () => {
    await getConnection().connect();
    void app;
  });

  afterAll(async () => {
    const repository = await ormConnection();
    if (createdModifierIDs.length > 0) {
      await repository.delete(ModifierPriceOverrideEntity, { modifierID: In(createdModifierIDs) });
      await repository.delete(ModifierGroupToModifierLinkEntity, { modifierID: In(createdModifierIDs) });
    }
    if (createdModifierGroupIDs.length > 0) {
      await repository.delete(ModifierGroupToModifierLinkEntity, { modifierGroupID: In(createdModifierGroupIDs) });
      await repository.delete(ModifierGroupEntity, createdModifierGroupIDs);
    }
    if (createdModifierIDs.length > 0) {
      await repository.delete(ModifierEntity, createdModifierIDs);
    }
    await getConnection().close();
  });

  it('persists an existing-style modifier group with no selection rules set (Checkmate regression)', async () => {
    const group = await createModifierGroup(`Checkmate style ${Date.now()}`);

    expect(group.modifierGroupID).toBeTruthy();
    expect(group.minimumSelections ?? null).toBeNull();
    expect(group.maximumSelections ?? null).toBeNull();
    expect(group.maxPerModifierSelectionQuantity ?? null).toBeNull();
  });

  it('persists and round-trips minimumSelections/maximumSelections/maxPerModifierSelectionQuantity', async () => {
    const group = await createModifierGroup(`Pick your toppings ${Date.now()}`, {
      minimumSelections: 1,
      maximumSelections: 3,
      maxPerModifierSelectionQuantity: 2,
    });

    const repository = await ormConnection();
    const fetched = await repository.findOne(ModifierGroupEntity, { where: { modifierGroupID: group.modifierGroupID } });

    expect(fetched.minimumSelections).toEqual(1);
    expect(fetched.maximumSelections).toEqual(3);
    expect(fetched.maxPerModifierSelectionQuantity).toEqual(2);
  });

  it('nests a modifier group under a parent modifier via modifier_group_to_modifier_link', async () => {
    const parentModifier = await createModifier(`Burger ${Date.now()}`, 999);
    const nestedGroup = await createModifierGroup(`Choose your cheese ${Date.now()}`);

    await modifierGroupToModifierLinkModel.insertModifierGroupToModifierLinks([
      { modifierGroupID: nestedGroup.modifierGroupID, modifierID: parentModifier.modifierID, listOrder: 0 },
    ]);

    const links = await modifierGroupToModifierLinkModel.fetchModifierGroupLinksByModifierID(parentModifier.modifierID);

    expect(links).toHaveLength(1);
    expect(links[0].modifierGroupID).toEqual(nestedGroup.modifierGroupID);
  });

  it('creates and retrieves per-service price overrides for a modifier', async () => {
    const modifier = await createModifier(`Extra cheese ${Date.now()}`, 100);

    await modifierPriceOverrideModel.createModifierPriceOverride(
      new ModifierPriceOverrideEntity(modifier.modifierID, 'otter', 'SERVICE', 'ubereats', 150),
    );

    const overrides = await modifierPriceOverrideModel.fetchModifierPriceOverridesByModifierID(modifier.modifierID);

    expect(overrides).toHaveLength(1);
    expect(overrides[0]).toMatchObject({ externalParty: 'otter', ruleType: 'SERVICE', ruleValue: 'ubereats', price: 150 });
  });
});
