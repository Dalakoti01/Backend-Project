import mongoose,{Schema} from "mongoose"
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2"

const commentSchema = new Schema(
    {
        content : {
            type : String,
            required : true
        },
        video : {
            type : Schema.Types.ObjectId,
            ref = "Video"
        },
        owner : {
            type : Schema.Types.ObjectId,
            ref : "User"
        }
    },{timestamps : true})

commentSchema.plugin(mongooseAggregatePaginate) // iska kaam h ki ek page pr kitne comment load krne h . Basically kaha se kaha tak    
// dene  h 

export const Comment = mongoose.model("Comment",commentSchema)


                                            