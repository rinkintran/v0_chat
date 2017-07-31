var Express = require('express');
var Tags = require('../Validator.js').Tags;
var router = Express.Router({caseSensitive: true});
var async = require('async');
var mysql = require('mysql');

router.baseURL = '/Prss';

router.get('/', function(req, res) {
   var email = req.session.isAdmin() && req.query.email || !req.query.email &&
    req.session.email || !req.session.isAdmin() && 
    req.query.email === req.session.email && req.query.email;

   var handler = function(err, prsArr) {
      res.json(prsArr);
      req.cnn.release();
   };

   if (req.session.isAdmin() && !req.query.email) {
      req.cnn.chkQry('select id, email from Person', handler);
   }
   else if (req.query.email && req.session.isAdmin()) {
      req.cnn.chkQry('select id, email from Person where email like'
       + ' concat(?, \'%\')', req.query.email, handler);
   }
   else if (req.session && !req.query.email) {
      req.cnn.chkQry('select id, email from Person where email like' 
       + ' concat(?, \'%\')', req.session.email, handler);
   }
   else if (req.session.email.indexOf(req.query.email) !== -1) {
      req.cnn.chkQry('select id, email from Person where email like'
       + ' concat(?, \'%\')', req.query.email, handler);
   }
   else if (req.session.email !== req.query.email) {
      req.cnn.chkQry('select 1 from dual where false', handler);
   }
   else if (email) {
      req.cnn.chkQry('select id, email from Person where email like'
       + ' concat(?, \'%\')', req.query.email, handler);
   }
   else {
      req.cnn.chkQry('select id, email from Person', handler);
   }
});

router.post('/', function(req, res) {
   var vld = req.validator;  // Shorthands
   var body = req.body;
   var admin = req.session && req.session.isAdmin();
   var cnn = req.cnn;

   if (admin && !body.password)
      body.password = "*";
   body.whenRegistered = new Date();

   async.waterfall([
   function(cb) { // Check properties and search for Email duplicates
      if (vld.hasFields(body, ["email", "lastName", "password", "role"], cb) 
       && vld.chain(body.role === 0 || admin, Tags.noPermission)
       .chain(body.password.length, Tags.missingField, ["password"])
       .chain(body.lastName.length, Tags.missingField, ["lastName"])
       .chain(body.email.length, Tags.missingField, ["email"])
       .chain(body.termsAccepted || admin, Tags.noTerms)
       .check(body.role >= 0, Tags.badValue, ["role"], cb)) {

         cnn.chkQry('select * from Person where email = ?', body.email, cb);
      }
   },
   function(existingPrss, fields, cb) {  // If no duplicates, insert new Person
      if (vld.check(!existingPrss.length, Tags.dupEmail, null, cb)) {
         if (body.termsAccepted) {
            body.termsAccepted = body.termsAccepted && new Date() || 
             admin && new Date();
         }
         else {
            body.termsAccepted = null;
         }
         cnn.chkQry('insert into Person set ?', body, cb);
      }
   },
   function(result, fields, cb) { // Return location of inserted Person
      res.location(router.baseURL + '/' + result.insertId).end();
      cb();
   }],
   function() {
      cnn.release();
   });
});




router.get('/:id', function(req, res) {
   var vld = req.validator;

   if (vld.checkPrsOK(req.params.id)) {
      req.cnn.query('select id, firstName, lastName, email, whenRegistered,' +
       ' termsAccepted, role from Person where id = ?', [req.params.id],
      function(err, prsArr) {
         if (vld.check(prsArr.length, Tags.notFound, null))
            res.json(prsArr);
         req.cnn.release();
      });
   }
   else {
      req.cnn.release();
   }
});

router.put('/:id', function(req, res) {
   var vld = req.validator;
   var body = req.body;
   var admin = req.session.isAdmin();
   var requiredFields = ["firstName", "lastName", "password", 
    "oldPassword", "role"]
   var cnn = req.cnn;

   if (Object.keys(body).length === 0) {
      res.status(500).end();
      cnn.release();
   }
   else if (body.hasOwnProperty('id')) {
      res.status(500).end();
      cnn.release();
   }
   else {
      async.waterfall([
      function(cb) {
         if (vld.checkPrsOK(req.params.id, cb) &&
          vld.hasOnlyFields(body, requiredFields) && 
          vld.chain(!body.role || admin, Tags.badValue, ["role"])
          .check(!body.oldPassword || body.password && 
          body.password.length > 0, Tags.badValue, ["password"], cb) && 
          vld.chain(body.oldPassword || body.role || body.firstName ||
          body.lastName || body.password && body.password.length > 0, 
          Tags.badValue, ["password"]).check(body.password === undefined || 
          body.oldPassword || admin, Tags.noOldPwd, null, cb)) {

            cnn.chkQry('select * from Person where id = ?', 
             [req.params.id], cb);
         }
      },
      function(qRes, fields, cb) {
         if (vld.check(body, Tags.missingField, cb) && 
          vld.check(qRes.length, Tags.notFound, null, cb) && 
          vld.check(admin || !body.password || 
          qRes[0].password === body.oldPassword, Tags.oldPwdMismatch, 
          null, cb)) {
            delete body.oldPassword; // takes out the old password field. 
            cnn.chkQry('update Person set ? where id = ?', 
             [body, req.params.id], cb);
         }
      },
      function(updRes, fields, cb) {
         res.status(200).end();
         cb(); //need to deliberately call cb or else it will hang. 
      }],
      function(err) {
         cnn.release();
      });
   }
});


router.delete('/:id', function(req, res) {
   var vld = req.validator;

   
   async.waterfall([
   function(cb) {
      req.cnn.chkQry('select * from Person where id = ?', 
       [req.params.id], cb);
   },
   function(prs, fields, cb) {
      if (vld.checkAdmin(cb) && vld.check(prs.length, Tags.notFound, null, 
       cb)) {
         req.cnn.chkQry('delete from Person where id = ?', [req.params.id], cb)
      }
   }],
   function(err) {
      if (!err) {
         res.status(200).end();
         req.cnn.release();
      }
      else 
         req.cnn.release();
   });
});

module.exports = router;
