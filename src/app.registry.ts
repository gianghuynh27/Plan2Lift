class AppRegistry {
  static instance: AppRegistry;
  instances: Map<string, any> = new Map();

  constructor() {
    if (AppRegistry.instance) {
      return AppRegistry.instance;
    }

    this.instances = new Map();
    AppRegistry.instance = this;
  }

  register(name: string, instance: object) {
    if (this.instances.has(name)) {
      throw new Error(`Instance with name "${name}" is already registered.`);
    } else {
      this.instances.set(name, instance);
    }
  }

  get(name: string) {
    if (!this.instances.has(name)) {
      throw new Error(`Instance with name "${name}" is not registered.`);
    } else {
      return this.instances.get(name);
    }
  }

  listRegisteredInstances() {
    return Array.from(this.instances.keys());
  }

  clear() {
    this.instances.clear();
  }

  // callInstanceMethod(name: string, methodName: string, ...args: any[]) {}
}

const appRegistry = new AppRegistry();

export default appRegistry;

/**
 *
 *
 * -> {
 *    'name': CLASS_INSTANCE
 *
 * }
 */
