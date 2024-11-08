import { check_page } from "./utils/eurojust.js"
import readline  from "readline"

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
})

const ask = query => {
    return new Promise( resolve => rl.question(query, resolve))
}

let url = ""
do {
    url = await ask("What url you want to check (type 'exit' to leave)? ")
    url = url.toLowerCase().trim()
    if (url!='exit') {
        const results = await check_page({url}, true)
        if (results.length) {
            console.log(results)
        } else {
            console.log('No issues detected')
        }
    }
} while(url!='exit')


rl.close()
