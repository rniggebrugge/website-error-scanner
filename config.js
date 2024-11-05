export default {
    check: {
        images:true,
        pdfs:true,
        links:false
    },
    scan: {
        news:true,
        publications:true,
        documents:true,
        background_pages:true
    },
    save_to_db:false,
    send_mail:true,
    max_pages:10000,   // set sufficiently high to cover ALL pages
    attachment: `results-images-pdf-${new Date(Date.now()).toISOString().slice(0, 10)}.csv`
}