const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const jobCategorySchema = new Schema({
  name: String
});

module.exports = mongoose.model("JobCategory", jobCategorySchema);
