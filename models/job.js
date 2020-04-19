const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const jobSchema = new Schema({
  title: String,
  description: String,
  price: Number,
  pictures: Array,
  userId: String,
  country: String,
  city: String,
  postalCode: String,
  address: String,
  jobCategoryId: String,
});

module.exports = mongoose.model("Job", jobSchema);
