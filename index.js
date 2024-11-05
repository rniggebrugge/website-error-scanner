import cron from 'node-cron'
import {send} from './utils/mail.js'
import { connectToDb, closeDb } from './utils/db.js'
import config from './config.js'
import { 
    get_all_news_pages, 
    get_all_publications,
    get_all_documents,
    background_pages,
    check_page,
    create_email_data, 
    save_to_todo,
    save_to_db  } from './utils/eurojust.js'

// can work with callback fuction, but equally, why not start with connecting with
// db and await completion

const main = async () => {

    if (config.save_to_db || config.save_to_todo) await connectToDb()
    let pages = []
    if (config.scan.news)               pages = pages.concat(await get_all_news_pages())
    if (config.scan.publications)       pages = pages.concat(await get_all_publications())
    if (config.scan.background_pages)   pages = pages.concat(await background_pages())
    if (config.scan.documents)          pages = pages.concat(await get_all_documents())
    let all_results = []
    const npages = pages.length

    for (let index=0; index<npages; index++) {
        console.log(`${index}/${npages} - ${pages[index].url}`)
        const results = await check_page(pages[index])
        if(results.length){
            console.log(results)
            all_results = all_results.concat(results)
        }
    } 

    if (config.save_to_db) await save_to_db(all_results)
    if (config.save_to_todo) await save_to_todo(all_results)
    if (config.send_mail) {
        const data = create_email_data(all_results)
        send(data)
    }
    
    if (config.save_to_db || config.save_to_todo) await closeDb()

    console.log('End of main.')
}


if (false) {
    main()
} else {
    cron.schedule("*/2 * * * *", main) // every 2 minutes
}
