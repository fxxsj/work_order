# 客户订单管理模块增强方案

## 一、现有系统分析

### 已实现的功能

#### 1. 销售订单（SalesOrder）
- ✅ 订单号自动生成（SO + yyyymmdd + 4位序号）
- ✅ 订单状态流转：草稿 → 已提交 → 已审核 → 生产中 → 已完成/已取消
- ✅ 付款状态管理：未付款 → 部分付款 → 已付款
- ✅ 订单明细管理
- ✅ 审核功能（提交、审核通过、拒绝）
- ✅ 付款管理

#### 2. 施工单（WorkOrder）
- ✅ 施工单号自动生成
- ✅ 客户、产品、工序管理
- ✅ 图稿、刀模、烫金版、压凸版管理
- ✅ 生产流程管理
- ✅ 任务管理

#### 3. 关联关系
```python
# models.py
class SalesOrder(models.Model):
    work_orders = models.ManyToManyField('WorkOrder', blank=True, verbose_name='关联施工单')
```

### 缺失的关键功能

#### ❌ 问题1：销售订单审核通过后未自动生成施工单
- 现状：销售订单和施工单只是简单的多对多关联
- 问题：需要手动创建施工单并关联到销售订单
- 影响：效率低，容易出错

#### ❌ 问题2：缺少出货单管理
- 现状：没有出货单模块
- 问题：无法追踪出货记录
- 影响：财务对账困难，客户服务体验差

#### ❌ 问题3：业务流程不完整
```
客户下单(1000个彩盒) 
  ↓
审核通过 (库存减少)
  ↓
❓ 缺少：自动生成施工单
  ↓
生产
  ↓
❓ 缺少：出货单
  ↓
出货
```

## 二、完整业务流程设计

### 目标流程
```
客户下单(1000个彩盒) 
  ↓
销售订单创建（草稿）
  ↓
提交审核
  ↓
审核通过
  ↓
【自动生成施工单】 ← 核心功能1
  ↓
生产管理
  ↓
【创建出货单】 ← 核心功能2
  ↓
出货
  ↓
订单完成
```

### 详细流程说明

#### 阶段1：客户下单
1. 客户提出需求（1000个彩盒）
2. 业务员在系统创建销售订单
   - 选择客户
   - 添加订单明细（产品、数量、单价）
   - 设置交货日期
3. 系统自动计算金额（小计、税额、总金额）

#### 阶段2：订单审核
1. 提交审核（状态：草稿 → 已提交）
2. 业务员/主管审核
   - 验证订单数据完整性
   - 审核通过或拒绝
3. **审核通过后自动执行**：
   - 更新订单状态（已提交 → 已审核）
   - 减少产品库存
   - **自动生成施工单**（新增功能）
   - 创建通知

#### 阶段3：生产管理（已有）
1. 查看自动生成的施工单
2. 设置工序（制版、开料、印刷、模切、包装等）
3. 分派任务给各部门
4. 执行生产并更新进度

#### 阶段4：出货管理（新增）
1. 生产完成后，创建出货单
2. 填写出货信息：
   - 出货日期
   - 物流信息
   - 出货数量
   - 收货人信息
3. 更新订单状态（生产中 → 已完成）

## 三、技术实现方案

### 后端实现

#### 3.1 修改销售订单审核方法

**文件**: `backend/workorder/views.py`

**修改 SalesOrderViewSet 的 approve 方法**：

```python
@action(detail=True, methods=['post'])
def approve(self, request, pk=None):
    """审核通过销售订单"""
    sales_order = self.get_object()
    if sales_order.status != 'submitted':
        return Response(
            {'error': '只有已提交状态的订单才能审核'},
            status=status.HTTP_400_BAD_REQUEST
        )

    # 再次验证订单数据完整性
    errors = sales_order.validate_before_approval()
    if errors:
        return Response(
            {'error': '订单数据验证失败', 'errors': errors},
            status=status.HTTP_400_BAD_REQUEST
        )

    # 更新订单状态
    sales_order.status = 'approved'
    sales_order.approved_by = request.user
    sales_order.approved_at = timezone.now()
    sales_order.approval_comment = request.data.get('approval_comment', '')
    sales_order.save()

    # 审核通过后，减少产品库存数量
    self._reduce_product_stock(sales_order)

    # 【新增】审核通过后，自动生成施工单
    auto_generated_work_orders = self._auto_generate_work_orders(sales_order, request.user)

    serializer = self.get_serializer(sales_order)
    response_data = serializer.data
    response_data['auto_generated_work_orders'] = auto_generated_work_orders
    return Response(response_data)
```

**添加自动生成施工单的辅助方法**：

