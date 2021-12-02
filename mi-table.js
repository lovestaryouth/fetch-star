let miTableTemplate = `
  <div> 
    <el-table ref="table"
              :data="sliceArray(data)"
              :border="border"
              :stripe="stripe"
              :show-header="showHeader"
              v-loading="appearLoading"
              highlight-current-row
              :row-key="rowKey"
              @row-click="handleTableRowClick"
              @selection-change="handleTableSelectionChange"
              @sort-change="handleTableSortChange"
              element-loading-spinner="el-icon-loading" 
              :element-loading-text="loadingTips"
              :header-cell-style="headerCellStyle"
              :cell-style="rowCellStyle"
              :style="defaultStyle">
              
      <el-table-column v-if="isTrue(showSelect)" :reserve-selection="rememberChecked" type="selection" width="55" />
              
      <el-table-column v-if="isTrue(showIndex)" :label="indexName" :index="indexFormat" type="index" width="55" />
      
      <template v-for="(col, index) in columns">
        <el-table-column v-if="isTrue(col.hasOwnProperty('show') 
                                      ? formatPropResult(col.show) 
                                      : true)"
                         :fixed="col.fixed"
                         :prop="col.param"
                         :label="formatPropResult(col.label)"
                         :key="index"
                         :type="col.type"
                         :align="col.align || 'left'"   
                         :header-align="col.headAlign || col.align || 'left'"
                         :sortable="realSortable(col.sortable)"
                         :sort-orders="isTrue(col.sortable) ? sortOrders : []"
                         :show-overflow-tooltip="isTrue(col.tooltip)"
                         :width="col.maxWidth"
                         :min-width="realWidth(col)">
                         
          <template v-if="col.subList" v-for="(subCol, subIndex) in col.subList">
            <el-table-column v-if="isTrue(subCol.hasOwnProperty('show') ? subCol.show : true)"
                             :fixed="subCol.fixed"
                             :prop="subCol.param"
                             :label="subCol.label"
                             :key="subIndex"
                             :sortable="realSortable(subCol.sortable)"
                             :sort-orders="isTrue(subCol.sortable) ? sortOrders : []"
                             :min-width="subCol.width"
                             show-overflow-tooltip>     
                            
              <template slot-scope="scope">
                <span v-if="subCol.render">{{subCol.render(scope.row, params.obj || params)}}</span>
                <slot v-else-if="isTrue(subCol.slot)" :name="lowerColumnParam(subCol.param, '_')" :scope="scope"></slot>
                <span v-else>{{touchMapVal(scope.row, subCol.param)}}</span>
              </template>                   
              
            </el-table-column>
          </template>
          
          <template v-if="col.type !== 'expand' && loadSearchFinish" 
                    slot="header" slot-scope="scope">
            <span v-show="isFalse(col.searchable, true) || !searchMode[col.param]" 
                  v-text="formatPropResult(col.label) + formatSearchTips(col)">
            </span>
            <template v-if="isTrue(col.searchable)">
              <div v-if="searchMode[col.param]"
                   @click.stop style="display: inline-flex">
                <el-input v-model="(params.obj || params)[col.param]"
                          :placeholder="'搜索' + formatPropResult(col.label)">
                  <i slot="suffix" @click.stop="refreshTable()" class="el-input__icon el-icon-search"></i>
                </el-input>
              </div>
              <i v-else @click.stop="toggleSearchMode(col.param)"
                 class="el-input__icon el-icon-search">
              </i>
            </template>
          </template>
          
          <template slot-scope="scope">
            <template v-if="col.events">
              <template v-if="isTrue(inlineEditable) && scope.row.editMode">
                <el-button title="保存" @click="toggleEditable(scope.row, scope.$index, scope._self)" class="imgicon confirmbtn"></el-button>
                <el-button title="取消" @click="toggleEditable(scope.row, scope.$index, scope._self, true)" class="imgicon cancelbtn"></el-button>
              </template>
              <el-button v-else
                         v-for="event in col.events"
                         v-show="isTrue(event.hasOwnProperty('show') 
                                      ? formatPropResult(event.show, scope.row) 
                                      : true)"
                         :title="formatPropResult(event.tip, scope.row)"
                         :class="['imgicon', event.icon]"
                         @click="(event.method || defaultBtnMethod[event.icon])(scope.row, scope.$index, scope._self)">
              </elbutton>
            </template>
          
            <template v-else-if="isTrue(inlineEditable) && isTrue(col.editable) && scope.row.editMode">
              <elradio v-if="$.isArray(col.radioData) || $.isFunction(col.radioData)"
                       :title="'选择' + formatPropResult(col.label, scope.row)"
                       :radiodata="formatPropResult(col.radioData, scope.row)"
                       v-model="scope.row[col.param]">
              </elradio>
              <elselect v-else-if="$.isArray(col.selectData) || $.isFunction(col.selectData)"
                        :title="'选择' + formatPropResult(col.label, scope.row)"
                        :group="formatPropResult(col.selectGroup, scope.row)"
                        :multiples="formatPropResult(col.multiple, scope.row)"
                        :selectedata="formatPropResult(col.selectData, scope.row)"
                        v-model="scope.row[col.param]">
              </elselect>
              <mi-split v-else-if="col.splitOption"
                        v-model="scope.row[col.param]"
                        :ref="col.param + '-mi-split-' + scope.$index"
                        :split-option="col.splitOption">
              </mi-split>
              <el-input v-else
                        :placeholder="'请输入' + formatPropResult(col.label, scope.row)"
                        v-model="scope.row[col.param]">
              </el-input>
            </template>
            
            <slot v-else-if="isTrue(col.slot)" :name="lowerColumnParam(col.param, '_')" :scope="scope"></slot>
            <span v-else 
                  :style="formatPropResult(col.style, scope.row)" 
                  v-html="col.render ? col.render(scope.row, params.obj || params) : highlightSearchParam(touchMapVal(scope.row, col.param), col.param)">
            </span>
          </template>
        </el-table-column>
      </template>
    </el-table>
    <el-row v-if="isTrue(inlineEditable) && $.isFunction(addRowMethod)" style="text-align: center;margin-bottom: 0 !important;">
      <el-button title="新增一行" @click="addTableRow()" class="imgicon buildbtn"></el-button>
    </el-row>
    <!-- 分页 -->
    <el-pagination v-if="isTrue(pagination) && total > Math.min.apply(null, pageSizes)" class="block"
                   :current-page="current"
                   :page-size="size"
                   :total="total"
                   :page-sizes="pageSizes"
                   @size-change="handlePageSizeChange"
                   @current-change="handlePageCurrentChange"
                   layout="total, sizes, prev, pager, next, jumper">
    </el-pagination>
  </div>
`;
Vue.component('mi-table', {
    template: miTableTemplate,
    props: {
        columns: {type: Array, required: true},
        data: {type: Array, default: []},
        url: {type: String, default: ''},
        params: {type: Object, default: {}},
        'new-row-params': {type: Object, default: {}},
        'init-table': {type: Boolean, default: true},

        stripe: {type: Boolean, default: true},
        border: {type: Boolean, default: false},
        'row-key': {type: String, default: 'id'},
        'default-checked': {type: Array, default: []},
        'remember-checked': {type: Boolean, default: true},
        'inline-editable': {type: Boolean, default: false},
        'highlight-search': {type: Boolean, default: true},

        pagination: {type: Boolean, default: true},
        'server-pagination': {type: Boolean, default: false},
        'page-sizes': {type: Array, default: [5, 10, 20, 50]},
        current: {type: Number, default: 1},
        size: {type: Number, default: 10},
        total: {type: Number, default: 0},

        'show-header': {type: Boolean, default: true},
        'show-select': {type: Boolean, default: false},
        'single-select': {type: Boolean, default: false},
        'show-index': {type: Boolean, default: false},
        'index-name': {type: String, default: '序号'},
        'show-loading': {type: Boolean, default: true},
        'loading-tips': {type: String, default: '数据正在加载中'}
    },
    data() {
        return {
            defaultStyle: 'width: 100%; font-size: calc(3rem/4); font-family: Microsoft YaHei, serif; color: #666666',
            headerCellStyle: {
                background: '#e7ecee',
                color: '#057aaa',
                fontSize: 'calc(3rem / 4)',
                height: 'calc(45rem / 16)'
            },
            rowCellStyle: {
                fontSize: 'calc(3rem / 4)',
                height: 'calc(40rem / 16)'
            },
            refreshSelect: false,
            appearLoading: false,

            sortMode: {asc: 'ascending', desc: 'descending'},
            sortOrders: [],
            dataFilters: [],
            checkedData: [],
            searchMode: {},
            loadSearchFinish: true,
            defaultBtnMethod: {},
            addRowMethod: null,
            multipleSplitMapData: []
        }
    },
    created() {
        this.defaultBtnMethod = {
            'editbtn': this.toggleEditable,
            'deletebtn': this.removeRow
        }
    },
    mounted() {
    },
    watch: {
        columns: {
            handler(newValue) {
                newValue.forEach(x => {
                    if (x.events) {
                        this.addRowMethod = x.addRowMethod;
                        this.confirmMethod = x.confirmMethod;
                    } else if (x.param) {
                        if (this.isTrue(x.searchable)) {
                            this.searchMode[x.param] = false;
                        }
                        if (this.isTrue(x.sortable)) {
                            this.sortOrders = Object.values(this.sortMode);
                        }
                        if (this.formatPropResult(x.multiple) && x.multipleSplit) {
                            this.multipleSplitMapData.push({
                                field: x.param,
                                split: x.multipleSplit
                            })
                        }
                    }
                });

                if (this.isTrue(this['initTable'])) {
                    this.refreshTable();
                }
            },
            deep: true,
            immediate: true,
        }
    },
    computed: {},
    methods: {
        toggleSearchMode(param) {
            this.refreshSearchHeader(() => this.searchMode[param] = !this.searchMode[param]);
        },
        refreshSearchHeader(method) {
            this.loadSearchFinish = false;
            $.isFunction(method) && method();
            this.$nextTick(() => this.loadSearchFinish = true);
        },
        formatSearchTips(col) {
            let paramVal = (this.params.obj || this.params)[col.param];
            return this.isTrue(col.searchable) && isNotEmptyString(paramVal) ? (' (搜索：' + paramVal + ')') : '';
        },
        touchMapVal(map, key) {
            let splitIndex = key.indexOf('.');
            if (splitIndex === -1) {
                return map[key];
            }

            let nextMap = map[key.substring(0, splitIndex)];
            return nextMap ? this.touchMapVal(nextMap, key.substring(splitIndex + 1)) : nextMap;
        },
        lowerColumnParam(columnParam, char) {
            let linkChar = char || '-';
            return columnParam.split('').map(x => (x < 'A' || x > 'Z' ? '' : linkChar) + x.toLowerCase()).join('');
        },
        indexFormat(index) {
            return (this.current - 1) * this.size + index + 1;
        },
        sliceArray(array) {
            if (this.isTrue(this['serverPagination'])) {
                return array;
            }

            let searchArray = array.filter(map => Object.keys(map).every(k => {
                let searchText = this.touchSearchText(k);
                return isEmptyString(searchText) || commonMethod.strContains(map[k], searchText);
            }));
            this.total = searchArray.length;
            return searchArray.slice((this.current - 1) * this.size, this.current * this.size);
        },
        touchSearchText(field) {
            let params = this.params.obj || this.params;
            return this.searchMode[field] ? (params[field] ? params[field] : Object.keys(params).filter(x => $.isPlainObject(params[x]) && params[x][field]).map(x => params[x][field]).shift()) : '';
        },
        arrayLen(array) {
            return $.isArray(array) ? array.length : 0;
        },
        isTrue(trueVal) {
            return commonMethod.isTrue(trueVal);
        },
        isFalse(falseVal, matchUndefined) {
            return commonMethod.isFalse(falseVal, matchUndefined);
        },
        realSortable(sortable) {
            return this.isTrue(sortable) && this.isTrue(this['serverPagination']) ? 'custom' : sortable;
        },
        realWidth(column) {
            return column.width || (column.events ? this.columns.length * 5 : undefined);
        },
        highlightSearchParam(value, field) {
            let params = this.params.obj || this.params;
            let searchText = params[field] ? params[field] : Object.keys(params).filter(x => $.isPlainObject(params[x]) && params[x][field]).map(x => params[x][field]).shift();
            return this.isTrue(this['highlightSearch']) && isNotEmptyString(value) && isNotEmptyString(searchText) && $.isFunction(value.replaceAll)
                ? value.replaceAll(searchText, () => '<strong>' + searchText + '</strong>')
                : value;
        },

        resetTable(clearSearch) {
            this.data = [];
            this.current = 1;
            this.size = 10;
            this.total = 0;
            this.clearSort();
            if (this.isTrue(clearSearch)) {
                commonMethod.clearProperty(this.params);
            }
        },
        clearSort() {
            if (isNotEmptyArray(this.params.orders)) {
                this.params.orders = [];
            }
            this.$nextTick(() => this.$refs.table.clearSort());
        },
        removeRow(row, index) {
            this.data.splice(index, 1);
        },
        addTableRow() {
            let newRow = {editMode: true, newRow: true};
            this.columns.filter(x => !x.events && x.param).forEach(x => {
                newRow[x.param] = '';
            });

            if ($.isPlainObject(this.newRowParams)) {
                $.extend(true, newRow, this.newRowParams);
            }

            newRow.backupData = $.extend(true, {}, newRow);
            this.data.push(newRow);
        },
        formatPropResult(propValue, params) {
            return $.isFunction(propValue) ? propValue(this.params.obj || this.params, params) : propValue;
        },

        refreshTable(saveCurrentPage) {
            if (commonMethod.isTrue(this.showLoading)) {
                this.appearLoading = true;
            }

            this.refreshSearchHeader(() => Object.keys(this.searchMode).forEach(x => this.searchMode[x] = false));

            let params = $.extend(true, {}, this.params);
            params.current = this.isTrue(saveCurrentPage) ? params.current : 1;

            let isServerPagination = this.isTrue(this['serverPagination']);
            if (isNotEmptyString(this.url) || isServerPagination) {
                if (isServerPagination) {
                    params.current = this.current;
                    params.size = this.size;
                }

                httpaxios.PostApi(this.url, params)
                    .then(res => this.setTableInfo(res.data))
                    .catch(error => {
                        console.error(error);
                        commonMethod.message({res: 0, resMsg: '网络异常'});
                        this.appearLoading = false;
                    });
            } else {
                this.setTableInfo(this.data);
                /*this.dataFilters = Object.keys(params).map(key => {
                    let text = key;
                    let value = params[key];
                    return {text, value};
                });*/
            }
        },
        setTableInfo(provideData) {
            let data;
            if (this.isTrue(this['serverPagination'])) {
                data = provideData.records;
                this.total = provideData.total;
            } else {
                data = provideData.obj || provideData;
            }

            data = $.isArray(data) ? data : [];
            if (this.isTrue(this['inlineEditable'])) {
                data.forEach(x => x.editMode = false);
            }

            this.data = data;

            data.forEach(x => {
                if (this.isTrue(this['showSelect']) && $.inArray(x[this.rowKey] || '', this.defaultChecked) > -1) {
                    this.$refs.table.toggleRowSelection(x);
                }
            });

            this.appearLoading = false;
        },

        resetRow(oldRow, newRow) {
            if ($.isPlainObject(newRow)) {
                copyProperty(oldRow, newRow);
                oldRow.editMode = false;
            }
        },
        formatMultipleValue(row) {
            let forwardToEditable = this.isFalse(row.editMode);
            this.multipleSplitMapData.forEach(x => {
                let value = row[x.field], splitStr = x.split;
                if (forwardToEditable && isNotEmptyString(value)) {
                    row[x.field] = value.split(splitStr);
                } else if (!forwardToEditable && isNotEmptyArray(value)) {
                    row[x.field] = value.join(splitStr);
                }
            });
        },
        toggleEditable(row, index, _selfTable, reset) {
            this.formatMultipleValue(row);
            row.editMode = !row.editMode;
            if (row.editMode) {
                row.backupData = $.extend(true, {}, row);
            } else {
                if (this.isTrue(reset)) {
                    if (row.newRow) {
                        this.removeRow(row, index);
                    } else {
                        this.formatMultipleValue(row.backupData);
                        this.resetRow(row, row.backupData);
                    }
                } else {
                    let data = $.extend(true, {}, row);
                    delete data.backupData;
                    delete data.editMode;
                    delete data.newRow;

                    let invokeResult, invokeMethod = row.newRow ? this.addRowMethod : this.confirmMethod;
                    if (this.messageIfSplitHasEmpty(data, index)
                        || $.isFunction(invokeMethod) && this.isFalse((invokeResult = invokeMethod(data, index, _selfTable)))) {
                        this.formatMultipleValue(row);
                        row.editMode = true;
                    }

                    this.resetRow(row, invokeResult);
                }
            }
        },
        messageIfMethodNeedConfirm(tips, callbackIfConfirm) {
            this.$confirm('此操作将' + tips + ', 是否继续?', '提示', {
                confirmButtonText: '确定',
                cancelButtonText: '取消',
                type: 'warning'
            }).then(() => {
                if ($.isFunction(callbackIfConfirm)) {
                    callbackIfConfirm();
                }
            }).catch(() => {
            });
        },
        messageIfSplitHasEmpty(row, index) {
            let emptySplit = Object.keys(row).map(x => {
                let refName = x + '-mi-split-' + index;
                let columnLabel = commonMethod.touchArrayVal(this.columns, x, 'param');
                columnLabel = this.formatPropResult(columnLabel);
                let splitLabel = this.$refs.hasOwnProperty(refName)
                    ? this.$refs[refName][0].touchEmptyLabel()
                    : undefined;
                return {columnLabel, splitLabel};
            }).filter(x => isNotEmptyString(x.splitLabel)).shift();

            let hasSplitEmpty = $.isPlainObject(emptySplit);
            if (hasSplitEmpty) {
                commonMethod.message({
                    res: 2,
                    resMsg: emptySplit.columnLabel + ' [' + emptySplit.splitLabel + '] 不能为空'
                });
            }
            return hasSplitEmpty;
        },
        messageIfRowHasEmpty(row, ignoreKeys) {
            let notEmptyParams = this.columns.filter(x => this.isTrue(x.editable) && this.isFalse(x.allowEmpty, true)).map(x => x.param);
            let ignoreParams = commonMethod.getIgnoreArray(ignoreKeys).concat(Object.keys(row).filter(param => $.inArray(param, notEmptyParams) === -1));
            let emptyKey = commonMethod.touchEmptyKey(row, ignoreParams);
            let hasEmpty = commonMethod.isNotEmptyString(emptyKey);
            if (hasEmpty) {
                let label = commonMethod.touchArrayVal(this.columns, emptyKey, 'param') || emptyKey;
                label = this.formatPropResult(label);
                commonMethod.message({res: 2, resMsg: label + '不能为空'});
            }
            return hasEmpty;
        },
        messageIfDataHasSame(row, uniqueKeys) {
            let keyArray = commonMethod.getIgnoreArray(uniqueKeys);
            if (keyArray.length === 0) {
                return false;
            }

            let uniqueKeyMethod = (x) => keyArray.map(y => x[y]).join('-');
            let currentUniqueKey = uniqueKeyMethod(row);
            let hasSameData = this.data.filter(x => !x.newRow).some(x => currentUniqueKey === uniqueKeyMethod(x));
            if (hasSameData) {
                let label = keyArray.map(x => this.formatPropResult(commonMethod.touchArrayVal(this.columns, x, 'param'))).join('-');
                commonMethod.message({res: 2, resMsg: '数据已存在 [' + label + ':' + currentUniqueKey + ']'});
            }
            return hasSameData;
        },

        handleFilterChange(value, row, column) {
            return row[column.property] === value;
        },

        handleTableSortChange(sortInfo) {
            if (this.isTrue(this['serverPagination'])) {
                let column = this.lowerColumnParam(sortInfo.prop, '_');
                let asc = sortInfo.order === this.sortMode.asc;
                this.params.orders = [{column, asc}];
                this.refreshTable(true);
            }
        },
        handlePageSizeChange(size) {
            this.size = size;
            if (this.isTrue(this['serverPagination'])) {
                this.refreshTable(true);
            }
        },
        handlePageCurrentChange(current) {
            this.current = current;
            if (this.isTrue(this['serverPagination'])) {
                this.refreshTable(true);
            }
        },

        handleTableRowClick(row, column, event) {
            if (column && column.property !== 'doing') {
                if (this.isTrue(this['showSelect'])) {
                    this.$refs.table.toggleRowSelection(row);
                }

                this.$emit('row-click', row, column, event);
            }
        },
        handleTableSelectionChange(rows) {
            if (this.isTrue(this['showSelect']) && !this.refreshSelect) {
                this.refreshSelect = true;

                let returnData;
                if (this.isTrue(this['rememberChecked']) && rows.some(x => !x.hasOwnProperty(this.rowKey))) {
                    rows = [];
                    this.$refs.table.clearSelection();
                    Vue.prototype.$message({message: '数据中不包含rowKey [' + this.rowKey + ']', type: 'warning'});
                }

                if (this.isTrue(this['singleSelect'])) {
                    returnData = rows.pop() || {};
                    this.$refs.table.clearSelection();
                    this.$refs.table.toggleRowSelection(returnData);
                } else {
                    returnData = rows;
                }

                this.checkedData = returnData;
                this.$emit('checked', returnData);
                this.refreshSelect = false;
            }
        },
    }
});