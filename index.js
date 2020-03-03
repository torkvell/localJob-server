const express = require("express");
const app = express();
const PORT = process.env.PORT || 4000;
const graphqlHTTP = require("express-graphql");
const schema = require("./schema/schema");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
dotenv.config();

//connect to mlab database
console.log("environment pass ----------------_>", process.env.MONGO_DB_PASS);
mongoose.connect(
  `mongodb+srv://toralf:${process.env.MONGO_DB_PASS}@cluster0-3zp7l.mongodb.net/test?retryWrites=true&w=majority`,
  {
    useNewUrlParser: true,
    useUnifiedTopology: true
  }
);
mongoose.connection.once("open", () => {
  console.log("connected to mongo database");
});

app.use(
  "/graphql",
  graphqlHTTP({
    schema,
    graphiql: true
  })
);

app.listen(PORT, () => {
  const url = `http://localhost:${PORT}`;
  console.log(
    `   GraphQL server started on:\n   ${url}\n\n`,
    `➜ Open ${url}/graphiql to\n   start querying your API.\n\n`,
    `➜ Point your GraphQL client apps to\n   ${url}/graphql\n`,
    " ---------------------------------------\n"
  );
});
