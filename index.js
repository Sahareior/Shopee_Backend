import express, { Router } from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import dotenv from 'dotenv';
import Connection from './database/db.js';
// import routes from './routes/Routes.js';
import users from './routes/Routes.js';
// import

// import Connection from './database/db.js';
// import Routes from './routes/Routes.js';


dotenv.config();
const app = express();

const PORT = 8000;




app.listen(PORT, () => console.log(`Server is running successfully on PORT ${PORT}`));

app.use(bodyParser.json({ extended: true }));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());
Connection()



app.use('/user', users)



app.use('/',(req,res) =>(
    res.json('Server is Running................')
) )