const form = document.querySelector('#orderForm');
const toast = document.querySelector('#toast');
const previewModal = document.querySelector('#previewModal');
const previewText = document.querySelector('#previewText');
const heroDate = document.querySelector('#heroDate');
const returnDateTimeInput = document.querySelector('#returnDateTime');
const returnDateTimeDisplay = document.querySelector('#returnDateTimeDisplay');
const returnDateTimeLabel = document.querySelector('#returnDateTimeLabel');
const reserveDateInput = document.querySelector('#reserveDate');
const returnDateInput = document.querySelector('#returnDate');
const reserveDateLabel = document.querySelector('#reserveDateLabel');
const calendarTriggers = document.querySelectorAll('.date-trigger, .datetime-trigger');
const datePickers = document.querySelectorAll('.date-picker-popover');
const reserveDatePicker = document.querySelector('#reserveDatePicker');
const returnDatePicker = document.querySelector('#returnDateTimePicker');
let activeCalendar = null;
const styleCount = document.querySelector('#styleCount');
const storeHoursDisplay = document.querySelector('#storeHoursDisplay');
const heroBackgroundImage = document.querySelector('#heroBackgroundImage');
const HERO_BACKGROUND_IMAGES = [
  'assets/hero-snow-mountain.jpg',
];
let heroBackgroundIndex = 0;

function initHeroBackgroundCarousel() {
  if (!heroBackgroundImage || !HERO_BACKGROUND_IMAGES.length) return;

  const showHeroBackground = (index) => {
    heroBackgroundImage.classList.remove('is-visible');
    heroBackgroundImage.onload = () => heroBackgroundImage.classList.add('is-visible');
    heroBackgroundImage.src = HERO_BACKGROUND_IMAGES[index];
    if (heroBackgroundImage.complete && heroBackgroundImage.naturalWidth > 0) {
      heroBackgroundImage.classList.add('is-visible');
    }
  };

  showHeroBackground(heroBackgroundIndex);
  if (HERO_BACKGROUND_IMAGES.length < 2) return;

  window.setInterval(() => {
    heroBackgroundIndex = (heroBackgroundIndex + 1) % HERO_BACKGROUND_IMAGES.length;
    showHeroBackground(heroBackgroundIndex);
  }, 6000);
}

const styleSelection = new Set();
const packageSelection = new Set();
const CONFIG_STORAGE_KEY = 'sweet-snow-order-config';
const DEFAULT_CONFIG = {
  styles: [
    { name: '星芒粉色', sizes: ['S码', 'M码', 'L码'] },
    { name: '天使羽翼', sizes: ['S码', 'M码', 'L码'] },
    { name: '小黄鸡', sizes: ['S码', 'M码', 'L码'] },
    { name: '星河蓝', sizes: ['S码', 'M码', 'L码'] },
  ],
  packages: ['雪服', '雪裤', '手套', '头盔', '雪镜', '护臀', '护膝', '小乌龟护臀护膝'],
  salesPeople: ['乐乐', '发财', '娟娟', '黑黑'],
  storeHours: { open: '09:00', close: '20:00' },
};

function normalizeConfig(value) {
  const source = value && typeof value === 'object' ? value : {};
  const styles = Array.isArray(source.styles)
    ? source.styles
      .map((style) => ({
        name: String(style?.name || '').trim(),
        sizes: Array.isArray(style?.sizes)
          ? [...new Set(style.sizes.map((size) => String(size || '').trim()).filter(Boolean))]
          : [],
      }))
      .filter((style) => style.name)
    : [];
  const packages = Array.isArray(source.packages)
    ? [...new Set(source.packages.map((item) => String(item || '').trim()).filter(Boolean))]
    : [];
  const salesPeople = Array.isArray(source.salesPeople)
    ? [...new Set(source.salesPeople.map((item) => String(item || '').trim()).filter(Boolean))]
    : [...DEFAULT_CONFIG.salesPeople];
  const open = /^\d{2}:\d{2}$/.test(source.storeHours?.open) ? source.storeHours.open : DEFAULT_CONFIG.storeHours.open;
  const close = /^\d{2}:\d{2}$/.test(source.storeHours?.close) ? source.storeHours.close : DEFAULT_CONFIG.storeHours.close;
  return {
    styles: styles.length ? styles : DEFAULT_CONFIG.styles.map((style) => ({ ...style, sizes: [...style.sizes] })),
    packages: packages.length ? packages : [...DEFAULT_CONFIG.packages],
    salesPeople,
    storeHours: { open, close },
  };
}

function loadConfig() {
  try {
    const stored = window.localStorage.getItem(CONFIG_STORAGE_KEY);
    return normalizeConfig(stored ? JSON.parse(stored) : DEFAULT_CONFIG);
  } catch {
    return normalizeConfig(DEFAULT_CONFIG);
  }
}

let appConfig = loadConfig();

const ordersStorageKey = 'sweet-snow-orders';
const managementView = document.querySelector('#orderManagement');
const bottomNavItems = document.querySelectorAll('.bottom-nav-item');
const filterSalesPersonPicker = document.querySelector('#filterSalesPersonPicker');
const filterSalesPersonTrigger = document.querySelector('#filterSalesPersonTrigger');
const filterSalesPersonMenu = document.querySelector('#filterSalesPersonMenu');
const filterSalesPersonLabel = document.querySelector('#filterSalesPersonLabel');
const filterSalesPerson = document.querySelector('#filterSalesPerson');
const filterOrderStatusPicker = document.querySelector('#filterOrderStatusPicker');
const filterOrderStatusTrigger = document.querySelector('#filterOrderStatusTrigger');
const filterOrderStatusMenu = document.querySelector('#filterOrderStatusMenu');
const filterOrderStatusLabel = document.querySelector('#filterOrderStatusLabel');
const filterOrderStatus = document.querySelector('#filterOrderStatus');
const filterPhone = document.querySelector('#filterPhone');
const filterReserveDate = document.querySelector('#filterReserveDate');
const filterReserveDateLabel = document.querySelector('#filterReserveDateLabel');
const filterReserveDatePicker = document.querySelector('#filterReserveDatePicker');
const settingsOpenTimeInput = document.querySelector('#settingsOpenTime');
const settingsOpenTimeLabel = document.querySelector('#settingsOpenTimeLabel');
const settingsOpenTimePicker = document.querySelector('#settingsOpenTimePicker');
const settingsCloseTimeInput = document.querySelector('#settingsCloseTime');
const settingsCloseTimeLabel = document.querySelector('#settingsCloseTimeLabel');
const settingsCloseTimePicker = document.querySelector('#settingsCloseTimePicker');
const orderList = document.querySelector('#orderList');
const emptyOrders = document.querySelector('#emptyOrders');
const emptyOrdersTitle = document.querySelector('#emptyOrdersTitle');
const emptyOrdersText = document.querySelector('#emptyOrdersText');
const orderResultCount = document.querySelector('#orderResultCount');
const orderCountBadge = document.querySelector('#orderCountBadge');
let orders = loadOrders();
let pendingOrderData = null;

function loadOrders() {
  try {
    const storedOrders = JSON.parse(localStorage.getItem(ordersStorageKey) || '[]');
    return Array.isArray(storedOrders) ? storedOrders : [];
  } catch {
    return [];
  }
}

