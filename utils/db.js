import { MongoClient } from 'mongodb'
import dotenv from 'dotenv'

let db, client

dotenv.config({ path: '~/shared-env/.env' })

const connectToDb = async() =>{
    client = process.env.MONGO==='remote'
	? new MongoClient(`mongodb+srv://${process.env.MONGO_USERNAME}:${process.env.MONGO_PASSWORD}@cluster0.ad4zowh.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`)
	: new MongoClient('mongodb://127.0.0.1:27017')
    await client.connect()
    db = client.db('eurojust-stats')
    console.log('Mongodb connection established.')
}
const closeDb = async () => {
    if (client) {
        await client.close()
        console.log('Mongdb connection closed.')
    } else {
        console.log('No active connection to Mongodb.')
    }
}




export {
    connectToDb,
    closeDb,
    db
}
