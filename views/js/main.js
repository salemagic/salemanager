/**
 * Created by xiaocity on 18/1/20.
 */

function createHttpRequest() {
    var xmlhttp;
    if (window.XMLHttpRequest)
    {// code for IE7+, Firefox, Chrome, Opera, Safari
        xmlhttp=new XMLHttpRequest();
    }
    else
    {// code for IE6, IE5
        xmlhttp=new ActiveXObject("Microsoft.XMLHTTP");
    }
    return xmlhttp;
}

function requestAddOrg(node) {
    var xmlhttp = createHttpRequest();
    xmlhttp.onreadystatechange=function()
    {
        if (xmlhttp.readyState==4 && xmlhttp.status==200)
        {
            var data = xmlhttp.responseText;
            var treeData = '[' + data + ']';
            treeData = JSON.parse(treeData);
            $("#aa").html(xmlhttp.responseText);
            //添加数的节点的子节点数据
            $('#tt').tree('append', {
                parent:node.target,
                data:treeData
            });
            //在treegrid表格后追加一行添加的信息
            var gridData = JSON.parse(data);
            $('#dg').datagrid('appendRow', gridData);
        }
    };
    var newOrgName = formaddneworg.name.value;
    if((newOrgName == null) || (newOrgName == "")){
        alert("请输入组织名称");
    }
    else {
        var orgLevel = node.organizationLevel;
        if (orgLevel == null){//表示是公司直接下属机构
            orgLevel = 10000;
        };
        var cpyId = node.cpyId;
        if(cpyId == null){
            cpyId = node.objectId;
        };
        var orgId = node.objectId;
        var url = "/todos/addorg?" +
            "uppername=" + node.name +
            "&name=" + newOrgName +
            "&orgid=" + orgId +
            "&cpyid=" + cpyId +
            "&orglevel=" + orgLevel;
        xmlhttp.open("GET",url,true);
        xmlhttp.send();

        if(node.children == null){
            cleanDatagrid();
        }
    }
}

function requestDelOrg(node) {
    var xmlhttp = createHttpRequest();
    xmlhttp.onreadystatechange=function()
    {
        if (xmlhttp.readyState==4 && xmlhttp.status==200)
        {
            var data = xmlhttp.responseText;
            // var treeData = '[' + data + ']';
            // treeData = JSON.parse(treeData);
            // $("#aa").html(xmlhttp.responseText);
            // //添加数的节点的子节点数据
            // $('#tt').tree('append', {
            //     parent:node.target,
            //     data:treeData
            // });
            // //在treegrid表格后追加一行添加的信息
            // var gridData = JSON.parse(data);
            // $('#dg').datagrid('appendRow', gridData);
        }
    };
    var newOrgName = formaddneworg.name.value;
    if((newOrgName == null) || (newOrgName == "")){
        alert("请输入组织名称");
    }
    else {
        var orgLevel = node.organizationLevel;
        if (orgLevel == null){//表示是公司直接下属机构
            orgLevel = 10000;
        };
        var cpyId = node.cpyId;
        if(cpyId == null){
            cpyId = node.objectId;
        };
        var orgId = node.objectId;
        var url = "/todos/addorg?" +
            "uppername=" + node.name +
            "&name=" + newOrgName +
            "&orgid=" + orgId +
            "&cpyid=" + cpyId +
            "&orglevel=" + orgLevel;
        xmlhttp.open("GET",url,true);
        xmlhttp.send();

        if(node.children == null){
            cleanDatagrid();
        }
    }
}

