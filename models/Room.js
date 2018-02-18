const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const roomSchema = new Schema(
    {
        name: String,
        desc: String,
        owner: Schema.Types.ObjectId
        //owner: UserSchema

    },
    {
        timestamps:{
            createdAt:"created_at",
            updatedAt:"updated_at"
        }
    }
    );

module.exports = mongoose.model("Room", roomSchema);