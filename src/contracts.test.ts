import {
  defineContract,
  extendContractDefinition,
  createContractClient,
  ContractContext,
  ContractFunctionParams,
  BaseContract
} from "./contracts";
import { ExecuteResult } from "./index";

describe("defineContract", () => {
  it("should throw an error if any naming collisions", () => {
    const def = {
      messages: {
        getCount() {
          return { count: {} };
        }
      },
      queries: {
        getCount() {
          return { count: {} };
        }
      }
    };

    expect(() => defineContract(def)).toThrow(
      "Could not define contract: name collision for function getCount"
    );
  });

  it("should define a contract if passing a valid definition", () => {
    const def = defineContract({
      messages: {
        increment() {
          return { increment: {} };
        }
      },
      queries: {
        getCount() {
          return { count: {} };
        }
      }
    });

    const [message] = Object.keys(def.messages as object);
    const [query] = Object.keys(def.queries as object);
    expect(message).toBe("increment");
    expect(query).toBe("getCount");
  });
});

describe("extendContractDefinition", () => {
  it("should define functions from both contracts", () => {
    const def1 = defineContract({
      messages: {
        increment() {
          return { increment: {} };
        }
      },
      queries: {
        getCount() {
          return { count: {} };
        }
      }
    });

    const def2 = defineContract({
      messages: {
        decrement() {
          return { decrement: {} };
        }
      },
      queries: {
        getCountFor() {
          return { count_for: {} };
        }
      }
    });

    const def = extendContractDefinition(def1, def2);

    const messages = Object.keys(def.messages as object);
    expect(messages.length).toBe(2);
    expect(messages).toContain("increment");
    expect(messages).toContain("decrement");

    const queries = Object.keys(def.queries as object);
    expect(queries.length).toBe(2);
    expect(queries).toContain("getCount");
    expect(queries).toContain("getCountFor");
  });

  it("should override extension function for base function", () => {
    const def1 = defineContract({
      messages: {
        increment() {
          return { base_increment: {} };
        }
      }
    });

    const def2 = defineContract({
      messages: {
        increment() {
          return { extension_increment: {} };
        }
      }
    });

    const def = extendContractDefinition(def1, def2);

    const messages = Object.keys(def.messages as object);
    expect(messages.length).toBe(1);
    expect(
      Object.keys(
        def.messages?.increment(
          {} as ContractContext,
          {} as ContractFunctionParams
        ) as object
      )
    ).toContain("extension_increment");
  });
});

describe("createContractClient", () => {
  it("should create a contract client", () => {
    interface Contract extends BaseContract {
      increment(): Promise<ExecuteResult>;
      getCount(): Promise<{ count: number }>;
    }

    const def = defineContract({
      messages: {
        increment() {
          return { increment: {} };
        }
      },
      queries: {
        getCount() {
          return { get_count: {} };
        }
      }
    });
    const contractClient = createContractClient<Contract>("address", def);
    expect(contractClient).toBeTruthy();
    expect(contractClient.getCount).toBeTruthy();
    expect(contractClient.increment).toBeTruthy();
  });
});
