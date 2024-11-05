const router = require('express').Router()
const { query } = require('../database/dbpromises.js')
const { isValidEmail, getBusinessPhoneNumber } = require('../function.js')
const bcrypt = require('bcrypt');
const { sign } = require('jsonwebtoken');
const randomstring = require('randomstring');
const validateUser = require('../middlewares/user.js');




router.post('/signup', async (req, res) => {
    try {

        const { email, name, password, mobile_with_country_code, acceptPolicy } = req.body


        if (!email || !name || !password || !mobile_with_country_code) {
            return res.json({ msg: "Please fill the details", success: false })
        }

        if (!acceptPolicy) {
            return res.json({ msg: "You did not click on checkbox of Privacy & Terms", success: false })
        }

        if (!isValidEmail(email)) {
            return res.json({ msg: "Please enter a valid email", success: false })
        }

        // check if user already has same email
        const findEx = await query(`SELECT * FROM user WHERE email = ?`, email)
        if (findEx.length > 0) {
            return res.json({ msg: "A user already exist with this email" })
        }

        const haspass = await bcrypt.hash(password, 10)
        const uid = randomstring.generate();

        await query(`INSERT INTO user (name, uid, email, password, mobile_with_country_code) VALUES (?,?,?,?,?)`, [
            name,
            uid,
            email,
            haspass,
            mobile_with_country_code
        ])

        res.json({ msg: "Signup Success", success: true })

    } catch (err) {
        res.json({ success: false, msg: "something went wrong", err })
        console.log(err)
    }
})



router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body

        if (!email || !password) {
            return res.json({ success: false, msg: "Please provide email and password" })
        }

        const userFind = await query(`SELECT * FROM user WHERE email = ?`, [email])
        if (userFind.length < 1) {
            return res.json({ msg: "Invalid credentials" })
        }

        const compare = await bcrypt.compare(password, userFind[0].password)

        if (!compare) {
            return res.json({ msg: "Invalid credentials" })
        } else {
            const token = sign({ uid: userFind[0].uid, role: 'user', password: userFind[0].password, email: userFind[0].email }, process.env.JWTKEY, {})
            res.json({
                success: true, token
            })
        }
    } catch (err) {
        res.json({ success: false, msg: "something went wrong", err })
        console.log(err)
    }
})


router.get('/get_me', validateUser, async (req, res) => {
    try {
        const data = await query(`SELECT * FROM user WHERE uid = ?`, [req.decode.uid])

        // getting phonebook
        const contact = await query(`SELECT * FROM contact WHERE uid = ?`, [req.decode.uid])

        res.json({ data: { ...data[0], contact: contact.length }, success: true })
    } catch (err) {
        res.json({ success: false, msg: "something went wrong", err })
        console.log(err)
    }
})


// update notes 

router.post("/save_note", validateUser,  async (req, res) => {
    try {
        const { chatId, note } = req.body
        await query(`UPDATE chats SET chat_note = ? WHERE chat_id = ?`, [note, chatId])
        res.json({ success: true, msg: "Notes were updated" })

    } catch (err) {
        res.json({ success: false, msg: "something went wrong", err })
        console.log(err)
    }
})



router.get('/generate_api_keys', validateUser, async (req, res) => {
    try {      
        
        const token = sign({ uid: req.decode.uid, role: 'user' }, process.env.JWTKEY, {})

        // saving keys to user 
        await query(`UPDATE user SET api_key = ? WHERE uid = ?`, [token, req.decode.uid])

        res.json({ success: true, token, msg: "New keys has been generated" })

    } catch (err) {
        console.log(err)
        res.json({ msg: "Something went wrong", err, success: false })
    }
})



router.post('/update_meta', validateUser, async (req, res) => {
    try {
        const { waba_id, business_account_id, access_token, business_phone_number_id, app_id } = req.body

        if (!waba_id || !business_account_id || !access_token || !business_account_id || !app_id) {
            return res.json({ success: false, msg: "Please fill all the fields" })
        }

        const resp = await getBusinessPhoneNumber("v18.0", business_phone_number_id, access_token)

        if (resp?.error) {
            return res.json({ success: false, msg: resp?.error?.message || "Please check your details" })
        }

        const findOne = await query(`SELECT * FROM meta_api WHERE uid = ?`, [req.decode.uid])
        
        if (findOne.length > 0) {
            await query(`UPDATE meta_api SET waba_id = ?, business_account_id = ?, access_token = ?, business_phone_number_id = ?, app_id = ? WHERE uid = ?`, [
                waba_id, business_account_id, access_token, business_phone_number_id, app_id, req.decode.uid
            ])
        } else {
            await query(`INSERT INTO meta_api (uid, waba_id, business_account_id, access_token, business_phone_number_id, app_id) VALUES (?,?,?,?,?,?)`, [
                req.decode.uid, waba_id, business_account_id, access_token, business_phone_number_id, app_id
            ])
        }
        
        res.json({ success: true, msg: "Your meta settings were updated successfully!" })

    
    } catch (err) {
        res.json({ success: false, msg: "something went wrong", err })
        console.log(err)
    }
})

                                                                                                                                                     



module.exports = router