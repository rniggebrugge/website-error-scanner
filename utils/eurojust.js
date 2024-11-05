import fs from 'fs'
import axios from 'axios'
import * as cheerio from 'cheerio'
import { db } from './db.js'
import config from '../config.js'

let processed_cached = []

const delay = ms => {
    return new Promise(resolve => setTimeout(resolve, ms))
}

const get_all_news_pages = async () =>{
    console.log('getting pages')
    const base_url_array = [
        "https://www.eurojust.europa.eu/media-and-events/press-releases-and-news?page=",
        "https://www.eurojust.europa.eu/media-and-events/current-affairs?page=",
        "https://www.eurojust.europa.eu/agenda?page="
    ]
    let results = []

    for (let index=0; index<base_url_array.length;index++){
        const base_url = base_url_array[index]
        let page_number = 0
        let nodes
        do {
            const url = `${base_url}${page_number}`
            console.log(`Scanning ${url}`)
            const { data } = await axios(url)
            const $ = cheerio.load(data)
            nodes = [...$(".content h3 a")]
            nodes = nodes.map(item=>{
                const title = $(item).text().trim()
                let href = $(item).attr('href')
                if (!href.startsWith("http")) {
                    href = new URL (href, url).href
                }
                return { page_number:page_number+1, title, url:href }
        })
            results = results.concat(nodes)
            page_number++
        } while (nodes.length && page_number<config.max_pages)
    }

    return results
}
const get_all_publications = async () =>{
    const base_url = "https://www.eurojust.europa.eu/publications?allpublications=1&page="
    let page_number = 0
    let results = []
    let nodes
    do {
        const url = `${base_url}${page_number}`
        console.log(`Scanning ${url}`)
        const { data } = await axios(url)
        const $ = cheerio.load(data)
        nodes = [...$(".content div.field--name-publication-tag-title h3 a")]
        nodes = nodes.map(item=>{
            const title = $(item).text().trim()
            let href = $(item).attr('href')
            if (!href.startsWith("http")) {
                href = new URL (href, url).href
            }
            return { page_number:page_number+1 , title, url:href }
    })
        results = results.concat(nodes)
        page_number++
    } while (nodes.length && page_number<config.max_pages)
    return results
}
const get_all_documents = async () => {
    const base_url = "https://www.eurojust.europa.eu/public-register?page="
    let page_number = 0
    let results = []
    let nodes
    do {
        const url = `${base_url}${page_number}`
        console.log(`Scanning ${url}`)
        const { data } = await axios(url)
        const $ = cheerio.load(data)
        nodes = [...$(".content div.field--name-node-title h3 a")]
        nodes = nodes.map(item=>{
            const title = $(item).text().trim()
            let href = $(item).attr('href')
            if (!href.startsWith("http")) {
                href = new URL (href, url).href
            }
            return { page_number:page_number+1 , title, url:href }
    })
        results = results.concat(nodes)
        page_number++
    } while (nodes.length && page_number<config.max_pages)
    return results
}

const background_pages = async () =>{
    const url = "https://www.eurojust.europa.eu/"
    let results = []
    let nodes = []
    console.log(`Scanning ${url}`)
    const { data } = await axios(url)
    const $ = cheerio.load(data)
    nodes = [...$("#block-eurojust-main-navigation a")]
    nodes = nodes
        .filter(item=>$(item).attr('href')&&$(item).attr('href')!==undefined)
        .map(item=>{
            const title = $(item).text().trim()
            let href = $(item).attr('href')
            if (!href.startsWith("http")) {
                href = new URL (href, url).href
            }
            return { page_number:"homepage" , title, url:href }
        })
    return nodes
}

const check_page = async page => {
    const { url, title} = page
    let results = []
    let data 

    for (let i=0;i<5;i++){
        try  { 
            const response = await axios(url)
            data = response.data 
            break
        }
        catch {
            // just try again after short delay
            data = null
            delay(1000)
        }
    }
    if (!data) return results

    if (config.check.images) results = results.concat(await check_images(data, url))
    if (config.check.pdfs)   results = results.concat(await check_documents(data, url))
    if (config.check.links)  results = results.concat(await check_other_links(data, url))

    results = results.map(result=>{
        result.title = title 
        return result
    })

    return results
}

const check_images = async (data, url) => {
    const $ = cheerio.load(data)
    let images = [...$("img")]
    images = images.map(img=>new URL($(img).attr('src'), url).href).filter(img=>img&&img!="undefined")
    let results = []

    for (let index=0; index<images.length; index++) {
        const src = images[index]
        if (src in processed_cached) {
            const status = processed_cached[src]
            // results.push({url, src, status})
        } else {
            console.log(`\t-> Checking ${src}`)
            try {
                const response = await axios.head(src, {validateStatus:false})
                const status = response.status
                if (status!=200) {
                    processed_cached[src]=response.status
                    results.push({ url, src, status:response.status, type:"image"})
                }
            } catch (error) {
                processed_cached[src]=`Error: ${error.message}`
                results.push({ url, src, status:`Error: ${error.message}`, type:"image"})
            }
        }
    } 
    return results
}

