const graphql = require("graphql");
const User = require("../models/user");
const Message = require("../models/message");
const JobCategory = require("../models/jobCategory");
const Job = require("../models/job");
const { compare } = require("bcrypt");
const bcrypt = require("bcrypt");
const { toJWT } = require("../auth/jwt");

const {
  GraphQLObjectType,
  GraphQLBoolean,
  GraphQLString,
  GraphQLID,
  GraphQLSchema,
  GraphQLInt,
  GraphQLList,
  GraphQLNonNull
} = graphql;

const UserType = new GraphQLObjectType({
  name: "User",
  fields: () => ({
    id: { type: GraphQLID },
    name: { type: GraphQLString },
    email: { type: GraphQLString },
    password: { type: GraphQLString },
    country: { type: GraphQLString },
    jobless: { type: GraphQLBoolean },
    jobs: {
      type: new GraphQLList(JobType),
      resolve(parent, args) {
        //get all jobs for specific user id
        return Job.find({ userId: parent.id });
      }
    },
    messages: {
      type: new GraphQLList(MessageType),
      resolve(parent, args) {
        //chatThreads has to contain: job title, price and id, user name and id from company, messages with dates
        return Message.find({ toUserId: parent.id });
      }
    }
  })
});

const UserLoginType = new GraphQLObjectType({
  name: "UserLogin",
  fields: () => ({
    id: { type: GraphQLID },
    name: { type: GraphQLString },
    email: { type: GraphQLString },
    country: { type: GraphQLString },
    jobless: { type: GraphQLString },
    token: { type: GraphQLString }
  })
});

const JobType = new GraphQLObjectType({
  name: "Job",
  fields: () => ({
    id: { type: GraphQLID },
    title: { type: GraphQLString },
    description: { type: GraphQLString },
    price: { type: GraphQLInt },
    pictures: { type: GraphQLString },
    country: { type: GraphQLString },
    city: { type: GraphQLString },
    postalCode: { type: GraphQLString },
    address: { type: GraphQLString },
    userId: { type: GraphQLID },
    country: { type: GraphQLString },
    city: { type: GraphQLString },
    postalCode: { type: GraphQLString },
    address: { type: GraphQLString },
    jobCategoryId: { type: GraphQLID },
    jobCategory: {
      type: JobCategoryType,
      resolve(parent, args) {
        //get job category name
        return JobCategory.findById(parent.jobCategoryId);
      }
    }
  })
});

const JobCategoryType = new GraphQLObjectType({
  name: "JobCategory",
  fields: () => ({
    id: { type: GraphQLID },
    name: { type: GraphQLString }
  })
});

const MessageType = new GraphQLObjectType({
  name: "Message",
  fields: () => ({
    id: { type: GraphQLID },
    message: { type: GraphQLString },
    toUserId: { type: GraphQLID },
    fromUserId: { type: GraphQLID },
    jobId: { type: GraphQLID }
  })
});

const RootQuery = new GraphQLObjectType({
  name: "RootqueryType",
  fields: {
    user: {
      type: UserType,
      args: { id: { type: GraphQLID } },
      resolve(parent, args) {
        //get a user with a specific id
        return User.findById(args.id);
      }
    },
    job: {
      type: JobType,
      args: { id: { type: GraphQLID } },
      resolve(parent, args) {
        //get a job with a specific id
        return Job.findById(args.id);
      }
    },
    jobs: {
      type: GraphQLList(JobType),
      args: { userId: { type: GraphQLID } },
      resolve(parent, args) {
        //get all jobs for a specific user here
        return Job.find({ userId: args.userId });
      }
    }
  }
});

const Mutations = new GraphQLObjectType({
  name: "Mutation",
  fields: {
    addUser: {
      type: UserType,
      args: {
        name: { type: new GraphQLNonNull(GraphQLString) },
        email: { type: new GraphQLNonNull(GraphQLString) },
        password: { type: new GraphQLNonNull(GraphQLString) },
        country: { type: new GraphQLNonNull(GraphQLString) },
        jobless: { type: new GraphQLNonNull(GraphQLBoolean) }
      },
      resolve(parent, args) {
        const saltRounds = 10;
        bcrypt.hash(args.password, saltRounds).then(hashedPassword => {
          // Store hash in your password DB.
          console.log(hashedPassword);
          let user = new User({
            name: args.name,
            email: args.email,
            password: hashedPassword,
            country: args.country,
            jobless: args.jobless
          });
          //done by mongoose
          return user.save();
        });
      }
    },
    login: {
      type: UserLoginType,
      args: {
        email: { type: new GraphQLNonNull(GraphQLString) },
        password: { type: new GraphQLNonNull(GraphQLString) }
      },
      async resolve(parent, args) {
        const user = await User.find({ email: args.email });
        if (user.length < 1) {
          throw new Error("Could not find user");
        } else {
          console.log(`server user`, user);
          const { id, name, email, country, jobless } = user[0];
          const valid = await compare(args.password, user[0].password);
          if (!valid) {
            throw new Error("Password invalid");
          } else {
            //login successfull
            const userData = {
              id,
              name,
              email,
              country,
              jobless,
              token: toJWT({ id: user.id })
            };
            console.log(userData);
            return userData;
          }
        }
      }
    },
    addJob: {
      type: JobType,
      args: {
        title: { type: new GraphQLNonNull(GraphQLString) },
        description: { type: new GraphQLNonNull(GraphQLString) },
        price: { type: new GraphQLNonNull(GraphQLInt) },
        pictures: { type: GraphQLString },
        country: { type: new GraphQLNonNull(GraphQLString) },
        city: { type: new GraphQLNonNull(GraphQLString) },
        postalCode: { type: new GraphQLNonNull(GraphQLString) },
        address: { type: new GraphQLNonNull(GraphQLString) },
        userId: { type: new GraphQLNonNull(GraphQLID) },
        jobCategoryId: { type: new GraphQLNonNull(GraphQLID) }
      },
      resolve(parent, args) {
        let job = new Job({
          title: args.title,
          description: args.description,
          price: args.price,
          pictures: args.pictures,
          country: args.country,
          city: args.city,
          postalCode: args.postalCode,
          address: args.address,
          userId: args.userId,
          jobCategoryId: args.jobCategoryId
        });
        return job.save();
      }
    },
    addMessage: {
      type: MessageType,
      args: {
        message: { type: new GraphQLNonNull(GraphQLString) },
        toUserId: { type: new GraphQLNonNull(GraphQLID) },
        fromUserId: { type: new GraphQLNonNull(GraphQLID) },
        jobId: { type: new GraphQLNonNull(GraphQLID) }
      },
      resolve(parent, args) {
        let message = new Message({
          message: args.message,
          toUserId: args.toUserId,
          fromUserId: args.fromUserId,
          jobId: args.jobId
        });
        return message.save();
      }
    },
    addJobCategory: {
      type: JobCategoryType,
      args: {
        name: { type: GraphQLString }
      },
      resolve(parent, args) {
        let jobCategory = new JobCategory({
          name: args.name
        });
        return jobCategory.save();
      }
    }
  }
});

module.exports = new GraphQLSchema({
  query: RootQuery,
  mutation: Mutations
});