```python
def _auto_generate_work_orders(self, sales_order, user):
    """
    销售订单审核通过后，自动生成施工单
    
    规则：
    - 按产品分组，每个产品生成一个施工单
    - 如果订单明细只有一个产品，生成一个施工单
    - 如果订单明细有多个产品，为每个产品生成一个施工单
    - 自动关联销售订单
    - 自动复制客户、交货日期等信息
    
    Returns:
        list: 生成的施工单ID列表
    """
    from .models import WorkOrder, WorkOrderProduct
    
    # 检查是否已经关联了施工单
    if sales_order.work_orders.exists():
        return []
    
    auto_generated_orders = []
    
    # 获取订单明细，按产品分组
    items = sales_order.items.all()
    
    # 如果只有一个产品，生成一个施工单
    if items.count() == 1:
        item = items.first()
        work_order = WorkOrder.objects.create(
            customer=sales_order.customer,
            status='pending',
            priority='normal',
            order_date=sales_order.order_date,
            delivery_date=sales_order.delivery_date,
            production_quantity=item.quantity,
            total_amount=item.subtotal,
            manager=user,
            created_by=user,
            notes=f'自动生成自销售订单：{sales_order.order_number}'
        )
        
        # 创建施工单产品关联
        WorkOrderProduct.objects.create(
            work_order=work_order,
            product=item.product,
            quantity=item.quantity,
            unit=item.unit,
            specification=item.product.specification
        )
        
        # 添加产品的默认工序
        for process in item.product.default_processes.all():
            from .models import WorkOrderProcess, Department
            # 查找负责该工序的部门
            departments = Department.objects.filter(processes=process, is_active=True)
            department = departments.first() if departments.exists() else None
            
            WorkOrderProcess.objects.create(
                work_order=work_order,
                process=process,
                department=department,
                sequence=process.sort_order,
                status='pending'
            )
        
        # 关联到销售订单
        sales_order.work_orders.add(work_order)
        auto_generated_orders.append(work_order.id)
    
    else:
        # 如果有多个产品，为每个产品生成一个施工单
        product_items = {}
        for item in items:
            product_id = item.product.id
            if product_id not in product_items:
                product_items[product_id] = []
            product_items[product_id].append(item)
        
        for product_id, items_list in product_items.items():
            first_item = items_list[0]
            total_quantity = sum(item.quantity for item in items_list)
            total_amount = sum(item.subtotal for item in items_list)
            
            work_order = WorkOrder.objects.create(
                customer=sales_order.customer,
                status='pending',
                priority='normal',
                order_date=sales_order.order_date,
                delivery_date=sales_order.delivery_date,
                production_quantity=total_quantity,
                total_amount=total_amount,
                manager=user,
                created_by=user,
                notes=f'自动生成自销售订单：{sales_order.order_number}（产品：{first_item.product.name}）'
            )
            
            # 创建施工单产品关联
            for item in items_list:
                WorkOrderProduct.objects.create(
                    work_order=work_order,
                    product=item.product,
                    quantity=item.quantity,
                    unit=item.unit,
                    specification=item.product.specification
                )
            
            # 添加产品的默认工序
            for process in first_item.product.default_processes.all():
                from .models import WorkOrderProcess, Department
                departments = Department.objects.filter(processes=process, is_active=True)
                department = departments.first() if departments.exists() else None
                
                WorkOrderProcess.objects.create(
                    work_order=work_order,
                    process=process,
                    department=department,
                    sequence=process.sort_order,
                    status='pending'
                )
            
            # 关联到销售订单
            sales_order.work_orders.add(work_order)
            auto_generated_orders.append(work_order.id)
    
    # 创建通知
    Notification.create_notification(
        recipient=sales_order.created_by,
        notification_type='workorder_completed',
        title=f'已自动生成施工单',
        content=f'销售订单 {sales_order.order_number} 审核通过，已自动生成 {len(auto_generated_orders)} 个施工单。',
        priority='high',
        work_order=sales_order.work_orders.first() if auto_generated_orders else None
    )
    
    return auto_generated_orders
```

#### 3.2 添加出货单管理模块

**文件**: `backend/workorder/models.py`

在文件末尾添加出货单相关模型：

```python
class DeliveryOrder(models.Model):
    """出货单"""
    STATUS_CHOICES = [
        ('draft', '草稿'),
        ('confirmed', '已确认'),
        ('shipped', '已出货'),
        ('received', '已收货'),
        ('cancelled', '已取消'),
    ]
    
    def generate_order_number():
        """生成出货单号：DO + yyyymmdd + 4位序号"""
        today = timezone.now().strftime('%Y%m%d')
        prefix = f'DO{today}'
        with transaction.atomic():
            latest = DeliveryOrder.objects.filter(
                order_number__startswith=prefix
            ).select_for_update().order_by('-order_number').first()
            if latest:
                last_number = int(latest.order_number[-4:])
                new_number = last_number + 1
            else:
                new_number = 1
            return f'{prefix}{new_number:04d}'
    
    order_number = models.CharField('出货单号', max_length=50, unique=True)
    sales_order = models.ForeignKey(SalesOrder, on_delete=models.CASCADE,
                                  related_name='delivery_orders', verbose_name='销售订单')
    
    # 出货信息
    delivery_date = models.DateField('出货日期', null=True, blank=True)
    actual_delivery_date = models.DateField('实际出货日期', null=True, blank=True)
    
    # 物流信息
    logistics_company = models.CharField('物流公司', max_length=200, blank=True)
    tracking_number = models.CharField('物流单号', max_length=200, blank=True)
    logistics_contact = models.CharField('物流联系人', max_length=100, blank=True)
    logistics_phone = models.CharField('物流电话', max_length=50, blank=True)
    
    # 收货信息
    receiver_name = models.CharField('收货人姓名', max_length=100, blank=True)
    receiver_phone = models.CharField('收货人电话', max_length=50, blank=True)
    receiver_address = models.TextField('收货地址', blank=True)
    delivery_notes = models.TextField('配送备注', blank=True)
    
    # 状态
    status = models.CharField('出货状态', max_length=20, choices=STATUS_CHOICES, default='draft')
    
    # 金额信息
    delivery_amount = models.DecimalField('运费', max_digits=10, decimal_places=2, default=0)
    total_amount = models.DecimalField('总金额', max_digits=12, decimal_places=2, default=0)
    
    # 操作人
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True,
                                   related_name='created_delivery_orders', verbose_name='创建人')
    shipped_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True,
                                related_name='shipped_delivery_orders', verbose_name='出货人')
    
    # 备注
    notes = models.TextField('备注', blank=True)
    
    # 时间戳
    created_at = models.DateTimeField('创建时间', auto_now_add=True)
    updated_at = models.DateTimeField('更新时间', auto_now=True)
    
    class Meta:
        verbose_name = '出货单'
        verbose_name_plural = '出货单管理'
        ordering = ['-created_at']
        permissions = [
            ('confirm_deliveryorder', '可以确认出货单'),
        ]
    
    def __str__(self):
        return f"{self.order_number} - {self.sales_order.order_number}"
    
    def save(self, *args, **kwargs):
        if not self.order_number:
            self.order_number = self.generate_order_number()
        
        # 自动计算总金额
        self.total_amount = self.sales_order.total_amount + self.delivery_amount
        
        super().save(*args, **kwargs)


class DeliveryOrderItem(models.Model):
    """出货单明细"""
    delivery_order = models.ForeignKey(DeliveryOrder, on_delete=models.CASCADE,
                                    related_name='items', verbose_name='出货单')
    work_order = models.ForeignKey(WorkOrder, on_delete=models.CASCADE, null=True, blank=True,
                                 related_name='delivery_items', verbose_name='施工单')
    product = models.ForeignKey(Product, on_delete=models.PROTECT, verbose_name='产品')
    
    # 数量信息
    planned_quantity = models.IntegerField('计划出货数量')
    actual_quantity = models.IntegerField('实际出货数量', default=0)
    
    # 单位
    unit = models.CharField('单位', max_length=20, default='件')
    
    # 金额
    unit_price = models.DecimalField('单价', max_digits=10, decimal_places=2)
    subtotal = models.DecimalField('小计', max_digits=12, decimal_places=2, default=0)
    
    # 备注
    notes = models.TextField('备注', blank=True)
    
    # 时间戳
    created_at = models.DateTimeField('创建时间', auto_now_add=True)
    updated_at = models.DateTimeField('更新时间', auto_now=True)
    
    class Meta:
        verbose_name = '出货单明细'
        verbose_name_plural = '出货单明细管理'
        ordering = ['delivery_order', 'id']
        unique_together = [['delivery_order', 'product']]
    
    def __str__(self):
        return f"{self.delivery_order.order_number} - {self.product.name}"
    
    def save(self, *args, **kwargs):
        # 自动计算小计
        self.subtotal = self.actual_quantity * self.unit_price
        super().save(*args, **kwargs)
```

