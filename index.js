import {send} from './utils/mail.js'
import { connectToDb, closeDb } from './utils/db.js'
import { 
    get_all_news_pages, 
    get_all_publications,
    get_all_documents,
    background_pages,
    check_page,
    create_email_data, 
    save_to_db  } from './utils/eurojust.js'

// can work with callback fuction, but equally, why not start with connecting with
// db and await completion
await connectToDb()

let pages = []
pages = pages.concat(await get_all_news_pages())
pages = pages.concat(await get_all_publications())
pages = pages.concat(await background_pages())
pages = pages.concat(await get_all_documents())

let all_results = []

for (let index=0; index<pages.length; index++) {
    const results = await check_page(pages[index])
    if(results.length){
        console.log(results)
        all_results = all_results.concat(results)
    }
} 

await save_to_db(all_results)
const data = create_email_data(all_results)
send(data)


// close before leaving
await closeDb()

console.log('End of program.')
