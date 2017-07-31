var Express = require('express');
var Tags = require('../Validator.js').Tags;
var router = Express.Router({caseSensitive: true});
var async = require('async');
var mysql = require('mysql');

router.baseURL = '/Msgs';

router.get('/:msgId', function(req, res) {
	var vld = req.validator;
	var cnn = req.cnn;

	var query = 'select UNIX_TIMESTAMP(whenMade) * 1000 as whenMade,'
	 + ' email, content from Conversation c join Message on' 
	 + ' cnvId = c.id join Person p on prsId = p.id where Message.id = ?';

	async.waterfall([
   function(cb) {
      cnn.chkQry('select * from' 
      	+	' Message where id = ?', req.params.msgId, cb);  
   },
   function(msg, fields, cb) {
      if (vld.check(msg.length, Tags.notFound, null, cb) && 
       vld.checkPrsOK(msg[0].prsId)) {
         cnn.query(query, req.params.msgId, cb);  
      }
   },
   function(msgs, fields, cb) { // Return retrieved messages
      res.json(msgs[0]);
      cb();
   }],
   function(err){
      cnn.release();
   });  
});

module.exports = router;