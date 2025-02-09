const express = require('express');
const router =express.Router();
const yieldCtrl = require('../controllers/yield.contronller');

/*---Token Balance--*/
router.route('/info').get(yieldCtrl.yield_info)

module.exports = router