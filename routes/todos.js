var express = require('express');
var router = express.Router();
var AV = require('leanengine');

// `AV.Object.extend` 方法一定要放在全局变量，否则会造成堆栈溢出。
// 详见： https://leancloud.cn/docs/js_guide.html#对象
var Todo = AV.Object.extend('Todo');
var Org =  AV.Object.extend('Organization');
var Company = AV.Object.extend('Company');
var jsonStr = '';


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


function queryOrgInfo(upperId) {
  // var GuangDong = AV.Object.createWithoutData(name, objId);

  jsonStr += '"children":[';
  var query = new AV.Query(Org);
  query.equalTo('upperId', upperId);
  query.find().then(function (orgs) {
    if(orgs.length > 0){
      orgs.forEach(function (org,index) {
        // console.log('upperId:' + upperId  + '   ' + org.get('name') + '   curId:' + org.get('Id'));
        jsonStr += '{';
        jsonStr += ' "id": ' + org.get('Id') + ',';
        jsonStr += ' "text": ' + '"' + org.get('name') + '",';
        queryOrgInfo(org.get('Id'));
        jsonStr += '},';
      });
    }
  });
  jsonStr += ']';
  console.log('jsonstr:' + jsonStr);
  return jsonStr;
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


router.get('/cpy', function(req, res) {
  var id ;
  id = req.query.id;
  // console.log('cpyId:' + id);
  var query = new AV.Query(Company);
  query.equalTo('id', +id);
  query.find().then(function (orgs) {
    console.log('company length:' + orgs.length);
    orgs.forEach(function (org) {
      org.set('text',org.get('name'));
      org.set('ajaxed',false);
    });
    var strjson = JSON.stringify(orgs);
    console.log('orgs:' + strjson);
    res.end(strjson);
  });
});

router.get('/org', function(req, res) {
  var orgId ;
  orgId = req.query.id;
  // console.log('queryid:' + orgId);
  var query = new AV.Query(Org);
  query.equalTo('upperId', +orgId);
  query.find().then(function (orgs) {
    orgs.forEach(function (org) {
      org.set('text',org.get('name'));
      org.set('ajaxed',false);
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
    console.log("todo",results);
    console.log("todo",results.toString());
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
