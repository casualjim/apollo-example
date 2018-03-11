"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
}
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const body_parser_1 = __importDefault(require("body-parser"));
const apollo_server_express_1 = require("apollo-server-express");
const node_fetch_1 = __importDefault(require("node-fetch"));
const shorthash_1 = require("shorthash");
const lodash_1 = __importDefault(require("lodash"));
const graphql_tools_1 = require("graphql-tools");
const API = "https://dog.ceo/api";
// Construct a schema, using GraphQL schema language
const typeDefs = `
type Query {
  dogs: [Dog]
  dog(breed: String!): Dog
}

# A Dog is the four-legged best friend of man
type Dog {
  id: String!
  breed: String!
  displayImage: String
  images: [Image]
  subbreeds: [String]
}

type Image {
  url: String!
  id: String!
}
`;
const createDog = (subbreeds, breed) => ({
    breed,
    id: shorthash_1.unique(breed),
    subbreeds: subbreeds.length > 0 ? subbreeds : null
});
// Provide resolver functions for your schema fields
const resolvers = {
    Query: {
        dogs: () => __awaiter(this, void 0, void 0, function* () {
            const results = yield node_fetch_1.default(`${API}/breeds/list/all`);
            const { message: dogs } = yield results.json();
            return lodash_1.default.map(dogs, createDog);
        }),
        dog: (root, { breed }) => __awaiter(this, void 0, void 0, function* () {
            const results = yield node_fetch_1.default(`${API}/breed/${breed}/list`);
            const { message: subbreeds } = yield results.json();
            return createDog(subbreeds, breed);
        })
    },
    Dog: {
        displayImage: ({ breed }) => __awaiter(this, void 0, void 0, function* () {
            const results = yield node_fetch_1.default(`${API}/breed/${breed}/images/random`);
            const { message: image } = yield results.json();
            return image;
        }),
        images: ({ breed }) => __awaiter(this, void 0, void 0, function* () {
            const results = yield node_fetch_1.default(`${API}/breed/${breed}/images`);
            const { message: images } = yield results.json();
            return images.map(image => ({ url: image, id: shorthash_1.unique(image) }));
        })
    }
};
// Required: Export the GraphQL.js schema object as "schema"
const myGraphQLSchema = graphql_tools_1.makeExecutableSchema({
    typeDefs,
    resolvers,
});
const PORT = 3000;
const app = express_1.default();
app.use("/graphql", body_parser_1.default.json(), apollo_server_express_1.graphqlExpress({ schema: myGraphQLSchema }));
// GraphiQL, a visual editor for queries
app.use("/graphiql", apollo_server_express_1.graphiqlExpress({ endpointURL: "/graphql" }));
app.listen(PORT, () => {
    console.log("Go to http://localhost:3000/graphiql to run queries!");
});
//# sourceMappingURL=server.js.map