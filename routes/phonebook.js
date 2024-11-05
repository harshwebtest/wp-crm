const router = require('express').Router()
const { query } = require('../database/dbpromises')
const validateUser = require("../middlewares/user")

//add phonebook
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

//get all phonebook records
router.get('/get_by_uid', validateUser, async (req, res) => {
    try {
        const data = await query(`SELECT * FROM phonebook WHERE uid = ?`, [req.decode.uid])
        res.json({ data, success: true })
    } catch (err) {
        res.json({ success: false, msg: "something went wrong" })
        console.log(err)
    }
})

//delete phonebook
router.delete('/del_phonebook', validateUser, async (req, res) => {
    try {
        const { id } = req.body

        await query(`DELETE FROM phonebook WHERE id = ?`, [id])
        await query(`DELETE FROM contact WHERE phonebook_id = ? AND uid = ?`, [id, req.decode.uid])

        res.json({ success: true, msg: "Phonebook was deleted" })

    } catch (err) {
        res.json({ success: false, msg: "something went wrong" })
        console.log(err)
    }
})

// add single contact 
router.post('/add_single_contact', validateUser, async (req, res) => {
    try {
        const { id, phonebook_name, mobile, name, var1, var2, var3, var4, var5 } = req.body

        if (!mobile || !name) {
            return res.json({ success: false, msg: !mobile ? "Mobile number is required" : "Name is required" });
        }


        await query(`INSERT INTO contact (uid, phonebook_id, phonebook_name, name, mobile, var1, var2, var3, var4, var5) VALUES (?,?,?,?,?,?,?,?,?,?)`, [
            req.decode.uid,
            id,
            phonebook_name,
            name,
            mobile,
            var1,
            var2,
            var3,
            var4,
            var5
        ])

        res.json({ success: true, msg: "Contact was inserted" });

    } catch (err) {
        res.json({ success: false, msg: "something went wrong" })
        console.log(err)
    }
})

// get contacts using uid 
router.get('/get_uid_contacts', validateUser, async (req, res) => {
    try {
        const data = await query(`SELECT * FROM contact WHERE uid = ?`, [req.decode.uid])
        res.json({ data, success: true })

    } catch (err) {
        res.json({ success: false, msg: "something went wrong" })
        console.log(err)
    }
})

// delete contacts 
router.delete('/del_contacts', validateUser, async (req, res) => {
    try {
        const { affectedRows } = await query(`DELETE FROM contact WHERE id IN (?)`, [req.body.selected]);

        if (affectedRows === 0) {
            return res.json({ success: false, msg: "No contacts were deleted (ID may not exist)" });
        }

        res.json({ success: true, msg: "Contact(s) were deleted" });

    } catch (err) {
        res.json({ success: false, msg: "Something went wrong" });
        console.error(err);
    }
});



module.exports = router