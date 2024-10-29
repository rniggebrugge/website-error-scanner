import nodemailer from 'nodemailer'
import 'dotenv/config'

const transporter = nodemailer.createTransport({
    service: 'gmail',
    host: 'smpt.gmail.com',
    port: 465,
    secure:true,
    auth: {
          user: process.env.GMAIL_USERNAME,
          pass: process.env.GMAIL_PASSWORD
    }
})

const mailOptions = {
    from: 'remco.niggebrugge@icloud.com',
    to: 'remco.niggebrugge@icloud.com',
    subject: `Error Report: ${new Date(Date.now())}`,
    text:'--empty message--',
    html:'<p>--empty message--</p>'
}

const send = data => {
    const options = { ...mailOptions, ...data}
    transporter.sendMail(options, (error, info) =>{
          if(error){
                console.log(`Error: ${error.message}`)
          } else {
                // return {info:info.response}
          }
    })
}


export { send }
