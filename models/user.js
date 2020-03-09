const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const userSchema = new Schema({
  name: String,
  email: String,
  password: String,
  country: String,
  jobless: Boolean
});

module.exports = mongoose.model("User", userSchema);
