import { appContext } from "./bootstrap";

interface ContractContext {
  address: string;
}

type QueryParams = Record<string, Required<{ [key: string]: unknown }>>;
type QueryFunction = (context: ContractContext, params: QueryParams) => void;
type MessageParams = Record<string, unknown>;
type MessageFunction = (
  context: ContractContext,
  params: MessageParams
) => void;
type ContractFunction = MessageFunction | QueryFunction;

interface ContractDefinition {
  messages?: Record<string, MessageFunction>;
  queries?: Record<string, QueryFunction>;
}

interface BaseContract {
  at: string;
}

/**
 * A type helper for defining a contract.
 * @param definition A contract definition
 * @returns A contract definition
 */
export function defineContract(
  definition: ContractDefinition
): ContractDefinition {
  const messagesKeys = Object.keys(definition.messages || {});
  const queriesKeys = Object.keys(definition.queries || {});

  const match = messagesKeys.find(it => queriesKeys.includes(it));
  if (match)
    throw new Error(
      `Could not define contract: name collision for function ${match}`
    );

  return definition;
}

/**
 * Extends `base` contract definition with `extension`.
 * @param base - contract definition to extend
 * @param extension - contract definition to extend from
 * @returns a newly extended contract definition
 */
export function extendContractDefinition(
  base: ContractDefinition,
  extension: ContractDefinition
): ContractDefinition {
  const messages = getContractFunctions(
    base.messages,
    extension.messages
  ) as Record<string, MessageFunction>;
  const queries = getContractFunctions(
    base.queries,
    extension.queries
  ) as Record<string, QueryFunction>;
  return defineContract({
    messages,
    queries
  });
}

function getContractFunctions(
  baseFunctions?: Record<string, ContractFunction>,
  extensionFunctions?: Record<string, ContractFunction>
): Record<string, ContractFunction> {
  const baseKeys = Object.keys(baseFunctions || {});
  const extensionKeys = Object.keys(extensionFunctions || {});

  const result: Record<string, ContractFunction> = {};

  for (const msg of baseKeys) {
    if (extensionKeys.includes(msg)) {
      if (extensionFunctions) {
        result[msg] = extensionFunctions[msg];
      }
    } else {
      if (baseFunctions) {
        result[msg] = baseFunctions[msg];
      }
    }
  }

  return result;
}

/**
 * Creates a contract client.
 * @param at contract address to point to
 * @param definition contract definition
 * @returns a contract client
 */
export function createContractClient<T extends BaseContract>(
  at: string,
  definition: ContractDefinition
): T {
  return {} as T;
}