const check_documents = async (data, url) => {
    const $ = cheerio.load(data)
    let results = []
    let doc_links = [...$("a[href*='.pdf']")]
    let doc_options = [...$("option[value*='.pdf']")]
    doc_links = doc_links.map(doc=>{
        const doc_url  = new URL($(doc).attr('href'), url).href
        return { doc_url, link_text:$(doc).text() }
    })
    doc_options = doc_options.map(doc=>{
        const doc_url = new URL($(doc).attr("value").split("##")[0], url).href
        return { doc_url, link_text:$(doc).text().trim() }
    })

    doc_links = doc_links.concat(doc_options)
    doc_links = doc_links.filter(doc=>doc.doc_url&&doc.doc_url!="undefined")

    for (let index=0; index<doc_links.length; index++) {
        const href = doc_links[index].doc_url
        const link_text = doc_links[index].link_text
        
        if (href in processed_cached) {
            const status = processed_cached[href]
            // results.push({url, src:href, status})
        } else {
            console.log(`\t-> Checking ${href}`)
            try {
                const response = await axios.head(href, {validateStatus:false})
                const status = response.status
                if (status!=200) {
                    processed_cached[href]=response.status
                    results.push({ url, link_text, src:href, status:response.status, type:"pdf"})
                }
            } catch (error) {
                processed_cached[href]=`Error: ${error.message}`
                results.push({ url, link_text, src:href, status:`Error: ${error.message}`, type:"pdf"})
            }
        }
    }
    return results
}

const check_other_links = async (data, url) => {
    const $ = cheerio.load(data)
    let results = []
    let other_links = [...$("#main a[href]:not([href*='.pdf'])")]
    other_links = other_links.map(link=>{
        const link_url  = new URL($(link).attr('href'), url).href
        return { link_url, link_text:$(link).text().trim() }
    })

    other_links = other_links.filter(link=>
        link.link_url&&
        !link.link_url.includes("twitter.com")&&
        !link.link_url.includes("mailto:")&&
        !link.link_url.endsWith("undefined")&&
        link.link_url!=="https://www.eurojust.europa.eu/")

    for (let index=0; index<other_links.length; index++) {
        const href = other_links[index].link_url
        const link_text = other_links[index].link_text
        if (href in processed_cached) {
            const status = processed_cached[href]
            // results.push({url, src:href, status})
        } else {
            console.log(`\t-> Checking ${href}`)
            try {
                const response = await axios.head(href, {validateStatus:false})
                const status = response.status
                if (status!=200) {
                    processed_cached[href]=response.status
                    results.push({ url, link_text, src:href, status:response.status, type:"link"})
                }
            } catch (error) {
                processed_cached[href]=`Error: ${error.message}`
                results.push({ url, link_text, src:href, status:`Error: ${error.message}`, type:"link"})
            }
        }
    }
    return results    
}

const create_attachment = (results, filepath) => {
    let text = "url,title,resource,status,type,link_text\n"
    results.forEach(result=>{
        const title = result.title.replace(/[^\w]+/g,'-')
        let link_text = "" 
        if (result.link_text) {
            link_text = result.link_text.replace(/[^\w]+/g,'-')
        }
        text += `"${result.url}","${title}","${result.src}","${result.status}",${result.type},"${link_text}"\n`
    })
    fs.writeFileSync(filepath, text)
}

const create_email_data = results => {
    const filepath = `./${config.attachment}`
    let html = "<h2>Error report</h2>" 
    let text  = "Error report\n\n" 
    let attachments = []
    if (results.length){
        html += results.map(result=>`<p style="border-top:1px solid #ccc"><a href="${result.url}"><b>${result.title}</b></a></p><p style="padding-left:40px">* ${result.src}<br>* ${result.status}<br>* ${result.type}${result.link_text?"<br>* Link text: "+result.link_text:""}</p>`).join("\n")
        text += results.map(result=>`${result.url} - ${result.title}\n\t${result.src}\n\t${result.status}\n\t${result.type}${result.link_text?"\n\tLink text: "+result.link_text:""}`).join("\n\n")
        create_attachment(results, filepath)
        attachments = [{
            filename: config.attachment,
            path:filepath
        }]
    } else {
        html += "<p>No problems found.</p>"
        text += "No problems found.\n\n"
    }
    return { html, text, attachments }
}

const save_to_db = async results => {
    const collection = await db.collection('errors')
    const date = new Date(Date.now())
    await collection.insertMany(results.map(r=>{ r.date=date; return r }))
}

export { 
    get_all_news_pages, 
    get_all_publications, 
    get_all_documents,
    background_pages,
    check_page,
    create_email_data, 
    save_to_db 
}
