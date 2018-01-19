$(function () {
    var testTxt=" <%=results %>";
    var json="<%= results%>";
    $('#dg').datagrid({
        data: json
    });

});