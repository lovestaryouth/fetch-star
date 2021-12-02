let miSplitTemplate = `
  <div style="display: inline">
    <template v-if="" v-for="(each, index) in splitOptionArray">
      <div v-if="each.show ? commonMethod.isTrue(formatParamsValue(each.show)) : true" 
           :style="{width: (each.width || 85) + 'px', display: 'inline-flex'}">
        <elselect v-if="each.selectData"
                  :title="each.label"
                  :selectedata="each.selectData"
                  @change="joinSplitData('change')"
                  v-model="each.value">
        </elselect>
        <span v-else-if="each.type === 'span'">{{each.value}}</span>
        <el-input v-else
                  @input="joinSplitData('input')"
                  :placeholder="each.label"
                  v-model="each.value">
          <i v-if="isNotEmptyString(splitSingleFlag)" 
             slot="suffix" class="el-icon-remove-outline" title="移除"
             @click.prevent="deleteOneData(index)">
          </i>
        </el-input>
      </div>
      <label v-if="index < getShowSplitOption().length - 1"
             v-text="each.flag"
             class="default-label" style="line-height: 0.6rem;width: auto;padding: 0 0.3rem 0 0.15rem">
      </label>
    </template>
    <i v-if="isNotEmptyString(splitSingleFlag)" 
       slot="suffix" class="el-icon-circle-plus-outline" title="新增"
       @click="insertOneData()">
    </i>
  </div>
`;
Vue.component('mi-split', {
    template: miSplitTemplate,
    model: {
        prop: 'split-value',
    },
    props: {
        'split-option': {type: [Array, String], required: false, default: []},
        'split-value': {type: String, required: true}
    },
    data() {
        return {
            splitOptionArray: [],
            splitSingleFlag: ''
        }
    },
    created() {
    },
    mounted() {
    },
    watch: {
        splitOption: {
            handler(newOption) {
                let afterSubVal = this.splitValue || '';

                let splitOptionArray = [];
                if (isPlainObject(newOption)) {
                    this.splitSingleFlag = newOption.flag;
                    this.splitSingleWidth = $.isNumeric(newOption.width) ? newOption.width : 60;
                    splitOptionArray = afterSubVal.split(newOption.flag).map(x => this.newOneData(x));
                } else if (isNotEmptyArray(newOption)) {
                    splitOptionArray = $.extend(true, [], newOption);
                }

                splitOptionArray.forEach((each, index) => {
                    let flag = each.flag || '';

                    let endIndex = isNotEmptyString(flag) ? afterSubVal.indexOf(flag) : -1;
                    if (endIndex > -1) {
                        each.value = afterSubVal.substring(0, endIndex);
                        afterSubVal = afterSubVal.substring(endIndex + flag.length);
                    } else {
                        each.value = afterSubVal;
                    }

                });
                this.splitOptionArray = splitOptionArray;
            },
            deep: true,
            immediate: true,
        }
    },
    methods: {
        formatParamsValue(value) {
            return $.isFunction(value) ? value(this.splitOptionArray) : value;
        },
        joinSplitData(eventName) {
            this.splitValue = this.getShowSplitOption()
                .map((each, index, array) =>
                    each.value
                    + (index < array.length - 1 ? each.flag : '')).join('');
            this.$emit(eventName, this.splitValue);
        },
        getShowSplitOption() {
            return this.splitOptionArray.filter(x => x.show ? commonMethod.isTrue(this.formatParamsValue(x.show)) : true);
        },
        touchEmptyLabel() {
            return this.getShowSplitOption().filter(x => commonMethod.isFalse(x.allowEmpty, true) && isEmptyString(x.value)).map(x => x.label).shift();
        },
        newOneData(newVal) {
            let flag = this.splitSingleFlag;
            let width = this.splitSingleWidth;
            let value = newVal;
            return {flag, width, value};
        },
        deleteOneData(index) {
            this.splitOptionArray.splice(index, 1);
            this.joinSplitData('input');
        },
        insertOneData() {
            this.splitOptionArray.push(this.newOneData(''));
            this.joinSplitData('input');
        }
    }
})
;