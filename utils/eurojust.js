import axios from 'axios'
import * as cheerio from 'cheerio'
import { db } from './db.js'

const TEST = true

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
        } while (nodes.length && !TEST)
    }

    return results
}
const get_all_publications = async () =>{
    const base_url = "https://www.eurojust.europa.eu/publications?page="
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
    } while (nodes.length && !TEST)
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


const get_images = async page => {
    const {page_number, url, title} = page
    console.log(`Page ${page_number}, checking  ${url}`)
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
    const $ = cheerio.load(data)
    let images = [...$("img")]
    images = images.map(img=>new URL($(img).attr('src'), url).href).filter(img=>img&&img!="undefined")
    let index = 0
    if (images.length) {
        do {
            const src = images[index]
            try {
                const response = await axios.get(src, {validateStatus:false})
                const status = response.status
                if (status!=200) {
                    results.push({ url, title,src, status:response.status})
                }
            } catch (error) {
                results.push({ title, url, src, status:`Error: ${error.message}`})
            }
            index++
        } while (index<images.length)
    }
    return results
}

const group_images = results => {
    return results.reduce((acc, image)=>{
        const item = acc.find(d=>d.src==image.src)
        if (item) {
            item.pages.push({title:image.title, url:image.url})
        } else {
            acc.push({pages:[{title:image.title, url:image.url}],src:image.src, status:image.status})
        }
        return acc
    }, [])
}

const create_email_data = results => {
    let html = "<h2>Error report</h2>" 
    let text  = "Error report\n\n" 
    if (results.length){
        html += results.map(result=>`<p style="border-top:1px solid #ccc">${result.pages.map(p=>"<a href="+p.url+"><b>"+p.title+"</b></a>").join("<br>") }</p><p style="padding-left:40px">* ${result.src}<br>* ${result.status}</p>`).join("\n")
        text += results.map(result=>`${result.pages.map(p=>p.title+" ("+p.url+")").join("\n") }  \n\t${result.src}\n\t${result.status}`).join("\n\n")
    } else {
        html += "<p>No problems found.</p>"
        text += "No problems found.\n\n"
    }
    return { html, text }
}

const save_to_db = async results => {
    const collection = await db.collection('errors')
    const date = new Date(Date.now())
    await collection.insertMany(results.map(r=>{ r.date=date; return r }))
}

export { 
    get_all_news_pages, 
    get_all_publications, 
    background_pages,
    get_images, 
    create_email_data, 
    group_images, 
    save_to_db 
}
