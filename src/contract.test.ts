import { defineContract } from "./contract";

test("`defineContract` should throw an error if any naming collisions", () => {
  expect(() =>
    defineContract({
      messages: {
        count() {
          return {};
        }
      },
      queries: {
        count() {
          return {};
        }
      }
    })
  ).toThrow("Could not define contract: name collision for function count");
});

test("`defineContract` should define a contract if passing a valid definition", () => {
  const definition = defineContract({
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

  const message = Object.keys(definition.messages as object)[0];
  const query = Object.keys(definition.queries as object)[0];
  expect(message).toBe("increment");
  expect(query).toBe("getCount");
});
