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

        <!-- 产品组选择（场景1：一个产品需要多个施工单） -->
        <el-form-item label="产品组">
          <el-select
            v-model="form.product_group_item"
            placeholder="请选择产品组子项（可选，如：天地盒中的天盒）"
            filterable
            clearable
            style="width: 100%;"
            @change="handleProductGroupItemChange"
          >
            <el-option-group
              v-for="group in productGroupList"
              :key="group.id"
              :label="`${group.name} (${group.code})`"
            >
              <el-option
                v-for="item in group.items"
                :key="item.id"
                :label="`${item.item_name} - ${item.product_name} (${item.product_code})`"
                :value="item.id"
              ></el-option>
            </el-option-group>
          </el-select>
          <span style="color: #909399; font-size: 12px; margin-left: 10px;">
            如果该施工单是产品组的一部分（如天地盒需要天盒和地盒两个施工单），请选择对应的子项
          </span>
        </el-form-item>

        <!-- 单个产品选择（兼容旧模式，仅在未选择产品组时显示） -->
        <el-form-item label="产品" prop="product" v-if="!form.product_group_item && productItems.length === 0">
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
        <el-form-item label="产品列表" v-if="!form.product_group_item">
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
        <el-row :gutter="20" v-if="form.product && !form.product_group_item && productItems.length === 0">
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
        <el-form-item label="产品规格" v-if="form.product && !form.product_group_item && productItems.length === 0">
          <el-input
            v-model="form.specification"
            type="textarea"
            :rows="2"
            placeholder="选择产品后自动填充"
            :disabled="true"
          ></el-input>
        </el-form-item>

        <el-divider></el-divider>

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

        <el-form-item label="实际交货日期">
          <el-date-picker
            v-model="form.actual_delivery_date"
            type="date"
            placeholder="选择实际交货日期"
            style="width: 100%;"
            value-format="yyyy-MM-dd"
          ></el-date-picker>
        </el-form-item>

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

        <el-form-item label="图稿（CTP版）">
          <el-select
            v-model="form.artwork"
            placeholder="请选择图稿"
            filterable
            clearable
            style="width: 100%;"
          >
            <el-option
              v-for="artwork in artworkList"
              :key="artwork.id"
              :label="`${artwork.code} - ${artwork.name}`"
              :value="artwork.id"
            ></el-option>
          </el-select>
        </el-form-item>

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

        <!-- 工序派工 -->
        <div v-if="selectedProcesses.length > 0">
          <el-card style="margin-top: 20px;">
            <div slot="header">工序派工</div>
            <div v-for="processId in selectedProcesses" :key="processId" style="margin-bottom: 20px; padding: 15px; border: 1px solid #e4e7ed; border-radius: 4px;">
              <h4 style="margin: 0 0 15px 0;">{{ getProcessName(processId) }}</h4>
              
              <el-form-item label="生产部门">
                <el-select
                  :value="processAssignments[processId] && processAssignments[processId].department"
                  @input="updateProcessDepartment(processId, $event)"
                  placeholder="请选择部门"
                  clearable
                  style="width: 100%;"
                >
                  <el-option
                    v-for="dept in departmentList"
                    :key="dept.id"
                    :label="dept.name"
                    :value="dept.id"
                  ></el-option>
                </el-select>
              </el-form-item>

              <el-form-item label="任务列表">
                <el-table
                  :data="processAssignments[processId] && processAssignments[processId].tasks || []"
                  border
                  style="width: 100%;"
                >
                  <el-table-column prop="work_content" label="施工内容" width="200">
                    <template slot-scope="scope">
                      <el-input
                        v-model="scope.row.work_content"
                        placeholder="请输入施工内容"
                      ></el-input>
                    </template>
                  </el-table-column>
                  <el-table-column prop="production_quantity" label="生产数量" width="150">
                    <template slot-scope="scope">
                      <el-input-number
                        v-model="scope.row.production_quantity"
                        :min="0"
                        style="width: 100%;"
                      ></el-input-number>
                    </template>
                  </el-table-column>
                  <el-table-column prop="production_requirements" label="生产要求">
                    <template slot-scope="scope">
                      <el-input
                        v-model="scope.row.production_requirements"
                        placeholder="请输入生产要求"
                      ></el-input>
                    </template>
                  </el-table-column>
                  <el-table-column label="操作" width="100">
                    <template slot-scope="scope">
                      <el-button
                        type="danger"
                        size="mini"
                        icon="el-icon-delete"
                        @click="removeTask(processId, scope.$index)"
                        circle
                      ></el-button>
                    </template>
                  </el-table-column>
                </el-table>
                <el-button
                  type="primary"
                  size="mini"
                  icon="el-icon-plus"
                  @click="addTask(processId)"
                  style="margin-top: 10px;"
                >
                  添加任务
                </el-button>
              </el-form-item>
            </div>
          </el-card>
        </div>

        <el-divider></el-divider>

        <!-- 物料信息 -->
        <el-form-item label="物料信息">
          <div v-for="(item, index) in materialItems" :key="index" style="margin-bottom: 15px; padding: 15px; border: 1px solid #e4e7ed; border-radius: 4px;">
            <el-row :gutter="20">
              <el-col :span="6">
                <el-form-item :label="index === 0 ? '物料' : ''">
                  <el-select
                    v-model="item.material"
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
                </el-form-item>
              </el-col>
              <el-col :span="4">
                <el-form-item :label="index === 0 ? '尺寸' : ''">
                  <el-input v-model="item.material_size" placeholder="如：A4"></el-input>
                </el-form-item>
              </el-col>
              <el-col :span="4">
                <el-form-item :label="index === 0 ? '用量' : ''">
                  <el-input v-model="item.material_usage" placeholder="如：1000张"></el-input>
                </el-form-item>
              </el-col>
              <el-col :span="4">
                <el-form-item :label="index === 0 ? '计划用量' : ''">
                  <el-input-number
                    v-model="item.planned_quantity"
                    :min="0"
                    :precision="2"
                    style="width: 100%;"
                  ></el-input-number>
                </el-form-item>
              </el-col>
              <el-col :span="4">
                <el-form-item :label="index === 0 ? '实际用量' : ''">
                  <el-input-number
                    v-model="item.actual_quantity"
                    :min="0"
                    :precision="2"
                    style="width: 100%;"
                  ></el-input-number>
                </el-form-item>
              </el-col>
              <el-col :span="2" style="text-align: right; padding-top: 30px;">
                <el-button
                  v-if="materialItems.length > 1"
                  type="danger"
                  size="mini"
                  icon="el-icon-delete"
                  @click="removeMaterialItem(index)"
                  circle
                ></el-button>
                <el-button
                  v-if="index === materialItems.length - 1"
                  type="primary"
                  size="mini"
                  icon="el-icon-plus"
                  @click="addMaterialItem"
                  circle
                ></el-button>
              </el-col>
            </el-row>
          </div>
          
          <div v-if="materialItems.length === 0" style="text-align: center; padding: 20px;">
            <el-button type="primary" icon="el-icon-plus" @click="addMaterialItem">
              添加物料
            </el-button>
          </div>
        </el-form-item>

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
import { workOrderAPI, customerAPI, productAPI, processAPI, materialAPI, workOrderMaterialAPI, workOrderProductAPI, artworkAPI, dieAPI, departmentAPI, workOrderProcessAPI, workOrderTaskAPI, productGroupAPI, productGroupItemAPI } from '@/api/workorder'

