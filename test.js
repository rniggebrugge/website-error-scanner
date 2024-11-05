import { connectToDb, closeDb } from './utils/db.js'
import config from './config.js'
import { 
    save_to_todo
  } from './utils/eurojust.js'

// can work with callback fuction, but equally, why not start with connecting with
// db and await completion
await connectToDb()

await save_to_todo(3)

await closeDb()