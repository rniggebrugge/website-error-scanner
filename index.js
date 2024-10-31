import {send} from './utils/mail.js'
import { connectToDb, closeDb } from './utils/db.js'
import { 
    get_all_news_pages, 
    get_all_publications,
    background_pages,
    get_images, 
    create_email_data, 
    group_images, 
    save_to_db  } from './utils/eurojust.js'

// can work with callback fuction, but equally, why not start with connecting with
// db and await completion
await connectToDb()

let pages = []
pages = pages.concat(await get_all_news_pages())
pages = pages.concat(await get_all_publications())
pages = pages.concat(await background_pages())

let all_results = []
let index = 0

do {
    const results = await get_images(pages[index])
    if(results.length){
        console.log(results)
        all_results = all_results.concat(results)
    }
    index++
} while (index<pages.length)

await save_to_db(all_results)
all_results = group_images(all_results)
const data = create_email_data(all_results)
send(data)


// close before leaving
await closeDb()

console.log('End of program.')
