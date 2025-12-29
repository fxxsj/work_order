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

        <el-form-item label="产品规格">
          <el-input
            v-model="form.specification"
            type="textarea"
            :rows="2"
            placeholder="选择产品后自动填充"
            :disabled="true"
          ></el-input>
        </el-form-item>

        <!-- 主材信息 -->
        <el-divider content-position="left">主材信息</el-divider>
        
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="纸张类型">
              <el-input v-model="form.paper_type" placeholder="如：铜版纸、哑粉纸、白卡纸"></el-input>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="纸张克数">
              <el-input v-model="form.paper_weight" placeholder="如：157g、200g、250g"></el-input>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="纸张品牌">
              <el-input v-model="form.paper_brand" placeholder="如：金东、晨鸣"></el-input>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="板材厚度">
              <el-input v-model="form.board_thickness" placeholder="如：3mm、5mm（如适用）"></el-input>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="尺寸">
              <el-input v-model="form.material_size" placeholder="如：A4、210x297mm"></el-input>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="用量">
              <el-input v-model="form.material_usage" placeholder="如：1000张、50平方米"></el-input>
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="主材备注">
          <el-input
            v-model="form.material_notes"
            type="textarea"
            :rows="2"
            placeholder="其他主材信息说明"
          ></el-input>
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
        
        <el-form-item label="印前工序">
          <el-checkbox-group v-model="selectedProcesses.prepress">
            <el-checkbox
              v-for="process in getProcessesByCategory('prepress')"
              :key="process.id"
              :label="process.id"
            >
              {{ process.name }}
            </el-checkbox>
          </el-checkbox-group>
        </el-form-item>

        <el-form-item label="印刷工序">
          <el-checkbox-group v-model="selectedProcesses.printing">
            <el-checkbox
              v-for="process in getProcessesByCategory('printing')"
              :key="process.id"
              :label="process.id"
            >
              {{ process.name }}
            </el-checkbox>
          </el-checkbox-group>
        </el-form-item>

        <el-form-item label="表面处理">
          <el-checkbox-group v-model="selectedProcesses.surface">
            <el-checkbox
              v-for="process in getProcessesByCategory('surface')"
              :key="process.id"
              :label="process.id"
            >
              {{ process.name }}
            </el-checkbox>
          </el-checkbox-group>
        </el-form-item>

        <el-form-item label="后道加工">
          <el-checkbox-group v-model="selectedProcesses.postpress">
            <el-checkbox
              v-for="process in getProcessesByCategory('postpress')"
              :key="process.id"
              :label="process.id"
            >
              {{ process.name }}
            </el-checkbox>
          </el-checkbox-group>
        </el-form-item>

        <el-form-item label="复合/裱合">
          <el-checkbox-group v-model="selectedProcesses.laminating">
            <el-checkbox
              v-for="process in getProcessesByCategory('laminating')"
              :key="process.id"
              :label="process.id"
            >
              {{ process.name }}
            </el-checkbox>
          </el-checkbox-group>
        </el-form-item>

        <el-form-item label="成型/包装">
          <el-checkbox-group v-model="selectedProcesses.forming">
            <el-checkbox
              v-for="process in getProcessesByCategory('forming')"
              :key="process.id"
              :label="process.id"
            >
              {{ process.name }}
            </el-checkbox>
          </el-checkbox-group>
        </el-form-item>

        <el-divider></el-divider>

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
import { workOrderAPI, customerAPI, productAPI, processCategoryAPI, processAPI, materialAPI, workOrderMaterialAPI } from '@/api/workorder'