function persistOrders() {
  try {
    localStorage.setItem(ordersStorageKey, JSON.stringify(orders));
  } catch {
    showToast('订单已生成，但暂时无法保存到本机');
  }
}

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function formatCreatedAt(value) {
  if (!value) return '刚刚生成';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '刚刚生成';
  return new Intl.DateTimeFormat('zh-CN', {
    timeZone: 'Asia/Shanghai',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date).replaceAll('/', '.');
}

function getOrderFilters() {
  return {
    salesPerson: filterSalesPerson.value,
    orderStatus: filterOrderStatus.value,
    phone: filterPhone.value.trim(),
    reserveDate: filterReserveDate.value,
  };
}

function matchesOrder(order, filters) {
  return (!filters.salesPerson || order.salesPerson === filters.salesPerson)
    && (!filters.orderStatus || order.orderStatus === filters.orderStatus)
    && (!filters.phone || String(order.phone || '').includes(filters.phone))
    && (!filters.reserveDate || order.reserveDate === filters.reserveDate);
}

function syncFilterSelect(input, label, menu) {
  const selectedOption = [...menu.querySelectorAll('[data-filter-option]')]
    .find((option) => option.dataset.value === input.value);
  const fallbackOption = menu.querySelector('[data-filter-option]');
  const activeOption = selectedOption || fallbackOption;
  input.value = activeOption?.dataset.value || '';
  label.textContent = activeOption?.textContent || '';
  menu.querySelectorAll('[data-filter-option]').forEach((option) => {
    const isSelected = option === activeOption;
    option.classList.toggle('is-selected', isSelected);
    option.setAttribute('aria-selected', String(isSelected));
  });
}

function ensureSalesPersonFilterOptions() {
  const selectedValue = filterSalesPerson.value;
  const salesPeople = [...new Set([
    ...appConfig.salesPeople,
    ...orders.map((order) => order.salesPerson).filter(Boolean),
  ])];
  filterSalesPersonMenu.querySelectorAll('[data-filter-option]:not([data-value=""])').forEach((option) => option.remove());
  salesPeople.forEach((salesPerson) => {
    const option = document.createElement('button');
    option.type = 'button';
    option.className = 'select-menu-option';
    option.dataset.filterOption = 'true';
    option.dataset.value = salesPerson;
    option.setAttribute('role', 'option');
    option.setAttribute('aria-selected', 'false');
    option.textContent = salesPerson;
    filterSalesPersonMenu.appendChild(option);
  });
  filterSalesPerson.value = salesPeople.includes(selectedValue) ? selectedValue : '';
  syncFilterSelect(filterSalesPerson, filterSalesPersonLabel, filterSalesPersonMenu);
}

function getFilteredOrders() {
  const filters = getOrderFilters();
  return orders.filter((order) => matchesOrder(order, filters));
}

function renderOrderCard(order) {
  const statusClass = order.orderStatus === '已付款' ? ' is-paid' : '';
  const styles = order.styles?.length ? order.styles.join('、') : '到店选款';
  const packages = order.packages?.length ? order.packages.join('、') : '待确认';
  const price = order.price || '待填写';
  return `
    <article class="order-card">
      <div class="order-card-header">
        <div>
          <span class="order-card-eyebrow">预订单 · #${escapeHtml(order.orderNo || '000000')}</span>
          <h3>客户：${escapeHtml(order.customerName || '未填写客户')}</h3>
        </div>
        <span class="status-pill${statusClass}">${escapeHtml(order.orderStatus || '未付款')}</span>
      </div>
      <div class="order-card-meta">
        <span>销售人员：${escapeHtml(order.salesPerson || '未填写')}</span>
        <span>手机号：${escapeHtml(order.phone || '未填写')}</span>
        <span>预订日期：${escapeHtml(formatDate(order.reserveDate) || '未设置')}</span>
        <span>归还日期：${escapeHtml(formatDate(order.returnDate) || '未设置')}</span>
      </div>
      <div class="order-card-details">
        <span>套数：<strong>${escapeHtml(order.quantity || '1')}</strong></span>
        <span>价格：<strong>${escapeHtml(price)}</strong></span>
        <span>意向款式：<strong>${escapeHtml(styles)}</strong></span>
        <span>套餐：<strong>${escapeHtml(packages)}</strong></span>
      </div>
      <div class="order-card-footer">
        <span>创建时间 ${escapeHtml(formatCreatedAt(order.createdAt))}</span>
        <button type="button" class="order-copy-button" data-copy-order-id="${escapeHtml(order.id)}">复制订单</button>
      </div>
    </article>`;
}

function renderOrderManagement() {
  ensureSalesPersonFilterOptions();
  const filteredOrders = getFilteredOrders();
  orderResultCount.textContent = `${filteredOrders.length} 条订单`;
  orderList.innerHTML = filteredOrders.map(renderOrderCard).join('');
  const hasOrders = orders.length > 0;
  const hasFilteredOrders = filteredOrders.length > 0;
  emptyOrders.hidden = hasFilteredOrders;
  if (!hasOrders) {
    emptyOrdersTitle.textContent = '还没有预订单';
    emptyOrdersText.textContent = '生成预订单后，订单会自动记录在这里。';
  } else if (!hasFilteredOrders) {
    emptyOrdersTitle.textContent = '没有找到匹配订单';
    emptyOrdersText.textContent = '可以调整筛选条件后重新查询。';
  }
  orderCountBadge.textContent = String(orders.length);
  orderCountBadge.hidden = orders.length === 0;
}

function saveGeneratedOrder(data) {
  const order = {
    ...data,
    id: `order-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    orderNo: String(Date.now()).slice(-6),
    createdAt: new Date().toISOString(),
    orderText: buildOrderText(data),
  };
  orders = [order, ...orders];
  persistOrders();
  renderOrderManagement();
  return order;
}

function copyText(text) {
  return navigator.clipboard.writeText(text);
}

function setActiveView(view) {
  const showManagement = view === 'manage';
  const showSettings = view === 'settings';
  document.querySelectorAll('.create-view').forEach((element) => {
    element.hidden = view !== 'create';
  });
  managementView.hidden = !showManagement;
  document.querySelector('#settingsPage').hidden = !showSettings;
  bottomNavItems.forEach((item) => {
    const isActive = item.dataset.view === view;
    item.classList.toggle('is-active', isActive);
    if (isActive) item.setAttribute('aria-current', 'page');
    else item.removeAttribute('aria-current');
  });
  if (showManagement) renderOrderManagement();
  if (showSettings) renderSettingsPage();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function formatDate(dateValue, separator = '年') {
  if (!dateValue) return '';
  const [year, month, day] = dateValue.split('-');
  if (separator === '.') return `${year}.${month}.${day}`;
  return `${year}年${Number(month)}月${Number(day)}日`;
}

function formatDateTimeValue(dateTimeValue) {
  if (!dateTimeValue) return '未设置';
  const [dateValue, timeValue] = dateTimeValue.split('T');
  return `${formatDate(dateValue)} ${timeValue || '19:30'}`;
}

function getTodayDateValue() {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Shanghai',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date());
  const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
  return `${values.year}-${values.month}-${values.day}`;
}

function setDefaultDateValues() {
  const today = getTodayDateValue();
  const timeValue = returnDateTimeInput.value.split('T')[1] || '19:30';
  reserveDateInput.value = today;
  returnDateInput.value = today;
  returnDateTimeInput.value = `${today}T${timeValue}`;
}

function syncDatetimeDisplay() {
  returnDateTimeLabel.textContent = formatDateTimeValue(returnDateTimeInput.value);
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add('is-visible');
  window.clearTimeout(showToast.timer);
  showToast.timer = window.setTimeout(() => toast.classList.remove('is-visible'), 2200);
}

function syncDateTriggerDisplays() {
  reserveDateLabel.textContent = reserveDateInput.value ? formatDate(reserveDateInput.value) : '未设置';
}

function syncFilterReserveDateDisplay() {
  filterReserveDateLabel.textContent = filterReserveDate.value ? formatDate(filterReserveDate.value) : '选择日期';
}

function updateDateSummary() {
  const reserveDate = reserveDateInput.value;
  const returnDate = returnDateInput.value;
  const returnDateTime = returnDateTimeInput.value;
  const [selectedReturnDate, selectedReturnTime] = returnDateTime.split('T');
  const summaryDate = selectedReturnDate || returnDate;
  const summaryTime = selectedReturnTime || '19:30';
  heroDate.textContent = reserveDate ? formatDate(reserveDate, '.') : '未设置';
  syncDateTriggerDisplays();
}

function updateStyleCount() {
  styleCount.textContent = `${styleSelection.size} 款已选`;
}

function getStyleSelection(styleName) {
  return [...styleSelection].find((value) => value.startsWith(`${styleName} `));
}

function removeStyleSelection(styleName) {
  [...styleSelection]
    .filter((value) => value === styleName || value.startsWith(`${styleName} `))
    .forEach((value) => styleSelection.delete(value));
}

function renderStyleOption(button) {
  const styleName = button.dataset.styleName;
  const selectedValue = styleName === '到店选款'
    ? (styleSelection.has('到店选款') ? '到店选款' : '')
    : getStyleSelection(styleName);
  const sizeLabel = button.querySelector('.style-size-label');
  button.classList.toggle('is-selected', Boolean(selectedValue));
  if (sizeLabel) sizeLabel.textContent = selectedValue ? selectedValue.replace(`${styleName} `, '') : '选尺码';
}

function renderAllStyleOptions() {
  document.querySelectorAll('#styleOptions .style-option').forEach(renderStyleOption);
}

function closeAllStyleDropdowns() {
  document.querySelectorAll('#styleOptions .style-size-dropdown').forEach((dropdown) => {
    dropdown.hidden = true;
  });
}

function createStyleSizeDropdown(sizes = []) {
  const dropdown = document.createElement('div');
  dropdown.className = 'style-size-dropdown';
  dropdown.hidden = true;
  sizes.forEach((size) => {
    const option = document.createElement('button');
    option.type = 'button';
    option.className = 'size-option';
    option.dataset.size = size;
    option.textContent = size;
    dropdown.appendChild(option);
  });
  const clearButton = document.createElement('button');
  clearButton.type = 'button';
  clearButton.className = 'size-clear-option';
  clearButton.dataset.clearStyle = 'true';
  clearButton.textContent = '取消';
  dropdown.appendChild(clearButton);
  return dropdown;
}

function renderOrderStyleOptions() {
  const container = document.querySelector('#styleOptions');
  container.replaceChildren();
  appConfig.styles.forEach((style) => {
    const wrapper = document.createElement('div');
    wrapper.className = 'style-option-wrap';
    const option = document.createElement('button');
    option.type = 'button';
    option.className = 'select-chip style-option';
    option.dataset.group = 'styles';
    option.dataset.styleName = style.name;
    option.dataset.value = style.name;
    option.innerHTML = '<span class="chip-check">✓</span><span></span><em class="style-size-label">选尺码</em><span class="style-chevron" aria-hidden="true">⌄</span>';
    option.querySelector('span:nth-child(2)').textContent = style.name;
    wrapper.append(option, createStyleSizeDropdown(style.sizes));
    container.appendChild(wrapper);
  });

  const storeOption = document.createElement('button');
  storeOption.type = 'button';
  storeOption.className = 'select-chip style-option store-selection';
  storeOption.dataset.group = 'styles';
  storeOption.dataset.styleName = '到店选款';
  storeOption.dataset.value = '到店选款';
  storeOption.innerHTML = '<span class="chip-check">✓</span><span>到店选款</span>';
  container.appendChild(storeOption);
  renderAllStyleOptions();
}

function renderSalesPersonOptions(preferredValue = salesPersonValue.value) {
  const customArea = salesPersonMenu.querySelector('.select-menu-custom');
  salesPersonMenu.querySelectorAll('.select-menu-option').forEach((option) => option.remove());
  const selectedValue = appConfig.salesPeople.includes(preferredValue)
    ? preferredValue
    : (appConfig.salesPeople[0] || preferredValue || '');
  appConfig.salesPeople.forEach((salesPerson) => {
    const option = document.createElement('button');
    option.type = 'button';
    option.className = 'select-menu-option';
    option.dataset.value = salesPerson;
    option.setAttribute('role', 'option');
    option.textContent = salesPerson;
    salesPersonMenu.insertBefore(option, customArea);
  });
  salesPersonValue.value = selectedValue;
  salesPersonLabel.textContent = selectedValue || '直接输入';
  salesPersonInput.value = appConfig.salesPeople.includes(selectedValue) ? '' : selectedValue;
  salesPersonMenu.querySelectorAll('.select-menu-option').forEach((option) => {
    const isSelected = option.dataset.value === selectedValue;
    option.classList.toggle('is-selected', isSelected);
    option.setAttribute('aria-selected', String(isSelected));
  });
}

function renderOrderPackageOptions() {
  const container = document.querySelector('#packageOptions');
  container.replaceChildren();
  appConfig.packages.forEach((packageName) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'select-chip';
    button.dataset.group = 'packages';
    button.dataset.value = packageName;
    button.innerHTML = '<span class="chip-check">✓</span><span></span>';
    button.querySelector('span:nth-child(2)').textContent = packageName;
    button.classList.toggle('is-selected', packageSelection.has(packageName));
    container.appendChild(button);
  });
}

function formatTimeValue(value) {
  if (!value) return '';
  const [hour, minute] = value.split(':');
  return `${Number(hour)}:${minute}`;
}

function getStoreHoursText(separator = '-') {
  return `${formatTimeValue(appConfig.storeHours.open)}${separator}${formatTimeValue(appConfig.storeHours.close)}`;
}

function syncStoreHoursDisplay() {
  storeHoursDisplay.textContent = getStoreHoursText('—');
}

function toggleStyleDropdown(button) {
  const dropdown = button.closest('.style-option-wrap')?.querySelector('.style-size-dropdown');
  if (!dropdown) return;
  const shouldOpen = dropdown.hidden;
  closeAllStyleDropdowns();
  dropdown.hidden = !shouldOpen;
}

function selectStyleSize(button, size) {
  const styleName = button.dataset.styleName;
  removeStyleSelection(styleName);
  styleSelection.delete('到店选款');
  styleSelection.add(`${styleName} ${size}`);
  renderAllStyleOptions();
  updateStyleCount();
  closeAllStyleDropdowns();
}

function selectStoreOption() {
  if (styleSelection.has('到店选款')) {
    styleSelection.delete('到店选款');
  } else {
    styleSelection.clear();
    styleSelection.add('到店选款');
  }
  renderAllStyleOptions();
  updateStyleCount();
  closeAllStyleDropdowns();
}

function bindStyleOptions() {
  const container = document.querySelector('#styleOptions');
  container.addEventListener('click', (event) => {
    const sizeButton = event.target.closest('.size-option');
    if (sizeButton) {
      const wrapper = sizeButton.closest('.style-option-wrap');
      const styleButton = wrapper?.querySelector('button.style-option');
      if (styleButton) selectStyleSize(styleButton, sizeButton.dataset.size);
      return;
    }

    const clearButton = event.target.closest('.size-clear-option');
    if (clearButton) {
      const wrapper = clearButton.closest('.style-option-wrap');
      const styleButton = wrapper?.querySelector('button.style-option');
      if (styleButton) {
        removeStyleSelection(styleButton.dataset.styleName);
        renderStyleOption(styleButton);
        updateStyleCount();
      }
      closeAllStyleDropdowns();
      return;
    }

    const button = event.target.closest('button.style-option');
    if (!button) return;
    if (button.dataset.styleName === '到店选款') {
      selectStoreOption();
      return;
    }
    toggleStyleDropdown(button);
  });
}

function bindMultiChoice(containerId, selection) {
  const container = document.querySelector(`#${containerId}`);
  container.addEventListener('click', (event) => {
    const button = event.target.closest('button[data-value]');
    if (!button) return;
    const value = button.dataset.value;
    if (selection.has(value)) {
      selection.delete(value);
      button.classList.remove('is-selected');
    } else {
      selection.add(value);
      button.classList.add('is-selected');
    }
  });
}

function renderSettingsStyleList() {
  const container = document.querySelector('#settingsStyleList');
  const count = document.querySelector('#settingsStyleCount');
  container.replaceChildren();
  count.textContent = `${appConfig.styles.length} 个款式`;
  appConfig.styles.forEach((style, styleIndex) => {
    const row = document.createElement('div');
    row.className = 'settings-style-row';
    row.dataset.styleIndex = String(styleIndex);

    const header = document.createElement('div');
    header.className = 'settings-row-header';
    const nameInput = document.createElement('input');
    nameInput.className = 'settings-name-input';
    nameInput.value = style.name;
    nameInput.setAttribute('aria-label', `款式名称${styleIndex + 1}`);
    nameInput.addEventListener('input', () => {
      appConfig.styles[styleIndex].name = nameInput.value;
    });
    const removeButton = document.createElement('button');
    removeButton.type = 'button';
    removeButton.className = 'settings-remove-button';
    removeButton.dataset.removeStyle = 'true';
    removeButton.textContent = '删除款式';
    header.append(nameInput, removeButton);

    const sizeList = document.createElement('div');
    sizeList.className = 'settings-size-list';
    style.sizes.forEach((size, sizeIndex) => {
      const sizeChip = document.createElement('button');
      sizeChip.type = 'button';
      sizeChip.className = 'settings-size-chip';
      sizeChip.dataset.removeSize = String(sizeIndex);
      sizeChip.innerHTML = '<span></span><b aria-hidden="true">×</b>';
      sizeChip.querySelector('span').textContent = size;
      sizeList.appendChild(sizeChip);
    });

    const addRow = document.createElement('div');
    addRow.className = 'settings-inline-add';
    const sizeInput = document.createElement('input');
    sizeInput.type = 'text';
    sizeInput.placeholder = '添加尺码，例如：XL码';
    sizeInput.dataset.sizeInput = 'true';
    const addSizeButton = document.createElement('button');
    addSizeButton.type = 'button';
    addSizeButton.className = 'text-button';
    addSizeButton.dataset.addSize = 'true';
    addSizeButton.textContent = '添加尺码';
    addRow.append(sizeInput, addSizeButton);
    row.append(header, sizeList, addRow);
    container.appendChild(row);
  });
}

function renderSettingsPackageList() {
  const container = document.querySelector('#settingsPackageList');
  const count = document.querySelector('#settingsPackageCount');
  container.replaceChildren();
  count.textContent = `${appConfig.packages.length} 个套餐`;
  appConfig.packages.forEach((packageName, packageIndex) => {
    const row = document.createElement('div');
    row.className = 'settings-package-row';
    const input = document.createElement('input');
    input.value = packageName;
    input.setAttribute('aria-label', `套餐名称${packageIndex + 1}`);
    input.addEventListener('input', () => {
      appConfig.packages[packageIndex] = input.value;
    });
    const removeButton = document.createElement('button');
    removeButton.type = 'button';
    removeButton.className = 'settings-remove-button';
    removeButton.dataset.removePackage = String(packageIndex);
    removeButton.textContent = '删除';
    row.append(input, removeButton);
    container.appendChild(row);
  });
}

function renderSettingsSalesPeopleList() {
  const container = document.querySelector('#settingsSalesPeopleList');
  const count = document.querySelector('#settingsSalesPeopleCount');
  container.replaceChildren();
  count.textContent = `${appConfig.salesPeople.length} 人员`;
  appConfig.salesPeople.forEach((salesPerson, salesPersonIndex) => {
    const row = document.createElement('div');
    row.className = 'settings-package-row';
    row.dataset.salesPersonIndex = String(salesPersonIndex);
    const input = document.createElement('input');
    input.value = salesPerson;
    input.setAttribute('aria-label', `销售人员${salesPersonIndex + 1}`);
    input.addEventListener('input', () => {
      const previousValue = appConfig.salesPeople[salesPersonIndex];
      appConfig.salesPeople[salesPersonIndex] = input.value;
      if (salesPersonValue.value === previousValue) {
        salesPersonValue.value = input.value.trim();
      }
      syncSalesPeopleOptions();
    });
    const removeButton = document.createElement('button');
    removeButton.type = 'button';
    removeButton.className = 'settings-remove-button';
    removeButton.dataset.removeSalesPerson = String(salesPersonIndex);
    removeButton.textContent = '删除';
    row.append(input, removeButton);
    container.appendChild(row);
  });
}

function syncSalesPeopleOptions() {
  renderSalesPersonOptions();
  ensureSalesPersonFilterOptions();
}

function syncSettingsTimeDisplay() {
  settingsOpenTimeInput.value = appConfig.storeHours.open;
  settingsCloseTimeInput.value = appConfig.storeHours.close;
  settingsOpenTimeLabel.textContent = appConfig.storeHours.open;
  settingsCloseTimeLabel.textContent = appConfig.storeHours.close;
}

function renderSettingsPage() {
  renderSettingsSalesPeopleList();
  renderSettingsStyleList();
  renderSettingsPackageList();
  syncSettingsTimeDisplay();
}

function saveConfiguration() {
  appConfig = normalizeConfig(appConfig);
  window.localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(appConfig));
  styleSelection.forEach((value) => {
    const styleName = value === '到店选款' ? value : value.split(' ').slice(0, -1).join(' ');
    if (styleName !== '到店选款' && !appConfig.styles.some((style) => style.name === styleName)) {
      styleSelection.delete(value);
    }
  });
  [...packageSelection].forEach((value) => {
    if (!appConfig.packages.includes(value)) packageSelection.delete(value);
  });
  syncSalesPeopleOptions();
  renderOrderStyleOptions();
  renderOrderPackageOptions();
  syncStoreHoursDisplay();
  renderSettingsPage();
  updateStyleCount();
}

function bindSettingsPage() {
  const salesPeopleList = document.querySelector('#settingsSalesPeopleList');
  const styleList = document.querySelector('#settingsStyleList');
  const packageList = document.querySelector('#settingsPackageList');
  const newSalesPersonInput = document.querySelector('#settingsNewSalesPerson');
  const newStyleInput = document.querySelector('#settingsNewStyle');
  const newPackageInput = document.querySelector('#settingsNewPackage');

  document.querySelector('#settingsAddSalesPerson').addEventListener('click', () => {
    const name = newSalesPersonInput.value.trim();
    if (!name) {
      showToast('先输入销售人员名称');
      newSalesPersonInput.focus();
      return;
    }
    if (appConfig.salesPeople.includes(name)) {
      showToast('这个销售人员已经存在');
      return;
    }
    appConfig.salesPeople.push(name);
    newSalesPersonInput.value = '';
    renderSettingsSalesPeopleList();
    syncSalesPeopleOptions();
  });

  document.querySelector('#settingsAddStyle').addEventListener('click', () => {
    const name = newStyleInput.value.trim();
    if (!name) {
      showToast('先输入款式名称');
      newStyleInput.focus();
      return;
    }
    if (appConfig.styles.some((style) => style.name === name)) {
      showToast('这个款式已经存在');
      return;
    }
    appConfig.styles.push({ name, sizes: ['S码', 'M码', 'L码'] });
    newStyleInput.value = '';
    renderSettingsStyleList();
  });

  document.querySelector('#settingsAddPackage').addEventListener('click', () => {
    const name = newPackageInput.value.trim();
    if (!name) {
      showToast('先输入套餐名称');
      newPackageInput.focus();
      return;
    }
    if (appConfig.packages.includes(name)) {
      showToast('这个套餐已经存在');
      return;
    }
    appConfig.packages.push(name);
    newPackageInput.value = '';
    renderSettingsPackageList();
  });

  [newSalesPersonInput, newStyleInput, newPackageInput].forEach((input) => {
    input.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') {
        event.preventDefault();
        input.nextElementSibling.click();
      }
    });
  });

  styleList.addEventListener('click', (event) => {
    const row = event.target.closest('.settings-style-row');
    if (!row) return;
    const styleIndex = Number(row.dataset.styleIndex);
    if (event.target.closest('[data-remove-style]')) {
      appConfig.styles.splice(styleIndex, 1);
      renderSettingsStyleList();
      return;
    }
    const removeSize = event.target.closest('[data-remove-size]');
    if (removeSize) {
      appConfig.styles[styleIndex].sizes.splice(Number(removeSize.dataset.removeSize), 1);
      renderSettingsStyleList();
      return;
    }
    if (event.target.closest('[data-add-size]')) {
      const input = row.querySelector('[data-size-input]');
      const size = input.value.trim();
      if (!size) return;
      if (!appConfig.styles[styleIndex].sizes.includes(size)) {
        appConfig.styles[styleIndex].sizes.push(size);
      }
      renderSettingsStyleList();
    }
  });

  salesPeopleList.addEventListener('click', (event) => {
    const removeButton = event.target.closest('[data-remove-sales-person]');
    if (!removeButton) return;
    appConfig.salesPeople.splice(Number(removeButton.dataset.removeSalesPerson), 1);
    renderSettingsSalesPeopleList();
    syncSalesPeopleOptions();
  });

  packageList.addEventListener('click', (event) => {
    const removeButton = event.target.closest('[data-remove-package]');
    if (!removeButton) return;
    appConfig.packages.splice(Number(removeButton.dataset.removePackage), 1);
    renderSettingsPackageList();
  });

  document.querySelector('#saveSettings').addEventListener('click', () => {
    saveConfiguration();
    showToast('设置已保存');
  });
}

