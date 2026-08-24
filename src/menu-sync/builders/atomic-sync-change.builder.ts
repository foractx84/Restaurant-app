import { ExtendedOperation, IAtomicSyncChange } from '@menu-sync/interfaces/menu-sync.interface';

class AtomicSyncChangeBuilder {
  private change: Partial<IAtomicSyncChange> = {};

  setType(type: ExtendedOperation) {
    this.change.type = type;
    return this;
  }

  setKey(key: string) {
    this.change.key = key;
    return this;
  }

  setPath(path: string) {
    this.change.path = path;
    return this;
  }

  setValueType(valueType: string | null) {
    this.change.valueType = valueType;
    return this;
  }

  setValue(value: any) {
    this.change.value = value;
    return this;
  }

  setOldValue(oldValue: any) {
    this.change.oldValue = oldValue;
    return this;
  }

  build(): IAtomicSyncChange {
    const { type, key, path, valueType } = this.change;
    if (!type || !key || !path || valueType === undefined) {
      throw new Error('Missing required fields');
    }
    return this.change as IAtomicSyncChange;
  }
}

export default AtomicSyncChangeBuilder;