**更新 models.py 的导入语句**：

```python
# 在文件开头的导入部分添加
from .models import (
    # ... 现有导入 ...
    DeliveryOrder,
    DeliveryOrderItem,
)
```

#### 3.3 添加出货单序列化器

**文件**: `backend/workorder/serializers.py`

在文件末尾添加：

```python
class DeliveryOrderItemSerializer(serializers.ModelSerializer):
    """出货单明细序列化器"""
    product_name = serializers.CharField(source='product.name', read_only=True)
    product_code = serializers.CharField(source='product.code', read_only=True)
    work_order_number = serializers.CharField(source='work_order.order_number', read_only=True, allow_null=True)
    
    class Meta:
        model = DeliveryOrderItem
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at', 'subtotal']


class DeliveryOrderListSerializer(serializers.ModelSerializer):
    """出货单列表序列化器"""
    sales_order_number = serializers.CharField(source='sales_order.order_number', read_only=True)
    customer_name = serializers.CharField(source='sales_order.customer.name', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    created_by_name = serializers.CharField(source='created_by.username', read_only=True, allow_null=True)
    shipped_by_name = serializers.CharField(source='shipped_by.username', read_only=True, allow_null=True)
    items_count = serializers.SerializerMethodField()
    
    class Meta:
        model = DeliveryOrder
        fields = [
            'id', 'order_number', 'sales_order', 'sales_order_number', 'customer_name',
            'delivery_date', 'actual_delivery_date', 'status', 'status_display',
            'logistics_company', 'tracking_number', 'total_amount',
            'created_by', 'created_by_name', 'shipped_by', 'shipped_by_name',
            'items_count', 'notes', 'created_at'
        ]
    
    def get_items_count(self, obj):
        return obj.items.count()


class DeliveryOrderDetailSerializer(serializers.ModelSerializer):
    """出货单详情序列化器"""
    sales_order_number = serializers.CharField(source='sales_order.order_number', read_only=True)
    customer_name = serializers.CharField(source='sales_order.customer.name', read_only=True)
    customer_detail = CustomerSerializer(source='sales_order.customer', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    created_by_name = serializers.CharField(source='created_by.username', read_only=True, allow_null=True)
    shipped_by_name = serializers.CharField(source='shipped_by.username', read_only=True, allow_null=True)
    items = DeliveryOrderItemSerializer(many=True, read_only=True)
    
    class Meta:
        model = DeliveryOrder
        fields = '__all__'
        read_only_fields = ['order_number', 'total_amount', 'created_at', 'updated_at']


class DeliveryOrderCreateUpdateSerializer(serializers.ModelSerializer):
    """出货单创建/更新序列化器"""
    items_data = serializers.ListField(
        child=serializers.DictField(),
        write_only=True,
        required=False,
        help_text='出货明细数据，格式：[{"work_order": id, "product": id, "planned_quantity": 100, "unit": "件", "unit_price": 10}]'
    )
    
    class Meta:
        model = DeliveryOrder
        fields = [
            'id', 'order_number', 'sales_order',
            'delivery_date', 'actual_delivery_date',
            'logistics_company', 'tracking_number',
            'logistics_contact', 'logistics_phone',
            'receiver_name', 'receiver_phone', 'receiver_address',
            'delivery_notes', 'status',
            'delivery_amount', 'total_amount',
            'items_data'
        ]
        read_only_fields = ['order_number', 'total_amount']
    
    def create(self, validated_data):
        """创建出货单并处理明细"""
        items_data = validated_data.pop('items_data', [])
        
        delivery_order = DeliveryOrder.objects.create(**validated_data)
        
        # 创建明细
        for idx, item_data in enumerate(items_data):
            DeliveryOrderItem.objects.create(
                delivery_order=delivery_order,
                work_order_id=item_data.get('work_order'),
                product_id=item_data.get('product'),
                planned_quantity=item_data.get('planned_quantity'),
                actual_quantity=item_data.get('planned_quantity', 0),
                unit=item_data.get('unit', '件'),
                unit_price=item_data.get('unit_price', 0),
                notes=item_data.get('notes', '')
            )
        
        return delivery_order
    
    def update(self, instance, validated_data):
        """更新出货单并处理明细"""
        items_data = validated_data.pop('items_data', None)
        
        # 更新出货单基本信息
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        
        instance.save()
        
        # 如果提供了明细数据，更新明细
        if items_data is not None:
            # 删除现有明细
            DeliveryOrderItem.objects.filter(delivery_order=instance).delete()
            
            # 创建新明细
            for idx, item_data in enumerate(items_data):
                DeliveryOrderItem.objects.create(
                    delivery_order=instance,
                    work_order_id=item_data.get('work_order'),
                    product_id=item_data.get('product'),
                    planned_quantity=item_data.get('planned_quantity'),
                    actual_quantity=item_data.get('planned_quantity', 0),
                    unit=item_data.get('unit', '件'),
                    unit_price=item_data.get('unit_price', 0),
                    notes=item_data.get('notes', '')
                )
        
        return instance
```