export default {
  name: 'WorkOrderForm',
  data() {
    return {
      isEdit: false,
      submitting: false,
      customerList: [],
      productList: [],
      materialList: [],
      processCategories: [],
      allProcesses: [],
      selectedProduct: null,
      materialItems: [], // 物料列表
      selectedProcesses: {
        prepress: [],
        printing: [],
        surface: [],
        postpress: [],
        laminating: [],
        forming: []
      },
      form: {
        customer: null,
        product: null,
        product_name: '',
        specification: '',
        quantity: 1,
        unit: '件',
        paper_type: '',
        paper_weight: '',
        paper_brand: '',
        board_thickness: '',
        material_size: '',
        material_usage: '',
        material_notes: '',
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
  created() {
    this.isEdit = !!this.$route.params.id
    this.loadCustomerList()
    this.loadProductList()
    this.loadMaterialList()
    this.loadProcessCategories()
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
    async loadProcessCategories() {
      try {
        const response = await processCategoryAPI.getList({ is_active: true, page_size: 100 })
        this.processCategories = response.results || []
      } catch (error) {
        console.error('加载工序分类失败:', error)
      }
    },
    async loadAllProcesses() {
      try {
        const response = await processAPI.getList({ is_active: true, page_size: 100 })
        this.allProcesses = response.results || []
      } catch (error) {
        console.error('加载工序列表失败:', error)
      }
    },
    getProcessesByCategory(categoryCode) {
      // 根据分类code获取工序
      const category = this.processCategories.find(c => c.code === categoryCode)
      if (!category) return []
      return this.allProcesses.filter(p => p.category === category.id)
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
        
        // 自动填充主材信息（如果产品有默认值）
        if (product.paper_type) {
          this.form.paper_type = product.paper_type
        }
        if (product.paper_weight) {
          this.form.paper_weight = product.paper_weight
        }
        if (product.paper_brand) {
          this.form.paper_brand = product.paper_brand
        }
        if (product.board_thickness) {
          this.form.board_thickness = product.board_thickness
        }
        if (product.material_size) {
          this.form.material_size = product.material_size
        }
        if (product.material_usage) {
          this.form.material_usage = product.material_usage
        }
        
        // 获取产品详情（包含默认工序）
        try {
          const productDetail = await productAPI.getDetail(productId)
          if (productDetail.default_processes && productDetail.default_processes.length > 0) {
            // 清空之前的选择
            this.selectedProcesses = {
              prepress: [],
              printing: [],
              surface: [],
              postpress: [],
              laminating: [],
              forming: []
            }
            
            // 按类别分组选中的工序
            productDetail.default_processes.forEach(processId => {
              const process = this.allProcesses.find(p => p.id === processId)
              if (process) {
                const category = this.processCategories.find(c => c.id === process.category)
                if (category && this.selectedProcesses[category.code]) {
                  this.selectedProcesses[category.code].push(processId)
                }
              }
            })
          }
        } catch (error) {
          console.error('加载产品默认工序失败:', error)
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
          paper_type: data.paper_type || '',
          paper_weight: data.paper_weight || '',
          paper_brand: data.paper_brand || '',
          board_thickness: data.board_thickness || '',
          material_size: data.material_size || '',
          material_usage: data.material_usage || '',
          material_notes: data.material_notes || '',
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
          this.selectedProcesses = {
            prepress: [],
            printing: [],
            surface: [],
            postpress: [],
            laminating: [],
            forming: []
          }
          
          data.order_processes.forEach(op => {
            const process = this.allProcesses.find(p => p.id === op.process)
            if (process) {
              const category = this.processCategories.find(c => c.id === process.category)
              if (category && this.selectedProcesses[category.code]) {
                this.selectedProcesses[category.code].push(op.process)
              }
            }
          })
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
      const allSelectedIds = [
        ...this.selectedProcesses.prepress,
        ...this.selectedProcesses.printing,
        ...this.selectedProcesses.surface,
        ...this.selectedProcesses.postpress,
        ...this.selectedProcesses.laminating,
        ...this.selectedProcesses.forming
      ]
      
      // 按顺序添加工序
      for (let i = 0; i < allSelectedIds.length; i++) {
        try {
          await workOrderAPI.addProcess(workOrderId, {
            process_id: allSelectedIds[i],
            sequence: i + 1
          })
        } catch (error) {
          console.error('添加工序失败:', error)
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
    handleMaterialChange(index) {
      // 物料选择变化时的处理（如果需要）
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

