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

        <el-divider></el-divider>

        <!-- 图稿选择 -->
        <el-form-item label="图稿（CTP版）">
          <el-select
            v-model="form.artworks"
            placeholder="请选择图稿（可多选）"
            filterable
            clearable
            multiple
            :collapse-tags="shouldCollapseTags"
            style="width: 100%;"
            @change="handleArtworkChange"
            @visible-change="handleArtworkSelectVisible"
          >
            <el-option
              label="不需要图稿"
              :value="'NO_ARTWORK'"
            ></el-option>
            <el-option
              v-for="artwork in artworkList"
              :key="artwork.id"
              :label="`${artwork.code} - ${artwork.name}`"
              :value="artwork.id"
            ></el-option>
          </el-select>
          <span style="color: #909399; font-size: 12px; margin-left: 10px;">
            选择"不需要图稿"可手动输入产品，选择具体图稿将自动填充关联的产品信息到下方产品列表，可多选（如纸卡双面印刷的面版和底版）
          </span>
        </el-form-item>

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
              <el-col :span="10">
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
              <el-col :span="6">
                <el-input
                  :value="productItem.specification"
                  placeholder="选择产品后自动填充"
                  :disabled="true"
                  style="color: #909399;"
                ></el-input>
              </el-col>
              <el-col :span="3">
                <el-input
                  :value="productItem.quantity"
                  @input="updateProductItemQuantity(index, $event)"
                  type="number"
                  :min="1"
                  placeholder="数量"
                  @change="calculateTotalAmount"
                  style="width: 100%;"
                ></el-input>
              </el-col>
              <el-col :span="3">
                <el-input :value="productItem.unit" placeholder="单位" :disabled="true" style="color: #909399;"></el-input>
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

        <el-form-item label="刀模">
          <el-select
            v-model="form.die"
            placeholder="请选择刀模"
            filterable
            clearable
            style="width: 100%;"
          >
            <el-option
              v-for="die in dieList"
              :key="die.id"
              :label="`${die.code} - ${die.name}`"
              :value="die.id"
            ></el-option>
          </el-select>
        </el-form-item>

        <el-form-item label="拼版数量">
          <el-input-number
            v-model="form.imposition_quantity"
            :min="1"
            style="width: 100%;"
          ></el-input-number>
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
              <el-table-column label="计划用量" width="150">
                <template slot-scope="scope">
                  <el-input-number
                    v-model="scope.row.planned_quantity"
                    :min="0"
                    :precision="2"
                    size="small"
                    style="width: 100%;"
                  ></el-input-number>
                </template>
              </el-table-column>
              <el-table-column label="实际用量" width="150">
                <template slot-scope="scope">
                  <el-input-number
                    v-model="scope.row.actual_quantity"
                    :min="0"
                    :precision="2"
                    size="small"
                    style="width: 100%;"
                  ></el-input-number>
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
      hasNoArtworkSelected: false, // 标记是否已选中"不需要图稿"
      form: {
        customer: null,
        product: null,
        product_name: '',
        specification: '',
        quantity: 1,
        unit: '件',
        artworks: [], // 图稿列表（支持多选）
        die: null,
        imposition_quantity: 1,
        status: 'pending',
        priority: 'normal',
        order_date: '',
        delivery_date: '',
        actual_delivery_date: '',
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
      const validArtworks = this.form.artworks ? this.form.artworks.filter(id => id !== 'NO_ARTWORK' && id !== null) : []
      return validArtworks.length > 3
    }
  },
  watch: {
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
            planned_quantity: 0,
            actual_quantity: 0,
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
      // 如果选择了"不需要图稿"
      if (artworkIds && artworkIds.includes('NO_ARTWORK')) {
        // 如果同时选择了"不需要图稿"和其他图稿，移除其他图稿，只保留"不需要图稿"
        const otherArtworks = artworkIds.filter(id => id !== 'NO_ARTWORK')
        if (otherArtworks.length > 0) {
          this.$nextTick(() => {
            this.form.artworks = ['NO_ARTWORK']
          })
        }
        
        // 清空产品列表（包括图稿自动填充的产品）
        this.productItems = [{
          product: null,
          quantity: 1,
          unit: '件',
          specification: ''
        }]
        
        // 清空工序和物料
        this.selectedProcesses = []
        this.materialItems = []
        
        this.calculateTotalAmount()
        return
      }
      
      // 如果之前选择了"不需要图稿"，现在选择了其他图稿，移除"不需要图稿"
      if (this.hasNoArtworkSelected && artworkIds && artworkIds.length > 0) {
        const validArtworkIds = artworkIds.filter(id => id !== 'NO_ARTWORK')
        if (validArtworkIds.length > 0) {
          this.$nextTick(() => {
            this.form.artworks = validArtworkIds
          })
          artworkIds = validArtworkIds
          this.hasNoArtworkSelected = false
        }
      }
      
      // 如果没有选择任何图稿
      if (!artworkIds || artworkIds.length === 0) {
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
        return
      }
      
      // 过滤掉 'NO_ARTWORK' 值，只处理有效的图稿ID
      const validArtworkIds = artworkIds.filter(id => id !== 'NO_ARTWORK' && id !== null)
      
      if (validArtworkIds.length === 0) {
        this.calculateTotalAmount()
        return
      }

      // 选择了图稿（可能多个），加载所有图稿关联的产品并合并
      try {
        const allProducts = []
        
        // 遍历所有选中的图稿
        for (const artworkId of validArtworkIds) {
          const artworkDetail = await artworkAPI.getDetail(artworkId)
          if (artworkDetail.products && artworkDetail.products.length > 0) {
            // 将图稿关联的产品转换为 productItems 格式
            artworkDetail.products.forEach(ap => {
              // 检查是否已存在相同产品，如果存在则合并数量
              const existingProduct = allProducts.find(p => p.product === ap.product)
              if (existingProduct) {
                // 如果已存在，累加数量（使用拼版数量）
                existingProduct.quantity = (existingProduct.quantity || 1) + (ap.imposition_quantity || 1)
              } else {
                // 如果不存在，添加新产品
                allProducts.push({
                  product: ap.product,
                  quantity: ap.imposition_quantity || 1, // 默认数量为拼版数量
                  unit: ap.product_detail ? ap.product_detail.unit : '件',
                  specification: ap.product_detail ? ap.product_detail.specification : ''
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
              specification: ''
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
              specification: ''
            }]
          }
          this.$message.warning('所选图稿未关联任何产品')
        }
      } catch (error) {
        console.error('加载图稿详情失败:', error)
        this.$message.error('加载图稿详情失败')
      }
    },
    addProductItem() {
      this.productItems.push({
        product: null,
        quantity: 1,
        unit: '件',
        specification: ''
      })
    },
    removeProductItem(index) {
      this.productItems.splice(index, 1)
      this.calculateTotalAmount()
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
      this.calculateTotalAmount()
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
          // 图稿：后端现在返回的是 artworks 数组
          artworks: data.artworks || [],
          die: data.die || null,
          imposition_quantity: data.imposition_quantity || 1,
          status: data.status,
          priority: data.priority,
          order_date: data.order_date,
          delivery_date: data.delivery_date,
          actual_delivery_date: data.actual_delivery_date || '',
          total_amount: parseFloat(data.total_amount),
          notes: data.notes || ''
        }
        
        // 加载产品列表
        if (data.products && data.products.length > 0) {
          this.productItems = data.products.map((p) => ({
            product: p.product,
            quantity: p.quantity,
            unit: p.unit,
            specification: p.specification || ''
          }))
        } else if (data.product) {
          // 兼容旧数据：如果只有单个产品
          this.productItems = [{
            product: data.product,
            quantity: data.quantity || 1,
            unit: data.unit || '件',
            specification: data.specification || ''
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
            planned_quantity: m.planned_quantity || 0,
            actual_quantity: m.actual_quantity || 0,
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
          
          // 处理图稿数据：过滤掉 'NO_ARTWORK'，保留所有有效的图稿ID
          const validArtworks = this.form.artworks ? this.form.artworks.filter(id => id !== 'NO_ARTWORK' && id !== null) : []
          data.artworks = validArtworks.length > 0 ? validArtworks : []
          
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
          
          // 保存产品信息（图稿模式或多产品模式，如果后端没有自动处理）
          if (data.products_data && data.products_data.length > 0) {
            await this.saveProducts(workOrderId, data.products_data)
          }
          
          // 添加选中的工序（新建和编辑都需要处理）
          await this.saveSelectedProcesses(workOrderId)
          
          // 保存物料信息
          await this.saveMaterials(workOrderId)
          
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
                    console.error('删除工序失败:', error)
                  }
                }
              }
            }
          } catch (error) {
            console.error('获取施工单工序失败:', error)
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
                console.error('删除工序失败:', error)
              }
            }
          }
          
          // 找出需要添加的工序（新列表中有但现有中没有的）
          const processesToAdd = allSelectedIds.filter(pid => !existingProcessIds.includes(pid))
          
          // 添加新工序
          let nextSequence = existingProcesses.length + 1
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
            throw error // 重新抛出错误，让上层处理
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
        planned_quantity: 0,
        actual_quantity: 0,
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
            await workOrderMaterialAPI.delete(material.id)
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
              planned_quantity: item.planned_quantity || 0,
              actual_quantity: item.actual_quantity || 0,
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