#### 3.4 添加出货单视图

**文件**: `backend/workorder/views.py`

在 SalesOrderViewSet 之后添加：

```python
class DeliveryOrderViewSet(viewsets.ModelViewSet):
    """出货单视图集"""
    queryset = DeliveryOrder.objects.all()
    permission_classes = [DjangoModelPermissions]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['sales_order', 'status', 'delivery_date']
    search_fields = ['order_number', 'sales_order__order_number', 'tracking_number']
    ordering_fields = ['created_at', 'delivery_date', 'order_number']
    ordering = ['-created_at']
    
    def get_queryset(self):
        """优化查询"""
        return DeliveryOrder.objects.select_related(
            'sales_order', 'sales_order__customer',
            'created_by', 'shipped_by'
        ).prefetch_related('items', 'items__product', 'items__work_order')
    
    def get_serializer_class(self):
        """根据action选择序列化器"""
        if self.action == 'list':
            return DeliveryOrderListSerializer
        return DeliveryOrderDetailSerializer
    
    def perform_create(self, serializer):
        """创建出货单时自动设置创建人"""
        serializer.save(created_by=self.request.user)
    
    @action(detail=True, methods=['post'])
    def confirm(self, request, pk=None):
        """确认出货单"""
        delivery_order = self.get_object()
        
        if delivery_order.status != 'draft':
            return Response(
                {'error': '只有草稿状态的出货单才能确认'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # 验证出货单数据
        if not delivery_order.items.exists():
            return Response(
                {'error': '出货单必须包含至少一条明细'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # 更新状态
        delivery_order.status = 'confirmed'
        delivery_order.shipped_by = request.user
        delivery_order.save()
        
        # 更新销售订单状态
        sales_order = delivery_order.sales_order
        if sales_order.status == 'in_production':
            sales_order.status = 'completed'
            sales_order.save()
        
        serializer = self.get_serializer(delivery_order)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def ship(self, request, pk=None):
        """出货"""
        delivery_order = self.get_object()
        
        if delivery_order.status != 'confirmed':
            return Response(
                {'error': '只有已确认状态的出货单才能出货'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        actual_delivery_date = request.data.get('actual_delivery_date')
        if actual_delivery_date:
            delivery_order.actual_delivery_date = actual_delivery_date
        
        delivery_order.status = 'shipped'
        delivery_order.save()
        
        # 创建通知
        Notification.create_notification(
            recipient=delivery_order.sales_order.created_by,
            notification_type='workorder_completed',
            title=f'出货单已出货',
            content=f'出货单 {delivery_order.order_number} 已出货。物流公司：{delivery_order.logistics_company or "无"}，物流单号：{delivery_order.tracking_number or "无"}。',
            priority='high',
        )
        
        serializer = self.get_serializer(delivery_order)
        return Response(serializer.data)


class DeliveryOrderItemViewSet(viewsets.ModelViewSet):
    """出货单明细视图集"""
    queryset = DeliveryOrderItem.objects.all()
    permission_classes = [DjangoModelPermissions]
    serializer_class = DeliveryOrderItemSerializer
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['delivery_order', 'product', 'work_order']
    ordering_fields = ['created_at']
    ordering = ['delivery_order', 'id']
    
    def get_queryset(self):
        """优化查询"""
        return super().get_queryset().select_related(
            'delivery_order', 'product', 'work_order'
        )
```

#### 3.5 更新 URL 路由

**文件**: `backend/workorder/urls.py`

更新导入和路由注册：

```python
# 更新导入
from .views import (
    # ... 现有导入 ...
    DeliveryOrderViewSet,
    DeliveryOrderItemViewSet,
    SalesOrderViewSet,  # 确保已导入
    SalesOrderItemViewSet,
)

# 更新路由注册
router.register(r'delivery-orders', DeliveryOrderViewSet)
router.register(r'delivery-order-items', DeliveryOrderItemViewSet)
router.register(r'sales-orders', SalesOrderViewSet)
router.register(r'sales-order-items', SalesOrderItemViewSet)
```

