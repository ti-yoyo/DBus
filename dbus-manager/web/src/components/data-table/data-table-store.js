var React = require('react');

var utils = require('../common/utils');
const {TextCell} = require('../common/table/cells');
const {Table, Column, Cell} = require('fixed-data-table');
var Select = require('../common/select-encode-algorithms');
var Reflux = require('reflux');
var $ = require('jquery');
var utils = require('../common/utils');

var ReactDOM = require('react-dom');

var actions = Reflux.createActions(['initialLoad','dataSourceSelected','search','closeDialog','handleSubmit','openUpdate','pullWhole','pullIncrement','stop',
    'openDialogByKey',
    'openDialogConfigure',
    'saveConfigure',
    'closeConfigure',
    'closeDialogZK',
    'openVersionDifference',
    'readTableVersion',
    'versionChanged',
    'openAddRule',
    'confirmStatusChange']);

var store = Reflux.createStore({
    state: {
        dsOptions: [],
        searchParam:[],
        data: [],
        dialog: {
            show: false,
            content:"",
            identity:"",

            showZK:false,
            contentZK:"",
            identityZK:"",

            showConfigure: false,
            contentConfigure:"",
            identityConfigure:"",
            encodeAlgorithms:[],
            tableInformation:{
                tableId:null,
                tableColumnNames:[]
            }
        },
        id:0,
        tableName:"",
        tableVersion:[],
        versionData:""
    },
    initState: function() {
        return this.state;
    },
    onInitialLoad: function() {
        var self = this;
        $.get(utils.builPath("ds/list"), {}, function(result) {
            if(result.status !== 200) {
                alert("加载数据源失败");
                return;
            }
            var list = [];
            result.data.forEach(function(e) {
                list.push({value:e.id, text: [e.dsType, e.dsName].join("/")});
            });
            self.state.dsOptions = list;
            self.trigger(self.state);
            self.state.searchParam = result.data;
            self.onSearch({});
        });


    },
    onCloseDialog: function() {
        this.state.dialog.show = false;
        this.trigger(this.state);
    },
    onOpenDialogByKey: function(key, obj) {
        var content=String(obj[key]);
        content = content.replace(/\n/gm, "<br/>");
        content = content.replace(/[' ']/gm, "&nbsp;");
        this.state.dialog.show = true;
        this.state.dialog.content = content;
        this.state.dialog.identity = key ;
        this.trigger(this.state);
    },
    onOpenVersionDifference: function(obj, dataTableSelf) {
        var passParam = {
            id: obj.id,
            dsName: obj.dsName,
            schemaName: obj.schemaName,
            tableName: obj.tableName
        };
        dataTableSelf.props.history.pushState({passParam: passParam}, "/data-table/table-version-difference");

    },

    onOpenAddRule: function(obj, tableSelf) {
        var passParam = {
            id: obj.id,
            topic: obj.outputTopic
        };
        tableSelf.props.history.pushState({passParam: passParam}, "/data-table/add-rule");
    },

    onConfirmStatusChange: function (data, currentTarget) {
        var storeSelf = this;
        var param = {
            tableId: data.id
        };
        $.get(utils.builPath("tables/confirmStatusChange"), param, function (result) {
            if (result.status != 200) {
                alert("未能发送确认消息");
                return;
            }
            storeSelf.onSearch({});
        });
    },
    onOpenDialogConfigure: function(obj) {
        var self=this;
        this.state.dialog.contentConfigure = "没有返回数据";
        var param= {
            tableId: obj.id
        };
        $.get(utils.builPath("tables/desensitization"), param, function(result) {
            if(result.status == 200) {
                var desensitizationInformations=result.data;
                $.get(utils.builPath("tables/fetchTableColumns"), param, function(result){
                    if(result.status == 200) {
                        self.state.dialog.tableInformation.tableId=param.tableId;// 在保存的时候会用到

                        var tableColumns = result.data;

                        var names=[];
                        for(var i=0; i<tableColumns.length;i++) {
                            names.push(tableColumns[i].COLUMN_NAME);
                        }
                        self.state.dialog.tableInformation.tableColumnNames=names;// 在保存的时候会用到

                        $.get(utils.builPath("tables/fetchEncodeAlgorithms"), function(result){
                            if(result.status == 200) {
                                self.state.dialog.encodeAlgorithms = self.createEncodeAlgorithmsList(result.data);

                                self.state.dialog.contentConfigure = self.createDesensitizationTableView(desensitizationInformations
                                    ,tableColumns);
                                self.state.dialog.showConfigure = true;
                                self.state.dialog.identityConfigure = obj["tableName"] + " encode configure" ; // 对话框标题
                                self.trigger(self.state);
                            }
                            utils.hideLoading();
                        });
                    }
                    else {
                        utils.hideLoading();
                    }
                });
            }
            else {
                utils.hideLoading();
            }
        });
    },
    createEncodeAlgorithmsList(data) {
        data=JSON.parse(data);
        var list=[{text:'None',value:''}];
        for(var i=0;i<data.length;i++) {
            if(global.isDebug == false) {
                if(data[i] == 'address_normalize') continue;
                if(data[i] == 'yisou_data_clean') continue;
            }
            list.push({text:data[i],value:data[i]});
        }
        return list;
    },
    createDesensitizationTableView(desensitizationInformations, tableColumns) {
        for (var i=0;i<tableColumns.length;i++) {
            tableColumns[i].encode_type='';
            tableColumns[i].encode_param='';
            tableColumns[i].truncate='1';
            for (var j=0;j<desensitizationInformations.length;j++) {
                if(tableColumns[i].COLUMN_NAME == desensitizationInformations[j].fieldName) {
                    tableColumns[i].encode_type=desensitizationInformations[j].encodeType;
                    tableColumns[i].encode_param=desensitizationInformations[j].encodeParam;
                    tableColumns[i].truncate=desensitizationInformations[j].truncate+'';
                }
            }
        }
        for(var i=0;i<tableColumns.length;i++) {
            if(tableColumns[i].IS_PRIMARY == "YES") {
                tableColumns[i].COLUMN_NAME = tableColumns[i].COLUMN_NAME + " PK";
            }
        }

        var rows = [];
        rows.push(<Table
            overflowX={'auto'}
            overflowY={'auto'}
            rowsCount={tableColumns.length}
            rowHeight={30}
            headerHeight={20}
            width={880}
            height={500}>
            <Column
                header={<cell>Column Name</cell>}
                cell={<TextCell data={tableColumns} col="COLUMN_NAME" onDoubleClick={this.onOpenDialogByKey.bind(this,"COLUMN_NAME")}/>}
                width={130}
            />
            <Column
                header={<cell>Type</cell>}
                cell={<TextCell data={tableColumns} col="DATA_TYPE" onDoubleClick={this.onOpenDialogByKey.bind(this,"DATA_TYPE")}/>}
                width={130}
            />
            <Column
                header={<cell>Encode Type</cell>}
                cell={props => (
                    <Select
                    style={{width:"160px"}}
                    className={"desensitization_"+this.state.dialog.tableInformation.tableColumnNames[props.rowIndex]}
                    defaultOpt={tableColumns[props.rowIndex].encode_type}
                    options={this.state.dialog.encodeAlgorithms}
                    />
                )}
                width={160}
            />
            <Column
                header={<cell>Encode Param</cell>}
                cell={props => (
                    <textarea className={"form-control desensitization_"+this.state.dialog.tableInformation.tableColumnNames[props.rowIndex]}  rows="1" cols="48" style={{resize:"none"}}>{tableColumns[props.rowIndex].encode_param}</textarea>
                )}
                width={320}
            />
            <Column
                header={<cell>Trunc</cell>}
                cell={props => (
                    <Select
                    style={{width:"130px"}}
                    className={"desensitization_"+this.state.dialog.tableInformation.tableColumnNames[props.rowIndex]}
                    defaultOpt={tableColumns[props.rowIndex].truncate}
                    options={[{text:"是",value:"1"},{text:"否",value:"0"}]}
                    />
                )}
                width={130}
            />
        </Table>);
        return rows;
    },
    onSaveConfigure: function() {
        utils.showLoading();
        var self=this;
        var param= {
            tableId: self.state.dialog.tableInformation.tableId
        };

        $.get(utils.builPath("tables/desensitization"), param, function(result) {
            if(result.status == 200) {
                var desensitizationInformations=result.data;
                var tableId = self.state.dialog.tableInformation.tableId;
                var names = self.state.dialog.tableInformation.tableColumnNames;
                var param = {};
                var operationCount = 0;
                for(var i=0; i<names.length; i++) {
                    var row=$(".desensitization_"+names[i]);
                    var foundInDesensitizationInformations = false;
                    for(var j=0; j<desensitizationInformations.length; j++) {
                        //分四类讨论
                        if(names[i] == desensitizationInformations[j].fieldName) {
                            foundInDesensitizationInformations = true;
                            //数据库有脱敏信息,弹框中有脱敏信息,执行更新操作
                            if(row[0].value.trim()!='') {
                                var rowParam={
                                    sql_type: 'update',
                                    id: desensitizationInformations[j].id,
                                    encode_type: row[0].value,
                                    encode_param: row[1].value,
                                    truncate: row[2].value,
                                    update_time: (new Date()).valueOf()
                                    };
                                operationCount++;
                                param["operation"+operationCount] = rowParam;
                                break;
                            }
                            //数据库有脱敏信息,弹框中无脱敏信息,执行删除操作
                            else {
                                var rowParam={
                                    sql_type: 'delete',
                                    id: desensitizationInformations[j].id
                                };
                                operationCount++;
                                param["operation"+operationCount] = rowParam;
                                break;
                            }
                        }
                    }
                    //数据库无脱敏信息,弹框中有脱敏信息,执行添加操作
                    if(!foundInDesensitizationInformations && row[0].value.trim()!='') {
                        var rowParam={
                            sql_type: 'insert',
                            table_id: tableId,
                            field_name: names[i],
                            encode_type: row[0].value,
                            encode_param: row[1].value,
                            truncate: row[2].value,
                            update_time: (new Date()).valueOf()
                        };
                        operationCount++;
                        param["operation"+operationCount] = rowParam;
                    }
                    //数据库无脱敏信息,弹框中无脱敏信息,无任何操作
                }
                $.get(utils.builPath("tables/changeDesensitization"), param, function(result) {
                    utils.hideLoading();
                    if(result.status == 200) {
                        alert("配置脱敏信息成功");
                    }
                    else {
                        alert("配置脱敏信息失败");
                    }

                });
            }
        });
    },
    onCloseConfigure: function() {
        this.state.dialog.showConfigure = false;
        this.trigger(this.state);
    },
    onCloseDialogZK:function(){
        this.state.dialog.showZK = false;
        this.trigger(this.state);
    },
    onStop:function(stopParam){
        var self = this;
        $.get(utils.builPath("tables/stop"), stopParam ,function(result) {
            if(result.status !== 200) {
                if(console)
                    console.error(JSON.stringify(result));
                alert("停止失败");
                return;
            }
            self.state.data.list.forEach(function(e){
                if(e.id == stopParam.id){
                    e.status = "abort";
                }
            });
            self.trigger(self.state);
            //self.onSearch({});

        });

    },
    onHandleSubmit:function(formdata){
        var self = this;
        formdata.id =  self.state.id;
        $.get(utils.builPath("tables/updateTable"), formdata, function(result) {
            if(result.status !== 200) {
                alert("修改table失败");
                return;
            }
            self.trigger(self.state);
        });
    },
    onOpenUpdate:function(updateParam){
        var self = this;
        self.state.id = updateParam.id;
        self.state.tableName = updateParam.tableName;
    },
    onPullWhole:function(pullParam){
        var self = this;
        $.get(utils.builPath("tables/pullWhole"), pullParam, function(result) {
            if(result.status !== 200) {
                alert("发起拉全量请求失败");
                return;
            }
            self.trigger(self.state);
            alert("发起拉全量请求成功");
            //self.onSearch({});
        });

    },
    onPullIncrement:function(pullParam){
        var self = this;
        $.get(utils.builPath("tables/pullIncrement"), pullParam, function(result) {
            if(result.status !== 200) {
                alert("发起拉增量请求失败");
                return;
            }
            self.state.data.list.forEach(function(e){
                if(e.id == pullParam.id){
                    e.status = "ok";
                }
            });
            self.trigger(self.state);
            alert("发起拉增量请求成功");
            //self.onSearch({});
        });

    },
    //监听所有的actions
    listenables: [actions],
    onReadTableVersion: function(versionParam) {
        var self = this;
        //self.trigger(self.state);
        $.get(utils.builPath("tables/readTableVersion"), versionParam, function(result) {
            if(result.status !== 200) {
                alert("zk节点不存在！");
                return;
            }
            var list = [];
            result.data.forEach(function(e) {
                list.push({value:e, text:e});
            });
            self.state.tableVersion = list;
            self.state.dialog.identityZK = "/DBus/FullPuller/" + versionParam.dsName + "/" + versionParam.schemaName + "/" + versionParam.tableName;
            self.state.dialog.showZK = true;
            self.trigger(self.state);
        });
    },
    onVersionChanged:function(dataParam,obj){
        var self = this;
         $.get(utils.builPath("tables/readVersionData"), dataParam, function(result) {
            if(result.status !== 200) {
                alert("读取zk节点失败");
                return;
            }
            self.state.versionData = result.data;
            self.trigger(self.state);
            ReactDOM.findDOMNode(obj.refs.zkResult).value = self.state.versionData;
        });
    },
    onSearch: function(p){
        var self = this;
        //console.log("p: " + JSON.stringify(p));
        var param = {
            dsID: p.dsID,
            schemaName: p.schemaName,
            tableName: p.tableName,
            pageSize:20,
            pageNum: p.pageNum
        };
        $.get(utils.builPath("tables/search"), param, function(result) {
            if(result.status !== 200) {
                if(console)
                    console.error(JSON.stringify(result));
                alert("Load Table failed!");
                return;
            }
            //console.log("result.data: " + JSON.stringify(result.data));
            //if(console.log("onsearch method called"));
            result.data.list.forEach(function(e) {
                var flag = false;
                if(e.tableName == e.physicalTableRegex)
                {
                    flag = true;
                }
                var namespace = '';
                if(flag)
                {
                    namespace = e.dsType + "." + e.dsName + "." + e.schemaName + "." + e.tableName +
                        "." + e.version + "." + "0" + "." + "0";
                }
                else
                {
                    namespace = e.dsType + "." + e.dsName + "." + e.schemaName + "." + e.tableName +
                        "." + e.version + "." + "0" + "." + e.physicalTableRegex;
                }
                e["namespace"] = namespace;
                if (e.verChangeNoticeFlg == 1 && e.status == "ok") e.showStatusHyperlink = true;
                else e.showStatusHyperlink = false;
            });

            self.state.data = result.data;
            self.trigger(self.state);
            utils.hideLoading();
        });
    }
});

store.actions = actions;
module.exports = store;
