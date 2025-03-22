import mongoose from 'mongoose';
import dotenv from "dotenv"


dotenv.config()


const mongoDBURL = process.env.MONGODBURL;
if (!mongoDBURL) {
    throw new Error("MONGODBURL is not defined in the environment variables");
}

mongoose.connect(mongoDBURL);

const UserSchema = new mongoose.Schema({
    username: { type: String, required: true },
    password: { type: String, required: true },
    privateKey: { type: String, required: true },
    publicKey: { type: String, required: true }
});

export const userModel = mongoose.model("user", UserSchema);