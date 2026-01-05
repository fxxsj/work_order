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

        <!-- 工序选择（移到前面，在版选择之前） -->
        <el-form-item label="工序" prop="processes">
          <el-checkbox-group v-model="selectedProcesses" @change="handleProcessChange">
            <el-checkbox
              v-for="process in allProcesses"
              :key="process.id"
              :label="process.id"
              :disabled="isPlateMakingProcess(process) || isCuttingProcess(process) || isPackagingProcess(process)"
            >
              {{ process.name }}
            </el-checkbox>
          </el-checkbox-group>
          <div style="color: #909399; font-size: 12px; margin-top: 10px;">
            提示：选择工序后，系统会根据工序要求显示对应的版选择项。制版、开料、包装工序会根据条件自动勾选。
          </div>
        </el-form-item>

        <el-divider></el-divider>

        <!-- 图稿选择（根据工序动态显示） -->
        <el-form-item 
          label="选择图稿" 
          prop="artworks"
          v-if="shouldShowArtworkSelect"
          :required="isArtworkRequired"
        >
          <el-select
            v-model="form.artworks"
            :placeholder="isArtworkRequired ? '请选择图稿（必选）' : '请选择图稿（可选，如未选择将生成设计任务）'"
            filterable
            clearable
            multiple
            :collapse-tags="shouldCollapseTags"
            style="width: 100%;"
            @change="handleArtworkChange"
          >
            <el-option
              v-for="artwork in artworkList"
              :key="artwork.id"
              :label="`${artwork.code} - ${artwork.name}`"
              :value="artwork.id"
            ></el-option>
          </el-select>
          <span style="color: #909399; font-size: 12px; margin-left: 10px;">
            <span v-if="isArtworkRequired" style="color: #F56C6C;">必选：</span>
            <span v-else>可选：</span>
            如果已有图稿，请选择；如果未选择，将生成设计图稿任务。可多选（如纸卡双面印刷的面版和底版）
          </span>
        </el-form-item>

        <!-- 印刷形式（仅在选择了图稿时显示） -->
        <el-form-item label="印刷形式" v-if="hasArtworkSelected">
          <el-radio-group v-model="form.printing_type">
            <el-radio label="front">正面印刷</el-radio>
            <el-radio label="back">背面印刷</el-radio>
            <el-radio label="self_reverse">自反印刷</el-radio>
            <el-radio label="reverse_gripper">反咬口印刷</el-radio>
            <el-radio label="register">套版印刷</el-radio>
          </el-radio-group>
        </el-form-item>

        <!-- 印刷色数（仅在选择了图稿时显示） -->
        <template v-if="hasArtworkSelected">
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
        <!-- 产品列表（一个施工单可以包含多个产品） -->
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

        <!-- 刀模选择（根据工序动态显示） -->
        <el-form-item 
          label="选择刀模" 
          prop="dies"
          v-if="shouldShowDieSelect"
          :required="isDieRequired"
        >
          <el-select
            v-model="form.dies"
            :placeholder="isDieRequired ? '请选择刀模（必选）' : '请选择刀模（可选，如未选择将生成设计任务）'"
            filterable
            clearable
            multiple
            :collapse-tags="shouldCollapseDieTags"
            style="width: 100%;"
            @change="handleDieChange"
          >
            <el-option
              v-for="die in dieList"
              :key="die.id"
              :label="`${die.code} - ${die.name}`"
              :value="die.id"
            ></el-option>
          </el-select>
          <span style="color: #909399; font-size: 12px; margin-left: 10px;">
            <span v-if="isDieRequired" style="color: #F56C6C;">必选：</span>
            <span v-else>可选：</span>
            如果已有刀模，请选择；如果未选择，将生成设计刀模任务。可多选
          </span>
        </el-form-item>

        <!-- 烫金版选择（根据工序动态显示） -->
        <el-form-item 
          label="选择烫金版" 
          prop="foiling_plates"
          v-if="shouldShowFoilingPlateSelect"
          :required="isFoilingPlateRequired"
        >
          <el-select
            v-model="form.foiling_plates"
            :placeholder="isFoilingPlateRequired ? '请选择烫金版（必选）' : '请选择烫金版（可选，如未选择将生成设计任务）'"
            filterable
            clearable
            multiple
            :collapse-tags="shouldCollapseFoilingPlateTags"
            style="width: 100%;"
            @change="handleFoilingPlateChange"
          >
            <el-option
              v-for="plate in foilingPlateList"
              :key="plate.id"
              :label="`${plate.code} - ${plate.name}${plate.foiling_type === 'gold' ? '（烫金）' : '（烫银）'}`"
              :value="plate.id"
            ></el-option>
          </el-select>
          <span style="color: #909399; font-size: 12px; margin-left: 10px;">
            <span v-if="isFoilingPlateRequired" style="color: #F56C6C;">必选：</span>
            <span v-else>可选：</span>
            如果已有烫金版，请选择；如果未选择，将生成设计任务。可多选
          </span>
        </el-form-item>

        <!-- 压凸版选择（根据工序动态显示） -->
        <el-form-item 
          label="选择压凸版" 
          prop="embossing_plates"
          v-if="shouldShowEmbossingPlateSelect"
          :required="isEmbossingPlateRequired"
        >
          <el-select
            v-model="form.embossing_plates"
            :placeholder="isEmbossingPlateRequired ? '请选择压凸版（必选）' : '请选择压凸版（可选，如未选择将生成设计任务）'"
            filterable
            clearable
            multiple
            :collapse-tags="shouldCollapseEmbossingPlateTags"
            style="width: 100%;"
            @change="handleEmbossingPlateChange"
          >
            <el-option
              v-for="plate in embossingPlateList"
              :key="plate.id"
              :label="`${plate.code} - ${plate.name}`"
              :value="plate.id"
            ></el-option>
          </el-select>
          <span style="color: #909399; font-size: 12px; margin-left: 10px;">
            <span v-if="isEmbossingPlateRequired" style="color: #F56C6C;">必选：</span>
            <span v-else>可选：</span>
            如果已有压凸版，请选择；如果未选择，将生成设计任务。可多选
          </span>
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
              <el-table-column label="需要开料" width="100" align="center">
                <template slot-scope="scope">
                  <el-switch
                    v-model="scope.row.need_cutting"
                    size="small"
                    @change="updateCuttingProcess"
                  ></el-switch>
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
import { workOrderAPI, customerAPI, productAPI, processAPI, materialAPI, workOrderMaterialAPI, workOrderProductAPI, artworkAPI, dieAPI, foilingPlateAPI, embossingPlateAPI, workOrderProcessAPI } from '@/api/workorder'

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
      foilingPlateList: [],
      embossingPlateList: [],
      allProcesses: [],
      selectedProduct: null,
      productItems: [], // 产品列表（可手动添加或从图稿自动填充）
      materialItems: [], // 物料列表
      selectedProcesses: [],
      isLoadingWorkOrderData: false, // 标志，用于防止在数据加载时清空数据
      form: {
        customer: null,
        artworks: [], // 图稿列表（支持多选）
        dies: [], // 刀模列表（支持多选）
        foiling_plates: [], // 烫金版列表（支持多选）
        embossing_plates: [], // 压凸版列表（支持多选）
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
        artworks: [
          { 
            validator: (rule, value, callback) => {
              if (this.isArtworkRequired) {
                if (!value || value.length === 0) {
                  // 使用 try-catch 防止方法不存在或出错
                  try {
                    const processes = this.getProcessesRequiringArtwork ? this.getProcessesRequiringArtwork() : []
                    const processNames = processes.map(p => p ? p.name : '').filter(n => n).join('、')
                    callback(new Error(`选择了需要图稿的工序${processNames ? `（${processNames}）` : ''}，请至少选择一个图稿`))
                  } catch (error) {
                    callback(new Error('选择了需要图稿的工序，请至少选择一个图稿'))
                  }
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
        dies: [
          { 
            validator: (rule, value, callback) => {
              if (this.isDieRequired) {
                if (!value || value.length === 0) {
                  // 使用 try-catch 防止方法不存在
                  try {
                    const processes = this.getProcessesRequiringDie ? this.getProcessesRequiringDie() : []
                    const processNames = processes.map(p => p ? p.name : '').filter(n => n).join('、')
                    callback(new Error(`选择了需要刀模的工序（${processNames}），请至少选择一个刀模`))
                  } catch (error) {
                    callback(new Error('选择了需要刀模的工序，请至少选择一个刀模'))
                  }
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
        foiling_plates: [
          {
            validator: (rule, value, callback) => {
              if (this.isFoilingPlateRequired) {
                if (!value || value.length === 0) {
                  // 使用 try-catch 防止方法不存在或出错
                  try {
                    const processes = this.getProcessesRequiringFoilingPlate ? this.getProcessesRequiringFoilingPlate() : []
                    const processNames = processes.map(p => p ? p.name : '').filter(n => n).join('、')
                    callback(new Error(`选择了需要烫金版的工序${processNames ? `（${processNames}）` : ''}，请至少选择一个烫金版`))
                  } catch (error) {
                    callback(new Error('选择了需要烫金版的工序，请至少选择一个烫金版'))
                  }
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
        embossing_plates: [
          {
            validator: (rule, value, callback) => {
              if (this.isEmbossingPlateRequired) {
                if (!value || value.length === 0) {
                  // 使用 try-catch 防止方法不存在或出错
                  try {
                    const processes = this.getProcessesRequiringEmbossingPlate ? this.getProcessesRequiringEmbossingPlate() : []
                    const processNames = processes.map(p => p ? p.name : '').filter(n => n).join('、')
                    callback(new Error(`选择了需要压凸版的工序${processNames ? `（${processNames}）` : ''}，请至少选择一个压凸版`))
                  } catch (error) {
                    callback(new Error('选择了需要压凸版的工序，请至少选择一个压凸版'))
                  }
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
    shouldCollapseFoilingPlateTags() {
      // 至少显示3个选中的选项标签后才显示+n标签
      const validPlates = this.form.foiling_plates ? this.form.foiling_plates.filter(id => id !== null) : []
      return validPlates.length > 3
    },
    shouldCollapseEmbossingPlateTags() {
      // 至少显示3个选中的选项标签后才显示+n标签
      const validPlates = this.form.embossing_plates ? this.form.embossing_plates.filter(id => id !== null) : []
      return validPlates.length > 3
    },
    // 根据工序选择判断是否显示版的选择
    shouldShowArtworkSelect() {
      // 检查是否有工序需要图稿
      const selectedProcesses = this.selectedProcesses || []
      return selectedProcesses.some(processId => {
        const process = this.allProcesses.find(p => p.id === processId)
        return process && process.requires_artwork
      })
    },
    isArtworkRequired() {
      // 检查是否有工序要求图稿必选
      const selectedProcesses = this.selectedProcesses || []
      return selectedProcesses.some(processId => {
        const process = this.allProcesses.find(p => p.id === processId)
        return process && process.requires_artwork && process.artwork_required
      })
    },
    shouldShowDieSelect() {
      // 检查是否有工序需要刀模
      const selectedProcesses = this.selectedProcesses || []
      return selectedProcesses.some(processId => {
        const process = this.allProcesses.find(p => p.id === processId)
        return process && process.requires_die
      })
    },
    isDieRequired() {
      // 检查是否有工序要求刀模必选
      const selectedProcesses = this.selectedProcesses || []
      return selectedProcesses.some(processId => {
        const process = this.allProcesses.find(p => p.id === processId)
        return process && process.requires_die && process.die_required
      })
    },
    shouldShowFoilingPlateSelect() {
      // 检查是否有工序需要烫金版
      const selectedProcesses = this.selectedProcesses || []
      return selectedProcesses.some(processId => {
        const process = this.allProcesses.find(p => p.id === processId)
        return process && process.requires_foiling_plate
      })
    },
    isFoilingPlateRequired() {
      // 检查是否有工序要求烫金版必选
      const selectedProcesses = this.selectedProcesses || []
      return selectedProcesses.some(processId => {
        const process = this.allProcesses.find(p => p.id === processId)
        return process && process.requires_foiling_plate && process.foiling_plate_required
      })
    },
    shouldShowEmbossingPlateSelect() {
      // 检查是否有工序需要压凸版
      const selectedProcesses = this.selectedProcesses || []
      return selectedProcesses.some(processId => {
        const process = this.allProcesses.find(p => p.id === processId)
        return process && process.requires_embossing_plate
      })
    },
    isEmbossingPlateRequired() {
      // 检查是否有工序要求压凸版必选
      const selectedProcesses = this.selectedProcesses || []
      return selectedProcesses.some(processId => {
        const process = this.allProcesses.find(p => p.id === processId)
        return process && process.requires_embossing_plate && process.embossing_plate_required
      })
    },
    // 获取需要图稿的工序列表
    getProcessesRequiringArtwork() {
      const selectedProcesses = this.selectedProcesses || []
      return selectedProcesses
        .map(processId => this.allProcesses.find(p => p.id === processId))
        .filter(p => p && p.requires_artwork && p.artwork_required)
    },
    // 获取需要刀模的工序列表
    getProcessesRequiringDie() {
      const selectedProcesses = this.selectedProcesses || []
      return selectedProcesses
        .map(processId => this.allProcesses.find(p => p.id === processId))
        .filter(p => p && p.requires_die && p.die_required)
    },
    // 获取需要烫金版的工序列表
    getProcessesRequiringFoilingPlate() {
      const selectedProcesses = this.selectedProcesses || []
      return selectedProcesses
        .map(processId => this.allProcesses.find(p => p.id === processId))
        .filter(p => p && p.requires_foiling_plate && p.foiling_plate_required)
    },
    // 获取需要压凸版的工序列表
    getProcessesRequiringEmbossingPlate() {
      const selectedProcesses = this.selectedProcesses || []
      return selectedProcesses
        .map(processId => this.allProcesses.find(p => p.id === processId))
        .filter(p => p && p.requires_embossing_plate && p.embossing_plate_required)
    },
    shouldSelectCuttingProcess() {
      // 判断是否需要选中开料工序
      // 如果所有物料都不需要开料，则不需要开料工序
      if (!this.materialItems || this.materialItems.length === 0) {
        return false
      }
      // 检查是否至少有一个物料需要开料
      return this.materialItems.some(item => item.need_cutting === true)
    },
    cuttingProcessId() {
      // 查找开料工序的ID（使用 code 字段精确匹配）
      const cuttingProcess = this.allProcesses.find(p => p.code === 'CUT')
      return cuttingProcess ? cuttingProcess.id : null
    },
    shouldSelectPackagingProcess() {
      // 判断是否需要选中包装工序
      // 只要产品列表不为空，就自动勾选包装工序
      return this.productItems && this.productItems.length > 0
    },
    packagingProcessId() {
      // 查找包装工序的ID（使用 code 字段精确匹配）
      const packagingProcess = this.allProcesses.find(p => p.code === 'PACK')
      return packagingProcess ? packagingProcess.id : null
    },
    hasArtworkSelected() {
      // 判断是否选择了图稿
      if (!this.form.artworks || this.form.artworks.length === 0) {
        return false
      }
      const validArtworks = this.form.artworks.filter(id => id !== null)
      return validArtworks.length > 0
    }
  },
  watch: {
    // 监听工序选择变化，清空不需要的版选择
    selectedProcesses(newVal, oldVal) {
      // 如果正在加载数据，不执行清空操作
      if (this.isLoadingWorkOrderData) {
        return
      }
      
      // 如果 allProcesses 还没有加载完成，不执行清空操作（避免在数据加载时错误清空）
      if (!this.allProcesses || this.allProcesses.length === 0) {
        return
      }
      
      // 如果是编辑模式且正在加载数据（oldVal 为空或 undefined），不执行清空操作
      if (this.isEdit && (!oldVal || oldVal.length === 0)) {
        return
      }
      
      // 检查是否有工序需要图稿
      const hasArtworkProcess = newVal.some(processId => {
        const process = this.allProcesses.find(p => p.id === processId)
        return process && process.requires_artwork
      })
      if (!hasArtworkProcess && this.form.artworks && this.form.artworks.length > 0) {
        // 如果没有工序需要图稿，清空图稿选择
        this.form.artworks = []
        this.form.printing_type = 'none'
        this.form.printing_cmyk_colors = []
        this.form.printing_other_colors = []
      }
      
      // 检查是否有工序需要刀模
      const hasDieProcess = newVal.some(processId => {
        const process = this.allProcesses.find(p => p.id === processId)
        return process && process.requires_die
      })
      if (!hasDieProcess && this.form.dies && this.form.dies.length > 0) {
        // 如果没有工序需要刀模，清空刀模选择
        this.form.dies = []
      }
      
      // 检查是否有工序需要烫金版
      const hasFoilingPlateProcess = newVal.some(processId => {
        const process = this.allProcesses.find(p => p.id === processId)
        return process && process.requires_foiling_plate
      })
      if (!hasFoilingPlateProcess && this.form.foiling_plates && this.form.foiling_plates.length > 0) {
        // 如果没有工序需要烫金版，清空烫金版选择
        this.form.foiling_plates = []
      }
      
      // 检查是否有工序需要压凸版
      const hasEmbossingPlateProcess = newVal.some(processId => {
        const process = this.allProcesses.find(p => p.id === processId)
        return process && process.requires_embossing_plate
      })
      if (!hasEmbossingPlateProcess && this.form.embossing_plates && this.form.embossing_plates.length > 0) {
        // 如果没有工序需要压凸版，清空压凸版选择
        this.form.embossing_plates = []
      }
      
      // 更新制版工序状态（制版工序根据版的选择自动勾选）
      this.updatePlateMakingProcess()
    },
    // 监听版选择变化，自动勾选/取消勾选制版工序
    'form.artworks'() {
      this.updatePlateMakingProcess()
    },
    'form.dies'() {
      this.updatePlateMakingProcess()
    },
    'form.foiling_plates'() {
      this.updatePlateMakingProcess()
    },
    'form.embossing_plates'() {
      this.updatePlateMakingProcess()
    },
    // 监听物料列表变化，自动勾选/取消勾选开料工序
    'materialItems': {
      handler() {
        this.updateCuttingProcess()
      },
      deep: true
    },
    // 监听产品列表变化，自动勾选/取消勾选包装工序
    'productItems': {
      handler() {
        this.updatePackagingProcess()
      },
      deep: true
    },
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
    this.loadFoilingPlateList()
    this.loadEmbossingPlateList()
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
    async loadFoilingPlateList() {
      try {
        const response = await foilingPlateAPI.getList({ page_size: 100 })
        this.foilingPlateList = response.results || []
      } catch (error) {
        console.error('加载烫金版列表失败:', error)
      }
    },
    async loadEmbossingPlateList() {
      try {
        const response = await embossingPlateAPI.getList({ page_size: 100 })
        this.embossingPlateList = response.results || []
      } catch (error) {
        console.error('加载压凸版列表失败:', error)
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
        // 工序列表加载完成后，更新制版、印刷、模切、开料、包装工序状态
        this.$nextTick(() => {
          this.updateCuttingProcess()
          this.updatePackagingProcess()
        })
      } catch (error) {
        console.error('加载工序列表失败:', error)
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
        // 更新制版工序状态
        this.updatePlateMakingProcess()
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
        const allFoilingPlates = new Set() // 收集所有图稿关联的烫金版（去重）
        const allEmbossingPlates = new Set() // 收集所有图稿关联的压凸版（去重）
        
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
          
          // 收集图稿关联的烫金版
          if (artworkDetail.foiling_plates && Array.isArray(artworkDetail.foiling_plates)) {
            artworkDetail.foiling_plates.forEach(plateId => {
              if (plateId) {
                allFoilingPlates.add(plateId)
              }
            })
          }
          
          // 收集图稿关联的压凸版
          if (artworkDetail.embossing_plates && Array.isArray(artworkDetail.embossing_plates)) {
            artworkDetail.embossing_plates.forEach(plateId => {
              if (plateId) {
                allEmbossingPlates.add(plateId)
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
        
        // 自动填充关联的烫金版（合并所有图稿的烫金版，去重）
        if (allFoilingPlates.size > 0) {
          this.form.foiling_plates = Array.from(allFoilingPlates)
        } else {
          // 如果没有关联烫金版，保持当前选择（不清空，允许用户手动选择）
        }
        
        // 自动填充关联的压凸版（合并所有图稿的压凸版，去重）
        if (allEmbossingPlates.size > 0) {
          this.form.embossing_plates = Array.from(allEmbossingPlates)
        } else {
          // 如果没有关联压凸版，保持当前选择（不清空，允许用户手动选择）
        }
        
        // 根据自动填充的版，自动选中对应的工序
        await this.$nextTick()
        this.autoSelectProcessesForPlates()
        
        // 更新制版工序状态（因为可能自动填充了版）
        this.updatePlateMakingProcess()
        
        // 触发刀模、烫金版和压凸版的验证
        this.$nextTick(() => {
          this.$refs.form.validateField('dies')
          this.$refs.form.validateField('foiling_plates')
          this.$refs.form.validateField('embossing_plates')
        })
      } catch (error) {
        console.error('加载图稿详情失败:', error)
        this.$message.error('加载图稿详情失败')
      }
      
      // 触发验证
      this.$nextTick(() => {
        this.$refs.form.validateField('artworks')
      })
    },
    handleDieChange() {
      // 根据版的选择，自动选中对应的工序
      this.autoSelectProcessesForPlates()
      // 更新制版工序状态
      this.updatePlateMakingProcess()
      // 触发验证
      this.$nextTick(() => {
        this.$refs.form.validateField('dies')
      })
    },
    handleFoilingPlateChange() {
      // 根据版的选择，自动选中对应的工序
      this.autoSelectProcessesForPlates()
      // 更新制版工序状态
      this.updatePlateMakingProcess()
      // 触发验证
      this.$nextTick(() => {
        this.$refs.form.validateField('foiling_plates')
      })
    },
    handleEmbossingPlateChange() {
      // 根据版的选择，自动选中对应的工序
      this.autoSelectProcessesForPlates()
      // 更新制版工序状态
      this.updatePlateMakingProcess()
      // 触发验证
      this.$nextTick(() => {
        this.$refs.form.validateField('embossing_plates')
      })
    },
    isPlateMakingProcess(process) {
      // 判断是否为制版工序（使用 code 字段精确匹配）
      return process.code === 'CTP'
    },
    plateMakingProcessId() {
      // 查找制版工序的ID（使用 code 字段精确匹配）
      const plateMakingProcess = this.allProcesses.find(p => p.code === 'CTP')
      return plateMakingProcess ? plateMakingProcess.id : null
    },
    shouldSelectPlateMakingProcess() {
      // 判断是否需要选中制版工序
      // 当施工单中包含图稿、刀模、烫金版和压凸版至少其中一项时，自动勾选制版工序
      const hasArtwork = this.form.artworks && this.form.artworks.length > 0
      const hasDie = this.form.dies && this.form.dies.length > 0
      const hasFoilingPlate = this.form.foiling_plates && this.form.foiling_plates.length > 0
      const hasEmbossingPlate = this.form.embossing_plates && this.form.embossing_plates.length > 0
      
      return hasArtwork || hasDie || hasFoilingPlate || hasEmbossingPlate
    },
    updatePlateMakingProcess() {
      // 更新制版工序的选中状态（根据版的选择自动勾选/取消勾选）
      if (!this.plateMakingProcessId) {
        return // 如果没有找到制版工序，直接返回
      }
      
      const shouldSelect = this.shouldSelectPlateMakingProcess
      const isSelected = this.selectedProcesses.includes(this.plateMakingProcessId)
      
      if (shouldSelect && !isSelected) {
        // 需要制版但未选中，自动选中
        this.selectedProcesses.push(this.plateMakingProcessId)
      } else if (!shouldSelect && isSelected) {
        // 不需要制版但已选中，取消选中
        const index = this.selectedProcesses.indexOf(this.plateMakingProcessId)
        if (index > -1) {
          this.selectedProcesses.splice(index, 1)
        }
      }
    },
    autoSelectProcessesForPlates() {
      // 根据选中的版，自动选中对应的工序
      if (!this.allProcesses || this.allProcesses.length === 0) {
        return // 如果工序列表未加载，直接返回
      }
      
      const processesToAdd = new Set()
      
      // 如果选中了刀模，自动选中"模切"工序
      if (this.form.dies && this.form.dies.length > 0) {
        const dieCuttingProcess = this.allProcesses.find(p => 
          p.name && (p.name.includes('模切') || p.name.includes('刀模'))
        )
        if (dieCuttingProcess && !this.selectedProcesses.includes(dieCuttingProcess.id)) {
          processesToAdd.add(dieCuttingProcess.id)
        }
      }
      
      // 如果选中了烫金版，根据类型自动选中"烫金"或"烫银"工序
      if (this.form.foiling_plates && this.form.foiling_plates.length > 0 && this.foilingPlateList && this.foilingPlateList.length > 0) {
        // 收集所有选中烫金版的类型
        const foilingTypes = new Set()
        this.form.foiling_plates.forEach(plateId => {
          const plate = this.foilingPlateList.find(p => p.id === plateId)
          if (plate && plate.foiling_type) {
            foilingTypes.add(plate.foiling_type)
          }
        })
        
        // 如果包含烫金类型，选中"烫金"工序
        if (foilingTypes.has('gold')) {
          const goldFoilingProcess = this.allProcesses.find(p => 
            p.name && p.name.includes('烫金') && !p.name.includes('烫银')
          )
          if (goldFoilingProcess && !this.selectedProcesses.includes(goldFoilingProcess.id)) {
            processesToAdd.add(goldFoilingProcess.id)
          }
        }
        
        // 如果包含烫银类型，选中"烫银"工序
        if (foilingTypes.has('silver')) {
          const silverFoilingProcess = this.allProcesses.find(p => 
            p.name && p.name.includes('烫银')
          )
          if (silverFoilingProcess && !this.selectedProcesses.includes(silverFoilingProcess.id)) {
            processesToAdd.add(silverFoilingProcess.id)
          }
        }
      }
      
      // 如果选中了压凸版，自动选中"压凸"工序
      if (this.form.embossing_plates && this.form.embossing_plates.length > 0) {
        const embossingProcess = this.allProcesses.find(p => 
          p.name && p.name.includes('压凸')
        )
        if (embossingProcess && !this.selectedProcesses.includes(embossingProcess.id)) {
          processesToAdd.add(embossingProcess.id)
        }
      }
      
      // 添加需要选中的工序
      if (processesToAdd.size > 0) {
        this.selectedProcesses = [...this.selectedProcesses, ...Array.from(processesToAdd)]
      }
    },
    isPrintingProcess(process) {
      // 判断是否为印刷工序
      const processName = process.name || ''
      return processName.includes('印刷')
    },
    isDieCuttingProcess(process) {
      // 判断是否为模切工序
      const processName = process.name || ''
      return processName.includes('模切')
    },
    isCuttingProcess(process) {
      // 判断是否为开料工序（使用 code 字段精确匹配）
      return process.code === 'CUT'
    },
    isPackagingProcess(process) {
      // 判断是否为包装工序（使用 code 字段精确匹配）
      return process.code === 'PACK'
    },
    updateCuttingProcess() {
      // 更新开料工序的选中状态
      if (!this.cuttingProcessId) {
        return // 如果没有找到开料工序，直接返回
      }
      
      const shouldSelect = this.shouldSelectCuttingProcess
      const isSelected = this.selectedProcesses.includes(this.cuttingProcessId)
      
      if (shouldSelect && !isSelected) {
        // 需要开料但未选中，自动选中
        this.selectedProcesses.push(this.cuttingProcessId)
      } else if (!shouldSelect && isSelected) {
        // 不需要开料但已选中，取消选中
        const index = this.selectedProcesses.indexOf(this.cuttingProcessId)
        if (index > -1) {
          this.selectedProcesses.splice(index, 1)
        }
      }
    },
    updatePackagingProcess() {
      // 更新包装工序的选中状态
      if (!this.packagingProcessId) {
        return // 如果没有找到包装工序，直接返回
      }
      
      const shouldSelect = this.shouldSelectPackagingProcess
      const isSelected = this.selectedProcesses.includes(this.packagingProcessId)
      
      if (shouldSelect && !isSelected) {
        // 需要包装但未选中，自动选中
        this.selectedProcesses.push(this.packagingProcessId)
      } else if (!shouldSelect && isSelected) {
        // 不需要包装但已选中，取消选中
        const index = this.selectedProcesses.indexOf(this.packagingProcessId)
        if (index > -1) {
          this.selectedProcesses.splice(index, 1)
        }
      }
    },
    handleProcessChange() {
      // 当工序选择改变时，触发验证
      // watch 中已经处理了清空不需要的版选择
      this.$nextTick(() => {
        if (this.shouldShowArtworkSelect) {
          this.$refs.form.validateField('artworks')
        }
        if (this.shouldShowDieSelect) {
          this.$refs.form.validateField('dies')
        }
        if (this.shouldShowFoilingPlateSelect) {
          this.$refs.form.validateField('foiling_plates')
        }
        if (this.shouldShowEmbossingPlateSelect) {
          this.$refs.form.validateField('embossing_plates')
        }
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
      // 添加产品后，更新包装工序状态
      this.$nextTick(() => {
        this.updatePackagingProcess()
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
      // 删除产品后，更新包装工序状态
      this.$nextTick(() => {
        this.updatePackagingProcess()
      })
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
      
      // 产品选择变化时，更新包装工序状态
      this.$nextTick(() => {
        this.updatePackagingProcess()
      })
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
      }
    },
    async loadData() {
      try {
        const id = this.$route.params.id
        const data = await workOrderAPI.getDetail(id)
        
        // 确保图稿、刀模、烫金版、压凸版列表已加载（可能需要等待）
        if (this.artworkList.length === 0) {
          await this.loadArtworkList()
        }
        if (this.dieList.length === 0) {
          await this.loadDieList()
        }
        if (this.foilingPlateList.length === 0) {
          await this.loadFoilingPlateList()
        }
        if (this.embossingPlateList.length === 0) {
          await this.loadEmbossingPlateList()
        }
        
        // 处理图稿数据：确保是数字ID数组
        const artworks = data.artworks || []
        const artworkIds = artworks
          .map(item => {
            if (typeof item === 'object' && item !== null) {
              return item.id
            }
            // 确保转换为数字
            const id = typeof item === 'string' ? parseInt(item, 10) : item
            return isNaN(id) ? null : id
          })
          .filter(id => id !== null && id !== undefined)
        
        // 处理刀模数据：确保是数字ID数组
        const dies = data.dies || []
        const dieIds = dies
          .map(item => {
            if (typeof item === 'object' && item !== null) {
              return item.id
            }
            // 确保转换为数字
            const id = typeof item === 'string' ? parseInt(item, 10) : item
            return isNaN(id) ? null : id
          })
          .filter(id => id !== null && id !== undefined)
        
        // 处理烫金版数据：确保是数字ID数组
        const foilingPlates = data.foiling_plates || []
        const foilingPlateIds = foilingPlates
          .map(item => {
            if (typeof item === 'object' && item !== null) {
              return item.id
            }
            // 确保转换为数字
            const id = typeof item === 'string' ? parseInt(item, 10) : item
            return isNaN(id) ? null : id
          })
          .filter(id => id !== null && id !== undefined)
        
        // 处理压凸版数据：确保是数字ID数组
        const embossingPlates = data.embossing_plates || []
        const embossingPlateIds = embossingPlates
          .map(item => {
            if (typeof item === 'object' && item !== null) {
              return item.id
            }
            // 确保转换为数字
            const id = typeof item === 'string' ? parseInt(item, 10) : item
            return isNaN(id) ? null : id
          })
          .filter(id => id !== null && id !== undefined)
        
        console.log('加载施工单数据:', {
          artworks: data.artworks,
          artworkIds,
          dies: data.dies,
          dieIds,
          foilingPlates: data.foiling_plates,
          foilingPlateIds,
          embossingPlates: data.embossing_plates,
          embossingPlateIds
        })
        
        // 使用 Vue.set 或直接赋值，确保响应式更新
        this.$set(this.form, 'order_number', data.order_number)
        this.$set(this.form, 'customer', data.customer)
        this.$set(this.form, 'artworks', artworkIds)
        this.$set(this.form, 'dies', dieIds)
        this.$set(this.form, 'foiling_plates', foilingPlateIds)
        this.$set(this.form, 'embossing_plates', embossingPlateIds)
        
        // 更新其他字段
        Object.assign(this.form, {
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
        })
        
        // 加载产品列表
        if (data.products && data.products.length > 0) {
          // 从图稿产品关联中获取拼版数量
          const loadProductItemsWithImposition = async () => {
            const productItemsWithImposition = []
            
            // 如果有图稿，先批量加载所有图稿的产品关联信息
            const artworkProductsMap = new Map() // productId -> imposition_quantity
            // 使用 this.form.artworks 而不是 artworkIds，因为 artworkIds 是局部变量
            const currentArtworkIds = this.form.artworks || []
            if (currentArtworkIds && currentArtworkIds.length > 0) {
              try {
                // 并行加载所有图稿详情
                const artworkDetailsPromises = currentArtworkIds.map(artworkId => 
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
        } else {
          this.productItems = [{
            product: null,
            quantity: 1,
            unit: '件',
            specification: ''
          }]
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
        
        // 加载已选择的工序（在设置版数据之后，确保 allProcesses 已加载）
        // 先确保 allProcesses 已加载
        if (this.allProcesses.length === 0) {
          await this.loadAllProcesses()
        }
        
        // 临时禁用 watcher，避免在数据加载时清空数据
        this.isLoadingWorkOrderData = true
        
        // 然后设置工序选择
        await this.$nextTick()
        if (data.order_processes && data.order_processes.length > 0) {
          this.selectedProcesses = data.order_processes.map(op => op.process)
        } else {
          this.selectedProcesses = []
        }
        
        // 等待 watcher 执行完成
        await this.$nextTick()
        
        // 重新设置版数据，确保数据正确（因为 watcher 可能已经清空了）
        this.$set(this.form, 'artworks', artworkIds)
        this.$set(this.form, 'dies', dieIds)
        this.$set(this.form, 'foiling_plates', foilingPlateIds)
        this.$set(this.form, 'embossing_plates', embossingPlateIds)
        
        // 恢复 watcher
        await this.$nextTick()
        this.isLoadingWorkOrderData = false
        
        // 更新制版工序状态（根据版的选择自动勾选）
        await this.$nextTick()
          this.updatePlateMakingProcess()
        
        // 再次使用 $nextTick 确保表单验证在数据完全加载后执行
        await this.$nextTick()
        
        console.log('施工单数据加载完成:', {
          'form.artworks': this.form.artworks,
          'form.dies': this.form.dies,
          'form.foiling_plates': this.form.foiling_plates,
          'form.embossing_plates': this.form.embossing_plates,
          'artworkList.length': this.artworkList.length,
          'dieList.length': this.dieList.length,
          'artworkIds': artworkIds,
          'dieIds': dieIds,
          'selectedProcesses': this.selectedProcesses
        })
        
        // 强制更新表单验证状态，确保选中值正确显示
        if (this.$refs.form) {
          this.$nextTick(() => {
            this.$refs.form.validate(() => {})
          })
        }
        
        // 加载物料信息
        if (data.materials && data.materials.length > 0) {
          this.materialItems = data.materials.map(m => ({
            id: m.id, // 编辑时保留ID
            material: m.material,
            material_size: m.material_size || '',
            material_usage: m.material_usage || '',
            need_cutting: m.need_cutting || false,
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
          this.$message.warning('请添加至少一个产品')
          return
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
          
          // 如果没有选择图稿，设置印刷形式为"不需要印刷"
          if (!data.artworks || data.artworks.length === 0) {
            data.printing_type = 'none'
            data.printing_cmyk_colors = []
            data.printing_other_colors = []
          }
          
          // 过滤空的其他颜色值
          if (data.printing_other_colors && Array.isArray(data.printing_other_colors)) {
            data.printing_other_colors = data.printing_other_colors.filter(color => color && color.trim())
          }
          
          // 处理刀模数据：保留所有有效的刀模ID
          const validDies = this.form.dies ? this.form.dies.filter(id => id !== null) : []
          data.dies = validDies.length > 0 ? validDies : []
          
          // 处理烫金版数据：保留所有有效的烫金版ID
          const validFoilingPlates = this.form.foiling_plates ? this.form.foiling_plates.filter(id => id !== null) : []
          data.foiling_plates = validFoilingPlates.length > 0 ? validFoilingPlates : []
          
          // 处理压凸版数据：保留所有有效的压凸版ID
          const validEmbossingPlates = this.form.embossing_plates ? this.form.embossing_plates.filter(id => id !== null) : []
          data.embossing_plates = validEmbossingPlates.length > 0 ? validEmbossingPlates : []
          
          // 添加工序ID列表，用于后端验证
          // 过滤掉 null 和无效值
          data.processes = (this.selectedProcesses || []).filter(id => id !== null && id !== undefined)
          
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
          } else {
            this.$message.warning('请添加至少一个产品')
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
          
          // 注意：products_data 和 processes 已经在后端的 create/update 方法中自动处理了
          // 不需要再次调用 saveProducts 或 saveSelectedProcesses，否则会导致重复创建和 400 错误
          
          // 检查并保存物料，收集所有错误信息
          const permissionErrors = []
          const otherErrors = []
          
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
        need_cutting: false,
        notes: ''
      })
      // 添加物料后，更新开料工序状态
      this.$nextTick(() => {
        this.updateCuttingProcess()
      })
    },
    removeMaterialItem(index) {
      this.materialItems.splice(index, 1)
      // 删除物料后，更新开料工序状态
      this.$nextTick(() => {
        this.updateCuttingProcess()
      })
    },
    handleMaterialChange(index) {
      // 物料选择变化时，如果选择了物料，可以从物料信息中获取默认的 need_cutting 值
      const item = this.materialItems[index]
      if (item && item.material) {
        const material = this.materialList.find(m => m.id === item.material)
        if (material && material.need_cutting !== undefined) {
          // 如果物料有默认的 need_cutting 值，使用它
          this.$set(this.materialItems[index], 'need_cutting', material.need_cutting)
        }
      }
      // 更新开料工序状态
      this.$nextTick(() => {
        this.updateCuttingProcess()
      })
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
              need_cutting: item.need_cutting || false,
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
