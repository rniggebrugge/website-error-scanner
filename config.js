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
        background_pages:false
    },
    save_to_db:false,
    save_to_todo:true,
    send_mail:true,
    max_pages:1,   // set sufficiently high to cover ALL pages
    attachment: `results-${new Date(Date.now()).toISOString().slice(0, 10)}.csv`
}