var express = require('express');
var router = express.Router();
var AV = require('leanengine');

// `AV.Object.extend` 方法一定要放在全局变量，否则会造成堆栈溢出。
// 详见： https://leancloud.cn/docs/js_guide.html#对象
var Todo = AV.Object.extend('Todo');
var Org =  AV.Object.extend('Organization');
var Company = AV.Object.extend('Company');
var jsonStr = '';
var objString = 'objectId';


function queryInfo(id) {
  var query = new AV.Query(Org);
  query.equalTo('upperId', id);
  query.find().then(function (orgs) {
    if(orgs.length > 0){
      orgs.forEach(function (org,index) {
        // console.log('upperId:' + upperId  + '   ' + org.get('name') + '   curId:' + org.get('Id'));
        jsonStr += '{';
        jsonStr += ' "id": ' + org.get('Id') + ',';
        jsonStr += ' "text": ' + '"' + org.get('name') + '",';
        queryInfo(org.get('Id'));
        jsonStr += '},';
      });
    }
  });
}


function delOrgNode(upperId) {
  var query = new AV.Query(Org);
  query.equalTo('upperId', upperId);
  query.find().then(function (orgs) {
    if(orgs.length > 0){
      orgs.forEach(function (org) {
        console.log('upperId:' + upperId  + ' name:' + org.get('name') + '   curId:' + org.get(objString));
        delOrgNode(org.get(objString));
      });
    }
  });
  delOrg(upperId);
}

function  delOrg(id) {
  var org = AV.Object.createWithoutData('Organization', id);
  org.destroy().then(function (success) {
    // 删除成功
    console.log('delsuccess:' + id);
  }, function (error) {
    // 删除失败
    console.error('delete org Failed: ' +  id + ' errmsg:' + error.message);
  });
}

function queryOrgSingleInfo(upperId) {
  jsonStr += '[';
  var query = new AV.Query(Org);
  query.equalTo('upperId', upperId);
  query.find().then(function (orgs) {
    if(orgs.length > 0){
      orgs.forEach(function (org,index) {
        // console.log('upperId:' + upperId  + '   ' + org.get('name') + '   curId:' + org.get('Id'));
        jsonStr += '{';
        jsonStr += ' "id": ' + org.get('Id') + ',';
        jsonStr += ' "text": ' + '"' + org.get('name') + '",';
        jsonStr += '}';
        if(index < orgs.length - 1){
          jsonStr += ',';
        }
      });
    }
  });
  jsonStr += ']';
  console.log('jsonstr:' + jsonStr);
  return jsonStr;
}

function addOrgExtInfo(org) {
  org.set('text',org.get('name'));
  org.set('ajaxed',false);
  org.set('id',org.get(objString));
}

router.get('/delorg', function(req, res) {
  var orgid = req.query.orgid;
  var msg = ' delorgid:' + orgid;
  console.log(msg);
  delOrgNode(orgid);
  res.end("delete operation run");
});

router.get('/addorg', function(req, res) {
  var name = req.query.name;
  var uppername = req.query.uppername;
  var orgid = req.query.orgid;
  var orglevel = +req.query.orglevel;
  var cpyId = req.query.cpyid;
  var msg = 'name:' + name + ' cpyid:' + cpyId +  ' upper:' + uppername + ' orgid:' + orgid + ' orglevel:' + orglevel;
  console.log(msg);
  orglevel = orglevel / 2;

  var org = new Org();
  org.set('name', name);
  org.set('upperOrganization', uppername);
  org.set('organizationLevel', orglevel);
  org.set('upperId', orgid);
  org.set('cpyId', cpyId);
  org.save().then(function (todo) {
    // 成功保存之后，执行其他逻辑.
    // console.log('New object created with objectId: ' + todo.id);
    addOrgExtInfo(todo);
    var jsonData = JSON.stringify(todo) ;
    console.log(jsonData);
    res.end(jsonData);
  }, function (error) {
    // 异常处理
    console.error('Failed  message: ' + error.message);
  });
});

router.get('/mdyorg', function(req, res) {
  var newname = req.query.newname;
  var uppername = req.query.uppername;
  var orgid = req.query.orgid;
  var msg = 'name:' + newname + ' upper:' + uppername + ' orgid:' + orgid ;
  console.log(msg);

  if((uppername != null) && (uppername.indexOf('none') == -1)) {//only change upper org
    var query = new AV.Query(Org);
    query.equalTo('name', uppername);
    query.find().then(function (orgs) {
      var strjson;
      if(orgs.length > 0){// use first org
        var org = orgs[0];
        addOrgExtInfo(org);
        strjson = JSON.stringify(org);
        console.log("father:" + strjson);
        //save child org
        var orgUpdate = AV.Object.createWithoutData('Organization', orgid);
        // var org = new Org();
        // org.set(objString, orgid);
        if(newname != null && newname != undefined){
          orgUpdate.set('name',newname);
        }
        orgUpdate.set('upperOrganization',uppername);
        orgUpdate.set('upperId',org.get(objString));
        var orgLevel = org.get('organizationLevel') / 2;
        orgUpdate.set('organizationLevel',orgLevel);
        orgUpdate.save().then(function (todo) {
          var jsonData = JSON.stringify(todo) ;
          console.log("child:" + jsonData);
          res.end(strjson);
        }, function (error) {
          // 异常处理
          console.error('Failed  message: ' + error.message);
          res.end("error");
        });
      }
      else {// can not find uppername org
        strjson = 'cant not find org';
        console.log(strjson);
        res.end(strjson);
      }
    });
  }
  else {
    var org = AV.Object.createWithoutData('Organization', orgid);
    if(newname != null && newname != undefined){
      org.set('name',newname);
      org.save().then(function (todo) {
        // var objId = todo.get(objString);
        var jsonData = JSON.stringify(todo) ;
        console.log("onlychangename:" + jsonData);
        res.end("changeorgsuccess:" + jsonData);
      }, function (error) {
        // 异常处理
        console.error('Failed  message: ' + error.message);
        res.end("error");
      });
    }
  }

});

