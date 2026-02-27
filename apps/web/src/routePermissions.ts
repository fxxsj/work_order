export type RoutePermissionRule = {
  pattern: RegExp;
  permissions: string[];
};

const rules: RoutePermissionRule[] = [
  { pattern: /^\/dashboard/, permissions: ["workorder.view_workorder"] },
  { pattern: /^\/workorders/, permissions: ["workorder.view_workorder"] },
  { pattern: /^\/tasks/, permissions: ["workorder.view_workorder"] },
  { pattern: /^\/customers/, permissions: ["workorder.view_customer"] },
  { pattern: /^\/departments/, permissions: ["workorder.view_department"] },
  { pattern: /^\/processes/, permissions: ["workorder.view_process"] },
  { pattern: /^\/products/, permissions: ["workorder.view_product"] },
  { pattern: /^\/materials/, permissions: ["workorder.view_material"] },
  { pattern: /^\/product-groups/, permissions: ["workorder.view_productgroup"] },
  { pattern: /^\/artworks/, permissions: ["workorder.view_artwork"] },
  { pattern: /^\/dies/, permissions: ["workorder.view_die"] },
  { pattern: /^\/foiling-plates/, permissions: ["workorder.view_foilingplate"] },
  { pattern: /^\/embossing-plates/, permissions: ["workorder.view_embossingplate"] },
  { pattern: /^\/suppliers/, permissions: ["workorder.view_supplier"] },
  { pattern: /^\/purchase-orders/, permissions: ["workorder.view_purchaseorder"] },
  { pattern: /^\/sales-orders/, permissions: ["workorder.view_salesorder"] },
  { pattern: /^\/inventory\/stocks/, permissions: ["workorder.view_productstock"] },
  { pattern: /^\/inventory\/delivery/, permissions: ["workorder.view_deliveryorder"] },
  { pattern: /^\/inventory\/quality/, permissions: ["workorder.view_qualityinspection"] },
  { pattern: /^\/finance\/invoices/, permissions: ["workorder.view_invoice"] },
  { pattern: /^\/finance\/payments/, permissions: ["workorder.view_payment"] },
  { pattern: /^\/finance\/costs/, permissions: ["workorder.view_productioncost"] },
  { pattern: /^\/finance\/statements/, permissions: ["workorder.view_statement"] },
  { pattern: /^\/notifications/, permissions: ["workorder.view_workorder"] },
  { pattern: /^\/profile/, permissions: ["workorder.view_workorder"] }
];

export const getRoutePermissions = (path: string): string[] => {
  for (const rule of rules) {
    if (rule.pattern.test(path)) {
      return rule.permissions;
    }
  }
  return [];
};
