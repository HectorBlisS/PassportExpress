const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const userSchema = new Schema(
    {
        username:String,
        password:String,
        //social login con passport
        facebookID: String,
        displayName: String,
        email: String,
        googleID: String,
        role:{
            type: String,
            enum: ["GUEST", "EDITOR", "ADMIN"],
            default: "GUEST"
        }

    },
    {
        timestamps:{
            createdAt:"created_at",
            updatedAt:"updated_at"
        }
    }
    );

module.exports = mongoose.model("User", userSchema);