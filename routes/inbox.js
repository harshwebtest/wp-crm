const router = require('express').Router()
const { query } = require('../database/dbpromise.js')
const randomstring = require('randomstring')
const bcrypt = require('bcrypt')
const { isValidEmail, getFileExtension, saveJsonToFile, saveWebhookConversation, readJSONFile, sendMetaMsg, mergeArrays, botWebhook, sendMetatemplet, updateMetaTempletInMsg, getUserPlayDays, deleteFileIfExists } = require('../function.js')
const { sign } = require('jsonwebtoken')
const validateUser = require('../middlewares/user.js')
const { getIOInstance } = require('../socket.js');
const { checkPlan } = require('../middlewares/plan.js')




