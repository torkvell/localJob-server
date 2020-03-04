const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const jobSchema = new Schema({
  title: String,
  description: String,
  price: Number,
  pictures: String,
  userId: String,
  jobCategoryId: String
});

module.exports = mongoose.model("Job", jobSchema);
