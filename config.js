export default {
    check: {
        images:true,
        pdfs:true,
        links:true
    },
    scan: {
        news:true,
        publications:true,
        documents:true,
        background_pages:true
    },
    save_to_db:false,
    save_to_todo:false,
    send_mail:true,
    max_pages:10000,   // set sufficiently high to cover ALL pages
    attachment: `results-all-${new Date(Date.now()).toISOString().slice(0, 10)}.csv`
}
