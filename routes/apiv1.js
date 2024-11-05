const router = require('express').Router()
const { query } = require('../database/dbpromises.js')
const { isValidEmail, getBusinessPhoneNumber, sendAPIMessage } = require('../function.js')
const bcrypt = require('bcrypt');
const { sign } = require('jsonwebtoken');
const randomstring = require('randomstring');
const validateUser = require('../middlewares/user.js');
const jwt = require('jsonwebtoken')


function decodeToken(token) {
    return new Promise((resolve) => {

        jwt.verify(token, process.env.JWTKEY, async (err, decode) => {

            if (err) {
                return resolve({ success: false, data: {}, message: "Invalid API keys" })
            }

            const getUser = await query(`SELECT * FROM user WHERE uid = ?`, [decode?.uid])

            if (getUser.length < 1) {
                return resolve({ success: false, data: {}, message: "Invalid API keys" })
            }

            
            if (getUser[0]?.api_key !== token) {
                return resolve({ success: false, msg: "Token was expired." })
            }

            else {
                resolve({
                    success: true,
                    data: getUser[0]
                })
            }
        })
    })
}


router.post("/send-message", async (req, res) => {
    try {

        const { token } = req.query
        const { messageObject } = req.body

        if (!token) {
            return res.json({ success: false, message: "API keys not found" })
        }
        
        const checkToken = await decodeToken(token)

        if (!checkToken.success) {
            return res.json({ success: false, message: "Invalid API keys found from" })
        }

        const user = checkToken.data
        
        if (!messageObject) {
            return res.json({
                success: false,
                message: "messageObject key is required as body response."
            })
        }
        
        const getMetaApi = await query(`SELECT * FROM meta_api WHERE uid = ?`, [user?.uid])

        if (getMetaApi.length < 1) {
            return res.json({
                success: false,
                message: "Please provide your META API keys in the profile section"
            })
        }
        const waToken = getMetaApi[0]?.access_token
        const waNumId = getMetaApi[0]?.business_phone_number_id

        if (!waToken || !waNumId) {
            return res.json({
                success: false,
                message: "Please provide your META API keys in the profile section"
            })
        }
        const sendMsg = await sendAPIMessage(messageObject, waNumId, waToken)
        res.json(sendMsg)

    } catch (err) {
        console.log(err);
        res.json({ err, success: false, msg: "Something went wrong" });
    }
    })

router.post('/webhook', async(req,res)=>{
    console.log(req.body);
    res.status(200).end();
})


module.exports = router