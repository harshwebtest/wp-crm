const router = require('express').Router()
const { query } = require('../database/dbpromises')
const validateUser = require("../middlewares/user")

router.post('/add', validateUser, async (req, res) => {
    try {
        const { name } = req.body

        if (!name) {
            return res.json({ success: false, msg: "Please enter a phonebook name" })
        }

        // find ext 
        const findExt = await query(`SELECT * FROM phonebook WHERE uid = ? AND name = ?`, [req.decode.uid, name])

        if (findExt.length > 0) {
            return res.json({ success: false, msg: "Duplicate phonebook name found" })
        }

        await query(`INSERT INTO phonebook (name, uid) VALUES (?,?)`, [name, req.decode.uid])
        res.json({ success: true, msg: "Phonebook was addedd" })

    } catch (err) {
        res.json({ success: false, msg: "something went wrong" })
        console.log(err)
    }
})


module.exports = router