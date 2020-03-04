const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const messageSchema = new Schema({
  message: String,
  toUserId: String,
  fromUserId: String,
  jobId: String
});

module.exports = mongoose.model("Message", messageSchema);
