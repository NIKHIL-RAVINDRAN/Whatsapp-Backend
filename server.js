//importing
import mongoose from 'mongoose'
import express from 'express'
import Messages from './dbMessage.js'
import Pusher from 'pusher'

//app config
const app = express()
const port = process.env.PORT || 9000
const pusher = new Pusher({
    appId: "1502345",
    key: "3775fa1d00b60b0d1d38",
    secret: "4565e90150fc174bba2e",
    cluster: "ap2",
    useTLS: true
});

const db = mongoose.connection

db.once('open', () => {
    console.log('db connected');

    const msgCollection = db.collection('messagecontents');
    const changeStream = msgCollection.watch();

    changeStream.on('change', (change) => {
        console.log(change);

        if (change.operationType === 'insert') {
            const messageDetails = change.fullDocument;
            pusher.trigger('messages', 'inserted',
                {
                    name: messageDetails.name,
                    message: messageDetails.message,
                    timestamp: messageDetails.timestamp,
                    recieved: messageDetails.recieved,
                }
            );
        }
        else {
            console.log('error triggering pusher')
        }
    });
});
//middleware
app.use(express.json());

app.use((req,res,next)=>{
    res.setHeader('Access-Control-Allow-Origin','*');
    res.setHeader('Access-Control-Allow-Headers','*');
    next();
});

//db config
const connection_url = 'mongodb+srv://nikhilr:nikhil0210@cluster0.ef4hlyp.mongodb.net/?retryWrites=true&w=majority'
mongoose.connect(connection_url)


//api routes
app.get('/', (req, res) => res.status(200).send('hello world'));

app.get('/messages/sync', (req, res) => {

    Messages.find((err, data) => {
        if (err) {
            res.status(500).send(err)
        } else {
            res.status(200).send(data)
        }
    })
})




app.post('/messages/new', (req, res) => {
    const dbMessage = req.body

    Messages.create(dbMessage, (err, data) => {
        if (err) {
            res.status(500).send(err)
        } else {
            res.status(201).send(data)
        }
    })
})

//listen
app.listen(port, () => console.log(`listening on localhost:${port}`));