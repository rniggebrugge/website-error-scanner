import axios from 'axios'
import express from 'express'
import { background_pages, get_all_news_pages, get_all_publications } from './utils/eurojust.js'

const app = express()

app.use("/", express.static('public'))
app.use(express.json())

app.get('/fetch-pages', async(req, res) => {
    let pages = []
    pages = pages.concat(await background_pages())
    pages = pages.concat(await get_all_news_pages())
    pages = pages.concat(await get_all_publications())
    res.json(pages)      
})

app.get('/fetch-content/:url', async (req, res) => {
    let { url } = req.params
    console.log(`Requesting: ${url}`)
    url = decodeURIComponent(url)
    try {
        const response = await axios.get(url)
        res.send(response.data);
    } catch (error) {
        res.status(500).send(error.message);
    }
})

app.listen(3000, () => {
    console.log('Server is running on port 3000');
});