function getFormData() {
  return {
    salesPerson: document.querySelector('#salesPerson').value.trim(),
    orderStatus: document.querySelector('#orderStatus').value,
    reserveDate: document.querySelector('#reserveDate').value,
    returnDate: document.querySelector('#returnDate').value,
    returnDateTime: returnDateTimeInput.value,
    customerName: document.querySelector('#customerName').value.trim(),
    phone: document.querySelector('#phone').value.trim(),
    quantity: document.querySelector('#quantity').value,
    price: document.querySelector('#price').value.trim(),
    note: document.querySelector('#note').value.trim(),
    styles: [...styleSelection],
    packages: [...packageSelection],
  };
}

function buildOrderText(data) {
  const styleLines = data.styles.length
    ? data.styles.map((style, index) => `${index + 1}.${style}`).join('\n')
    : '到店选款';
  const packageText = data.packages.length ? data.packages.join('、') : '待确认';
  const priceText = data.price || '待填写';
  const noteText = data.note || '';
  const returnDateTimeText = data.returnDateTime
    ? `${formatDate(data.returnDateTime.split('T')[0])} ${data.returnDateTime.split('T')[1] || '19:30'}`
    : '未设置';

  return [
    '预订单',
    '',
    `销售人员：${data.salesPerson}`,
    `订单状态：${data.orderStatus}`,
    '',
    '门店：甜美雪服',
    `预订日期：${formatDate(data.reserveDate)}`,
    `归还时间：${returnDateTimeText}`,
    '',
    `客户姓名：${data.customerName}`,
    `手机号：${data.phone}`,
    `套数：${data.quantity}`,
    `价格：${priceText}`,
    '',
    '意向款式尺码：',
    styleLines,
    '',
    `套餐：${packageText}`,
    '',
    `门店营业时间：${getStoreHoursText('-')}`,
    '',
    `备注：${noteText}`,
  ].join('\n');
}

