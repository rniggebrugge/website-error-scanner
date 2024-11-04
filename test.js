import { connectToDb, closeDb } from './utils/db.js'
import { get_all_publications, get_all_documents, check_page  } from './utils/eurojust.js'

await connectToDb()

let pages = []
pages = pages.concat(await get_all_documents())
pages = pages.concat(await get_all_publications())

for (let index=0; index<pages.length; index++) {
    const results = await check_page(pages[index])
    if(results.length){
        console.log(results)
        // all_results = all_results.concat(results)
    }

}


await closeDb()
