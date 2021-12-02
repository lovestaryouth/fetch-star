let miFormTemplate = `
  <div>
    <template v-if="loadFinish" v-for="(lineForm, lineNum) in formOptionMap">
      <el-row :line-num="lineNum" 
              :class="[lineNum === lastLineNum ? 'no-margin-bottom' : '', lineNum === firstLineNum ? 'no-margin-top' : '']">
        <el-col v-for="(formItem, formIndex) in lineForm"
                v-if="formItem.show ? isTrue(formatLabelResult(formItem.show, formItem)) : true"
                :style="{paddingLeft: formatMarginLeft(formItem, formIndex)}"
                :span="formItem.span || formatColWidth(24, lineForm.length, colSpan)">
          <template v-if="formItem.events">
            <elbutton v-for="(btnItem, btnIndex) in formItem.events"
                      :type="btnItem.type" 
                      :title="btnItem.title" 
                      :style="{paddingLeft: formatMarginLeft(btnItem, btnIndex, '1rem')}"
                      @click.native="btnItem.method(formParams)">
            </elbutton>
          </template>
          <template v-else>
            <label class="default-label" 
                   :style="{width: formItem.width || labelWidth}"
                   v-text="formatLabelResult(formItem.label, formItem) + '：'">
            </label>
            <label v-if="formItem.labelTag"
                   :class="['default-label', formItem.labelTag.class]"
                   :style="formatLabelResult(formItem.labelTag.style, formItem)"
                   v-text="formatLabelResult(formItem.labelTag.text, formItem)">
            </label>
            <div v-else 
                 @dblclick="handleDoubleClick(event, formItem)"
                 @dropover="handleTextareaDropOver"
                 @drop="handleTextareaDrop(event, formItem)"
                 style="display: contents">
              <div :style="{display: formItem.display || 'table-cell', 
                            borderRadius: '4px',
                            border: isNotEmptyString(formErrorMsgMap[formItem.param]) ? '1px solid #f56c6c' : ''}">
                <elradio v-if="formItem.radioData"
                         :ref="formItem.param + 'FormItem'"
                         :title="'选择' + formItem.label"
                         :radiodata="formatLabelResult(formItem.radioData, formItem)"
                         v-model="formParams[formItem.param]">
                </elradio>
                <elselect v-else-if="formItem.selectData"
                          v-model="formParams[formItem.param]"
                          :selectedata="formatLabelResult(formItem.selectData, formItem)"
                          :ref="formItem.param + 'FormItem'"
                          :ban="formatLabelResult(formItem.disabled, formItem)"
                          :group="formItem.group"
                          :multiples="isTrue(formItem.multiples)">
                </elselect>
                <template v-else>
                  <input v-if="isTrue(formItem.dblclick)"
                         :ref="formItem.param + 'FileInput'"
                         @change="handleFileChange(event, formItem)"
                         type="file" class="upload-file" style="display: none">
                  <el-input v-model="formParams[formItem.param]"
                            :ref="formItem.param + 'FormItem'"
                            :disabled="formatLabelResult(formItem.disabled, formItem)"
                            :type="formItem.type || 'input'"
                            :resize="formItem.resize || 'none'"
                            :rows="formItem.rows || 7"
                            :placeholder="formItem.text || ('请输入' + formItem.label)">
                  </el-input>
                </template>
              </div>
              <div v-if="isNotEmptyString(formErrorMsgMap[formItem.param])" 
                   :style="{position: 'relative', float: 'right', width: touchFormItemWidth(formItem)}" 
                   class="el-form-item__error animated faster fadeInDown">
                {{formErrorMsgMap[formItem.param]}}
              </div>
            </div>
          </template>
        </el-col>
      </el-row>
    </template>
  </div>
`;
Vue.component('mi-form', {
    template: miFormTemplate,
    model: {
        prop: 'form-params',
    },
    props: {
        'form-option': {type: [Array, Map], required: true, default: []},
        'form-params': {type: Map, required: true},
        'label-width': {type: String, default: '1%'},
        'col-span': {type: Number, default: 4},
    },
    data() {
        return {
            formOptionMap: {},
            formParamsCache: {},
            formErrorMsgMap: {},
            loadFinish: false,
        }
    },
    created() {
    },
    mounted() {
    },
    watch: {
        formParams: {
            handler(newParams) {
                let formTotalArray = Object.values(this.formOptionMap).flat();
                Object.keys(newParams).forEach(param => {
                    let formItem = formTotalArray.filter(x => x.param === param).shift();
                    if (formItem) {
                        let oldVal = this.formParamsCache[param], newVal = newParams[param];
                        let change = JSON.stringify(oldVal) !== JSON.stringify(newVal);
                        if (change && formItem.selectData && this.checkSelectLimit(newVal, formItem)) {
                            newParams[param] = oldVal;
                        } else {
                            if (change) {
                                delete this.formErrorMsgMap[formItem.param];
                                this.handleOnselect(formItem, newVal);
                            }
                            this.formParamsCache[param] = $.isArray(newVal) ? $.extend(true, [], newVal) : newVal;
                        }
                    }
                });
            },
            deep: true
        },
        formOption: {
            handler(newOption) {
                let formOptionSetting = {};
                if ($.isArray(newOption)) {
                    formOptionSetting['1'] = newOption;
                } else if ($.isPlainObject(newOption)) {
                    formOptionSetting = newOption;
                }

                let formOptionMap = {};
                let sortKeys = Object.keys(formOptionSetting).sort((x1, x2) => x1.localeCompare(x2));
                sortKeys.forEach((lineNum, lineIndex) => {
                    formOptionMap[lineNum] = formOptionSetting[lineNum];
                    if (lineIndex === 0) {
                        this.firstLineNum = lineNum;
                    }

                    if (lineIndex === sortKeys.length - 1) {
                        this.lastLineNum = lineNum;
                    }
                });

                this.setDefaultVal(formOptionMap);
                this.formOptionMap = formOptionMap;
                this.loadFinish = true;
            },
            deep: true,
            immediate: true
        }
    },
    methods: {
        isTrue(trueVal) {
            return commonMethod.isTrue(trueVal);
        },
        formatColWidth(maxWidth, size, minWidth) {
            return Math.min(Math.floor(maxWidth / size), minWidth);
        },
        formatMarginLeft(formItem, formIndex, defaultVal) {
            return formIndex === 0 ? '0' : (formItem.marginLeft || defaultVal || '2rem');
        },
        formatLabelResult(labelValue, formItem) {
            return $.isFunction(labelValue) ? labelValue(this.formParams, formItem) : labelValue;
        },
        handleFiles(fileDataItems, formItem) {
            let fileArray = [], item;
            for (let i = 0, n = fileDataItems.length; i < n; i++) {
                item = fileDataItems[i];
                if (item.kind) {
                    if (item.kind === "file" && item.webkitGetAsEntry().isFile) {
                        fileArray.push(item.getAsFile());
                    }
                } else {
                    fileArray.push(item);
                }
            }

            if (fileArray.length === 0) {
                return;
            }

            let fileCount = formItem.count ? parseInt(formItem.count) : 1;
            if (fileArray.length > fileCount) {
                commonMethod.message({res: 2, resMsg: '文件限制数量 [' + fileCount + ']'});
                return;
            }

            let fileExtArray = commonMethod.splitString(formItem.exts, ',');
            if (fileExtArray.length > 0 && fileArray.some(file => fileExtArray.every(ext => !file.name.toUpperCase().endsWith('.' + ext.toUpperCase())))) {
                commonMethod.message({res: 2, resMsg: '文件限制类型 [' + fileExtArray + ']'});
                return;
            }

            let param = formItem.param, reader = new FileReader();
            this.formParams[param] = '';
            reader.onload = (e) => this.formParams[param] += e.target.result;
            fileArray.forEach(x => reader.readAsText(x));
        },
        handleTextareaDrop(e, formItem) {
            e.preventDefault();
            e.stopPropagation();
            if (this.isTrue(formItem.drop)) {
                this.handleFiles(e.dataTransfer.items, formItem);
            }
        },
        handleDoubleClick(e, formItem) {
            let $refFileInput = this.touchRefElement(formItem, 'FileInput');
            if (this.isTrue(formItem.dblclick) && $refFileInput) {
                $refFileInput.dispatchEvent(new MouseEvent('click'))
            }
        },
        handleFileChange(e, formItem) {
            this.handleFiles(e.target.files, formItem);
        },
        handleTextareaDropOver(e) {
            e.preventDefault();
            e.stopPropagation();
        },
        setDefaultVal(formOptionMap) {
            Object.values(formOptionMap).flat().filter(x => x.param).forEach(x => {
                let currentVal = this.formParams[x.param];
                let defaultValue = commonMethod.isEmptyValue(currentVal) ? x.defaultValue || '' : currentVal;
                if (this.isTrue(x.multiples) && !$.isArray(defaultValue)) {
                    defaultValue = commonMethod.splitString(defaultValue, ',');
                }

                this.formParamsCache[x.param] = this.formParams[x.param] = defaultValue;
                this.handleOnselect(x, defaultValue);
            });
        },
        handleOnselect(formItem, selectVal) {
            if (isNotEmptyArray(formItem.onselect)) {
                formItem.onselect.forEach(select => {
                    let effectVal = this.formParams[select.effectProp], effectProp = select.effectProp;
                    if (selectVal === select.selectVal && commonMethod.isEmptyValue(effectVal)) {
                        effectVal = select.effectVal;
                        this.formParamsCache[effectProp] = this.formParams[effectProp] = effectVal;
                    }
                })
            }
        },
        transferToStringMap() {
            let stringMap = {};
            Object.values(this.formOptionMap).flat().filter(x => x.param && commonMethod.isFalse(x.ignore, true)).forEach(x => {
                let paramField = x.param;
                let stringVal = this.formParams[paramField];
                if (this.isTrue(x.multiples) && $.isArray(stringVal)) {
                    stringMap[paramField] = stringVal.join(',');
                } else {
                    stringMap[paramField] = stringVal;
                }
            });
            return stringMap;
        },
        touchRefElement(formItem, suffixName) {
            let $refElement = this.$refs[formItem.param + (suffixName || 'FormItem')];
            return isNotEmptyArray($refElement) ? $refElement[0] : undefined;
        },
        touchFormItemWidth(formItem) {
            let $refFormItem = this.touchRefElement(formItem);
            return $refFormItem ? $($refFormItem.$el).css('width') : 'max-content';
        },

        checkSelectLimit(newVal, formItem) {
            let selectForbid = commonMethod.splitString(formItem.selectForbid, ',');
            let checkVal = $.isArray(newVal) ? newVal : isNotEmptyString(newVal) ? [newVal] : [];
            if (checkVal.some(x => $.inArray(x, selectForbid) !== -1)) {
                commonMethod.message({res: 2, resMsg: '[' + checkVal + '] 不可选择'});
                return true;
            }

            let multiplesLimit = commonMethod.splitString(formItem.multiplesLimit, ',');
            if (this.isTrue(formItem.multiples) && checkVal.length > 1 && multiplesLimit.length > 0 && checkVal.some(x => $.inArray(x, multiplesLimit) === -1)) {
                commonMethod.message({res: 2, resMsg: '仅有 [' + multiplesLimit + '] 可多选'});
                return true;
            }

            return false;
        },
        checkFormParamsError() {
            this.loadFinish = false;
            let formValidateRulesMap = {};
            Object.values(this.formOptionMap)
                .flat()
                .filter(formItem => this.touchRefElement(formItem) && isNotEmptyArray(formItem.formRules))
                .forEach(formItem => {
                    formItem.formRules.forEach(rule => {
                        formValidateRulesMap[rule.group] = formValidateRulesMap[rule.group] || [];
                        rule.param = formItem.param;
                        rule.label = formItem.label;
                        rule.value = this.formParams[formItem.param];
                        formValidateRulesMap[rule.group].push(rule);
                    });
                });

            Object.keys(formValidateRulesMap).forEach(ruleGroup => {
                let distinctLabel = commonMethod.distinctArray(formValidateRulesMap[ruleGroup], 'label');
                let errorArray = formValidateRulesMap[ruleGroup].filter(rule => {
                    let ruleMethod = commonMethod[rule.methodName];
                    return $.isFunction(ruleMethod) && !ruleMethod(rule.value, rule.validate);
                });
                let labelSize = distinctLabel.length, errorSize = errorArray.length;
                if (labelSize > 0 ? errorSize === labelSize : errorSize > 0) {
                    let errorRule = errorArray.filter(rule => rule.errorMsg).shift();
                    let errorMsg = errorRule ? errorRule.errorMsg : ('请检查' + distinctLabel.join('、'));
                    let errorParam = errorRule ? errorRule.param : ruleGroup;
                    this.formErrorMsgMap[errorParam] = errorMsg;
                }
            });
            this.loadFinish = true;
            return Object.keys(this.formErrorMsgMap).length > 0 ? this.formErrorMsgMap : undefined;
        }
    }
});