function openPreview() {
  const data = getFormData();
  if (!data.salesPerson) {
    showToast('请填写销售人员');
    document.querySelector('#salesPersonCustom').focus();
    return;
  }
  if (!data.customerName) {
    showToast('请填写客户姓名');
    document.querySelector('#customerName').focus();
    return;
  }
  if (!/^1\d{10}$/.test(data.phone)) {
    showToast('请输入正确的11位手机号');
    document.querySelector('#phone').focus();
    return;
  }
  pendingOrderData = data;
  previewText.textContent = buildOrderText(data);
  previewModal.classList.add('is-open');
  previewModal.setAttribute('aria-hidden', 'false');
}

function closePreview() {
  pendingOrderData = null;
  previewModal.classList.remove('is-open');
  previewModal.setAttribute('aria-hidden', 'true');
}

function completePreview() {
  if (!pendingOrderData) {
    closePreview();
    return;
  }
  saveGeneratedOrder(pendingOrderData);
  closePreview();
  clearForm();
  showToast('预订单已生成，可以继续录入下一单');
}

function clearForm() {
  form.reset();
  initHeroBackgroundCarousel();
setDefaultDateValues();
  renderSalesPersonOptions();
  document.querySelector('#salesPersonTrigger').setAttribute('aria-expanded', 'false');
  document.querySelector('#salesPersonMenu').hidden = true;
  document.querySelector('#salesPersonCustom').value = '';
  setOrderStatus('未付款');
  document.querySelectorAll('.select-chip').forEach((button) => button.classList.remove('is-selected'));
  styleSelection.clear();
  renderAllStyleOptions();
  packageSelection.clear();
  updateStyleCount();
  updateDateSummary();
  syncDateTriggerDisplays();
  syncDatetimeDisplay();
  showToast('已清空填写内容');
}