#### 3.6 更新 Admin 管理

**文件**: `backend/workorder/admin.py`

在文件末尾添加：

```python
# ==================== 出货管理 ====================

@admin.register(DeliveryOrder)
class DeliveryOrderAdmin(admin.ModelAdmin):
    """出货单管理"""
    list_display = [
        'order_number', 'sales_order_number', 'customer_name', 'status_badge',
        'delivery_date', 'actual_delivery_date', 'logistics_company',
        'tracking_number', 'total_amount', 'created_by_name', 'shipped_by_name',
        'items_count', 'created_at'
    ]
    
    list_filter = ['status', 'delivery_date', 'created_at', 'logistics_company']
    search_fields = ['order_number', 'sales_order__order_number', 'tracking_number', 'receiver_name']
    autocomplete_fields = ['sales_order', 'created_by', 'shipped_by']
    readonly_fields = ['order_number', 'total_amount', 'created_at', 'updated_at']
    ordering = ['-created_at']
    date_hierarchy = 'delivery_date'
    
    fieldsets = (
        ('基本信息', {
            'fields': ('order_number', 'sales_order', 'status')
        }),
        ('出货信息', {
            'fields': ('delivery_date', 'actual_delivery_date')
        }),
        ('物流信息', {
            'fields': ('logistics_company', 'tracking_number', 'logistics_contact', 'logistics_phone')
        }),
        ('收货信息', {
            'fields': ('receiver_name', 'receiver_phone', 'receiver_address', 'delivery_notes')
        }),
        ('金额信息', {
            'fields': ('delivery_amount', 'total_amount')
        }),
        ('操作人', {
            'fields': ('created_by', 'shipped_by')
        }),
        ('其他', {
            'fields': ('notes',)
        }),
        ('系统信息', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def sales_order_number(self, obj):
        return obj.sales_order.order_number
    sales_order_number.short_description = '销售订单号'
    
    def customer_name(self, obj):
        return obj.sales_order.customer.name
    customer_name.short_description = '客户'
    
    def created_by_name(self, obj):
        return obj.created_by.username if obj.created_by else '-'
    created_by_name.short_description = '创建人'
    
    def shipped_by_name(self, obj):
        return obj.shipped_by.username if obj.shipped_by else '-'
    shipped_by_name.short_description = '出货人'
    
    def items_count(self, obj):
        return obj.items.count()
    items_count.short_description = '明细数量'
    
    def status_badge(self, obj):
        """状态徽章"""
        colors = {
            'draft': '#909399',
            'confirmed': '#409EFF',
            'shipped': '#67C23A',
            'received': '#67C23A',
            'cancelled': '#F56C6C',
        }
        return format_html(
            '<span style="padding: 3px 8px; border-radius: 3px; color: white; '
            'background-color: {};">{}</span>',
            colors.get(obj.status, '#909399'),
            obj.get_status_display()
        )
    status_badge.short_description = '状态'
    
    def get_queryset(self, request):
        """优化查询"""
        qs = super().get_queryset(request)
        return qs.select_related('sales_order', 'sales_order__customer', 'created_by', 'shipped_by')


@admin.register(DeliveryOrderItem)
class DeliveryOrderItemAdmin(admin.ModelAdmin):
    """出货单明细管理"""
    list_display = [
        'delivery_order_number', 'product_code', 'product_name',
        'work_order_number', 'planned_quantity', 'actual_quantity',
        'unit', 'unit_price', 'subtotal', 'created_at'
    ]
    
    list_filter = ['product', 'created_at']
    search_fields = [
        'delivery_order__order_number', 'product__name', 'product__code',
        'work_order__order_number'
    ]
    autocomplete_fields = ['delivery_order', 'product', 'work_order']
    readonly_fields = ['created_at', 'updated_at', 'subtotal']
    ordering = ['delivery_order', 'id']
    
    def delivery_order_number(self, obj):
        return obj.delivery_order.order_number
    delivery_order_number.short_description = '出货单号'
    
    def product_code(self, obj):
        return obj.product.code
    product_code.short_description = '产品编码'
    
    def product_name(self, obj):
        return obj.product.name
    product_name.short_description = '产品名称'
    
    def work_order_number(self, obj):
        return obj.work_order.order_number if obj.work_order else '-'
    work_order_number.short_description = '施工单号'
    
    def subtotal(self, obj):
        return obj.actual_quantity * obj.unit_price
    subtotal.short_description = '小计'
    subtotal.admin_order_field = 'subtotal'
    
    def get_queryset(self, request):
        """优化查询"""
        return super().get_queryset(request).select_related(
            'delivery_order', 'product', 'work_order'
        )
```

### 前端实现

#### 4.1 更新 API 文件

**文件**: `frontend/src/api/delivery.js`

创建新的 API 文件：

