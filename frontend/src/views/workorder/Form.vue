<template>
  <div class="workorder-form">
    <el-card>
      <div slot="header">
        <span>{{ isEdit ? '编辑施工单' : '新建施工单' }}</span>
      </div>

      <el-form
        ref="form"
        :model="form"
        :rules="rules"
        label-width="120px"
        class="form-container"
      >
        <el-form-item label="施工单号" v-if="isEdit">
          <el-input v-model="form.order_number" disabled></el-input>
          <span style="color: #909399; font-size: 12px;">系统自动生成</span>
        </el-form-item>

        <el-form-item label="客户" prop="customer">
          <el-select
            v-model="form.customer"
            placeholder="请选择客户"
            filterable
            style="width: 100%;"
          >
            <el-option
              v-for="customer in customerList"
              :key="customer.id"
              :label="customer.name"
              :value="customer.id"
            ></el-option>
          </el-select>
        </el-form-item>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="状态" prop="status">
              <el-select v-model="form.status" style="width: 100%;">
                <el-option label="待开始" value="pending"></el-option>
                <el-option label="进行中" value="in_progress"></el-option>
                <el-option label="已暂停" value="paused"></el-option>
                <el-option label="已完成" value="completed"></el-option>
                <el-option label="已取消" value="cancelled"></el-option>
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="优先级" prop="priority">
              <el-select v-model="form.priority" style="width: 100%;">
                <el-option label="低" value="low"></el-option>
                <el-option label="普通" value="normal"></el-option>
                <el-option label="高" value="high"></el-option>
                <el-option label="紧急" value="urgent"></el-option>
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="下单日期" prop="order_date">
              <el-date-picker
                v-model="form.order_date"
                type="date"
                placeholder="选择下单日期"
                style="width: 100%;"
                value-format="yyyy-MM-dd"
              ></el-date-picker>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="交货日期" prop="delivery_date">
              <el-date-picker
                v-model="form.delivery_date"
                type="date"
                placeholder="选择交货日期"
                style="width: 100%;"
                value-format="yyyy-MM-dd"
              ></el-date-picker>
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="实际交货日期" v-if="isEdit">
          <el-date-picker
            v-model="form.actual_delivery_date"
            type="date"
            placeholder="选择实际交货日期"
            style="width: 100%;"
            value-format="yyyy-MM-dd"
          ></el-date-picker>
        </el-form-item>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="生产数量">
              <el-input
                v-model="form.production_quantity"
                type="number"
                placeholder="请输入生产数量"
                style="width: 100%;"
              >
                <template slot="suffix">
                  <span style="color: #909399; padding-right: 8px;">车</span>
                </template>
              </el-input>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="预损数量">
              <el-input
                v-model="form.defective_quantity"
                type="number"
                placeholder="请输入预损数量"
                style="width: 100%;"
              >
                <template slot="suffix">
                  <span style="color: #909399; padding-right: 8px;">车</span>
                </template>
              </el-input>
            </el-form-item>
          </el-col>
        </el-row>

        <el-divider></el-divider>

        <!-- 图稿类型选择 -->
        <el-form-item label="图稿（CTP版）" prop="artwork_type">
          <el-radio-group v-model="form.artwork_type" @change="handleArtworkTypeChange">
            <el-radio label="no_artwork">不需要图稿</el-radio>
            <el-radio label="new_design">新设计图稿</el-radio>
            <el-radio label="need_update">需更新图稿</el-radio>
            <el-radio label="old_artwork">旧图稿</el-radio>
          </el-radio-group>
        </el-form-item>

        <!-- 图稿选择（仅在选择了"需更新图稿"或"旧图稿"时显示） -->
        <el-form-item 
          label="选择图稿" 
          prop="artworks"
          v-if="form.artwork_type === 'need_update' || form.artwork_type === 'old_artwork'"
        >
          <el-select
            v-model="form.artworks"
            placeholder="请选择图稿（可多选，至少选择一个）"
            filterable
            clearable
            multiple
            :collapse-tags="shouldCollapseTags"
            style="width: 100%;"
            @change="handleArtworkChange"
            @visible-change="handleArtworkSelectVisible"
          >
            <el-option
              v-for="artwork in artworkList"
              :key="artwork.id"
              :label="`${artwork.code} - ${artwork.name}`"
              :value="artwork.id"
            ></el-option>
          </el-select>
          <span style="color: #909399; font-size: 12px; margin-left: 10px;">
            请至少选择一个图稿，可多选（如纸卡双面印刷的面版和底版）
          </span>
        </el-form-item>

        <!-- 印刷形式（仅在选择了"需更新图稿"或"旧图稿"且有图稿时显示） -->
        <el-form-item label="印刷形式" v-if="hasArtworkSelected && shouldShowArtworkSelect">
          <el-radio-group v-model="form.printing_type">
            <el-radio label="front">正面印刷</el-radio>
            <el-radio label="back">背面印刷</el-radio>
            <el-radio label="self_reverse">自反印刷</el-radio>
            <el-radio label="reverse_gripper">反咬口印刷</el-radio>
            <el-radio label="register">套版印刷</el-radio>
          </el-radio-group>
        </el-form-item>

        <!-- 印刷色数（仅在选择了"需更新图稿"或"旧图稿"且有图稿时显示） -->
        <template v-if="hasArtworkSelected && shouldShowArtworkSelect">
          <el-form-item label="CMYK颜色">
            <el-checkbox-group v-model="form.printing_cmyk_colors">
              <el-checkbox label="C">C</el-checkbox>
              <el-checkbox label="M">M</el-checkbox>
              <el-checkbox label="Y">Y</el-checkbox>
              <el-checkbox label="K">K</el-checkbox>
            </el-checkbox-group>
          </el-form-item>
          <el-form-item label="其他颜色">
            <div v-for="(color, index) in form.printing_other_colors" :key="index" style="margin-bottom: 10px; display: flex; align-items: center;">
              <el-input
                v-model="form.printing_other_colors[index]"
                placeholder="请输入颜色名称，如：528C、金色"
                style="flex: 1; margin-right: 10px;"
              ></el-input>
              <el-button
                type="danger"
                size="small"
                icon="el-icon-delete"
                @click="removePrintingOtherColor(index)"
                circle
              ></el-button>
            </div>
            <el-button
              type="primary"
              size="small"
              icon="el-icon-plus"
              @click="addPrintingOtherColor"
            >添加颜色</el-button>
          </el-form-item>
        </template>

        <!-- 产品输入 -->
        <template>
          <!-- 单个产品选择（兼容旧模式，仅在未使用产品列表时显示） -->
          <el-form-item label="产品" prop="product" v-if="productItems.length === 0">
          <el-select
            v-model="form.product"
            placeholder="请选择产品"
            filterable
            style="width: 100%;"
            @change="handleProductChange"
          >
            <el-option
              v-for="product in productList"
              :key="product.id"
              :label="`${product.name} (${product.code})`"
              :value="product.id"
            >
              <span style="float: left">{{ product.name }}</span>
              <span style="float: right; color: #8492a6; font-size: 13px">¥{{ product.unit_price }}</span>
            </el-option>
          </el-select>
        </el-form-item>

        <!-- 多个产品列表（场景2：一个施工单包含多个产品） -->
        <el-form-item label="产品列表">
          <div v-for="(productItem, index) in productItems" :key="index" style="margin-bottom: 15px;">
            <el-row :gutter="10" type="flex" align="middle">
              <el-col :span="9">
                <el-select
                  :value="productItem.product"
                  @input="handleProductItemChange(index, $event)"
                  placeholder="请选择产品"
                  filterable
                  style="width: 100%;"
                >
                  <el-option
                    v-for="product in productList"
                    :key="product.id"
                    :label="`${product.name} (${product.code})`"
                    :value="product.id"
                  >
                    <span style="float: left">{{ product.name }}</span>
                    <span style="float: right; color: #8492a6; font-size: 13px">¥{{ product.unit_price }}</span>
                  </el-option>
                </el-select>
              </el-col>
              <el-col :span="5">
                <el-input
                  :value="getProductSpecification(productItem.product)"
                  placeholder="选择产品后自动填充"
                  :disabled="true"
                  style="color: #909399;"
                ></el-input>
              </el-col>
              <el-col :span="4">
                <el-input
                  :value="(productItem.imposition_quantity || 1) + '拼'"
                  placeholder="选择产品后自动填充"
                  :disabled="true"
                  style="color: #909399;"
                ></el-input>
              </el-col>
              <el-col :span="4">
                <el-input
                  :value="productItem.quantity"
                  @input="updateProductItemQuantity(index, $event)"
                  type="number"
                  placeholder="数量"
                  @change="calculateTotalAmount"
                  style="width: 100%;"
                >
                  <template slot="suffix">
                    <span style="color: #909399; padding-right: 8px;">{{ productItem.unit || '件' }}</span>
                  </template>
                </el-input>
              </el-col>
              <el-col :span="2" style="text-align: right;">
                <el-button
                  v-if="productItems.length > 1"
                  type="danger"
                  size="mini"
                  icon="el-icon-delete"
                  @click="removeProductItem(index)"
                  circle
                  style="margin-right: 5px;"
                ></el-button>
                <el-button
                  v-if="index === productItems.length - 1"
                  type="primary"
                  size="mini"
                  icon="el-icon-plus"
                  @click="addProductItem"
                  circle
                ></el-button>
              </el-col>
            </el-row>
          </div>
          
          <div v-if="productItems.length === 0" style="text-align: center; padding: 20px;">
            <el-button type="primary" icon="el-icon-plus" @click="addProductItem">
              添加产品
            </el-button>
          </div>
          <span style="color: #909399; font-size: 12px; display: block; margin-top: 10px;">
            如果一套图稿（CTP版）中同时拼版了多个产品（如纸卡、吊牌、说明书），请在此添加
          </span>
        </el-form-item>

        <!-- 单个产品模式的数量和单位（仅在选择了单个产品时显示） -->
        <el-row :gutter="20" v-if="form.product && productItems.length === 0">
          <el-col :span="12">
            <el-form-item label="数量" prop="quantity">
              <el-input-number
                v-model="form.quantity"
                :min="1"
                style="width: 100%;"
                @change="calculateTotalAmount"
              ></el-input-number>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="单位">
              <el-input v-model="form.unit" placeholder="自动填充" :disabled="true"></el-input>
            </el-form-item>
          </el-col>
        </el-row>

        <!-- 单个产品模式的产品规格（仅在选择了单个产品时显示） -->
        <el-form-item label="产品规格" v-if="form.product && productItems.length === 0">
          <el-input
            v-model="form.specification"
            type="textarea"
            :rows="2"
            placeholder="选择产品后自动填充"
            :disabled="true"
          ></el-input>
        </el-form-item>
        </template>

        <el-form-item label="总金额">
          <el-input-number
            v-model="form.total_amount"
            :precision="2"
            :min="0"
            style="width: 100%;"
          ></el-input-number>
          <span style="color: #909399; font-size: 12px;">根据产品单价和数量自动计算</span>
        </el-form-item>

        <el-divider></el-divider>

        <!-- 刀模类型选择 -->
        <el-form-item label="刀模" prop="die_type">
          <el-radio-group v-model="form.die_type" @change="handleDieTypeChange">
            <el-radio label="no_die">不需要刀模</el-radio>
            <el-radio label="new_design">新设计刀模</el-radio>
            <el-radio label="need_update">需更新刀模</el-radio>
            <el-radio label="old_die">旧刀模</el-radio>
          </el-radio-group>
        </el-form-item>

        <!-- 刀模选择（仅在选择了"需更新刀模"或"旧刀模"时显示） -->
        <el-form-item 
          label="选择刀模" 
          prop="dies"
          v-if="form.die_type === 'need_update' || form.die_type === 'old_die'"
        >
          <el-select
            v-model="form.dies"
            placeholder="请选择刀模（可多选，至少选择一个）"
            filterable
            clearable
            multiple
            :collapse-tags="shouldCollapseDieTags"
            style="width: 100%;"
            @change="handleDieChange"
            @visible-change="handleDieSelectVisible"
          >
            <el-option
              v-for="die in dieList"
              :key="die.id"
              :label="`${die.code} - ${die.name}`"
              :value="die.id"
            ></el-option>
          </el-select>
          <span style="color: #909399; font-size: 12px; margin-left: 10px;">
            请至少选择一个刀模，可多选
          </span>
        </el-form-item>

        <el-divider></el-divider>

        <!-- 工序选择 -->
        <el-form-item label="工序">
          <el-checkbox-group v-model="selectedProcesses">
            <el-checkbox
              v-for="process in allProcesses"
              :key="process.id"
              :label="process.id"
            >
              {{ process.name }}
            </el-checkbox>
          </el-checkbox-group>
        </el-form-item>

        <el-divider></el-divider>

        <!-- 物料信息 -->
        <el-form-item label="物料信息">
          <el-button type="primary" size="small" icon="el-icon-plus" @click="addMaterialItem">
            添加物料
          </el-button>
          <div style="margin-top: 15px;">
            <el-table
              :data="materialItems"
              border
              style="width: 100%"
            >
              <el-table-column label="物料名称" width="200">
                <template slot-scope="scope">
                  <el-select
                    v-model="scope.row.material"
                    placeholder="请选择物料"
                    filterable
                    style="width: 100%;"
                  >
                    <el-option
                      v-for="material in materialList"
                      :key="material.id"
                      :label="`${material.name} (${material.code})`"
                      :value="material.id"
                    ></el-option>
                  </el-select>
                </template>
              </el-table-column>
              <el-table-column label="尺寸" width="180">
                <template slot-scope="scope">
                  <el-input
                    v-model="scope.row.material_size"
                    placeholder="如：A4、210x297mm"
                    size="small"
                  ></el-input>
                </template>
              </el-table-column>
              <el-table-column label="用量" width="180">
                <template slot-scope="scope">
                  <el-input
                    v-model="scope.row.material_usage"
                    placeholder="如：1000张、50平方米"
                    size="small"
                  ></el-input>
                </template>
              </el-table-column>
              <el-table-column label="备注" min-width="200">
                <template slot-scope="scope">
                  <el-input
                    v-model="scope.row.notes"
                    placeholder="请输入备注"
                    size="small"
                  ></el-input>
                </template>
              </el-table-column>
              <el-table-column label="操作" width="100" align="center">
                <template slot-scope="scope">
                  <el-button
                    type="danger"
                    size="mini"
                    icon="el-icon-delete"
                    @click="removeMaterialItem(scope.$index)"
                  ></el-button>
                </template>
              </el-table-column>
            </el-table>
          </div>
        </el-form-item>

        <el-divider></el-divider>

        <el-form-item label="备注">
          <el-input
            v-model="form.notes"
            type="textarea"
            :rows="4"
            placeholder="请输入备注信息"
          ></el-input>
        </el-form-item>

        <el-form-item>
          <el-button type="primary" @click="handleSubmit" :loading="submitting">
            {{ isEdit ? '保存' : '创建' }}
          </el-button>
          <el-button @click="handleCancel">取消</el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script>