export default {
  name: 'WorkOrderForm',
  data() {
    return {
      isEdit: false,
      submitting: false,
      customerList: [],
      productList: [],
      productGroupList: [], // 产品组列表
      materialList: [],
      artworkList: [],
      dieList: [],
      allProcesses: [],
      departmentList: [],
      selectedProduct: null,
      productItems: [], // 产品列表（场景2：一个施工单包含多个产品）
      materialItems: [], // 物料列表
      selectedProcesses: [],
      processAssignments: {}, // 工序指派信息 { processId: { department: id, tasks: [...] } }
      form: {
        customer: null,
        product: null,
        product_group_item: null, // 产品组子项（场景1：一个产品需要多个施工单）
        product_name: '',
        specification: '',
        quantity: 1,
        unit: '件',
        artwork: null,
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
    }
  },
  watch: {
    selectedProcesses: {
      handler() {
        this.updateProcessAssignments()
      },
      deep: true
    }
  },
  created() {
    this.isEdit = !!this.$route.params.id
    this.loadCustomerList()
    this.loadProductList()
    this.loadProductGroupList()
    this.loadMaterialList()
    this.loadArtworkList()
    this.loadDieList()
    this.loadAllProcesses()
    this.loadDepartmentList()
    
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
    async loadProductGroupList() {
      try {
        // 分页加载所有产品组
        let allGroups = []
        let page = 1
        let hasMore = true
        
        while (hasMore) {
          const response = await productGroupAPI.getList({ 
            is_active: true, 
            page_size: 100,
            page: page
          })
          
          if (response.results && response.results.length > 0) {
            // 为每个产品组加载子项
            for (const group of response.results) {
              try {
                const itemsResponse = await productGroupItemAPI.getList({ 
                  product_group: group.id,
                  page_size: 100
                })
                group.items = itemsResponse.results || []
              } catch (error) {
                console.error(`加载产品组 ${group.id} 的子项失败:`, error)
                group.items = []
              }
            }
            allGroups = allGroups.concat(response.results)
            hasMore = response.next !== null && response.next !== undefined
            page++
          } else {
            hasMore = false
          }
        }
        
        this.productGroupList = allGroups
      } catch (error) {
        console.error('加载产品组列表失败:', error)
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
    async loadDepartmentList() {
      try {
        // 分页加载所有部门
        let allDepartments = []
        let page = 1
        let hasMore = true
        
        while (hasMore) {
          const response = await departmentAPI.getList({ 
            is_active: true, 
            page_size: 100,
            page: page
          })
          
          if (response.results && response.results.length > 0) {
            allDepartments = allDepartments.concat(response.results)
            // 检查是否还有更多数据
            hasMore = response.next !== null && response.next !== undefined
            page++
          } else {
            hasMore = false
          }
        }
        
        this.departmentList = allDepartments
      } catch (error) {
        console.error('加载部门列表失败:', error)
      }
    },
    async handleProductGroupItemChange(itemId) {
      if (itemId) {
        // 选择了产品组子项，清空单个产品和产品列表
        this.form.product = null
        this.productItems = []
        
        // 加载产品组子项详情
        try {
          const itemDetail = await productGroupItemAPI.getDetail(itemId)
          const product = this.productList.find(p => p.id === itemDetail.product)
          if (product) {
            this.selectedProduct = product
            this.form.product_name = product.name
            this.form.specification = product.specification
            this.form.unit = product.unit
            
            // 加载默认工序和物料
            await this.loadProductDefaults(product.id)
            this.calculateTotalAmount()
          }
        } catch (error) {
          console.error('加载产品组子项详情失败:', error)
        }
      } else {
        // 清空产品组子项，恢复产品列表模式
        this.productItems = [{
          product: null,
          quantity: 1,
          unit: '件',
          specification: ''
        }]
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
      // 如果选择了产品组子项，使用单个产品模式计算
      if (this.form.product_group_item && this.selectedProduct && this.form.quantity) {
        this.form.total_amount = parseFloat(
          (this.selectedProduct.unit_price * this.form.quantity).toFixed(2)
        )
      } else if (this.productItems.length > 0 && this.productItems[0].product) {
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
          product_group_item: data.product_group_item || null,
          product_name: data.product_name || '',
          specification: data.specification || '',
          quantity: data.quantity,
          unit: data.unit,
          artwork: data.artwork || null,
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
        
        // 加载产品列表（场景2：一个施工单包含多个产品）
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
        
        // 如果有产品ID或产品组子项，加载产品信息用于计算
        if (data.product) {
          this.selectedProduct = data.product_detail
        } else if (data.product_group_item_detail) {
          const itemDetail = data.product_group_item_detail
          const product = this.productList.find(p => p.id === itemDetail.product)
          if (product) {
            this.selectedProduct = product
          }
        }
        
        // 重新计算总金额
        this.calculateTotalAmount()
        
        // 加载已选择的工序
        if (data.order_processes && data.order_processes.length > 0) {
          this.selectedProcesses = data.order_processes.map(op => op.process)
          
          // 加载工序的部门指派和任务
          const assignments = {}
          for (const op of data.order_processes) {
            assignments[op.process] = {
              department: op.department || null,
              tasks: (op.tasks || []).map(task => ({
                work_content: task.work_content || '',
                production_quantity: task.production_quantity || 0,
                production_requirements: task.production_requirements || ''
              }))
            }
          }
          this.processAssignments = assignments
        } else {
          this.selectedProcesses = []
          this.processAssignments = {}
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
        if (!this.form.product_group_item) {
          if (this.productItems.length === 0 || !this.productItems[0].product) {
            if (!this.form.product) {
              this.$message.warning('请选择产品或添加产品列表')
              return
            }
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
          
          // 处理产品数据
          // 如果选择了产品组子项，不传 products_data
          // 如果使用产品列表模式，传 products_data
          if (this.form.product_group_item) {
            // 场景1：产品组模式，不传 products_data
            delete data.product
            delete data.product_name
            delete data.specification
            delete data.quantity
            delete data.unit
          } else if (this.productItems && this.productItems.length > 0 && this.productItems[0].product) {
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
          
          // 保存产品信息（场景2：多个产品模式，如果后端没有自动处理）
          if (data.products_data && data.products_data.length > 0) {
            await this.saveProducts(workOrderId)
          }
          
          // 添加选中的工序
          if (!this.isEdit) {
            await this.addSelectedProcesses(workOrderId)
          } else {
            // 编辑时保存工序指派和任务
            await this.saveProcessAssignments(workOrderId)
          }
          
          // 保存物料信息
          await this.saveMaterials(workOrderId)
          
          this.$router.push('/workorders')
        } catch (error) {
          this.$message.error(this.isEdit ? '保存失败' : '创建失败')
          console.error(error)
        } finally {
          this.submitting = false
        }
      })
    },
    async saveProducts(workOrderId) {
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
      
      // 添加新产品
      for (let i = 0; i < this.productItems.length; i++) {
        const item = this.productItems[i]
        if (item.product) {
          try {
            await workOrderProductAPI.create({
              work_order: workOrderId,
              product: item.product,
              quantity: item.quantity || 1,
              unit: item.unit || '件',
              specification: item.specification || '',
              sort_order: i
            })
          } catch (error) {
            console.error('保存产品失败:', error)
            throw error
          }
        }
      }
    },
    async addSelectedProcesses(workOrderId) {
      // 收集所有选中的工序ID
      const allSelectedIds = this.selectedProcesses
      
      // 按顺序添加工序，并保存部门指派和任务
      for (let i = 0; i < allSelectedIds.length; i++) {
        const processId = allSelectedIds[i]
        try {
          // 添加工序
          const processData = {
            process_id: processId,
            sequence: i + 1
          }
          
          const processResult = await workOrderAPI.addProcess(workOrderId, processData)
          const workOrderProcessId = processResult.id || processResult.process_id
          
          // 如果有部门指派，更新工序的部门
          const assignment = this.processAssignments[processId]
          if (assignment && assignment.department) {
            await workOrderProcessAPI.update(workOrderProcessId, {
              department: assignment.department
            })
          }
          
          // 如果有任务，创建任务
          if (assignment && assignment.tasks && assignment.tasks.length > 0) {
            for (const task of assignment.tasks) {
              if (task.work_content) {
                await workOrderTaskAPI.create({
                  work_order_process: workOrderProcessId,
                  work_content: task.work_content,
                  production_quantity: task.production_quantity || 0,
                  production_requirements: task.production_requirements || ''
                })
              }
            }
          }
        } catch (error) {
          console.error('添加工序失败:', error)
        }
      }
    },
    async saveProcessAssignments(workOrderId) {
      // 编辑时保存工序的部门指派和任务
      try {
        // 获取现有的工序列表
        const processesResponse = await workOrderProcessAPI.getList({ work_order: workOrderId })
        const existingProcesses = processesResponse.results || []
        
        for (const processId of this.selectedProcesses) {
          const assignment = this.processAssignments[processId]
          if (!assignment) continue
          
          // 找到对应的工序记录
          const existingProcess = existingProcesses.find(ep => ep.process === processId)
          if (!existingProcess) continue
          
          const workOrderProcessId = existingProcess.id
          
          // 更新部门
          if (assignment.department) {
            await workOrderProcessAPI.update(workOrderProcessId, {
              department: assignment.department
            })
          }
          
          // 获取现有任务
          const tasksResponse = await workOrderTaskAPI.getList({ work_order_process: workOrderProcessId })
          const existingTasks = tasksResponse.results || []
          
          // 删除现有任务
          for (const task of existingTasks) {
            await workOrderTaskAPI.delete(task.id)
          }
          
          // 创建新任务
          if (assignment.tasks && assignment.tasks.length > 0) {
            for (const task of assignment.tasks) {
              if (task.work_content) {
                await workOrderTaskAPI.create({
                  work_order_process: workOrderProcessId,
                  work_content: task.work_content,
                  production_quantity: task.production_quantity || 0,
                  production_requirements: task.production_requirements || ''
                })
              }
            }
          }
        }
      } catch (error) {
        console.error('保存工序指派失败:', error)
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
    addTask(processId) {
      if (!this.processAssignments[processId]) {
        this.$set(this.processAssignments, processId, {
          department: null,
          tasks: []
        })
      }
      this.processAssignments[processId].tasks.push({
        work_content: '',
        production_quantity: 0,
        production_requirements: ''
      })
    },
    removeTask(processId, taskIndex) {
      if (this.processAssignments[processId] && this.processAssignments[processId].tasks) {
        this.processAssignments[processId].tasks.splice(taskIndex, 1)
      }
    },
    updateProcessAssignments() {
      // 当工序选择变化时，更新工序指派信息
      const newAssignments = {}
      this.selectedProcesses.forEach(processId => {
        if (this.processAssignments[processId]) {
          newAssignments[processId] = this.processAssignments[processId]
        } else {
          newAssignments[processId] = {
            department: null,
            tasks: []
          }
        }
      })
      this.processAssignments = newAssignments
    },
    updateProcessDepartment(processId, departmentId) {
      // 更新工序的部门指派
      if (!this.processAssignments[processId]) {
        this.$set(this.processAssignments, processId, {
          department: null,
          tasks: []
        })
      }
      this.$set(this.processAssignments[processId], 'department', departmentId)
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