router.get('/cpy', function(req, res) {
  var id ;
  id = req.query.id;
  // console.log('cpyId:' + id);
  var query = new AV.Query(Company);
  query.equalTo(objString, id);
  query.find().then(function (orgs) {
    console.log('company length:' + orgs.length);
    orgs.forEach(function (org) {
      addOrgExtInfo(org);
    });
    var strjson = JSON.stringify(orgs);
    console.log('orgs:' + strjson);
    res.end(strjson);
  });
});

router.get('/org', function(req, res) {
  var orgId ;
  orgId = req.query.orgId;
  // console.log('queryid:' + orgId);
  var query = new AV.Query(Org);
  query.equalTo('upperId', orgId);
  query.find().then(function (orgs) {
    orgs.forEach(function (org) {
      addOrgExtInfo(org);
    });
    var strjson = JSON.stringify(orgs);
    res.end(strjson);
  });
});

router.get('/json', function(req, res, next) {
  var Org = AV.Object.extend('Organization');
  var query = new AV.Query(Org);
  query.descending('updatedAt');
  query.limit(50);
  query.find().then(function(results) {
    var json = JSON.stringify({
      "content":results[0].get('name'),
      "status":results[0].get('upperOrganization')
    });
    var arrjson = JSON.stringify(results);
    // arrjson = UrlDecode(arrjson,"utf-8");
    // var jsonA = eval('(' + arrjson + ')');　　//utf-8
    res.end(arrjson);
  }, function(err) {
    if (err.code === 101) {
      // 该错误的信息为：{ code: 101, message: 'Class or object doesn\'t exists.' }，说明 Todo 数据表还未创建，所以返回空的 Todo 列表。
      // 具体的错误代码详见：https://leancloud.cn/docs/error_code.html
      res.render('todos', {
        title: 'TODO 列表',
        user: req.currentUser,
        todos: [],
        status: status,
        errMsg: errMsg
      });
    } else {
      throw err;
    }
  }).catch(next);
});

/**
 * 定义路由：获取所有 Todo 列表
 */
router.get('/', function(req, res, next) {
  var status = 0;
  var errMsg = null;
  if (req.query) {
    status = req.query.status || 0;
    errMsg = req.query.errMsg;
  }
  var query = new AV.Query(Todo);
  query.equalTo('status', parseInt(status));
  query.include('author');
  query.descending('updatedAt');
  query.limit(50);
  query.find({sessionToken: req.sessionToken}).then(function(results) {
    // console.log("todo",results);
    // console.log("todo",results.toString());
    res.render('mainpage', {
      title: '管理页面',
      user: req.currentUser,
      results: results,
      status: status,
      errMsg: errMsg
    });
  }, function(err) {
    if (err.code === 101) {
      // 该错误的信息为：{ code: 101, message: 'Class or object doesn\'t exists.' }，说明 Todo 数据表还未创建，所以返回空的 Todo 列表。
      // 具体的错误代码详见：https://leancloud.cn/docs/error_code.html
      res.render('todos', {
        title: 'TODO 列表',
        user: req.currentUser,
        todos: [],
        status: status,
        errMsg: errMsg
      });
    } else {
      throw err;
    }
  }).catch(next);
});

/**
 * 定义路由：创建新的 todo
 */
router.post('/', function(req, res, next) {
  var content = req.body.content;
  var todo = new Todo();
  if (req.currentUser) {
    todo.set('author', req.currentUser);

    // 设置 ACL，可以使该 todo 只允许创建者修改，其他人只读
    // 更多的 ACL 控制详见： https://leancloud.cn/docs/js_guide.html#其他对象的安全
    var acl = new AV.ACL(req.currentUser);
    acl.setPublicReadAccess(true);
    todo.setACL(acl);
  }
  todo.set('content', content);
  todo.set('status', 0);
  todo.save(null, {sessionToken: req.sessionToken}).then(function() {
    res.redirect('/todos');
  }).catch(next);
});

/**
 * 定义路由：删除指定 todo
 */
router.delete('/:id', function(req, res, next) {
  var id = req.params.id;
  var status = req.query.status;
  var todo = AV.Object.createWithoutData('Todo', id);
  todo.destroy({sessionToken: req.sessionToken}).then(function() {
    res.redirect('/todos?status=' + status);
  }, function(err) {
    res.redirect('/todos?status=' + status + '&errMsg=' + err.message);
  }).catch(next);
});

/**
 * 定义路由：标记指定 todo 状态为「完成」
 */
router.post('/:id/done', function(req, res, next) {
  var id = req.params.id;
  var todo = AV.Object.createWithoutData('Todo', id);
  todo.save({status: 1}, {sessionToken: req.sessionToken}).then(function() {
    res.redirect('/todos');
  }, function(err) {
    res.redirect('/todos?errMsg=' + err.message);
  }).catch(next);
});

/**
 * 定义路由：标记指定 todo 状态为「未完成」
 */
router.post('/:id/undone', function(req, res, next) {
  var id = req.params.id;
  var todo = AV.Object.createWithoutData('Todo', id);
  todo.save({status: 1}, {sessionToken: req.sessionToken}).then(function() {
    res.redirect('/todos?status=1');
  }, function(err) {
    res.redirect('/todos?status=1&errMsg=' + err.message);
  }).catch(next);
});

module.exports = router;
