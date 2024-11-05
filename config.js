export default {
    check: {
        images:true,
        pdfs:false,
        links:false
    },
    scan: {
        news:true,
        publications:false,
        documents:false,
        background_pages:false
    },
    save_to_db:false,
    save_to_todo:false,
    send_mail:true,
    max_pages:1,   // set sufficiently high to cover ALL pages
    attachment: `results-all-${new Date(Date.now()).toISOString().slice(0, 10)}.csv`
}