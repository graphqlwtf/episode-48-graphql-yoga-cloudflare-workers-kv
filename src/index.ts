import { createServer } from "@graphql-yoga/common";
import cuid from "cuid";

export interface Env {
  TODOS: KVNamespace;
}

const server = createServer<{ cf: { env: Env } }>({
  schema: {
    typeDefs: /* GraphQL */ `
      type Query {
        todos: TodoList
        todo(name: ID!): TodoItem
      }

      type Mutation {
        addTodo(value: String!): TodoItem
        deleteTodo(id: ID!): Boolean
      }

      type TodoList {
        results: [TodoItem]
        cursor: String
      }

      type TodoItem {
        name: String
        value: String
        expiration: Int
      }
    `,
    resolvers: {
      Query: {
        todos: async (_, __, { cf }) => {
          const { keys, cursor } = await cf.env.TODOS.list({
            // limit: 1,
          });

          return {
            results: keys,
            cursor,
          };
        },
        todo: async (_, { name }) => ({
          name,
        }),
      },
      TodoItem: {
        value: async ({ name }: any, _, { cf }) =>
          await cf.env.TODOS.get(name, "text"),
      },
      Mutation: {
        addTodo: async (_, { value }, { cf }) => {
          const name = cuid();

          await cf.env.TODOS.put(name, value);

          return {
            name,
            value,
          };
        },
        deleteTodo: async (_, { id }, { cf }) => {
          await cf.env.TODOS.delete(id);

          return true;
        },
      },
    },
  },
});

const fetch = async (req: Request, env: Env, ctx: ExecutionContext) =>
  await server.handleRequest(req, { cf: { env } });

export default {
  fetch,
};
