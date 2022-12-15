const express = require('express')
const app = express()
const  mongoose  = require('mongoose')
const route = require('./routes/route')

app.use(express.json())
mongoose.set('strictQuery', true)

mongoose.connect('mongodb+srv://kfarzan13:Farzankh13@demodb.dclp2mx.mongodb.net/group9Database?retryWrites=true&w=majority', { useNewUrlParser : true })
.then( () => console.log("MongoDB is connected"))
.catch( (err) => console.log(err.message))

app.use('/', route)

app.listen(3000, function(){
    console.log("Express app is running on port 3000")
})