const salesPersonPicker = document.querySelector('#salesPersonPicker');
const salesPersonTrigger = document.querySelector('#salesPersonTrigger');
const salesPersonMenu = document.querySelector('#salesPersonMenu');
const salesPersonInput = document.querySelector('#salesPersonCustom');
const salesPersonValue = document.querySelector('#salesPerson');
const salesPersonLabel = document.querySelector('#salesPersonLabel');
const orderStatusPicker = document.querySelector('#orderStatusPicker');
const orderStatusTrigger = document.querySelector('#orderStatusTrigger');
const orderStatusMenu = document.querySelector('#orderStatusMenu');
const orderStatusValue = document.querySelector('#orderStatus');
const orderStatusLabel = document.querySelector('#orderStatusLabel');

salesPersonTrigger.addEventListener('click', () => {
  const isOpen = !salesPersonMenu.hidden;
  salesPersonMenu.hidden = isOpen;
  salesPersonTrigger.setAttribute('aria-expanded', String(!isOpen));
});

salesPersonMenu.addEventListener('click', (event) => {
  const option = event.target.closest('.select-menu-option');
  if (!option) return;
  salesPersonValue.value = option.dataset.value;
  salesPersonInput.value = '';
  salesPersonLabel.textContent = option.dataset.value;
  salesPersonMenu.querySelectorAll('.select-menu-option').forEach((item) => {
    const isSelected = item === option;
    item.classList.toggle('is-selected', isSelected);
    item.setAttribute('aria-selected', String(isSelected));
  });
  salesPersonMenu.hidden = true;
  salesPersonTrigger.setAttribute('aria-expanded', 'false');
});

