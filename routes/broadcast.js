const router = require('express').Router()
const { query } = require("../database/dbpromises")
const { getMetaNumberDetail } = require('../function')
const validateUser = require("../middlewares/user")
const randomstring = require('randomstring')

// adding campaign 
router.post('/add_new', validateUser, async (req, res) => {
    try {
        const { title, templet, phonebook, scheduleTimestamp, example } = req.body

        if (!title || !templet?.name || !phonebook || !scheduleTimestamp) {
            return res.json({ success: false, msg: "Please enter all details" })
        }

        const { id } = phonebook

        if (!id) {
            return res.json({ msg: "Invalid phonebook provided" })
        }

        const getMetaAPI = await query(`SELECT * FROM meta_api WHERE uid = ?`, [req.decode.uid])

        if (getMetaAPI.length < 1) {
            return res.json({ msg: "We could not find your meta API keys" })
        }

        const getPhonebookContacts = await query(`SELECT * FROM contact where phonebook_id = ? AND uid = ?`, [id, req.decode.uid])

        if (getPhonebookContacts.length < 1) {
            return res.json({ success: false, msg: "The phonebook you have selected does not have any mobile number in it" })
        }

        const getMetaMobileDetails = await getMetaNumberDetail("v18.0", getMetaAPI[0]?.business_phone_number_id, getMetaAPI[0]?.access_token)

        if (getMetaMobileDetails.error) {
            return res.json({ success: false, msg: "Either your meta API are invalid or your access token has been expired" })
        }

        const broadcast_id = randomstring.generate()


        const broadcast_logs = getPhonebookContacts.map((i) => [
            req.decode.uid,
            broadcast_id,
            templet?.name || "NA",
            getMetaMobileDetails?.display_phone_number,
            i?.mobile,
            "PENDING",
            JSON.stringify(example),
            JSON.stringify(i)
        ])

        const getUser = await query(`SELECT * FROM user WHERE uid = ?`, [req.decode.uid])

        await query(`
                INSERT INTO broadcast_log (
                    uid,
                    broadcast_id,
                    templet_name,
                    sender_mobile,
                    send_to,
                    delivery_status,
                    example,
                    contact
                ) VALUES ?`, [broadcast_logs])

        const scheduleDate = scheduleTimestamp ? new Date(scheduleTimestamp) : null;

        await query(`INSERT INTO broadcast (broadcast_id, uid, title, templet, phonebook, status, schedule, timezone) VALUES (
            ?,?,?,?,?,?,?,?
        )`, [
            broadcast_id, req.decode.uid, title, JSON.stringify(templet), JSON.stringify(phonebook), "QUEUE", scheduleDate, getUser[0]?.timezone || "Asia/Kolkata"
        ])

        res.json({ success: true, msg: "Your broadcast has been added" })

    } catch (err) {
        console.log(err)
        res.json({ success: false, msg: "Something went wrong", err })
    }
})

// get all campaign 
router.get('/get_broadcast', validateUser, async (req, res) => {
    try {
        const data = await query(`SELECT * FROM broadcast WHERE uid = ?`, [req.decode.uid])
        res.json({ data, success: true })

    } catch (err) {
        console.log(err)
        res.json({ success: false, msg: "Something went wrong", err })
    }
})

// change campaign status 
router.put('/change_broadcast_status', validateUser, async (req, res) => {
    try {
        const { status, broadcast_id } = req.body;

        if (!status || !broadcast_id) {
            return res.status(400).json({ msg: "Invalid request" });
        }

        const {affectedRows} = await query(`UPDATE broadcast SET status = ? WHERE broadcast_id = ? AND uid = ?`, [status, broadcast_id, req.decode.uid]);

        if (affectedRows === 0) {
            return res.status(404).json({ success: false, msg: "Broadcast not found or you don't have permission" });
        }

        res.json({ success: true, msg: "Campaign status updated" });

    } catch (err) {
        console.log(err);
        res.status(500).json({ success: false, msg: "Something went wrong", err });
    }
});

// Delete a broadcast
router.delete('/del_broadcast', validateUser, async (req, res) => {
    try {
        const { broadcast_id } = req.body;

        // Validate the request body
        if (!broadcast_id) {
            return res.status(400).json({ msg: "Invalid request, broadcast_id is required" });
        }

        // Execute delete queries
        const {affectedRows} = await query(`DELETE FROM broadcast WHERE uid = ? AND broadcast_id = ?`, [req.decode.uid, broadcast_id]);
        const result2 = await query(`DELETE FROM broadcast_log WHERE uid = ? AND broadcast_id = ?`, [req.decode.uid, broadcast_id]);

        // Check if any row was deleted
        if (affectedRows === 0) {
            return res.status(404).json({ success: false, msg: "Broadcast not found" });
        }

        res.json({ success: true, msg: "Broadcast was deleted" });

    } catch (err) {
        console.log(err);
        res.status(500).json({ success: false, msg: "Something went wrong", err });
    }
});



module.exports = router