```javascript
import service from './index'

// ==================== 出货单管理 ====================

/**
 * 获取出货单列表
 */
export function getDeliveryOrderList(params) {
  return service({
    url: '/delivery-orders/',
    method: 'get',
    params
  })
}

/**
 * 获取出货单详情
 */
export function getDeliveryOrderDetail(id) {
  return service({
    url: `/delivery-orders/${id}/`,
    method: 'get'
  })
}

/**
 * 创建出货单
 */
export function createDeliveryOrder(data) {
  return service({
    url: '/delivery-orders/',
    method: 'post',
    data
  })
}

/**
 * 更新出货单
 */
export function updateDeliveryOrder(id, data) {
  return service({
    url: `/delivery-orders/${id}/`,
    method: 'put',
    data
  })
}

/**
 * 删除出货单
 */
export function deleteDeliveryOrder(id) {
  return service({
    url: `/delivery-orders/${id}/`,
    method: 'delete'
  })
}

/**
 * 确认出货单
 */
export function confirmDeliveryOrder(id) {
  return service({
    url: `/delivery-orders/${id}/confirm/`,
    method: 'post'
  })
}

/**
 * 出货
 */
export function shipDeliveryOrder(id, data) {
  return service({
    url: `/delivery-orders/${id}/ship/`,
    method: 'post',
    data
  })
}

// ==================== 出货单明细 ====================

/**
 * 获取出货单明细列表
 */
export function getDeliveryOrderItemList(params) {
  return service({
    url: '/delivery-order-items/',
    method: 'get',
    params
  })
}
```

#### 4.2 添加出货单列表页面

**文件**: `frontend/src/views/delivery/List.vue`

创建新页面：

```vue
<template>
  <div class="delivery-order-list">
    <el-card>
      <!-- 搜索和筛选 -->
      <el-form :inline="true" :model="searchForm" class="search-form" @keyup.enter.native="handleSearch">
        <el-form-item label="单号">
          <el-input v-model="searchForm.search" placeholder="出货单号/销售订单号" clearable />
        </el-form-item>
        <el-form-item label="出货状态">
          <el-select v-model="searchForm.status" placeholder="请选择" clearable>
            <el-option label="草稿" value="draft" />
            <el-option label="已确认" value="confirmed" />
            <el-option label="已出货" value="shipped" />
            <el-option label="已收货" value="received" />
          </el-select>
        </el-form-item>
        <el-form-item label="出货日期">
          <el-date-picker
            v-model="searchForm.delivery_date"
            type="date"
            placeholder="选择日期"
            value-format="yyyy-MM-dd"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">搜索</el-button>
          <el-button @click="handleReset">重置</el-button>
          <el-button type="success" @click="handleAdd">新建出货单</el-button>
        </el-form-item>
      </el-form>

      <!-- 数据表格 -->
      <el-table :data="tableData" v-loading="loading" border stripe>
        <el-table-column prop="order_number" label="出货单号" width="150" />
        <el-table-column prop="sales_order_number" label="销售订单号" width="150" />
        <el-table-column prop="customer_name" label="客户" width="150" />
        <el-table-column prop="status" label="出货状态" width="100">
          <template slot-scope="scope">
            <el-tag :type="getStatusType(scope.row.status)">
              {{ scope.row.status_display }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="delivery_date" label="计划出货日期" width="120" />
        <el-table-column prop="actual_delivery_date" label="实际出货日期" width="120" />
        <el-table-column prop="logistics_company" label="物流公司" width="150" />
        <el-table-column prop="tracking_number" label="物流单号" width="150" />
        <el-table-column prop="total_amount" label="总金额" width="120" align="right">
          <template slot-scope="scope">
            ¥{{ scope.row.total_amount.toFixed(2) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="300" fixed="right">
          <template slot-scope="scope">
            <el-button size="mini" type="text" @click="handleView(scope.row)">查看</el-button>
            <el-button v-if="canEdit(scope.row)" size="mini" type="text" @click="handleEdit(scope.row)">编辑</el-button>
            <el-button v-if="canConfirm(scope.row)" size="mini" type="text" @click="handleConfirm(scope.row)">确认</el-button>
            <el-button v-if="canShip(scope.row)" size="mini" type="text" @click="handleShip(scope.row)">出货</el-button>
            <el-button v-if="canDelete(scope.row)" size="mini" type="text" @click="handleDelete(scope.row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination">
        <el-pagination
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
          :current-page="pagination.page"
          :page-sizes="[10, 20, 50, 100]"
          :page-size="pagination.pageSize"
          layout="total, sizes, prev, pager, next, jumper"
          :total="pagination.total">
        </el-pagination>
      </div>
    </el-card>

    <!-- 新增/编辑对话框 -->
    <el-dialog :title="dialogTitle" :visible.sync="dialogVisible" width="80%" top="5vh" @close="handleDialogClose">
      <delivery-order-form v-if="dialogVisible" :form-data="form" :dialog-mode="dialogMode" @submit="handleSubmitForm" @cancel="dialogVisible = false" />
    </el-dialog>

    <!-- 查看详情对话框 -->
    <el-dialog title="出货单详情" :visible.sync="detailVisible" width="80%" top="5vh">
      <delivery-order-detail v-if="detailVisible" :order-id="currentOrderId" @close="detailVisible = false" />
    </el-dialog>

    <!-- 出货确认对话框 -->
    <el-dialog title="出货确认" :visible.sync="shipVisible" width="500px">
      <el-form :model="shipForm" label-width="100px">
        <el-form-item label="实际出货日期">
          <el-date-picker
            v-model="shipForm.actual_delivery_date"
            type="date"
            placeholder="选择实际出货日期"
            value-format="yyyy-MM-dd"
            style="width: 100%" />
        </el-form-item>
      </el-form>
      <span slot="footer" class="dialog-footer">
        <el-button @click="shipVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmShip">确认出货</el-button>
      </span>
    </el-dialog>
  </div>
</template>

<script>
import {
  getDeliveryOrderList,
  deleteDeliveryOrder,
  confirmDeliveryOrder,
  shipDeliveryOrder
} from '@/api/delivery'
import DeliveryOrderForm from './Form.vue'
import DeliveryOrderDetail from './Detail.vue'

export default {
  name: 'DeliveryOrderList',
  components: {
    DeliveryOrderForm,
    DeliveryOrderDetail
  },
  data() {
    return {
      loading: false,
      searchForm: {
        search: '',
        status: '',
        delivery_date: ''
      },
      tableData: [],
      pagination: {
        page: 1,
        pageSize: 20,
        total: 0
      },
      dialogVisible: false,
      dialogMode: 'add',
      form: null,
      detailVisible: false,
      currentOrderId: null,
      shipVisible: false,
      shipForm: {
        actual_delivery_date: ''
      }
    }
  },
  computed: {
    dialogTitle() {
      return this.dialogMode === 'add' ? '新建出货单' : '编辑出货单'
    }
  },
  created() {
    this.fetchData()
  },
  methods: {
    async fetchData() {
      this.loading = true
      try {
        const params = {
          page: this.pagination.page,
          page_size: this.pagination.pageSize,
          search: this.searchForm.search || undefined,
          status: this.searchForm.status || undefined,
          delivery_date: this.searchForm.delivery_date || undefined
        }
        const response = await getDeliveryOrderList(params)
        this.tableData = response.results
        this.pagination.total = response.count
      } catch (error) {
        this.$message.error('获取出货单列表失败')
      } finally {
        this.loading = false
      }
    },
    handleSearch() {
      this.pagination.page = 1
      this.fetchData()
    },
    handleReset() {
      this.searchForm = {
        search: '',
        status: '',
        delivery_date: ''
      }
      this.pagination.page = 1
      this.fetchData()
    },
    handleSizeChange(val) {
      this.pagination.pageSize = val
      this.pagination.page = 1
      this.fetchData()
    },
    handleCurrentChange(val) {
      this.pagination.page = val
      this.fetchData()
    },
    handleAdd() {
      this.dialogMode = 'add'
      this.form = {}
      this.dialogVisible = true
    },
    handleEdit(row) {
      this.dialogMode = 'edit'
      this.form = { ...row }
      this.dialogVisible = true
    },
    handleView(row) {
      this.currentOrderId = row.id
      this.detailVisible = true
    },
    async handleDelete(row) {
      if (!row) return
      this.$confirm(`确定要删除出货单"${row.order_number}"吗？`, '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(async () => {
        try {
          await deleteDeliveryOrder(row.id)
          this.$message.success('删除成功')
          this.fetchData()
        } catch (error) {
          this.$message.error('删除失败')
        }
      }).catch(() => {})
    },
    async handleConfirm(row) {
      try {
        await confirmDeliveryOrder(row.id)
        this.$message.success('确认成功')
        this.fetchData()
      } catch (error) {
        this.$message.error('操作失败')
      }
    },
    handleShip(row) {
      if (!row) return
      this.shipForm.actual_delivery_date = new Date().toISOString().split('T')[0]
      this.currentOrderId = row.id
      this.shipVisible = true
    },
    async confirmShip() {
      try {
        await shipDeliveryOrder(this.currentOrderId, this.shipForm)
        this.$message.success('出货成功')
        this.shipVisible = false
        this.fetchData()
      } catch (error) {
        this.$message.error('操作失败')
      }
    },
    handleSubmitForm() {
      this.dialogVisible = false
      this.fetchData()
    },
    handleDialogClose() {
      this.form = null
    },
    getStatusType(status) {
      const typeMap = {
        draft: 'info',
        confirmed: 'warning',
        shipped: 'primary',
        received: 'success',
        cancelled: 'danger'
      }
      return typeMap[status] || 'info'
    },
    canEdit(row) {
      return row.status === 'draft'
    },
    canConfirm(row) {
      return row.status === 'draft'
    },
    canShip(row) {
      return row.status === 'confirmed'
    },
    canDelete(row) {
      return row.status === 'draft'
    }
  }
}
</script>

<style scoped>
.delivery-order-list {
  padding: 20px;
}

.search-form {
  margin-bottom: 20px;
}

.pagination {
  margin-top: 20px;
  text-align: right;
}
</style>
```

