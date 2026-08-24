import { EntityManager } from 'typeorm';
import { MenuUpdateContext } from '@menu-sync/interfaces/menu-sync.interface';

export interface MenuCommand {
  execute(ctx: MenuUpdateContext, manager: EntityManager): Promise<void>;
}
