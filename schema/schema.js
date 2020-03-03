const graphql = require("graphql");
const _ = require("lodash");

const {
  GraphQLObjectType,
  GraphQLBoolean,
  GraphQLString,
  GraphQLID,
  GraphQLSchema,
  GraphQLInt,
  GraphQLList
} = graphql;

//dummy data
const users = [
  { id: "1", name: "toralf", email: "toralf.kvelland@test.com" },
  { id: "2", name: "toralf 2", email: "test@test.com" }
];

const UserType = new GraphQLObjectType({
  name: "Users",
  fields: () => ({
    id: { type: GraphQLID },
    name: { type: GraphQLString },
    email: { type: GraphQLString },
    password: { type: GraphQLString },
    company: { type: GraphQLBoolean },
    city: { type: GraphQLString },
    postalCode: { type: GraphQLString },
    address: { type: GraphQLString },
    jobs: {
      type: new GraphQLList(JobType),
      resolve(parent, args) {
        //do query to db here
      }
    },
    messages: {
      type: new GraphQLList(MessageType),
      resolve(parent, args) {
        //do query here
      }
    }
  })
});

const JobType = new GraphQLObjectType({
  name: "Jobs",
  fields: () => ({
    id: { type: GraphQLID },
    title: { type: GraphQLString },
    description: { type: GraphQLString },
    price: { type: GraphQLInt },
    pictures: { type: GraphQLBoolean },
    user_id: { type: GraphQLID },
    category_id: { type: GraphQLID },
    job_category: {
      type: JobCategoryType,
      resolve(parent, args) {
        //do query here
      }
    }
  })
});

const JobCategoryType = new GraphQLObjectType({
  name: "JobCategories",
  fields: () => ({
    id: { type: GraphQLID },
    name: { type: GraphQLString }
  })
});

const MessageType = new GraphQLObjectType({
  name: "Messages",
  fields: () => ({
    id: { type: GraphQLID },
    message: { type: GraphQLString },
    to_user_id: { type: GraphQLID },
    from_user_id: { type: GraphQLID },
    job_id: { type: GraphQLID }
  })
});

const RootQuery = new GraphQLObjectType({
  name: "RootqueryType",
  fields: {
    user: {
      type: UserType,
      args: { id: { type: GraphQLID } },
      resolve(parent, args) {
        return _.find(users, { id: args.id });
        //get a user with a specific id
      }
    },
    job: {
      type: JobType,
      args: { id: { type: GraphQLID } },
      resolve(parent, args) {
        //get a job with a specific id
      }
    },
    jobs: {
      type: GraphQLList(JobType),
      args: { user_id: { type: GraphQLID } },
      resolve(parent, args) {
        //get all jobs for a specific user here
      }
    }
  }
});

module.exports = new GraphQLSchema({
  query: RootQuery
});
