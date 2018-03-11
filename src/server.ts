import express from "express";
import bodyParser from "body-parser";
import { graphqlExpress, graphiqlExpress } from "apollo-server-express";
import fetch from "node-fetch";
import { unique } from "shorthash";
import _ from "lodash";
import { makeExecutableSchema } from "graphql-tools";
import fs from "fs";
import path from "path";
import { create } from "domain";

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

interface Dog {
  id: string;
  breed: string;
  images?: Image[];
  displayImage?: string;
  subbreeds?: string[];
}

interface Image {
  url: string;
  id: string;
}

const createDog = (subbreeds: string[], breed: string): Dog => ({
  breed,
  id: unique(breed),
  subbreeds: subbreeds.length > 0 ? subbreeds : null
});

// Provide resolver functions for your schema fields
const resolvers = {
  Query: {
    dogs: async () => {
      const results = await fetch(`${API}/breeds/list/all`);
      const { message: dogs } = await results.json();

      return _.map(dogs, createDog);
    },
    dog: async (root: Dog, { breed }: { breed: string }) => {
      const results = await fetch(`${API}/breed/${breed}/list`);
      const { message: subbreeds } = await results.json();

      return createDog(subbreeds, breed);
    }
  },
  Dog: {
    displayImage: async ({ breed }: { breed: string }) => {
      const results = await fetch(`${API}/breed/${breed}/images/random`);
      const { message: image } = await results.json();

      return image;
    },
    images: async ({ breed }: { breed: string }) => {
      const results = await fetch(`${API}/breed/${breed}/images`);
      const { message: images }: { message: string[]} = await results.json();
      return images.map(image => ({ url: image, id: unique(image) }));
    }
  }
};

// Required: Export the GraphQL.js schema object as "schema"
const myGraphQLSchema = makeExecutableSchema({
  typeDefs,
  resolvers,
});
const PORT = 3000;

const app = express();

app.use("/graphql", bodyParser.json(), graphqlExpress({ schema: myGraphQLSchema }));
// GraphiQL, a visual editor for queries
app.use("/graphiql", graphiqlExpress({ endpointURL: "/graphql" }));

app.listen(PORT, () => {
  console.log("Go to http://localhost:3000/graphiql to run queries!");
});