function requestModifyOrg(node) {
    var curOrgName = formmdyorg.name.value;
    var upperOrgName = formmdyorg.uppername.value;
    curOrgName = curOrgName.trim();
    upperOrgName = upperOrgName.trim();

    var xmlhttp = createHttpRequest();
    xmlhttp.onreadystatechange=function()
    {
        if (xmlhttp.readyState==4 && xmlhttp.status==200)
        {
            $("#aa").html(xmlhttp.responseText);

            var data = xmlhttp.responseText;

            if(data.indexOf("cant not find org") != -1){
                var msg = "找不到名称叫 " + upperOrgName  +" 的组织";
                alert(msg);
            }
            else {
                var sucIndex = data.indexOf("changeorgsuccess");
                if(sucIndex != -1){ //仅是修改org名称成功
                    var strJson = data.substring(data.indexOf(":") + 1);
                    var dataJson = JSON.parse(strJson);
                    var treeNode = $('#tt').tree('find', dataJson.objectId);
                    treeNode.name = dataJson.name;
                    treeNode.text = dataJson.name;
                    if (treeNode){
                        //update tree node
                        $('#tt').tree('update', {
                            target: treeNode.target,
                            text: treeNode.text
                        });

                        //update treegrid
                        var data = $('#dg').datagrid('getData');
                        if(data){
                            if(data.rows.length > 0){
                                for(var i=0;i<data.rows.length;i++){
                                    var dataRow = data.rows[i];
                                    var resId = dataRow['id'];
                                    if(resId == dataJson.objectId){
                                        $('#dg').datagrid('updateRow', {
                                            index: i,
                                            row: {
                                                "name": dataRow['name']
                                            }
                                        });
                                        break;
                                    }
                                }
                            }
                        }
                    }
                }
                else {//修改org的upper org 成功
                    var treeData = JSON.parse(data);

                    //更新修改节点原父节点的信息
                    var node = $('#tt').tree('getSelected');
                    if(node){
                        node.ajaxed = false;
                        updateTreeOrgInfo(node,true);
                    }

                    //更新修改节点新父节点的信息
                    node = $('#tt').tree('find', treeData.id);
                    if(node){
                        node.ajaxed = false;
                        updateTreeOrgInfo(node,true);
                        $('#tt').tree('select', node.target);
                    }
                }
            }
        }
    }

    if( (curOrgName == null) || (upperOrgName == null) || (curOrgName == "") || (upperOrgName == "")){
        alert('请输入正确的名称或上级');
    }
    else if(curOrgName == node.name &&  upperOrgName == node.upperOrganization){
        // $.toaster('input info no change');
        alert('input info no change');
        return;
    }
    else {
        var newName = curOrgName;
        // if(curOrgName != node.name){
        //     newName = curOrgName;
        // }
        var newUpperName = "none";
        if(upperOrgName != node.upperOrganization){
            newUpperName = upperOrgName;
        }
        var orgId = node.objectId;
        var url = "/todos/mdyorg?" +
            "orgid=" + orgId +
            "&newname=" + newName +
            "&uppername=" + newUpperName;
        xmlhttp.open("GET",url,true);
        xmlhttp.send();
    }
}

$(document).ready(function(){

});

function cleanDatagrid() {
    $('#dg').datagrid('loadData', { total: 0, rows: [] });
}

function updateTreeOrgInfo(node,cleanChildren) {
    var orgId = node.objectId;
    if(node.ajaxed == false){
        $.ajax({
            method : 'get',
            url : '/todos/org?orgId=' + orgId,
            async : false,
            dataType : 'json',
            success : function(data) {
                if( cleanChildren == true) {
                    if ($('#tt').tree('isLeaf', node.target)){
                    }
                    else {//有子节点才做删除操作
                        var children = $('#tt').tree('getChildren', node.target);//子节点（市）
                        if(children.length > 0){
                            children.forEach(function (child) {//
                                $('#tt').tree('remove',child.target);
                            })
                        }
                    }
                }
                $('#tt').tree('append', {
                    parent:node.target,
                    data:data
                });
                //======
                $('#dg').datagrid('loadData', data);
                if(data.length == 0){
                    cleanDatagrid();
                    $('#dg').datagrid('appendRow', node);
                }

                $("#aa").html(JSON.stringify(data));

            },
            error : function() {
                alert('error');
            }
        });
        node.ajaxed = true;
    }
    else {
        if(node.children == null){
            cleanDatagrid();
            $('#dg').datagrid('appendRow', node);
        }
        else {
            $('#dg').datagrid('loadData', node.children);
        }
    }
}

function requestOrgInfo() {
    $("#tt").tree({
        onClick: function (node) {
            $("#aa").html(JSON.stringify(node));
            updateTreeOrgInfo(node,false);
        }
    });
}

function requestCompanyInfo() {
    $.ajax({
        method: 'get',
        url: '/todos/cpy?id=5a60bc6d44d9040067c485a7',
        async: false,
        dataType: 'json',
        success: function (data) {
            $('#tt').tree('loadData', data);

        },
        error: function (err) {
            alert(err);
        }
    });
}

function btnClickLogic() {
    $('#btnAdd').click(function () {
        var node = $('#tt').tree('getSelected');
        if (node) {
            $('#edit-upper-org').val(node.name);
            $('#edit-upper-org').attr("disabled", true);
        }
    });

    $('#btnModify').click(function () {
        var row = $('#dg').datagrid('getSelected');
        if (row) {
            $('#edit-mdy-org-upper').val(row.upperOrganization);
            $('#edit-mdy-org-name').val(row.name);
        }
    });

    $('#btn-add-org-ok').click(function () {
        var node = $('#tt').tree('getSelected');
        if (node) {
            requestAddOrg(node);
        }
        $('#dia-add-new').window('close');
    });

    $('#btn-mdy-org-ok').click(function () {
        var row = $('#dg').datagrid('getSelected');
        if (row) {
            requestModifyOrg(row);
        }
        $('#dia-modify-org').window('close');
    });

    $('#btn-del-org-ok').click(function () {
        var row = $('#dg').datagrid('getSelected');
        if (row) {
            requestDelOrg(row);
        }
        $('#dia-del-org').window('close');
    });

}