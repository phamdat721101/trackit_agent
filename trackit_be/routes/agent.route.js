const express = require('express');
const router =express.Router();
const agentCtrl = require('../controllers/agent.controller');

/*---Token Balance--*/
router.route('/price_prediction').post(agentCtrl.token_predict)
router.route('/chat').post(agentCtrl.chat)

module.exports = router