salesPersonInput.addEventListener('input', () => {
  const value = salesPersonInput.value.trim();
  salesPersonValue.value = value;
  salesPersonLabel.textContent = value || '直接输入';
});

salesPersonInput.addEventListener('focus', () => {
  salesPersonMenu.hidden = false;
  salesPersonTrigger.setAttribute('aria-expanded', 'true');
});

function setOrderStatus(value) {
  orderStatusValue.value = value;
  orderStatusLabel.textContent = value;
  orderStatusMenu.querySelectorAll('.select-menu-option').forEach((option) => {
    const isSelected = option.dataset.value === value;
    option.classList.toggle('is-selected', isSelected);
    option.setAttribute('aria-selected', String(isSelected));
  });
}

orderStatusTrigger.addEventListener('click', () => {
  const isOpen = !orderStatusMenu.hidden;
  orderStatusMenu.hidden = isOpen;
  orderStatusTrigger.setAttribute('aria-expanded', String(!isOpen));
});

orderStatusMenu.addEventListener('click', (event) => {
  const option = event.target.closest('.select-menu-option');
  if (!option) return;
  setOrderStatus(option.dataset.value);
  orderStatusMenu.hidden = true;
  orderStatusTrigger.setAttribute('aria-expanded', 'false');
});

document.addEventListener('click', (event) => {
  if (!salesPersonPicker.contains(event.target)) {
    salesPersonMenu.hidden = true;
    salesPersonTrigger.setAttribute('aria-expanded', 'false');
  }
  if (!orderStatusPicker.contains(event.target)) {
    orderStatusMenu.hidden = true;
    orderStatusTrigger.setAttribute('aria-expanded', 'false');
  }
});
document.addEventListener('click', (event) => {
  if (!event.target.closest('#styleOptions')) closeAllStyleDropdowns();
});

renderSalesPersonOptions();
renderOrderStyleOptions();
renderOrderPackageOptions();
bindStyleOptions();
bindMultiChoice('packageOptions', packageSelection);
renderSettingsPage();
bindSettingsPage();
syncStoreHoursDisplay();

function parseDateValue(dateValue) {
  if (!dateValue) return new Date(2026, 11, 1);
  const [year, month, day] = dateValue.split('-').map(Number);
  return new Date(year, month - 1, day);
}

