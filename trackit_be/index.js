const express = require('express');
const app = express();
const path = require('path');
const cors = require('cors');

const token = require('./routes/token.route')
const yield = require('./routes/yield.route')
const agent = require('./routes/agent.route')

require("dotenv").config();
  
app.use(express.static('public'))
app.use(express.json()) // for parsing application/json
app.use(express.urlencoded({ extended: true }))
app.use(cors({
    origin: '*'
}));

app.use('/v1/token', token)
app.use('/v1/yield', yield)
app.use('/v1/agent', agent)

app.get('/', async (req, res) => {
    res.json({
        code: 0,
        data: "Trackit"
    })
})

app.listen(process.env.PORT || 3001, () =>{
    console.log("Listening at 3001")
});

module.exports = app;