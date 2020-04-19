const graphql = require("graphql");
const User = require("../models/user");
const Message = require("../models/message");
const JobCategory = require("../models/jobCategory");
const Job = require("../models/job");
const { compare } = require("bcrypt");
const bcrypt = require("bcrypt");
const { toJWT } = require("../auth/jwt");
const { GraphQLUpload } = require("graphql-upload");
const { createWriteStream } = require("fs");
const path = require("path");

const {
  GraphQLObjectType,
  GraphQLBoolean,
  GraphQLString,
  GraphQLID,
  GraphQLSchema,
  GraphQLInt,
  GraphQLList,
  GraphQLNonNull,
} = graphql;

/**---------------->Object Types<---------------- */

const UserType = new GraphQLObjectType({
  name: "User",
  fields: () => ({
    id: { type: GraphQLID },
    name: { type: GraphQLString },
    email: { type: GraphQLString },
    password: { type: GraphQLString },
    country: { type: GraphQLString },
    jobless: { type: GraphQLBoolean },
    token: { type: GraphQLString },
    jobs: {
      type: new GraphQLList(JobType),
      resolve(parent, args) {
        //get all jobs for specific user id
        return Job.find({ userId: parent.id });
      },
    },
    messages: {
      type: new GraphQLList(MessageType),
      resolve(parent, args) {
        //chatThreads has to contain: job title, price and id, user name and id from company, messages with dates
        return Message.find({ toUserId: parent.id });
      },
    },
  }),
});

const JobType = new GraphQLObjectType({
  name: "Job",
  fields: () => ({
    id: { type: GraphQLID },
    title: { type: GraphQLString },
    description: { type: GraphQLString },
    price: { type: GraphQLInt },
    images: { type: GraphQLUpload },
    country: { type: GraphQLString },
    city: { type: GraphQLString },
    postalCode: { type: GraphQLString },
    address: { type: GraphQLString },
    userId: { type: GraphQLString },
    jobCategoryId: { type: GraphQLString },
    jobCategory: {
      type: JobCategoryType,
      resolve(parent, args) {
        //get job category name
        return JobCategory.findById(parent.jobCategoryId);
      },
    },
    imagePaths: { type: GraphQLString },
  }),
});

const JobCategoryType = new GraphQLObjectType({
  name: "JobCategory",
  fields: () => ({
    id: { type: GraphQLID },
    name: { type: GraphQLString },
  }),
});

const MessageType = new GraphQLObjectType({
  name: "Message",
  fields: () => ({
    id: { type: GraphQLID },
    message: { type: GraphQLString },
    toUserId: { type: GraphQLID },
    fromUserId: { type: GraphQLID },
    jobId: { type: GraphQLID },
  }),
});

/**---------------->Query Types<---------------- */

const RootQuery = new GraphQLObjectType({
  name: "RootqueryType",
  fields: {
    user: {
      type: UserType,
      args: { id: { type: GraphQLID } },
      resolve(parent, args) {
        //get a user with a specific id
        return User.findById(args.id);
      },
    },
    job: {
      type: JobType,
      args: { id: { type: GraphQLID } },
      resolve(parent, args) {
        //get a job with a specific id
        return Job.findById(args.id);
      },
    },
    userJobs: {
      type: GraphQLList(JobType),
      args: { userId: { type: GraphQLID } },
      resolve(parent, args) {
        //get all jobs for a specific user here
        return Job.find({ userId: args.userId });
      },
    },
  },
});

/**---------------->Mutation Types<---------------- */

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
        jobless: { type: new GraphQLNonNull(GraphQLBoolean) },
      },
      resolve(parent, args) {
        const saltRounds = 10;
        bcrypt.hash(args.password, saltRounds).then((hashedPassword) => {
          //TODO: Check user input data before insertion to DB
          //country has to match DB country and email has to be unique
          let user = new User({
            name: args.name,
            email: args.email,
            password: hashedPassword,
            country: args.country,
            jobless: args.jobless,
          });
          //save into DB with mongoose
          return user.save();
        });
      },
    },
    login: {
      type: UserType,
      args: {
        email: { type: new GraphQLNonNull(GraphQLString) },
        password: { type: new GraphQLNonNull(GraphQLString) },
      },
      async resolve(parent, args) {
        const user = await User.findOne({ email: args.email });
        if (!user) {
          throw new Error("Could not find user");
        } else {
          const { id, name, email, country, jobless } = user;
          const valid = await compare(args.password, user.password);
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
              token: toJWT({ id: user.id }),
            };
            return userData;
          }
        }
      },
    },
    addJob: {
      type: JobType,
      args: {
        title: { type: new GraphQLNonNull(GraphQLString) },
        description: { type: new GraphQLNonNull(GraphQLString) },
        price: { type: new GraphQLNonNull(GraphQLInt) },
        images: { type: new GraphQLList(GraphQLUpload) },
        country: { type: new GraphQLNonNull(GraphQLString) },
        city: { type: new GraphQLNonNull(GraphQLString) },
        postalCode: { type: new GraphQLNonNull(GraphQLString) },
        address: { type: new GraphQLNonNull(GraphQLString) },
        userId: { type: new GraphQLNonNull(GraphQLString) },
        jobCategoryId: { type: new GraphQLNonNull(GraphQLString) },
        token: { type: new GraphQLNonNull(GraphQLString) },
      },
      async resolve(_, { images, ...args }) {
        // TODO: Implement authorization from user token before saving job to db
        const {
          title,
          description,
          price,
          country,
          city,
          postalCode,
          address,
          userId,
          jobCategoryId,
          token,
        } = args;
        const storeImages = async (image) => {
          const { createReadStream, filename } = await image;
          const newFileName = Date.now() + filename;
          createReadStream().pipe(
            createWriteStream(path.join(__dirname, "../images", newFileName))
          );
          return (
            "/Users/toralf/codaisseur/jobLess/jobLess-server/images/" +
            newFileName
          );
        };

        const getData = async () => {
          return Promise.all(images.map((image) => storeImages(image)));
        };
        const pathNames = await getData();
        //Save to db and return saved job to client
        const job = new Job({
          title,
          description,
          price,
          imagePaths: pathNames.toString(),
          country,
          city,
          postalCode,
          address,
          userId,
          jobCategoryId,
        });
        return job.save().then((res) => {
          //TODO: Get job id from db
          return {
            ...res._doc,
            imagePaths: res.imagePaths.toString(),
            id: Date.now(),
          };
        });
      },
    },
    addMessage: {
      type: MessageType,
      args: {
        message: { type: new GraphQLNonNull(GraphQLString) },
        toUserId: { type: new GraphQLNonNull(GraphQLID) },
        fromUserId: { type: new GraphQLNonNull(GraphQLID) },
        jobId: { type: new GraphQLNonNull(GraphQLID) },
      },
      resolve(parent, args) {
        let message = new Message({
          message: args.message,
          toUserId: args.toUserId,
          fromUserId: args.fromUserId,
          jobId: args.jobId,
        });
        return message.save();
      },
    },
    addJobCategory: {
      type: JobCategoryType,
      args: {
        name: { type: GraphQLString },
      },
      resolve(parent, args) {
        let jobCategory = new JobCategory({
          name: args.name,
        });
        return jobCategory.save();
      },
    },
  },
});

module.exports = new GraphQLSchema({
  query: RootQuery,
  mutation: Mutations,
});