#### 4.3 更新路由配置

**文件**: `frontend/src/router/index.js`

在 `children` 数组中添加出货单路由：

```javascript
{
  path: 'delivery-orders',
  name: 'DeliveryOrderList',
  component: () => import('@/views/delivery/List.vue'),
  meta: { title: '出货单管理', requiresAuth: true }
},
{
  path: 'delivery-orders/create',
  name: 'DeliveryOrderCreate',
  component: () => import('@/views/delivery/Form.vue'),
  meta: { title: '新建出货单', requiresAuth: true }
},
{
  path: 'delivery-orders/:id',
  name: 'DeliveryOrderDetail',
  component: () => import('@/views/delivery/Detail.vue'),
  meta: { title: '出货单详情', requiresAuth: true }
},
{
  path: 'delivery-orders/:id/edit',
  name: 'DeliveryOrderEdit',
  component: () => import('@/views/delivery/Form.vue'),
  meta: { title: '编辑出货单', requiresAuth: true }
}
```

#### 4.4 更新销售订单页面

**文件**: `frontend/src/views/sales/List.vue`

在操作列中添加"查看施工单"按钮：

```vue
<el-table-column label="操作" width="350" fixed="right">
  <template slot-scope="scope">
    <el-button size="mini" type="text" @click="handleView(scope.row)">查看</el-button>
    <el-button v-if="canEdit(scope.row)" size="mini" type="text" @click="handleEdit(scope.row)">编辑</el-button>
    <el-button v-if="canSubmit(scope.row)" size="mini" type="text" @click="handleSubmit(scope.row)">提交</el-button>
    <el-button v-if="canApprove(scope.row)" size="mini" type="text" @click="handleApprove(scope.row)">审核</el-button>
    <el-button v-if="canStartProduction(scope.row)" size="mini" type="text" @click="handleStartProduction(scope.row)">开始生产</el-button>
    <el-button v-if="canComplete(scope.row)" size="mini" type="text" @click="handleComplete(scope.row)">完成</el-button>
    <el-button v-if="canCancel(scope.row)" size="mini" type="text" @click="handleCancel(scope.row)">取消</el-button>
    <el-button v-if="scope.row.work_orders_count > 0" size="mini" type="success" @click="handleViewWorkOrders(scope.row)">
      查看施工单({{ scope.row.work_orders_count }})
    </el-button>
  </template>
</el-table-column>
```