import { workOrderAPI, customerAPI, productAPI, processAPI, materialAPI, workOrderMaterialAPI, workOrderProductAPI, artworkAPI, dieAPI, workOrderProcessAPI } from '@/api/workorder'

export default {
  name: 'WorkOrderForm',
  data() {
    return {
      isEdit: false,
      submitting: false,
      customerList: [],
      productList: [],
      materialList: [],
      artworkList: [],
      dieList: [],
      allProcesses: [],
      selectedProduct: null,
      productItems: [], // 产品列表（可手动添加或从图稿自动填充）
      materialItems: [], // 物料列表
      selectedProcesses: [],
      form: {
        customer: null,
        product: null,
        product_name: '',
        specification: '',
        quantity: 1,
        unit: '件',
        artwork_type: 'no_artwork', // 图稿类型：不需要图稿、新设计图稿、需更新图稿、旧图稿
        artworks: [], // 图稿列表（支持多选）
        die_type: 'no_die', // 刀模类型：不需要刀模、新设计刀模、需更新刀模、旧刀模
        dies: [], // 刀模列表（支持多选）
        printing_type: 'front', // 印刷形式，默认正面印刷
        printing_cmyk_colors: [], // 印刷CMYK颜色
        printing_other_colors: [], // 印刷其他颜色
        imposition_quantity: 1,
        status: 'pending',
        priority: 'normal',
        order_date: '',
        delivery_date: '',
        actual_delivery_date: '',
        production_quantity: null,
        defective_quantity: null,
        total_amount: 0,
        notes: ''
      },
      rules: {
        customer: [
          { required: true, message: '请选择客户', trigger: 'change' }
        ],
        status: [
          { required: true, message: '请选择状态', trigger: 'change' }
        ],
        priority: [
          { required: true, message: '请选择优先级', trigger: 'change' }
        ],
        artwork_type: [
          { required: true, message: '请选择图稿类型', trigger: 'change' }
        ],
        artworks: [
          { 
            validator: (rule, value, callback) => {
              // 如果选择了"需更新图稿"或"旧图稿"，必须至少选择一个图稿
              if ((this.form.artwork_type === 'need_update' || this.form.artwork_type === 'old_artwork')) {
                if (!this.form.artworks || this.form.artworks.length === 0) {
                  callback(new Error('选择"需更新图稿"或"旧图稿"时，请至少选择一个图稿'))
                } else {
                  callback()
                }
              } else {
                callback()
              }
            }, 
            trigger: 'change' 
          }
        ],
        die_type: [
          { required: true, message: '请选择刀模类型', trigger: 'change' }
        ],
        dies: [
          { 
            validator: (rule, value, callback) => {
              // 如果选择了"需更新刀模"或"旧刀模"，必须至少选择一个刀模
              if ((this.form.die_type === 'need_update' || this.form.die_type === 'old_die')) {
                if (!this.form.dies || this.form.dies.length === 0) {
                  callback(new Error('选择"需更新刀模"或"旧刀模"时，请至少选择一个刀模'))
                } else {
                  callback()
                }
              } else {
                callback()
              }
            }, 
            trigger: 'change' 
          }
        ],
        order_date: [
          { required: true, message: '请选择下单日期', trigger: 'change' }
        ],
        delivery_date: [
          { required: true, message: '请选择交货日期', trigger: 'change' }
        ]
      }
    }
  },
  computed: {
    getProcessName() {
      return (processId) => {
        const process = this.allProcesses.find(p => p.id === processId)
        return process ? process.name : `工序 ${processId}`
      }
    },
    shouldCollapseTags() {
      // 至少显示3个选中的选项标签后才显示+n标签
      const validArtworks = this.form.artworks ? this.form.artworks.filter(id => id !== null) : []
      return validArtworks.length > 3
    },
    shouldCollapseDieTags() {
      // 至少显示3个选中的选项标签后才显示+n标签
      const validDies = this.form.dies ? this.form.dies.filter(id => id !== null) : []
      return validDies.length > 3
    },
    shouldShowDieSelect() {
      // 只有当选择了"需更新刀模"或"旧刀模"时才显示刀模多选
      return this.form.die_type === 'need_update' || this.form.die_type === 'old_die'
    },
    hasArtworkSelected() {
      // 判断是否选择了图稿
      if (!this.form.artworks || this.form.artworks.length === 0) {
        return false
      }
      const validArtworks = this.form.artworks.filter(id => id !== null)
      return validArtworks.length > 0
    },
    shouldShowArtworkSelect() {
      // 只有当选择了"需更新图稿"或"旧图稿"时才显示图稿多选
      return this.form.artwork_type === 'need_update' || this.form.artwork_type === 'old_artwork'
    }
  },
  watch: {
    // 监听生产数量变化，自动更新产品数量
    'form.production_quantity'(newVal, oldVal) {
      // 将字符串转换为数字
      const newNum = newVal !== null && newVal !== undefined && newVal !== '' ? parseFloat(newVal) : 0
      const oldNum = oldVal !== null && oldVal !== undefined && oldVal !== '' ? parseFloat(oldVal) : 0
      
      if (newNum !== oldNum && !isNaN(newNum)) {
        // 更新所有产品的数量（如果数量没有被手动修改过）
        this.productItems.forEach((item, index) => {
          if (!item.isQuantityManuallyModified && item.imposition_quantity) {
            const calculatedQuantity = this.calculateProductQuantity(item.imposition_quantity)
            this.$set(this.productItems[index], 'quantity', calculatedQuantity)
          }
        })
        this.calculateTotalAmount()
      }
    }
  },
  created() {
    this.isEdit = !!this.$route.params.id
    this.loadCustomerList()
    this.loadProductList()
    this.loadMaterialList()
    this.loadArtworkList()
    this.loadDieList()
    this.loadAllProcesses()
    
    if (this.isEdit) {
      this.loadData()
    } else {
      // 设置默认日期
      const today = new Date()
      this.form.order_date = this.formatDate(today)
      
      const deliveryDate = new Date()
      deliveryDate.setDate(deliveryDate.getDate() + 7)
      this.form.delivery_date = this.formatDate(deliveryDate)
      
      // 初始化一个空的产品项（场景2）
      this.productItems = [{
        product: null,
        quantity: 1,
        unit: '件',
        specification: ''
      }]
    }
  },
  methods: {
    handleArtworkTypeChange(value) {
      // 当图稿类型改变时，根据类型处理图稿选择
      if (value === 'no_artwork' || value === 'new_design') {
        // 不需要图稿或新设计图稿时，清空图稿选择
        this.form.artworks = []
        // 设置印刷形式为"不需要印刷"
        this.form.printing_type = 'none'
        // 清空印刷色数
        this.form.printing_cmyk_colors = []
        this.form.printing_other_colors = []
        
        // 清空产品列表（如果之前有从图稿填充的产品）
        if (value === 'no_artwork') {
          this.productItems = [{
            product: null,
            quantity: 1,
            unit: '件',
            specification: ''
          }]
          // 清空工序和物料
          this.selectedProcesses = []
          this.materialItems = []
        }
      }
      // 触发验证
      this.$nextTick(() => {
        this.$refs.form.validateField('artworks')
      })
    },
    async loadCustomerList() {
      try {
        const response = await customerAPI.getList({ page_size: 100 })
        this.customerList = response.results || []
      } catch (error) {
        console.error('加载客户列表失败:', error)
      }
    },
    async loadProductList() {
      try {
        const response = await productAPI.getList({ is_active: true, page_size: 100 })
        this.productList = response.results || []
      } catch (error) {
        console.error('加载产品列表失败:', error)
      }
    },
    async loadMaterialList() {
      try {
        const response = await materialAPI.getList({ page_size: 100 })
        this.materialList = response.results || []
      } catch (error) {
        console.error('加载物料列表失败:', error)
      }
    },
    async loadArtworkList() {
      try {
        const response = await artworkAPI.getList({ page_size: 100 })
        this.artworkList = response.results || []
      } catch (error) {
        console.error('加载图稿列表失败:', error)
      }
    },
    async loadDieList() {
      try {
        const response = await dieAPI.getList({ page_size: 100 })
        this.dieList = response.results || []
      } catch (error) {
        console.error('加载刀模列表失败:', error)
      }
    },
    async loadAllProcesses() {
      try {
        // 分页加载所有工序
        let allProcesses = []
        let page = 1
        let hasMore = true
        
        while (hasMore) {
          const response = await processAPI.getList({ 
            is_active: true, 
            page_size: 100,
            page: page
          })
          
          if (response.results && response.results.length > 0) {
            allProcesses = allProcesses.concat(response.results)
            // 检查是否还有更多数据
            hasMore = response.next !== null && response.next !== undefined
            page++
          } else {
            hasMore = false
          }
        }
        
        this.allProcesses = allProcesses
      } catch (error) {
        console.error('加载工序列表失败:', error)
      }
    },
    async handleProductChange(productId) {
      // 找到选中的产品
      const product = this.productList.find(p => p.id === productId)
      if (product) {
        this.selectedProduct = product
        // 自动填充产品信息
        this.form.product_name = product.name
        this.form.specification = product.specification
        this.form.unit = product.unit
        
        // 加载默认工序和物料
        await this.loadProductDefaults(productId)
        
        // 自动计算总价
        this.calculateTotalAmount()
      }
    },
    async loadProductDefaults(productId) {
      // 获取产品详情（包含默认工序和默认物料）
      try {
        const productDetail = await productAPI.getDetail(productId)
        
        // 加载默认工序
        if (productDetail.default_processes && productDetail.default_processes.length > 0) {
          this.selectedProcesses = productDetail.default_processes
        } else {
          this.selectedProcesses = []
        }
        
        // 加载默认物料
        if (productDetail.default_materials && productDetail.default_materials.length > 0) {
          this.materialItems = productDetail.default_materials.map(m => ({
            material: m.material,
            material_size: m.material_size || '',
            material_usage: m.material_usage || '',
            notes: ''
          }))
        } else {
          this.materialItems = []
        }
      } catch (error) {
        console.error('加载产品默认信息失败:', error)
      }
    },
    handleArtworkSelectVisible(visible) {
      // 当下拉框打开时，如果已选中"不需要图稿"，准备处理互斥逻辑
      if (visible && this.form.artworks && this.form.artworks.includes('NO_ARTWORK')) {
        this.hasNoArtworkSelected = true
      } else {
        this.hasNoArtworkSelected = false
      }
    },
    async handleArtworkChange(artworkIds) {
      // 如果没有选择任何图稿
      if (!artworkIds || artworkIds.length === 0) {
        // 设置印刷形式为"不需要印刷"
        this.form.printing_type = 'none'
        // 清空印刷色数
        this.form.printing_cmyk_colors = []
        this.form.printing_other_colors = []
        
        // 如果产品列表为空，初始化一个空的产品项
        if (this.productItems.length === 0) {
          this.productItems = [{
            product: null,
            quantity: 1,
            unit: '件',
            specification: ''
          }]
        }
        this.calculateTotalAmount()
        // 触发验证
        this.$nextTick(() => {
          this.$refs.form.validateField('artworks')
        })
        return
      }
      
      // 过滤掉无效值，只处理有效的图稿ID
      const validArtworkIds = artworkIds.filter(id => id !== null)
      
      if (validArtworkIds.length === 0) {
        this.calculateTotalAmount()
        return
      }

      // 如果选择了图稿，且印刷形式是"不需要印刷"，则默认改为"正面印刷"
      if (this.form.printing_type === 'none') {
        this.form.printing_type = 'front'
      }

      // 选择了图稿（可能多个），加载所有图稿关联的产品并合并
      try {
        const allProducts = []
        const allCmykColors = new Set() // 收集所有图稿的CMYK颜色（去重）
        const allOtherColors = new Set() // 收集所有图稿的其他颜色（去重）
        const allDies = new Set() // 收集所有图稿关联的刀模（去重）
        
        // 遍历所有选中的图稿
        for (const artworkId of validArtworkIds) {
          const artworkDetail = await artworkAPI.getDetail(artworkId)
          
          // 收集图稿的CMYK颜色
          if (artworkDetail.cmyk_colors && Array.isArray(artworkDetail.cmyk_colors)) {
            artworkDetail.cmyk_colors.forEach(color => {
              if (color && ['C', 'M', 'Y', 'K'].includes(color)) {
                allCmykColors.add(color)
              }
            })
          }
          
          // 收集图稿的其他颜色
          if (artworkDetail.other_colors && Array.isArray(artworkDetail.other_colors)) {
            artworkDetail.other_colors.forEach(color => {
              if (color && color.trim()) {
                allOtherColors.add(color.trim())
              }
            })
          }
          
          // 收集图稿关联的刀模
          if (artworkDetail.dies && Array.isArray(artworkDetail.dies)) {
            artworkDetail.dies.forEach(dieId => {
              if (dieId) {
                allDies.add(dieId)
              }
            })
          }
          
          if (artworkDetail.products && artworkDetail.products.length > 0) {
            // 将图稿关联的产品转换为 productItems 格式
            artworkDetail.products.forEach(ap => {
              // 检查是否已存在相同产品，如果存在则合并数量
              const existingProduct = allProducts.find(p => p.product === ap.product)
              if (existingProduct) {
                // 如果已存在，累加拼版数量（用于显示）
                existingProduct.imposition_quantity = (existingProduct.imposition_quantity || 1) + (ap.imposition_quantity || 1)
                // 重新计算数量：生产数量 * 拼版数量
                existingProduct.quantity = this.calculateProductQuantity(existingProduct.imposition_quantity)
              } else {
                // 如果不存在，添加新产品
                const impositionQty = ap.imposition_quantity || 1
                allProducts.push({
                  product: ap.product,
                  imposition_quantity: impositionQty, // 保存拼版数量
                  quantity: this.calculateProductQuantity(impositionQty), // 计算数量：生产数量 * 拼版数量
                  unit: ap.product_detail ? ap.product_detail.unit : '件',
                  specification: ap.product_detail ? ap.product_detail.specification : '',
                  isQuantityManuallyModified: false // 标记数量是否被手动修改
                })
              }
            })
          }
        }

        // 将图稿关联的产品填充到 productItems
        if (allProducts.length > 0) {
          // 保留手动添加的产品（如果存在且不在图稿产品列表中）
          const manualProducts = this.productItems.filter(item => {
            // 如果产品项有产品ID，且不在图稿产品列表中，则保留
            return item.product && !allProducts.find(ap => ap.product === item.product)
          })
          
          // 合并图稿产品和手动添加的产品
          this.productItems = [...allProducts, ...manualProducts]
          
          // 如果合并后列表为空，至少保留一个空项
          if (this.productItems.length === 0) {
            this.productItems = [{
              product: null,
              quantity: 1,
              unit: '件',
              specification: '',
              imposition_quantity: 1,
              isQuantityManuallyModified: false
            }]
          }

          // 自动填充第一个产品的默认工序和物料
          if (this.productItems.length > 0 && this.productItems[0].product) {
            await this.loadProductDefaults(this.productItems[0].product)
          }

          // 自动计算总金额
          this.calculateTotalAmount()
        } else {
          // 如果所有图稿都没有关联产品，提示用户
          if (this.productItems.length === 0) {
            this.productItems = [{
              product: null,
              quantity: 1,
              unit: '件',
              specification: '',
              imposition_quantity: 1,
              isQuantityManuallyModified: false
            }]
          }
          this.$message.warning('所选图稿未关联任何产品')
        }
        
        // 自动填充印刷色数（合并所有图稿的色数，去重）
        // CMYK颜色：按照固定顺序C、M、Y、K排列
        const cmykOrder = ['C', 'M', 'Y', 'K']
        this.form.printing_cmyk_colors = cmykOrder.filter(c => allCmykColors.has(c))
        // 其他颜色：转换为数组
        this.form.printing_other_colors = Array.from(allOtherColors).filter(c => c && c.trim())
        
        // 自动填充关联的刀模（合并所有图稿的刀模，去重）
        if (allDies.size > 0) {
          this.form.dies = Array.from(allDies)
        } else {
          // 如果没有关联刀模，保持当前选择（不清空，允许用户手动选择）
        }
      } catch (error) {
        console.error('加载图稿详情失败:', error)
        this.$message.error('加载图稿详情失败')
      }
      
      // 触发验证
      this.$nextTick(() => {
        this.$refs.form.validateField('artworks')
      })
    },
    handleDieTypeChange(value) {
      // 当刀模类型改变时，根据类型处理刀模选择
      if (value === 'no_die' || value === 'new_design') {
        // 不需要刀模或新设计刀模时，清空刀模选择
        this.form.dies = []
      }
      // 触发验证
      this.$nextTick(() => {
        this.$refs.form.validateField('dies')
      })
    },
    handleDieSelectVisible() {
      // 当下拉框打开时的处理（如果需要）
    },
    handleDieChange() {
      // 触发验证
      this.$nextTick(() => {
        this.$refs.form.validateField('dies')
      })
    },
    addProductItem() {
      this.productItems.push({
        product: null,
        quantity: this.calculateProductQuantity(1), // 默认数量：生产数量 * 1拼
        unit: '件',
        specification: '',
        imposition_quantity: 1, // 默认拼版数量为1
        isQuantityManuallyModified: false // 标记数量是否被手动修改
      })
    },
    addPrintingOtherColor() {
      this.form.printing_other_colors.push('')
    },
    removePrintingOtherColor(index) {
      this.form.printing_other_colors.splice(index, 1)
    },
    removeProductItem(index) {
      this.productItems.splice(index, 1)
      this.calculateTotalAmount()
    },
    getProductSpecification(productId) {
      if (!productId) return ''
      const product = this.productList.find(p => p.id === productId)
      return product ? (product.specification || '') : ''
    },
    async handleProductItemChange(index, productId) {
      // 更新产品项的产品ID
      this.$set(this.productItems[index], 'product', productId)
      
      // 找到选中的产品
      const product = this.productList.find(p => p.id === productId)
      if (product) {
        // 自动填充产品信息
        this.$set(this.productItems[index], 'specification', product.specification || '')
        this.$set(this.productItems[index], 'unit', product.unit || '件')
        
        // 如果没有设置拼版数量，默认为1
        if (!this.productItems[index].imposition_quantity) {
          this.$set(this.productItems[index], 'imposition_quantity', 1)
        }
        
        // 如果数量没有被手动修改过，自动计算数量：生产数量 * 拼版数量
        if (!this.productItems[index].isQuantityManuallyModified) {
          const calculatedQuantity = this.calculateProductQuantity(this.productItems[index].imposition_quantity || 1)
          this.$set(this.productItems[index], 'quantity', calculatedQuantity)
        }
        
        // 如果是第一个产品，加载默认工序和物料
        if (index === 0) {
          await this.loadProductDefaults(productId)
        }
        
        // 自动计算总价
        this.calculateTotalAmount()
      }
    },
    updateProductItemQuantity(index, quantity) {
      let numValue = parseInt(quantity) || 1
      if (numValue < 1) {
        numValue = 1
      }
      this.$set(this.productItems[index], 'quantity', numValue)
      // 标记数量已被手动修改
      this.$set(this.productItems[index], 'isQuantityManuallyModified', true)
      this.calculateTotalAmount()
    },
    updateProductItemImpositionQuantity(index, impositionQuantity) {
      let numValue = parseInt(impositionQuantity) || 1
      if (numValue < 1) {
        numValue = 1
      }
      this.$set(this.productItems[index], 'imposition_quantity', numValue)
      
      // 如果数量没有被手动修改过，自动计算数量：生产数量 * 拼版数量
      if (!this.productItems[index].isQuantityManuallyModified) {
        const calculatedQuantity = this.calculateProductQuantity(numValue)
        this.$set(this.productItems[index], 'quantity', calculatedQuantity)
      }
      
      this.calculateTotalAmount()
    },
    // 计算产品数量：生产数量 * 拼版数量
    calculateProductQuantity(impositionQuantity) {
      const productionQty = this.form.production_quantity !== null && this.form.production_quantity !== undefined && this.form.production_quantity !== '' 
        ? parseFloat(this.form.production_quantity) || 0 
        : 0
      return productionQty * (impositionQuantity || 1)
    },
    calculateTotalAmount() {
      if (this.productItems.length > 0 && this.productItems[0].product) {
        // 计算所有产品的总金额（场景2：多个产品）
        let total = 0
        this.productItems.forEach(item => {
          if (item.product) {
            const product = this.productList.find(p => p.id === item.product)
            if (product && item.quantity) {
              total += parseFloat((product.unit_price * item.quantity).toFixed(2))
            }
          }
        })
        this.form.total_amount = total
      } else if (this.selectedProduct && this.form.quantity) {
        // 单个产品模式
        this.form.total_amount = parseFloat(
          (this.selectedProduct.unit_price * this.form.quantity).toFixed(2)
        )
      }
    },
    async loadData() {
      try {
        const id = this.$route.params.id
        const data = await workOrderAPI.getDetail(id)
        
        this.form = {
          order_number: data.order_number,  // 只读显示
          customer: data.customer,
          product: data.product,
          product_name: data.product_name || '',
          specification: data.specification || '',
          quantity: data.quantity,
          unit: data.unit,
          // 图稿类型
          artwork_type: data.artwork_type || 'no_artwork',
          // 图稿：后端现在返回的是 artworks 数组
          artworks: data.artworks || [],
          // 刀模类型
          die_type: data.die_type || 'no_die',
          // 刀模：后端现在返回的是 dies 数组
          dies: data.dies || [],
          printing_type: data.printing_type || 'front',
          printing_cmyk_colors: data.printing_cmyk_colors || [],
          printing_other_colors: Array.isArray(data.printing_other_colors) ? data.printing_other_colors : [],
          imposition_quantity: data.imposition_quantity || 1,
          status: data.status,
          priority: data.priority,
          order_date: data.order_date,
          delivery_date: data.delivery_date,
          actual_delivery_date: data.actual_delivery_date || '',
          production_quantity: data.production_quantity || null,
          defective_quantity: data.defective_quantity || null,
          total_amount: parseFloat(data.total_amount),
          notes: data.notes || ''
        }
        
        // 加载产品列表
        if (data.products && data.products.length > 0) {
          // 从图稿产品关联中获取拼版数量
          const loadProductItemsWithImposition = async () => {
            const productItemsWithImposition = []
            
            // 如果有图稿，先批量加载所有图稿的产品关联信息
            const artworkProductsMap = new Map() // productId -> imposition_quantity
            if (data.artworks && data.artworks.length > 0) {
              try {
                // 并行加载所有图稿详情
                const artworkDetailsPromises = data.artworks.map(artworkId => 
                  artworkAPI.getDetail(artworkId).catch(err => {
                    console.warn(`加载图稿 ${artworkId} 失败:`, err)
                    return null
                  })
                )
                const artworkDetails = await Promise.all(artworkDetailsPromises)
                
                // 构建产品到拼版数量的映射（如果同一产品在多个图稿中，使用第一个找到的）
                artworkDetails.forEach(artworkDetail => {
                  if (artworkDetail && artworkDetail.products) {
                    artworkDetail.products.forEach(ap => {
                      if (!artworkProductsMap.has(ap.product)) {
                        artworkProductsMap.set(ap.product, ap.imposition_quantity || 1)
                      }
                    })
                  }
                })
              } catch (error) {
                console.warn('加载图稿产品关联失败:', error)
              }
            }
            
            // 构建产品列表
            for (const p of data.products) {
              const impositionQuantity = artworkProductsMap.get(p.product) || 1
              
              productItemsWithImposition.push({
                product: p.product,
                quantity: p.quantity,
                unit: p.unit,
                specification: p.specification || '',
                imposition_quantity: impositionQuantity,
                isQuantityManuallyModified: true // 编辑模式下，数量已经被保存过，视为手动修改
              })
            }
            
            this.productItems = productItemsWithImposition
          }
          
          await loadProductItemsWithImposition()
        } else if (data.product) {
          // 兼容旧数据：如果只有单个产品
          this.productItems = [{
            product: data.product,
            quantity: data.quantity || 1,
            unit: data.unit || '件',
            specification: data.specification || '',
            imposition_quantity: 1, // 默认拼版数量为1
            isQuantityManuallyModified: true // 编辑模式下，数量已经被保存过，视为手动修改
          }]
        } else {
          this.productItems = [{
            product: null,
            quantity: 1,
            unit: '件',
            specification: ''
          }]
        }
        
        // 如果有产品ID，加载产品信息用于计算
        if (data.product) {
          this.selectedProduct = data.product_detail
        }
        
        // 如果有图稿，加载图稿关联的产品（如果产品列表为空或需要更新）
        if (this.form.artworks && this.form.artworks.length > 0) {
          // 先加载产品列表，然后根据图稿更新
          await this.handleArtworkChange(this.form.artworks)
          // 如果有已保存的产品数据，更新数量等信息
          if (data.products && data.products.length > 0) {
            data.products.forEach(savedProduct => {
              const productItem = this.productItems.find(p => p.product === savedProduct.product)
              if (productItem) {
                productItem.quantity = savedProduct.quantity
                productItem.unit = savedProduct.unit
                productItem.specification = savedProduct.specification
              }
            })
          }
        }
        
        // 重新计算总金额
        this.calculateTotalAmount()
        
        // 加载已选择的工序
        if (data.order_processes && data.order_processes.length > 0) {
          this.selectedProcesses = data.order_processes.map(op => op.process)
        } else {
          this.selectedProcesses = []
        }
        
        // 加载物料信息
        if (data.materials && data.materials.length > 0) {
          this.materialItems = data.materials.map(m => ({
            id: m.id, // 编辑时保留ID
            material: m.material,
            material_size: m.material_size || '',
            material_usage: m.material_usage || '',
            notes: m.notes || ''
          }))
        } else {
          this.materialItems = []
        }
      } catch (error) {
        this.$message.error('加载数据失败')
        console.error(error)
      }
    },
    handleSubmit() {
      this.$refs.form.validate(async (valid) => {
        if (!valid) {
          return false
        }
        
        // 验证产品信息
        if (this.productItems.length === 0 || !this.productItems[0].product) {
          if (!this.form.product) {
            this.$message.warning('请选择产品或添加产品列表')
            return
          }
        }
        
        this.submitting = true
        try {
          const data = { ...this.form }
          
          // 创建时删除 order_number 字段（由后端自动生成）
          if (!this.isEdit) {
            delete data.order_number
          }
          
          // 清理空值
          if (!data.actual_delivery_date) {
            delete data.actual_delivery_date
          }
          
          // 处理图稿数据：保留所有有效的图稿ID
          const validArtworks = this.form.artworks ? this.form.artworks.filter(id => id !== null) : []
          data.artworks = validArtworks.length > 0 ? validArtworks : []
          
          // 根据图稿类型处理图稿数据
          if (this.form.artwork_type === 'no_artwork' || this.form.artwork_type === 'new_design') {
            // 不需要图稿或新设计图稿时，清空图稿选择
            data.artworks = []
            // 设置印刷形式为"不需要印刷"
            data.printing_type = 'none'
            data.printing_cmyk_colors = []
            data.printing_other_colors = []
          } else if (!data.artworks || data.artworks.length === 0) {
            // 如果选择了"需更新图稿"或"旧图稿"但没有选择图稿，设置印刷形式为"不需要印刷"
            data.printing_type = 'none'
            data.printing_cmyk_colors = []
            data.printing_other_colors = []
          }
          
          // 过滤空的其他颜色值
          if (data.printing_other_colors && Array.isArray(data.printing_other_colors)) {
            data.printing_other_colors = data.printing_other_colors.filter(color => color && color.trim())
          }
          
          // 处理刀模数据：根据刀模类型处理刀模数据
          const validDies = this.form.dies ? this.form.dies.filter(id => id !== null) : []
          data.dies = validDies.length > 0 ? validDies : []
          
          // 根据刀模类型处理刀模数据
          if (this.form.die_type === 'no_die' || this.form.die_type === 'new_design') {
            // 不需要刀模或新设计刀模时，清空刀模选择
            data.dies = []
          }
          
          // 处理产品数据
          if (this.productItems && this.productItems.length > 0 && this.productItems[0].product) {
            // 场景2：多个产品模式，传 products_data
            data.products_data = this.productItems
              .filter(item => item.product)
              .map((item, index) => ({
                product: item.product,
                quantity: item.quantity || 1,
                unit: item.unit || '件',
                specification: item.specification || '',
                sort_order: index
              }))
            // 清空单个产品字段
            delete data.product
            delete data.product_name
            delete data.specification
            delete data.quantity
            delete data.unit
          } else if (this.form.product) {
            // 单个产品模式（兼容旧数据）
            // 保持原有逻辑
          } else {
            this.$message.warning('请选择产品或添加产品列表')
            this.submitting = false
            return
          }
          
          let workOrderId
          if (this.isEdit) {
            await workOrderAPI.update(this.$route.params.id, data)
            workOrderId = this.$route.params.id
            this.$message.success('保存成功')
          } else {
            const result = await workOrderAPI.create(data)
            workOrderId = result.id
            this.$message.success('创建成功，单号自动生成')
          }
          
          // 注意：products_data 已经在后端的 create/update 方法中自动处理了
          // 不需要再次调用 saveProducts，否则会导致重复创建和 400 错误
          
          // 检查并保存工序和物料，收集所有错误信息
          const permissionErrors = []
          const otherErrors = []
          
          // 添加选中的工序（新建和编辑都需要处理）
          try {
            await this.saveSelectedProcesses(workOrderId)
          } catch (error) {
            if (error.response?.status === 403) {
              permissionErrors.push('工序信息')
            } else {
              otherErrors.push('工序信息')
              console.error('保存工序失败:', error)
            }
          }
          
          // 保存物料信息
          try {
            await this.saveMaterials(workOrderId)
          } catch (error) {
            if (error.response?.status === 403) {
              permissionErrors.push('物料信息')
            } else {
              otherErrors.push('物料信息')
              console.error('保存物料失败:', error)
            }
          }
          
          // 根据错误类型显示不同的提示信息
          if (permissionErrors.length > 0 && otherErrors.length > 0) {
            this.$message.warning(
              `施工单已保存，但以下内容无法保存：${permissionErrors.join('、')}（权限不足），${otherErrors.join('、')}（保存失败）`
            )
          } else if (permissionErrors.length > 0) {
            this.$message.warning(
              `施工单已保存，但以下内容因权限不足无法保存：${permissionErrors.join('、')}`
            )
          } else if (otherErrors.length > 0) {
            this.$message.warning(
              `施工单已保存，但以下内容保存失败：${otherErrors.join('、')}`
            )
          }
          
          this.$router.push('/workorders')
        } catch (error) {
          const errorMessage = error.response?.data?.error || error.response?.data?.detail || error.message || (this.isEdit ? '保存失败' : '创建失败')
          this.$message.error(errorMessage)
          console.error('保存施工单失败:', error)
        } finally {
          this.submitting = false
        }
      })
    },
    async saveProducts(workOrderId, productsData) {
      // 如果是编辑模式，先删除所有现有产品，然后重新添加
      if (this.isEdit) {
        try {
          // 获取现有产品列表
          const existingProducts = await workOrderProductAPI.getList({ work_order: workOrderId })
          // 删除现有产品
          for (const product of existingProducts.results || []) {
            await workOrderProductAPI.delete(product.id)
          }
        } catch (error) {
          console.error('删除现有产品失败:', error)
        }
      }
      
      // 使用传入的 productsData 或从 productItems 获取
      let productsToSave = productsData
      
      if (!productsToSave) {
        // 如果没有传入，从 productItems 获取
        productsToSave = this.productItems
          .filter(item => item.product)
          .map((item, index) => ({
            product: item.product,
            quantity: parseInt(item.quantity) || 1,
            unit: item.unit || '件',
            specification: item.specification || '',
            sort_order: index
          }))
      }
      
      // 添加新产品
      for (let i = 0; i < productsToSave.length; i++) {
        const item = productsToSave[i]
        if (item.product) {
          try {
            // 确保数据类型正确
            const quantity = parseInt(item.quantity) || 1
            const sortOrder = parseInt(item.sort_order) !== undefined ? parseInt(item.sort_order) : i
            
            const productData = {
              work_order: workOrderId,
              product: item.product,
              quantity: quantity,
              unit: (item.unit || '件').toString().substring(0, 20), // 确保不超过20字符
              specification: (item.specification || '').toString(),
              sort_order: sortOrder
            }
            
            // 验证必填字段
            if (!productData.work_order || !productData.product) {
              throw new Error('施工单ID和产品ID不能为空')
            }
            
            await workOrderProductAPI.create(productData)
          } catch (error) {
            console.error('保存产品失败:', error)
            console.error('错误详情:', error.response?.data)
            console.error('产品数据:', {
              work_order: workOrderId,
              product: item.product,
              quantity: item.quantity,
              unit: item.unit,
              specification: item.specification,
              sort_order: item.sort_order
            })
            throw error
          }
        }
      }
    },
    async saveSelectedProcesses(workOrderId) {
      // 收集所有选中的工序ID
      const allSelectedIds = this.selectedProcesses
      
      if (!allSelectedIds || allSelectedIds.length === 0) {
        // 如果没有选中工序，在编辑模式下删除所有现有工序
        if (this.isEdit) {
          try {
            const response = await workOrderAPI.getDetail(workOrderId)
            if (response.order_processes && response.order_processes.length > 0) {
              // 删除所有现有工序
              for (const existingProcess of response.order_processes) {
                if (existingProcess.id) {
                  try {
                    await workOrderProcessAPI.delete(existingProcess.id)
                  } catch (error) {
                    // 如果是权限错误，抛出错误以便上层处理
                    if (error.response?.status === 403) {
                      throw error
                    } else {
                      console.error('删除工序失败:', error)
                      throw error
                    }
                  }
                }
              }
            }
          } catch (error) {
            console.error('获取施工单工序失败:', error)
            throw error
          }
        }
        return
      }
      
      // 如果是编辑模式，先获取现有工序，删除不在新列表中的工序，添加新工序
      if (this.isEdit) {
        try {
          const response = await workOrderAPI.getDetail(workOrderId)
          const existingProcesses = response.order_processes || []
          
          // 找出需要删除的工序（现有但不在新列表中的）
          const existingProcessIds = existingProcesses.map(ep => ep.process)
          const processesToDelete = existingProcessIds.filter(pid => !allSelectedIds.includes(pid))
          
          // 删除不需要的工序
          for (const processToDelete of processesToDelete) {
            const existingProcess = existingProcesses.find(ep => ep.process === processToDelete)
            if (existingProcess && existingProcess.id) {
              try {
                await workOrderProcessAPI.delete(existingProcess.id)
              } catch (error) {
                // 如果是权限错误，抛出错误以便上层处理
                if (error.response?.status === 403) {
                  throw error
                } else {
                  console.error('删除工序失败:', error)
                  throw error
                }
              }
            } else {
              console.warn('找不到要删除的工序，process ID:', processToDelete, 'existingProcess:', existingProcess)
            }
          }
          
          // 找出需要添加的工序（新列表中有但现有中没有的）
          const processesToAdd = allSelectedIds.filter(pid => !existingProcessIds.includes(pid))
          
          // 添加新工序
          // 计算下一个序号：应该是现有工序的最大序号+1
          let maxSequence = 0
          if (existingProcesses.length > 0) {
            maxSequence = Math.max(...existingProcesses.map(ep => ep.sequence || 0))
          }
          let nextSequence = maxSequence + 1
          
          for (const processId of processesToAdd) {
            try {
              const processData = {
                process_id: processId,
                sequence: nextSequence++
              }
              await workOrderAPI.addProcess(workOrderId, processData)
            } catch (error) {
              console.error('添加工序失败:', error)
              throw error
            }
          }
        } catch (error) {
          console.error('保存工序失败:', error)
          throw error
        }
      } else {
        // 新建模式：直接添加所有工序
        for (let i = 0; i < allSelectedIds.length; i++) {
          const processId = allSelectedIds[i]
          try {
            const processData = {
              process_id: processId,
              sequence: i + 1
            }
            await workOrderAPI.addProcess(workOrderId, processData)
          } catch (error) {
            console.error('添加工序失败:', error)
            throw error
          }
        }
      }
    },
    handleCancel() {
      this.$router.back()
    },
    addMaterialItem() {
      this.materialItems.push({
        material: null,
        material_size: '',
        material_usage: '',
        notes: ''
      })
    },
    removeMaterialItem(index) {
      this.materialItems.splice(index, 1)
    },
    // eslint-disable-next-line no-unused-vars
    handleMaterialChange(index) {
      // 物料选择变化时的处理（如果需要）
      // 参数保留用于将来可能的扩展
    },
    async saveMaterials(workOrderId) {
      // 如果是编辑模式，先删除所有现有物料，然后重新添加
      if (this.isEdit) {
        try {
          // 获取现有物料列表
          const existingMaterials = await workOrderMaterialAPI.getList({ work_order: workOrderId })
          // 删除现有物料
          for (const material of existingMaterials.results || []) {
            try {
              await workOrderMaterialAPI.delete(material.id)
            } catch (error) {
              // 如果是权限错误，静默处理
              if (error.response?.status === 403) {
                console.warn('没有权限删除物料，跳过:', material.id)
              } else {
                console.error('删除物料失败:', error)
              }
            }
          }
        } catch (error) {
          console.error('删除现有物料失败:', error)
        }
      }
      
      // 添加新物料
      for (const item of this.materialItems) {
        if (item.material) {
          try {
            await workOrderMaterialAPI.create({
              work_order: workOrderId,
              material: item.material,
              material_size: item.material_size || '',
              material_usage: item.material_usage || '',
              notes: item.notes || ''
            })
          } catch (error) {
            console.error('保存物料失败:', error)
          }
        }
      }
    },
    formatDate(date) {
      if (!date) return ''
      const d = new Date(date)
      const year = d.getFullYear()
      const month = String(d.getMonth() + 1).padStart(2, '0')
      const day = String(d.getDate()).padStart(2, '0')
      return `${year}-${month}-${day}`
    }
  }
}
</script>

<style scoped>
.workorder-form {
  padding: 20px;
}

.form-container {
  max-width: 1200px;
}
</style>
