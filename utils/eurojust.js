import axios from 'axios'
import * as cheerio from 'cheerio'
import { db } from './db.js'

const get_all_pages = async () =>{
    const base_url = "https://www.eurojust.europa.eu/media-and-events/press-releases-and-news?page="
    let page_number = 0
    let results = []
    let nodes
    do {
        const url = `${base_url}${page_number}`
        console.log(`Scanning ${url}.`)
        const { data } = await axios(url)
        const $ = cheerio.load(data)
        nodes = [...$(".content h3 a")]
        nodes = nodes.map(item=>{
            const title = $(item).text().trim()
            let href = $(item).attr('href')
            if (!href.startsWith("http")) {
                href = new URL (href, url).href
            }
            return { title, url:href }
    })
        results = results.concat(nodes)
        page_number++
    } while (nodes.length)
    return results
}

const get_images = async page => {
    const {url, title} = page
    console.log(`Checking ${url}.`)
    const { data } = await axios(url)
    const $ = cheerio.load(data)
    let images = [...$("img")]
    images = images.map(img=>new URL($(img).attr('src'), url).href).filter(img=>img&&img!="undefined")
    let index = 0
    let results = []
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

export { get_all_pages, get_images, create_email_data, group_images }