function toDateValue(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function isSameDate(left, right) {
  return left.getFullYear() === right.getFullYear()
    && left.getMonth() === right.getMonth()
    && left.getDate() === right.getDate();
}

function getCalendarSelectedValue(context) {
  return context.key === 'return' ? context.draftDateValue : context.input.value;
}

function renderCalendarDays(context) {
  const year = context.cursor.getFullYear();
  const month = context.cursor.getMonth();
  const selectedValue = getCalendarSelectedValue(context);
  const selectedDate = selectedValue ? parseDateValue(selectedValue) : null;
  const firstWeekday = new Date(year, month, 1).getDay();
  const firstGridDate = new Date(year, month, 1 - firstWeekday);
  const weekdays = ['日', '一', '二', '三', '四', '五', '六'];
  const cells = weekdays.map((weekday) => `<span class="calendar-weekday">${weekday}</span>`);

  for (let index = 0; index < 42; index += 1) {
    const date = new Date(firstGridDate);
    date.setDate(firstGridDate.getDate() + index);
    const outsideMonth = date.getMonth() !== month;
    const selected = selectedDate && isSameDate(date, selectedDate);
    cells.push(`<button type="button" class="calendar-day${outsideMonth ? ' is-outside' : ''}${selected ? ' is-selected' : ''}" data-calendar-date="${toDateValue(date)}" aria-label="${formatDate(toDateValue(date))}"${selected ? ' aria-current="date"' : ''}>${date.getDate()}</button>`);
  }

  context.title.textContent = `${year}年${month + 1}月`;
  context.view.innerHTML = `<div class="calendar-day-grid">${cells.join('')}</div>`;
}

function renderCalendarMonths(context) {
  const year = context.cursor.getFullYear();
  const selectedValue = getCalendarSelectedValue(context);
  const selectedDate = selectedValue ? parseDateValue(selectedValue) : null;
  const months = Array.from({ length: 12 }, (_, month) => {
    const selected = selectedDate && selectedDate.getFullYear() === year && selectedDate.getMonth() === month;
    return `<button type="button" class="calendar-month${selected ? ' is-selected' : ''}" data-calendar-month="${month}"${selected ? ' aria-current="date"' : ''}>${month + 1}月</button>`;
  });

  context.title.textContent = `${year}年`;
  context.view.innerHTML = `<div class="calendar-month-grid">${months.join('')}</div>`;
}

function renderCalendarYears(context) {
  const selectedValue = getCalendarSelectedValue(context);
  const selectedDate = selectedValue ? parseDateValue(selectedValue) : null;
  const selectedYear = selectedDate?.getFullYear();
  const startYear = Math.floor(context.cursor.getFullYear() / 10) * 10;
  const years = Array.from({ length: 12 }, (_, index) => startYear - 1 + index);
  const yearItems = years.map((year, index) => {
    const boundary = index === 0 || index === years.length - 1;
    const selected = selectedDate && year === selectedYear;
    return `<button type="button" class="calendar-year${boundary ? ' is-boundary' : ''}${selected ? ' is-selected' : ''}" data-calendar-year="${year}"${selected ? ' aria-current="date"' : ''}>${year}</button>`;
  });

  context.title.textContent = `${startYear}-${startYear + 9}`;
  context.view.innerHTML = `<div class="calendar-year-grid">${yearItems.join('')}</div>`;
}

function renderCalendar(context) {
  if (context.viewMode === 'days') renderCalendarDays(context);
  if (context.viewMode === 'months') renderCalendarMonths(context);
  if (context.viewMode === 'years') renderCalendarYears(context);
}

function setCalendarView(context, view) {
  context.viewMode = view;
  renderCalendar(context);
}

function moveCalendar(context, step) {
  if (context.viewMode === 'days') {
    context.cursor = new Date(context.cursor.getFullYear(), context.cursor.getMonth() + step, 1);
  } else if (context.viewMode === 'months') {
    context.cursor = new Date(context.cursor.getFullYear() + step, context.cursor.getMonth(), 1);
  } else {
    context.cursor = new Date(context.cursor.getFullYear() + step * 10, context.cursor.getMonth(), 1);
  }
  renderCalendar(context);
}

function renderTimeOptions(context) {
  const [selectedHour = '19', selectedMinute = '30'] = context.draftTimeValue.split(':');
  const renderColumn = (max, selectedValue, kind) => Array.from({ length: max + 1 }, (_, value) => {
    const paddedValue = String(value).padStart(2, '0');
    const selected = paddedValue === selectedValue;
    return `<button type="button" class="calendar-time-option${selected ? ' is-selected' : ''}" data-time-kind="${kind}" data-time-value="${paddedValue}"${selected ? ' aria-current="true"' : ''}>${paddedValue}</button>`;
  }).join('');

  context.hourOptions.innerHTML = renderColumn(23, selectedHour, 'hour');
  context.minuteOptions.innerHTML = renderColumn(59, selectedMinute, 'minute');
}

function syncReturnTimePickers(context) {
  const [hour = '19', minute = '30'] = context.draftTimeValue.split(':');
  context.draftTimeValue = `${hour}:${minute}`;
  context.hourLabel.textContent = hour;
  context.minuteLabel.textContent = minute;
  renderTimeOptions(context);
}

function closeDatePicker() {
  datePickers.forEach((picker) => {
    picker.hidden = true;
  });
  calendarTriggers.forEach((trigger) => {
    trigger.setAttribute('aria-expanded', 'false');
  });
  activeCalendar?.timePicker?.setAttribute('hidden', '');
  activeCalendar?.timeTriggers?.forEach((trigger) => trigger.setAttribute('aria-expanded', 'false'));
  activeCalendar?.trigger?.setAttribute('aria-expanded', 'false');
  activeCalendar = null;
}

function selectCalendarDate(context, dateValue) {
  if (context.key === 'return') {
    context.draftDateValue = dateValue;
    context.cursor = parseDateValue(dateValue);
    renderCalendar(context);
    return;
  }

  context.input.value = dateValue;
  if (context.key === 'filter') {
    syncFilterReserveDateDisplay();
    renderOrderManagement();
  } else {
    updateDateSummary();
  }
  closeDatePicker();
}

function commitReturnDateTime(context) {
  const dateValue = context.draftDateValue || returnDateInput.value;
  const timeValue = context.draftTimeValue || '19:30';
  returnDateInput.value = dateValue;
  returnDateTimeInput.value = `${dateValue}T${timeValue}`;
  syncDatetimeDisplay();
  updateDateSummary();
  closeDatePicker();
}

function openCalendarPicker(context) {
  closeDatePicker();
  activeCalendar = context;
  context.viewMode = 'days';
  context.cursor = parseDateValue(context.input.value || getTodayDateValue());
  if (context.key === 'return') {
    context.draftDateValue = returnDateInput.value;
    context.draftTimeValue = returnDateTimeInput.value.split('T')[1] || '19:30';
    context.timePicker.hidden = true;
    context.timeTriggers.forEach((trigger) => trigger.setAttribute('aria-expanded', 'false'));
    syncReturnTimePickers(context);
  }
  renderCalendar(context);
  context.picker.hidden = false;
  context.trigger.setAttribute('aria-expanded', 'true');
}

function bindCalendar(context) {
  context.title.addEventListener('click', (event) => {
    event.stopPropagation();
    if (context.viewMode === 'days') setCalendarView(context, 'months');
    else if (context.viewMode === 'months') setCalendarView(context, 'years');
  });

  context.prev.addEventListener('click', (event) => {
    event.stopPropagation();
    moveCalendar(context, -1);
  });

  context.next.addEventListener('click', (event) => {
    event.stopPropagation();
    moveCalendar(context, 1);
  });

  context.today.addEventListener('click', (event) => {
    event.stopPropagation();
    const today = getTodayDateValue();
    if (context.key === 'return') {
      context.draftDateValue = today;
      context.cursor = parseDateValue(today);
      setCalendarView(context, 'days');
      return;
    }
    selectCalendarDate(context, today);
  });

  context.view.addEventListener('click', (event) => {
    event.stopPropagation();
    const dayButton = event.target.closest('[data-calendar-date]');
    if (dayButton) {
      selectCalendarDate(context, dayButton.dataset.calendarDate);
      return;
    }

    const monthButton = event.target.closest('[data-calendar-month]');
    if (monthButton) {
      context.cursor = new Date(context.cursor.getFullYear(), Number(monthButton.dataset.calendarMonth), 1);
      setCalendarView(context, 'days');
      return;
    }

    const yearButton = event.target.closest('[data-calendar-year]');
    if (yearButton) {
      context.cursor = new Date(Number(yearButton.dataset.calendarYear), context.cursor.getMonth(), 1);
      setCalendarView(context, 'months');
    }
  });
}


const reserveCalendar = {
  key: 'reserve',
  input: reserveDateInput,
  picker: reserveDatePicker,
  trigger: document.querySelector('#reserveDateTrigger'),
  title: reserveDatePicker.querySelector('[data-calendar-title]'),
  view: reserveDatePicker.querySelector('[data-calendar-view]'),
  prev: reserveDatePicker.querySelector('[data-calendar-prev]'),
  next: reserveDatePicker.querySelector('[data-calendar-next]'),
  today: reserveDatePicker.querySelector('[data-calendar-today]'),
  viewMode: 'days',
  cursor: new Date(2026, 11, 1),
};

const filterCalendar = {
  key: 'filter',
  input: filterReserveDate,
  picker: filterReserveDatePicker,
  trigger: document.querySelector('#filterReserveDateTrigger'),
  title: filterReserveDatePicker.querySelector('[data-calendar-title]'),
  view: filterReserveDatePicker.querySelector('[data-calendar-view]'),
  prev: filterReserveDatePicker.querySelector('[data-calendar-prev]'),
  next: filterReserveDatePicker.querySelector('[data-calendar-next]'),
  today: filterReserveDatePicker.querySelector('[data-calendar-today]'),
  viewMode: 'days',
  cursor: new Date(2026, 10, 1),
};

const settingsOpenTimeCalendar = {
  key: 'settings-open-time',
  input: settingsOpenTimeInput,
  picker: settingsOpenTimePicker,
  trigger: document.querySelector('#settingsOpenTimeTrigger'),
  timePicker: settingsOpenTimePicker.querySelector('[data-time-picker]'),
  timeTriggers: [...settingsOpenTimePicker.querySelectorAll('[data-time-open]')],
  hourLabel: settingsOpenTimePicker.querySelector('#settingsOpenHourLabel'),
  minuteLabel: settingsOpenTimePicker.querySelector('#settingsOpenMinuteLabel'),
  hourOptions: settingsOpenTimePicker.querySelector('#settingsOpenHourOptions'),
  minuteOptions: settingsOpenTimePicker.querySelector('#settingsOpenMinuteOptions'),
  storeHoursKey: 'open',
  draftTimeValue: settingsOpenTimeInput.value || '09:00',
};

const settingsCloseTimeCalendar = {
  key: 'settings-close-time',
  input: settingsCloseTimeInput,
  picker: settingsCloseTimePicker,
  trigger: document.querySelector('#settingsCloseTimeTrigger'),
  timePicker: settingsCloseTimePicker.querySelector('[data-time-picker]'),
  timeTriggers: [...settingsCloseTimePicker.querySelectorAll('[data-time-open]')],
  hourLabel: settingsCloseTimePicker.querySelector('#settingsCloseHourLabel'),
  minuteLabel: settingsCloseTimePicker.querySelector('#settingsCloseMinuteLabel'),
  hourOptions: settingsCloseTimePicker.querySelector('#settingsCloseHourOptions'),
  minuteOptions: settingsCloseTimePicker.querySelector('#settingsCloseMinuteOptions'),
  storeHoursKey: 'close',
  draftTimeValue: settingsCloseTimeInput.value || '20:00',
};

const returnCalendar = {
  key: 'return',
  input: returnDateInput,
  picker: returnDatePicker,
  trigger: returnDateTimeDisplay,
  title: returnDatePicker.querySelector('[data-calendar-title]'),
  view: returnDatePicker.querySelector('[data-calendar-view]'),
  prev: returnDatePicker.querySelector('[data-calendar-prev]'),
  next: returnDatePicker.querySelector('[data-calendar-next]'),
  today: returnDatePicker.querySelector('[data-calendar-today]'),
  viewMode: 'days',
  cursor: new Date(2026, 11, 1),
  draftDateValue: returnDateInput.value,
  draftTimeValue: returnDateTimeInput.value.split('T')[1] || '19:30',
  timePicker: returnDatePicker.querySelector('[data-time-picker]'),
  timeTriggers: [...returnDatePicker.querySelectorAll('[data-time-open]')],
  hourLabel: returnDatePicker.querySelector('#returnHourLabel'),
  minuteLabel: returnDatePicker.querySelector('#returnMinuteLabel'),
  hourOptions: returnDatePicker.querySelector('#returnHourOptions'),
  minuteOptions: returnDatePicker.querySelector('#returnMinuteOptions'),
};

function openSettingsTimePicker(context) {
  closeDatePicker();
  activeCalendar = context;
  context.draftTimeValue = context.input.value || '00:00';
  syncReturnTimePickers(context);
  context.timePicker.hidden = true;
  context.timeTriggers.forEach((trigger) => trigger.setAttribute('aria-expanded', 'false'));
  context.picker.hidden = false;
  context.trigger.setAttribute('aria-expanded', 'true');
}

function commitSettingsTime(context) {
  const timeValue = context.draftTimeValue || context.input.value || '00:00';
  appConfig.storeHours[context.storeHoursKey] = timeValue;
  syncSettingsTimeDisplay();
  syncStoreHoursDisplay();
  closeDatePicker();
}

function bindSettingsTimePicker(context) {
  context.trigger.addEventListener('click', (event) => {
    event.stopPropagation();
    openSettingsTimePicker(context);
  });
  bindTimePicker(context);
  context.picker.querySelector('[data-save-settings-time]').addEventListener('click', (event) => {
    event.stopPropagation();
    commitSettingsTime(context);
  });
}

function bindTimePicker(context) {
  context.timeTriggers.forEach((trigger) => {
    trigger.addEventListener('click', (event) => {
      event.stopPropagation();
      const isOpen = !context.timePicker.hidden;
      context.timePicker.hidden = isOpen;
      context.timeTriggers.forEach((item) => item.setAttribute('aria-expanded', String(!isOpen)));
      if (!isOpen) renderTimeOptions(context);
    });
  });

  context.timePicker.addEventListener('click', (event) => {
    event.stopPropagation();
    const option = event.target.closest('[data-time-kind]');
    if (!option) return;
    const [hour = '19', minute = '30'] = context.draftTimeValue.split(':');
    context.draftTimeValue = option.dataset.timeKind === 'hour'
      ? `${option.dataset.timeValue}:${minute}`
      : `${hour}:${option.dataset.timeValue}`;
    syncReturnTimePickers(context);
  });
}

bindCalendar(reserveCalendar);
bindCalendar(filterCalendar);
bindCalendar(returnCalendar);
bindTimePicker(returnCalendar);
bindSettingsTimePicker(settingsOpenTimeCalendar);
bindSettingsTimePicker(settingsCloseTimeCalendar);

calendarTriggers.forEach((trigger) => {
  trigger.addEventListener('click', () => {
    const context = trigger.dataset.dateTarget === 'returnDateTime'
      ? returnCalendar
      : trigger.dataset.dateTarget === 'filterReserveDate'
        ? filterCalendar
        : reserveCalendar;
    openCalendarPicker(context);
  });
});

returnDatePicker.querySelector('[data-save-return]').addEventListener('click', (event) => {
  event.stopPropagation();
  commitReturnDateTime(returnCalendar);
});

document.addEventListener('click', (event) => {
  if (activeCalendar && !event.target.closest('.date-field, .datetime-field')) {
    closeDatePicker();
  }
});
document.querySelectorAll('.stepper-button').forEach((button) => {
  button.addEventListener('click', () => {
    const input = document.querySelector('#quantity');
    const nextValue = Math.max(1, Number(input.value || 1) + Number(button.dataset.step));
    input.value = nextValue;
  });
});
form.addEventListener('submit', (event) => {
  event.preventDefault();
  openPreview();
});
document.querySelector('#resetForm').addEventListener('click', clearForm);
document.querySelector('#closePreview').addEventListener('click', closePreview);
document.querySelector('#donePreview').addEventListener('click', completePreview);
previewModal.addEventListener('click', (event) => {
  if (event.target === previewModal) closePreview();
});
document.querySelector('#copyOrder').addEventListener('click', async () => {
  try {
    await copyText(previewText.textContent);
    showToast('订单内容已复制');
  } catch {
    showToast('当前环境不支持自动复制');
  }
});

document.querySelector('#bottomNav').addEventListener('click', (event) => {
  const item = event.target.closest('.bottom-nav-item');
  if (!item) return;
  setActiveView(item.dataset.view);
});
document.querySelector('#managementCreateButton').addEventListener('click', () => setActiveView('create'));
document.querySelector('#emptyCreateButton').addEventListener('click', () => setActiveView('create'));
function bindFilterSelect({ picker, trigger, menu, input, label }) {
  trigger.addEventListener('click', () => {
    const isOpen = !menu.hidden;
    menu.hidden = isOpen;
    trigger.setAttribute('aria-expanded', String(!isOpen));
  });

  menu.addEventListener('click', (event) => {
    const option = event.target.closest('[data-filter-option]');
    if (!option) return;
    input.value = option.dataset.value;
    syncFilterSelect(input, label, menu);
    menu.hidden = true;
    trigger.setAttribute('aria-expanded', 'false');
    renderOrderManagement();
  });

  document.addEventListener('click', (event) => {
    if (picker.contains(event.target)) return;
    menu.hidden = true;
    trigger.setAttribute('aria-expanded', 'false');
  });
}

bindFilterSelect({
  picker: filterSalesPersonPicker,
  trigger: filterSalesPersonTrigger,
  menu: filterSalesPersonMenu,
  input: filterSalesPerson,
  label: filterSalesPersonLabel,
});
bindFilterSelect({
  picker: filterOrderStatusPicker,
  trigger: filterOrderStatusTrigger,
  menu: filterOrderStatusMenu,
  input: filterOrderStatus,
  label: filterOrderStatusLabel,
});
[filterPhone, filterReserveDate].forEach((input) => {
  input.addEventListener('input', renderOrderManagement);
  input.addEventListener('change', renderOrderManagement);
});
document.querySelector('#clearOrderFilters').addEventListener('click', () => {
  filterSalesPerson.value = '';
  filterOrderStatus.value = '';
  filterPhone.value = '';
  filterReserveDate.value = '';
  syncFilterReserveDateDisplay();
  closeDatePicker();
  syncFilterSelect(filterSalesPerson, filterSalesPersonLabel, filterSalesPersonMenu);
  syncFilterSelect(filterOrderStatus, filterOrderStatusLabel, filterOrderStatusMenu);
  filterSalesPersonMenu.hidden = true;
  filterOrderStatusMenu.hidden = true;
  filterSalesPersonTrigger.setAttribute('aria-expanded', 'false');
  filterOrderStatusTrigger.setAttribute('aria-expanded', 'false');
  renderOrderManagement();
});
orderList.addEventListener('click', async (event) => {
  const copyButton = event.target.closest('[data-copy-order-id]');
  if (!copyButton) return;
  const order = orders.find((item) => item.id === copyButton.dataset.copyOrderId);
  if (!order) return;
  try {
    await copyText(order.orderText);
    showToast('订单内容已复制');
  } catch {
    showToast('当前环境不支持自动复制');
  }
});
document.addEventListener('keydown', (event) => {
  if (event.key !== 'Escape') return;
  if (previewModal.classList.contains('is-open')) closePreview();
  closeAllStyleDropdowns();
});

setDefaultDateValues();
updateDateSummary();
syncDatetimeDisplay();
syncFilterReserveDateDisplay();
renderOrderManagement();