添加方法：

```javascript
handleViewWorkOrders(row) {
  // 跳转到施工单列表，并筛选该销售订单的施工单
  this.$router.push({
    name: 'WorkOrderList',
    query: { sales_order: row.id }
  })
}
```

### 数据库迁移

创建迁移文件：

```bash
cd backend
python manage.py makemigrations workorder
python manage.py migrate
```

## 四、测试计划

### 4.1 单元测试

1. **自动生成施工单测试**
   - 测试订单审核通过后是否正确生成施工单
   - 测试一个产品的订单
   - 测试多个产品的订单
   - 测试产品默认工序是否正确添加

2. **出货单测试**
   - 测试出货单创建
   - 测试出货单确认
   - 测试出货操作
   - 测试销售订单状态自动更新

### 4.2 集成测试

1. **完整流程测试**
   ```
   创建销售订单 → 提交审核 → 审核通过
   → 验证施工单自动生成 → 施工单生产
   → 创建出货单 → 出货 → 验证订单状态
   ```

2. **库存测试**
   - 测试订单审核通过后库存是否减少
   - 测试生产完成后库存是否增加

### 4.3 前端测试

1. **销售订单页面**
   - 测试订单列表显示
   - 测试订单创建
   - 测试审核功能
   - 测试自动生成的施工单信息显示

2. **出货单页面**
   - 测试出货单列表
   - 测试出货单创建和编辑
   - 测试确认和出货功能
   - 测试物流信息管理

## 五、部署步骤

1. **后端部署**
   ```bash
   # 备份数据库
   python manage.py dumpdata > backup.json
   
   # 应用代码更改
   # (替换 views.py, serializers.py, urls.py, admin.py)
   
   # 创建迁移
   python manage.py makemigrations workorder
   
   # 应用迁移
   python manage.py migrate
   
   # 重启服务
   python manage.py runserver
   ```

2. **前端部署**
   ```bash
   # 添加新的 Vue 文件
   # (创建 delivery 相关文件)
   
   # 更新路由配置
   # (修改 router/index.js)
   
   # 更新 API 配置
   # (创建 api/delivery.js)
   
   # 构建项目
   npm run build
   
   # 部署
   # (按照现有部署流程)
   ```

## 六、使用说明

### 6.1 销售订单使用流程

1. **创建销售订单**
   - 进入"销售订单管理"页面
   - 点击"新建销售订单"
   - 选择客户，添加产品明细
   - 设置交货日期和其他信息
   - 保存

2. **提交审核**
   - 点击"提交"按钮
   - 订单状态变为"已提交"

3. **审核通过（自动生成施工单）**
   - 点击"审核"按钮
   - 填写审核意见
   - 点击"通过"
   - **系统自动生成施工单**
   - 弹出提示：已自动生成 X 个施工单

4. **查看施工单**
   - 点击"查看施工单"按钮
   - 跳转到施工单列表
   - 查看自动生成的施工单

5. **开始生产**
   - 在施工单页面设置工序和任务
   - 执行生产

6. **创建出货单**
   - 生产完成后，在出货单页面创建出货单
   - 关联销售订单
   - 填写物流信息

7. **出货**
   - 确认出货单
   - 执行出货操作
   - 销售订单状态自动变为"已完成"

### 6.2 出货单使用流程

1. **创建出货单**
   - 进入"出货单管理"页面
   - 点击"新建出货单"
   - 选择销售订单（系统自动填充客户、金额等信息）
   - 添加出货明细（从施工单选择产品和数量）
   - 填写物流信息
   - 保存

2. **确认出货**
   - 点击"确认"按钮
   - 状态变为"已确认"

3. **执行出货**
   - 点击"出货"按钮
   - 填写实际出货日期
   - 状态变为"已出货"
   - 销售订单自动完成

## 七、注意事项

### 7.1 数据一致性

1. **库存管理**
   - 销售订单审核通过后会减少库存
   - 生产完成后（包装工序完成）会增加库存
   - 出货时不会影响库存（已在生产时增减）

2. **订单状态**
   - 销售订单状态由出货单自动更新
   - 施工单状态独立管理
   - 避免状态冲突

### 7.2 权限控制

1. **销售订单**
   - 业务员：创建、提交、查看
   - 主管：审核、查看
   - 生产管理员：开始生产

2. **出货单**
   - 业务员：创建、确认
   - 仓储人员：出货
   - 管理员：所有权限

### 7.3 性能优化

1. **数据库查询**
   - 使用 select_related 和 prefetch_related
   - 添加数据库索引

2. **前端加载**
   - 分页加载
   - 懒加载明细
   - 缓存常用数据

## 八、后续优化建议

1. **报表功能**
   - 销售额统计
   - 出货报表
   - 客户订单分析

2. **通知增强**
   - 出货通知
   - 库存预警
   - 订单超时提醒

3. **移动端支持**
   - 移动端出货扫描
   - 物流跟踪集成
