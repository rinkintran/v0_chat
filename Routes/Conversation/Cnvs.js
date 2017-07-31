var Express = require('express');
var Tags = require('../Validator.js').Tags;
var router = Express.Router({caseSensitive: true});
var async = require('async');

router.baseURL = '/Cnvs';

router.get('/', function(req, res) {
   var vld = req.validator;

   if (req.session && req.query.owner) {
      req.cnn.chkQry('select id, title, ownerId, UNIX_TIMESTAMP(lastMessage)' 
       + ' * 1000 as lastMessage from Conversation where ownerId = ?',
       req.query.owner, function(err, cnvs) {
         if (!err)
            res.json(cnvs);
            req.cnn.release();
         });
      }
   else if (req.session && !req.query.owner) {
      console.log("b");
      req.cnn.chkQry('select id, title, ownerId, UNIX_TIMESTAMP(lastMessage)' + 
       ' * 1000 as lastMessage from Conversation', null,
      function(err, cnvs) {
         if (!err) {
            res.json(cnvs);
         }
         req.cnn.release();
      });
   }
});

router.post('/', function(req, res) {
   var vld = req.validator;
   var body = req.body;
   var cnn = req.cnn;

   async.waterfall([
   function(cb) {
      if (vld.check(req.body.title, Tags.missingField, ["title"], cb) && 
       vld.check(body.title && body.title.length <= 80, Tags.badValue,
       ["title"], cb)) {
         cnn.chkQry('select * from Conversation where title = ?', body.title, cb);
      }
   },
   function(existingCnv, fields, cb) {
      if (vld.check(!existingCnv.length, Tags.dupTitle, null, cb)) {
         body.ownerId = req.session.id;
         cnn.chkQry("insert into Conversation set ?", body, cb);
      }
   },
   function(insRes, fields, cb) {
      res.location(router.baseURL + '/' + insRes.insertId).end();
      cb();
   }],
   function() {
      cnn.release();
   });
});

router.put('/:cnvId', function(req, res) {
   var vld = req.validator;
   var body = req.body;
   var cnn = req.cnn;
   var cnvId = req.params.cnvId;

   async.waterfall([
   function(cb) {
      cnn.chkQry('select * from Conversation where id = ?', cnvId, cb);
   },
   function(cnvs, fields, cb) {
      if (vld.check(cnvs.length, Tags.notFound, null, cb) && 
       vld.checkPrsOK(cnvs[0].ownerId, cb)) {
         cnn.chkQry('select * from Conversation where id <> ? && title = ?',
          [cnvId, body.title], cb);
      }
   },
   function(sameTtl, fields, cb) {
      if (vld.check(!sameTtl.length, Tags.dupTitle, null, cb)) {
         cnn.chkQry("update Conversation set title = ? where id = ?",
          [body.title, cnvId], cb);
      }
   }],
   function(err) {
      if (!err) {
         res.status(200).end();
      }
      req.cnn.release();
   });
});

router.get('/:cnvId', function(req, res) {
   var vld = req.validator;
   var cnvId = req.params.cnvId;
   var cnn = req.cnn;

   async.waterfall([
   function(cb) {
      cnn.chkQry('select * from Conversation where id = ?', cnvId, cb);  
   },
   function(conv, fields, cb) {
      if (vld.check(conv.length, Tags.notFound, null, cb)) {
         cnn.chkQry('select id, title, ownerId, UNIX_TIMESTAMP(lastMessage)' +
          ' * 1000 as lastMessage from Conversation where id = ?', cnvId, cb);  
      }
   },
   function(msgs, fields, cb) { // Return retrieved messages
      res.json(msgs[0]);
      cb();
   }],
   function(err){
      if (!err) {
         res.status(200).end();
      }
      cnn.release();
   }); 
})

router.delete('/:cnvId', function(req, res) {
   var vld = req.validator;
   var cnvId = req.params.cnvId;
   var cnn = req.cnn;

   async.waterfall([
   function(cb) {
      cnn.chkQry('select * from Conversation where id = ?', [cnvId], cb);
   },
   function(cnvs, fields, cb) {
      if (vld.check(cnvs.length, Tags.notFound, null, cb) && 
       vld.checkPrsOK(cnvs[0].ownerId, cb)) {
         cnn.chkQry('delete from Conversation where id = ?', [cnvId], cb);
      }
   }],
   function(err) {
      if (!err) {
         res.status(200).end();
      }

      cnn.release();
   });
});

router.get('/:cnvId/Msgs', function(req, res) {
   var vld = req.validator;
   var cnvId = req.params.cnvId;
   var cnn = req.cnn;
   var params = [cnvId];
   var query = 'select Message.id, UNIX_TIMESTAMP(whenMade) * 1000 as' + 
    ' whenMade, email, content from Conversation c join Message on' + 
    ' cnvId = c.id join Person p on prsId = p.id where c.id = ?';

   // And finally add a limit clause and parameter if indicated.
   if (req.query.dateTime) {
      query += ' AND UNIX_TIMESTAMP(whenMade) * 1000 < ?';
      params.push(parseInt([req.query.dateTime], 10));
   }

   if (req.query.num) {
      query += ' limit ?';
      params.push(parseInt([req.query.num], 10));
   }
   else {
      query += ' order by whenMade, Message.id asc';
   }

   async.waterfall([
   function(cb) {  // Check for existence of conversation
      cnn.chkQry('select * from Conversation where id = ?', [cnvId], cb);
   },
   function(cnvs, fields, cb) { // Get indicated messages 
      if (vld.check(cnvs.length, Tags.notFound, null, cb)) {
         cnn.chkQry(query, params, cb);
      }
   },
   function(msgs, fields, cb) { // Return retrieved messages
      res.json(msgs);
      cb();
   }],
   function(err){
      cnn.release();
   });
});

router.post('/:cnvId/Msgs', function(req, res){
   var maxContentLength = 5000;
   var vld = req.validator;
   var cnn = req.cnn;
   var cnvId = req.params.cnvId;
   var body = req.body;
   var now;

   async.waterfall([
      function(cb) {
         cnn.chkQry('select * from Conversation where id = ?', cnvId, cb);
      },
      function(cnvs, fields, cb) {
         if (vld.hasFields(body, ["content"], cb) && 
          vld.chain(req.body.content.length <= maxContentLength,
          Tags.badValue, ["content"], cb)
          .chain(req.body.content.length, Tags.missingField, ["content"])
          .check(cnvs.length, Tags.notFound, null, cb)) {
            
            cnn.chkQry('insert into Message set ?',
             {cnvId: cnvId, prsId: req.session.id,
             whenMade: now = new Date(), content: req.body.content}, cb);
         }
      },
      function(insRes, fields, cb) {
         res.location(router.baseURL + '/' + insRes.insertId).end();
         cnn.chkQry("update Conversation set lastMessage = ? where id = ?",
           [now, cnvId], cb);
      }],
      function(err) {
         cnn.release();
      });
});

module.exports = router;
