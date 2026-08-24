const noop = () => {
  return function (target: any, propertyKey: string, descriptor?: PropertyDescriptor) {
    // No operation for the mock
  };
};

module.exports = {
  getRepository: () => jest.fn(),
  BaseEntity: class Mock {},
  ObjectType: () => noop,
  Entity: () => noop,
  InputType: noop,
  Index: () => noop,
  PrimaryColumn: () => noop,
  PrimaryGeneratedColumn: () => noop,
  Column: () => noop,
  JoinColumn: () => noop,
  CreateDateColumn: () => noop,
  UpdateDateColumn: () => noop,
  OneToMany: () => noop,
  ManyToOne: () => noop,
  EntityRepository: () => noop,
  getConnection: jest.fn(),
  getCustomRepository: jest.fn(),
  OneToOne: () => noop,
  ManyToMany: () => noop,
  ILike: () => noop,
  In: () => noop,
  IsNull: () => noop,
  Not: () => noop,
};
