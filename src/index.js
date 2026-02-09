import mongoose from "mongoose";
import { DB_NAME } from "./constants";








/*
import express from "express"
const app = express();
( async () => {
    try {
        await mongoose.connect(`${process.env.MONGODB_URL}/${DB_NAME}`)
        app.on("error", (error) => {        // used a listener by express that is listening if any errors are there due to express
            console.log("ERROR: ",error);
            throw error;
        })

        app.listen(process.env.PORT, () => {
            console.log(`App is listening on port ${process.env.PORT}`);
        })

    } catch (error) {
        console.error("ERROR: ", error);
        throw error;
    }
})()    // used () in the last cuz its a iffy fxn [executes immediately]
*/