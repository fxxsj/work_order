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

        <el-form-item label="产品" prop="product">
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

        <el-row :gutter="20">
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

        <el-form-item label="产品规格">
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
                placeholder="选择日期"
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
                placeholder="选择日期"
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
            placeholder="选择日期"
            style="width: 100%;"
            value-format="yyyy-MM-dd"
          ></el-date-picker>
        </el-form-item>

        <el-form-item label="总金额">
          <el-input-number
            v-model="form.total_amount"
            :min="0"
            :precision="2"
            style="width: 100%;"
            :disabled="true"
          ></el-input-number>
          <span style="color: #909399; font-size: 12px;">根据产品单价和数量自动计算</span>
        </el-form-item>

        <el-divider content-position="left">图稿和刀模</el-divider>
        
        <el-row :gutter="20">
          <el-col :span="12">
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
          </el-col>
          <el-col :span="12">
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
          </el-col>
        </el-row>

        <el-form-item label="拼版数量">
          <el-input-number
            v-model="form.imposition_quantity"
            :min="1"
            style="width: 100%;"
            placeholder="如：2拼、4拼等"
          ></el-input-number>
          <span style="color: #909399; font-size: 12px; margin-left: 10px;">如：2拼、4拼等</span>
        </el-form-item>

        <!-- 物料信息 -->
        <el-divider content-position="left">物料信息</el-divider>
        
        <el-form-item label="物料列表">
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
                    @change="handleMaterialChange(scope.$index)"
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

        <!-- 工序选择 -->
        <el-divider content-position="left">工序选择</el-divider>
        
        <el-form-item label="工序">
          <el-checkbox-group v-model="selectedProcesses" style="width: 100%;">
            <el-checkbox
              v-for="process in allProcesses"
              :key="process.id"
              :label="process.id"
              :disabled="!process.is_active"
            >
              {{ process.name }}
            </el-checkbox>
          </el-checkbox-group>
        </el-form-item>

        <!-- 工序部门指派和任务 -->
        <el-divider content-position="left">工序派工</el-divider>
        
        <div v-if="selectedProcesses.length > 0" style="margin-bottom: 20px;">
          <el-card
            v-for="processId in selectedProcesses"
            :key="processId"
            shadow="hover"
            style="margin-bottom: 15px;"
          >
            <div slot="header" style="display: flex; justify-content: space-between; align-items: center;">
              <span style="font-weight: bold;">
                {{ getProcessName(processId) }}
              </span>
            </div>
            
            <el-form-item label="生产部门">
              <el-select
                :value="processAssignments[processId] ? processAssignments[processId].department : null"
                @input="updateProcessDepartment(processId, $event)"
                placeholder="请选择生产部门"
                filterable
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
              <el-button
                type="primary"
                size="small"
                icon="el-icon-plus"
                @click="addTask(processId)"
              >
                添加任务
              </el-button>
              
              <div style="margin-top: 15px;">
                <el-table
                  :data="processAssignments[processId] && processAssignments[processId].tasks || []"
                  border
                  style="width: 100%"
                >
                  <el-table-column label="施工内容" min-width="200">
                    <template slot-scope="scope">
                      <el-input
                        v-model="scope.row.work_content"
                        placeholder="请输入施工内容"
                        size="small"
                      ></el-input>
                    </template>
                  </el-table-column>
                  <el-table-column label="生产数量" width="150">
                    <template slot-scope="scope">
                      <el-input-number
                        v-model="scope.row.production_quantity"
                        :min="0"
                        size="small"
                        style="width: 100%;"
                      ></el-input-number>
                    </template>
                  </el-table-column>
                  <el-table-column label="生产要求" min-width="200">
                    <template slot-scope="scope">
                      <el-input
                        v-model="scope.row.production_requirements"
                        type="textarea"
                        :rows="2"
                        placeholder="请输入生产要求"
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
                        @click="removeTask(processId, scope.$index)"
                      ></el-button>
                    </template>
                  </el-table-column>
                </el-table>
              </div>
            </el-form-item>
          </el-card>
        </div>
        <div v-else style="color: #909399; text-align: center; padding: 20px;">
          请先选择工序
        </div>

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
import { workOrderAPI, customerAPI, productAPI, processAPI, materialAPI, workOrderMaterialAPI, artworkAPI, dieAPI, departmentAPI, workOrderProcessAPI, workOrderTaskAPI } from '@/api/workorder'

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
      materialItems: [], // 物料列表
      selectedProcesses: [],
      form: {
        customer: null,
        product: null,
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
        product: [
          { required: true, message: '请选择产品', trigger: 'change' }
        ],
        quantity: [
          { required: true, message: '请输入数量', trigger: 'blur' }
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
    async handleProductChange(productId) {
      // 找到选中的产品
      const product = this.productList.find(p => p.id === productId)
      if (product) {
        this.selectedProduct = product
        // 自动填充产品信息
        this.form.product_name = product.name
        this.form.specification = product.specification
        this.form.unit = product.unit
        
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
        
        // 自动计算总价
        this.calculateTotalAmount()
      }
    },
    calculateTotalAmount() {
      if (this.selectedProduct && this.form.quantity) {
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
          product_name: data.product_name,
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
        
        // 如果有产品ID，加载产品信息用于计算
        if (data.product) {
          this.selectedProduct = data.product_detail
        }
        
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
          
          // 保存任务
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
          if (assignment.department !== existingProcess.department) {
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
    formatDate(date) {
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      return `${year}-${month}-${day}`
    },
    getProcessName(processId) {
      const process = this.allProcesses.find(p => p.id === processId)
      return process ? process.name : `工序 ${processId}`
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
    }
  }
}
</script>

<style scoped>
.workorder-form {
  padding: 20px;
}

.form-container {
  max-width: 800px;
}
</style>

