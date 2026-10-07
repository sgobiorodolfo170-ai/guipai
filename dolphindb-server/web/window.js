//#region \0rolldown/runtime.js
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __commonJS = (cb, mod) => function() {
	return mod || ((0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), cb = null), mod.exports;
};
var __copyProps = (to, from, except, desc) => {
	if (from && typeof from === "object" || typeof from === "function") {
		for (var keys = __getOwnPropNames(from), i = 0, n = keys.length, key; i < n; i++) {
			key = keys[i];
			if (!__hasOwnProp.call(to, key) && key !== except) {
				__defProp(to, key, {
					get: ((k) => from[k]).bind(null, key),
					enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable
				});
			}
		}
	}
	return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(isNodeMode || !mod || !mod.__esModule || !__hasOwnProp.call(mod, "default") ? __defProp(target, "default", {
	value: mod,
	enumerable: true
}) : target, mod));

//#endregion
//#region external: react
var require_external__react = /* @__PURE__ */ __commonJS({ "external: react": ((exports, module) => {
	module.exports = globalThis.React;
}) });

//#endregion
//#region external: react-dom/client
var require_client = /* @__PURE__ */ __commonJS({ "external: react-dom/client": ((exports, module) => {
	module.exports = globalThis.ReactDOMClient;
}) });

//#endregion
//#region external: antd
var require_external__antd = /* @__PURE__ */ __commonJS({ "external: antd": ((exports, module) => {
	module.exports = globalThis.antd;
}) });

//#endregion
//#region node_modules/.pnpm/@rc-component+pagination@1._64e45aa1881d51423ab289f641a2ed2b/node_modules/@rc-component/pagination/es/locale/zh_CN.js
var import_external__react = /* @__PURE__ */ __toESM(require_external__react(), 1);
var import_client = require_client();
var import_external__antd = require_external__antd();
const locale$3 = {
	items_per_page: "条/页",
	jump_to: "跳至",
	jump_to_confirm: "确定",
	page: "页",
	prev_page: "上一页",
	next_page: "下一页",
	prev_5: "向前 5 页",
	next_5: "向后 5 页",
	prev_3: "向前 3 页",
	next_3: "向后 3 页",
	page_size: "页码"
};

//#endregion
//#region node_modules/.pnpm/@rc-component+picker@1.12.0_5c475d7f760e251b22c4e2e7d9172357/node_modules/@rc-component/picker/es/locale/common.js
const commonLocale = {
	yearFormat: "YYYY",
	dayFormat: "D",
	cellMeridiemFormat: "A",
	monthBeforeYear: true
};

//#endregion
//#region node_modules/.pnpm/@rc-component+picker@1.12.0_5c475d7f760e251b22c4e2e7d9172357/node_modules/@rc-component/picker/es/locale/zh_CN.js
const locale$2 = {
	...commonLocale,
	locale: "zh_CN",
	today: "今天",
	now: "此刻",
	backToToday: "返回今天",
	ok: "确定",
	timeSelect: "选择时间",
	dateSelect: "选择日期",
	weekSelect: "选择周",
	clear: "清除",
	week: "周",
	month: "月",
	year: "年",
	previousMonth: "上个月",
	nextMonth: "下个月",
	monthSelect: "选择月份",
	yearSelect: "选择年份",
	decadeSelect: "选择年代",
	previousYear: "上一年",
	nextYear: "下一年",
	previousDecade: "上一年代",
	nextDecade: "下一年代",
	previousCentury: "上一世纪",
	nextCentury: "下一世纪",
	yearFormat: "YYYY年",
	cellDateFormat: "D",
	monthBeforeYear: false
};

//#endregion
//#region node_modules/.pnpm/antd@6.6.1_react-dom@19.2.8_react@19.2.8__react@19.2.8/node_modules/antd/es/time-picker/locale/zh_CN.js
const locale$1 = {
	placeholder: "请选择时间",
	rangePlaceholder: ["开始时间", "结束时间"]
};

//#endregion
//#region node_modules/.pnpm/antd@6.6.1_react-dom@19.2.8_react@19.2.8__react@19.2.8/node_modules/antd/es/date-picker/locale/zh_CN.js
const locale = {
	lang: {
		placeholder: "请选择日期",
		yearPlaceholder: "请选择年份",
		quarterPlaceholder: "请选择季度",
		monthPlaceholder: "请选择月份",
		weekPlaceholder: "请选择周",
		rangePlaceholder: ["开始日期", "结束日期"],
		rangeYearPlaceholder: ["开始年份", "结束年份"],
		rangeMonthPlaceholder: ["开始月份", "结束月份"],
		rangeQuarterPlaceholder: ["开始季度", "结束季度"],
		rangeWeekPlaceholder: ["开始周", "结束周"],
		...locale$2
	},
	timePickerLocale: { ...locale$1 }
};
locale.lang.ok = "确定";

//#endregion
//#region node_modules/.pnpm/antd@6.6.1_react-dom@19.2.8_react@19.2.8__react@19.2.8/node_modules/antd/es/calendar/locale/zh_CN.js
var zh_CN_default = locale;

//#endregion
//#region node_modules/.pnpm/antd@6.6.1_react-dom@19.2.8_react@19.2.8__react@19.2.8/node_modules/antd/es/locale/zh_CN.js
const typeTemplate = "${label}不是一个有效的${type}";
const localeValues = {
	locale: "zh-cn",
	Pagination: locale$3,
	DatePicker: locale,
	TimePicker: locale$1,
	Calendar: zh_CN_default,
	global: {
		placeholder: "请选择",
		close: "关闭",
		sortable: "可排序",
		show: "显示",
		hide: "隐藏"
	},
	Table: {
		filterTitle: "筛选",
		filterConfirm: "确定",
		filterReset: "重置",
		filterEmptyText: "无筛选项",
		filterCheckAll: "全选",
		filterSearchPlaceholder: "在筛选项中搜索",
		emptyText: "暂无数据",
		selectAll: "全选当页",
		selectInvert: "反选当页",
		selectNone: "清空所有",
		selectionAll: "全选所有",
		sortTitle: "排序",
		expand: "展开行",
		collapse: "关闭行",
		triggerDesc: "点击降序",
		triggerAsc: "点击升序",
		cancelSort: "取消排序"
	},
	Modal: {
		okText: "确定",
		cancelText: "取消",
		justOkText: "知道了"
	},
	Tour: {
		Next: "下一步",
		Previous: "上一步",
		Finish: "结束导览"
	},
	Popconfirm: {
		cancelText: "取消",
		okText: "确定"
	},
	Transfer: {
		titles: ["", ""],
		searchPlaceholder: "请输入搜索内容",
		itemUnit: "项",
		itemsUnit: "项",
		remove: "删除",
		selectCurrent: "全选当页",
		removeCurrent: "删除当页",
		selectAll: "全选所有",
		deselectAll: "取消全选",
		removeAll: "删除全部",
		selectInvert: "反选当页"
	},
	Upload: {
		uploading: "文件上传中",
		removeFile: "删除文件",
		uploadError: "上传错误",
		previewFile: "预览文件",
		downloadFile: "下载文件"
	},
	Empty: { description: "暂无数据" },
	Icon: { icon: "图标" },
	Text: {
		edit: "编辑",
		copy: "复制",
		copied: "复制成功",
		expand: "展开",
		collapse: "收起"
	},
	Carousel: {
		prevSlide: "上一张幻灯片",
		nextSlide: "下一张幻灯片"
	},
	Form: {
		optional: "（可选）",
		defaultValidateMessages: {
			default: "字段验证错误${label}",
			required: "请输入${label}",
			enum: "${label}必须是其中一个[${enum}]",
			whitespace: "${label}不能为空字符",
			date: {
				format: "${label}日期格式无效",
				parse: "${label}不能转换为日期",
				invalid: "${label}是一个无效日期"
			},
			types: {
				string: typeTemplate,
				method: typeTemplate,
				array: typeTemplate,
				object: typeTemplate,
				number: typeTemplate,
				date: typeTemplate,
				boolean: typeTemplate,
				integer: typeTemplate,
				float: typeTemplate,
				regexp: typeTemplate,
				email: typeTemplate,
				url: typeTemplate,
				hex: typeTemplate
			},
			string: {
				len: "${label}须为${len}个字符",
				min: "${label}最少${min}个字符",
				max: "${label}最多${max}个字符",
				range: "${label}须在${min}-${max}字符之间"
			},
			number: {
				len: "${label}必须等于${len}",
				min: "${label}最小值为${min}",
				max: "${label}最大值为${max}",
				range: "${label}须在${min}-${max}之间"
			},
			array: {
				len: "须为${len}个${label}",
				min: "最少${min}个${label}",
				max: "最多${max}个${label}",
				range: "${label}数量须在${min}-${max}之间"
			},
			pattern: { mismatch: "${label}与模式不匹配${pattern}" }
		}
	},
	QRCode: {
		expired: "二维码过期",
		refresh: "点击刷新",
		scanned: "已扫描"
	},
	ColorPicker: {
		presetEmpty: "暂无",
		transparent: "无色",
		singleColor: "单色",
		gradientColor: "渐变色"
	}
};

//#endregion
//#region node_modules/.pnpm/@babel+runtime@7.29.2/node_modules/@babel/runtime/helpers/interopRequireDefault.js
var require_interopRequireDefault = /* @__PURE__ */ __commonJS({ "node_modules/.pnpm/@babel+runtime@7.29.2/node_modules/@babel/runtime/helpers/interopRequireDefault.js": ((exports, module) => {
	function _interopRequireDefault(e) {
		return e && e.__esModule ? e : { "default": e };
	}
	module.exports = _interopRequireDefault, module.exports.__esModule = true, module.exports["default"] = module.exports;
}) });

//#endregion
//#region node_modules/.pnpm/@rc-component+pagination@1._64e45aa1881d51423ab289f641a2ed2b/node_modules/@rc-component/pagination/lib/locale/en_US.js
var require_en_US$6 = /* @__PURE__ */ __commonJS({ "node_modules/.pnpm/@rc-component+pagination@1._64e45aa1881d51423ab289f641a2ed2b/node_modules/@rc-component/pagination/lib/locale/en_US.js": ((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.default = void 0;
	const locale = {
		items_per_page: "/ page",
		jump_to: "Go to",
		jump_to_confirm: "confirm",
		page: "Page",
		prev_page: "Previous Page",
		next_page: "Next Page",
		prev_5: "Previous 5 Pages",
		next_5: "Next 5 Pages",
		prev_3: "Previous 3 Pages",
		next_3: "Next 3 Pages",
		page_size: "Page Size"
	};
	exports.default = locale;
}) });

//#endregion
//#region node_modules/.pnpm/@rc-component+picker@1.12.0_5c475d7f760e251b22c4e2e7d9172357/node_modules/@rc-component/picker/lib/locale/common.js
var require_common = /* @__PURE__ */ __commonJS({ "node_modules/.pnpm/@rc-component+picker@1.12.0_5c475d7f760e251b22c4e2e7d9172357/node_modules/@rc-component/picker/lib/locale/common.js": ((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.commonLocale = void 0;
	exports.commonLocale = {
		yearFormat: "YYYY",
		dayFormat: "D",
		cellMeridiemFormat: "A",
		monthBeforeYear: true
	};
}) });

//#endregion
//#region node_modules/.pnpm/@rc-component+picker@1.12.0_5c475d7f760e251b22c4e2e7d9172357/node_modules/@rc-component/picker/lib/locale/en_US.js
var require_en_US$5 = /* @__PURE__ */ __commonJS({ "node_modules/.pnpm/@rc-component+picker@1.12.0_5c475d7f760e251b22c4e2e7d9172357/node_modules/@rc-component/picker/lib/locale/en_US.js": ((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.default = void 0;
	const locale = {
		...require_common().commonLocale,
		locale: "en_US",
		today: "Today",
		now: "Now",
		backToToday: "Back to today",
		ok: "OK",
		clear: "Clear",
		week: "Week",
		month: "Month",
		year: "Year",
		timeSelect: "select time",
		dateSelect: "select date",
		weekSelect: "Choose a week",
		monthSelect: "Choose a month",
		yearSelect: "Choose a year",
		decadeSelect: "Choose a decade",
		previousMonth: "Previous month",
		nextMonth: "Next month",
		previousYear: "Last year",
		nextYear: "Next year",
		previousDecade: "Last decade",
		nextDecade: "Next decade",
		previousCentury: "Last century",
		nextCentury: "Next century"
	};
	exports.default = locale;
}) });

//#endregion
//#region node_modules/.pnpm/antd@6.6.1_react-dom@19.2.8_react@19.2.8__react@19.2.8/node_modules/antd/lib/time-picker/locale/en_US.js
var require_en_US$4 = /* @__PURE__ */ __commonJS({ "node_modules/.pnpm/antd@6.6.1_react-dom@19.2.8_react@19.2.8__react@19.2.8/node_modules/antd/lib/time-picker/locale/en_US.js": ((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.default = void 0;
	const locale = {
		placeholder: "Select time",
		rangePlaceholder: ["Start time", "End time"]
	};
	exports.default = locale;
}) });

//#endregion
//#region node_modules/.pnpm/antd@6.6.1_react-dom@19.2.8_react@19.2.8__react@19.2.8/node_modules/antd/lib/date-picker/locale/en_US.js
var require_en_US$3 = /* @__PURE__ */ __commonJS({ "node_modules/.pnpm/antd@6.6.1_react-dom@19.2.8_react@19.2.8__react@19.2.8/node_modules/antd/lib/date-picker/locale/en_US.js": ((exports) => {
	var _interopRequireDefault = require_interopRequireDefault().default;
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.default = void 0;
	var _en_US = _interopRequireDefault(require_en_US$5());
	var _en_US2 = _interopRequireDefault(require_en_US$4());
	const locale = {
		lang: {
			placeholder: "Select date",
			yearPlaceholder: "Select year",
			quarterPlaceholder: "Select quarter",
			monthPlaceholder: "Select month",
			weekPlaceholder: "Select week",
			rangePlaceholder: ["Start date", "End date"],
			rangeYearPlaceholder: ["Start year", "End year"],
			rangeQuarterPlaceholder: ["Start quarter", "End quarter"],
			rangeMonthPlaceholder: ["Start month", "End month"],
			rangeWeekPlaceholder: ["Start week", "End week"],
			..._en_US.default
		},
		timePickerLocale: { ..._en_US2.default }
	};
	exports.default = locale;
}) });

//#endregion
//#region node_modules/.pnpm/antd@6.6.1_react-dom@19.2.8_react@19.2.8__react@19.2.8/node_modules/antd/lib/calendar/locale/en_US.js
var require_en_US$2 = /* @__PURE__ */ __commonJS({ "node_modules/.pnpm/antd@6.6.1_react-dom@19.2.8_react@19.2.8__react@19.2.8/node_modules/antd/lib/calendar/locale/en_US.js": ((exports) => {
	var _interopRequireDefault = require_interopRequireDefault().default;
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.default = void 0;
	var _en_US = _interopRequireDefault(require_en_US$3());
	exports.default = _en_US.default;
}) });

//#endregion
//#region node_modules/.pnpm/antd@6.6.1_react-dom@19.2.8_react@19.2.8__react@19.2.8/node_modules/antd/lib/locale/en_US.js
var require_en_US$1 = /* @__PURE__ */ __commonJS({ "node_modules/.pnpm/antd@6.6.1_react-dom@19.2.8_react@19.2.8__react@19.2.8/node_modules/antd/lib/locale/en_US.js": ((exports) => {
	var _interopRequireDefault = require_interopRequireDefault().default;
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.default = void 0;
	var _en_US = _interopRequireDefault(require_en_US$6());
	var _en_US2 = _interopRequireDefault(require_en_US$2());
	var _en_US3 = _interopRequireDefault(require_en_US$3());
	var _en_US4 = _interopRequireDefault(require_en_US$4());
	const typeTemplate = "${label} is not a valid ${type}";
	const localeValues = {
		locale: "en",
		Pagination: _en_US.default,
		DatePicker: _en_US3.default,
		TimePicker: _en_US4.default,
		Calendar: _en_US2.default,
		global: {
			placeholder: "Please select",
			close: "Close",
			sortable: "sortable",
			show: "Show",
			hide: "Hide"
		},
		Table: {
			filterTitle: "Filter menu",
			filterConfirm: "OK",
			filterReset: "Reset",
			filterEmptyText: "No filters",
			filterCheckAll: "Select all items",
			filterSearchPlaceholder: "Search in filters",
			emptyText: "No data",
			selectAll: "Select current page",
			selectInvert: "Invert current page",
			selectNone: "Clear all data",
			selectionAll: "Select all data",
			sortTitle: "Sort",
			expand: "Expand row",
			collapse: "Collapse row",
			triggerDesc: "Click to sort descending",
			triggerAsc: "Click to sort ascending",
			cancelSort: "Click to cancel sorting"
		},
		Tour: {
			Next: "Next",
			Previous: "Previous",
			Finish: "Finish"
		},
		Modal: {
			okText: "OK",
			cancelText: "Cancel",
			justOkText: "OK"
		},
		Popconfirm: {
			okText: "OK",
			cancelText: "Cancel"
		},
		Transfer: {
			titles: ["", ""],
			searchPlaceholder: "Search here",
			itemUnit: "item",
			itemsUnit: "items",
			remove: "Remove",
			selectCurrent: "Select current page",
			removeCurrent: "Remove current page",
			selectAll: "Select all data",
			deselectAll: "Deselect all data",
			removeAll: "Remove all data",
			selectInvert: "Invert current page"
		},
		Upload: {
			uploading: "Uploading...",
			removeFile: "Remove file",
			uploadError: "Upload error",
			previewFile: "Preview file",
			downloadFile: "Download file"
		},
		Empty: { description: "No data" },
		Icon: { icon: "icon" },
		Text: {
			edit: "Edit",
			copy: "Copy",
			copied: "Copied",
			expand: "Expand",
			collapse: "Collapse"
		},
		Carousel: {
			prevSlide: "Previous slide",
			nextSlide: "Next slide"
		},
		Form: {
			optional: "(optional)",
			defaultValidateMessages: {
				default: "Field validation error for ${label}",
				required: "Please enter ${label}",
				enum: "${label} must be one of [${enum}]",
				whitespace: "${label} cannot be a blank character",
				date: {
					format: "${label} date format is invalid",
					parse: "${label} cannot be converted to a date",
					invalid: "${label} is an invalid date"
				},
				types: {
					string: typeTemplate,
					method: typeTemplate,
					array: typeTemplate,
					object: typeTemplate,
					number: typeTemplate,
					date: typeTemplate,
					boolean: typeTemplate,
					integer: typeTemplate,
					float: typeTemplate,
					regexp: typeTemplate,
					email: typeTemplate,
					url: typeTemplate,
					hex: typeTemplate
				},
				string: {
					len: "${label} must be ${len} characters",
					min: "${label} must be at least ${min} characters",
					max: "${label} must be up to ${max} characters",
					range: "${label} must be between ${min}-${max} characters"
				},
				number: {
					len: "${label} must be equal to ${len}",
					min: "${label} must be minimum ${min}",
					max: "${label} must be maximum ${max}",
					range: "${label} must be between ${min}-${max}"
				},
				array: {
					len: "Must be ${len} ${label}",
					min: "At least ${min} ${label}",
					max: "At most ${max} ${label}",
					range: "The amount of ${label} must be between ${min}-${max}"
				},
				pattern: { mismatch: "${label} does not match the pattern ${pattern}" }
			}
		},
		QRCode: {
			expired: "QR code expired",
			refresh: "Refresh",
			scanned: "Scanned"
		},
		ColorPicker: {
			presetEmpty: "Empty",
			transparent: "Transparent",
			singleColor: "Single",
			gradientColor: "Gradient"
		}
	};
	exports.default = localeValues;
}) });

//#endregion
//#region node_modules/.pnpm/antd@6.6.1_react-dom@19.2.8_react@19.2.8__react@19.2.8/node_modules/antd/locale/en_US.js
var require_en_US = /* @__PURE__ */ __commonJS({ "node_modules/.pnpm/antd@6.6.1_react-dom@19.2.8_react@19.2.8__react@19.2.8/node_modules/antd/locale/en_US.js": ((exports, module) => {
	module.exports = require_en_US$1();
}) });

//#endregion
//#region node_modules/.pnpm/@rc-component+pagination@1._64e45aa1881d51423ab289f641a2ed2b/node_modules/@rc-component/pagination/lib/locale/ja_JP.js
var require_ja_JP$6 = /* @__PURE__ */ __commonJS({ "node_modules/.pnpm/@rc-component+pagination@1._64e45aa1881d51423ab289f641a2ed2b/node_modules/@rc-component/pagination/lib/locale/ja_JP.js": ((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.default = void 0;
	const locale = {
		items_per_page: "件 / ページ",
		jump_to: "移動",
		jump_to_confirm: "確認する",
		page: "ページ",
		prev_page: "前のページ",
		next_page: "次のページ",
		prev_5: "前 5ページ",
		next_5: "次 5ページ",
		prev_3: "前 3ページ",
		next_3: "次 3ページ",
		page_size: "ページサイズ"
	};
	exports.default = locale;
}) });

//#endregion
//#region node_modules/.pnpm/@rc-component+picker@1.12.0_5c475d7f760e251b22c4e2e7d9172357/node_modules/@rc-component/picker/lib/locale/ja_JP.js
var require_ja_JP$5 = /* @__PURE__ */ __commonJS({ "node_modules/.pnpm/@rc-component+picker@1.12.0_5c475d7f760e251b22c4e2e7d9172357/node_modules/@rc-component/picker/lib/locale/ja_JP.js": ((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.default = void 0;
	const locale = {
		...require_common().commonLocale,
		locale: "ja_JP",
		today: "今日",
		now: "現在時刻",
		backToToday: "今日に戻る",
		ok: "確定",
		timeSelect: "時間を選択",
		dateSelect: "日時を選択",
		weekSelect: "週を選択",
		clear: "クリア",
		week: "週",
		month: "月",
		year: "年",
		previousMonth: "前月",
		nextMonth: "翌月",
		monthSelect: "月を選択",
		yearSelect: "年を選択",
		decadeSelect: "年代を選択",
		yearFormat: "YYYY年",
		previousYear: "前年",
		nextYear: "翌年",
		previousDecade: "前の年代",
		nextDecade: "次の年代",
		previousCentury: "前の世紀",
		nextCentury: "次の世紀",
		monthBeforeYear: false
	};
	exports.default = locale;
}) });

//#endregion
//#region node_modules/.pnpm/antd@6.6.1_react-dom@19.2.8_react@19.2.8__react@19.2.8/node_modules/antd/lib/time-picker/locale/ja_JP.js
var require_ja_JP$4 = /* @__PURE__ */ __commonJS({ "node_modules/.pnpm/antd@6.6.1_react-dom@19.2.8_react@19.2.8__react@19.2.8/node_modules/antd/lib/time-picker/locale/ja_JP.js": ((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.default = void 0;
	const locale = {
		placeholder: "時間を選択",
		rangePlaceholder: ["開始時間", "終了時間"]
	};
	exports.default = locale;
}) });

//#endregion
//#region node_modules/.pnpm/antd@6.6.1_react-dom@19.2.8_react@19.2.8__react@19.2.8/node_modules/antd/lib/date-picker/locale/ja_JP.js
var require_ja_JP$3 = /* @__PURE__ */ __commonJS({ "node_modules/.pnpm/antd@6.6.1_react-dom@19.2.8_react@19.2.8__react@19.2.8/node_modules/antd/lib/date-picker/locale/ja_JP.js": ((exports) => {
	var _interopRequireDefault = require_interopRequireDefault().default;
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.default = void 0;
	var _ja_JP = _interopRequireDefault(require_ja_JP$5());
	var _ja_JP2 = _interopRequireDefault(require_ja_JP$4());
	const locale = {
		lang: {
			placeholder: "日付を選択",
			yearPlaceholder: "年を選択",
			quarterPlaceholder: "四半期を選択",
			monthPlaceholder: "月を選択",
			weekPlaceholder: "週を選択",
			rangePlaceholder: ["開始日付", "終了日付"],
			rangeYearPlaceholder: ["開始年", "終了年"],
			rangeMonthPlaceholder: ["開始月", "終了月"],
			rangeQuarterPlaceholder: ["開始四半期", "終了四半期"],
			rangeWeekPlaceholder: ["開始週", "終了週"],
			shortWeekDays: [
				"日",
				"月",
				"火",
				"水",
				"木",
				"金",
				"土"
			],
			shortMonths: [
				"1月",
				"2月",
				"3月",
				"4月",
				"5月",
				"6月",
				"7月",
				"8月",
				"9月",
				"10月",
				"11月",
				"12月"
			],
			..._ja_JP.default
		},
		timePickerLocale: { ..._ja_JP2.default }
	};
	exports.default = locale;
}) });

//#endregion
//#region node_modules/.pnpm/antd@6.6.1_react-dom@19.2.8_react@19.2.8__react@19.2.8/node_modules/antd/lib/calendar/locale/ja_JP.js
var require_ja_JP$2 = /* @__PURE__ */ __commonJS({ "node_modules/.pnpm/antd@6.6.1_react-dom@19.2.8_react@19.2.8__react@19.2.8/node_modules/antd/lib/calendar/locale/ja_JP.js": ((exports) => {
	var _interopRequireDefault = require_interopRequireDefault().default;
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.default = void 0;
	var _ja_JP = _interopRequireDefault(require_ja_JP$3());
	exports.default = _ja_JP.default;
}) });

//#endregion
//#region node_modules/.pnpm/antd@6.6.1_react-dom@19.2.8_react@19.2.8__react@19.2.8/node_modules/antd/lib/locale/ja_JP.js
var require_ja_JP$1 = /* @__PURE__ */ __commonJS({ "node_modules/.pnpm/antd@6.6.1_react-dom@19.2.8_react@19.2.8__react@19.2.8/node_modules/antd/lib/locale/ja_JP.js": ((exports) => {
	var _interopRequireDefault = require_interopRequireDefault().default;
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.default = void 0;
	var _ja_JP = _interopRequireDefault(require_ja_JP$6());
	var _ja_JP2 = _interopRequireDefault(require_ja_JP$2());
	var _ja_JP3 = _interopRequireDefault(require_ja_JP$3());
	var _ja_JP4 = _interopRequireDefault(require_ja_JP$4());
	const typeTemplate = "${label}は有効な${type}ではありません";
	const localeValues = {
		locale: "ja",
		Pagination: _ja_JP.default,
		DatePicker: _ja_JP3.default,
		TimePicker: _ja_JP4.default,
		Calendar: _ja_JP2.default,
		global: {
			placeholder: "選んでください",
			close: "閉じる",
			show: "表示",
			hide: "非表示",
			sortable: "並べ替え可能"
		},
		Table: {
			filterTitle: "フィルター",
			filterConfirm: "OK",
			filterReset: "リセット",
			filterEmptyText: "フィルターなし",
			filterCheckAll: "すべてを選択",
			filterSearchPlaceholder: "フィルターで検索",
			emptyText: "データなし",
			selectAll: "ページ単位で選択",
			selectInvert: "ページ単位で反転",
			selectNone: "クリア",
			selectionAll: "すべてを選択",
			sortTitle: "ソート",
			expand: "展開する",
			collapse: "折り畳む",
			triggerDesc: "クリックで降順にソート",
			triggerAsc: "クリックで昇順にソート",
			cancelSort: "ソートをキャンセル"
		},
		Tour: {
			Next: "次",
			Previous: "前の",
			Finish: "仕上げる"
		},
		Modal: {
			okText: "OK",
			cancelText: "キャンセル",
			justOkText: "OK"
		},
		Popconfirm: {
			okText: "OK",
			cancelText: "キャンセル"
		},
		Transfer: {
			titles: ["", ""],
			searchPlaceholder: "ここを検索",
			itemUnit: "アイテム",
			itemsUnit: "アイテム",
			remove: "削除",
			selectCurrent: "現在のページを選択",
			removeCurrent: "現在のページを削除",
			selectAll: "ページ単位で選択",
			deselectAll: "すべてのデータの選択を解除する",
			removeAll: "ページ単位で削除",
			selectInvert: "ページ単位で反転"
		},
		Upload: {
			uploading: "アップロード中...",
			removeFile: "ファイルを削除",
			uploadError: "アップロードエラー",
			previewFile: "ファイルをプレビュー",
			downloadFile: "ダウンロードファイル"
		},
		Empty: { description: "データがありません" },
		Icon: { icon: "アイコン" },
		Text: {
			edit: "編集",
			copy: "コピー",
			copied: "コピーされました",
			expand: "展開する",
			collapse: "折り畳む"
		},
		Form: {
			optional: "(オプション)",
			defaultValidateMessages: {
				default: "${label}のフィールド検証エラー",
				required: "${label}を入力してください",
				enum: "${label}は[${enum}]のいずれかである必要があります",
				whitespace: "${label}は空白文字にすることはできません",
				date: {
					format: "${label}の日付形式は不正です",
					parse: "${label}は日付に変換できません",
					invalid: "${label}は不正な日付です"
				},
				types: {
					string: typeTemplate,
					method: typeTemplate,
					array: typeTemplate,
					object: typeTemplate,
					number: typeTemplate,
					date: typeTemplate,
					boolean: typeTemplate,
					integer: typeTemplate,
					float: typeTemplate,
					regexp: typeTemplate,
					email: typeTemplate,
					url: typeTemplate,
					hex: typeTemplate
				},
				string: {
					len: "${label}は${len}文字である必要があります",
					min: "${label}は${min}文字以上である必要があります",
					max: "${label}は${max}文字以下である必要があります",
					range: "${label}は${min}-${max}文字の範囲である必要があります"
				},
				number: {
					len: "${label}は${len}と等しい必要があります",
					min: "${label}の最小値は${min}です",
					max: "${label}の最大値は${max}です",
					range: "${label}は${min}-${max}の範囲である必要があります"
				},
				array: {
					len: "${label}は${len}である必要があります",
					min: "${label}の最小は${min}です",
					max: "${label}の最大は${max}です",
					range: "${label}の合計は${min}-${max}の範囲である必要があります"
				},
				pattern: { mismatch: "${label}はパターン${pattern}と一致しません" }
			}
		},
		QRCode: {
			expired: "QRコードの有効期限が切れました",
			refresh: "リフレッシュ",
			scanned: "スキャン済み"
		},
		ColorPicker: {
			presetEmpty: "空の",
			transparent: "透明",
			singleColor: "単色",
			gradientColor: "グラデーション"
		}
	};
	exports.default = localeValues;
}) });

//#endregion
//#region node_modules/.pnpm/antd@6.6.1_react-dom@19.2.8_react@19.2.8__react@19.2.8/node_modules/antd/locale/ja_JP.js
var require_ja_JP = /* @__PURE__ */ __commonJS({ "node_modules/.pnpm/antd@6.6.1_react-dom@19.2.8_react@19.2.8__react@19.2.8/node_modules/antd/locale/ja_JP.js": ((exports, module) => {
	module.exports = require_ja_JP$1();
}) });

//#endregion
//#region node_modules/.pnpm/@rc-component+pagination@1._64e45aa1881d51423ab289f641a2ed2b/node_modules/@rc-component/pagination/lib/locale/ko_KR.js
var require_ko_KR$6 = /* @__PURE__ */ __commonJS({ "node_modules/.pnpm/@rc-component+pagination@1._64e45aa1881d51423ab289f641a2ed2b/node_modules/@rc-component/pagination/lib/locale/ko_KR.js": ((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.default = void 0;
	const locale = {
		items_per_page: "/ 페이지",
		jump_to: "이동하기",
		jump_to_confirm: "확인하다",
		page: "페이지",
		prev_page: "이전 페이지",
		next_page: "다음 페이지",
		prev_5: "이전 5 페이지",
		next_5: "다음 5 페이지",
		prev_3: "이전 3 페이지",
		next_3: "다음 3 페이지",
		page_size: "페이지 크기"
	};
	exports.default = locale;
}) });

//#endregion
//#region node_modules/.pnpm/@rc-component+picker@1.12.0_5c475d7f760e251b22c4e2e7d9172357/node_modules/@rc-component/picker/lib/locale/ko_KR.js
var require_ko_KR$5 = /* @__PURE__ */ __commonJS({ "node_modules/.pnpm/@rc-component+picker@1.12.0_5c475d7f760e251b22c4e2e7d9172357/node_modules/@rc-component/picker/lib/locale/ko_KR.js": ((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.default = void 0;
	const locale = {
		...require_common().commonLocale,
		locale: "ko_KR",
		today: "오늘",
		now: "현재 시각",
		backToToday: "오늘로 돌아가기",
		ok: "확인",
		clear: "지우기",
		week: "주",
		month: "월",
		year: "년",
		timeSelect: "시간 선택",
		dateSelect: "날짜 선택",
		monthSelect: "달 선택",
		yearSelect: "연 선택",
		decadeSelect: "연대 선택",
		yearFormat: "YYYY년",
		monthBeforeYear: false,
		previousMonth: "이전 달",
		nextMonth: "다음 달",
		previousYear: "이전 해",
		nextYear: "다음 해",
		previousDecade: "이전 연대",
		nextDecade: "다음 연대",
		previousCentury: "이전 세기",
		nextCentury: "다음 세기"
	};
	exports.default = locale;
}) });

//#endregion
//#region node_modules/.pnpm/antd@6.6.1_react-dom@19.2.8_react@19.2.8__react@19.2.8/node_modules/antd/lib/time-picker/locale/ko_KR.js
var require_ko_KR$4 = /* @__PURE__ */ __commonJS({ "node_modules/.pnpm/antd@6.6.1_react-dom@19.2.8_react@19.2.8__react@19.2.8/node_modules/antd/lib/time-picker/locale/ko_KR.js": ((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.default = void 0;
	const locale = {
		placeholder: "시간 선택",
		rangePlaceholder: ["시작 시간", "종료 시간"]
	};
	exports.default = locale;
}) });

//#endregion
//#region node_modules/.pnpm/antd@6.6.1_react-dom@19.2.8_react@19.2.8__react@19.2.8/node_modules/antd/lib/date-picker/locale/ko_KR.js
var require_ko_KR$3 = /* @__PURE__ */ __commonJS({ "node_modules/.pnpm/antd@6.6.1_react-dom@19.2.8_react@19.2.8__react@19.2.8/node_modules/antd/lib/date-picker/locale/ko_KR.js": ((exports) => {
	var _interopRequireDefault = require_interopRequireDefault().default;
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.default = void 0;
	var _ko_KR = _interopRequireDefault(require_ko_KR$5());
	var _ko_KR2 = _interopRequireDefault(require_ko_KR$4());
	const locale = {
		lang: {
			placeholder: "날짜 선택",
			yearPlaceholder: "연도 선택",
			quarterPlaceholder: "분기 선택",
			monthPlaceholder: "월 선택",
			weekPlaceholder: "주 선택",
			rangePlaceholder: ["시작일", "종료일"],
			rangeYearPlaceholder: ["시작 연도", "종료 연도"],
			rangeMonthPlaceholder: ["시작 월", "종료 월"],
			rangeQuarterPlaceholder: ["시작 분기", "종료 분기"],
			rangeWeekPlaceholder: ["시작 주", "종료 주"],
			shortWeekDays: [
				"일",
				"월",
				"화",
				"수",
				"목",
				"금",
				"토"
			],
			shortMonths: [
				"1월",
				"2월",
				"3월",
				"4월",
				"5월",
				"6월",
				"7월",
				"8월",
				"9월",
				"10월",
				"11월",
				"12월"
			],
			..._ko_KR.default
		},
		timePickerLocale: { ..._ko_KR2.default }
	};
	exports.default = locale;
}) });

//#endregion
//#region node_modules/.pnpm/antd@6.6.1_react-dom@19.2.8_react@19.2.8__react@19.2.8/node_modules/antd/lib/calendar/locale/ko_KR.js
var require_ko_KR$2 = /* @__PURE__ */ __commonJS({ "node_modules/.pnpm/antd@6.6.1_react-dom@19.2.8_react@19.2.8__react@19.2.8/node_modules/antd/lib/calendar/locale/ko_KR.js": ((exports) => {
	var _interopRequireDefault = require_interopRequireDefault().default;
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.default = void 0;
	var _ko_KR = _interopRequireDefault(require_ko_KR$3());
	exports.default = _ko_KR.default;
}) });

//#endregion
//#region node_modules/.pnpm/antd@6.6.1_react-dom@19.2.8_react@19.2.8__react@19.2.8/node_modules/antd/lib/locale/ko_KR.js
var require_ko_KR$1 = /* @__PURE__ */ __commonJS({ "node_modules/.pnpm/antd@6.6.1_react-dom@19.2.8_react@19.2.8__react@19.2.8/node_modules/antd/lib/locale/ko_KR.js": ((exports) => {
	var _interopRequireDefault = require_interopRequireDefault().default;
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.default = void 0;
	var _ko_KR = _interopRequireDefault(require_ko_KR$6());
	var _ko_KR2 = _interopRequireDefault(require_ko_KR$2());
	var _ko_KR3 = _interopRequireDefault(require_ko_KR$3());
	var _ko_KR4 = _interopRequireDefault(require_ko_KR$4());
	const typeTemplate = "${label} 유효하지 않은 ${type}";
	const localeValues = {
		locale: "ko",
		Pagination: _ko_KR.default,
		DatePicker: _ko_KR3.default,
		TimePicker: _ko_KR4.default,
		Calendar: _ko_KR2.default,
		global: {
			placeholder: "선택하세요",
			close: "닫기",
			show: "표시",
			hide: "숨기기",
			sortable: "정렬 가능"
		},
		Table: {
			filterTitle: "필터 메뉴",
			filterConfirm: "확인",
			filterReset: "초기화",
			filterEmptyText: "필터 없음",
			filterCheckAll: "전체 선택",
			filterSearchPlaceholder: "필터 검색",
			emptyText: "데이터 없음",
			selectAll: "전체 선택",
			selectInvert: "선택 반전",
			selectNone: "없음",
			selectionAll: "전체 선택",
			sortTitle: "정렬",
			expand: "펼치기",
			collapse: "접기",
			triggerDesc: "내림차순으로 정렬하기",
			triggerAsc: "오름차순으로 정렬하기",
			cancelSort: "정렬 취소하기"
		},
		Tour: {
			Next: "다음",
			Previous: "이전",
			Finish: "종료"
		},
		Modal: {
			okText: "확인",
			cancelText: "취소",
			justOkText: "확인"
		},
		Popconfirm: {
			okText: "확인",
			cancelText: "취소"
		},
		Transfer: {
			titles: ["", ""],
			searchPlaceholder: "여기에 검색하세요",
			itemUnit: "개",
			itemsUnit: "개",
			remove: "삭제",
			selectCurrent: "현재 페이지 선택",
			removeCurrent: "현재 페이지 삭제",
			selectAll: "전체 선택",
			removeAll: "전체 삭제",
			selectInvert: "선택 반전",
			deselectAll: "모든 데이터 선택 해제"
		},
		Upload: {
			uploading: "업로드 중...",
			removeFile: "파일 삭제",
			uploadError: "업로드 실패",
			previewFile: "파일 미리보기",
			downloadFile: "파일 다운로드"
		},
		Empty: { description: "데이터 없음" },
		Icon: { icon: "아이콘" },
		Text: {
			edit: "수정",
			copy: "복사",
			copied: "복사됨",
			expand: "확장",
			collapse: "접기"
		},
		Form: {
			optional: "(선택사항)",
			defaultValidateMessages: {
				default: "필드 유효성 검사 오류 ${label}",
				required: "${label} 값을 입력해 주세요",
				enum: "${label} [${enum}] 중에 하나여야 합니다",
				whitespace: "${label} 비워둘 수 없습니다",
				date: {
					format: "${label} 유효하지 않은 날짜 형식입니다",
					parse: "${label} 날짜 형식으로 변환될 수 없습니다",
					invalid: "${label} 유효하지 않은 날짜입니다"
				},
				types: {
					string: typeTemplate,
					method: typeTemplate,
					array: typeTemplate,
					object: typeTemplate,
					number: typeTemplate,
					date: typeTemplate,
					boolean: typeTemplate,
					integer: typeTemplate,
					float: typeTemplate,
					regexp: typeTemplate,
					email: typeTemplate,
					url: typeTemplate,
					hex: typeTemplate
				},
				string: {
					len: "${label} ${len}글자여야 합니다",
					min: "${label} 적어도 ${min}글자 이상이어야 합니다",
					max: "${label} ${max}글자 이하여야 합니다",
					range: "${label} ${min}-${max}글자 사이어야 합니다"
				},
				number: {
					len: "${label} 값은 ${len}이어야 합니다",
					min: "${label} 최솟값은 ${min}입니다",
					max: "${label} 최댓값은 ${max}입니다",
					range: "${label} 값은 ${min}-${max} 사이어야 합니다"
				},
				array: {
					len: "${len}이어야 합니다 ${label}",
					min: "최소 ${min}이어야 합니다 ${label}",
					max: "최대 ${max}이어야 합니다 ${label}",
					range: "${label} ${min}-${max} 사이어야 합니다"
				},
				pattern: { mismatch: "${label} ${pattern} 패턴과 일치하지 않습니다" }
			}
		},
		QRCode: {
			expired: "만료된 QR 코드",
			refresh: "새로고침",
			scanned: "스캔됨"
		},
		ColorPicker: {
			presetEmpty: "미정",
			transparent: "투명",
			singleColor: "단색",
			gradientColor: "그라데이션"
		}
	};
	exports.default = localeValues;
}) });

//#endregion
//#region node_modules/.pnpm/antd@6.6.1_react-dom@19.2.8_react@19.2.8__react@19.2.8/node_modules/antd/locale/ko_KR.js
var require_ko_KR = /* @__PURE__ */ __commonJS({ "node_modules/.pnpm/antd@6.6.1_react-dom@19.2.8_react@19.2.8__react@19.2.8/node_modules/antd/locale/ko_KR.js": ((exports, module) => {
	module.exports = require_ko_KR$1();
}) });

//#endregion
//#region node_modules/.pnpm/react-object-model@1.2.34_react@19.2.8/node_modules/react-object-model/index.js
var import_en_US = /* @__PURE__ */ __toESM(require_en_US(), 1);
var import_ja_JP = /* @__PURE__ */ __toESM(require_ja_JP(), 1);
var import_ko_KR = /* @__PURE__ */ __toESM(require_ko_KR(), 1);
var Model = class {
	_selectors;
	_state;
	constructor() {
		Object.defineProperty(this, "_selectors", {
			configurable: true,
			enumerable: false,
			writable: true,
			value: /* @__PURE__ */ new Map()
		});
		Object.defineProperty(this, "_state", {
			configurable: true,
			enumerable: false,
			writable: true,
			value: {}
		});
	}
	use(selector) {
		const [, rerender] = (0, import_external__react.useState)({});
		this._selectors.set(rerender, selector);
		(0, import_external__react.useEffect)(() => {
			this._selectors.set(rerender, selector);
			return () => {
				this._selectors.delete(rerender);
			};
		}, []);
		return this;
	}
	set(data) {
		Object.assign(this, data);
		this.render();
	}
	render(diffs) {
		const set_diffs = diffs ? new Set(diffs) : null;
		for (const [rerender, selector] of this._selectors) if (!selector || selector.find((key) => set_diffs ? set_diffs.has(key) : this[key] !== this._state[key])) rerender({});
		this._state = { ...this };
	}
};

//#endregion
//#region node_modules/.pnpm/xshell@1.4.38_supports-color@7.2.0/node_modules/xshell/platform.common.js
let platform;
function set_platform(_platform) {
	platform = _platform;
}

//#endregion
//#region node_modules/.pnpm/emoji-regex@10.6.0/node_modules/emoji-regex/index.mjs
var emoji_regex_default = () => {
	return /[#*0-9]\uFE0F?\u20E3|[\xA9\xAE\u203C\u2049\u2122\u2139\u2194-\u2199\u21A9\u21AA\u231A\u231B\u2328\u23CF\u23ED-\u23EF\u23F1\u23F2\u23F8-\u23FA\u24C2\u25AA\u25AB\u25B6\u25C0\u25FB\u25FC\u25FE\u2600-\u2604\u260E\u2611\u2614\u2615\u2618\u2620\u2622\u2623\u2626\u262A\u262E\u262F\u2638-\u263A\u2640\u2642\u2648-\u2653\u265F\u2660\u2663\u2665\u2666\u2668\u267B\u267E\u267F\u2692\u2694-\u2697\u2699\u269B\u269C\u26A0\u26A7\u26AA\u26B0\u26B1\u26BD\u26BE\u26C4\u26C8\u26CF\u26D1\u26E9\u26F0-\u26F5\u26F7\u26F8\u26FA\u2702\u2708\u2709\u270F\u2712\u2714\u2716\u271D\u2721\u2733\u2734\u2744\u2747\u2757\u2763\u27A1\u2934\u2935\u2B05-\u2B07\u2B1B\u2B1C\u2B55\u3030\u303D\u3297\u3299]\uFE0F?|[\u261D\u270C\u270D](?:\uD83C[\uDFFB-\uDFFF]|\uFE0F)?|[\u270A\u270B](?:\uD83C[\uDFFB-\uDFFF])?|[\u23E9-\u23EC\u23F0\u23F3\u25FD\u2693\u26A1\u26AB\u26C5\u26CE\u26D4\u26EA\u26FD\u2705\u2728\u274C\u274E\u2753-\u2755\u2795-\u2797\u27B0\u27BF\u2B50]|\u26D3\uFE0F?(?:\u200D\uD83D\uDCA5)?|\u26F9(?:\uD83C[\uDFFB-\uDFFF]|\uFE0F)?(?:\u200D[\u2640\u2642]\uFE0F?)?|\u2764\uFE0F?(?:\u200D(?:\uD83D\uDD25|\uD83E\uDE79))?|\uD83C(?:[\uDC04\uDD70\uDD71\uDD7E\uDD7F\uDE02\uDE37\uDF21\uDF24-\uDF2C\uDF36\uDF7D\uDF96\uDF97\uDF99-\uDF9B\uDF9E\uDF9F\uDFCD\uDFCE\uDFD4-\uDFDF\uDFF5\uDFF7]\uFE0F?|[\uDF85\uDFC2\uDFC7](?:\uD83C[\uDFFB-\uDFFF])?|[\uDFC4\uDFCA](?:\uD83C[\uDFFB-\uDFFF])?(?:\u200D[\u2640\u2642]\uFE0F?)?|[\uDFCB\uDFCC](?:\uD83C[\uDFFB-\uDFFF]|\uFE0F)?(?:\u200D[\u2640\u2642]\uFE0F?)?|[\uDCCF\uDD8E\uDD91-\uDD9A\uDE01\uDE1A\uDE2F\uDE32-\uDE36\uDE38-\uDE3A\uDE50\uDE51\uDF00-\uDF20\uDF2D-\uDF35\uDF37-\uDF43\uDF45-\uDF4A\uDF4C-\uDF7C\uDF7E-\uDF84\uDF86-\uDF93\uDFA0-\uDFC1\uDFC5\uDFC6\uDFC8\uDFC9\uDFCF-\uDFD3\uDFE0-\uDFF0\uDFF8-\uDFFF]|\uDDE6\uD83C[\uDDE8-\uDDEC\uDDEE\uDDF1\uDDF2\uDDF4\uDDF6-\uDDFA\uDDFC\uDDFD\uDDFF]|\uDDE7\uD83C[\uDDE6\uDDE7\uDDE9-\uDDEF\uDDF1-\uDDF4\uDDF6-\uDDF9\uDDFB\uDDFC\uDDFE\uDDFF]|\uDDE8\uD83C[\uDDE6\uDDE8\uDDE9\uDDEB-\uDDEE\uDDF0-\uDDF7\uDDFA-\uDDFF]|\uDDE9\uD83C[\uDDEA\uDDEC\uDDEF\uDDF0\uDDF2\uDDF4\uDDFF]|\uDDEA\uD83C[\uDDE6\uDDE8\uDDEA\uDDEC\uDDED\uDDF7-\uDDFA]|\uDDEB\uD83C[\uDDEE-\uDDF0\uDDF2\uDDF4\uDDF7]|\uDDEC\uD83C[\uDDE6\uDDE7\uDDE9-\uDDEE\uDDF1-\uDDF3\uDDF5-\uDDFA\uDDFC\uDDFE]|\uDDED\uD83C[\uDDF0\uDDF2\uDDF3\uDDF7\uDDF9\uDDFA]|\uDDEE\uD83C[\uDDE8-\uDDEA\uDDF1-\uDDF4\uDDF6-\uDDF9]|\uDDEF\uD83C[\uDDEA\uDDF2\uDDF4\uDDF5]|\uDDF0\uD83C[\uDDEA\uDDEC-\uDDEE\uDDF2\uDDF3\uDDF5\uDDF7\uDDFC\uDDFE\uDDFF]|\uDDF1\uD83C[\uDDE6-\uDDE8\uDDEE\uDDF0\uDDF7-\uDDFB\uDDFE]|\uDDF2\uD83C[\uDDE6\uDDE8-\uDDED\uDDF0-\uDDFF]|\uDDF3\uD83C[\uDDE6\uDDE8\uDDEA-\uDDEC\uDDEE\uDDF1\uDDF4\uDDF5\uDDF7\uDDFA\uDDFF]|\uDDF4\uD83C\uDDF2|\uDDF5\uD83C[\uDDE6\uDDEA-\uDDED\uDDF0-\uDDF3\uDDF7-\uDDF9\uDDFC\uDDFE]|\uDDF6\uD83C\uDDE6|\uDDF7\uD83C[\uDDEA\uDDF4\uDDF8\uDDFA\uDDFC]|\uDDF8\uD83C[\uDDE6-\uDDEA\uDDEC-\uDDF4\uDDF7-\uDDF9\uDDFB\uDDFD-\uDDFF]|\uDDF9\uD83C[\uDDE6\uDDE8\uDDE9\uDDEB-\uDDED\uDDEF-\uDDF4\uDDF7\uDDF9\uDDFB\uDDFC\uDDFF]|\uDDFA\uD83C[\uDDE6\uDDEC\uDDF2\uDDF3\uDDF8\uDDFE\uDDFF]|\uDDFB\uD83C[\uDDE6\uDDE8\uDDEA\uDDEC\uDDEE\uDDF3\uDDFA]|\uDDFC\uD83C[\uDDEB\uDDF8]|\uDDFD\uD83C\uDDF0|\uDDFE\uD83C[\uDDEA\uDDF9]|\uDDFF\uD83C[\uDDE6\uDDF2\uDDFC]|\uDF44(?:\u200D\uD83D\uDFEB)?|\uDF4B(?:\u200D\uD83D\uDFE9)?|\uDFC3(?:\uD83C[\uDFFB-\uDFFF])?(?:\u200D(?:[\u2640\u2642]\uFE0F?(?:\u200D\u27A1\uFE0F?)?|\u27A1\uFE0F?))?|\uDFF3\uFE0F?(?:\u200D(?:\u26A7\uFE0F?|\uD83C\uDF08))?|\uDFF4(?:\u200D\u2620\uFE0F?|\uDB40\uDC67\uDB40\uDC62\uDB40(?:\uDC65\uDB40\uDC6E\uDB40\uDC67|\uDC73\uDB40\uDC63\uDB40\uDC74|\uDC77\uDB40\uDC6C\uDB40\uDC73)\uDB40\uDC7F)?)|\uD83D(?:[\uDC3F\uDCFD\uDD49\uDD4A\uDD6F\uDD70\uDD73\uDD76-\uDD79\uDD87\uDD8A-\uDD8D\uDDA5\uDDA8\uDDB1\uDDB2\uDDBC\uDDC2-\uDDC4\uDDD1-\uDDD3\uDDDC-\uDDDE\uDDE1\uDDE3\uDDE8\uDDEF\uDDF3\uDDFA\uDECB\uDECD-\uDECF\uDEE0-\uDEE5\uDEE9\uDEF0\uDEF3]\uFE0F?|[\uDC42\uDC43\uDC46-\uDC50\uDC66\uDC67\uDC6B-\uDC6D\uDC72\uDC74-\uDC76\uDC78\uDC7C\uDC83\uDC85\uDC8F\uDC91\uDCAA\uDD7A\uDD95\uDD96\uDE4C\uDE4F\uDEC0\uDECC](?:\uD83C[\uDFFB-\uDFFF])?|[\uDC6E-\uDC71\uDC73\uDC77\uDC81\uDC82\uDC86\uDC87\uDE45-\uDE47\uDE4B\uDE4D\uDE4E\uDEA3\uDEB4\uDEB5](?:\uD83C[\uDFFB-\uDFFF])?(?:\u200D[\u2640\u2642]\uFE0F?)?|[\uDD74\uDD90](?:\uD83C[\uDFFB-\uDFFF]|\uFE0F)?|[\uDC00-\uDC07\uDC09-\uDC14\uDC16-\uDC25\uDC27-\uDC3A\uDC3C-\uDC3E\uDC40\uDC44\uDC45\uDC51-\uDC65\uDC6A\uDC79-\uDC7B\uDC7D-\uDC80\uDC84\uDC88-\uDC8E\uDC90\uDC92-\uDCA9\uDCAB-\uDCFC\uDCFF-\uDD3D\uDD4B-\uDD4E\uDD50-\uDD67\uDDA4\uDDFB-\uDE2D\uDE2F-\uDE34\uDE37-\uDE41\uDE43\uDE44\uDE48-\uDE4A\uDE80-\uDEA2\uDEA4-\uDEB3\uDEB7-\uDEBF\uDEC1-\uDEC5\uDED0-\uDED2\uDED5-\uDED8\uDEDC-\uDEDF\uDEEB\uDEEC\uDEF4-\uDEFC\uDFE0-\uDFEB\uDFF0]|\uDC08(?:\u200D\u2B1B)?|\uDC15(?:\u200D\uD83E\uDDBA)?|\uDC26(?:\u200D(?:\u2B1B|\uD83D\uDD25))?|\uDC3B(?:\u200D\u2744\uFE0F?)?|\uDC41\uFE0F?(?:\u200D\uD83D\uDDE8\uFE0F?)?|\uDC68(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D\uD83D(?:\uDC8B\u200D\uD83D)?\uDC68|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D(?:[\uDC68\uDC69]\u200D\uD83D(?:\uDC66(?:\u200D\uD83D\uDC66)?|\uDC67(?:\u200D\uD83D[\uDC66\uDC67])?)|[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uDC66(?:\u200D\uD83D\uDC66)?|\uDC67(?:\u200D\uD83D[\uDC66\uDC67])?)|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3]))|\uD83C(?:\uDFFB(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D\uD83D(?:\uDC8B\u200D\uD83D)?\uDC68\uD83C[\uDFFB-\uDFFF]|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D(?:[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uDC30\u200D\uD83D\uDC68\uD83C[\uDFFC-\uDFFF])|\uD83E(?:[\uDD1D\uDEEF]\u200D\uD83D\uDC68\uD83C[\uDFFC-\uDFFF]|[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3])))?|\uDFFC(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D\uD83D(?:\uDC8B\u200D\uD83D)?\uDC68\uD83C[\uDFFB-\uDFFF]|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D(?:[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uDC30\u200D\uD83D\uDC68\uD83C[\uDFFB\uDFFD-\uDFFF])|\uD83E(?:[\uDD1D\uDEEF]\u200D\uD83D\uDC68\uD83C[\uDFFB\uDFFD-\uDFFF]|[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3])))?|\uDFFD(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D\uD83D(?:\uDC8B\u200D\uD83D)?\uDC68\uD83C[\uDFFB-\uDFFF]|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D(?:[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uDC30\u200D\uD83D\uDC68\uD83C[\uDFFB\uDFFC\uDFFE\uDFFF])|\uD83E(?:[\uDD1D\uDEEF]\u200D\uD83D\uDC68\uD83C[\uDFFB\uDFFC\uDFFE\uDFFF]|[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3])))?|\uDFFE(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D\uD83D(?:\uDC8B\u200D\uD83D)?\uDC68\uD83C[\uDFFB-\uDFFF]|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D(?:[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uDC30\u200D\uD83D\uDC68\uD83C[\uDFFB-\uDFFD\uDFFF])|\uD83E(?:[\uDD1D\uDEEF]\u200D\uD83D\uDC68\uD83C[\uDFFB-\uDFFD\uDFFF]|[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3])))?|\uDFFF(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D\uD83D(?:\uDC8B\u200D\uD83D)?\uDC68\uD83C[\uDFFB-\uDFFF]|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D(?:[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uDC30\u200D\uD83D\uDC68\uD83C[\uDFFB-\uDFFE])|\uD83E(?:[\uDD1D\uDEEF]\u200D\uD83D\uDC68\uD83C[\uDFFB-\uDFFE]|[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3])))?))?|\uDC69(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D\uD83D(?:\uDC8B\u200D\uD83D)?[\uDC68\uDC69]|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D(?:[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uDC66(?:\u200D\uD83D\uDC66)?|\uDC67(?:\u200D\uD83D[\uDC66\uDC67])?|\uDC69\u200D\uD83D(?:\uDC66(?:\u200D\uD83D\uDC66)?|\uDC67(?:\u200D\uD83D[\uDC66\uDC67])?))|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3]))|\uD83C(?:\uDFFB(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D\uD83D(?:[\uDC68\uDC69]|\uDC8B\u200D\uD83D[\uDC68\uDC69])\uD83C[\uDFFB-\uDFFF]|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D(?:[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uDC30\u200D\uD83D\uDC69\uD83C[\uDFFC-\uDFFF])|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3]|\uDD1D\u200D\uD83D[\uDC68\uDC69]\uD83C[\uDFFC-\uDFFF]|\uDEEF\u200D\uD83D\uDC69\uD83C[\uDFFC-\uDFFF])))?|\uDFFC(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D\uD83D(?:[\uDC68\uDC69]|\uDC8B\u200D\uD83D[\uDC68\uDC69])\uD83C[\uDFFB-\uDFFF]|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D(?:[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uDC30\u200D\uD83D\uDC69\uD83C[\uDFFB\uDFFD-\uDFFF])|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3]|\uDD1D\u200D\uD83D[\uDC68\uDC69]\uD83C[\uDFFB\uDFFD-\uDFFF]|\uDEEF\u200D\uD83D\uDC69\uD83C[\uDFFB\uDFFD-\uDFFF])))?|\uDFFD(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D\uD83D(?:[\uDC68\uDC69]|\uDC8B\u200D\uD83D[\uDC68\uDC69])\uD83C[\uDFFB-\uDFFF]|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D(?:[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uDC30\u200D\uD83D\uDC69\uD83C[\uDFFB\uDFFC\uDFFE\uDFFF])|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3]|\uDD1D\u200D\uD83D[\uDC68\uDC69]\uD83C[\uDFFB\uDFFC\uDFFE\uDFFF]|\uDEEF\u200D\uD83D\uDC69\uD83C[\uDFFB\uDFFC\uDFFE\uDFFF])))?|\uDFFE(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D\uD83D(?:[\uDC68\uDC69]|\uDC8B\u200D\uD83D[\uDC68\uDC69])\uD83C[\uDFFB-\uDFFF]|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D(?:[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uDC30\u200D\uD83D\uDC69\uD83C[\uDFFB-\uDFFD\uDFFF])|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3]|\uDD1D\u200D\uD83D[\uDC68\uDC69]\uD83C[\uDFFB-\uDFFD\uDFFF]|\uDEEF\u200D\uD83D\uDC69\uD83C[\uDFFB-\uDFFD\uDFFF])))?|\uDFFF(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D\uD83D(?:[\uDC68\uDC69]|\uDC8B\u200D\uD83D[\uDC68\uDC69])\uD83C[\uDFFB-\uDFFF]|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D(?:[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uDC30\u200D\uD83D\uDC69\uD83C[\uDFFB-\uDFFE])|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3]|\uDD1D\u200D\uD83D[\uDC68\uDC69]\uD83C[\uDFFB-\uDFFE]|\uDEEF\u200D\uD83D\uDC69\uD83C[\uDFFB-\uDFFE])))?))?|\uDD75(?:\uD83C[\uDFFB-\uDFFF]|\uFE0F)?(?:\u200D[\u2640\u2642]\uFE0F?)?|\uDE2E(?:\u200D\uD83D\uDCA8)?|\uDE35(?:\u200D\uD83D\uDCAB)?|\uDE36(?:\u200D\uD83C\uDF2B\uFE0F?)?|\uDE42(?:\u200D[\u2194\u2195]\uFE0F?)?|\uDEB6(?:\uD83C[\uDFFB-\uDFFF])?(?:\u200D(?:[\u2640\u2642]\uFE0F?(?:\u200D\u27A1\uFE0F?)?|\u27A1\uFE0F?))?)|\uD83E(?:[\uDD0C\uDD0F\uDD18-\uDD1F\uDD30-\uDD34\uDD36\uDD77\uDDB5\uDDB6\uDDBB\uDDD2\uDDD3\uDDD5\uDEC3-\uDEC5\uDEF0\uDEF2-\uDEF8](?:\uD83C[\uDFFB-\uDFFF])?|[\uDD26\uDD35\uDD37-\uDD39\uDD3C-\uDD3E\uDDB8\uDDB9\uDDCD\uDDCF\uDDD4\uDDD6-\uDDDD](?:\uD83C[\uDFFB-\uDFFF])?(?:\u200D[\u2640\u2642]\uFE0F?)?|[\uDDDE\uDDDF](?:\u200D[\u2640\u2642]\uFE0F?)?|[\uDD0D\uDD0E\uDD10-\uDD17\uDD20-\uDD25\uDD27-\uDD2F\uDD3A\uDD3F-\uDD45\uDD47-\uDD76\uDD78-\uDDB4\uDDB7\uDDBA\uDDBC-\uDDCC\uDDD0\uDDE0-\uDDFF\uDE70-\uDE7C\uDE80-\uDE8A\uDE8E-\uDEC2\uDEC6\uDEC8\uDECD-\uDEDC\uDEDF-\uDEEA\uDEEF]|\uDDCE(?:\uD83C[\uDFFB-\uDFFF])?(?:\u200D(?:[\u2640\u2642]\uFE0F?(?:\u200D\u27A1\uFE0F?)?|\u27A1\uFE0F?))?|\uDDD1(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\uD83C[\uDF3E\uDF73\uDF7C\uDF84\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3\uDE70]|\uDD1D\u200D\uD83E\uDDD1|\uDDD1\u200D\uD83E\uDDD2(?:\u200D\uD83E\uDDD2)?|\uDDD2(?:\u200D\uD83E\uDDD2)?))|\uD83C(?:\uDFFB(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D(?:\uD83D\uDC8B\u200D)?\uD83E\uDDD1\uD83C[\uDFFC-\uDFFF]|\uD83C[\uDF3E\uDF73\uDF7C\uDF84\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D(?:[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uDC30\u200D\uD83E\uDDD1\uD83C[\uDFFC-\uDFFF])|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3\uDE70]|\uDD1D\u200D\uD83E\uDDD1\uD83C[\uDFFB-\uDFFF]|\uDEEF\u200D\uD83E\uDDD1\uD83C[\uDFFC-\uDFFF])))?|\uDFFC(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D(?:\uD83D\uDC8B\u200D)?\uD83E\uDDD1\uD83C[\uDFFB\uDFFD-\uDFFF]|\uD83C[\uDF3E\uDF73\uDF7C\uDF84\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D(?:[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uDC30\u200D\uD83E\uDDD1\uD83C[\uDFFB\uDFFD-\uDFFF])|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3\uDE70]|\uDD1D\u200D\uD83E\uDDD1\uD83C[\uDFFB-\uDFFF]|\uDEEF\u200D\uD83E\uDDD1\uD83C[\uDFFB\uDFFD-\uDFFF])))?|\uDFFD(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D(?:\uD83D\uDC8B\u200D)?\uD83E\uDDD1\uD83C[\uDFFB\uDFFC\uDFFE\uDFFF]|\uD83C[\uDF3E\uDF73\uDF7C\uDF84\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D(?:[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uDC30\u200D\uD83E\uDDD1\uD83C[\uDFFB\uDFFC\uDFFE\uDFFF])|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3\uDE70]|\uDD1D\u200D\uD83E\uDDD1\uD83C[\uDFFB-\uDFFF]|\uDEEF\u200D\uD83E\uDDD1\uD83C[\uDFFB\uDFFC\uDFFE\uDFFF])))?|\uDFFE(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D(?:\uD83D\uDC8B\u200D)?\uD83E\uDDD1\uD83C[\uDFFB-\uDFFD\uDFFF]|\uD83C[\uDF3E\uDF73\uDF7C\uDF84\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D(?:[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uDC30\u200D\uD83E\uDDD1\uD83C[\uDFFB-\uDFFD\uDFFF])|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3\uDE70]|\uDD1D\u200D\uD83E\uDDD1\uD83C[\uDFFB-\uDFFF]|\uDEEF\u200D\uD83E\uDDD1\uD83C[\uDFFB-\uDFFD\uDFFF])))?|\uDFFF(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D(?:\uD83D\uDC8B\u200D)?\uD83E\uDDD1\uD83C[\uDFFB-\uDFFE]|\uD83C[\uDF3E\uDF73\uDF7C\uDF84\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D(?:[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uDC30\u200D\uD83E\uDDD1\uD83C[\uDFFB-\uDFFE])|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3\uDE70]|\uDD1D\u200D\uD83E\uDDD1\uD83C[\uDFFB-\uDFFF]|\uDEEF\u200D\uD83E\uDDD1\uD83C[\uDFFB-\uDFFE])))?))?|\uDEF1(?:\uD83C(?:\uDFFB(?:\u200D\uD83E\uDEF2\uD83C[\uDFFC-\uDFFF])?|\uDFFC(?:\u200D\uD83E\uDEF2\uD83C[\uDFFB\uDFFD-\uDFFF])?|\uDFFD(?:\u200D\uD83E\uDEF2\uD83C[\uDFFB\uDFFC\uDFFE\uDFFF])?|\uDFFE(?:\u200D\uD83E\uDEF2\uD83C[\uDFFB-\uDFFD\uDFFF])?|\uDFFF(?:\u200D\uD83E\uDEF2\uD83C[\uDFFB-\uDFFE])?))?)/g;
};

//#endregion
//#region node_modules/.pnpm/i18next@25.8.1_typescript@6.0.3/node_modules/i18next/dist/esm/i18next.js
const isString = (obj) => typeof obj === "string";
const defer$1 = () => {
	let res;
	let rej;
	const promise = new Promise((resolve, reject) => {
		res = resolve;
		rej = reject;
	});
	promise.resolve = res;
	promise.reject = rej;
	return promise;
};
const makeString = (object) => {
	if (object == null) return "";
	return "" + object;
};
const copy = (a, s, t) => {
	a.forEach((m) => {
		if (s[m]) t[m] = s[m];
	});
};
const lastOfPathSeparatorRegExp = /###/g;
const cleanKey = (key) => key && key.indexOf("###") > -1 ? key.replace(lastOfPathSeparatorRegExp, ".") : key;
const canNotTraverseDeeper = (object) => !object || isString(object);
const getLastOfPath = (object, path, Empty) => {
	const stack = !isString(path) ? path : path.split(".");
	let stackIndex = 0;
	while (stackIndex < stack.length - 1) {
		if (canNotTraverseDeeper(object)) return {};
		const key = cleanKey(stack[stackIndex]);
		if (!object[key] && Empty) object[key] = new Empty();
		if (Object.prototype.hasOwnProperty.call(object, key)) object = object[key];
		else object = {};
		++stackIndex;
	}
	if (canNotTraverseDeeper(object)) return {};
	return {
		obj: object,
		k: cleanKey(stack[stackIndex])
	};
};
const setPath = (object, path, newValue) => {
	const { obj, k } = getLastOfPath(object, path, Object);
	if (obj !== void 0 || path.length === 1) {
		obj[k] = newValue;
		return;
	}
	let e = path[path.length - 1];
	let p = path.slice(0, path.length - 1);
	let last = getLastOfPath(object, p, Object);
	while (last.obj === void 0 && p.length) {
		e = `${p[p.length - 1]}.${e}`;
		p = p.slice(0, p.length - 1);
		last = getLastOfPath(object, p, Object);
		if (last?.obj && typeof last.obj[`${last.k}.${e}`] !== "undefined") last.obj = void 0;
	}
	last.obj[`${last.k}.${e}`] = newValue;
};
const pushPath = (object, path, newValue, concat) => {
	const { obj, k } = getLastOfPath(object, path, Object);
	obj[k] = obj[k] || [];
	obj[k].push(newValue);
};
const getPath = (object, path) => {
	const { obj, k } = getLastOfPath(object, path);
	if (!obj) return void 0;
	if (!Object.prototype.hasOwnProperty.call(obj, k)) return void 0;
	return obj[k];
};
const getPathWithDefaults = (data, defaultData, key) => {
	const value = getPath(data, key);
	if (value !== void 0) return value;
	return getPath(defaultData, key);
};
const deepExtend = (target, source, overwrite) => {
	for (const prop in source) if (prop !== "__proto__" && prop !== "constructor") {
		if (prop in target) {
			if (isString(target[prop]) || target[prop] instanceof String || isString(source[prop]) || source[prop] instanceof String) {
				if (overwrite) target[prop] = source[prop];
			} else deepExtend(target[prop], source[prop], overwrite);
		} else target[prop] = source[prop];
	}
	return target;
};
const regexEscape = (str) => str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
var _entityMap = {
	"&": "&amp;",
	"<": "&lt;",
	">": "&gt;",
	"\"": "&quot;",
	"'": "&#39;",
	"/": "&#x2F;"
};
const escape = (data) => {
	if (isString(data)) return data.replace(/[&<>"'\/]/g, (s) => _entityMap[s]);
	return data;
};
var RegExpCache = class {
	constructor(capacity) {
		this.capacity = capacity;
		this.regExpMap = /* @__PURE__ */ new Map();
		this.regExpQueue = [];
	}
	getRegExp(pattern) {
		const regExpFromCache = this.regExpMap.get(pattern);
		if (regExpFromCache !== void 0) return regExpFromCache;
		const regExpNew = new RegExp(pattern);
		if (this.regExpQueue.length === this.capacity) this.regExpMap.delete(this.regExpQueue.shift());
		this.regExpMap.set(pattern, regExpNew);
		this.regExpQueue.push(pattern);
		return regExpNew;
	}
};
const chars = [
	" ",
	",",
	"?",
	"!",
	";"
];
const looksLikeObjectPathRegExpCache = new RegExpCache(20);
const looksLikeObjectPath = (key, nsSeparator, keySeparator) => {
	nsSeparator = nsSeparator || "";
	keySeparator = keySeparator || "";
	const possibleChars = chars.filter((c) => nsSeparator.indexOf(c) < 0 && keySeparator.indexOf(c) < 0);
	if (possibleChars.length === 0) return true;
	const r = looksLikeObjectPathRegExpCache.getRegExp(`(${possibleChars.map((c) => c === "?" ? "\\?" : c).join("|")})`);
	let matched = !r.test(key);
	if (!matched) {
		const ki = key.indexOf(keySeparator);
		if (ki > 0 && !r.test(key.substring(0, ki))) matched = true;
	}
	return matched;
};
const deepFind = (obj, path, keySeparator = ".") => {
	if (!obj) return void 0;
	if (obj[path]) {
		if (!Object.prototype.hasOwnProperty.call(obj, path)) return void 0;
		return obj[path];
	}
	const tokens = path.split(keySeparator);
	let current = obj;
	for (let i = 0; i < tokens.length;) {
		if (!current || typeof current !== "object") return;
		let next;
		let nextPath = "";
		for (let j = i; j < tokens.length; ++j) {
			if (j !== i) nextPath += keySeparator;
			nextPath += tokens[j];
			next = current[nextPath];
			if (next !== void 0) {
				if ([
					"string",
					"number",
					"boolean"
				].indexOf(typeof next) > -1 && j < tokens.length - 1) continue;
				i += j - i + 1;
				break;
			}
		}
		current = next;
	}
	return current;
};
const getCleanedCode = (code) => code?.replace("_", "-");
const consoleLogger = {
	type: "logger",
	log(args) {
		this.output("log", args);
	},
	warn(args) {
		this.output("warn", args);
	},
	error(args) {
		this.output("error", args);
	},
	output(type, args) {
		console?.[type]?.apply?.(console, args);
	}
};
var Logger = class Logger {
	constructor(concreteLogger, options = {}) {
		this.init(concreteLogger, options);
	}
	init(concreteLogger, options = {}) {
		this.prefix = options.prefix || "i18next:";
		this.logger = concreteLogger || consoleLogger;
		this.options = options;
		this.debug = options.debug;
	}
	log(...args) {
		return this.forward(args, "log", "", true);
	}
	warn(...args) {
		return this.forward(args, "warn", "", true);
	}
	error(...args) {
		return this.forward(args, "error", "");
	}
	deprecate(...args) {
		return this.forward(args, "warn", "WARNING DEPRECATED: ", true);
	}
	forward(args, lvl, prefix, debugOnly) {
		if (debugOnly && !this.debug) return null;
		if (isString(args[0])) args[0] = `${prefix}${this.prefix} ${args[0]}`;
		return this.logger[lvl](args);
	}
	create(moduleName) {
		return new Logger(this.logger, {
			prefix: `${this.prefix}:${moduleName}:`,
			...this.options
		});
	}
	clone(options) {
		options = options || this.options;
		options.prefix = options.prefix || this.prefix;
		return new Logger(this.logger, options);
	}
};
var baseLogger = new Logger();
var EventEmitter = class {
	constructor() {
		this.observers = {};
	}
	on(events, listener) {
		events.split(" ").forEach((event) => {
			if (!this.observers[event]) this.observers[event] = /* @__PURE__ */ new Map();
			const numListeners = this.observers[event].get(listener) || 0;
			this.observers[event].set(listener, numListeners + 1);
		});
		return this;
	}
	off(event, listener) {
		if (!this.observers[event]) return;
		if (!listener) {
			delete this.observers[event];
			return;
		}
		this.observers[event].delete(listener);
	}
	emit(event, ...args) {
		if (this.observers[event]) Array.from(this.observers[event].entries()).forEach(([observer, numTimesAdded]) => {
			for (let i = 0; i < numTimesAdded; i++) observer(...args);
		});
		if (this.observers["*"]) Array.from(this.observers["*"].entries()).forEach(([observer, numTimesAdded]) => {
			for (let i = 0; i < numTimesAdded; i++) observer.apply(observer, [event, ...args]);
		});
	}
};
var ResourceStore = class extends EventEmitter {
	constructor(data, options = {
		ns: ["translation"],
		defaultNS: "translation"
	}) {
		super();
		this.data = data || {};
		this.options = options;
		if (this.options.keySeparator === void 0) this.options.keySeparator = ".";
		if (this.options.ignoreJSONStructure === void 0) this.options.ignoreJSONStructure = true;
	}
	addNamespaces(ns) {
		if (this.options.ns.indexOf(ns) < 0) this.options.ns.push(ns);
	}
	removeNamespaces(ns) {
		const index = this.options.ns.indexOf(ns);
		if (index > -1) this.options.ns.splice(index, 1);
	}
	getResource(lng, ns, key, options = {}) {
		const keySeparator = options.keySeparator !== void 0 ? options.keySeparator : this.options.keySeparator;
		const ignoreJSONStructure = options.ignoreJSONStructure !== void 0 ? options.ignoreJSONStructure : this.options.ignoreJSONStructure;
		let path;
		if (lng.indexOf(".") > -1) path = lng.split(".");
		else {
			path = [lng, ns];
			if (key) {
				if (Array.isArray(key)) path.push(...key);
				else if (isString(key) && keySeparator) path.push(...key.split(keySeparator));
				else path.push(key);
			}
		}
		const result = getPath(this.data, path);
		if (!result && !ns && !key && lng.indexOf(".") > -1) {
			lng = path[0];
			ns = path[1];
			key = path.slice(2).join(".");
		}
		if (result || !ignoreJSONStructure || !isString(key)) return result;
		return deepFind(this.data?.[lng]?.[ns], key, keySeparator);
	}
	addResource(lng, ns, key, value, options = { silent: false }) {
		const keySeparator = options.keySeparator !== void 0 ? options.keySeparator : this.options.keySeparator;
		let path = [lng, ns];
		if (key) path = path.concat(keySeparator ? key.split(keySeparator) : key);
		if (lng.indexOf(".") > -1) {
			path = lng.split(".");
			value = ns;
			ns = path[1];
		}
		this.addNamespaces(ns);
		setPath(this.data, path, value);
		if (!options.silent) this.emit("added", lng, ns, key, value);
	}
	addResources(lng, ns, resources, options = { silent: false }) {
		for (const m in resources) if (isString(resources[m]) || Array.isArray(resources[m])) this.addResource(lng, ns, m, resources[m], { silent: true });
		if (!options.silent) this.emit("added", lng, ns, resources);
	}
	addResourceBundle(lng, ns, resources, deep, overwrite, options = {
		silent: false,
		skipCopy: false
	}) {
		let path = [lng, ns];
		if (lng.indexOf(".") > -1) {
			path = lng.split(".");
			deep = resources;
			resources = ns;
			ns = path[1];
		}
		this.addNamespaces(ns);
		let pack = getPath(this.data, path) || {};
		if (!options.skipCopy) resources = JSON.parse(JSON.stringify(resources));
		if (deep) deepExtend(pack, resources, overwrite);
		else pack = {
			...pack,
			...resources
		};
		setPath(this.data, path, pack);
		if (!options.silent) this.emit("added", lng, ns, resources);
	}
	removeResourceBundle(lng, ns) {
		if (this.hasResourceBundle(lng, ns)) delete this.data[lng][ns];
		this.removeNamespaces(ns);
		this.emit("removed", lng, ns);
	}
	hasResourceBundle(lng, ns) {
		return this.getResource(lng, ns) !== void 0;
	}
	getResourceBundle(lng, ns) {
		if (!ns) ns = this.options.defaultNS;
		return this.getResource(lng, ns);
	}
	getDataByLanguage(lng) {
		return this.data[lng];
	}
	hasLanguageSomeTranslations(lng) {
		const data = this.getDataByLanguage(lng);
		return !!(data && Object.keys(data) || []).find((v) => data[v] && Object.keys(data[v]).length > 0);
	}
	toJSON() {
		return this.data;
	}
};
var postProcessor = {
	processors: {},
	addPostProcessor(module) {
		this.processors[module.name] = module;
	},
	handle(processors, value, key, options, translator) {
		processors.forEach((processor) => {
			value = this.processors[processor]?.process(value, key, options, translator) ?? value;
		});
		return value;
	}
};
const PATH_KEY = Symbol("i18next/PATH_KEY");
function createProxy() {
	const state = [];
	const handler = Object.create(null);
	let proxy;
	handler.get = (target, key) => {
		proxy?.revoke?.();
		if (key === PATH_KEY) return state;
		state.push(key);
		proxy = Proxy.revocable(target, handler);
		return proxy.proxy;
	};
	return Proxy.revocable(Object.create(null), handler).proxy;
}
function keysFromSelector(selector, opts) {
	const { [PATH_KEY]: path } = selector(createProxy());
	return path.join(opts?.keySeparator ?? ".");
}
const checkedLoadedFor = {};
const shouldHandleAsObject = (res) => !isString(res) && typeof res !== "boolean" && typeof res !== "number";
var Translator = class Translator extends EventEmitter {
	constructor(services, options = {}) {
		super();
		copy([
			"resourceStore",
			"languageUtils",
			"pluralResolver",
			"interpolator",
			"backendConnector",
			"i18nFormat",
			"utils"
		], services, this);
		this.options = options;
		if (this.options.keySeparator === void 0) this.options.keySeparator = ".";
		this.logger = baseLogger.create("translator");
	}
	changeLanguage(lng) {
		if (lng) this.language = lng;
	}
	exists(key, o = { interpolation: {} }) {
		const opt = { ...o };
		if (key == null) return false;
		const resolved = this.resolve(key, opt);
		if (resolved?.res === void 0) return false;
		const isObject = shouldHandleAsObject(resolved.res);
		if (opt.returnObjects === false && isObject) return false;
		return true;
	}
	extractFromKey(key, opt) {
		let nsSeparator = opt.nsSeparator !== void 0 ? opt.nsSeparator : this.options.nsSeparator;
		if (nsSeparator === void 0) nsSeparator = ":";
		const keySeparator = opt.keySeparator !== void 0 ? opt.keySeparator : this.options.keySeparator;
		let namespaces = opt.ns || this.options.defaultNS || [];
		const wouldCheckForNsInKey = nsSeparator && key.indexOf(nsSeparator) > -1;
		const seemsNaturalLanguage = !this.options.userDefinedKeySeparator && !opt.keySeparator && !this.options.userDefinedNsSeparator && !opt.nsSeparator && !looksLikeObjectPath(key, nsSeparator, keySeparator);
		if (wouldCheckForNsInKey && !seemsNaturalLanguage) {
			const m = key.match(this.interpolator.nestingRegexp);
			if (m && m.length > 0) return {
				key,
				namespaces: isString(namespaces) ? [namespaces] : namespaces
			};
			const parts = key.split(nsSeparator);
			if (nsSeparator !== keySeparator || nsSeparator === keySeparator && this.options.ns.indexOf(parts[0]) > -1) namespaces = parts.shift();
			key = parts.join(keySeparator);
		}
		return {
			key,
			namespaces: isString(namespaces) ? [namespaces] : namespaces
		};
	}
	translate(keys, o, lastKey) {
		let opt = typeof o === "object" ? { ...o } : o;
		if (typeof opt !== "object" && this.options.overloadTranslationOptionHandler) opt = this.options.overloadTranslationOptionHandler(arguments);
		if (typeof opt === "object") opt = { ...opt };
		if (!opt) opt = {};
		if (keys == null) return "";
		if (typeof keys === "function") keys = keysFromSelector(keys, {
			...this.options,
			...opt
		});
		if (!Array.isArray(keys)) keys = [String(keys)];
		const returnDetails = opt.returnDetails !== void 0 ? opt.returnDetails : this.options.returnDetails;
		const keySeparator = opt.keySeparator !== void 0 ? opt.keySeparator : this.options.keySeparator;
		const { key, namespaces } = this.extractFromKey(keys[keys.length - 1], opt);
		const namespace = namespaces[namespaces.length - 1];
		let nsSeparator = opt.nsSeparator !== void 0 ? opt.nsSeparator : this.options.nsSeparator;
		if (nsSeparator === void 0) nsSeparator = ":";
		const lng = opt.lng || this.language;
		const appendNamespaceToCIMode = opt.appendNamespaceToCIMode || this.options.appendNamespaceToCIMode;
		if (lng?.toLowerCase() === "cimode") {
			if (appendNamespaceToCIMode) {
				if (returnDetails) return {
					res: `${namespace}${nsSeparator}${key}`,
					usedKey: key,
					exactUsedKey: key,
					usedLng: lng,
					usedNS: namespace,
					usedParams: this.getUsedParamsDetails(opt)
				};
				return `${namespace}${nsSeparator}${key}`;
			}
			if (returnDetails) return {
				res: key,
				usedKey: key,
				exactUsedKey: key,
				usedLng: lng,
				usedNS: namespace,
				usedParams: this.getUsedParamsDetails(opt)
			};
			return key;
		}
		const resolved = this.resolve(keys, opt);
		let res = resolved?.res;
		const resUsedKey = resolved?.usedKey || key;
		const resExactUsedKey = resolved?.exactUsedKey || key;
		const noObject = [
			"[object Number]",
			"[object Function]",
			"[object RegExp]"
		];
		const joinArrays = opt.joinArrays !== void 0 ? opt.joinArrays : this.options.joinArrays;
		const handleAsObjectInI18nFormat = !this.i18nFormat || this.i18nFormat.handleAsObject;
		const needsPluralHandling = opt.count !== void 0 && !isString(opt.count);
		const hasDefaultValue = Translator.hasDefaultValue(opt);
		const defaultValueSuffix = needsPluralHandling ? this.pluralResolver.getSuffix(lng, opt.count, opt) : "";
		const defaultValueSuffixOrdinalFallback = opt.ordinal && needsPluralHandling ? this.pluralResolver.getSuffix(lng, opt.count, { ordinal: false }) : "";
		const needsZeroSuffixLookup = needsPluralHandling && !opt.ordinal && opt.count === 0;
		const defaultValue = needsZeroSuffixLookup && opt[`defaultValue${this.options.pluralSeparator}zero`] || opt[`defaultValue${defaultValueSuffix}`] || opt[`defaultValue${defaultValueSuffixOrdinalFallback}`] || opt.defaultValue;
		let resForObjHndl = res;
		if (handleAsObjectInI18nFormat && !res && hasDefaultValue) resForObjHndl = defaultValue;
		const handleAsObject = shouldHandleAsObject(resForObjHndl);
		const resType = Object.prototype.toString.apply(resForObjHndl);
		if (handleAsObjectInI18nFormat && resForObjHndl && handleAsObject && noObject.indexOf(resType) < 0 && !(isString(joinArrays) && Array.isArray(resForObjHndl))) {
			if (!opt.returnObjects && !this.options.returnObjects) {
				if (!this.options.returnedObjectHandler) this.logger.warn("accessing an object - but returnObjects options is not enabled!");
				const r = this.options.returnedObjectHandler ? this.options.returnedObjectHandler(resUsedKey, resForObjHndl, {
					...opt,
					ns: namespaces
				}) : `key '${key} (${this.language})' returned an object instead of string.`;
				if (returnDetails) {
					resolved.res = r;
					resolved.usedParams = this.getUsedParamsDetails(opt);
					return resolved;
				}
				return r;
			}
			if (keySeparator) {
				const resTypeIsArray = Array.isArray(resForObjHndl);
				const copy = resTypeIsArray ? [] : {};
				const newKeyToUse = resTypeIsArray ? resExactUsedKey : resUsedKey;
				for (const m in resForObjHndl) if (Object.prototype.hasOwnProperty.call(resForObjHndl, m)) {
					const deepKey = `${newKeyToUse}${keySeparator}${m}`;
					if (hasDefaultValue && !res) copy[m] = this.translate(deepKey, {
						...opt,
						defaultValue: shouldHandleAsObject(defaultValue) ? defaultValue[m] : void 0,
						joinArrays: false,
						ns: namespaces
					});
					else copy[m] = this.translate(deepKey, {
						...opt,
						joinArrays: false,
						ns: namespaces
					});
					if (copy[m] === deepKey) copy[m] = resForObjHndl[m];
				}
				res = copy;
			}
		} else if (handleAsObjectInI18nFormat && isString(joinArrays) && Array.isArray(res)) {
			res = res.join(joinArrays);
			if (res) res = this.extendTranslation(res, keys, opt, lastKey);
		} else {
			let usedDefault = false;
			let usedKey = false;
			if (!this.isValidLookup(res) && hasDefaultValue) {
				usedDefault = true;
				res = defaultValue;
			}
			if (!this.isValidLookup(res)) {
				usedKey = true;
				res = key;
			}
			const resForMissing = (opt.missingKeyNoValueFallbackToKey || this.options.missingKeyNoValueFallbackToKey) && usedKey ? void 0 : res;
			const updateMissing = hasDefaultValue && defaultValue !== res && this.options.updateMissing;
			if (usedKey || usedDefault || updateMissing) {
				this.logger.log(updateMissing ? "updateKey" : "missingKey", lng, namespace, key, updateMissing ? defaultValue : res);
				if (keySeparator) {
					const fk = this.resolve(key, {
						...opt,
						keySeparator: false
					});
					if (fk && fk.res) this.logger.warn("Seems the loaded translations were in flat JSON format instead of nested. Either set keySeparator: false on init or make sure your translations are published in nested format.");
				}
				let lngs = [];
				const fallbackLngs = this.languageUtils.getFallbackCodes(this.options.fallbackLng, opt.lng || this.language);
				if (this.options.saveMissingTo === "fallback" && fallbackLngs && fallbackLngs[0]) for (let i = 0; i < fallbackLngs.length; i++) lngs.push(fallbackLngs[i]);
				else if (this.options.saveMissingTo === "all") lngs = this.languageUtils.toResolveHierarchy(opt.lng || this.language);
				else lngs.push(opt.lng || this.language);
				const send = (l, k, specificDefaultValue) => {
					const defaultForMissing = hasDefaultValue && specificDefaultValue !== res ? specificDefaultValue : resForMissing;
					if (this.options.missingKeyHandler) this.options.missingKeyHandler(l, namespace, k, defaultForMissing, updateMissing, opt);
					else if (this.backendConnector?.saveMissing) this.backendConnector.saveMissing(l, namespace, k, defaultForMissing, updateMissing, opt);
					this.emit("missingKey", l, namespace, k, res);
				};
				if (this.options.saveMissing) {
					if (this.options.saveMissingPlurals && needsPluralHandling) lngs.forEach((language) => {
						const suffixes = this.pluralResolver.getSuffixes(language, opt);
						if (needsZeroSuffixLookup && opt[`defaultValue${this.options.pluralSeparator}zero`] && suffixes.indexOf(`${this.options.pluralSeparator}zero`) < 0) suffixes.push(`${this.options.pluralSeparator}zero`);
						suffixes.forEach((suffix) => {
							send([language], key + suffix, opt[`defaultValue${suffix}`] || defaultValue);
						});
					});
					else send(lngs, key, defaultValue);
				}
			}
			res = this.extendTranslation(res, keys, opt, resolved, lastKey);
			if (usedKey && res === key && this.options.appendNamespaceToMissingKey) res = `${namespace}${nsSeparator}${key}`;
			if ((usedKey || usedDefault) && this.options.parseMissingKeyHandler) res = this.options.parseMissingKeyHandler(this.options.appendNamespaceToMissingKey ? `${namespace}${nsSeparator}${key}` : key, usedDefault ? res : void 0, opt);
		}
		if (returnDetails) {
			resolved.res = res;
			resolved.usedParams = this.getUsedParamsDetails(opt);
			return resolved;
		}
		return res;
	}
	extendTranslation(res, key, opt, resolved, lastKey) {
		if (this.i18nFormat?.parse) res = this.i18nFormat.parse(res, {
			...this.options.interpolation.defaultVariables,
			...opt
		}, opt.lng || this.language || resolved.usedLng, resolved.usedNS, resolved.usedKey, { resolved });
		else if (!opt.skipInterpolation) {
			if (opt.interpolation) this.interpolator.init({
				...opt,
				interpolation: {
					...this.options.interpolation,
					...opt.interpolation
				}
			});
			const skipOnVariables = isString(res) && (opt?.interpolation?.skipOnVariables !== void 0 ? opt.interpolation.skipOnVariables : this.options.interpolation.skipOnVariables);
			let nestBef;
			if (skipOnVariables) {
				const nb = res.match(this.interpolator.nestingRegexp);
				nestBef = nb && nb.length;
			}
			let data = opt.replace && !isString(opt.replace) ? opt.replace : opt;
			if (this.options.interpolation.defaultVariables) data = {
				...this.options.interpolation.defaultVariables,
				...data
			};
			res = this.interpolator.interpolate(res, data, opt.lng || this.language || resolved.usedLng, opt);
			if (skipOnVariables) {
				const na = res.match(this.interpolator.nestingRegexp);
				const nestAft = na && na.length;
				if (nestBef < nestAft) opt.nest = false;
			}
			if (!opt.lng && resolved && resolved.res) opt.lng = this.language || resolved.usedLng;
			if (opt.nest !== false) res = this.interpolator.nest(res, (...args) => {
				if (lastKey?.[0] === args[0] && !opt.context) {
					this.logger.warn(`It seems you are nesting recursively key: ${args[0]} in key: ${key[0]}`);
					return null;
				}
				return this.translate(...args, key);
			}, opt);
			if (opt.interpolation) this.interpolator.reset();
		}
		const postProcess = opt.postProcess || this.options.postProcess;
		const postProcessorNames = isString(postProcess) ? [postProcess] : postProcess;
		if (res != null && postProcessorNames?.length && opt.applyPostProcessor !== false) res = postProcessor.handle(postProcessorNames, res, key, this.options && this.options.postProcessPassResolved ? {
			i18nResolved: {
				...resolved,
				usedParams: this.getUsedParamsDetails(opt)
			},
			...opt
		} : opt, this);
		return res;
	}
	resolve(keys, opt = {}) {
		let found;
		let usedKey;
		let exactUsedKey;
		let usedLng;
		let usedNS;
		if (isString(keys)) keys = [keys];
		keys.forEach((k) => {
			if (this.isValidLookup(found)) return;
			const extracted = this.extractFromKey(k, opt);
			const key = extracted.key;
			usedKey = key;
			let namespaces = extracted.namespaces;
			if (this.options.fallbackNS) namespaces = namespaces.concat(this.options.fallbackNS);
			const needsPluralHandling = opt.count !== void 0 && !isString(opt.count);
			const needsZeroSuffixLookup = needsPluralHandling && !opt.ordinal && opt.count === 0;
			const needsContextHandling = opt.context !== void 0 && (isString(opt.context) || typeof opt.context === "number") && opt.context !== "";
			const codes = opt.lngs ? opt.lngs : this.languageUtils.toResolveHierarchy(opt.lng || this.language, opt.fallbackLng);
			namespaces.forEach((ns) => {
				if (this.isValidLookup(found)) return;
				usedNS = ns;
				if (!checkedLoadedFor[`${codes[0]}-${ns}`] && this.utils?.hasLoadedNamespace && !this.utils?.hasLoadedNamespace(usedNS)) {
					checkedLoadedFor[`${codes[0]}-${ns}`] = true;
					this.logger.warn(`key "${usedKey}" for languages "${codes.join(", ")}" won't get resolved as namespace "${usedNS}" was not yet loaded`, "This means something IS WRONG in your setup. You access the t function before i18next.init / i18next.loadNamespace / i18next.changeLanguage was done. Wait for the callback or Promise to resolve before accessing it!!!");
				}
				codes.forEach((code) => {
					if (this.isValidLookup(found)) return;
					usedLng = code;
					const finalKeys = [key];
					if (this.i18nFormat?.addLookupKeys) this.i18nFormat.addLookupKeys(finalKeys, key, code, ns, opt);
					else {
						let pluralSuffix;
						if (needsPluralHandling) pluralSuffix = this.pluralResolver.getSuffix(code, opt.count, opt);
						const zeroSuffix = `${this.options.pluralSeparator}zero`;
						const ordinalPrefix = `${this.options.pluralSeparator}ordinal${this.options.pluralSeparator}`;
						if (needsPluralHandling) {
							if (opt.ordinal && pluralSuffix.indexOf(ordinalPrefix) === 0) finalKeys.push(key + pluralSuffix.replace(ordinalPrefix, this.options.pluralSeparator));
							finalKeys.push(key + pluralSuffix);
							if (needsZeroSuffixLookup) finalKeys.push(key + zeroSuffix);
						}
						if (needsContextHandling) {
							const contextKey = `${key}${this.options.contextSeparator || "_"}${opt.context}`;
							finalKeys.push(contextKey);
							if (needsPluralHandling) {
								if (opt.ordinal && pluralSuffix.indexOf(ordinalPrefix) === 0) finalKeys.push(contextKey + pluralSuffix.replace(ordinalPrefix, this.options.pluralSeparator));
								finalKeys.push(contextKey + pluralSuffix);
								if (needsZeroSuffixLookup) finalKeys.push(contextKey + zeroSuffix);
							}
						}
					}
					let possibleKey;
					while (possibleKey = finalKeys.pop()) if (!this.isValidLookup(found)) {
						exactUsedKey = possibleKey;
						found = this.getResource(code, ns, possibleKey, opt);
					}
				});
			});
		});
		return {
			res: found,
			usedKey,
			exactUsedKey,
			usedLng,
			usedNS
		};
	}
	isValidLookup(res) {
		return res !== void 0 && !(!this.options.returnNull && res === null) && !(!this.options.returnEmptyString && res === "");
	}
	getResource(code, ns, key, options = {}) {
		if (this.i18nFormat?.getResource) return this.i18nFormat.getResource(code, ns, key, options);
		return this.resourceStore.getResource(code, ns, key, options);
	}
	getUsedParamsDetails(options = {}) {
		const optionsKeys = [
			"defaultValue",
			"ordinal",
			"context",
			"replace",
			"lng",
			"lngs",
			"fallbackLng",
			"ns",
			"keySeparator",
			"nsSeparator",
			"returnObjects",
			"returnDetails",
			"joinArrays",
			"postProcess",
			"interpolation"
		];
		const useOptionsReplaceForData = options.replace && !isString(options.replace);
		let data = useOptionsReplaceForData ? options.replace : options;
		if (useOptionsReplaceForData && typeof options.count !== "undefined") data.count = options.count;
		if (this.options.interpolation.defaultVariables) data = {
			...this.options.interpolation.defaultVariables,
			...data
		};
		if (!useOptionsReplaceForData) {
			data = { ...data };
			for (const key of optionsKeys) delete data[key];
		}
		return data;
	}
	static hasDefaultValue(options) {
		const prefix = "defaultValue";
		for (const option in options) if (Object.prototype.hasOwnProperty.call(options, option) && prefix === option.substring(0, 12) && void 0 !== options[option]) return true;
		return false;
	}
};
var LanguageUtil = class {
	constructor(options) {
		this.options = options;
		this.supportedLngs = this.options.supportedLngs || false;
		this.logger = baseLogger.create("languageUtils");
	}
	getScriptPartFromCode(code) {
		code = getCleanedCode(code);
		if (!code || code.indexOf("-") < 0) return null;
		const p = code.split("-");
		if (p.length === 2) return null;
		p.pop();
		if (p[p.length - 1].toLowerCase() === "x") return null;
		return this.formatLanguageCode(p.join("-"));
	}
	getLanguagePartFromCode(code) {
		code = getCleanedCode(code);
		if (!code || code.indexOf("-") < 0) return code;
		const p = code.split("-");
		return this.formatLanguageCode(p[0]);
	}
	formatLanguageCode(code) {
		if (isString(code) && code.indexOf("-") > -1) {
			let formattedCode;
			try {
				formattedCode = Intl.getCanonicalLocales(code)[0];
			} catch (e) {}
			if (formattedCode && this.options.lowerCaseLng) formattedCode = formattedCode.toLowerCase();
			if (formattedCode) return formattedCode;
			if (this.options.lowerCaseLng) return code.toLowerCase();
			return code;
		}
		return this.options.cleanCode || this.options.lowerCaseLng ? code.toLowerCase() : code;
	}
	isSupportedCode(code) {
		if (this.options.load === "languageOnly" || this.options.nonExplicitSupportedLngs) code = this.getLanguagePartFromCode(code);
		return !this.supportedLngs || !this.supportedLngs.length || this.supportedLngs.indexOf(code) > -1;
	}
	getBestMatchFromCodes(codes) {
		if (!codes) return null;
		let found;
		codes.forEach((code) => {
			if (found) return;
			const cleanedLng = this.formatLanguageCode(code);
			if (!this.options.supportedLngs || this.isSupportedCode(cleanedLng)) found = cleanedLng;
		});
		if (!found && this.options.supportedLngs) codes.forEach((code) => {
			if (found) return;
			const lngScOnly = this.getScriptPartFromCode(code);
			if (this.isSupportedCode(lngScOnly)) return found = lngScOnly;
			const lngOnly = this.getLanguagePartFromCode(code);
			if (this.isSupportedCode(lngOnly)) return found = lngOnly;
			found = this.options.supportedLngs.find((supportedLng) => {
				if (supportedLng === lngOnly) return supportedLng;
				if (supportedLng.indexOf("-") < 0 && lngOnly.indexOf("-") < 0) return;
				if (supportedLng.indexOf("-") > 0 && lngOnly.indexOf("-") < 0 && supportedLng.substring(0, supportedLng.indexOf("-")) === lngOnly) return supportedLng;
				if (supportedLng.indexOf(lngOnly) === 0 && lngOnly.length > 1) return supportedLng;
			});
		});
		if (!found) found = this.getFallbackCodes(this.options.fallbackLng)[0];
		return found;
	}
	getFallbackCodes(fallbacks, code) {
		if (!fallbacks) return [];
		if (typeof fallbacks === "function") fallbacks = fallbacks(code);
		if (isString(fallbacks)) fallbacks = [fallbacks];
		if (Array.isArray(fallbacks)) return fallbacks;
		if (!code) return fallbacks.default || [];
		let found = fallbacks[code];
		if (!found) found = fallbacks[this.getScriptPartFromCode(code)];
		if (!found) found = fallbacks[this.formatLanguageCode(code)];
		if (!found) found = fallbacks[this.getLanguagePartFromCode(code)];
		if (!found) found = fallbacks.default;
		return found || [];
	}
	toResolveHierarchy(code, fallbackCode) {
		const fallbackCodes = this.getFallbackCodes((fallbackCode === false ? [] : fallbackCode) || this.options.fallbackLng || [], code);
		const codes = [];
		const addCode = (c) => {
			if (!c) return;
			if (this.isSupportedCode(c)) codes.push(c);
			else this.logger.warn(`rejecting language code not found in supportedLngs: ${c}`);
		};
		if (isString(code) && (code.indexOf("-") > -1 || code.indexOf("_") > -1)) {
			if (this.options.load !== "languageOnly") addCode(this.formatLanguageCode(code));
			if (this.options.load !== "languageOnly" && this.options.load !== "currentOnly") addCode(this.getScriptPartFromCode(code));
			if (this.options.load !== "currentOnly") addCode(this.getLanguagePartFromCode(code));
		} else if (isString(code)) addCode(this.formatLanguageCode(code));
		fallbackCodes.forEach((fc) => {
			if (codes.indexOf(fc) < 0) addCode(this.formatLanguageCode(fc));
		});
		return codes;
	}
};
const suffixesOrder = {
	zero: 0,
	one: 1,
	two: 2,
	few: 3,
	many: 4,
	other: 5
};
const dummyRule = {
	select: (count) => count === 1 ? "one" : "other",
	resolvedOptions: () => ({ pluralCategories: ["one", "other"] })
};
var PluralResolver = class {
	constructor(languageUtils, options = {}) {
		this.languageUtils = languageUtils;
		this.options = options;
		this.logger = baseLogger.create("pluralResolver");
		this.pluralRulesCache = {};
	}
	clearCache() {
		this.pluralRulesCache = {};
	}
	getRule(code, options = {}) {
		const cleanedCode = getCleanedCode(code === "dev" ? "en" : code);
		const type = options.ordinal ? "ordinal" : "cardinal";
		const cacheKey = JSON.stringify({
			cleanedCode,
			type
		});
		if (cacheKey in this.pluralRulesCache) return this.pluralRulesCache[cacheKey];
		let rule;
		try {
			rule = new Intl.PluralRules(cleanedCode, { type });
		} catch (err) {
			if (!Intl) {
				this.logger.error("No Intl support, please use an Intl polyfill!");
				return dummyRule;
			}
			if (!code.match(/-|_/)) return dummyRule;
			const lngPart = this.languageUtils.getLanguagePartFromCode(code);
			rule = this.getRule(lngPart, options);
		}
		this.pluralRulesCache[cacheKey] = rule;
		return rule;
	}
	needsPlural(code, options = {}) {
		let rule = this.getRule(code, options);
		if (!rule) rule = this.getRule("dev", options);
		return rule?.resolvedOptions().pluralCategories.length > 1;
	}
	getPluralFormsOfKey(code, key, options = {}) {
		return this.getSuffixes(code, options).map((suffix) => `${key}${suffix}`);
	}
	getSuffixes(code, options = {}) {
		let rule = this.getRule(code, options);
		if (!rule) rule = this.getRule("dev", options);
		if (!rule) return [];
		return rule.resolvedOptions().pluralCategories.sort((pluralCategory1, pluralCategory2) => suffixesOrder[pluralCategory1] - suffixesOrder[pluralCategory2]).map((pluralCategory) => `${this.options.prepend}${options.ordinal ? `ordinal${this.options.prepend}` : ""}${pluralCategory}`);
	}
	getSuffix(code, count, options = {}) {
		const rule = this.getRule(code, options);
		if (rule) return `${this.options.prepend}${options.ordinal ? `ordinal${this.options.prepend}` : ""}${rule.select(count)}`;
		this.logger.warn(`no plural rule found for: ${code}`);
		return this.getSuffix("dev", count, options);
	}
};
const deepFindWithDefaults = (data, defaultData, key, keySeparator = ".", ignoreJSONStructure = true) => {
	let path = getPathWithDefaults(data, defaultData, key);
	if (!path && ignoreJSONStructure && isString(key)) {
		path = deepFind(data, key, keySeparator);
		if (path === void 0) path = deepFind(defaultData, key, keySeparator);
	}
	return path;
};
const regexSafe = (val) => val.replace(/\$/g, "$$$$");
var Interpolator = class {
	constructor(options = {}) {
		this.logger = baseLogger.create("interpolator");
		this.options = options;
		this.format = options?.interpolation?.format || ((value) => value);
		this.init(options);
	}
	init(options = {}) {
		if (!options.interpolation) options.interpolation = { escapeValue: true };
		const { escape: escape$1, escapeValue, useRawValueToEscape, prefix, prefixEscaped, suffix, suffixEscaped, formatSeparator, unescapeSuffix, unescapePrefix, nestingPrefix, nestingPrefixEscaped, nestingSuffix, nestingSuffixEscaped, nestingOptionsSeparator, maxReplaces, alwaysFormat } = options.interpolation;
		this.escape = escape$1 !== void 0 ? escape$1 : escape;
		this.escapeValue = escapeValue !== void 0 ? escapeValue : true;
		this.useRawValueToEscape = useRawValueToEscape !== void 0 ? useRawValueToEscape : false;
		this.prefix = prefix ? regexEscape(prefix) : prefixEscaped || "{{";
		this.suffix = suffix ? regexEscape(suffix) : suffixEscaped || "}}";
		this.formatSeparator = formatSeparator || ",";
		this.unescapePrefix = unescapeSuffix ? "" : unescapePrefix || "-";
		this.unescapeSuffix = this.unescapePrefix ? "" : unescapeSuffix || "";
		this.nestingPrefix = nestingPrefix ? regexEscape(nestingPrefix) : nestingPrefixEscaped || regexEscape("$t(");
		this.nestingSuffix = nestingSuffix ? regexEscape(nestingSuffix) : nestingSuffixEscaped || regexEscape(")");
		this.nestingOptionsSeparator = nestingOptionsSeparator || ",";
		this.maxReplaces = maxReplaces || 1e3;
		this.alwaysFormat = alwaysFormat !== void 0 ? alwaysFormat : false;
		this.resetRegExp();
	}
	reset() {
		if (this.options) this.init(this.options);
	}
	resetRegExp() {
		const getOrResetRegExp = (existingRegExp, pattern) => {
			if (existingRegExp?.source === pattern) {
				existingRegExp.lastIndex = 0;
				return existingRegExp;
			}
			return new RegExp(pattern, "g");
		};
		this.regexp = getOrResetRegExp(this.regexp, `${this.prefix}(.+?)${this.suffix}`);
		this.regexpUnescape = getOrResetRegExp(this.regexpUnescape, `${this.prefix}${this.unescapePrefix}(.+?)${this.unescapeSuffix}${this.suffix}`);
		this.nestingRegexp = getOrResetRegExp(this.nestingRegexp, `${this.nestingPrefix}((?:[^()"']+|"[^"]*"|'[^']*'|\\((?:[^()]|"[^"]*"|'[^']*')*\\))*?)${this.nestingSuffix}`);
	}
	interpolate(str, data, lng, options) {
		let match;
		let value;
		let replaces;
		const defaultData = this.options && this.options.interpolation && this.options.interpolation.defaultVariables || {};
		const handleFormat = (key) => {
			if (key.indexOf(this.formatSeparator) < 0) {
				const path = deepFindWithDefaults(data, defaultData, key, this.options.keySeparator, this.options.ignoreJSONStructure);
				return this.alwaysFormat ? this.format(path, void 0, lng, {
					...options,
					...data,
					interpolationkey: key
				}) : path;
			}
			const p = key.split(this.formatSeparator);
			const k = p.shift().trim();
			const f = p.join(this.formatSeparator).trim();
			return this.format(deepFindWithDefaults(data, defaultData, k, this.options.keySeparator, this.options.ignoreJSONStructure), f, lng, {
				...options,
				...data,
				interpolationkey: k
			});
		};
		this.resetRegExp();
		const missingInterpolationHandler = options?.missingInterpolationHandler || this.options.missingInterpolationHandler;
		const skipOnVariables = options?.interpolation?.skipOnVariables !== void 0 ? options.interpolation.skipOnVariables : this.options.interpolation.skipOnVariables;
		[{
			regex: this.regexpUnescape,
			safeValue: (val) => regexSafe(val)
		}, {
			regex: this.regexp,
			safeValue: (val) => this.escapeValue ? regexSafe(this.escape(val)) : regexSafe(val)
		}].forEach((todo) => {
			replaces = 0;
			while (match = todo.regex.exec(str)) {
				const matchedVar = match[1].trim();
				value = handleFormat(matchedVar);
				if (value === void 0) {
					if (typeof missingInterpolationHandler === "function") {
						const temp = missingInterpolationHandler(str, match, options);
						value = isString(temp) ? temp : "";
					} else if (options && Object.prototype.hasOwnProperty.call(options, matchedVar)) value = "";
					else if (skipOnVariables) {
						value = match[0];
						continue;
					} else {
						this.logger.warn(`missed to pass in variable ${matchedVar} for interpolating ${str}`);
						value = "";
					}
				} else if (!isString(value) && !this.useRawValueToEscape) value = makeString(value);
				const safeValue = todo.safeValue(value);
				str = str.replace(match[0], safeValue);
				if (skipOnVariables) {
					todo.regex.lastIndex += value.length;
					todo.regex.lastIndex -= match[0].length;
				} else todo.regex.lastIndex = 0;
				replaces++;
				if (replaces >= this.maxReplaces) break;
			}
		});
		return str;
	}
	nest(str, fc, options = {}) {
		let match;
		let value;
		let clonedOptions;
		const handleHasOptions = (key, inheritedOptions) => {
			const sep = this.nestingOptionsSeparator;
			if (key.indexOf(sep) < 0) return key;
			const c = key.split(new RegExp(`${sep}[ ]*{`));
			let optionsString = `{${c[1]}`;
			key = c[0];
			optionsString = this.interpolate(optionsString, clonedOptions);
			const matchedSingleQuotes = optionsString.match(/'/g);
			const matchedDoubleQuotes = optionsString.match(/"/g);
			if ((matchedSingleQuotes?.length ?? 0) % 2 === 0 && !matchedDoubleQuotes || matchedDoubleQuotes.length % 2 !== 0) optionsString = optionsString.replace(/'/g, "\"");
			try {
				clonedOptions = JSON.parse(optionsString);
				if (inheritedOptions) clonedOptions = {
					...inheritedOptions,
					...clonedOptions
				};
			} catch (e) {
				this.logger.warn(`failed parsing options string in nesting for key ${key}`, e);
				return `${key}${sep}${optionsString}`;
			}
			if (clonedOptions.defaultValue && clonedOptions.defaultValue.indexOf(this.prefix) > -1) delete clonedOptions.defaultValue;
			return key;
		};
		while (match = this.nestingRegexp.exec(str)) {
			let formatters = [];
			clonedOptions = { ...options };
			clonedOptions = clonedOptions.replace && !isString(clonedOptions.replace) ? clonedOptions.replace : clonedOptions;
			clonedOptions.applyPostProcessor = false;
			delete clonedOptions.defaultValue;
			const keyEndIndex = /{.*}/.test(match[1]) ? match[1].lastIndexOf("}") + 1 : match[1].indexOf(this.formatSeparator);
			if (keyEndIndex !== -1) {
				formatters = match[1].slice(keyEndIndex).split(this.formatSeparator).map((elem) => elem.trim()).filter(Boolean);
				match[1] = match[1].slice(0, keyEndIndex);
			}
			value = fc(handleHasOptions.call(this, match[1].trim(), clonedOptions), clonedOptions);
			if (value && match[0] === str && !isString(value)) return value;
			if (!isString(value)) value = makeString(value);
			if (!value) {
				this.logger.warn(`missed to resolve ${match[1]} for nesting ${str}`);
				value = "";
			}
			if (formatters.length) value = formatters.reduce((v, f) => this.format(v, f, options.lng, {
				...options,
				interpolationkey: match[1].trim()
			}), value.trim());
			str = str.replace(match[0], value);
			this.regexp.lastIndex = 0;
		}
		return str;
	}
};
const parseFormatStr = (formatStr) => {
	let formatName = formatStr.toLowerCase().trim();
	const formatOptions = {};
	if (formatStr.indexOf("(") > -1) {
		const p = formatStr.split("(");
		formatName = p[0].toLowerCase().trim();
		const optStr = p[1].substring(0, p[1].length - 1);
		if (formatName === "currency" && optStr.indexOf(":") < 0) {
			if (!formatOptions.currency) formatOptions.currency = optStr.trim();
		} else if (formatName === "relativetime" && optStr.indexOf(":") < 0) {
			if (!formatOptions.range) formatOptions.range = optStr.trim();
		} else optStr.split(";").forEach((opt) => {
			if (opt) {
				const [key, ...rest] = opt.split(":");
				const val = rest.join(":").trim().replace(/^'+|'+$/g, "");
				const trimmedKey = key.trim();
				if (!formatOptions[trimmedKey]) formatOptions[trimmedKey] = val;
				if (val === "false") formatOptions[trimmedKey] = false;
				if (val === "true") formatOptions[trimmedKey] = true;
				if (!isNaN(val)) formatOptions[trimmedKey] = parseInt(val, 10);
			}
		});
	}
	return {
		formatName,
		formatOptions
	};
};
const createCachedFormatter = (fn) => {
	const cache = {};
	return (v, l, o) => {
		let optForCache = o;
		if (o && o.interpolationkey && o.formatParams && o.formatParams[o.interpolationkey] && o[o.interpolationkey]) optForCache = {
			...optForCache,
			[o.interpolationkey]: void 0
		};
		const key = l + JSON.stringify(optForCache);
		let frm = cache[key];
		if (!frm) {
			frm = fn(getCleanedCode(l), o);
			cache[key] = frm;
		}
		return frm(v);
	};
};
const createNonCachedFormatter = (fn) => (v, l, o) => fn(getCleanedCode(l), o)(v);
var Formatter = class {
	constructor(options = {}) {
		this.logger = baseLogger.create("formatter");
		this.options = options;
		this.init(options);
	}
	init(services, options = { interpolation: {} }) {
		this.formatSeparator = options.interpolation.formatSeparator || ",";
		const cf = options.cacheInBuiltFormats ? createCachedFormatter : createNonCachedFormatter;
		this.formats = {
			number: cf((lng, opt) => {
				const formatter = new Intl.NumberFormat(lng, { ...opt });
				return (val) => formatter.format(val);
			}),
			currency: cf((lng, opt) => {
				const formatter = new Intl.NumberFormat(lng, {
					...opt,
					style: "currency"
				});
				return (val) => formatter.format(val);
			}),
			datetime: cf((lng, opt) => {
				const formatter = new Intl.DateTimeFormat(lng, { ...opt });
				return (val) => formatter.format(val);
			}),
			relativetime: cf((lng, opt) => {
				const formatter = new Intl.RelativeTimeFormat(lng, { ...opt });
				return (val) => formatter.format(val, opt.range || "day");
			}),
			list: cf((lng, opt) => {
				const formatter = new Intl.ListFormat(lng, { ...opt });
				return (val) => formatter.format(val);
			})
		};
	}
	add(name, fc) {
		this.formats[name.toLowerCase().trim()] = fc;
	}
	addCached(name, fc) {
		this.formats[name.toLowerCase().trim()] = createCachedFormatter(fc);
	}
	format(value, format, lng, options = {}) {
		const formats = format.split(this.formatSeparator);
		if (formats.length > 1 && formats[0].indexOf("(") > 1 && formats[0].indexOf(")") < 0 && formats.find((f) => f.indexOf(")") > -1)) {
			const lastIndex = formats.findIndex((f) => f.indexOf(")") > -1);
			formats[0] = [formats[0], ...formats.splice(1, lastIndex)].join(this.formatSeparator);
		}
		return formats.reduce((mem, f) => {
			const { formatName, formatOptions } = parseFormatStr(f);
			if (this.formats[formatName]) {
				let formatted = mem;
				try {
					const valOptions = options?.formatParams?.[options.interpolationkey] || {};
					const l = valOptions.locale || valOptions.lng || options.locale || options.lng || lng;
					formatted = this.formats[formatName](mem, l, {
						...formatOptions,
						...options,
						...valOptions
					});
				} catch (error) {
					this.logger.warn(error);
				}
				return formatted;
			} else this.logger.warn(`there was no format function for ${formatName}`);
			return mem;
		}, value);
	}
};
const removePending = (q, name) => {
	if (q.pending[name] !== void 0) {
		delete q.pending[name];
		q.pendingCount--;
	}
};
var Connector = class extends EventEmitter {
	constructor(backend, store, services, options = {}) {
		super();
		this.backend = backend;
		this.store = store;
		this.services = services;
		this.languageUtils = services.languageUtils;
		this.options = options;
		this.logger = baseLogger.create("backendConnector");
		this.waitingReads = [];
		this.maxParallelReads = options.maxParallelReads || 10;
		this.readingCalls = 0;
		this.maxRetries = options.maxRetries >= 0 ? options.maxRetries : 5;
		this.retryTimeout = options.retryTimeout >= 1 ? options.retryTimeout : 350;
		this.state = {};
		this.queue = [];
		this.backend?.init?.(services, options.backend, options);
	}
	queueLoad(languages, namespaces, options, callback) {
		const toLoad = {};
		const pending = {};
		const toLoadLanguages = {};
		const toLoadNamespaces = {};
		languages.forEach((lng) => {
			let hasAllNamespaces = true;
			namespaces.forEach((ns) => {
				const name = `${lng}|${ns}`;
				if (!options.reload && this.store.hasResourceBundle(lng, ns)) this.state[name] = 2;
				else if (this.state[name] < 0);
				else if (this.state[name] === 1) {
					if (pending[name] === void 0) pending[name] = true;
				} else {
					this.state[name] = 1;
					hasAllNamespaces = false;
					if (pending[name] === void 0) pending[name] = true;
					if (toLoad[name] === void 0) toLoad[name] = true;
					if (toLoadNamespaces[ns] === void 0) toLoadNamespaces[ns] = true;
				}
			});
			if (!hasAllNamespaces) toLoadLanguages[lng] = true;
		});
		if (Object.keys(toLoad).length || Object.keys(pending).length) this.queue.push({
			pending,
			pendingCount: Object.keys(pending).length,
			loaded: {},
			errors: [],
			callback
		});
		return {
			toLoad: Object.keys(toLoad),
			pending: Object.keys(pending),
			toLoadLanguages: Object.keys(toLoadLanguages),
			toLoadNamespaces: Object.keys(toLoadNamespaces)
		};
	}
	loaded(name, err, data) {
		const s = name.split("|");
		const lng = s[0];
		const ns = s[1];
		if (err) this.emit("failedLoading", lng, ns, err);
		if (!err && data) this.store.addResourceBundle(lng, ns, data, void 0, void 0, { skipCopy: true });
		this.state[name] = err ? -1 : 2;
		if (err && data) this.state[name] = 0;
		const loaded = {};
		this.queue.forEach((q) => {
			pushPath(q.loaded, [lng], ns);
			removePending(q, name);
			if (err) q.errors.push(err);
			if (q.pendingCount === 0 && !q.done) {
				Object.keys(q.loaded).forEach((l) => {
					if (!loaded[l]) loaded[l] = {};
					const loadedKeys = q.loaded[l];
					if (loadedKeys.length) loadedKeys.forEach((n) => {
						if (loaded[l][n] === void 0) loaded[l][n] = true;
					});
				});
				q.done = true;
				if (q.errors.length) q.callback(q.errors);
				else q.callback();
			}
		});
		this.emit("loaded", loaded);
		this.queue = this.queue.filter((q) => !q.done);
	}
	read(lng, ns, fcName, tried = 0, wait = this.retryTimeout, callback) {
		if (!lng.length) return callback(null, {});
		if (this.readingCalls >= this.maxParallelReads) {
			this.waitingReads.push({
				lng,
				ns,
				fcName,
				tried,
				wait,
				callback
			});
			return;
		}
		this.readingCalls++;
		const resolver = (err, data) => {
			this.readingCalls--;
			if (this.waitingReads.length > 0) {
				const next = this.waitingReads.shift();
				this.read(next.lng, next.ns, next.fcName, next.tried, next.wait, next.callback);
			}
			if (err && data && tried < this.maxRetries) {
				setTimeout(() => {
					this.read.call(this, lng, ns, fcName, tried + 1, wait * 2, callback);
				}, wait);
				return;
			}
			callback(err, data);
		};
		const fc = this.backend[fcName].bind(this.backend);
		if (fc.length === 2) {
			try {
				const r = fc(lng, ns);
				if (r && typeof r.then === "function") r.then((data) => resolver(null, data)).catch(resolver);
				else resolver(null, r);
			} catch (err) {
				resolver(err);
			}
			return;
		}
		return fc(lng, ns, resolver);
	}
	prepareLoading(languages, namespaces, options = {}, callback) {
		if (!this.backend) {
			this.logger.warn("No backend was added via i18next.use. Will not load resources.");
			return callback && callback();
		}
		if (isString(languages)) languages = this.languageUtils.toResolveHierarchy(languages);
		if (isString(namespaces)) namespaces = [namespaces];
		const toLoad = this.queueLoad(languages, namespaces, options, callback);
		if (!toLoad.toLoad.length) {
			if (!toLoad.pending.length) callback();
			return null;
		}
		toLoad.toLoad.forEach((name) => {
			this.loadOne(name);
		});
	}
	load(languages, namespaces, callback) {
		this.prepareLoading(languages, namespaces, {}, callback);
	}
	reload(languages, namespaces, callback) {
		this.prepareLoading(languages, namespaces, { reload: true }, callback);
	}
	loadOne(name, prefix = "") {
		const s = name.split("|");
		const lng = s[0];
		const ns = s[1];
		this.read(lng, ns, "read", void 0, void 0, (err, data) => {
			if (err) this.logger.warn(`${prefix}loading namespace ${ns} for language ${lng} failed`, err);
			if (!err && data) this.logger.log(`${prefix}loaded namespace ${ns} for language ${lng}`, data);
			this.loaded(name, err, data);
		});
	}
	saveMissing(languages, namespace, key, fallbackValue, isUpdate, options = {}, clb = () => {}) {
		if (this.services?.utils?.hasLoadedNamespace && !this.services?.utils?.hasLoadedNamespace(namespace)) {
			this.logger.warn(`did not save key "${key}" as the namespace "${namespace}" was not yet loaded`, "This means something IS WRONG in your setup. You access the t function before i18next.init / i18next.loadNamespace / i18next.changeLanguage was done. Wait for the callback or Promise to resolve before accessing it!!!");
			return;
		}
		if (key === void 0 || key === null || key === "") return;
		if (this.backend?.create) {
			const opts = {
				...options,
				isUpdate
			};
			const fc = this.backend.create.bind(this.backend);
			if (fc.length < 6) try {
				let r;
				if (fc.length === 5) r = fc(languages, namespace, key, fallbackValue, opts);
				else r = fc(languages, namespace, key, fallbackValue);
				if (r && typeof r.then === "function") r.then((data) => clb(null, data)).catch(clb);
				else clb(null, r);
			} catch (err) {
				clb(err);
			}
			else fc(languages, namespace, key, fallbackValue, clb, opts);
		}
		if (!languages || !languages[0]) return;
		this.store.addResource(languages[0], namespace, key, fallbackValue);
	}
};
const get = () => ({
	debug: false,
	initAsync: true,
	ns: ["translation"],
	defaultNS: ["translation"],
	fallbackLng: ["dev"],
	fallbackNS: false,
	supportedLngs: false,
	nonExplicitSupportedLngs: false,
	load: "all",
	preload: false,
	simplifyPluralSuffix: true,
	keySeparator: ".",
	nsSeparator: ":",
	pluralSeparator: "_",
	contextSeparator: "_",
	partialBundledLanguages: false,
	saveMissing: false,
	updateMissing: false,
	saveMissingTo: "fallback",
	saveMissingPlurals: true,
	missingKeyHandler: false,
	missingInterpolationHandler: false,
	postProcess: false,
	postProcessPassResolved: false,
	returnNull: false,
	returnEmptyString: true,
	returnObjects: false,
	joinArrays: false,
	returnedObjectHandler: false,
	parseMissingKeyHandler: false,
	appendNamespaceToMissingKey: false,
	appendNamespaceToCIMode: false,
	overloadTranslationOptionHandler: (args) => {
		let ret = {};
		if (typeof args[1] === "object") ret = args[1];
		if (isString(args[1])) ret.defaultValue = args[1];
		if (isString(args[2])) ret.tDescription = args[2];
		if (typeof args[2] === "object" || typeof args[3] === "object") {
			const options = args[3] || args[2];
			Object.keys(options).forEach((key) => {
				ret[key] = options[key];
			});
		}
		return ret;
	},
	interpolation: {
		escapeValue: true,
		format: (value) => value,
		prefix: "{{",
		suffix: "}}",
		formatSeparator: ",",
		unescapePrefix: "-",
		nestingPrefix: "$t(",
		nestingSuffix: ")",
		nestingOptionsSeparator: ",",
		maxReplaces: 1e3,
		skipOnVariables: true
	},
	cacheInBuiltFormats: true
});
const transformOptions = (options) => {
	if (isString(options.ns)) options.ns = [options.ns];
	if (isString(options.fallbackLng)) options.fallbackLng = [options.fallbackLng];
	if (isString(options.fallbackNS)) options.fallbackNS = [options.fallbackNS];
	if (options.supportedLngs?.indexOf?.("cimode") < 0) options.supportedLngs = options.supportedLngs.concat(["cimode"]);
	if (typeof options.initImmediate === "boolean") options.initAsync = options.initImmediate;
	return options;
};
const noop$1 = () => {};
const bindMemberFunctions = (inst) => {
	Object.getOwnPropertyNames(Object.getPrototypeOf(inst)).forEach((mem) => {
		if (typeof inst[mem] === "function") inst[mem] = inst[mem].bind(inst);
	});
};
var I18n = class I18n extends EventEmitter {
	constructor(options = {}, callback) {
		super();
		this.options = transformOptions(options);
		this.services = {};
		this.logger = baseLogger;
		this.modules = { external: [] };
		bindMemberFunctions(this);
		if (callback && !this.isInitialized && !options.isClone) {
			if (!this.options.initAsync) {
				this.init(options, callback);
				return this;
			}
			setTimeout(() => {
				this.init(options, callback);
			}, 0);
		}
	}
	init(options = {}, callback) {
		this.isInitializing = true;
		if (typeof options === "function") {
			callback = options;
			options = {};
		}
		if (options.defaultNS == null && options.ns) {
			if (isString(options.ns)) options.defaultNS = options.ns;
			else if (options.ns.indexOf("translation") < 0) options.defaultNS = options.ns[0];
		}
		const defOpts = get();
		this.options = {
			...defOpts,
			...this.options,
			...transformOptions(options)
		};
		this.options.interpolation = {
			...defOpts.interpolation,
			...this.options.interpolation
		};
		if (options.keySeparator !== void 0) this.options.userDefinedKeySeparator = options.keySeparator;
		if (options.nsSeparator !== void 0) this.options.userDefinedNsSeparator = options.nsSeparator;
		if (typeof this.options.overloadTranslationOptionHandler !== "function") this.options.overloadTranslationOptionHandler = defOpts.overloadTranslationOptionHandler;
		if (this.options.debug === true) {
			if (typeof console !== "undefined") console.warn("i18next is maintained with support from locize.com — consider powering your project with managed localization (AI, CDN, integrations): https://locize.com");
		}
		const createClassOnDemand = (ClassOrObject) => {
			if (!ClassOrObject) return null;
			if (typeof ClassOrObject === "function") return new ClassOrObject();
			return ClassOrObject;
		};
		if (!this.options.isClone) {
			if (this.modules.logger) baseLogger.init(createClassOnDemand(this.modules.logger), this.options);
			else baseLogger.init(null, this.options);
			let formatter;
			if (this.modules.formatter) formatter = this.modules.formatter;
			else formatter = Formatter;
			const lu = new LanguageUtil(this.options);
			this.store = new ResourceStore(this.options.resources, this.options);
			const s = this.services;
			s.logger = baseLogger;
			s.resourceStore = this.store;
			s.languageUtils = lu;
			s.pluralResolver = new PluralResolver(lu, {
				prepend: this.options.pluralSeparator,
				simplifyPluralSuffix: this.options.simplifyPluralSuffix
			});
			if (this.options.interpolation.format && this.options.interpolation.format !== defOpts.interpolation.format) this.logger.deprecate(`init: you are still using the legacy format function, please use the new approach: https://www.i18next.com/translation-function/formatting`);
			if (formatter && (!this.options.interpolation.format || this.options.interpolation.format === defOpts.interpolation.format)) {
				s.formatter = createClassOnDemand(formatter);
				if (s.formatter.init) s.formatter.init(s, this.options);
				this.options.interpolation.format = s.formatter.format.bind(s.formatter);
			}
			s.interpolator = new Interpolator(this.options);
			s.utils = { hasLoadedNamespace: this.hasLoadedNamespace.bind(this) };
			s.backendConnector = new Connector(createClassOnDemand(this.modules.backend), s.resourceStore, s, this.options);
			s.backendConnector.on("*", (event, ...args) => {
				this.emit(event, ...args);
			});
			if (this.modules.languageDetector) {
				s.languageDetector = createClassOnDemand(this.modules.languageDetector);
				if (s.languageDetector.init) s.languageDetector.init(s, this.options.detection, this.options);
			}
			if (this.modules.i18nFormat) {
				s.i18nFormat = createClassOnDemand(this.modules.i18nFormat);
				if (s.i18nFormat.init) s.i18nFormat.init(this);
			}
			this.translator = new Translator(this.services, this.options);
			this.translator.on("*", (event, ...args) => {
				this.emit(event, ...args);
			});
			this.modules.external.forEach((m) => {
				if (m.init) m.init(this);
			});
		}
		this.format = this.options.interpolation.format;
		if (!callback) callback = noop$1;
		if (this.options.fallbackLng && !this.services.languageDetector && !this.options.lng) {
			const codes = this.services.languageUtils.getFallbackCodes(this.options.fallbackLng);
			if (codes.length > 0 && codes[0] !== "dev") this.options.lng = codes[0];
		}
		if (!this.services.languageDetector && !this.options.lng) this.logger.warn("init: no languageDetector is used and no lng is defined");
		[
			"getResource",
			"hasResourceBundle",
			"getResourceBundle",
			"getDataByLanguage"
		].forEach((fcName) => {
			this[fcName] = (...args) => this.store[fcName](...args);
		});
		[
			"addResource",
			"addResources",
			"addResourceBundle",
			"removeResourceBundle"
		].forEach((fcName) => {
			this[fcName] = (...args) => {
				this.store[fcName](...args);
				return this;
			};
		});
		const deferred = defer$1();
		const load = () => {
			const finish = (err, t) => {
				this.isInitializing = false;
				if (this.isInitialized && !this.initializedStoreOnce) this.logger.warn("init: i18next is already initialized. You should call init just once!");
				this.isInitialized = true;
				if (!this.options.isClone) this.logger.log("initialized", this.options);
				this.emit("initialized", this.options);
				deferred.resolve(t);
				callback(err, t);
			};
			if (this.languages && !this.isInitialized) return finish(null, this.t.bind(this));
			this.changeLanguage(this.options.lng, finish);
		};
		if (this.options.resources || !this.options.initAsync) load();
		else setTimeout(load, 0);
		return deferred;
	}
	loadResources(language, callback = noop$1) {
		let usedCallback = callback;
		const usedLng = isString(language) ? language : this.language;
		if (typeof language === "function") usedCallback = language;
		if (!this.options.resources || this.options.partialBundledLanguages) {
			if (usedLng?.toLowerCase() === "cimode" && (!this.options.preload || this.options.preload.length === 0)) return usedCallback();
			const toLoad = [];
			const append = (lng) => {
				if (!lng) return;
				if (lng === "cimode") return;
				this.services.languageUtils.toResolveHierarchy(lng).forEach((l) => {
					if (l === "cimode") return;
					if (toLoad.indexOf(l) < 0) toLoad.push(l);
				});
			};
			if (!usedLng) this.services.languageUtils.getFallbackCodes(this.options.fallbackLng).forEach((l) => append(l));
			else append(usedLng);
			this.options.preload?.forEach?.((l) => append(l));
			this.services.backendConnector.load(toLoad, this.options.ns, (e) => {
				if (!e && !this.resolvedLanguage && this.language) this.setResolvedLanguage(this.language);
				usedCallback(e);
			});
		} else usedCallback(null);
	}
	reloadResources(lngs, ns, callback) {
		const deferred = defer$1();
		if (typeof lngs === "function") {
			callback = lngs;
			lngs = void 0;
		}
		if (typeof ns === "function") {
			callback = ns;
			ns = void 0;
		}
		if (!lngs) lngs = this.languages;
		if (!ns) ns = this.options.ns;
		if (!callback) callback = noop$1;
		this.services.backendConnector.reload(lngs, ns, (err) => {
			deferred.resolve();
			callback(err);
		});
		return deferred;
	}
	use(module) {
		if (!module) throw new Error("You are passing an undefined module! Please check the object you are passing to i18next.use()");
		if (!module.type) throw new Error("You are passing a wrong module! Please check the object you are passing to i18next.use()");
		if (module.type === "backend") this.modules.backend = module;
		if (module.type === "logger" || module.log && module.warn && module.error) this.modules.logger = module;
		if (module.type === "languageDetector") this.modules.languageDetector = module;
		if (module.type === "i18nFormat") this.modules.i18nFormat = module;
		if (module.type === "postProcessor") postProcessor.addPostProcessor(module);
		if (module.type === "formatter") this.modules.formatter = module;
		if (module.type === "3rdParty") this.modules.external.push(module);
		return this;
	}
	setResolvedLanguage(l) {
		if (!l || !this.languages) return;
		if (["cimode", "dev"].indexOf(l) > -1) return;
		for (let li = 0; li < this.languages.length; li++) {
			const lngInLngs = this.languages[li];
			if (["cimode", "dev"].indexOf(lngInLngs) > -1) continue;
			if (this.store.hasLanguageSomeTranslations(lngInLngs)) {
				this.resolvedLanguage = lngInLngs;
				break;
			}
		}
		if (!this.resolvedLanguage && this.languages.indexOf(l) < 0 && this.store.hasLanguageSomeTranslations(l)) {
			this.resolvedLanguage = l;
			this.languages.unshift(l);
		}
	}
	changeLanguage(lng, callback) {
		this.isLanguageChangingTo = lng;
		const deferred = defer$1();
		this.emit("languageChanging", lng);
		const setLngProps = (l) => {
			this.language = l;
			this.languages = this.services.languageUtils.toResolveHierarchy(l);
			this.resolvedLanguage = void 0;
			this.setResolvedLanguage(l);
		};
		const done = (err, l) => {
			if (l) {
				if (this.isLanguageChangingTo === lng) {
					setLngProps(l);
					this.translator.changeLanguage(l);
					this.isLanguageChangingTo = void 0;
					this.emit("languageChanged", l);
					this.logger.log("languageChanged", l);
				}
			} else this.isLanguageChangingTo = void 0;
			deferred.resolve((...args) => this.t(...args));
			if (callback) callback(err, (...args) => this.t(...args));
		};
		const setLng = (lngs) => {
			if (!lng && !lngs && this.services.languageDetector) lngs = [];
			const fl = isString(lngs) ? lngs : lngs && lngs[0];
			const l = this.store.hasLanguageSomeTranslations(fl) ? fl : this.services.languageUtils.getBestMatchFromCodes(isString(lngs) ? [lngs] : lngs);
			if (l) {
				if (!this.language) setLngProps(l);
				if (!this.translator.language) this.translator.changeLanguage(l);
				this.services.languageDetector?.cacheUserLanguage?.(l);
			}
			this.loadResources(l, (err) => {
				done(err, l);
			});
		};
		if (!lng && this.services.languageDetector && !this.services.languageDetector.async) setLng(this.services.languageDetector.detect());
		else if (!lng && this.services.languageDetector && this.services.languageDetector.async) {
			if (this.services.languageDetector.detect.length === 0) this.services.languageDetector.detect().then(setLng);
			else this.services.languageDetector.detect(setLng);
		} else setLng(lng);
		return deferred;
	}
	getFixedT(lng, ns, keyPrefix) {
		const fixedT = (key, opts, ...rest) => {
			let o;
			if (typeof opts !== "object") o = this.options.overloadTranslationOptionHandler([key, opts].concat(rest));
			else o = { ...opts };
			o.lng = o.lng || fixedT.lng;
			o.lngs = o.lngs || fixedT.lngs;
			o.ns = o.ns || fixedT.ns;
			if (o.keyPrefix !== "") o.keyPrefix = o.keyPrefix || keyPrefix || fixedT.keyPrefix;
			const keySeparator = this.options.keySeparator || ".";
			let resultKey;
			if (o.keyPrefix && Array.isArray(key)) resultKey = key.map((k) => {
				if (typeof k === "function") k = keysFromSelector(k, {
					...this.options,
					...opts
				});
				return `${o.keyPrefix}${keySeparator}${k}`;
			});
			else {
				if (typeof key === "function") key = keysFromSelector(key, {
					...this.options,
					...opts
				});
				resultKey = o.keyPrefix ? `${o.keyPrefix}${keySeparator}${key}` : key;
			}
			return this.t(resultKey, o);
		};
		if (isString(lng)) fixedT.lng = lng;
		else fixedT.lngs = lng;
		fixedT.ns = ns;
		fixedT.keyPrefix = keyPrefix;
		return fixedT;
	}
	t(...args) {
		return this.translator?.translate(...args);
	}
	exists(...args) {
		return this.translator?.exists(...args);
	}
	setDefaultNamespace(ns) {
		this.options.defaultNS = ns;
	}
	hasLoadedNamespace(ns, options = {}) {
		if (!this.isInitialized) {
			this.logger.warn("hasLoadedNamespace: i18next was not initialized", this.languages);
			return false;
		}
		if (!this.languages || !this.languages.length) {
			this.logger.warn("hasLoadedNamespace: i18n.languages were undefined or empty", this.languages);
			return false;
		}
		const lng = options.lng || this.resolvedLanguage || this.languages[0];
		const fallbackLng = this.options ? this.options.fallbackLng : false;
		const lastLng = this.languages[this.languages.length - 1];
		if (lng.toLowerCase() === "cimode") return true;
		const loadNotPending = (l, n) => {
			const loadState = this.services.backendConnector.state[`${l}|${n}`];
			return loadState === -1 || loadState === 0 || loadState === 2;
		};
		if (options.precheck) {
			const preResult = options.precheck(this, loadNotPending);
			if (preResult !== void 0) return preResult;
		}
		if (this.hasResourceBundle(lng, ns)) return true;
		if (!this.services.backendConnector.backend || this.options.resources && !this.options.partialBundledLanguages) return true;
		if (loadNotPending(lng, ns) && (!fallbackLng || loadNotPending(lastLng, ns))) return true;
		return false;
	}
	loadNamespaces(ns, callback) {
		const deferred = defer$1();
		if (!this.options.ns) {
			if (callback) callback();
			return Promise.resolve();
		}
		if (isString(ns)) ns = [ns];
		ns.forEach((n) => {
			if (this.options.ns.indexOf(n) < 0) this.options.ns.push(n);
		});
		this.loadResources((err) => {
			deferred.resolve();
			if (callback) callback(err);
		});
		return deferred;
	}
	loadLanguages(lngs, callback) {
		const deferred = defer$1();
		if (isString(lngs)) lngs = [lngs];
		const preloaded = this.options.preload || [];
		const newLngs = lngs.filter((lng) => preloaded.indexOf(lng) < 0 && this.services.languageUtils.isSupportedCode(lng));
		if (!newLngs.length) {
			if (callback) callback();
			return Promise.resolve();
		}
		this.options.preload = preloaded.concat(newLngs);
		this.loadResources((err) => {
			deferred.resolve();
			if (callback) callback(err);
		});
		return deferred;
	}
	dir(lng) {
		if (!lng) lng = this.resolvedLanguage || (this.languages?.length > 0 ? this.languages[0] : this.language);
		if (!lng) return "rtl";
		try {
			const l = new Intl.Locale(lng);
			if (l && l.getTextInfo) {
				const ti = l.getTextInfo();
				if (ti && ti.direction) return ti.direction;
			}
		} catch (e) {}
		const rtlLngs = [
			"ar",
			"shu",
			"sqr",
			"ssh",
			"xaa",
			"yhd",
			"yud",
			"aao",
			"abh",
			"abv",
			"acm",
			"acq",
			"acw",
			"acx",
			"acy",
			"adf",
			"ads",
			"aeb",
			"aec",
			"afb",
			"ajp",
			"apc",
			"apd",
			"arb",
			"arq",
			"ars",
			"ary",
			"arz",
			"auz",
			"avl",
			"ayh",
			"ayl",
			"ayn",
			"ayp",
			"bbz",
			"pga",
			"he",
			"iw",
			"ps",
			"pbt",
			"pbu",
			"pst",
			"prp",
			"prd",
			"ug",
			"ur",
			"ydd",
			"yds",
			"yih",
			"ji",
			"yi",
			"hbo",
			"men",
			"xmn",
			"fa",
			"jpr",
			"peo",
			"pes",
			"prs",
			"dv",
			"sam",
			"ckb"
		];
		const languageUtils = this.services?.languageUtils || new LanguageUtil(get());
		if (lng.toLowerCase().indexOf("-latn") > 1) return "ltr";
		return rtlLngs.indexOf(languageUtils.getLanguagePartFromCode(lng)) > -1 || lng.toLowerCase().indexOf("-arab") > 1 ? "rtl" : "ltr";
	}
	static createInstance(options = {}, callback) {
		const instance = new I18n(options, callback);
		instance.createInstance = I18n.createInstance;
		return instance;
	}
	cloneInstance(options = {}, callback = noop$1) {
		const forkResourceStore = options.forkResourceStore;
		if (forkResourceStore) delete options.forkResourceStore;
		const mergedOptions = {
			...this.options,
			...options,
			isClone: true
		};
		const clone = new I18n(mergedOptions);
		if (options.debug !== void 0 || options.prefix !== void 0) clone.logger = clone.logger.clone(options);
		[
			"store",
			"services",
			"language"
		].forEach((m) => {
			clone[m] = this[m];
		});
		clone.services = { ...this.services };
		clone.services.utils = { hasLoadedNamespace: clone.hasLoadedNamespace.bind(clone) };
		if (forkResourceStore) {
			const clonedData = Object.keys(this.store.data).reduce((prev, l) => {
				prev[l] = { ...this.store.data[l] };
				prev[l] = Object.keys(prev[l]).reduce((acc, n) => {
					acc[n] = { ...prev[l][n] };
					return acc;
				}, prev[l]);
				return prev;
			}, {});
			clone.store = new ResourceStore(clonedData, mergedOptions);
			clone.services.resourceStore = clone.store;
		}
		if (options.interpolation) {
			const mergedInterpolation = {
				...get().interpolation,
				...this.options.interpolation,
				...options.interpolation
			};
			const mergedForInterpolator = {
				...mergedOptions,
				interpolation: mergedInterpolation
			};
			clone.services.interpolator = new Interpolator(mergedForInterpolator);
		}
		clone.translator = new Translator(clone.services, mergedOptions);
		clone.translator.on("*", (event, ...args) => {
			clone.emit(event, ...args);
		});
		clone.init(mergedOptions, callback);
		clone.translator.options = mergedOptions;
		clone.translator.backendConnector.services.utils = { hasLoadedNamespace: clone.hasLoadedNamespace.bind(clone) };
		return clone;
	}
	toJSON() {
		return {
			options: this.options,
			store: this.store,
			language: this.language,
			languages: this.languages,
			resolvedLanguage: this.resolvedLanguage
		};
	}
};
const instance = I18n.createInstance();
const createInstance = instance.createInstance;
const dir = instance.dir;
const init = instance.init;
const loadResources = instance.loadResources;
const reloadResources = instance.reloadResources;
const use = instance.use;
const changeLanguage = instance.changeLanguage;
const getFixedT = instance.getFixedT;
const t$3 = instance.t;
const exists = instance.exists;
const setDefaultNamespace = instance.setDefaultNamespace;
const hasLoadedNamespace = instance.hasLoadedNamespace;
const loadNamespaces = instance.loadNamespaces;
const loadLanguages = instance.loadLanguages;

//#endregion
//#region node_modules/.pnpm/xshell@1.4.38_supports-color@7.2.0/node_modules/xshell/i18n/dict.js
var Dict$1 = class {
	_dict;
	constructor(_dict = {}) {
		this._dict = _dict;
	}
	get(key, language) {
		if (!key) return "";
		const item = this._dict[key];
		if (language) return item ? item[language] || "" : "";
		return item;
	}
	to_resources() {
		return Object.entries(this._dict).reduce((acc, [key, item]) => {
			Object.entries(item).forEach(([language, translation]) => {
				if (!translation || !acc[language]) return;
				acc[language].translation[key] = translation;
			});
			return acc;
		}, {
			zh: { translation: {} },
			en: { translation: {} },
			ja: { translation: {} },
			ko: { translation: {} }
		});
	}
};

//#endregion
//#region node_modules/.pnpm/xshell@1.4.38_supports-color@7.2.0/node_modules/xshell/i18n/index.js
var I18N = class I18N {
	static LANGUAGE_REGEXP = /^(zh|en|ja|ko)$/;
	language;
	t;
	r;
	i18next;
	constructor(_dict, language) {
		const is_browser = typeof window !== "undefined" && typeof location !== "undefined";
		const dict = new Dict$1(_dict);
		if (!language && is_browser) language = new URLSearchParams(location.search).get("language") || window.language;
		if (!language) language = Intl.DateTimeFormat().resolvedOptions().locale.slice(0, 2);
		if (!I18N.LANGUAGE_REGEXP.test(language)) {
			if (language) console.error("invalid language:", language);
			language = "zh";
		}
		this.language = language;
		this.t = (text, options) => {
			options = options || {};
			const language = options.language || this.language;
			return this.i18next.t(text, {
				...options,
				lng: language,
				defaultValue: text
			});
		};
		this.r = (field, language = this.language) => field ? field[language] || field.zh || field.en || field || "" : field || "";
		this.i18next = instance.createInstance();
		this.i18next.init({
			lng: this.language,
			debug: false,
			fallbackLng: {
				en: ["zh"],
				ja: ["en", "zh"],
				ko: ["en", "zh"]
			},
			keySeparator: false,
			nsSeparator: false,
			resources: dict.to_resources(),
			interpolation: { escapeValue: false },
			react: { transKeepBasicHtmlNodesFor: [] }
		});
		if (typeof window !== "undefined" && window && !("i18n" in window)) window.i18n = this;
	}
	init(dict) {
		const resources = new Dict$1(dict).to_resources();
		for (const language in resources) this.i18next.addResources(language, "translation", resources[language].translation);
	}
	toJSON() {
		return { language: this.language };
	}
};

//#endregion
//#region node_modules/.pnpm/xshell@1.4.38_supports-color@7.2.0/node_modules/xshell/i18n/dict.json
var dict_default$2 = {
	存在: { "en": "exists" },
	不存在: { "en": "not exists" },
	打开文件: { "en": "open file" },
	"fp 必须是绝对路径，或传入 dir 参数: ": { "en": "fp must be absolute path, or pass in 'dir' parameters:" },
	读取: { "en": "read" },
	" 的编码可能是 ": { "en": "'s encoding might be " },
	写入: { "en": "write" },
	追加: { "en": "append" },
	"data 不是 Buffer 或 string": { "en": "data is not a buffer or string" },
	" 必须是绝对路径": { "en": " must be absolute path" },
	"参数 fpd: ": { "en": "argument fpd: " },
	" 必须以 / 结尾": { "en": "must ends with /" },
	"fp 必须是绝对路径": { "en": "fp must be absolute path" },
	"删除了文件夹: ": { "en": "deleted folder: " },
	"删除了文件: ": { "en": "deleted file: " },
	"文件夹已不存在: ": { "en": "folder no longer exists: " },
	"文件已不存在: ": { "en": "file no longer exists: " },
	"fp_src 和 fp_dst 必须同为文件路径或文件夹路径": { "en": "fp_src and fp_dst must be the same as file paths or folder paths" },
	"fp_src 和 fp_dst 必须为完整路径": { "en": "fp_src and fp_dst must be complete paths" },
	复制: { "en": "copy" },
	"src 和 dst 必须同为文件路径或文件夹路径": { "en": "src and dst must be the same as file paths or folder paths" },
	"src 和 dst 必须为完整路径": { "en": "src and dst must be complete paths" },
	移动: { "en": "move" },
	"fp 和 fp_ 必须是绝对路径": { "en": "fp and fp_ must be absolute paths" },
	重命名: { "en": "rename" },
	"文件已存在：": { "en": "file already exists: " },
	"fpd 必须是绝对路径: ": { "en": "fpd must be absolute path" },
	"fpd 必须以 / 结尾: ": { "en": "fpd must end with /" },
	"fp_real 和 fp_link 必须同为文件路径或文件夹路径": { "en": "fp_real and fp_link must be the same as file paths or folder paths" },
	存在同名: { "en": "exists the same name " },
	文件夹: { "en": "folder" },
	文件: { "en": "file" },
	"，无法创建链接": { "en": ", unable to create link" },
	"已将源文件 ": { "en": "linked src file" },
	" 链接到 ": { "en": " to " },
	"fp 必须是完整路径": { "en": "fp must be complete path" },
	"文件修改 (": { "en": "file changed (" },
	"remote.send(): websocket client 已断开": { "en": "remote.send(): websocket client disconnected" },
	"找不到 rpc handler": { "en": "cannot find rpc handler" },
	凌晨: { "en": "early morning" },
	清晨: { "en": "early morning" },
	早上: { "en": "morning" },
	上午: { "en": "morning" },
	中午: { "en": "noon" },
	下午: { "en": "afternoon" },
	晚上: { "en": "night" },
	深夜: { "en": "late at night" },
	断言失败: { "en": "assertion failed" },
	检查失败: { "en": "check failed" },
	" 太短": { "en": " is too short" },
	"xshell 正在启动": { "en": "xshell is booting" },
	"repl 已启动": { "en": "repl has started" },
	"server 正在启动": { "en": "server is starting" },
	"server 已启动": { "en": "server has started" },
	"xshell 启动完成": { "en": "xshell booted" },
	"xshell 正在监听: ": { "en": "xshell is listening at: " },
	已加载: { "en": "loaded" },
	所有模块全部加载: { "en": "all modules were loaded" },
	"状态码 {{status}}, 非 2xx: {{url}}": { "en": "status code {{code}} is not 2xx: {{url}}" },
	"请求参数:": { "en": "request.params:" },
	"请求体:": { "en": "request.body:" },
	"响应状态码:": { "en": "response.code:" },
	"响应错误:": { "en": "response.error:" },
	"响应头:": { "en": "response.headers:" },
	"响应体:": { "en": "response.body:" },
	"调用栈:": { "en": "call stack:" },
	已存在: { "en": "exists" },
	进程: { "en": "process" },
	"异常结束, 错误码:": { "en": "exited abnormally with error code:" },
	"信号:": { "en": "signal" },
	正常结束: { "en": "exited normally" },
	"xshell 开始启动": { "en": "xshell is booting" },
	"nodejs.repl 启动成功": { "en": "nodejs.repl started successfully" },
	"server 启动成功": { "en": "server started successfully" },
	"xshell 启动成功": { "en": "xshell started successfully" },
	"xshell 正在退出": { "en": "xshell is exiting" },
	所有模块加载成功: { "en": "all modules were loaded successfully" },
	" 已连接": { "en": " connected" },
	" 已正常关闭": { "en": " closed normally" },
	被关闭: { "en": "was closed" },
	原因: { "en": "reason" },
	已创建文件夹: { "en": "created folder" },
	已存在文件夹: { "en": "folder already exists:" },
	" 太短，防止误删文件": { "en": " is too short (prevent accidental deletion of files)" },
	异常结束: { "en": "exited abnormally" },
	结束: { "en": "exited" },
	"不能太短，防止误删文件": { "en": "can not be too short to prevent accidental deletion of files" },
	连接出错了: { "en": "connection errored" },
	"超过等待时间:": { "en": "response.timeout exceeded:" },
	"等待 {{duration}} 秒后重试 fetch ({{_count}}) …": { "en": "Wait {{duration}} seconds to retry fetching ({{_count}}) …" },
	"状态码 {{status}} 非 2xx": { "en": "Status code {{status}} is not 2xx" },
	"传入 request 的 headers 参数中 key 应该都是小写的，实际为 {{key}}": { "en": "The key in the headers parameter of the incoming request should be all lowercase, and it is actually {{key}}" },
	"dir 必须以 / 结尾": { "en": "dir must end with /" },
	"fp 必须是文件，不能以 / 结尾": { "en": "fp must be a file and cannot end with /" },
	"fp 必须是绝对路径:": { "en": "fp must be an absolute path:" },
	"fp 必须是绝对路径，当前为:": { "en": "fp must be an absolute path, currently:" },
	已正常关闭: { "en": "closed normally" },
	"websocket close 事件时应该已经 settled": { "en": "Promise should have been settled in websocket close event" },
	连接被关闭: { "en": "connection closed" },
	"状态码 {{status}}, 非 2xx": { "en": "Status code {{status}}, not 2xx" },
	"构建 Remote 时 url 和 websocket 最多只能传一个": { "en": "When building Remote, only one url and websocket can be passed at most" },
	"创建 Remote 时传入的 websocket 连接已断开": { "en": "The incoming websocket connection was broken while creating the Remote" },
	"传入的 websocket 连接已断开": { "en": "The incoming websocket connection was disconnected" },
	"尝试释放未锁定的锁，这不应该发生": { "en": "Attempt to release an unlocked lock, this should not happen" },
	超时错误: { "en": "timeout error" },
	"xshell 启动成功，用时 {{duration}}，正在监听: http://localhost:8421\n": { "en": "xshell started successfully, took {{duration}}, is listening: http://localhost:8421\n" },
	"xshell 启动成功，用时 ": { "en": "xshell started successfully, it took " },
	"正在监听: http://localhost:8421\n": { "en": "listening: http://localhost:8421\n" },
	"flist: 参数 fpd: '{{fpd}}' 必须是绝对路径": { "en": "flist: parameter fpd: '{{fpd}}' must be an absolute path" },
	"flist: 参数 fpd: '{{fpd}}' 必须以 / 结尾": { "en": "flist: argument fpd: '{{fpd}}' must end with /" },
	"fstat: 参数 fp: '{{fp}}' 必须是绝对路径": { "en": "fstat: parameter fp: '{{fp}}' must be an absolute path" },
	"不存在且无法创建文件夹 {{fpd}}": { "en": "Folder {{fpd}} does not exist and cannot be created" },
	"message.data 必须是数组": { "en": "message.data must be an array" },
	"fsend 必须传 absolute 选项或 root 文件夹": { "en": "fsend must pass absolute option or root folder" },
	"message.data 数组中不能有 undefined 的项, 因为 json 序列化后会变为 null": { "en": "There cannot be undefined items in the message.data array, because json will become null after serialization" },
	"xshell 启动成功，正在监听: http://localhost:8421": { "en": "xshell started successfully and is listening: http://localhost:8421" },
	"flstat: 参数 fp: '{{fp}}' 必须是绝对路径": { "en": "flstat: parameter fp: '{{fp}}' must be an absolute path" },
	"filter 选项只适用于 fp_src 为文件夹": { "en": "filter option only applies to fp_src for folders" },
	"已订阅 stdio": { "en": "subscribed to stdio" },
	"由于 websocket 连接关闭，stdio 订阅被关闭": { "en": "stdio subscription was closed due to websocket connection closed" },
	"已取消订阅 stdio": { "en": "stdio unsubscribed" },
	"{{name}} 启动成功，正在监听 {{ports}} 端口": { "en": "{{name}} started successfully and is listening on {{ports}} port" },
	删除了文件夹: { "en": "deleted folder" },
	删除了文件: { "en": "deleted file" },
	已不存在文件: { "en": "file no longer exists:" },
	已不存在文件夹: { "en": "folder no longer exists:" },
	"不支持 content-encoding: {{encoding}} 的 http 请求": { "en": "http requests with content-encoding: {{encoding}} are not supported" },
	"等待 {{duration}} 秒后重试 request (已尝试 {{_count}} 次) …": { "en": "Wait {{duration}} seconds before retrying request (tried {{_count}} times) …" },
	"fsend 必须传 absolute 选项, sea 选项, 或 fpd_root 文件夹": { "en": "fsend must be passed the absolute option, the sea option, or the fpd_root folder" },
	对端关闭: { "en": "endpoint is going away" },
	网络中断: { "en": "network interruption" },
	chtext: { "en": "chtext" },
	key: { "en": "key" }
};

//#endregion
//#region node_modules/.pnpm/xshell@1.4.38_supports-color@7.2.0/node_modules/xshell/i18n/instance.js
let i18n$2 = new I18N(dict_default$2);
const { t: t$2, language: language$2 } = i18n$2;

//#endregion
//#region node_modules/.pnpm/xshell@1.4.38_supports-color@7.2.0/node_modules/xshell/prototype.common.js
const emoji_regex = emoji_regex_default();
const noop = () => {};
const ident = (x) => x;
const select = (key) => (obj) => obj[key];
const key_types = [
	"string",
	"number",
	"symbol"
];
const is_key_type = ((key) => key_types.includes(typeof key));
const greater = (a, b) => a > b;
const less = (a, b) => a < b;
function to_snake_case(str) {
	return str.replaceAll(/([A-Z])/g, "_$1").toLowerCase().replaceAll("-", "_").strip_if_start("_");
}
function to_lower_camel_case(str) {
	return str.replaceAll(/[_\-]([a-z])/g, (match) => match[1].toUpperCase());
}
function to_space_case(str) {
	return str.replaceAll(/([A-Z])/g, " $1").toLowerCase().replaceAll("_", " ").strip_if_start(" ");
}
function set_reverse(obj) {
	for (const key in obj) obj[obj[key]] = key;
	return obj;
}
function to_method_property_descriptors(methods) {
	return Object.fromEntries(Object.entries(methods).map(([name, value]) => [name, {
		configurable: true,
		writable: true,
		enumerable: false,
		value
	}]));
}
function to_getter_property_descriptors(getters) {
	return Object.fromEntries(Object.entries(getters).map(([name, get]) => [name, {
		configurable: true,
		enumerable: false,
		get
	}]));
}
const cjk = "([⺀-鿿豈-﫿])";
const quotes = {
	single: "'",
	double: "\"",
	backtick: "`"
};
const brackets = {
	round: ["(", ")"],
	square: ["[", "]"],
	curly: ["{", "}"],
	pointy: ["<", ">"],
	corner: ["「", "」"],
	fat: ["【", "】"],
	tortoise_shell: ["〔", "〕"]
};
if (!globalThis.my_prototype_defined) {
	Object.defineProperties(String.prototype, {
		...to_getter_property_descriptors({
			width() {
				const s = platform.strip_ansi(this.replace(emoji_regex, "  "));
				let width = 0;
				for (let i = 0; i < s.length; ++i) {
					const code = s.codePointAt(i);
					if (code <= 31 || code >= 127 && code <= 159 || code >= 768 && code <= 879) continue;
					if (code > 65535) ++i;
					width += is_codepoint_fullwidth(code) ? 2 : 1;
				}
				return width;
			},
			isdir() {
				return this.endsWith("/");
			},
			fp() {
				if (!this) return this;
				const fp = this.replaceAll("\\", "/");
				return fp[1] === ":" && "a" <= fp[0] && fp[0] <= "z" ? fp[0].toUpperCase() + fp.slice(1) : fp;
			},
			fpd() {
				const { fp } = this;
				return fp.endsWith("/") ? fp : `${fp}/`;
			},
			fdir() {
				return this.fp.strip_end(this.fname);
			},
			fname() {
				const { fp } = this;
				const ilast = fp.lastIndexOf("/");
				if (ilast === -1) return fp;
				if (ilast === fp.length - 1) {
					const iprev = fp.lastIndexOf("/", ilast - 1);
					return iprev === -1 ? fp : fp.slice(iprev + 1);
				}
				return fp.slice(ilast + 1);
			},
			fext() {
				if (this.endsWith("/")) return "";
				const { fname } = this;
				const index = fname.lastIndexOf(".");
				return index <= 0 ? "" : fname.slice(index + 1);
			}
		}),
		...to_method_property_descriptors({
			truncate(width, storage = false) {
				if (storage) return this.length <= width ? this : this.slice(0, width - 2) + "··";
				const color_bak = this.startsWith("\x1B") ? this.slice(0, 5) : "";
				const s = platform.strip_ansi(this);
				if (width <= 2) return this.slice(0, width);
				let i_fitted = 0;
				let fitted_width = 0;
				let cur_width = 0;
				for (let i = 0; i < s.length; i++) {
					const code = s.codePointAt(i);
					if (code <= 31 || code >= 127 && code <= 159 || code >= 768 && code <= 879) continue;
					if (code > 65535) i++;
					const w = is_codepoint_fullwidth(code) ? 2 : 1;
					if (cur_width + w + 2 <= width) {
						i_fitted = i;
						fitted_width += w;
					}
					cur_width += w;
					if (cur_width > width) {
						const i_fitted_next = i_fitted + 1;
						const t = s.slice(0, i_fitted_next) + " ".repeat(width - 2 - fitted_width) + "··";
						return color_bak ? color_bak + t + "\x1B[39m" : t;
					}
				}
				return this;
			},
			pad(width, { character = " ", position = "right" } = {}) {
				const _width = this.width;
				if (_width >= width) return this;
				if (position === "right") return this + character.repeat((width - _width) / character.width);
				return character.repeat(width - _width) + this;
			},
			limit(width, { character = " ", position = "right" } = {}) {
				return this.pad(width, {
					character,
					position
				}).truncate(width);
			},
			to_regexp(preservations, flags = "") {
				const preserved_chars = new Set(preservations);
				const replace_chars = Array.prototype.filter.call("|\\{}()[]^$+*?.-", (c) => !preserved_chars.has(c)).map((c) => c === "]" ? "\\]" : c).join("");
				return new RegExp(this.replace(new RegExp(`[${replace_chars}]`, "g"), "\\$&"), flags);
			},
			to_snake_case() {
				return to_snake_case(this);
			},
			to_space_case() {
				return to_space_case(this);
			},
			refmt(pattern, pattern_, preservations = "", flags = "", transformer = (name, value) => value || "", pattern_placeholder = /\{.*?\}/g) {
				let last_end = 0;
				let $placeholders = {};
				let regx_parts = [];
				function add_part(left, right) {
					const part = pattern.slice(left, right);
					if (part) regx_parts.push(part.to_regexp(preservations).source.bracket());
				}
				pattern.replace(pattern_placeholder, ($0, offset) => {
					add_part(last_end, offset);
					last_end = offset + $0.length;
					let [placeholder_name, placeholder_pattern] = $0.slice(1, -1).split(":").map((s) => s.trim());
					let optional = false;
					if (placeholder_name.endsWith("?")) {
						placeholder_name = placeholder_name.slice(0, -1);
						optional = true;
					}
					$placeholders[placeholder_name] = regx_parts.push(placeholder_pattern ? `${placeholder_pattern.bracket()}${optional ? "?" : ""}` : "(.*?)");
					return "";
				});
				add_part(last_end);
				regx_parts = regx_parts.filter((part) => part);
				if (regx_parts[regx_parts.length - 1] === "(.*?)") regx_parts[regx_parts.length - 1] = "(.*)";
				const pattern_regx = new RegExp(regx_parts.join(""), flags);
				const matches = pattern_regx.exec(this);
				if (!matches) return this;
				const placeholders = Object.fromEntries(Object.entries($placeholders).map(([name, $i]) => [
					[name, matches[$i]],
					[`${name}.before`, matches[$i - 1] || ""],
					[`${name}.after`, matches[$i + 1] || ""]
				]).flat());
				last_end = 0;
				let replacement_parts = [];
				pattern_.replace(pattern_placeholder, ($0, offset) => {
					replacement_parts.push(pattern_.slice(last_end, offset));
					last_end = offset + $0.length;
					const placeholder_name = $0.slice(1, -1);
					replacement_parts.push(transformer(placeholder_name, placeholders[placeholder_name], placeholders));
					return "";
				});
				replacement_parts.push(pattern_.slice(last_end));
				return this.replace(pattern_regx, replacement_parts.join(""));
			},
			find(pattern, preservations = "", flags = "", pattern_placeholder = /\{.*?\}/g) {
				let last_end = 0;
				let $placeholders = {};
				let regx_parts = [];
				function add_part(left, right) {
					const part = pattern.slice(left, right);
					if (part) regx_parts.push(part.to_regexp(preservations).source.bracket());
				}
				pattern.replace(pattern_placeholder, ($0, offset) => {
					add_part(last_end, offset);
					last_end = offset + $0.length;
					let [placeholder_name, placeholder_pattern] = $0.slice(1, -1).split(":").map((s) => s.trim());
					let optional = false;
					if (placeholder_name.endsWith("?")) {
						placeholder_name = placeholder_name.slice(0, -1);
						optional = true;
					}
					$placeholders[placeholder_name] = regx_parts.push(placeholder_pattern ? `${placeholder_pattern.bracket()}${optional ? "?" : ""}` : "(.*?)");
					return "";
				});
				add_part(last_end);
				regx_parts = regx_parts.filter((part) => part);
				if (regx_parts[regx_parts.length - 1] === "(.*?)") regx_parts[regx_parts.length - 1] = "(.*)";
				const matches = new RegExp(regx_parts.join(""), flags).exec(this);
				if (!matches) return {};
				return Object.fromEntries(Object.entries($placeholders).map(([name, $i]) => [name, matches[$i] || ""]));
			},
			count(search) {
				if (!search) throw new Error("count 的 search 不能为空");
				let count = 0;
				for (let i = 0; (i = this.indexOf(search, i)) !== -1; i += search.length) count++;
				return count;
			},
			quote(type = "single") {
				if (type === "psh") return `& ${this.quote()}`;
				return this.surround(quotes[type]);
			},
			bracket(shape = "round") {
				return this.surround(...brackets[shape]);
			},
			surround(left, right) {
				return left + this + (right || left);
			},
			surround_tag(tag_name) {
				return "<" + tag_name + ">" + this + "</" + tag_name + ">";
			},
			to_lf() {
				return this.replace(/\r\n/g, "\n");
			},
			rm(pattern, flags = "g") {
				if (typeof pattern === "string") pattern = new RegExp(pattern, flags);
				return this.replace(pattern, "");
			},
			split_lines(delimiter = /\r?\n/) {
				let lines = this.split(delimiter);
				if (lines[lines.length - 1] === "") lines.pop();
				return lines;
			},
			split_indent() {
				let i = 0;
				let indent = 0;
				for (; i < this.length; i++) if (this[i] === " ") indent++;
				else if (this[i] === "	") indent += 4;
				else break;
				return {
					indent,
					text: this.slice(i)
				};
			},
			split2(splitter, { last = false, optional = false } = {}) {
				const isplitter = last ? this.lastIndexOf(splitter) : this.indexOf(splitter);
				if (isplitter === -1) if (optional) return [this];
				else throw new Error(`字符串: ${this} 必须包含 splitter: ${splitter}`);
				return [this.slice(0, isplitter), this.slice(isplitter + splitter.length)];
			},
			strip_start(prefix, validate) {
				if (validate && !this.startsWith(prefix)) throw new Error(`字符串没有以前缀 ${prefix} 开头: ${this}`);
				return this.slice(prefix.length);
			},
			strip_if_start(prefix) {
				return this.startsWith(prefix) ? this.slice(prefix.length) : this;
			},
			strip_end(suffix, validate) {
				if (validate && !this.endsWith(suffix)) throw new Error(`字符串没有以后缀 ${suffix} 结尾: ${this}`);
				return this.slice(0, -suffix.length);
			},
			strip_if_end(suffix) {
				return this.endsWith(suffix) ? this.slice(0, -suffix.length) : this;
			},
			ensure_start(prefix) {
				return this.startsWith(prefix) ? this : prefix + this;
			},
			ensure_end(suffix = "\n") {
				return this.endsWith(suffix) ? this : this + suffix;
			},
			slice_from(search, { include = false, last = false, optional = false } = {}) {
				const i = last ? this.lastIndexOf(search) : this.indexOf(search);
				if (i === -1) if (optional) return this;
				else throw new Error(`slice_from 在字符串 ${this} 中找不到 search: ${search}`);
				else return this.slice(include ? i : i + search.length);
			},
			slice_to(search, { include = false, last = false, optional = false } = {}) {
				const i = last ? this.lastIndexOf(search) : this.indexOf(search);
				if (i === -1) if (optional) return this;
				else throw new Error(`slice_to 在字符串 ${this} 中找不到 search: ${search}`);
				else return this.slice(0, include ? i + search.length : i);
			},
			space() {
				if (!this) return this;
				let text_;
				text_ = this.replace(space_patterns[0], "$1 $2").replace(space_patterns[1], "$1 $2").replace(space_patterns[2], "$1$2$3").replace(space_patterns[3], "$1 $2 $3").replace(space_patterns[4], "$1 $2 $3");
				const text_bak = text_;
				text_ = text_.replace(space_patterns[5], "$1 $2 $4");
				if (text_ === text_bak) text_ = text_.replace(space_patterns[6], "$1 $2").replace(space_patterns[7], "$1 $2");
				return text_.replace(space_patterns[8], "$1$3$5").replace(space_patterns[9], "$1$2 $3").replace(space_patterns[10], "$1 $2").replace(space_patterns[11], "$1 $2");
			}
		})
	});
	const space_patterns = [
		new RegExp(cjk + "(['\"])", "g"),
		new RegExp("(['\"])" + cjk, "g"),
		/(["']+)\s*(.+?)\s*(["']+)/g,
		new RegExp(cjk + "([\\+\\-\\*\\/=&\\\\\\|<>])([A-Za-z0-9])", "g"),
		new RegExp("([A-Za-z0-9])([\\+\\-\\*\\/=&\\\\\\|<>])" + cjk, "g"),
		new RegExp(cjk + "([\\(\\[\\{<“]+(.*?)[\\)\\]\\}>”]+)" + cjk, "g"),
		new RegExp(cjk + "([\\(\\[\\{<“>])", "g"),
		new RegExp("([\\)\\]\\}>”<])" + cjk, "g"),
		/([\(\[\{<\u201c]+)(\s*)(.+?)(\s*)([\)\]\}>\u201d]+)/g,
		new RegExp(cjk + "([~!;:,\\.\\?…])([A-Za-z0-9])", "g"),
		new RegExp(cjk + "([A-Za-z0-9`\\$%\\^&\\*\\-=\\+\\\\\\|\\/@¡-ÿ•‧⅐-↏])", "g"),
		new RegExp("([A-Za-z0-9`\\$%\\^&\\*\\-=\\+\\\\\\|\\/@¡-ÿ•‧⅐-↏])" + cjk, "g")
	];
	Object.defineProperties(Date.prototype, to_method_property_descriptors({
		to_str(ms) {
			return `${this.to_date_str()} ${this.to_time_str(ms)}`;
		},
		to_date_str() {
			return this.getFullYear() + "." + String(this.getMonth() + 1).padStart(2, "0") + "." + String(this.getDate()).padStart(2, "0");
		},
		to_time_str(ms) {
			const [ampm, hour] = get_twelve_hour_clock(this);
			return `${ampm} ${get_time_str(this, hour, ms, ":")}`;
		},
		to_dot_time_str(ms) {
			return get_time_str(this, this.getHours(), ms, ".");
		},
		to_dot_str(ms) {
			return `${this.to_date_str()} ${this.to_dot_time_str(ms)}`;
		},
		to_formal_time_str(ms) {
			return get_time_str(this, this.getHours(), ms, ":");
		},
		to_formal_str(ms) {
			return `${this.to_date_str()} ${this.to_formal_time_str(ms)}`;
		}
	}));
	function get_twelve_hour_clock(date) {
		let hour = date.getHours();
		if (hour <= 6) return [t$2("凌晨"), hour];
		if (hour <= 8) return [t$2("清晨"), hour];
		if (hour <= 9) return [t$2("早上"), hour];
		if (hour <= 10) return [t$2("上午"), hour];
		if (hour <= 12) return [t$2("中午"), hour];
		hour -= 12;
		if (hour <= 5) return [t$2("下午"), hour];
		if (hour <= 10) return [t$2("晚上"), hour];
		return [t$2("深夜"), hour];
	}
	function get_time_str(date, hour, ms, splitter) {
		return String(hour).padStart(2, "0") + splitter + String(date.getMinutes()).padStart(2, "0") + splitter + String(date.getSeconds()).padStart(2, "0") + (ms ? "." + String(date.getMilliseconds()).padStart(3, "0") : "");
	}
	Object.defineProperties(Number.prototype, to_method_property_descriptors({
		to_fsize_str() {
			return byte_size(this);
		},
		to_bin_str() {
			return `0b${this.toString(2)}`;
		},
		to_hex_str(length) {
			const s = Math.abs(this).toString(16);
			if (length === void 0) length = Math.ceil(s.length / 4) * 4;
			return `${this < 0 ? "-" : ""}0x${"0".repeat(length - s.length)}${s}`;
		},
		to_oct_str() {
			return `0o${this.toString(8)}`;
		}
	}));
	Object.defineProperties(Array.prototype, {
		...to_getter_property_descriptors({ last() {
			return this.at(-1);
		} }),
		...to_method_property_descriptors({
			trim_lines({ trim_line = true, rm_empty_lines = true, rm_last_empty_lines = false } = {}) {
				if (!this.length) return this;
				let lines = this;
				if (trim_line) lines = lines.map((line) => line.trim());
				if (rm_empty_lines) return lines.filter(Boolean);
				if (rm_last_empty_lines) {
					const index = lines.findLastIndex(Boolean);
					return index === -1 ? [] : lines.slice(0, index + 1);
				}
				return lines;
			},
			indent(width = 4, character = " ") {
				const indent = character.repeat(width);
				return this.map((line) => indent + line);
			},
			sum(zero, mapper) {
				if (!this.length) return zero;
				const first = this[0];
				if ((typeof first === "number" || typeof first === "bigint") && !mapper) return this.reduce((acc, x) => acc + x, zero);
				if (is_key_type(mapper)) mapper = select(mapper);
				mapper ??= ident;
				return this.reduce((acc, x) => acc + mapper(x), zero);
			},
			max(mapper = ident, _greater = greater) {
				if (!this.length) return void 0;
				if (is_key_type(mapper)) mapper = select(mapper);
				let max = mapper(this[0]);
				let imax = 0;
				for (let i = 1; i < this.length; i++) {
					const value = mapper(this[i]);
					if (_greater(value, max)) {
						max = value;
						imax = i;
					}
				}
				return this[imax];
			},
			min(mapper = ident, _less = less) {
				if (!this.length) return void 0;
				if (is_key_type(mapper)) mapper = select(mapper);
				let min = mapper(this[0]);
				let imin = 0;
				for (let i = 1; i < this.length; i++) {
					const value = mapper(this[i]);
					if (_less(value, min)) {
						min = value;
						imin = i;
					}
				}
				return this[imin];
			},
			unique(mapper) {
				if (!mapper) return [...new Set(this)];
				if (is_key_type(mapper)) mapper = select(mapper);
				let map = /* @__PURE__ */ new Map();
				for (const x of this) map.set(mapper(x), x);
				return [...map.values()];
			},
			join_lines(append = Boolean(this.length)) {
				return `${this.join("\n")}${append ? "\n" : ""}`;
			},
			select(key) {
				return this.map(select(key));
			}
		})
	});
	Object.defineProperties(BigInt.prototype, to_method_property_descriptors({
		to_fsize_str() {
			return byte_size(this);
		},
		toJSON() {
			return this.toString();
		}
	}));
	Object.defineProperties(Error.prototype, to_method_property_descriptors({ toJSON() {
		return Object.fromEntries(Object.getOwnPropertyNames(this).map((name) => [name, this[name]]));
	} }));
	Object.defineProperties(Set.prototype, to_method_property_descriptors({ map(mapfn) {
		return Array.from(this, mapfn);
	} }));
	Object.defineProperties(Uint8Array.prototype, to_getter_property_descriptors({ dataview() {
		return new DataView(this.buffer, this.byteOffset, this.byteLength);
	} }));
}
const bytes_table = [
	"b",
	"kb",
	"mb",
	"gb",
	"tb",
	"pb",
	"eb",
	"zb",
	"yb"
].map((unit, i) => ({
	start: i === 0 ? 0 : 2 ** (i * 10),
	end: 2 ** ((i + 1) * 10),
	unit
}));
function byte_size(bytes) {
	bytes = Number(bytes);
	if (Number.isNaN(bytes)) {
		console.error(/* @__PURE__ */ new Error("Number.byte_size() 不能传入 NaN"));
		return "";
	}
	const sign = bytes < 0 ? "-" : "";
	bytes = Math.abs(bytes);
	const { unit, start } = bytes_table.find((range) => range.start <= bytes && bytes < range.end);
	const v = bytes / (start === 0 ? 1 : start);
	return `${sign}${v.toFixed((unit === "mb" || unit === "gb") && v < 10 ? 1 : 0)} ${unit}`;
}
function is_codepoint_fullwidth(codepoint) {
	return !Number.isNaN(codepoint) && codepoint >= 4352 && (codepoint <= 4447 || codepoint === 8220 || codepoint === 8221 || codepoint === 8230 || codepoint === 8251 || 8592 <= codepoint && codepoint <= 8703 || codepoint === 9001 || codepoint === 9002 || 9312 <= codepoint && codepoint <= 9471 || 9472 <= codepoint && codepoint <= 9599 || 9600 <= codepoint && codepoint <= 11247 || 11904 <= codepoint && codepoint <= 12871 && codepoint !== 12351 || 12880 <= codepoint && codepoint <= 19903 || 19968 <= codepoint && codepoint <= 42182 || 43360 <= codepoint && codepoint <= 43388 || 44032 <= codepoint && codepoint <= 55203 || 63744 <= codepoint && codepoint <= 64255 || 65040 <= codepoint && codepoint <= 65049 || 65072 <= codepoint && codepoint <= 65131 || 65281 <= codepoint && codepoint <= 65376 || 65504 <= codepoint && codepoint <= 65510 || 110592 <= codepoint && codepoint <= 110593 || 127488 <= codepoint && codepoint <= 127569 || 131072 <= codepoint && codepoint <= 262141);
}

//#endregion
//#region node_modules/.pnpm/xshell@1.4.38_supports-color@7.2.0/node_modules/xshell/utils.common.js
async function delay$1(milliseconds, options) {
	return platform.delay(milliseconds, options);
}
function assert(assertion, message) {
	if (!assertion) {
		debugger;
		throw new Error(`${t$2("断言失败")}: ${message ? `${message}: ` : ""}`);
	}
	return assertion;
}
function check(condition, message) {
	if (!condition) {
		debugger;
		throw new Error(message || t$2("检查失败"));
	}
	return condition;
}
function genid() {
	return Math.random() * 2 ** 53;
}
function seq(n, generator) {
	let a = new Array(n);
	for (let i = 0; i < n; i++) a[i] = generator ? generator(i) : i;
	return a;
}
function unique(iterable, mapper) {
	if (!mapper) return [...new Set(iterable)];
	if (is_key_type(mapper)) mapper = select(mapper);
	let map = /* @__PURE__ */ new Map();
	for (const x of iterable) map.set(mapper(x), x);
	return [...map.values()];
}
function zip_object(keys, values) {
	return keys.reduce((obj, key, i) => {
		obj[key] = values[i];
		return obj;
	}, {});
}
function map_keys(obj, mapper = to_snake_case, overrider, recursive = false) {
	if (Array.isArray(obj)) return obj.map((v) => map_keys(v, mapper, overrider, recursive));
	if (!obj || Object.prototype.toString.call(obj) !== "[object Object]") return obj;
	const map_key = typeof mapper === "function" ? mapper : (key) => mapper[key] || key;
	const obj_ = Object.fromEntries(Object.entries(obj).map(([key, value]) => [map_key(key), recursive ? map_keys(value, mapper, void 0, recursive) : value]));
	return overrider ? {
		...obj_,
		...overrider(obj_)
	} : obj_;
}
function concat(arrays) {
	let length = 0;
	for (const a of arrays) length += a.byteLength;
	let buf = platform.get_buffer(length);
	let offset = 0;
	for (const a of arrays) {
		const uint8view = new Uint8Array(a.buffer, a.byteOffset, a.byteLength);
		buf.set(uint8view, offset);
		offset += uint8view.byteLength;
	}
	return buf;
}
let encoder = new TextEncoder();
let decoder = new TextDecoder();
function decode(buffer) {
	return decoder.decode(buffer);
}
function defer(initial) {
	if (initial === void 0) {
		let { promise, resolve, reject } = Promise.withResolvers();
		let p = promise;
		p.resolve = resolve;
		p.reject = reject;
		return p;
	} else {
		let p = Promise.resolve(initial);
		p.resolve = noop;
		p.reject = noop;
		return p;
	}
}
function defer2(initial) {
	if (initial === void 0) {
		let settled = false;
		let { promise, resolve, reject } = Promise.withResolvers();
		let p = promise;
		p.resolve = (value) => {
			settled = true;
			resolve(value);
		};
		p.reject = (error) => {
			settled = true;
			reject(error);
		};
		Object.defineProperty(p, "settled", {
			get() {
				return settled;
			},
			enumerable: true,
			configurable: true
		});
		return p;
	} else {
		let p = Promise.resolve(initial);
		p.resolve = noop;
		p.reject = noop;
		p.settled = true;
		return p;
	}
}
var Lock = class {
	resource;
	ptail = defer(null);
	locked = false;
	constructor(resource) {
		this.resource = resource;
	}
	async request(action, signal) {
		signal?.throwIfAborted();
		const ptail = this.ptail;
		let pcurrent = this.ptail = defer();
		this.locked = true;
		return new Promise((resolve, reject) => {
			let executing = false;
			signal?.addEventListener("abort", () => {
				if (!executing) reject(signal.reason);
			}, { once: true });
			ptail.then(async () => {
				if (signal?.aborted) reject(signal.reason);
				else try {
					executing = true;
					resolve(await action(this.resource));
				} catch (error) {
					reject(error);
				}
				this.locked = false;
				pcurrent.resolve();
			});
		});
	}
};
function nowstr(with_date = false) {
	const date = /* @__PURE__ */ new Date();
	return with_date ? date.to_str() : date.to_time_str();
}

//#endregion
//#region node_modules/.pnpm/xshell@1.4.38_supports-color@7.2.0/node_modules/xshell/platform.browser.js
function get_buffer(length) {
	return new Uint8Array(length);
}
function encode(str) {
	return encoder.encode(str);
}
async function delay(milliseconds, { signal } = {}) {
	signal?.throwIfAborted();
	return new Promise((resolve, reject) => {
		function on_signal_abort() {
			clearTimeout(timeout);
			reject(signal.reason);
		}
		signal?.addEventListener("abort", on_signal_abort);
		let timeout = setTimeout(() => {
			signal?.removeEventListener("abort", on_signal_abort);
			resolve();
		}, milliseconds);
	});
}
set_platform({
	nodejs: false,
	browser: true,
	get_buffer,
	encode,
	delay,
	strip_ansi: ident,
	get_websocket: () => globalThis.WebSocket
});

//#endregion
//#region node_modules/.pnpm/chalk@6.0.0/node_modules/chalk/source/utilities.js
function stringReplaceAll(string, substring, postfix) {
	let index = string.indexOf(substring);
	if (index === -1) return string;
	const substringLength = substring.length;
	let endIndex = 0;
	let returnValue = "";
	do {
		returnValue += string.slice(endIndex, index) + substring + postfix;
		endIndex = index + substringLength;
		index = string.indexOf(substring, endIndex);
	} while (index !== -1);
	returnValue += string.slice(endIndex);
	return returnValue;
}
function stringEncaseCRLFWithFirstIndex(string, prefix, postfix, index) {
	let endIndex = 0;
	let returnValue = "";
	do {
		const isGotCR = string[index - 1] === "\r";
		returnValue += string.slice(endIndex, isGotCR ? index - 1 : index) + prefix + (isGotCR ? "\r\n" : "\n") + postfix;
		endIndex = index + 1;
		index = string.indexOf("\n", endIndex);
	} while (index !== -1);
	returnValue += string.slice(endIndex);
	return returnValue;
}

//#endregion
//#region node_modules/.pnpm/chalk@6.0.0/node_modules/chalk/source/vendor/ansi-styles/index.js
const ANSI_BACKGROUND_OFFSET = 10;
const ANSI_UNDERLINE_OFFSET = 20;
const wrapAnsi16 = (offset = 0) => (code) => `\u{1B}[${code + offset}m`;
const wrapAnsi256 = (offset = 0) => (code) => `\u{1B}[${38 + offset};5;${code}m`;
const wrapAnsi16m = (offset = 0) => (red, green, blue) => `\u{1B}[${38 + offset};2;${red};${green};${blue}m`;
const wrapUnderlineAnsi = (code) => `\u{1B}[58;5;${code < 90 ? code - 30 : code - 90 + 8}m`;
const styles$1 = {
	modifier: {
		reset: [0, 0],
		bold: [1, 22],
		dim: [2, 22],
		italic: [3, 23],
		underline: [4, 24],
		underlineDouble: ["4:2", 24],
		underlineCurly: ["4:3", 24],
		underlineDotted: ["4:4", 24],
		underlineDashed: ["4:5", 24],
		overline: [53, 55],
		inverse: [7, 27],
		hidden: [8, 28],
		strikethrough: [9, 29]
	},
	color: {
		black: [30, 39],
		red: [31, 39],
		green: [32, 39],
		yellow: [33, 39],
		blue: [34, 39],
		magenta: [35, 39],
		cyan: [36, 39],
		white: [37, 39],
		blackBright: [90, 39],
		gray: [90, 39],
		grey: [90, 39],
		redBright: [91, 39],
		greenBright: [92, 39],
		yellowBright: [93, 39],
		blueBright: [94, 39],
		magentaBright: [95, 39],
		cyanBright: [96, 39],
		whiteBright: [97, 39]
	},
	bgColor: {
		bgBlack: [40, 49],
		bgRed: [41, 49],
		bgGreen: [42, 49],
		bgYellow: [43, 49],
		bgBlue: [44, 49],
		bgMagenta: [45, 49],
		bgCyan: [46, 49],
		bgWhite: [47, 49],
		bgBlackBright: [100, 49],
		bgGray: [100, 49],
		bgGrey: [100, 49],
		bgRedBright: [101, 49],
		bgGreenBright: [102, 49],
		bgYellowBright: [103, 49],
		bgBlueBright: [104, 49],
		bgMagentaBright: [105, 49],
		bgCyanBright: [106, 49],
		bgWhiteBright: [107, 49]
	},
	underlineColor: {
		underlineBlack: ["58;5;0", 59],
		underlineRed: ["58;5;1", 59],
		underlineGreen: ["58;5;2", 59],
		underlineYellow: ["58;5;3", 59],
		underlineBlue: ["58;5;4", 59],
		underlineMagenta: ["58;5;5", 59],
		underlineCyan: ["58;5;6", 59],
		underlineWhite: ["58;5;7", 59],
		underlineBlackBright: ["58;5;8", 59],
		underlineGray: ["58;5;8", 59],
		underlineGrey: ["58;5;8", 59],
		underlineRedBright: ["58;5;9", 59],
		underlineGreenBright: ["58;5;10", 59],
		underlineYellowBright: ["58;5;11", 59],
		underlineBlueBright: ["58;5;12", 59],
		underlineMagentaBright: ["58;5;13", 59],
		underlineCyanBright: ["58;5;14", 59],
		underlineWhiteBright: ["58;5;15", 59]
	}
};
const modifierNames = Object.keys(styles$1.modifier);
const foregroundColorNames = Object.keys(styles$1.color);
const backgroundColorNames = Object.keys(styles$1.bgColor);
const underlineColorNames = Object.keys(styles$1.underlineColor);
const colorNames = [...foregroundColorNames, ...backgroundColorNames];
function assembleStyles() {
	const codes = /* @__PURE__ */ new Map();
	for (const [groupName, group] of Object.entries(styles$1)) {
		for (const [styleName, style] of Object.entries(group)) {
			styles$1[styleName] = {
				open: `\u{1B}[${style[0]}m`,
				close: `\u{1B}[${style[1]}m`
			};
			group[styleName] = styles$1[styleName];
			codes.set(Number.parseInt(style[0], 10), style[1]);
		}
		Object.defineProperty(styles$1, groupName, {
			value: group,
			enumerable: false
		});
	}
	Object.defineProperty(styles$1, "codes", {
		value: codes,
		enumerable: false
	});
	styles$1.color.close = "\x1B[39m";
	styles$1.bgColor.close = "\x1B[49m";
	styles$1.underlineColor.close = "\x1B[59m";
	styles$1.color.ansi = wrapAnsi16();
	styles$1.color.ansi256 = wrapAnsi256();
	styles$1.color.ansi16m = wrapAnsi16m();
	styles$1.bgColor.ansi = wrapAnsi16(ANSI_BACKGROUND_OFFSET);
	styles$1.bgColor.ansi256 = wrapAnsi256(ANSI_BACKGROUND_OFFSET);
	styles$1.bgColor.ansi16m = wrapAnsi16m(ANSI_BACKGROUND_OFFSET);
	styles$1.underlineColor.ansi = wrapUnderlineAnsi;
	styles$1.underlineColor.ansi256 = wrapAnsi256(ANSI_UNDERLINE_OFFSET);
	styles$1.underlineColor.ansi16m = wrapAnsi16m(ANSI_UNDERLINE_OFFSET);
	Object.defineProperties(styles$1, {
		rgbToAnsi256: {
			value(red, green, blue) {
				if (red === green && green === blue) {
					if (red < 8) return 16;
					if (red > 248) return 231;
					return Math.round((red - 8) / 247 * 24) + 232;
				}
				return 16 + 36 * Math.round(red / 255 * 5) + 6 * Math.round(green / 255 * 5) + Math.round(blue / 255 * 5);
			},
			enumerable: false
		},
		hexToRgb: {
			value(hex) {
				const matches = /[\da-f]{6}|[\da-f]{3}/i.exec(hex.toString(16));
				if (!matches) return [
					0,
					0,
					0
				];
				let [colorString] = matches;
				if (colorString.length === 3) colorString = [...colorString].map((character) => character + character).join("");
				const integer = Number.parseInt(colorString, 16);
				return [
					integer >> 16 & 255,
					integer >> 8 & 255,
					integer & 255
				];
			},
			enumerable: false
		},
		hexToAnsi256: {
			value: (hex) => styles$1.rgbToAnsi256(...styles$1.hexToRgb(hex)),
			enumerable: false
		},
		ansi256ToAnsi: {
			value(code) {
				if (code < 8) return 30 + code;
				if (code < 16) return 90 + (code - 8);
				let red;
				let green;
				let blue;
				if (code >= 232) {
					red = ((code - 232) * 10 + 8) / 255;
					green = red;
					blue = red;
				} else {
					code -= 16;
					const remainder = code % 36;
					red = Math.floor(code / 36) / 5;
					green = Math.floor(remainder / 6) / 5;
					blue = remainder % 6 / 5;
				}
				const value = Math.max(red, green, blue) * 2;
				if (value === 0) return 30;
				let result = 30 + (Math.round(blue) << 2 | Math.round(green) << 1 | Math.round(red));
				if (value === 2) result += 60;
				return result;
			},
			enumerable: false
		},
		rgbToAnsi: {
			value: (red, green, blue) => styles$1.ansi256ToAnsi(styles$1.rgbToAnsi256(red, green, blue)),
			enumerable: false
		},
		hexToAnsi: {
			value: (hex) => styles$1.ansi256ToAnsi(styles$1.hexToAnsi256(hex)),
			enumerable: false
		}
	});
	return styles$1;
}
const ansiStyles = assembleStyles();

//#endregion
//#region node_modules/.pnpm/chalk@6.0.0/node_modules/chalk/source/vendor/supports-color/browser.js
const level = (() => {
	if (!("navigator" in globalThis)) return 0;
	if (globalThis.navigator.userAgentData) {
		if (globalThis.navigator.userAgentData.brands.find(({ brand }) => brand === "Chromium")?.version > 93) return 3;
	}
	if (/\b(?:Chrome|Chromium)\//.test(globalThis.navigator.userAgent)) return 1;
	return 0;
})();
const colorSupport = level !== 0 && {
	level,
	hasBasic: true,
	has256: level >= 2,
	has16m: level >= 3
};
const supportsColor = {
	stdout: colorSupport,
	stderr: colorSupport
};

//#endregion
//#region node_modules/.pnpm/chalk@6.0.0/node_modules/chalk/source/index.js
const { stdout: stdoutColor, stderr: stderrColor } = supportsColor;
const GENERATOR = Symbol("GENERATOR");
const STYLER = Symbol("STYLER");
const IS_EMPTY = Symbol("IS_EMPTY");
const LEVEL = Symbol("LEVEL");
const styles = Object.create(null);
const assertValidLevel = (level) => {
	if (!Number.isSafeInteger(level) || level < 0 || level > 3) throw new Error("The `level` should be an integer from 0 to 3");
};
const levelDescriptor = {
	enumerable: true,
	get() {
		return this[LEVEL];
	},
	set(level) {
		assertValidLevel(level);
		this[LEVEL] = level;
	}
};
const applyOptions = (object, options = {}) => {
	if (options.level !== void 0) assertValidLevel(options.level);
	const colorLevel = stdoutColor ? stdoutColor.level : 0;
	object[LEVEL] = options.level === void 0 ? colorLevel : options.level;
};
var Chalk = class {
	constructor(options) {
		return chalkFactory(options);
	}
};
const chalkFactory = (options) => {
	const chalk = (...strings) => strings.join(" ");
	applyOptions(chalk, options);
	Object.setPrototypeOf(chalk, createChalk.prototype);
	return chalk;
};
function createChalk(options) {
	return chalkFactory(options);
}
Object.setPrototypeOf(createChalk.prototype, Function.prototype);
for (const [styleName, style] of Object.entries(ansiStyles)) styles[styleName] = { get() {
	const builder = createBuilder(this, createStyler(style.open, style.close, this[STYLER]), this[IS_EMPTY]);
	Object.defineProperty(this, styleName, { value: builder });
	return builder;
} };
styles.visible = { get() {
	const builder = createBuilder(this, this[STYLER], true);
	Object.defineProperty(this, "visible", { value: builder });
	return builder;
} };
const createModelConverters = (model, type) => {
	const style = ansiStyles[type];
	if (model === "rgb") {
		const ansi = (red, green, blue) => style.ansi(ansiStyles.rgbToAnsi(red, green, blue));
		const ansi256 = (red, green, blue) => style.ansi256(ansiStyles.rgbToAnsi256(red, green, blue));
		return [
			ansi,
			ansi,
			ansi256,
			style.ansi16m
		];
	}
	if (model === "hex") {
		const ansi = (hex) => style.ansi(ansiStyles.hexToAnsi(hex));
		const ansi256 = (hex) => style.ansi256(ansiStyles.hexToAnsi256(hex));
		return [
			ansi,
			ansi,
			ansi256,
			(hex) => style.ansi16m(...ansiStyles.hexToRgb(hex))
		];
	}
	const ansi = (code) => style.ansi(ansiStyles.ansi256ToAnsi(code));
	return [
		ansi,
		ansi,
		style.ansi256,
		style.ansi256
	];
};
for (const model of [
	"rgb",
	"hex",
	"ansi256"
]) {
	const capitalizedModel = model[0].toUpperCase() + model.slice(1);
	for (const [styleName, type] of [
		[model, "color"],
		["bg" + capitalizedModel, "bgColor"],
		["underline" + capitalizedModel, "underlineColor"]
	]) {
		const { close } = ansiStyles[type];
		const converters = createModelConverters(model, type);
		styles[styleName] = { get() {
			const styleFunction = function(first, second, third) {
				const open = converters[this.level](first, second, third);
				return createBuilder(this, createStyler(open, close, this[STYLER]), this[IS_EMPTY]);
			};
			Object.defineProperty(this, styleName, { value: styleFunction });
			return styleFunction;
		} };
	}
}
const proto = Object.defineProperties(() => {}, {
	...styles,
	level: {
		enumerable: true,
		get() {
			return this[GENERATOR].level;
		},
		set(level) {
			this[GENERATOR].level = level;
		}
	}
});
const createStyler = (open, close, parent) => {
	let openAll;
	let closeAll;
	if (parent === void 0) {
		openAll = open;
		closeAll = close;
	} else {
		openAll = parent.openAll + open;
		closeAll = close + parent.closeAll;
	}
	return {
		open,
		close,
		openAll,
		closeAll,
		parent
	};
};
const createBuilder = (self, _styler, _isEmpty) => {
	const builder = (...arguments_) => {
		if (arguments_.length === 1) return applyStyle(builder, "" + arguments_[0]);
		if (arguments_.length === 2) return applyStyle(builder, arguments_[0] + " " + arguments_[1]);
		return applyStyle(builder, arguments_.join(" "));
	};
	Object.setPrototypeOf(builder, proto);
	builder[GENERATOR] = self[GENERATOR] ?? self;
	builder[STYLER] = _styler;
	builder[IS_EMPTY] = _isEmpty;
	return builder;
};
const applyStyle = (self, string) => {
	if (self[GENERATOR][LEVEL] <= 0 || !string) return self[IS_EMPTY] ? "" : string;
	let styler = self[STYLER];
	if (styler === void 0) return string;
	const { openAll, closeAll } = styler;
	if (string.includes("\x1B")) while (styler !== void 0) {
		string = stringReplaceAll(string, styler.close, styler.open);
		styler = styler.parent;
	}
	const lfIndex = string.indexOf("\n");
	if (lfIndex !== -1) string = stringEncaseCRLFWithFirstIndex(string, closeAll, openAll, lfIndex);
	return openAll + string + closeAll;
};
Object.defineProperties(createChalk.prototype, {
	...styles,
	level: levelDescriptor
});
const chalk = createChalk();
const chalkStderr = createChalk({ level: stderrColor ? stderrColor.level : 0 });

//#endregion
//#region node_modules/.pnpm/xshell@1.4.38_supports-color@7.2.0/node_modules/xshell/chalk.browser.js
const { red: red$1, green: green$1, yellow: yellow$1, blue: blue$1, magenta: magenta$1, cyan: cyan$1, gray, redBright: red_, greenBright: green_, yellowBright: yellow_, blueBright: blue_, magentaBright: magenta_, cyanBright: cyan_, underline } = new Chalk({ level: 2 });

//#endregion
//#region node_modules/.pnpm/xshell@1.4.38_supports-color@7.2.0/node_modules/xshell/utils.browser.js
async function pause(milliseconds = 3e3) {
	await delay$1(milliseconds);
	debugger;
}
globalThis.pause = pause;
async function load_script(url, type) {
	return new Promise((resolve, reject) => {
		let $script = document.createElement("script");
		$script.src = url;
		$script.async = true;
		$script.onload = resolve;
		$script.onerror = reject;
		if (type) $script.type = type;
		document.head.appendChild($script);
	});
}

//#endregion
//#region node_modules/.pnpm/xshell@1.4.38_supports-color@7.2.0/node_modules/xshell/io.common.js
let buf = /* @__PURE__ */ new Uint8Array(0);
let dv = buf.dataview;
let buffer = new Uint8Array(8 * 2 ** 20);
let dataview = buffer.dataview;

//#endregion
//#region node_modules/.pnpm/xshell@1.4.38_supports-color@7.2.0/node_modules/xshell/net.common.js
var WebSocketConnectionError = class WebSocketConnectionError extends Error {
	name = "WebSocketConnectionError";
	url;
	protocols;
	type;
	code;
	reason;
	event;
	address;
	errno;
	port;
	syscall;
	static get_reason_string(code, reason) {
		if (!reason) {
			if (code === 1001) reason = t$2("对端关闭");
			else if (code === 1006) reason = t$2("网络中断");
		}
		return reason ? `${reason} (${code})` : code;
	}
	constructor(url, protocols, event, message) {
		let type, reason, code, error;
		if (!message) if (event) if ((type = event.type) === "error") {
			({error} = event);
			message = error ? `${t$2("连接被关闭")}: ${error.message}` : t$2("连接被关闭");
		} else {
			({code, reason} = event);
			message = `${t$2("连接被关闭")}: ${WebSocketConnectionError.get_reason_string(code, reason)}`;
		}
		else message = t$2("连接被关闭");
		super(nowstr() + "  " + (url || "传入") + (protocols ? " " + protocols.join(", ").bracket() : "") + " " + message);
		this.url = url;
		this.protocols = protocols;
		if (!event) return;
		this.type = type;
		this.code = code;
		this.reason = reason;
		if (type === "error" && platform.nodejs) {
			this.cause = error;
			this.address = error.address;
			this.errno = error.errno;
			this.port = error.port;
			this.syscall = error.syscall;
		}
		this.event = event;
	}
};
let websocket_proxy_agents = {};
async function connect_websocket(url, { print = {
	connect: true,
	error: true,
	close: true
}, protocols, max_payload = 2 ** 33, proxy, keep_alive_duration, on_message, on_error, on_close, connect }) {
	const { nodejs } = platform;
	if (typeof print === "boolean") print = {
		connect: print,
		error: print,
		close: print
	};
	if (keep_alive_duration) check(nodejs, "keep_alive_duration 仅 nodejs 环境有效");
	let websocket = new (await (platform.get_websocket()))(url, protocols, nodejs ? {
		maxPayload: max_payload,
		maxFragments: 0,
		maxBufferedChunks: 0,
		maxBufferedBytes: 0,
		skipUTF8Validation: true,
		allowSynchronousEvents: true,
		...proxy ? { agent: websocket_proxy_agents[proxy] ??= new (await (platform.get_socks_proxy_agent()))(proxy) } : {},
		...connect ? { createConnection: connect } : {}
	} : void 0);
	websocket.binaryType = "arraybuffer";
	let pwebsocket = defer2();
	websocket.addEventListener("open", (event) => {
		if (print.connect) console.log(websocket.url + (websocket.protocol ? " " + websocket.protocol.bracket() : "") + t$2(" 已连接"));
		if (keep_alive_duration) websocket._socket.setKeepAlive(true, keep_alive_duration);
		pwebsocket.resolve(websocket);
	}, { once: true });
	let errored;
	function on_close_or_error(event) {
		const { type } = event;
		if (type === "close" && event.code === 1e3) {
			if (on_close) on_close(event, websocket);
			else if (print.close) console.log(`${websocket.url} ${t$2("已正常关闭")}`);
			return;
		}
		if (errored) return;
		errored = type;
		const error = new WebSocketConnectionError(websocket.url, protocols, event);
		if (!pwebsocket.settled) pwebsocket.reject(error);
		else if (on_error) on_error(error, websocket);
		else if (print.error) console.error(error.message);
	}
	websocket.addEventListener("error", (event) => {
		if (nodejs) on_close_or_error(event);
		else setTimeout(() => {
			on_close_or_error(event);
		});
	}, { once: true });
	websocket.addEventListener("close", on_close_or_error, { once: true });
	websocket.addEventListener("message", (event) => {
		on_message(event.data, websocket);
	});
	return pwebsocket;
}

//#endregion
//#region node_modules/.pnpm/dolphindb@3.1.56_supports-color@7.2.0/node_modules/dolphindb/i18n/dict.json
var dict_default$1 = {
	暂时不支持序列化: { "en": "serialization is not currently supported" },
	"不能自动转换 {{type}} 至 DdbObj": { "en": "cannot automatically convert {{type}} to DdbObj" },
	"form 必须是 DdbForm.table, 否则不能 to_rows": { "en": "form must be DdbForm.table, otherwise it cannot to_rows" },
	"this.form 必须是 DdbForm.dict, 否则不能调用 to_dict 转换为 js object": { "en": "this.form must be DdbForm.dict, otherwise to_dict cannot be called to convert to js object" },
	"当前只支持自动转换 dict<string, any | ...dictables> 为 js object": { "en": "currently api only supports automatic conversion of dict<string, any | ...dictables> to js object" },
	"deep = true 时必须设置 strip = true": { "en": "strip = true must be set when deep = true" },
	"timestamp 字符串长度必须等于格式串长度": { "en": "the length of the timestamp string must be equal to the length of the format string" },
	"格式串必须包含秒的格式 (ss)": { "en": "the format string must contain the format for seconds (ss)" },
	"格式串必须包含纳秒的格式 (SSSSSSSSS)": { "en": "format string must contain nanosecond format (SSSSSSSSS)" },
	"nanotimestamp 字符串长度必须等于格式串长度": { "en": "nanotimestamp string length must be equal to format string length" },
	"指定 node 时必须设置 func_type": { "en": "func_type must be set when specifying node" },
	"variable 指令参数不能为空且参数名不能为空，且数量应该匹配": { "en": "variable command parameter cannot be empty and parameter name cannot be empty, and the number should match" },
	"session id 从 {{sid}} 变为 {{sid_}}": { "en": "session id changed from {{sid}} to {{sid_}}" },
	"订阅流表成功:": { "en": "subscribed to streaming table:" },
	"vector {{type}} 暂不支持序列化": { "en": "vector {{type}} serialization is not currently supported" },
	"form 必须是 DdbForm.table, 否则不能 to_cols": { "en": "form must be DdbForm.table, otherwise it cannot to_cols" },
	"这是在调用 this.rpc 之前默认的 on_message, 不应该被调用到，除非建立连接后 server 先推送了 message": { "en": "This is the default on_message before calling this.rpc, it should not be called unless the server pushes the message first after the connection is established" },
	" 暂时不支持解析": { "en": " parsing is currently not supported" },
	"array vector 存在非法 unit: {{unit}}": { "en": "array vector has invalid unit: {{unit}}" },
	" 暂时不支持序列化": { "en": " serialization is currently not supported" },
	"print 消息的 buffer 应该以 \\0 结束": { "en": "The buffer of the print message should end with \\0" },
	"print 消息的 buffer 中间不应该有 \\0": { "en": "There should not be \\0 in the buffer of the print message" },
	已断开: { "en": "is already disconnected" },
	"连接出错了，可能由于网络原因连接已被关闭，或服务器断开连接": { "en": "connection errored. The connection may have been closed due to network reasons, or the server disconnected" },
	"new DdbBlob 不能传空的 value": { "en": "new DdbBlob cannot pass an empty value" },
	"{{form}}<{{type}}> 暂时不支持解析": { "en": "cannot parse {{form}}<{{type}}>" },
	"流数据订阅后一定先返回 schema": { "en": "After subscribing to streaming data, the schema must be returned first." },
	"{{form}} {{type}} 暂不支持 data()": { "en": "{{form}} {{type}} does not support data() yet" },
	" 暂时不支持转换为 js 对象": { "en": " conversion to js object is not supported at the moment" },
	"{{time}} 心跳检测失败，连接已断开": { "en": "{{time}} heartbeat detection failed, the connection has been disconnected" },
	"pack 时字符串中间不能含有 \\0, 否则上传给 DolphinDB 会导致连接断开": { "en": "The string cannot contain \\0 in the middle when packing, otherwise uploading to DolphinDB will cause the connection to be disconnected" },
	"发送至 DolphinDB 执行的脚本中间不能含有 \\0": { "en": "The script sent to DolphinDB for execution cannot contain \\0 in the middle" },
	"调用 ddb.invoke 的参数中不能同时有 DdbObj 与复杂 js 原生对象": { "en": "The parameters of calling ddb.invoke cannot contain both DdbObj and complex js native objects" },
	"iife 执行的脚本行数应该至少为 2 行": { "en": "The number of script lines executed by iife should be at least 2" },
	"iotany sub vector 不支持非 vector 类型": { "en": "iotany sub vector does not support non-vector types" },
	"iotany 的 meta vector 长度至少为 2": { "en": "The length of the iotany meta vector is at least 2" },
	"value 不能转换为 {{classname}}": { "en": "value cannot be converted to {{classname}}" },
	"DDB.define 方法传入的 definition 不符合函数定义格式": { "en": "The definition passed in by the DDB.define method does not conform to the function definition format" },
	"DDB.define 方法传入的 definition 不符合函数定义格式 def xxx ()": { "en": "The definition passed in by the DDB.define method does not conform to the function definition format def xxx ()" },
	"{{form}} 暂不支持序列化": { "en": "{{form}} does not support serialization yet" },
	"value 不能转换为 {{typename}}": { "en": "value cannot be converted to {{typename}}" },
	"ddb.cancel 无 ticket，尝试通过密码 login 失败": { "en": "ddb.cancel has no ticket, attempt to login using password failed" }
};

//#endregion
//#region node_modules/.pnpm/dolphindb@3.1.56_supports-color@7.2.0/node_modules/dolphindb/i18n/index.js
let i18n$1 = new I18N(dict_default$1);
const { t: t$1, language: language$1 } = i18n$1;

//#endregion
//#region node_modules/.pnpm/dayjs@1.11.23/node_modules/dayjs/dayjs.min.js
var require_dayjs_min = /* @__PURE__ */ __commonJS({ "node_modules/.pnpm/dayjs@1.11.23/node_modules/dayjs/dayjs.min.js": ((exports, module) => {
	(function(t, e) {
		"object" == typeof exports && "undefined" != typeof module ? module.exports = e() : "function" == typeof define && define.amd ? define(e) : (t = "undefined" != typeof globalThis ? globalThis : t || self).dayjs = e();
	})(exports, (function() {
		"use strict";
		var t = 1e3, e = 6e4, n = 36e5, r = "millisecond", i = "second", s = "minute", u = "hour", a = "day", o = "week", c = "month", f = "quarter", h = "year", d = "date", l = "Invalid Date", $ = /^(\d{4})[-/]?(\d{1,2})?[-/]?(\d{0,2})[Tt\s]*(\d{1,2})?:?(\d{1,2})?:?(\d{1,2})?[.:]?(\d+)?$/, y = /\[([^\]]+)]|YYYY|YY|M{1,4}|D{1,2}|d{1,4}|H{1,2}|h{1,2}|a|A|m{1,2}|s{1,2}|Z{1,2}|SSS/g, M = {
			name: "en",
			weekdays: "Sunday_Monday_Tuesday_Wednesday_Thursday_Friday_Saturday".split("_"),
			months: "January_February_March_April_May_June_July_August_September_October_November_December".split("_"),
			ordinal: function(t) {
				var e = [
					"th",
					"st",
					"nd",
					"rd"
				], n = t % 100;
				return "[" + t + (e[(n - 20) % 10] || e[n] || e[0]) + "]";
			}
		}, m = function(t, e, n) {
			var r = String(t);
			return !r || r.length >= e ? t : "" + Array(e + 1 - r.length).join(n) + t;
		}, v = {
			s: m,
			z: function(t) {
				var e = -t.utcOffset(), n = Math.abs(e), r = Math.floor(n / 60), i = n % 60;
				return (e <= 0 ? "+" : "-") + m(r, 2, "0") + ":" + m(i, 2, "0");
			},
			m: function t(e, n) {
				if (e.date() < n.date()) return -t(n, e);
				var r = 12 * (n.year() - e.year()) + (n.month() - e.month()), i = e.clone().add(r, c), s = n - i < 0, u = e.clone().add(r + (s ? -1 : 1), c);
				return +(-(r + (n - i) / (s ? i - u : u - i)) || 0);
			},
			a: function(t) {
				return t < 0 ? Math.ceil(t) || 0 : Math.floor(t);
			},
			p: function(t) {
				return {
					M: c,
					y: h,
					w: o,
					d: a,
					D: d,
					h: u,
					m: s,
					s: i,
					ms: r,
					Q: f
				}[t] || String(t || "").toLowerCase().replace(/s$/, "");
			},
			u: function(t) {
				return void 0 === t;
			}
		}, g = "en", D = {};
		D[g] = M;
		var p = "$isDayjsObject", S = function(t) {
			return t instanceof _ || !(!t || !t[p]);
		}, w = function t(e, n, r) {
			var i;
			if (!e) return g;
			if ("string" == typeof e) {
				var s = e.toLowerCase();
				D[s] && (i = s), n && (D[s] = n, i = s);
				var u = e.split("-");
				if (!i && u.length > 1) return t(u[0]);
			} else {
				var a = e.name;
				D[a] = e, i = a;
			}
			return !r && i && (g = i), i || !r && g;
		}, O = function(t, e) {
			if (S(t)) return t.clone();
			var n = "object" == typeof e ? e : {};
			return n.date = t, n.args = arguments, new _(n);
		}, b = v;
		b.l = w, b.i = S, b.w = function(t, e) {
			return O(t, {
				locale: e.$L,
				utc: e.$u,
				x: e.$x,
				$offset: e.$offset
			});
		};
		var _ = function() {
			function M(t) {
				this.$L = w(t.locale, null, !0), this.parse(t), this.$x = this.$x || t.x || {}, this[p] = !0;
			}
			var m = M.prototype;
			return m.parse = function(t) {
				this.$d = function(t) {
					var e = t.date, n = t.utc;
					if (null === e) return /* @__PURE__ */ new Date(NaN);
					if (b.u(e)) return /* @__PURE__ */ new Date();
					if (e instanceof Date) return new Date(e);
					if ("string" == typeof e && !/Z$/i.test(e)) {
						var r = e.match($);
						if (r) {
							var i = r[2] - 1 || 0, s = (r[7] || "0").substring(0, 3);
							return n ? new Date(Date.UTC(r[1], i, r[3] || 1, r[4] || 0, r[5] || 0, r[6] || 0, s)) : new Date(r[1], i, r[3] || 1, r[4] || 0, r[5] || 0, r[6] || 0, s);
						}
					}
					return new Date(e);
				}(t), this.init();
			}, m.init = function() {
				var t = this.$d;
				this.$y = t.getFullYear(), this.$M = t.getMonth(), this.$D = t.getDate(), this.$W = t.getDay(), this.$H = t.getHours(), this.$m = t.getMinutes(), this.$s = t.getSeconds(), this.$ms = t.getMilliseconds();
			}, m.$utils = function() {
				return b;
			}, m.isValid = function() {
				return !(this.$d.toString() === l);
			}, m.isSame = function(t, e) {
				var n = O(t);
				return this.startOf(e) <= n && n <= this.endOf(e);
			}, m.isAfter = function(t, e) {
				return O(t) < this.startOf(e);
			}, m.isBefore = function(t, e) {
				return this.endOf(e) < O(t);
			}, m.$g = function(t, e, n) {
				return b.u(t) ? this[e] : this.set(n, t);
			}, m.unix = function() {
				return Math.floor(this.valueOf() / 1e3);
			}, m.valueOf = function() {
				return this.$d.getTime();
			}, m.startOf = function(t, e) {
				var n = this, r = !!b.u(e) || e, f = b.p(t), l = function(t, e) {
					var i = b.w(n.$u ? Date.UTC(n.$y, e, t) : new Date(n.$y, e, t), n);
					return r ? i : i.endOf(a);
				}, $ = function(t, e) {
					return b.w(n.toDate()[t].apply(n.toDate("s"), (r ? [
						0,
						0,
						0,
						0
					] : [
						23,
						59,
						59,
						999
					]).slice(e)), n);
				}, y = this.$W, M = this.$M, m = this.$D, v = "set" + (this.$u ? "UTC" : "");
				switch (f) {
					case h: return r ? l(1, 0) : l(31, 11);
					case c: return r ? l(1, M) : l(0, M + 1);
					case o:
						var g = this.$locale().weekStart || 0, D = (y < g ? y + 7 : y) - g;
						return l(r ? m - D : m + (6 - D), M);
					case a:
					case d: return $(v + "Hours", 0);
					case u: return $(v + "Minutes", 1);
					case s: return $(v + "Seconds", 2);
					case i: return $(v + "Milliseconds", 3);
					default: return this.clone();
				}
			}, m.endOf = function(t) {
				return this.startOf(t, !1);
			}, m.$set = function(t, e) {
				var n, o = b.p(t), f = "set" + (this.$u ? "UTC" : ""), l = (n = {}, n[a] = f + "Date", n[d] = f + "Date", n[c] = f + "Month", n[h] = f + "FullYear", n[u] = f + "Hours", n[s] = f + "Minutes", n[i] = f + "Seconds", n[r] = f + "Milliseconds", n)[o], $ = o === a ? this.$D + (e - this.$W) : e;
				if (o === c || o === h) {
					var y = this.clone().set(d, 1);
					y.$d[l]($), y.init(), this.$d = y.set(d, Math.min(this.$D, y.daysInMonth())).$d;
				} else l && this.$d[l]($);
				return this.init(), this;
			}, m.set = function(t, e) {
				return this.clone().$set(t, e);
			}, m.get = function(t) {
				return this[b.p(t)]();
			}, m.add = function(r, f) {
				var d, l = this;
				r = Number(r);
				var $ = b.p(f), y = function(t) {
					var e = O(l);
					return b.w(e.date(e.date() + Math.round(t * r)), l);
				};
				if ($ === c) return this.set(c, this.$M + r);
				if ($ === h) return this.set(h, this.$y + r);
				if ($ === a) return y(1);
				if ($ === o) return y(7);
				var M = (d = {}, d[s] = e, d[u] = n, d[i] = t, d)[$] || 1, m = this.$d.getTime() + r * M;
				return b.w(m, this);
			}, m.subtract = function(t, e) {
				return this.add(-1 * t, e);
			}, m.format = function(t) {
				var e = this, n = this.$locale();
				if (!this.isValid()) return n.invalidDate || l;
				var r = t || "YYYY-MM-DDTHH:mm:ssZ", i = b.z(this), s = this.$H, u = this.$m, a = this.$M, o = n.weekdays, c = n.months, f = n.meridiem, h = function(t, n, i, s) {
					return t && (t[n] || t(e, r)) || i[n].slice(0, s);
				}, d = function(t) {
					return b.s(s % 12 || 12, t, "0");
				}, $ = f || function(t, e, n) {
					var r = t < 12 ? "AM" : "PM";
					return n ? r.toLowerCase() : r;
				};
				return r.replace(y, (function(t, r) {
					return r || function(t) {
						switch (t) {
							case "YY": return String(e.$y).slice(-2);
							case "YYYY": return b.s(e.$y, 4, "0");
							case "M": return a + 1;
							case "MM": return b.s(a + 1, 2, "0");
							case "MMM": return h(n.monthsShort, a, c, 3);
							case "MMMM": return h(c, a);
							case "D": return e.$D;
							case "DD": return b.s(e.$D, 2, "0");
							case "d": return String(e.$W);
							case "dd": return h(n.weekdaysMin, e.$W, o, 2);
							case "ddd": return h(n.weekdaysShort, e.$W, o, 3);
							case "dddd": return o[e.$W];
							case "H": return String(s);
							case "HH": return b.s(s, 2, "0");
							case "h": return d(1);
							case "hh": return d(2);
							case "a": return $(s, u, !0);
							case "A": return $(s, u, !1);
							case "m": return String(u);
							case "mm": return b.s(u, 2, "0");
							case "s": return String(e.$s);
							case "ss": return b.s(e.$s, 2, "0");
							case "SSS": return b.s(e.$ms, 3, "0");
							case "Z": return i;
						}
						return null;
					}(t) || i.replace(":", "");
				}));
			}, m.utcOffset = function() {
				return 15 * -Math.round(this.$d.getTimezoneOffset() / 15);
			}, m.diff = function(r, d, l) {
				var $, y = this, M = b.p(d), m = O(r), v = (m.utcOffset() - this.utcOffset()) * e, g = this - m, D = function() {
					return b.m(y, m);
				};
				switch (M) {
					case h:
						$ = D() / 12;
						break;
					case c:
						$ = D();
						break;
					case f:
						$ = D() / 3;
						break;
					case o:
						$ = (g - v) / 6048e5;
						break;
					case a:
						$ = (g - v) / 864e5;
						break;
					case u:
						$ = g / n;
						break;
					case s:
						$ = g / e;
						break;
					case i:
						$ = g / t;
						break;
					default: $ = g;
				}
				return l ? $ : b.a($);
			}, m.daysInMonth = function() {
				return this.endOf(c).$D;
			}, m.$locale = function() {
				return D[this.$L];
			}, m.locale = function(t, e) {
				if (!t) return this.$L;
				var n = this.clone(), r = w(t, e, !0);
				return r && (n.$L = r), n;
			}, m.clone = function() {
				return b.w(this.$d, this);
			}, m.toDate = function() {
				return new Date(this.valueOf());
			}, m.toJSON = function() {
				return this.isValid() ? this.toISOString() : null;
			}, m.toISOString = function() {
				return this.$d.toISOString();
			}, m.toString = function() {
				return this.$d.toUTCString();
			}, M;
		}(), Y = _.prototype;
		return O.prototype = Y, [
			["$ms", r],
			["$s", i],
			["$m", s],
			["$H", u],
			["$W", a],
			["$M", c],
			["$y", h],
			["$D", d]
		].forEach((function(t) {
			Y[t[1]] = function(e) {
				return this.$g(e, t[0], t[1]);
			};
		})), O.extend = function(t, e) {
			return t.$i || (t(e, _, O), t.$i = !0), O;
		}, O.locale = w, O.isDayjs = S, O.unix = function(t) {
			return O(1e3 * t);
		}, O.en = D[g], O.Ls = D, O.p = {}, O;
	}));
}) });

//#endregion
//#region node_modules/.pnpm/dayjs@1.11.23/node_modules/dayjs/plugin/customParseFormat.js
var require_customParseFormat = /* @__PURE__ */ __commonJS({ "node_modules/.pnpm/dayjs@1.11.23/node_modules/dayjs/plugin/customParseFormat.js": ((exports, module) => {
	(function(e, t) {
		"object" == typeof exports && "undefined" != typeof module ? module.exports = t() : "function" == typeof define && define.amd ? define(t) : (e = "undefined" != typeof globalThis ? globalThis : e || self).dayjs_plugin_customParseFormat = t();
	})(exports, (function() {
		"use strict";
		var e = {
			LTS: "h:mm:ss A",
			LT: "h:mm A",
			L: "MM/DD/YYYY",
			LL: "MMMM D, YYYY",
			LLL: "MMMM D, YYYY h:mm A",
			LLLL: "dddd, MMMM D, YYYY h:mm A"
		}, t = /(\[[^[]*\])|([-_:/.,()\s]+)|(A|a|Q|YYYY|YY?|ww?|MM?M?M?|Do|DD?|hh?|HH?|mm?|ss?|S{1,3}|z|ZZ?)/g, n = /\d/, r = /\d\d/, i = /\d\d?/, o = /\d*[^-_:/,()\s\d]+/, s = {}, a = function(e) {
			return (e = +e) + (e > 68 ? 1900 : 2e3);
		};
		var f = function(e) {
			return function(t) {
				this[e] = +t;
			};
		}, h = [/[+-]\d\d:?(\d\d)?|Z/, function(e) {
			(this.zone || (this.zone = {})).offset = function(e) {
				if (!e) return 0;
				if ("Z" === e) return 0;
				var t = e.match(/([+-]|\d\d)/g), n = 60 * t[1] + (+t[2] || 0);
				return 0 === n ? 0 : "+" === t[0] ? -n : n;
			}(e);
		}], u = function(e) {
			var t = s[e];
			return t && (t.indexOf ? t : t.s.concat(t.f));
		}, d = function(e, t) {
			var n, r = s.meridiem;
			if (r) {
				for (var i = 1; i <= 24; i += 1) if (e.indexOf(r(i, 0, t)) > -1) {
					n = i > 12;
					break;
				}
			} else n = e === (t ? "pm" : "PM");
			return n;
		}, c = {
			A: [o, function(e) {
				this.afternoon = d(e, !1);
			}],
			a: [o, function(e) {
				this.afternoon = d(e, !0);
			}],
			Q: [n, function(e) {
				this.month = 3 * (e - 1) + 1;
			}],
			S: [n, function(e) {
				this.milliseconds = 100 * +e;
			}],
			SS: [r, function(e) {
				this.milliseconds = 10 * +e;
			}],
			SSS: [/\d{3}/, function(e) {
				this.milliseconds = +e;
			}],
			s: [i, f("seconds")],
			ss: [i, f("seconds")],
			m: [i, f("minutes")],
			mm: [i, f("minutes")],
			H: [i, f("hours")],
			h: [i, f("hours")],
			HH: [i, f("hours")],
			hh: [i, f("hours")],
			D: [i, f("day")],
			DD: [r, f("day")],
			Do: [o, function(e) {
				var t = s.ordinal, n = e.match(/\d+/);
				if (this.day = n[0], t) for (var r = 1; r <= 31; r += 1) t(r).replace(/\[|\]/g, "") === e && (this.day = r);
			}],
			w: [i, f("week")],
			ww: [r, f("week")],
			M: [i, f("month")],
			MM: [r, f("month")],
			MMM: [o, function(e) {
				var t = u("months"), n = (u("monthsShort") || t.map((function(e) {
					return e.slice(0, 3);
				}))).indexOf(e) + 1;
				if (n < 1) throw new Error();
				this.month = n % 12 || n;
			}],
			MMMM: [o, function(e) {
				var t = u("months").indexOf(e) + 1;
				if (t < 1) throw new Error();
				this.month = t % 12 || t;
			}],
			Y: [/[+-]?\d+/, f("year")],
			YY: [r, function(e) {
				this.year = a(e);
			}],
			YYYY: [/\d{4}/, f("year")],
			Z: h,
			ZZ: h
		};
		function l(n) {
			var r = n, i = s && s.formats;
			for (var o = (n = r.replace(/(\[[^\]]+])|(LTS?|l{1,4}|L{1,4})/g, (function(t, n, r) {
				var o = r && r.toUpperCase();
				return n || i[r] || e[r] || i[o].replace(/(\[[^\]]+])|(MMMM|MM|DD|dddd)/g, (function(e, t, n) {
					return t || n.slice(1);
				}));
			}))).match(t), a = o.length, f = 0; f < a; f += 1) {
				var h = o[f], u = c[h], d = u && u[0], l = u && u[1];
				o[f] = l ? {
					regex: d,
					parser: l
				} : h.replace(/^\[|\]$/g, "");
			}
			return function(e) {
				for (var t = {}, n = 0, r = 0; n < a; n += 1) {
					var i = o[n];
					if ("string" == typeof i) r += i.length;
					else {
						var s = i.regex, f = i.parser, h = e.slice(r), u = s.exec(h)[0];
						f.call(t, u), e = e.replace(u, "");
					}
				}
				return function(e) {
					var t = e.afternoon;
					if (void 0 !== t) {
						var n = e.hours;
						t ? n < 12 && (e.hours += 12) : 12 === n && (e.hours = 0), delete e.afternoon;
					}
				}(t), t;
			};
		}
		return function(e, t, n) {
			n.p.customParseFormat = !0, e && e.parseTwoDigitYear && (a = e.parseTwoDigitYear);
			var r = t.prototype, i = r.parse;
			r.parse = function(e) {
				var t = e.date, r = e.utc, o = e.args;
				this.$u = r;
				var a = o[1];
				if ("string" == typeof a) {
					var f = !0 === o[2], h = !0 === o[3], u = f || h, d = o[2];
					h && (d = o[2]), s = this.$locale(), !f && d && (s = n.Ls[d]), this.$d = function(e, t, n, r) {
						try {
							if (["x", "X"].indexOf(t) > -1) return /* @__PURE__ */ new Date(("X" === t ? 1e3 : 1) * e);
							var i = l(t)(e), o = i.year, s = i.month, a = i.day, f = i.hours, h = i.minutes, u = i.seconds, d = i.milliseconds, c = i.zone, m = i.week, M = /* @__PURE__ */ new Date(), Y = a || (o || s ? 1 : M.getDate()), p = o || M.getFullYear(), v = 0;
							o && !s || (v = s > 0 ? s - 1 : M.getMonth());
							var D, w = f || 0, g = h || 0, y = u || 0, L = d || 0;
							return c ? new Date(Date.UTC(p, v, Y, w, g, y, L + 60 * c.offset * 1e3)) : n ? new Date(Date.UTC(p, v, Y, w, g, y, L)) : (D = new Date(p, v, Y, w, g, y, L), m && (D = r(D).week(m).toDate()), D);
						} catch (e) {
							return /* @__PURE__ */ new Date("");
						}
					}(t, a, r, n), this.init(), d && !0 !== d && (this.$L = this.locale(d).$L), u && t != this.format(a) && (this.$d = /* @__PURE__ */ new Date("")), s = {};
				} else if (a instanceof Array) for (var c = a.length, m = 1; m <= c; m += 1) {
					o[1] = a[m - 1];
					var M = n.apply(this, o);
					if (M.isValid()) {
						this.$d = M.$d, this.$L = M.$L, this.init();
						break;
					}
					m === c && (this.$d = /* @__PURE__ */ new Date(""));
				}
				else i.call(this, e);
			};
		};
	}));
}) });

//#endregion
//#region node_modules/.pnpm/ipaddr.js@2.5.0/node_modules/ipaddr.js/lib/ipaddr.js
var require_ipaddr = /* @__PURE__ */ __commonJS({ "node_modules/.pnpm/ipaddr.js@2.5.0/node_modules/ipaddr.js/lib/ipaddr.js": ((exports, module) => {
	(function(root) {
		"use strict";
		const ipv4Part = "(0?\\d+|0x[a-f0-9]+)";
		const ipv4Regexes = {
			fourOctet: new RegExp(`^${ipv4Part}\\.${ipv4Part}\\.${ipv4Part}\\.${ipv4Part}$`, "i"),
			threeOctet: new RegExp(`^${ipv4Part}\\.${ipv4Part}\\.${ipv4Part}$`, "i"),
			twoOctet: new RegExp(`^${ipv4Part}\\.${ipv4Part}$`, "i"),
			longValue: new RegExp(`^${ipv4Part}$`, "i")
		};
		const octalRegex = new RegExp(`^0[0-7]+$`, "i");
		const hexRegex = new RegExp(`^0x[a-f0-9]+$`, "i");
		const zoneIndex = "%[0-9a-z]{1,}";
		const ipv6Part = "(?:[0-9a-f]+::?)+";
		const ipv6Regexes = {
			zoneIndex: new RegExp(zoneIndex, "i"),
			"native": new RegExp(`^(::)?(${ipv6Part})?([0-9a-f]+)?(::)?(${zoneIndex})?$`, "i"),
			deprecatedTransitional: new RegExp(`^(?:::)(${ipv4Part}\\.${ipv4Part}\\.${ipv4Part}\\.${ipv4Part}(${zoneIndex})?)$`, "i"),
			transitional: new RegExp(`^((?:${ipv6Part})|(?:::)(?:${ipv6Part})?)${ipv4Part}\\.${ipv4Part}\\.${ipv4Part}\\.${ipv4Part}(${zoneIndex})?$`, "i")
		};
		function expandIPv6(string, parts) {
			if (string.indexOf("::") !== string.lastIndexOf("::")) return null;
			let colonCount = 0;
			let lastColon = -1;
			let zoneId = (string.match(ipv6Regexes.zoneIndex) || [])[0];
			let replacement, replacementCount;
			if (zoneId) {
				zoneId = zoneId.substring(1);
				string = string.replace(/%.+$/, "");
			}
			while ((lastColon = string.indexOf(":", lastColon + 1)) >= 0) colonCount++;
			if (string.substr(0, 2) === "::") colonCount--;
			if (string.substr(-2, 2) === "::") colonCount--;
			if (colonCount >= parts) return null;
			replacementCount = parts - colonCount;
			replacement = ":";
			while (replacementCount--) replacement += "0:";
			string = string.replace("::", replacement);
			if (string[0] === ":") string = string.slice(1);
			if (string[string.length - 1] === ":") string = string.slice(0, -1);
			parts = (function() {
				const ref = string.split(":");
				const results = [];
				for (let i = 0; i < ref.length; i++) results.push(ref[i].length > 4 ? NaN : parseInt(ref[i], 16));
				return results;
			})();
			return {
				parts,
				zoneId
			};
		}
		function matchCIDR(first, second, partSize, cidrBits) {
			if (first.length !== second.length) throw new Error("ipaddr: cannot match CIDR for objects with different lengths");
			let part = 0;
			let shift;
			while (cidrBits > 0) {
				shift = partSize - cidrBits;
				if (shift < 0) shift = 0;
				if (first[part] >> shift !== second[part] >> shift) return false;
				cidrBits -= partSize;
				part += 1;
			}
			return true;
		}
		function parseIntAuto(string) {
			if (hexRegex.test(string)) return parseInt(string, 16);
			if (string[0] === "0" && !isNaN(parseInt(string[1], 10))) {
				if (octalRegex.test(string)) return parseInt(string, 8);
				throw new Error(`ipaddr: cannot parse ${string} as octal`);
			}
			return parseInt(string, 10);
		}
		function padPart(part, length) {
			while (part.length < length) part = `0${part}`;
			return part;
		}
		const ipaddr = {};
		ipaddr.IPv4 = (function() {
			function IPv4(octets) {
				if (octets.length !== 4) throw new Error("ipaddr: ipv4 octet count should be 4");
				let i, octet;
				for (i = 0; i < octets.length; i++) {
					octet = octets[i];
					if (!(0 <= octet && octet <= 255)) throw new Error("ipaddr: ipv4 octet should fit in 8 bits");
				}
				this.octets = octets;
			}
			IPv4.prototype.SpecialRanges = {
				unspecified: [[new IPv4([
					0,
					0,
					0,
					0
				]), 8]],
				broadcast: [[new IPv4([
					255,
					255,
					255,
					255
				]), 32]],
				multicast: [[new IPv4([
					224,
					0,
					0,
					0
				]), 4]],
				linkLocal: [[new IPv4([
					169,
					254,
					0,
					0
				]), 16]],
				loopback: [[new IPv4([
					127,
					0,
					0,
					0
				]), 8]],
				carrierGradeNat: [[new IPv4([
					100,
					64,
					0,
					0
				]), 10]],
				"private": [
					[new IPv4([
						10,
						0,
						0,
						0
					]), 8],
					[new IPv4([
						172,
						16,
						0,
						0
					]), 12],
					[new IPv4([
						192,
						168,
						0,
						0
					]), 16]
				],
				reserved: [
					[new IPv4([
						192,
						0,
						0,
						0
					]), 24],
					[new IPv4([
						192,
						0,
						2,
						0
					]), 24],
					[new IPv4([
						192,
						88,
						99,
						0
					]), 24],
					[new IPv4([
						198,
						18,
						0,
						0
					]), 15],
					[new IPv4([
						198,
						51,
						100,
						0
					]), 24],
					[new IPv4([
						203,
						0,
						113,
						0
					]), 24],
					[new IPv4([
						240,
						0,
						0,
						0
					]), 4]
				],
				as112: [[new IPv4([
					192,
					175,
					48,
					0
				]), 24], [new IPv4([
					192,
					31,
					196,
					0
				]), 24]],
				amt: [[new IPv4([
					192,
					52,
					193,
					0
				]), 24]]
			};
			IPv4.prototype.kind = function() {
				return "ipv4";
			};
			IPv4.prototype.match = function(other, cidrRange) {
				let ref;
				if (cidrRange === void 0) {
					ref = other;
					other = ref[0];
					cidrRange = ref[1];
				}
				if (other.kind() !== "ipv4") throw new Error("ipaddr: cannot match ipv4 address with non-ipv4 one");
				return matchCIDR(this.octets, other.octets, 8, cidrRange);
			};
			IPv4.prototype.prefixLengthFromSubnetMask = function() {
				let cidr = 0;
				let stop = false;
				const zerotable = {
					0: 8,
					128: 7,
					192: 6,
					224: 5,
					240: 4,
					248: 3,
					252: 2,
					254: 1,
					255: 0
				};
				let i, octet, zeros;
				for (i = 3; i >= 0; i -= 1) {
					octet = this.octets[i];
					if (octet in zerotable) {
						zeros = zerotable[octet];
						if (stop && zeros !== 0) return null;
						if (zeros !== 8) stop = true;
						cidr += zeros;
					} else return null;
				}
				return 32 - cidr;
			};
			IPv4.prototype.range = function() {
				return ipaddr.subnetMatch(this, this.SpecialRanges);
			};
			IPv4.prototype.toByteArray = function() {
				return this.octets.slice(0);
			};
			IPv4.prototype.toIPv4MappedAddress = function() {
				return ipaddr.IPv6.parse(`::ffff:${this.toString()}`);
			};
			IPv4.prototype.toNormalizedString = function() {
				return this.toString();
			};
			IPv4.prototype.toString = function() {
				return this.octets.join(".");
			};
			return IPv4;
		})();
		ipaddr.IPv4.broadcastAddressFromCIDR = function(string) {
			try {
				const cidr = this.parseCIDR(string);
				const ipInterfaceOctets = cidr[0].toByteArray();
				const subnetMaskOctets = this.subnetMaskFromPrefixLength(cidr[1]).toByteArray();
				const octets = [];
				let i = 0;
				while (i < 4) {
					octets.push(parseInt(ipInterfaceOctets[i], 10) | parseInt(subnetMaskOctets[i], 10) ^ 255);
					i++;
				}
				return new this(octets);
			} catch (e) {
				throw new Error("ipaddr: the address does not have IPv4 CIDR format", { cause: e });
			}
		};
		ipaddr.IPv4.isIPv4 = function(string) {
			return this.parser(string) !== null;
		};
		ipaddr.IPv4.isValid = function(string) {
			try {
				new this(this.parser(string));
				return true;
			} catch {
				return false;
			}
		};
		ipaddr.IPv4.isValidCIDR = function(string) {
			try {
				this.parseCIDR(string);
				return true;
			} catch {
				return false;
			}
		};
		ipaddr.IPv4.isValidFourPartDecimal = function(string) {
			if (ipaddr.IPv4.isValid(string) && string.match(/^(0|[1-9]\d*)(\.(0|[1-9]\d*)){3}$/)) return true;
			else return false;
		};
		ipaddr.IPv4.isValidCIDRFourPartDecimal = function(string) {
			const match = string.match(/^(.+)\/(\d+)$/);
			if (!ipaddr.IPv4.isValidCIDR(string) || !match) return false;
			return ipaddr.IPv4.isValidFourPartDecimal(match[1]);
		};
		ipaddr.IPv4.networkAddressFromCIDR = function(string) {
			let cidr, i, ipInterfaceOctets, octets, subnetMaskOctets;
			try {
				cidr = this.parseCIDR(string);
				ipInterfaceOctets = cidr[0].toByteArray();
				subnetMaskOctets = this.subnetMaskFromPrefixLength(cidr[1]).toByteArray();
				octets = [];
				i = 0;
				while (i < 4) {
					octets.push(parseInt(ipInterfaceOctets[i], 10) & parseInt(subnetMaskOctets[i], 10));
					i++;
				}
				return new this(octets);
			} catch (e) {
				throw new Error("ipaddr: the address does not have IPv4 CIDR format", { cause: e });
			}
		};
		ipaddr.IPv4.parse = function(string) {
			const parts = this.parser(string);
			if (parts === null) throw new Error("ipaddr: string is not formatted like an IPv4 Address");
			return new this(parts);
		};
		ipaddr.IPv4.parseCIDR = function(string) {
			let match;
			if (match = string.match(/^(.+)\/(\d+)$/)) {
				const maskLength = parseInt(match[2]);
				if (maskLength >= 0 && maskLength <= 32) {
					const parsed = [this.parse(match[1]), maskLength];
					Object.defineProperty(parsed, "toString", { value: function() {
						return this.join("/");
					} });
					return parsed;
				}
			}
			throw new Error("ipaddr: string is not formatted like an IPv4 CIDR range");
		};
		ipaddr.IPv4.parser = function(string) {
			let match, part, value;
			if (match = string.match(ipv4Regexes.fourOctet)) return (function() {
				const ref = match.slice(1, 6);
				const results = [];
				for (let i = 0; i < ref.length; i++) {
					part = ref[i];
					results.push(parseIntAuto(part));
				}
				return results;
			})();
			else if (match = string.match(ipv4Regexes.longValue)) {
				value = parseIntAuto(match[1]);
				if (value > 4294967295 || value < 0) throw new Error("ipaddr: address outside defined range");
				return (function() {
					const results = [];
					let shift;
					for (shift = 0; shift <= 24; shift += 8) results.push(value >> shift & 255);
					return results;
				})().reverse();
			} else if (match = string.match(ipv4Regexes.twoOctet)) return (function() {
				const ref = match.slice(1, 4);
				const results = [];
				value = parseIntAuto(ref[1]);
				if (value > 16777215 || value < 0) throw new Error("ipaddr: address outside defined range");
				results.push(parseIntAuto(ref[0]));
				results.push(value >> 16 & 255);
				results.push(value >> 8 & 255);
				results.push(value & 255);
				return results;
			})();
			else if (match = string.match(ipv4Regexes.threeOctet)) return (function() {
				const ref = match.slice(1, 5);
				const results = [];
				value = parseIntAuto(ref[2]);
				if (value > 65535 || value < 0) throw new Error("ipaddr: address outside defined range");
				results.push(parseIntAuto(ref[0]));
				results.push(parseIntAuto(ref[1]));
				results.push(value >> 8 & 255);
				results.push(value & 255);
				return results;
			})();
			else return null;
		};
		ipaddr.IPv4.subnetMaskFromPrefixLength = function(prefix) {
			prefix = parseInt(prefix);
			if (Number.isNaN(prefix) || prefix < 0 || prefix > 32) throw new Error("ipaddr: invalid IPv4 prefix length");
			const octets = [
				0,
				0,
				0,
				0
			];
			let j = 0;
			const filledOctetCount = Math.floor(prefix / 8);
			while (j < filledOctetCount) {
				octets[j] = 255;
				j++;
			}
			if (filledOctetCount < 4) octets[filledOctetCount] = Math.pow(2, prefix % 8) - 1 << 8 - prefix % 8;
			return new this(octets);
		};
		ipaddr.IPv6 = (function() {
			function IPv6(parts, zoneId) {
				let i, part;
				if (parts.length === 16) {
					this.parts = [];
					for (i = 0; i <= 14; i += 2) this.parts.push(parts[i] << 8 | parts[i + 1]);
				} else if (parts.length === 8) this.parts = parts;
				else throw new Error("ipaddr: ipv6 part count should be 8 or 16");
				for (i = 0; i < this.parts.length; i++) {
					part = this.parts[i];
					if (!(0 <= part && part <= 65535)) throw new Error("ipaddr: ipv6 part should fit in 16 bits");
				}
				if (zoneId) this.zoneId = zoneId;
			}
			IPv6.prototype.SpecialRanges = {
				unspecified: [new IPv6([
					0,
					0,
					0,
					0,
					0,
					0,
					0,
					0
				]), 128],
				linkLocal: [new IPv6([
					65152,
					0,
					0,
					0,
					0,
					0,
					0,
					0
				]), 10],
				multicast: [new IPv6([
					65280,
					0,
					0,
					0,
					0,
					0,
					0,
					0
				]), 8],
				loopback: [new IPv6([
					0,
					0,
					0,
					0,
					0,
					0,
					0,
					1
				]), 128],
				uniqueLocal: [new IPv6([
					64512,
					0,
					0,
					0,
					0,
					0,
					0,
					0
				]), 7],
				ipv4Mapped: [new IPv6([
					0,
					0,
					0,
					0,
					0,
					65535,
					0,
					0
				]), 96],
				deprecatedSiteLocal: [new IPv6([
					65216,
					0,
					0,
					0,
					0,
					0,
					0,
					0
				]), 10],
				discard: [new IPv6([
					256,
					0,
					0,
					0,
					0,
					0,
					0,
					0
				]), 64],
				rfc6145: [new IPv6([
					0,
					0,
					0,
					0,
					65535,
					0,
					0,
					0
				]), 96],
				rfc6052: [[new IPv6([
					100,
					65435,
					0,
					0,
					0,
					0,
					0,
					0
				]), 96], [new IPv6([
					100,
					65435,
					1,
					0,
					0,
					0,
					0,
					0
				]), 48]],
				"6to4": [new IPv6([
					8194,
					0,
					0,
					0,
					0,
					0,
					0,
					0
				]), 16],
				teredo: [new IPv6([
					8193,
					0,
					0,
					0,
					0,
					0,
					0,
					0
				]), 32],
				benchmarking: [new IPv6([
					8193,
					2,
					0,
					0,
					0,
					0,
					0,
					0
				]), 48],
				amt: [new IPv6([
					8193,
					3,
					0,
					0,
					0,
					0,
					0,
					0
				]), 32],
				as112v6: [[new IPv6([
					8193,
					4,
					274,
					0,
					0,
					0,
					0,
					0
				]), 48], [new IPv6([
					9760,
					79,
					32768,
					0,
					0,
					0,
					0,
					0
				]), 48]],
				deprecatedOrchid: [new IPv6([
					8193,
					16,
					0,
					0,
					0,
					0,
					0,
					0
				]), 28],
				orchid2: [new IPv6([
					8193,
					32,
					0,
					0,
					0,
					0,
					0,
					0
				]), 28],
				droneRemoteIdProtocolEntityTags: [new IPv6([
					8193,
					48,
					0,
					0,
					0,
					0,
					0,
					0
				]), 28],
				segmentRouting: [new IPv6([
					24320,
					0,
					0,
					0,
					0,
					0,
					0,
					0
				]), 16],
				reserved: [
					[new IPv6([
						8193,
						0,
						0,
						0,
						0,
						0,
						0,
						0
					]), 23],
					[new IPv6([
						8193,
						3512,
						0,
						0,
						0,
						0,
						0,
						0
					]), 32],
					[new IPv6([
						16383,
						0,
						0,
						0,
						0,
						0,
						0,
						0
					]), 20]
				]
			};
			IPv6.prototype.isIPv4MappedAddress = function() {
				return this.range() === "ipv4Mapped";
			};
			IPv6.prototype.kind = function() {
				return "ipv6";
			};
			IPv6.prototype.match = function(other, cidrRange) {
				let ref;
				if (cidrRange === void 0) {
					ref = other;
					other = ref[0];
					cidrRange = ref[1];
				}
				if (other.kind() !== "ipv6") throw new Error("ipaddr: cannot match ipv6 address with non-ipv6 one");
				return matchCIDR(this.parts, other.parts, 16, cidrRange);
			};
			IPv6.prototype.prefixLengthFromSubnetMask = function() {
				let cidr = 0;
				let stop = false;
				const zerotable = {
					0: 16,
					32768: 15,
					49152: 14,
					57344: 13,
					61440: 12,
					63488: 11,
					64512: 10,
					65024: 9,
					65280: 8,
					65408: 7,
					65472: 6,
					65504: 5,
					65520: 4,
					65528: 3,
					65532: 2,
					65534: 1,
					65535: 0
				};
				let part, zeros;
				for (let i = 7; i >= 0; i -= 1) {
					part = this.parts[i];
					if (part in zerotable) {
						zeros = zerotable[part];
						if (stop && zeros !== 0) return null;
						if (zeros !== 16) stop = true;
						cidr += zeros;
					} else return null;
				}
				return 128 - cidr;
			};
			IPv6.prototype.range = function() {
				return ipaddr.subnetMatch(this, this.SpecialRanges);
			};
			IPv6.prototype.toByteArray = function() {
				let part;
				const bytes = [];
				const ref = this.parts;
				for (let i = 0; i < ref.length; i++) {
					part = ref[i];
					bytes.push(part >> 8);
					bytes.push(part & 255);
				}
				return bytes;
			};
			IPv6.prototype.toFixedLengthString = function() {
				const addr = (function() {
					const results = [];
					for (let i = 0; i < this.parts.length; i++) results.push(padPart(this.parts[i].toString(16), 4));
					return results;
				}).call(this).join(":");
				let suffix = "";
				if (this.zoneId) suffix = `%${this.zoneId}`;
				return addr + suffix;
			};
			IPv6.prototype.toIPv4Address = function() {
				if (!this.isIPv4MappedAddress()) throw new Error("ipaddr: trying to convert a generic ipv6 address to ipv4");
				const ref = this.parts.slice(-2);
				const high = ref[0];
				const low = ref[1];
				return new ipaddr.IPv4([
					high >> 8,
					high & 255,
					low >> 8,
					low & 255
				]);
			};
			IPv6.prototype.toNormalizedString = function() {
				const addr = (function() {
					const results = [];
					for (let i = 0; i < this.parts.length; i++) results.push(this.parts[i].toString(16));
					return results;
				}).call(this).join(":");
				let suffix = "";
				if (this.zoneId) suffix = `%${this.zoneId}`;
				return addr + suffix;
			};
			IPv6.prototype.toRFC5952String = function() {
				const regex = /((^|:)(0(:|$)){2,})/g;
				let suffix = "";
				if (this.zoneId) suffix = `%${this.zoneId}`;
				const normalized = this.toNormalizedString();
				const string = normalized.slice(0, normalized.length - suffix.length);
				let bestMatchIndex = 0;
				let bestMatchLength = -1;
				let bestMatchGroups = -1;
				let match;
				while (match = regex.exec(string)) {
					const groups = (match[0].match(/0/g) || []).length;
					if (groups > bestMatchGroups) {
						bestMatchGroups = groups;
						bestMatchIndex = match.index;
						bestMatchLength = match[0].length;
					}
				}
				if (bestMatchLength < 0) return string + suffix;
				return `${string.substring(0, bestMatchIndex)}::${string.substring(bestMatchIndex + bestMatchLength)}${suffix}`;
			};
			IPv6.prototype.toString = function() {
				return this.toRFC5952String();
			};
			return IPv6;
		})();
		ipaddr.IPv6.broadcastAddressFromCIDR = function(string) {
			try {
				const cidr = this.parseCIDR(string);
				const ipInterfaceOctets = cidr[0].toByteArray();
				const subnetMaskOctets = this.subnetMaskFromPrefixLength(cidr[1]).toByteArray();
				const octets = [];
				let i = 0;
				while (i < 16) {
					octets.push(parseInt(ipInterfaceOctets[i], 10) | parseInt(subnetMaskOctets[i], 10) ^ 255);
					i++;
				}
				return new this(octets);
			} catch (e) {
				throw new Error("ipaddr: the address does not have IPv6 CIDR format", { cause: e });
			}
		};
		ipaddr.IPv6.isIPv6 = function(string) {
			return this.parser(string) !== null;
		};
		ipaddr.IPv6.isValid = function(string) {
			if (typeof string === "string" && string.indexOf(":") === -1) return false;
			try {
				const addr = this.parser(string);
				new this(addr.parts, addr.zoneId);
				return true;
			} catch {
				return false;
			}
		};
		ipaddr.IPv6.isValidCIDR = function(string) {
			if (typeof string === "string" && string.indexOf(":") === -1) return false;
			try {
				this.parseCIDR(string);
				return true;
			} catch {
				return false;
			}
		};
		ipaddr.IPv6.networkAddressFromCIDR = function(string) {
			let cidr, i, ipInterfaceOctets, octets, subnetMaskOctets;
			try {
				cidr = this.parseCIDR(string);
				ipInterfaceOctets = cidr[0].toByteArray();
				subnetMaskOctets = this.subnetMaskFromPrefixLength(cidr[1]).toByteArray();
				octets = [];
				i = 0;
				while (i < 16) {
					octets.push(parseInt(ipInterfaceOctets[i], 10) & parseInt(subnetMaskOctets[i], 10));
					i++;
				}
				return new this(octets);
			} catch (e) {
				throw new Error("ipaddr: the address does not have IPv6 CIDR format", { cause: e });
			}
		};
		ipaddr.IPv6.parse = function(string) {
			const addr = this.parser(string);
			if (addr === null) throw new Error("ipaddr: string is not formatted like an IPv6 Address");
			return new this(addr.parts, addr.zoneId);
		};
		ipaddr.IPv6.parseCIDR = function(string) {
			let maskLength, match, parsed;
			if (match = string.match(/^(.+)\/(\d+)$/)) {
				maskLength = parseInt(match[2]);
				if (maskLength >= 0 && maskLength <= 128) {
					parsed = [this.parse(match[1]), maskLength];
					Object.defineProperty(parsed, "toString", { value: function() {
						return this.join("/");
					} });
					return parsed;
				}
			}
			throw new Error("ipaddr: string is not formatted like an IPv6 CIDR range");
		};
		ipaddr.IPv6.parser = function(string) {
			let addr, i, match, octet, octets, zoneId;
			if (match = string.match(ipv6Regexes.deprecatedTransitional)) return this.parser(`::ffff:${match[1]}`);
			if (ipv6Regexes.native.test(string)) return expandIPv6(string, 8);
			if (match = string.match(ipv6Regexes.transitional)) {
				zoneId = match[6] || "";
				addr = match[1];
				if (!match[1].endsWith("::")) addr = addr.slice(0, -1);
				addr = expandIPv6(addr + zoneId, 6);
				if (addr && addr.parts) {
					octets = [
						parseInt(match[2]),
						parseInt(match[3]),
						parseInt(match[4]),
						parseInt(match[5])
					];
					for (i = 0; i < octets.length; i++) {
						octet = octets[i];
						if (!(0 <= octet && octet <= 255)) return null;
					}
					addr.parts.push(octets[0] << 8 | octets[1]);
					addr.parts.push(octets[2] << 8 | octets[3]);
					return {
						parts: addr.parts,
						zoneId: addr.zoneId
					};
				}
			}
			return null;
		};
		ipaddr.IPv6.subnetMaskFromPrefixLength = function(prefix) {
			prefix = parseInt(prefix);
			if (Number.isNaN(prefix) || prefix < 0 || prefix > 128) throw new Error("ipaddr: invalid IPv6 prefix length");
			const octets = [
				0,
				0,
				0,
				0,
				0,
				0,
				0,
				0,
				0,
				0,
				0,
				0,
				0,
				0,
				0,
				0
			];
			let j = 0;
			const filledOctetCount = Math.floor(prefix / 8);
			while (j < filledOctetCount) {
				octets[j] = 255;
				j++;
			}
			if (filledOctetCount < 16) octets[filledOctetCount] = Math.pow(2, prefix % 8) - 1 << 8 - prefix % 8;
			return new this(octets);
		};
		ipaddr.fromByteArray = function(bytes) {
			const length = bytes.length;
			if (length === 4) return new ipaddr.IPv4(bytes);
			else if (length === 16) return new ipaddr.IPv6(bytes);
			else throw new Error("ipaddr: the binary input is neither an IPv6 nor IPv4 address");
		};
		ipaddr.isValid = function(string) {
			return ipaddr.IPv6.isValid(string) || ipaddr.IPv4.isValid(string);
		};
		ipaddr.isValidCIDR = function(string) {
			return ipaddr.IPv6.isValidCIDR(string) || ipaddr.IPv4.isValidCIDR(string);
		};
		ipaddr.parse = function(string) {
			if (ipaddr.IPv6.isValid(string)) return ipaddr.IPv6.parse(string);
			else if (ipaddr.IPv4.isValid(string)) return ipaddr.IPv4.parse(string);
			else throw new Error("ipaddr: the address has neither IPv6 nor IPv4 format");
		};
		ipaddr.parseCIDR = function(string) {
			try {
				return ipaddr.IPv6.parseCIDR(string);
			} catch {
				try {
					return ipaddr.IPv4.parseCIDR(string);
				} catch (e) {
					throw new Error("ipaddr: the address has neither IPv6 nor IPv4 CIDR format", { cause: e });
				}
			}
		};
		ipaddr.process = function(string) {
			const addr = this.parse(string);
			if (addr.kind() === "ipv6" && addr.isIPv4MappedAddress()) return addr.toIPv4Address();
			else return addr;
		};
		ipaddr.subnetMatch = function(address, rangeList, defaultName) {
			let i, rangeName, rangeSubnets, subnet;
			if (defaultName === void 0 || defaultName === null) defaultName = "unicast";
			for (rangeName in rangeList) if (Object.prototype.hasOwnProperty.call(rangeList, rangeName)) {
				rangeSubnets = rangeList[rangeName];
				if (rangeSubnets[0] && !(rangeSubnets[0] instanceof Array)) rangeSubnets = [rangeSubnets];
				for (i = 0; i < rangeSubnets.length; i++) {
					subnet = rangeSubnets[i];
					if (address.kind() === subnet[0].kind() && address.match.apply(address, subnet)) return rangeName;
				}
			}
			return defaultName;
		};
		if (typeof module !== "undefined" && module.exports) module.exports = ipaddr;
		else root.ipaddr = ipaddr;
	})(exports);
}) });

//#endregion
//#region node_modules/.pnpm/dolphindb@3.1.56_supports-color@7.2.0/node_modules/dolphindb/common.js
var import_dayjs_min = /* @__PURE__ */ __toESM(require_dayjs_min(), 1);
var import_customParseFormat = /* @__PURE__ */ __toESM(require_customParseFormat(), 1);
var import_ipaddr = /* @__PURE__ */ __toESM(require_ipaddr(), 1);
import_dayjs_min.default.extend(import_customParseFormat.default);
const { fromByteArray: buf2ipaddr } = import_ipaddr.default;
const nulls = {
	int8: -128,
	int16: -32768,
	int32: -2147483648,
	int64: -9223372036854775808n,
	int128: -170141183460469231731687303715884105728n,
	float32: -34028234663852886e22,
	double: -Number.MAX_VALUE,
	bytes16: /* @__PURE__ */ new Uint8Array(16)
};
const DdbForm = set_reverse({
	scalar: 0,
	vector: 1,
	pair: 2,
	matrix: 3,
	set: 4,
	dict: 5,
	table: 6,
	chart: 7,
	chunk: 8,
	object: 9,
	tensor: 10,
	extobj: 11
});
const DdbType = set_reverse({
	void: 0,
	bool: 1,
	char: 2,
	short: 3,
	int: 4,
	long: 5,
	date: 6,
	month: 7,
	time: 8,
	minute: 9,
	second: 10,
	datetime: 11,
	timestamp: 12,
	nanotime: 13,
	nanotimestamp: 14,
	float: 15,
	double: 16,
	symbol: 17,
	string: 18,
	uuid: 19,
	functiondef: 20,
	handle: 21,
	code: 22,
	datasource: 23,
	resource: 24,
	any: 25,
	compressed: 26,
	dict: 27,
	datehour: 28,
	ipaddr: 30,
	int128: 31,
	blob: 32,
	complex: 34,
	point: 35,
	duration: 36,
	decimal32: 37,
	decimal64: 38,
	decimal128: 39,
	object: 40,
	iotany: 41,
	instrument: 42,
	market_data: 43,
	symbol_extended: 145
});
const number_nulls = /* @__PURE__ */ new Map([
	[DdbType.short, nulls.int16],
	[DdbType.int, nulls.int32],
	[DdbType.long, nulls.int64],
	[DdbType.float, nulls.float32],
	[DdbType.double, nulls.double]
]);
const DdbFunctionType = set_reverse({
	SystemFunc: 0,
	SystemProc: 1,
	OperatorFunc: 2,
	UserDefinedFunc: 3,
	PartialFunc: 4,
	DynamicFunc: 5,
	PiecewiseFunc: 6,
	JitFunc: 7,
	JitPartialFunc: 8
});
const DdbDurationUnit = set_reverse({
	ns: 0,
	us: 1,
	ms: 2,
	s: 3,
	m: 4,
	H: 5,
	d: 6,
	w: 7,
	M: 8,
	y: 9,
	B: 10
});
const DdbChartType = set_reverse({
	area: 0,
	bar: 1,
	column: 2,
	histogram: 3,
	line: 4,
	pie: 5,
	scatter: 6,
	trend: 7,
	kline: 8,
	surface: 9
});
const DdbVoidType = set_reverse({
	undefined: 0,
	null: 1,
	default: 2
});
const dictables = /* @__PURE__ */ new Set([
	DdbType.any,
	DdbType.string,
	DdbType.double,
	DdbType.float,
	DdbType.int,
	DdbType.long
]);
const ddb_tensor_bytes = {
	[DdbType.bool]: 1,
	[DdbType.char]: 1,
	[DdbType.short]: 2,
	[DdbType.int]: 4,
	[DdbType.long]: 8,
	[DdbType.float]: 4,
	[DdbType.double]: 8
};
function get_type_name(type) {
	return `${DdbType[type] || type}${64 <= type && type < 128 ? "[]" : ""}`;
}
function is_decimal_type(type) {
	return type === DdbType.decimal32 || type === DdbType.decimal64 || type === DdbType.decimal128;
}
function is_decimal_null_value(type, value) {
	return value === nulls.int128 && type === DdbType.decimal128 || value === nulls.int64 && type === DdbType.decimal64 || value === nulls.int32 && type === DdbType.decimal32;
}
function get_duration_unit(code) {
	let str = String.fromCharCode(code >> 24 & 255);
	str += String.fromCharCode(code >> 16 & 255);
	str += String.fromCharCode(code >> 8 & 255);
	str += String.fromCharCode(code & 255);
	return str;
}
const ddb_time_converters = {
	[DdbType.date]: (date) => Math.floor((date.getTime() - 6e4 * date.getTimezoneOffset()) / 864e5),
	[DdbType.datetime]: (date) => (date.getTime() - 6e4 * date.getTimezoneOffset()) / 1e3,
	[DdbType.timestamp]: (date) => BigInt(date.getTime() - 6e4 * date.getTimezoneOffset()),
	[DdbType.nanotimestamp]: (date) => BigInt(date.getTime() - 6e4 * date.getTimezoneOffset()) * 1000000n
};
function get_big_uint_128(dataview, byte_offset, le = true) {
	let cursor = byte_offset + (le ? 15 : 0);
	const end = byte_offset + (le ? -1 : 16);
	const step = le ? -1 : 1;
	let value = 0n;
	while (cursor !== end) {
		value = value << 8n | BigInt(dataview.getUint8(cursor));
		cursor += step;
	}
	return value;
}
function get_big_int_128(dataview, byte_offset, le = true) {
	return BigInt.asIntN(128, get_big_uint_128(dataview, byte_offset, le));
}
function set_big_uint_128(dataView, byte_offset, value, le = true) {
	let cursor = byte_offset + (le ? 0 : 15);
	const end = byte_offset + (le ? 16 : -1);
	const step = le ? 1 : -1;
	while (cursor !== end) {
		dataView.setUint8(cursor, Number(value & 255n));
		value = value >> 8n;
		cursor += step;
	}
}
function set_big_int_128(dataview, byte_offset, value, le = true) {
	set_big_uint_128(dataview, byte_offset, value, le);
}
function generate_array_type(baseType, dimensions) {
	let result = baseType;
	dimensions.forEach((dimension) => {
		result += `[${dimension}]`;
	});
	return result;
}
let _datetime_formatter;
function set_timezone(timezone = "UTC") {
	_datetime_formatter = new Intl.DateTimeFormat("zh-CN", {
		dateStyle: "short",
		timeStyle: "medium",
		timeZone: timezone,
		hour12: false
	});
}
set_timezone();
const is_leap = (y) => y % 4 === 0 && (y % 100 !== 0 || y % 400 === 0);
const months_normal = [
	31,
	28,
	31,
	30,
	31,
	30,
	31,
	31,
	30,
	31,
	30,
	31
];
const months_leap = [
	31,
	29,
	31,
	30,
	31,
	30,
	31,
	31,
	30,
	31,
	30,
	31
];
function date2str(date) {
	if (date === null || date === nulls.int32) return "null";
	let year = 1970;
	let days = date;
	while (days >= (is_leap(year) ? 366 : 365)) {
		days -= is_leap(year) ? 366 : 365;
		++year;
	}
	while (days < 0) {
		--year;
		days += is_leap(year) ? 366 : 365;
	}
	const month_days = is_leap(year) ? months_leap : months_normal;
	let month = 0;
	while (days >= month_days[month]) {
		days -= month_days[month];
		++month;
	}
	return String(year).padStart(4, "0") + "." + String(month + 1).padStart(2, "0") + "." + String(days + 1).padStart(2, "0");
}
function month2str(month) {
	if (month === null || month === nulls.int32) return "null";
	if (month < 0) return String(month);
	return String(Math.trunc(month / 12)).padStart(4, "0") + "." + String(month % 12 + 1).padStart(2, "0") + "M";
}
function time2str(time) {
	if (time === null || time === nulls.int32) return "null";
	const negative = time < 0;
	if (negative) time = -time;
	return (negative ? "-" : "") + String(Math.floor(time / 36e5)).padStart(2, "0") + ":" + String(Math.floor(time % 36e5 / 6e4)).padStart(2, "0") + ":" + String(Math.floor(time % 6e4 / 1e3)).padStart(2, "0") + "." + String(time % 1e3).padStart(3, "0");
}
function minute2str(minute) {
	if (minute === null || minute === nulls.int32) return "null";
	const negative = minute < 0;
	if (negative) minute = -minute;
	return (negative ? "-" : "") + String(Math.floor(minute / 60)).padStart(2, "0") + ":" + String(minute % 60).padStart(2, "0") + "m";
}
function second2str(second) {
	if (second === null || second === nulls.int32) return "null";
	const negative = second < 0;
	if (negative) second = -second;
	return (negative ? "-" : "") + String(Math.floor(second / 3600)).padStart(2, "0") + ":" + String(Math.floor(second % 3600 / 60)).padStart(2, "0") + ":" + String(second % 60).padStart(2, "0");
}
function datetime2ms(datetime) {
	if (datetime === null || datetime === nulls.int32) return null;
	const date = /* @__PURE__ */ new Date(1e3 * datetime);
	return (/* @__PURE__ */ new Date(`${_datetime_formatter.format(date)}.${String(date.getUTCMilliseconds()).padStart(3, "0")}`)).valueOf();
}
function datetime2str(datetime, format = "YYYY.MM.DD HH:mm:ss") {
	return datetime === null || datetime === nulls.int32 ? "null" : (0, import_dayjs_min.default)(datetime2ms(datetime)).format(format);
}
function timestamp2ms(timestamp) {
	if (timestamp === null || timestamp === nulls.int64) return null;
	const date = new Date(Number(timestamp));
	return (/* @__PURE__ */ new Date(`${_datetime_formatter.format(date)}.${String(date.getUTCMilliseconds()).padStart(3, "0")}`)).valueOf();
}
function timestamp2str(timestamp, format = "YYYY.MM.DD HH:mm:ss.SSS") {
	return timestamp === null || timestamp === nulls.int64 ? "null" : (0, import_dayjs_min.default)(timestamp2ms(timestamp)).format(format);
}
function datehour2str(datehour, format = "YYYY.MM.DDTHH") {
	if (datehour === null || datehour === nulls.int32) return "null";
	const ms = 36e5 * datehour;
	return (0, import_dayjs_min.default)(timestamp2ms(ms)).format(format);
}
function nanotime2str(nanotime) {
	if (nanotime === null || nanotime === nulls.int64) return "null";
	const negative = nanotime < 0n;
	if (negative) nanotime = -nanotime;
	return (negative ? "-" : "") + time2str(Number(nanotime / 1000000n)).slice(0, -3) + String(nanotime % 1000000000n).padStart(9, "0");
}
function nanotimestamp2str(nanotimestamp, format = "YYYY.MM.DD HH:mm:ss.SSSSSSSSS") {
	if (nanotimestamp === null || nanotimestamp === nulls.int64) return "null";
	const i_second_start = format.indexOf("ss");
	check(i_second_start !== -1, t$1("格式串必须包含秒的格式 (ss)"));
	const i_second_end = i_second_start + 2;
	const i_nanosecond_start = format.indexOf("SSSSSSSSS", i_second_end);
	check(i_nanosecond_start !== -1, t$1("格式串必须包含纳秒的格式 (SSSSSSSSS)"));
	const remainder = nanotimestamp % 1000000000n;
	const borrow = remainder < 0n;
	const ms = Number((nanotimestamp - remainder + (borrow ? -1000000000n : 0n)) / 1000000n);
	return (0, import_dayjs_min.default)(_datetime_formatter.format(new Date(ms))).format(format.slice(0, i_second_end)) + format.slice(i_second_end, i_nanosecond_start) + String(borrow ? (remainder + 1000000000n) % 1000000000n : remainder).padStart(9, "0");
}
const time_formatters = /* @__PURE__ */ new Map([
	[DdbType.date, date2str],
	[DdbType.month, month2str],
	[DdbType.time, time2str],
	[DdbType.nanotime, nanotime2str],
	[DdbType.minute, minute2str],
	[DdbType.second, second2str],
	[DdbType.datetime, datetime2str],
	[DdbType.timestamp, timestamp2str],
	[DdbType.nanotimestamp, nanotimestamp2str],
	[DdbType.datehour, datehour2str]
]);
function ipaddr2str(buffer, le = true, ipv6) {
	let buf = buffer;
	if (le) buf = buffer.slice().reverse();
	const i_non_zero = buf.findIndex((x) => x !== 0);
	if (ipv6 || i_non_zero !== -1 && i_non_zero < 12) return buf2ipaddr([...buf]).toString();
	else return buf.subarray(12).join(".");
}
function uuid2str(buffer, le = true) {
	const str = int1282str(buffer, le);
	return `${str.slice(0, 8)}-${str.slice(8, 12)}-${str.slice(12, 16)}-${str.slice(16, 20)}-${str.slice(20)}`;
}
function int1282str(buffer, le = true) {
	let buf = buffer;
	if (le) buf = buffer.slice().reverse();
	return [...buf].map((x) => x.toString(16).padStart(2, "0")).join("");
}
const dolphindb_function_definition_pattern = /\bdef (\w+) \(/;
const function_definition_patterns = {
	dolphindb: dolphindb_function_definition_pattern,
	python: dolphindb_function_definition_pattern,
	q: /(\w+): \{\[/
};
const funcdefs = {
	invoke: {
		dolphindb: "def invoke (func, args_json) {\n    args = fromStdJson(args_json)\n    func_ = func\n    if (type(func) == STRING)\n        func_ = funcByName(func)\n    if (type(args) != ANY)\n        args = cast(args, ANY)\n    return unifiedCall(func_, args)\n}\n",
		python: "def invoke (func, args_json):\n    args = fromStdJson(args_json)\n    func_ = func\n    if type(func) == STRING:\n        func_ = funcByName(func)\n    if type(args) != ANY:\n        args = cast(args, ANY)\n    return unifiedCall(func_, args)\n",
		q: "invoke: {[fn; args_json]\n    args_: fromStdJson[args_json];\n    func_: fn;\n    if[typestr[fn] = `STRING;\n        func_: get toCharArray fn;\n        if[type[args_] <> 0] args_: cast[args_; 25]\n    ];\n    func_ . args_\n    }\n"
	},
	jsrpc: {
		dolphindb: "def jsrpc (node, func_name, args) {\n    args_ = args\n    if (func_name == \"invoke\")\n        args_[0] = funcByName(args[0])\n    return rpc(node, unifiedCall, funcByName(func_name), args_)\n}\n",
		python: "def jsrpc (node, func_name, args):\n    args_ = args\n    if func_name == \"invoke\":\n        args_[0] = funcByName(args[0])\n    return rpc(node, unifiedCall, funcByName(func_name), args_)\n",
		q: "jsrpc: {[node; func_name; args]\n    args_: args;\n    if[(`$func_name)=`invoke; args_[0]:funcByName[args[0]]];\n    rpc[node; unifiedCall; funcByName[func_name]; args_]\n    }\n"
	},
	pnode_run: {
		dolphindb: "def pnode_run (nodes, func_name, args, add_node_alias = true) {\n    nargs = size(args)\n    func = funcByName(func_name)\n    \n    if (!nargs)\n        return pnodeRun(func, nodes, add_node_alias)\n    \n    args_partial = array(any, 1 + nargs, 1 + nargs)\n    args_partial[0] = func\n    args_partial[1:] = args\n    return pnodeRun(\n        unifiedCall(partial, args_partial),\n        nodes,\n        add_node_alias\n    )\n}\n",
		python: "def pnode_run (nodes, func_name, args, add_node_alias):\n    nargs = size(args)\n    func = funcByName(func_name)\n    \n    if not nargs:\n        return pnodeRun(func, nodes, add_node_alias)\n    \n    args_partial = [ ]\n    args_partial.append(func)\n    for a in args:\n        args_partial.append(a)\n    \n    return pnodeRun(\n        unifiedCall(partial, args_partial),\n        nodes,\n        add_node_alias\n    )\n",
		q: "pnode_run: {[nodes; func_name; args]\n    nargs_: count args;\n    func_: get toCharArray func_name;\n    if [nargs_=0; : pnodeRun[func_; nodes; 1b]];\n    args_partial_: func,args;\n    pnodeRun[unifiedCall[partial; args_partial_]; nodes; 1b]\n    }\n"
	}
};
let _decimals = null;
let _grouping = true;
let number_formatter = new Intl.NumberFormat("en-US", {
	maximumFractionDigits: 20,
	minimumFractionDigits: 0,
	useGrouping: true
});
function get_number_formatter(integer, decimals = null, grouping = true) {
	if (integer) decimals = null;
	if (decimals === _decimals && grouping === _grouping) return number_formatter;
	_decimals = decimals;
	_grouping = grouping;
	return number_formatter = new Intl.NumberFormat("en-US", {
		maximumFractionDigits: decimals !== null ? decimals : 20,
		minimumFractionDigits: decimals !== null ? decimals : 0,
		useGrouping: grouping
	});
}
const urgent = { urgent: true };
const SqlStandard = set_reverse({
	DolphinDB: 0,
	Oracle: 1,
	MySQL: 2
});

//#endregion
//#region node_modules/.pnpm/dolphindb@3.1.56_supports-color@7.2.0/node_modules/dolphindb/browser.js
var DdbObj = class DdbObj {
	static dec = new TextDecoder("utf-8");
	static enc = new TextEncoder();
	static symbol_bases = {};
	static le_client = Boolean(new Uint8Array(Uint32Array.of(1).buffer)[0]);
	le = DdbObj.le_client;
	form;
	type;
	length;
	name;
	rows;
	cols;
	value;
	buffer;
	constructor(data) {
		Object.assign(this, data);
	}
	static parse(buf, le) {
		if (!buf.length) return new this({
			le,
			form: DdbForm.scalar,
			type: DdbType.void,
			length: 0,
			value: null
		});
		const type = buf[0];
		const form = buf[1];
		if (buf.length <= 2) return new this({
			le,
			form,
			type,
			length: 2,
			value: null
		});
		const i_data = form === DdbForm.set ? 4 : 2;
		const buf_data = buf.subarray(i_data);
		switch (form) {
			case DdbForm.scalar: {
				const [length, value] = this.parse_scalar(buf_data, le, type);
				return new this({
					le,
					form,
					type,
					length: i_data + length,
					value
				});
			}
			case DdbForm.vector:
			case DdbForm.pair:
			case DdbForm.set: {
				let vector = this.parse_vector(buf_data, le, type);
				vector.length += i_data;
				vector.form = form;
				return vector;
			}
			case DdbForm.table: {
				const dv = new DataView(buf.buffer, buf.byteOffset + i_data);
				const rows = dv.getUint32(0, le);
				const cols = dv.getUint32(4, le);
				const i_name_tail = buf_data.indexOf(0, 8);
				const name = this.dec.decode(buf_data.subarray(8, i_name_tail));
				const i_items_start = i_name_tail + 1;
				const [len_items, colnames] = this.parse_vector_items(buf_data.subarray(i_items_start), le, DdbType.string, cols);
				let value = new Array(cols);
				let i_start = i_items_start + len_items;
				for (let i = 0; i < cols; i++) {
					const type = buf_data[i_start];
					if (type === DdbType.compressed) throw new Error(t$1("{{form}}<{{type}}> 暂时不支持解析", {
						form: "table",
						type: "compress"
					}));
					let col = this.parse_vector(buf_data.subarray(i_start + 2), le, type);
					col.length += 2;
					col.name = colnames[i];
					value[i] = col;
					i_start += col.length;
				}
				return new this({
					le,
					form,
					type,
					length: i_data + i_start,
					name,
					rows,
					cols,
					value
				});
			}
			case DdbForm.dict:
			case DdbForm.chart: {
				let keys = this.parse_vector(buf_data.subarray(2), le, buf_data[0]);
				keys.length += 2;
				let values = this.parse_vector(buf_data.subarray(keys.length + 2), le, buf_data[keys.length]);
				values.length += 2;
				let dict = new this({
					le,
					form: DdbForm.dict,
					type,
					length: i_data + keys.length + values.length,
					rows: keys.rows,
					cols: 2,
					value: [keys, values]
				});
				if (form === DdbForm.dict) return dict;
				else {
					const { chartType: type, stacking, binStart: bin_start, binEnd: bin_end, binCount: bin_count, title: titles, extras, data, ...others } = dict.to_dict();
					const [chart, x_axis, y_axis, z_axis] = titles.value;
					dict.form = DdbForm.chart;
					dict.value = {
						type: type.value,
						stacking: stacking.value,
						titles: {
							chart,
							x_axis,
							y_axis,
							z_axis
						},
						...bin_start ? {
							bin_start,
							bin_end
						} : {},
						...bin_count ? { bin_count } : {},
						...extras ? { extras: map_keys(extras.data()) } : {},
						data,
						...others
					};
					return dict;
				}
			}
			case DdbForm.matrix: {
				const dv = new DataView(buf.buffer, buf.byteOffset + i_data);
				const label_flags = buf_data[0];
				const has_row_labels = Boolean(label_flags & 1);
				const has_col_labels = Boolean(label_flags & 2);
				let row_labels = null;
				let col_labels = null;
				let offset = 1;
				if (has_row_labels) {
					row_labels = this.parse_vector(buf_data.subarray(offset + 2), le, buf_data[offset]);
					row_labels.length += 2;
					offset += row_labels.length;
				}
				if (has_col_labels) {
					col_labels = this.parse_vector(buf_data.subarray(offset + 2), le, buf_data[offset]);
					col_labels.length += 2;
					offset += col_labels.length;
				}
				assert(buf_data[offset] === type, "matrix.datatype === matrix.type");
				const rows = dv.getUint32(offset + 2, le);
				const cols = dv.getUint32(offset + 6, le);
				const [len_items, data] = this.parse_vector_items(buf_data.subarray(offset + 10), le, type, rows * cols);
				offset += 10 + len_items;
				return new this({
					le,
					form,
					type,
					length: i_data + offset,
					rows,
					cols,
					value: {
						rows: row_labels,
						cols: col_labels,
						data
					}
				});
			}
			case DdbForm.tensor: {
				const tensorType = buf[2];
				const deviceType = buf[3];
				const dv = new DataView(buf.buffer, buf.byteOffset);
				const tensorFlags = dv.getUint32(4, le);
				const dimensions = dv.getInt32(8, le);
				const shapes = [];
				const strides = [];
				const shapeStart = 12;
				const stridesStart = shapeStart + dimensions * 8;
				const preserveValueStart = stridesStart + dimensions * 8;
				const preserveValue = dv.getBigInt64(preserveValueStart, le);
				const storageStart = preserveValueStart + 8;
				const elemCount = dv.getBigInt64(storageStart, le);
				const dataStart = storageStart + 8;
				for (let d = 0; d < dimensions; d++) {
					const getNumOffset = d * 8;
					shapes.push(Number(dv.getBigInt64(shapeStart + getNumOffset, le)));
					strides.push(Number(dv.getBigInt64(stridesStart + getNumOffset, le)));
				}
				const dataBuffer = buf.subarray(dataStart);
				return new this({
					le,
					form,
					type,
					length: i_data + buf_data.length,
					value: {
						data_type: type,
						tensor_type: tensorType,
						device_type: deviceType,
						tensor_flags: tensorFlags,
						dimensions,
						shape: shapes,
						strides,
						preserve_value: preserveValue,
						elem_count: Number(elemCount),
						data: dataBuffer
					}
				});
			}
			case DdbForm.extobj: {
				const version_and_size = new DataView(buf_data.buffer, buf_data.byteOffset, buf_data.byteLength).getUint32(4, le);
				const length = version_and_size & 16777215;
				return new this({
					le,
					form,
					type,
					length: i_data + 8 + length,
					value: {
						type: buf_data.subarray(0, 4),
						version: version_and_size >>> 24 & 255,
						data: buf_data.subarray(8, 8 + length)
					}
				});
			}
			default: return new this({
				le,
				form,
				type,
				length: i_data + buf_data.length,
				value: buf_data
			});
		}
	}
	static parse_scalar(buf, le, type) {
		switch (type) {
			case DdbType.bool: {
				const value = new DataView(buf.buffer, buf.byteOffset).getInt8(0);
				return [1, value === nulls.int8 ? null : Boolean(value)];
			}
			case DdbType.void:
			case DdbType.char: {
				const value = new DataView(buf.buffer, buf.byteOffset).getInt8(0);
				return [1, value === nulls.int8 ? null : value];
			}
			case DdbType.short: {
				const value = new DataView(buf.buffer, buf.byteOffset).getInt16(0, le);
				return [2, value === nulls.int16 ? null : value];
			}
			case DdbType.int:
			case DdbType.date:
			case DdbType.month:
			case DdbType.time:
			case DdbType.minute:
			case DdbType.second:
			case DdbType.datetime:
			case DdbType.datehour: {
				const value = new DataView(buf.buffer, buf.byteOffset).getInt32(0, le);
				return [4, value === nulls.int32 ? null : value];
			}
			case DdbType.float: {
				const value = new DataView(buf.buffer, buf.byteOffset).getFloat32(0, le);
				return [4, value === nulls.float32 ? null : value];
			}
			case DdbType.double: {
				const value = new DataView(buf.buffer, buf.byteOffset).getFloat64(0, le);
				return [8, value === nulls.double ? null : value];
			}
			case DdbType.long:
			case DdbType.timestamp:
			case DdbType.nanotime:
			case DdbType.nanotimestamp: {
				const value = new DataView(buf.buffer, buf.byteOffset).getBigInt64(0, le);
				return [8, value === nulls.int64 ? null : value];
			}
			case DdbType.string:
			case DdbType.symbol:
			case DdbType.code:
			case DdbType.handle:
			case DdbType.datasource:
			case DdbType.functiondef:
			case DdbType.resource: {
				const i_head = type === DdbType.functiondef ? 1 : 0;
				let i_zero = buf.indexOf(0, i_head);
				let i_end;
				if (i_zero === -1) i_end = i_zero = buf.length;
				else i_end = i_zero + 1;
				const str = this.dec.decode(buf.subarray(i_head, i_zero));
				return [i_end, type === DdbType.functiondef ? {
					type: buf[0],
					name: str
				} : str];
			}
			case DdbType.uuid:
			case DdbType.ipaddr:
			case DdbType.int128: return [16, buf.slice(0, 16)];
			case DdbType.blob: {
				const length = new DataView(buf.buffer, buf.byteOffset).getUint32(0, le);
				return [4 + length, buf.slice(4, 4 + length)];
			}
			case DdbType.complex:
			case DdbType.point: {
				const dv = new DataView(buf.buffer, buf.byteOffset);
				return [16, [dv.getFloat64(0, le), dv.getFloat64(8, le)]];
			}
			case DdbType.duration: {
				const dv = new DataView(buf.buffer, buf.byteOffset);
				return [8, {
					unit: dv.getUint32(4, le),
					data: dv.getInt32(0, le)
				}];
			}
			case DdbType.decimal32: {
				const dv = new DataView(buf.buffer, buf.byteOffset);
				const data = dv.getInt32(4, le);
				return [8, {
					scale: dv.getInt32(0, le),
					data: data === nulls.int32 ? null : data
				}];
			}
			case DdbType.decimal64: {
				const dv = new DataView(buf.buffer, buf.byteOffset);
				const data = dv.getBigInt64(4, le);
				return [12, {
					scale: dv.getInt32(0, le),
					data: data === nulls.int64 ? null : data
				}];
			}
			case DdbType.decimal128: {
				const dv = new DataView(buf.buffer, buf.byteOffset);
				const data = get_big_int_128(dv, 4, le);
				return [20, {
					scale: dv.getInt32(0, le),
					data: data === nulls.int128 ? null : data
				}];
			}
			default: throw new Error(String(DdbType[type] || type) + t$1(" 暂时不支持解析"));
		}
	}
	static parse_vector(buf, le, type) {
		const dv = new DataView(buf.buffer, buf.byteOffset);
		const rows = dv.getUint32(0, le);
		let i_items_start = 8;
		if (type < 64 || type >= 128) {
			const [len_items, value] = this.parse_vector_items(buf.subarray(i_items_start), le, type, rows);
			return new this({
				le,
				form: DdbForm.vector,
				type,
				length: i_items_start + len_items,
				cols: 1,
				rows: type === DdbType.iotany ? value.length : rows,
				value,
				...type === DdbType.iotany ? { buffer: buf } : {}
			});
		} else {
			const type_ = type - 64;
			const cols = dv.getUint32(4, le);
			let blocks = [];
			if (is_decimal_type(type_)) {
				blocks.scale = dv.getInt32(i_items_start, le);
				i_items_start += 4;
			}
			let i_block_start = i_items_start;
			for (let i_row = 0; i_row < rows;) {
				const rows = dv.getUint16(i_block_start, le);
				const unit = dv.getUint8(i_block_start + 2);
				let lengths;
				const i_lengths_start = i_block_start + 4;
				const i_data_start = i_lengths_start + rows * unit;
				const lengths_buf = buf.slice(i_lengths_start, i_data_start);
				switch (unit) {
					case 1:
						lengths = lengths_buf;
						break;
					case 2:
						lengths = new Uint16Array(lengths_buf.buffer);
						break;
					case 4:
						lengths = new Uint32Array(lengths_buf.buffer);
						break;
					default: throw new Error(t$1("array vector 存在非法 unit: {{unit}}", { unit }));
				}
				let total_length = 0;
				for (const x of lengths) total_length += x;
				let len_items;
				let data;
				switch (type_) {
					case DdbType.decimal32:
						len_items = total_length * 4;
						data = new Int32Array(buf.buffer.slice(buf.byteOffset + i_data_start, buf.byteOffset + i_data_start + len_items));
						break;
					case DdbType.decimal64:
						len_items = total_length * 8;
						data = new BigInt64Array(buf.buffer.slice(buf.byteOffset + i_data_start, buf.byteOffset + i_data_start + len_items));
						break;
					case DdbType.decimal128:
						len_items = total_length * 16;
						data = new BigInt128Array(buf.buffer.slice(buf.byteOffset + i_data_start, buf.byteOffset + i_data_start + len_items));
						break;
					default: [len_items, data] = this.parse_vector_items(buf.subarray(i_data_start), le, type - 64, total_length);
				}
				blocks.push({
					unit,
					rows,
					lengths,
					data
				});
				i_block_start = i_data_start + len_items;
				i_row += rows;
			}
			return new this({
				le,
				form: DdbForm.vector,
				type,
				length: i_block_start,
				cols,
				rows,
				value: blocks
			});
		}
	}
	static parse_vector_items(buf, le, type, length) {
		switch (type) {
			case DdbType.void: return [0, null];
			case DdbType.bool:
			case DdbType.char: return [length, new Int8Array(buf.buffer.slice(buf.byteOffset, buf.byteOffset + length))];
			case DdbType.short: return [2 * length, new Int16Array(buf.buffer.slice(buf.byteOffset, buf.byteOffset + 2 * length))];
			case DdbType.int:
			case DdbType.date:
			case DdbType.month:
			case DdbType.time:
			case DdbType.minute:
			case DdbType.second:
			case DdbType.datetime:
			case DdbType.datehour: return [4 * length, new Int32Array(buf.buffer.slice(buf.byteOffset, buf.byteOffset + 4 * length))];
			case DdbType.float: return [4 * length, new Float32Array(buf.buffer.slice(buf.byteOffset, buf.byteOffset + 4 * length))];
			case DdbType.double: return [8 * length, new Float64Array(buf.buffer.slice(buf.byteOffset, buf.byteOffset + 8 * length))];
			case DdbType.long:
			case DdbType.timestamp:
			case DdbType.nanotime:
			case DdbType.nanotimestamp: return [8 * length, new BigInt64Array(buf.buffer.slice(buf.byteOffset, buf.byteOffset + 8 * length))];
			case DdbType.string:
			case DdbType.symbol:
			case DdbType.handle:
			case DdbType.datasource:
			case DdbType.code: {
				let value = new Array(length);
				let i_head = 0, i_tail = i_head;
				for (let i = 0; i < length; i++) {
					i_tail = buf.indexOf(0, i_head);
					value[i] = this.dec.decode(buf.subarray(i_head, i_tail));
					i_head = i_tail + 1;
				}
				return [i_head, value];
			}
			case DdbType.symbol_extended: {
				const dv = new DataView(buf.buffer, buf.byteOffset);
				const base_id = dv.getUint32(0, le);
				const base_size = dv.getUint32(4, le);
				let base_length = 0;
				let base = this.symbol_bases[base_id];
				if (base_size) {
					[base_length, base] = this.parse_vector_items(buf.subarray(8), le, DdbType.string, base_size);
					this.symbol_bases[base_id] = base;
				}
				const value_start = 8 + base_length;
				const value_end = value_start + length * 4;
				const data = new Uint32Array(buf.buffer.slice(buf.byteOffset + value_start, buf.byteOffset + value_end));
				return [value_end, {
					base_id,
					base,
					data
				}];
			}
			case DdbType.uuid:
			case DdbType.ipaddr:
			case DdbType.int128: return [16 * length, new Uint8Array(buf.buffer.slice(buf.byteOffset, buf.byteOffset + 16 * length))];
			case DdbType.blob: {
				let value = new Array(length);
				const dv = new DataView(buf.buffer, buf.byteOffset);
				let i_head = 0;
				for (let i = 0; i < length; i++) {
					const sublen = dv.getUint32(i_head, le);
					const i_blob_head = i_head + 4;
					const i_blob_tail = i_blob_head + sublen;
					value[i] = buf.slice(i_blob_head, i_blob_tail);
					i_head = i_blob_tail;
				}
				return [i_head, value];
			}
			case DdbType.complex:
			case DdbType.point: return [16 * length, new Float64Array(buf.buffer.slice(buf.byteOffset, buf.byteOffset + 16 * length))];
			case DdbType.any: {
				let values = new Array(length);
				let i_head = 0;
				for (let i = 0; i < length; i++) {
					const obj = this.parse(buf.subarray(i_head), le);
					values[i] = obj;
					i_head += obj.length;
				}
				return [i_head, values];
			}
			case DdbType.iotany: {
				const [len, anys] = this.parse_vector_items(buf, le, DdbType.any, length);
				const metas = anys[0].data();
				assert(metas.length >= 2, t$1("iotany 的 meta vector 长度至少为 2"));
				const size = metas[0];
				let sub_vecs = /* @__PURE__ */ new Map();
				for (let i = 1; i < length; i++) {
					const sub_vector = anys[i];
					const sub_type = sub_vector.type;
					sub_vecs.set(sub_type, sub_vector.data());
				}
				return [len, seq(size, (i) => {
					const type = metas[i + size + 2];
					return type === DdbType.void ? null : sub_vecs.get(type)[metas[i + 2]];
				})];
			}
			case DdbType.decimal32: {
				const dv = new DataView(buf.buffer, buf.byteOffset);
				return [4 + 4 * length, {
					scale: dv.getInt32(0, le),
					data: new Int32Array(buf.buffer.slice(buf.byteOffset + 4, buf.byteOffset + 4 + 4 * length))
				}];
			}
			case DdbType.decimal64: {
				const dv = new DataView(buf.buffer, buf.byteOffset);
				return [4 + 8 * length, {
					scale: dv.getInt32(0, le),
					data: new BigInt64Array(buf.buffer.slice(buf.byteOffset + 4, buf.byteOffset + 4 + 8 * length))
				}];
			}
			case DdbType.decimal128: {
				const dv = new DataView(buf.buffer, buf.byteOffset);
				return [4 + 16 * length, {
					scale: dv.getInt32(0, le),
					data: new BigInt128Array(buf.buffer.slice(buf.byteOffset + 4, buf.byteOffset + 4 + 16 * length))
				}];
			}
			case DdbType.duration: {
				const dv = new DataView(buf.buffer, buf.byteOffset);
				let durations = [];
				for (let i = 0; i < length; i++) durations.push({
					data: dv.getInt32(0 + 8 * i, le),
					unit: dv.getInt32(4 + 8 * i, le)
				});
				return [8 * length, durations];
			}
			case DdbType.compressed: return [length, new Uint8Array(buf.buffer.slice(buf.byteOffset, buf.byteOffset + length))];
			default: throw new Error(t$1("{{form}}<{{type}}> 暂时不支持解析", {
				form: "vector",
				type: get_type_name(type)
			}));
		}
	}
	pack() {
		const { form, type, value } = this;
		let header = /* @__PURE__ */ new Uint8Array(2);
		header[0] = type;
		header[1] = form;
		const body = (() => {
			switch (form) {
				case DdbForm.scalar: switch (type) {
					case DdbType.void: return [Uint8Array.of(Number(value))];
					case DdbType.bool: return [Int8Array.of(value === null ? nulls.int8 : Number(value))];
					case DdbType.char: return [Int8Array.of(value === null ? nulls.int8 : value)];
					case DdbType.short: return [Int16Array.of(value === null ? nulls.int16 : value)];
					case DdbType.int:
					case DdbType.date:
					case DdbType.month:
					case DdbType.time:
					case DdbType.minute:
					case DdbType.second:
					case DdbType.datetime:
					case DdbType.datehour: return [Int32Array.of(value === null ? nulls.int32 : value)];
					case DdbType.float: return [Float32Array.of(value === null ? nulls.float32 : value)];
					case DdbType.double: return [Float64Array.of(value === null ? nulls.double : value)];
					case DdbType.long:
					case DdbType.timestamp:
					case DdbType.nanotime:
					case DdbType.nanotimestamp: return [BigInt64Array.of(value === null ? nulls.int64 : value)];
					case DdbType.string:
					case DdbType.symbol:
					case DdbType.code:
					case DdbType.handle:
					case DdbType.datasource:
					case DdbType.resource:
						check(!value.includes("\0"), t$1("pack 时字符串中间不能含有 \\0, 否则上传给 DolphinDB 会导致连接断开"));
						return [DdbObj.enc.encode(value), Uint8Array.of(0)];
					case DdbType.functiondef: return [
						Uint8Array.of(value.type),
						DdbObj.enc.encode(value.name),
						Uint8Array.of(0)
					];
					case DdbType.uuid:
					case DdbType.ipaddr:
					case DdbType.int128: return [this.value];
					case DdbType.blob: return [Uint32Array.of(this.value.byteLength), this.value];
					case DdbType.complex:
					case DdbType.point: return [Float64Array.from(this.value)];
					case DdbType.duration: {
						const { unit, data } = this.value;
						return [Int32Array.of(data, unit)];
					}
					case DdbType.decimal32: {
						const { scale, data } = this.value;
						return [Int32Array.of(scale, data === null ? nulls.int32 : data)];
					}
					case DdbType.decimal64: {
						const { scale, data } = this.value;
						return [Int32Array.of(scale), BigInt64Array.of(data === null ? nulls.int64 : data)];
					}
					case DdbType.decimal128: {
						const { scale, data } = value;
						return [Int32Array.of(scale), BigInt128Array.of(data === null ? nulls.int128 : data)];
					}
					default: throw new Error(String(DdbType[type] || type) + t$1(" 暂时不支持序列化"));
				}
				case DdbForm.vector:
				case DdbForm.pair:
					if (form === DdbForm.vector && 64 <= type && type < 128) return [
						Uint32Array.of(this.rows, this.cols),
						...is_decimal_type(type - 64) ? [Int32Array.of(this.value.scale)] : [],
						...this.value.map((block) => [
							Uint16Array.of(block.rows),
							Uint8Array.of(block.unit, 0),
							block.lengths,
							block.data
						]).flat()
					];
					if (form === DdbForm.vector && type === DdbType.iotany) return [this.buffer];
					return [Uint32Array.of(this.rows, 1), ...DdbObj.pack_vector_body(value, type, this.rows)];
				case DdbForm.set: return [new DdbObj({
					...this,
					form: DdbForm.vector
				}).pack()];
				case DdbForm.table: return [
					Uint32Array.of(this.rows, this.cols),
					DdbObj.enc.encode(this.name || ""),
					Uint8Array.of(0),
					...DdbObj.pack_vector_body(this.value.map((col, i) => col.name || `col${i}`), DdbType.string, this.cols),
					...this.value.map((col) => col.pack())
				];
				case DdbForm.dict: return [value[0].pack(), value[1].pack()];
				case DdbForm.chart: {
					const { type, stacking, bin_start, bin_end, bin_count, titles: { chart, x_axis, y_axis, z_axis }, extras, data } = this.value;
					const { value: [keys, values] } = new DdbDict({
						chartType: new DdbInt(type),
						stacking,
						...bin_start ? {
							binStart: bin_start,
							binEnd: bin_end
						} : {},
						...bin_count ? { binCount: bin_count } : {},
						title: new DdbVectorString([
							chart,
							x_axis,
							y_axis,
							z_axis
						]),
						...extras ? { extras: new DdbDict(map_keys(extras, to_lower_camel_case)) } : {},
						data
					});
					return [keys.pack(), values.pack()];
				}
				case DdbForm.matrix: {
					const { rows, cols, data } = value;
					return [
						Uint8Array.of((rows ? 1 : 0) | (cols ? 2 : 0)),
						...rows ? [rows.pack()] : [],
						...cols ? [cols.pack()] : [],
						Uint8Array.of(this.type, this.form),
						Uint32Array.of(this.rows, this.cols),
						...DdbObj.pack_vector_body(data, this.type, this.rows * this.cols)
					];
				}
				case DdbForm.tensor: {
					const { le, value } = this;
					const { tensor_type, device_type, tensor_flags, dimensions, shape, strides, preserve_value, elem_count, data } = value;
					const totalLength = 10 + dimensions * 8 * 2 + 8 + 8 + data.length;
					const buffer = new ArrayBuffer(totalLength);
					const dv = new DataView(buffer);
					const uint8Array = new Uint8Array(buffer);
					uint8Array[0] = tensor_type;
					uint8Array[1] = device_type;
					dv.setUint32(2, tensor_flags, le);
					dv.setInt32(6, dimensions, le);
					const shapeStart = 10;
					const stridesStart = shapeStart + dimensions * 8;
					for (let d = 0; d < dimensions; d++) {
						dv.setBigInt64(shapeStart + d * 8, BigInt(shape[d]), le);
						dv.setBigInt64(stridesStart + d * 8, BigInt(strides[d]), le);
					}
					const preserveValueStart = stridesStart + dimensions * 8;
					dv.setBigInt64(preserveValueStart, preserve_value, le);
					const storageStart = preserveValueStart + 8;
					dv.setBigInt64(storageStart, BigInt(elem_count), le);
					const dataStart = storageStart + 8;
					uint8Array.set(data, dataStart);
					return [uint8Array];
				}
				case DdbForm.extobj: {
					const { data, type: exttype, version } = value;
					let version_and_size = /* @__PURE__ */ new Uint8Array(4);
					version_and_size.dataview.setUint32(0, version << 24 | data.length, this.le);
					return [
						exttype,
						version_and_size,
						data
					];
				}
				default: throw new Error(t$1("{{form}} 暂不支持序列化", { form: DdbForm[form] || `form ${form}` }));
			}
		})();
		if (!body) return /* @__PURE__ */ new Uint8Array(0);
		return concat([header, ...body]);
	}
	static pack_vector_body(value, type, length) {
		switch (type) {
			case DdbType.void: return [];
			case DdbType.bool:
			case DdbType.char: return [value];
			case DdbType.short: return [value];
			case DdbType.int:
			case DdbType.date:
			case DdbType.month:
			case DdbType.time:
			case DdbType.minute:
			case DdbType.second:
			case DdbType.datetime:
			case DdbType.datehour: return [value];
			case DdbType.float: return [value];
			case DdbType.double: return [value];
			case DdbType.long:
			case DdbType.timestamp:
			case DdbType.nanotime:
			case DdbType.nanotimestamp: return [value];
			case DdbType.string:
			case DdbType.symbol:
			case DdbType.handle:
			case DdbType.datasource:
			case DdbType.code: {
				let bufs = new Array(length * 2);
				for (let i = 0; i < length; i++) {
					const s = value[i];
					check(!s.includes("\0"), t$1("pack 时字符串中间不能含有 \\0, 否则上传给 DolphinDB 会导致连接断开"));
					bufs[2 * i] = this.enc.encode(s);
					bufs[2 * i + 1] = Uint8Array.of(0);
				}
				return bufs;
			}
			case DdbType.uuid:
			case DdbType.ipaddr:
			case DdbType.int128:
			case DdbType.compressed: return [value];
			case DdbType.blob: {
				let bufs = new Array(length * 2);
				for (let i = 0; i < length; i++) {
					const blob_value = value[i];
					bufs[2 * i] = Uint32Array.of(blob_value.length);
					bufs[2 * i + 1] = blob_value;
				}
				return bufs;
			}
			case DdbType.complex:
			case DdbType.point: return [value];
			case DdbType.duration: {
				let bufs = new Int32Array(length * 2);
				for (let i = 0; i < length; i++) {
					const { data, unit } = value[i];
					bufs[2 * i] = data;
					bufs[2 * i + 1] = unit;
				}
				return [bufs];
			}
			case DdbType.any: {
				let bufs = new Array(length);
				for (let i = 0; i < length; i++) bufs[i] = value[i].pack();
				return bufs;
			}
			case DdbType.symbol_extended: {
				const { base_id, base, data } = value;
				return [
					Uint32Array.of(base_id || 0, base.length),
					...this.pack_vector_body(base, DdbType.string, base.length),
					data
				];
			}
			case DdbType.decimal32:
			case DdbType.decimal64:
			case DdbType.decimal128: {
				const { scale, data } = value;
				return [Int32Array.of(scale), data];
			}
			default: throw new Error(t$1("vector {{type}} 暂不支持序列化", { type: get_type_name(type) }));
		}
	}
	data(options) {
		const { form, type, value, le, rows, name } = this;
		switch (form) {
			case DdbForm.scalar: return convert(type, value, le, options);
			case DdbForm.vector:
			case DdbForm.pair:
			case DdbForm.set: {
				const data = converts(type, value, rows, le, options);
				return form === DdbForm.set ? new Set(data) : data;
			}
			case DdbForm.table: {
				const cols = value;
				const jscols = cols.map((col) => col.data(options));
				const columns = cols.select("name");
				const data = seq(rows, (i) => zip_object(columns, seq(cols.length, (j) => jscols[j][i])));
				return options?.table === "full" ? {
					name: name || "",
					columns,
					types: cols.select("type"),
					data
				} : data;
			}
			case DdbForm.dict: {
				const [keys, values] = value;
				return zip_object(keys.data(options), values.data(options));
			}
			case DdbForm.chart: return value;
			case DdbForm.matrix: {
				const ncolumns = this.cols;
				const { rows: _rows, cols: _cols, data } = value;
				const jsdata = converts(type, data, rows * ncolumns, le, options);
				return {
					type,
					nrows: rows,
					ncolumns,
					rows: _rows?.data(options),
					columns: _cols?.data(options),
					data: seq(rows, (i) => seq(ncolumns, (j) => jsdata[j * rows + i]))
				};
			}
			case DdbForm.tensor: {
				const { data_type, tensor_type, device_type, tensor_flags, dimensions, shape, strides, preserve_value, elem_count, data } = this.value;
				const dataByte = ddb_tensor_bytes[data_type];
				return {
					data_type,
					tensor_type,
					device_type,
					tensor_flags,
					dimensions,
					shape,
					strides,
					preserve_value,
					elem_count,
					data: DdbObj.parse_tensor({
						currentDim: 0,
						dimensions,
						rawData: data,
						le: this.le,
						dataByte,
						dataType: data_type,
						shape,
						strides
					})
				};
			}
			case DdbForm.extobj: return `ExtObj<${get_type_name(type)}>`;
			default: throw new Error(t$1("{{form}} {{type}} 暂不支持 data()", {
				form: DdbForm[form] || form,
				type: get_type_name(type)
			}));
		}
	}
	static parse_tensor(buildParams, limit = -1) {
		const { currentDim, dimensions, rawData, le, dataByte, dataType, shape, strides } = buildParams;
		const tensor = [];
		const dv = new DataView(rawData.buffer, rawData.byteOffset);
		for (let i = 0; i < shape[currentDim]; i++) if (currentDim >= dimensions - 1) {
			if (limit > 0 && i >= limit) {
				tensor.push("...");
				break;
			}
			const offset = i * dataByte * Number(strides[currentDim]);
			switch (dataType) {
				case DdbType.bool: {
					const value = dv.getInt8(offset);
					tensor.push(value === nulls.int8 ? null : Boolean(value));
					break;
				}
				case DdbType.char: {
					const value = dv.getInt8(offset);
					tensor.push(convert(dataType, value, le));
					break;
				}
				case DdbType.short: {
					const value = dv.getInt16(offset, le);
					tensor.push(value === nulls.int16 ? null : value);
					break;
				}
				case DdbType.int: {
					const value = dv.getInt32(offset, le);
					tensor.push(value === nulls.int32 ? null : value);
					break;
				}
				case DdbType.long: {
					const value = dv.getBigInt64(offset, le);
					tensor.push(value === nulls.int64 ? null : value);
					break;
				}
				case DdbType.float: {
					const value = dv.getFloat32(offset, le);
					tensor.push(value === nulls.float32 ? null : value);
					break;
				}
				case DdbType.double: {
					const value = dv.getFloat64(offset, le);
					tensor.push(value === nulls.double ? null : value);
					break;
				}
			}
		} else {
			const start = strides[currentDim] * i * dataByte;
			const end = start + strides[currentDim] * 1 * dataByte;
			tensor.push(DdbObj.parse_tensor({
				currentDim: currentDim + 1,
				dimensions,
				rawData: rawData.subarray(Number(start), Number(end)),
				le,
				dataByte,
				shape,
				strides,
				dataType
			}, limit));
		}
		return tensor;
	}
	toString(options = {
		nullstr: true,
		quote: true
	}) {
		const type = this.inspect_type();
		const data = (() => {
			switch (this.form) {
				case DdbForm.scalar: return format(this.type, this.value, this.le, options);
				case DdbForm.vector:
				case DdbForm.pair:
				case DdbForm.set: {
					const form = this.form;
					function format_array(items, ellipsis) {
						const str_items = items.join(", ") + (ellipsis ? ", ··" : "");
						return form === DdbForm.pair ? str_items : str_items.bracket("square");
					}
					if (64 <= this.type && this.type < 128) {
						const type_ = this.type - 64;
						options = {
							...options,
							grouping: false
						};
						const limit = 10;
						let array_items = new Array(Math.min(limit, this.rows));
						let i_items = 0;
						for (const { lengths, data } of this.value) {
							let acc_len = 0;
							for (const length of lengths) {
								let items = new Array(Math.min(limit, length));
								for (let i = 0; i < items.length; i++) switch (type_) {
									case DdbType.decimal32:
									case DdbType.decimal64:
									case DdbType.decimal128:
										const x = data[acc_len + i];
										if (is_decimal_null_value(type_, x)) items[i] = "";
										else {
											const { scale } = this.value;
											const s = String(x < 0 ? -x : x).padStart(scale, "0");
											const str = (x < 0 ? "-" : "") + (scale ? `${s.slice(0, -scale) || "0"}.${s.slice(-scale)}` : s);
											items[i] = options.colors ? green$1(str) : str;
										}
										break;
									case DdbType.complex:
									case DdbType.point: {
										const index = acc_len + i;
										items[i] = format(type_, data.subarray(2 * index, 2 * (index + 1)), this.le, options);
										break;
									}
									case DdbType.uuid:
									case DdbType.int128:
									case DdbType.ipaddr: {
										const index = acc_len + i;
										items[i] = format(type_, data.subarray(16 * index, 16 * (index + 1)), this.le, options);
										break;
									}
									default:
										items[i] = format(type_, data[acc_len + i], this.le, options);
										break;
								}
								array_items[i_items++] = format_array(items, length > limit);
								acc_len += length;
							}
							if (i_items >= limit) break;
						}
						return format_array(array_items, this.rows > limit);
					}
					switch (this.type) {
						case DdbType.symbol_extended: {
							const limit = 50;
							const { base, data } = this.value;
							let items = new Array(Math.min(limit, data.length));
							for (let i = 0; i < items.length; i++) items[i] = base[data[i]].quote("single");
							return format_array(items, data.length > limit);
						}
						case DdbType.void: return format(this.type, this.value, this.le, options);
						case DdbType.uuid:
						case DdbType.int128:
						case DdbType.ipaddr: {
							const limit = 10;
							const value = this.value;
							const len_data = value.length / 16;
							let items = new Array(Math.min(limit, len_data));
							for (let i = 0; i < items.length; i++) items[i] = format(this.type, value.subarray(16 * i, 16 * (i + 1)), this.le, options);
							return format_array(items, len_data > limit);
						}
						case DdbType.complex:
						case DdbType.point: {
							const limit = 20;
							const value = this.value;
							const len_data = value.length / 2;
							let items = new Array(Math.min(limit, len_data));
							for (let i = 0; i < items.length; i++) items[i] = format(this.type, value.subarray(2 * i, 2 * (i + 1)), this.le, options);
							return format_array(items, len_data > limit);
						}
						case DdbType.decimal32:
						case DdbType.decimal64:
						case DdbType.decimal128: {
							const limit = 50;
							const { data } = this.value;
							let items = new Array(Math.min(limit, data.length));
							for (let i = 0; i < items.length; i++) items[i] = formati(this, i, options);
							return format_array(items, data.length > limit);
						}
						case DdbType.char: {
							const limit = 150;
							const value = this.value;
							const ellipsis = value.length > limit;
							return (seq(ellipsis ? limit : value.length).map((i) => convert(this.type, value[i], this.le)).join("") + (ellipsis ? "··" : "")).quote();
						}
						default: {
							const limit = this.type === DdbType.compressed ? 5 : 50;
							let items = new Array(Math.min(limit, this.value.length));
							for (let i = 0; i < items.length; i++) items[i] = format(this.type, this.value[i], this.le, options);
							return format_array(items, this.value.length > limit);
						}
					}
				}
				case DdbForm.chart: return JSON.stringify(this.value, (key, value) => key === "data" ? value.toString(options) : value, 4);
				case DdbForm.tensor: {
					const tensorVal = this.value;
					const retd = DdbObj.parse_tensor({
						currentDim: 0,
						dimensions: tensorVal.dimensions,
						rawData: tensorVal.data,
						le: this.le,
						dataByte: ddb_tensor_bytes[tensorVal.data_type],
						dataType: tensorVal.data_type,
						shape: tensorVal.shape,
						strides: tensorVal.strides
					}, 5);
					return JSON.stringify(retd).replaceAll("\"...\"", "...");
				}
			}
			return String(this.value);
		})();
		if (this.form === DdbForm.scalar && this.type === DdbType.string) return data;
		else return `${options?.colors ? blue$1(type) : type}(${this.name ? `'${this.name}', ` : ""}${data})`;
	}
	inspect_type() {
		const tname = DdbType[this.type];
		switch (this.form) {
			case DdbForm.scalar:
				if (this.type === DdbType.functiondef) return `functiondef<${DdbFunctionType[this.value.type]}>`;
				return tname;
			case DdbForm.vector:
				if (64 <= this.type && this.type < 128) return `${DdbType[this.type - 64]}[][${this.rows}]`;
				return `${tname}[${this.rows}]`;
			case DdbForm.pair: return `pair<${tname}>`;
			case DdbForm.set: return `set<${tname}>[${this.rows}]`;
			case DdbForm.table: return `table[${this.rows}r][${this.cols}c]`;
			case DdbForm.dict: return `dict<${DdbType[this.value[0].type]}, ${DdbType[this.value[1].type]}>[${this.rows}]`;
			case DdbForm.chart: return `chart<${DdbChartType[this.value.type]}>`;
			case DdbForm.matrix: return `matrix<${tname}>[${this.rows}r][${this.cols}c]`;
			case DdbForm.tensor: return `tensor<${generate_array_type(DdbType[this.value.data_type], this.value.shape)}>`;
			default: return `${DdbForm[this.form]} ${tname}`;
		}
	}
	static to_ddbobj(value) {
		if (value && value instanceof DdbObj) return value;
		if (value === void 0) return new DdbVoid();
		if (value === null) return new DdbVoid(DdbVoidType.null);
		const type = typeof value;
		switch (type) {
			case "string": return new DdbString(value);
			case "boolean": return new DdbBool(value);
			default: throw new Error(t$1("不能自动转换 {{type}} 至 DdbObj", { type }));
		}
	}
	static to_ddbobjs(values) {
		return values.map((value) => this.to_ddbobj(value));
	}
	to_cols() {
		assert(this.form === DdbForm.table, t$1("form 必须是 DdbForm.table, 否则不能 to_cols"));
		return this.value.map((col) => ({
			title: col.name,
			dataIndex: col.name,
			render: (value) => format(col.type, value, col.le, {
				nullstr: false,
				quote: false
			})
		}));
	}
	to_rows() {
		assert(this.form === DdbForm.table, t$1("form 必须是 DdbForm.table, 否则不能 to_rows"));
		let rows = new Array(this.rows);
		for (let i = 0; i < this.rows; i++) {
			let row = {};
			for (let j = 0; j < this.cols; j++) {
				const { type, name, value: values } = this.value[j];
				switch (type) {
					case DdbType.bool: {
						const value = values[i];
						row[name] = value === nulls.int8 ? null : Boolean(value);
						break;
					}
					case DdbType.char:
						row[name] = values[i] === nulls.int8 ? null : values[i];
						break;
					case DdbType.short:
						row[name] = values[i] === nulls.int16 ? null : values[i];
						break;
					case DdbType.int:
					case DdbType.date:
					case DdbType.month:
					case DdbType.time:
					case DdbType.minute:
					case DdbType.second:
					case DdbType.datetime:
					case DdbType.datehour:
						row[name] = values[i] === nulls.int32 ? null : values[i];
						break;
					case DdbType.long:
					case DdbType.timestamp:
					case DdbType.nanotime:
					case DdbType.nanotimestamp:
						row[name] = values[i] === nulls.int64 ? null : values[i];
						break;
					case DdbType.int128:
						row[name] = values[i] === nulls.int128 ? null : values[i];
						break;
					case DdbType.float:
						row[name] = values[i] === nulls.float32 ? null : values[i];
						break;
					case DdbType.double:
						row[name] = values[i] === nulls.double ? null : values[i];
						break;
					case DdbType.decimal32:
					case DdbType.decimal64:
					case DdbType.decimal128:
						row[name] = is_decimal_null_value(type, values[i]) ? null : values[i];
						break;
					case DdbType.ipaddr:
						row[name] = values.subarray(16 * i, 16 * (i + 1));
						break;
					case DdbType.symbol_extended: {
						const { base, data } = values;
						row[name] = base[data[i]];
						break;
					}
					default: row[name] = values[i];
				}
			}
			rows[i] = row;
		}
		return rows;
	}
	to_dict({ strip, deep } = {}) {
		assert(this.form === DdbForm.dict, t$1("this.form 必须是 DdbForm.dict, 否则不能调用 to_dict 转换为 js object"));
		const [{ value: keys, type: key_type }, { value: values, type: value_type }] = this.value;
		assert(key_type === DdbType.string && dictables.has(value_type), t$1("当前只支持自动转换 dict<string, any | ...dictables> 为 js object"));
		assert(!(deep && !strip), t$1("deep = true 时必须设置 strip = true"));
		let obj = {};
		for (let i = 0; i < this.rows; i++) {
			const key = keys[i];
			if (value_type === DdbType.any) {
				let value = values[i];
				if (deep && value.form === DdbForm.dict) obj[key] = value.to_dict({
					strip,
					deep
				});
				else obj[key] = strip ? value.value : value;
			} else obj[key] = values[i];
		}
		return obj;
	}
};
const gray_nullstr = gray("null");
function get_nullstr(options) {
	return options.nullstr ? options.colors ? gray_nullstr : "null" : "";
}
function format_time(type, value, options) {
	if (value === null || value === (type === DdbType.timestamp || type === DdbType.nanotime || type === DdbType.nanotimestamp ? nulls.int64 : nulls.int32)) return get_nullstr(options);
	let str;
	try {
		str = time_formatters.get(type)(value, type === DdbType.timestamp && options.timestamp === "s" ? "YYYY.MM.DD HH:mm:ss" : void 0);
	} catch (error) {
		if (error instanceof RangeError) str = "Invalid Date";
		else throw error;
	}
	return options.colors ? magenta$1(str) : str;
}
function format_number(type, value, options) {
	if (value === null || value === number_nulls.get(type)) return options.nullstr ? options.colors ? gray_nullstr : "null" : "";
	const str = get_number_formatter(type === DdbType.int || type === DdbType.long || type === DdbType.short, options.decimals, options.grouping).format(value);
	return options.colors ? green$1(str) : str;
}
function format(type, value, le, options = {}) {
	switch (type) {
		case DdbType.void: return options.nullstr ? value === DdbVoidType.default ? options.colors ? gray("default") : "default" : options.colors ? gray_nullstr : "null" : "";
		case DdbType.bool: if (value === null || value === nulls.int8) return get_nullstr(options);
		else {
			const str = String(Boolean(value));
			return options.colors ? blue$1(str) : str;
		}
		case DdbType.char: if (value === null || value === nulls.int8) return get_nullstr(options);
		else {
			let str = 32 <= value && value <= 126 ? String.fromCharCode(value) : "\\" + String(value);
			if (options.quote) str = str.quote();
			return options.colors ? green$1(str) : str;
		}
		case DdbType.short:
		case DdbType.int:
		case DdbType.long:
		case DdbType.float:
		case DdbType.double: return format_number(type, value, options);
		case DdbType.date:
		case DdbType.month:
		case DdbType.time:
		case DdbType.minute:
		case DdbType.second:
		case DdbType.datetime:
		case DdbType.timestamp:
		case DdbType.nanotime:
		case DdbType.nanotimestamp:
		case DdbType.datehour: return format_time(type, value, options);
		case DdbType.symbol:
		case DdbType.string: {
			let str = value;
			if (options.quote) str = str.quote("single");
			return options.colors ? cyan$1(str) : str;
		}
		case DdbType.uuid: {
			const str = uuid2str(value, le);
			return options.colors ? cyan$1(str) : str;
		}
		case DdbType.functiondef: {
			const str = value.name.quote("single");
			return options.colors ? cyan$1(str) : str;
		}
		case DdbType.handle:
		case DdbType.code:
		case DdbType.datasource:
		case DdbType.resource: {
			const str = value.quote("single");
			return options.colors ? cyan$1(str) : str;
		}
		case DdbType.ipaddr: {
			const str = ipaddr2str(value, le);
			return options.colors ? cyan$1(str) : str;
		}
		case DdbType.int128: {
			const str = int1282str(value, le);
			return options.colors ? cyan$1(str) : str;
		}
		case DdbType.blob: {
			const str = value.length > 100 ? DdbObj.dec.decode(value.subarray(0, 98)) + "…" : DdbObj.dec.decode(value);
			return options.colors ? cyan$1(str) : str;
		}
		case DdbType.point: {
			const [x, y] = value;
			return `(${format(DdbType.double, x, le, options)}, ${format(DdbType.double, y, le, options)})`;
		}
		case DdbType.complex: {
			const [x, y] = value;
			return `${format(DdbType.double, x, le, options)}${y >= 0 ? "+" : ""}${format(DdbType.double, y, le, options)}i`;
		}
		case DdbType.duration: {
			const { data, unit } = value;
			const str = `${data}${DdbDurationUnit[unit] ?? get_duration_unit(unit)}`;
			return options.colors ? magenta$1(str) : str;
		}
		case DdbType.decimal32:
		case DdbType.decimal64:
		case DdbType.decimal128: {
			const { scale, data } = value;
			if (data === null || is_decimal_null_value(type, data)) return get_nullstr(options);
			const s = String(data < 0 ? -data : data).padStart(scale, "0");
			const str = (data < 0 ? "-" : "") + (scale ? `${s.slice(0, -scale) || "0"}.${s.slice(-scale)}` : s);
			return options.colors ? green$1(str) : str;
		}
		default: return value === null ? get_nullstr(options) : String(value);
	}
}
function formati(obj, index, options = {}) {
	check(index < obj.rows, "index 应该 < obj.rows");
	if (obj.type < 64 || obj.type >= 128) switch (obj.type) {
		case DdbType.symbol_extended: {
			const { base, data } = obj.value;
			return format(DdbType.string, base[data[index]], obj.le, options);
		}
		case DdbType.void: return format(obj.type, obj.value, obj.le, options);
		case DdbType.uuid:
		case DdbType.int128:
		case DdbType.ipaddr: return format(obj.type, obj.value.subarray(16 * index, 16 * (index + 1)), obj.le, options);
		case DdbType.blob: {
			const value = obj.value[index];
			return value.length > 100 ? DdbObj.dec.decode(value.subarray(0, 98)) + "…" : DdbObj.dec.decode(value);
		}
		case DdbType.complex:
		case DdbType.point: return format(obj.type, obj.value.subarray(2 * index, 2 * (index + 1)), obj.le, options);
		case DdbType.decimal32:
		case DdbType.decimal64:
		case DdbType.decimal128: {
			const { scale, data } = obj.value;
			const x = data[index];
			if (is_decimal_null_value(obj.type, x)) return "";
			const s = String(x < 0 ? -x : x).padStart(scale, "0");
			const str = (x < 0 ? "-" : "") + (scale ? `${s.slice(0, -scale) || "0"}.${s.slice(-scale)}` : s);
			return options.colors ? green$1(str) : str;
		}
		case DdbType.any: return obj.value[index].toString(options);
		default: return format(obj.type, obj.value[index], obj.le, options);
	}
	else {
		const type_ = obj.type - 64;
		let offset = 0;
		options = {
			...options,
			nullstr: true,
			grouping: false
		};
		for (const { lengths, data, rows } of obj.value) {
			let acc_len = 0;
			if (offset + rows <= index) {
				offset += rows;
				continue;
			}
			for (const length of lengths) {
				if (offset < index) {
					offset++;
					acc_len += length;
					continue;
				}
				const limit = 10;
				let items = new Array(Math.min(limit, length));
				for (let i = 0; i < items.length; i++) switch (type_) {
					case DdbType.decimal32:
					case DdbType.decimal64:
					case DdbType.decimal128:
						const x = data[acc_len + i];
						if (is_decimal_null_value(type_, x)) items[i] = options.colors ? gray("null") : "null";
						else {
							const { scale } = obj.value;
							const s = String(x < 0 ? -x : x).padStart(scale, "0");
							const str = (x < 0 ? "-" : "") + (scale ? `${s.slice(0, -scale) || "0"}.${s.slice(-scale)}` : s);
							items[i] = options.colors ? green$1(str) : str;
						}
						break;
					case DdbType.complex:
					case DdbType.point: {
						const index = acc_len + i;
						items[i] = format(type_, data.subarray(2 * index, 2 * (index + 1)), obj.le, options);
						break;
					}
					case DdbType.uuid:
					case DdbType.int128:
					case DdbType.ipaddr: {
						const index = acc_len + i;
						items[i] = format(type_, data.subarray(16 * index, 16 * (index + 1)), obj.le, options);
						break;
					}
					default:
						items[i] = format(type_, data[acc_len + i], obj.le, options);
						break;
				}
				return (items.join(", ") + (length > limit ? ", ..." : "")).bracket("square");
			}
		}
	}
}
function convert(type, value, le, { blob = "string", char = "string", timestamp = "ms" } = {}) {
	switch (type) {
		case DdbType.void: return value === DdbVoidType.null ? null : void 0;
		case DdbType.char: return char === "string" ? value === null || value === nulls.int8 ? "" : 32 <= value && value <= 126 ? String.fromCharCode(value) : `\\${value}` : value;
		case DdbType.bool: return value === null || value === nulls.int8 ? null : Boolean(value);
		case DdbType.short: return value === null || value === nulls.int16 ? null : value;
		case DdbType.int: return value === null || value === nulls.int32 ? null : value;
		case DdbType.float: return value === null || value === nulls.float32 ? null : value;
		case DdbType.double: return value === null || value === nulls.double ? null : value;
		case DdbType.long: return value === null || value === nulls.int64 ? null : value;
		case DdbType.functiondef: return value.name;
		case DdbType.string:
		case DdbType.symbol:
		case DdbType.code:
		case DdbType.handle:
		case DdbType.datasource:
		case DdbType.resource:
		case DdbType.compressed: return value;
		case DdbType.blob: return blob === "string" ? decode(value) : value;
		case DdbType.complex:
		case DdbType.point: {
			const [x, y] = value;
			return [x === null || x === nulls.double ? null : x, y === null || y === nulls.double ? null : y];
		}
		case DdbType.date:
		case DdbType.month:
		case DdbType.time:
		case DdbType.minute:
		case DdbType.second:
		case DdbType.datetime:
		case DdbType.datehour:
		case DdbType.timestamp:
		case DdbType.nanotime:
		case DdbType.nanotimestamp:
		case DdbType.duration:
		case DdbType.uuid:
		case DdbType.ipaddr:
		case DdbType.int128:
		case DdbType.decimal32:
		case DdbType.decimal64:
		case DdbType.decimal128: return format(type, value, le, {
			colors: false,
			timestamp
		}) || null;
		default: throw new Error(String(DdbType[type] || type) + t$1(" 暂时不支持转换为 js 对象"));
	}
}
function converts(type, value, rows, le, options) {
	if (type < 64 || type >= 128) switch (type) {
		case DdbType.bool:
		case DdbType.short:
		case DdbType.int:
		case DdbType.float:
		case DdbType.double:
		case DdbType.long:
		case DdbType.date:
		case DdbType.month:
		case DdbType.time:
		case DdbType.minute:
		case DdbType.second:
		case DdbType.datetime:
		case DdbType.datehour:
		case DdbType.timestamp:
		case DdbType.nanotime:
		case DdbType.nanotimestamp:
		case DdbType.duration:
		case DdbType.string:
		case DdbType.symbol:
		case DdbType.code:
		case DdbType.handle:
		case DdbType.datasource:
		case DdbType.resource:
		case DdbType.functiondef:
		case DdbType.blob:
		case DdbType.compressed: return Array.prototype.map.call(value, (x) => convert(type, x, le, options));
		case DdbType.char: if (options?.chars === "binary") return value;
		else return Array.prototype.map.call(value, (x) => convert(type, x, le, options));
		case DdbType.void: return [];
		case DdbType.symbol_extended: {
			const { base, data } = value;
			return Array.prototype.map.call(data, (x) => base[x]);
		}
		case DdbType.complex:
		case DdbType.point: return seq(rows, (i) => {
			const x = value[2 * i];
			const y = value[2 * i + 1];
			return [x === nulls.double ? null : x, y === nulls.double ? null : y];
		});
		case DdbType.uuid:
		case DdbType.ipaddr:
		case DdbType.int128: return seq(rows, (i) => convert(type, value.subarray(16 * i, 16 * (i + 1)), le, options));
		case DdbType.decimal32:
		case DdbType.decimal64:
		case DdbType.decimal128: {
			const { scale, data } = value;
			return Array.prototype.map.call(data, (x) => {
				if (is_decimal_null_value(type, x)) return "";
				const s = String(x < 0 ? -x : x).padStart(scale, "0");
				return (x < 0 ? "-" : "") + (scale ? `${s.slice(0, -scale) || "0"}.${s.slice(-scale)}` : s);
			});
		}
		case DdbType.any: return value.map((x) => x.data(options));
		case DdbType.iotany: return value;
		default: throw new Error(String(DdbType[type] || type) + "[]" + t$1(" 暂时不支持转换为 js 对象"));
	}
	else {
		const type_ = type - 64;
		return value.map(({ lengths, data, rows }) => {
			let acc_len = 0;
			return Array.prototype.map.call(lengths, (length) => {
				switch (type_) {
					case DdbType.decimal32:
					case DdbType.decimal64:
					case DdbType.decimal128: return converts(type_, {
						scale: value.scale,
						data: data.subarray(acc_len, acc_len += length)
					}, length, le, options);
					case DdbType.complex:
					case DdbType.point: return converts(type_, data.subarray(acc_len, acc_len += 2 * length), length, le, options);
					case DdbType.uuid:
					case DdbType.int128:
					case DdbType.ipaddr: return converts(type_, data.subarray(acc_len, acc_len += 16 * length), length, le, options);
					default: return converts(type_, data.subarray(acc_len, acc_len += length), length, le, options);
				}
			});
		}).flat();
	}
}
var DdbVoid = class extends DdbObj {
	constructor(value = DdbVoidType.undefined) {
		super({
			form: DdbForm.scalar,
			type: DdbType.void,
			value
		});
	}
};
var DdbBool = class extends DdbObj {
	constructor(value) {
		super({
			form: DdbForm.scalar,
			type: DdbType.bool,
			value
		});
	}
};
var DdbInt = class extends DdbObj {
	constructor(value) {
		super({
			form: DdbForm.scalar,
			type: DdbType.int,
			value
		});
	}
};
var DdbString = class extends DdbObj {
	constructor(value) {
		super({
			form: DdbForm.scalar,
			type: DdbType.string,
			value
		});
	}
};
var DdbVectorString = class extends DdbObj {
	constructor(strings, name) {
		super({
			form: DdbForm.vector,
			type: DdbType.string,
			rows: strings.length,
			cols: 1,
			value: strings,
			name
		});
	}
};
var DdbVectorAny = class extends DdbObj {
	constructor(objs, name) {
		super({
			form: DdbForm.vector,
			type: DdbType.any,
			rows: objs.length,
			cols: 1,
			value: DdbObj.to_ddbobjs(objs),
			name
		});
	}
};
var DdbDict = class extends DdbObj {
	constructor(arg0, arg1) {
		if (arg1) super({
			form: DdbForm.dict,
			type: arg1.type,
			rows: arg0.rows,
			cols: 2,
			value: [arg0, arg1]
		});
		else {
			const keys = Object.keys(arg0);
			super({
				form: DdbForm.dict,
				type: DdbType.any,
				rows: keys.length,
				cols: 2,
				value: [new DdbVectorString(keys), new DdbVectorAny(Object.values(arg0))]
			});
		}
	}
};
const winsize = 1e4;
var DdbConnectionError = class extends Error {
	name = "DdbConnectionError";
	cause;
	url;
	constructor(url, error) {
		super(error?.message || `${url} ${t$1("连接出错了，可能由于网络原因连接已被关闭，或服务器断开连接")}`, { cause: error });
		this.url = url;
		if (error) this.cause = error;
	}
};
var DdbDatabaseError = class extends Error {
	name = "DdbDatabaseError";
	url;
	id;
	type;
	options;
	constructor(message, url, type, options, id) {
		super(message);
		this.url = url;
		this.type = type;
		this.options = options;
		this.id = id;
	}
};
var DDB = class DDB {
	sid = "0";
	dec = new TextDecoder("utf-8");
	enc = new TextEncoder();
	url;
	lwebsocket = new Lock();
	le = true;
	static le_client = Boolean(new Uint8Array(Uint32Array.of(1).buffer)[0]);
	autologin = true;
	ticket;
	username = "admin";
	password = "123456";
	python = false;
	q = false;
	dolphindb = true;
	language = "dolphindb";
	sql = SqlStandard.DolphinDB;
	streaming = null;
	verbose = false;
	print_message_buffer = false;
	print_object_buffer = false;
	print_message = true;
	parse_object = true;
	error;
	listeners = [];
	pconnect;
	ppnode_run;
	pinvoke;
	pjsrpc;
	definitions = /* @__PURE__ */ new Map();
	pdefinitions = /* @__PURE__ */ new Map();
	get connected() {
		return !this.error && this.lwebsocket.resource?.readyState === WebSocket.OPEN;
	}
	constructor(url, options = {}) {
		this.url = url;
		if (options.verbose !== void 0) this.verbose = options.verbose;
		if (options.autologin !== void 0) this.autologin = options.autologin;
		if (options.ticket) this.ticket = options.ticket;
		if (options.username !== void 0) this.username = options.username;
		if (options.password !== void 0) this.password = options.password;
		if (options.python !== void 0 && (this.python = Boolean(options.python))) {
			this.dolphindb = false;
			this.language = "python";
		}
		if (options.q !== void 0 && (this.q = Boolean(options.q))) {
			this.dolphindb = false;
			this.language = "q";
		}
		if (options.sql !== void 0) this.sql = options.sql;
		if (options.streaming !== void 0) this.streaming = options.streaming;
	}
	on_message(buffer, websocket) {
		throw new Error(t$1("这是在调用 this.rpc 之前默认的 on_message, 不应该被调用到，除非建立连接后 server 先推送了 message"));
	}
	on_error() {}
	async connect() {
		if (this.connected) return;
		if (this.error) throw this.error;
		const { resource: websocket } = this.lwebsocket;
		if (websocket && (websocket.readyState === WebSocket.CLOSING || websocket.readyState === WebSocket.CLOSED)) throw this.error = new DdbConnectionError(this.url);
		return this.pconnect ??= new Promise(async (resolve, reject) => {
			this.on_error = () => {
				reject(this.error);
			};
			try {
				let url = new URL(this.url);
				if (this.streaming?.filters?.expression) url.searchParams.set("filter", this.streaming.filters.expression.trim());
				this.lwebsocket.resource = await connect_websocket(url, {
					protocols: this.streaming ? ["streaming"] : this.dolphindb ? void 0 : [this.language],
					on_message: (buffer, websocket) => {
						this.on_message(new Uint8Array(buffer), websocket);
					},
					on_error: (error) => {
						this.error ??= new DdbConnectionError(this.url, error);
						this.on_error();
					}
				});
			} catch (error) {
				this.error ??= new DdbConnectionError(this.url, error);
				reject(this.error);
				return;
			}
			try {
				assert(this.connected);
				await this.rpc("connect", { skip_connection_check: true });
				if (this.autologin && this.ticket) await this.login_by_ticket(void 0, true);
				if (this.streaming) await this.subscribe();
				resolve();
			} catch (error) {
				this.error ??= error;
				reject(error);
			}
		});
	}
	async login_by_ticket(ticket, skip_connection_check = false) {
		if (ticket) this.ticket = ticket;
		await this.invoke("authenticateByTicket", [this.ticket], {
			urgent: true,
			skip_connection_check
		});
	}
	get_rpc_options({ urgent = false, secondary = false, async: _async = false, pickle = false, clear = false, api = false, compress = false, cancellable = true, priority = urgent ? 8 : 4, parallelism = 64, root_id = "", limit } = {}) {
		let flag = 0;
		if (urgent) flag += 1;
		if (secondary) flag += 2;
		if (_async) flag += 4;
		if (pickle) flag += 8;
		if (clear) flag += 16;
		if (api) flag += 32;
		if (compress) flag += 64;
		if (this.python) flag += 2048;
		if (this.q) flag += 4096;
		flag += 2 ** 19 * this.sql;
		return [
			flag,
			cancellable ? 1 : 0,
			priority,
			parallelism,
			...limit ? [root_id, limit] : []
		].join("_");
	}
	disconnect() {
		const { resource } = this.lwebsocket;
		if (resource) {
			const { readyState } = resource;
			if (readyState !== WebSocket.CLOSED && readyState !== WebSocket.CLOSING) resource.close(1e3);
		}
	}
	async rpc(type, options) {
		const id = genid() % 1e3;
		let error = new DdbDatabaseError("", this.url, type, options, id);
		if (!options.skip_connection_check) await this.connect();
		const { script, func, args: _args = [], vars = [], urgent: u, listener, on_more_messages, ai } = options;
		if (func === "pnode_run") try {
			await (this.ppnode_run ??= this.eval(funcdefs.pnode_run[this.language], urgent));
		} catch (error) {
			this.ppnode_run = void 0;
			throw error;
		}
		const _listeners = [...this.listeners];
		return this.lwebsocket.request(async (websocket) => {
			if (this.error) throw this.error;
			const args = DdbObj.to_ddbobjs(_args);
			const rpc_id = `(id = ${id})`;
			const command = this.enc.encode((() => {
				switch (type) {
					case "function":
						if (this.verbose) if (args.length) console.log(func, args.map((arg) => arg.data()), rpc_id);
						else console.log(`${func}()`, rpc_id);
						assert(!func.includes("\0"), t$1("发送至 DolphinDB 执行的脚本中间不能含有 \\0"));
						return `function
${func}\n${args.length}\n${Number(DDB.le_client)}\n`;
					case "script":
						if (this.verbose) console.log(script, rpc_id);
						assert(!script.includes("\0"), t$1("发送至 DolphinDB 执行的脚本中间不能含有 \\0"));
						return (ai ? "ai" : "") + "script\n" + script;
					case "variable":
						if (this.verbose) vars.forEach((v, i) => {
							console.log(v, "=", args[i].data());
						});
						return `variable
${vars.join(",")}\n${vars.length}\n${Number(DDB.le_client)}\n`;
					case "connect":
						if (this.verbose) console.log("connect()" + (this.autologin && !this.ticket ? `
login(${this.username.quote()}, ${this.password.quote()})` : "") + ` ${rpc_id}`);
						return "connect\n" + (this.autologin && !this.ticket ? "login\n" + this.username + "\n" + this.password : "");
				}
			})());
			const result = await new Promise((resolve, reject) => {
				let first_message = true;
				this.on_error = () => {
					reject(this.error);
				};
				this.on_message = (buffer) => {
					if (!on_more_messages || first_message) try {
						if (this.print_message_buffer) console.log(buffer);
						const message = this.parse_message(buffer, error);
						listener?.(message, this);
						for (let i = _listeners.length - 1; i >= 0; --i) _listeners[i](message, this);
						const { type, data } = message;
						switch (type) {
							case "print":
								if (this.print_message) console.log(data);
								break;
							case "object":
								first_message = false;
								resolve(data);
								break;
							case "error":
								first_message = false;
								reject(data);
						}
					} catch (error) {
						reject(error);
					}
					else on_more_messages(buffer);
				};
				websocket.send(concat([
					this.enc.encode(`API2 ${this.sid} ${command.length} / ${this.get_rpc_options({ urgent: u })}\n`),
					command,
					...args.map((arg) => arg.pack())
				]));
			});
			if (this.verbose) console.log(result.data(), rpc_id);
			return result;
		});
	}
	async eval(script, { iife, ...options } = {}) {
		if (iife) {
			const lines = script.split_lines();
			if (lines.length < 2) throw new Error(t$1("iife 执行的脚本行数应该至少为 2 行"));
			script = "def () {\n" + lines.slice(0, -1).indent().join_lines() + `    return ${lines.last}\n} ()
`;
		}
		return this.rpc("script", {
			script,
			...options
		});
	}
	async call(func, args = [], { urgent: u, node, nodes, add_node_alias, listener, parse_object, skip_connection_check, on_more_messages } = {}) {
		let func_ = func;
		let args_ = args;
		if (node) {
			try {
				await (this.pjsrpc ??= this.eval(funcdefs.jsrpc[this.language], urgent));
			} catch (error) {
				this.pjsrpc = void 0;
				throw error;
			}
			func_ = "jsrpc";
			args_ = [
				node,
				func,
				new DdbVectorAny(args)
			];
		}
		if (nodes) {
			func_ = "pnode_run";
			args_ = [
				new DdbVectorString(nodes),
				func,
				new DdbVectorAny(args),
				...(() => {
					if (typeof add_node_alias !== "undefined") return [add_node_alias];
					if (this.python) return [true];
					return [];
				})()
			];
		}
		return this.rpc("function", {
			func: func_,
			args: args_,
			urgent: u,
			listener,
			parse_object,
			skip_connection_check,
			on_more_messages
		});
	}
	async invoke(func, args, options) {
		let convertable = true;
		let has_ddbobj = false;
		if (args) for (const arg of args) if (arg && arg instanceof DdbObj) has_ddbobj = true;
		else if (arg === void 0 || arg === null) {} else {
			const type = typeof arg;
			if (type === "string" || type === "boolean") {} else convertable = false;
		}
		let result;
		if (function_definition_patterns[this.language].test(func)) func = await this.define(func, { urgent: options?.urgent });
		if (convertable) result = await this.call(func, args, options);
		else {
			if (has_ddbobj) throw new Error(t$1("调用 ddb.invoke 的参数中不能同时有 DdbObj 与复杂 js 原生对象"));
			try {
				await (this.pinvoke ??= this.eval(funcdefs.invoke[this.language], urgent));
			} catch (error) {
				this.pinvoke = void 0;
				throw error;
			}
			result = await this.call("invoke", [func, JSON.stringify(args)], options);
		}
		return result.data(options);
	}
	async execute(script, options) {
		return (await this.eval(script, options)).data(options);
	}
	async upload(vars, args, { listener, parse_object } = {}) {
		assert(args.length && args.length === vars.length, t$1("variable 指令参数不能为空且参数名不能为空，且数量应该匹配"));
		return this.rpc("variable", {
			vars,
			args,
			listener,
			parse_object
		});
	}
	async cancel() {
		let ddb = new DDB(this.url, {
			autologin: Boolean(this.ticket),
			ticket: this.ticket,
			username: this.username,
			password: this.password,
			verbose: this.verbose
		});
		if (!this.ticket) try {
			await ddb.invoke("login", [this.username, this.password]);
		} catch (error) {
			console.log(t$1("ddb.cancel 无 ticket，尝试通过密码 login 失败"));
		}
		try {
			await ddb.eval(`jobs = exec rootJobId from getConsoleJobs() where sessionId = ${this.sid}\nif (size(jobs))
    cancelConsoleJob(jobs)
`, urgent);
		} finally {
			ddb.disconnect();
		}
	}
	parse_message(buf, error) {
		if (buf[0] === 77 && buf[1] === 83 && buf[2] === 71 && buf[3] === 10) {
			assert(buf.at(-1) === 0, t$1("print 消息的 buffer 应该以 \\0 结束"));
			if (buf.indexOf(0) !== buf.length - 1) console.warn(t$1("print 消息的 buffer 中间不应该有 \\0"));
			return {
				type: "print",
				data: this.dec.decode(buf.subarray(4, -1))
			};
		}
		const ilf0 = buf.indexOf(10);
		const parts = this.dec.decode(buf.subarray(0, ilf0)).split(" ");
		this.sid = parts[0];
		this.le = Number(parts[2]) !== 0;
		const ils1 = ilf0 + 1;
		const ilf1 = buf.indexOf(10, ils1);
		const message = this.dec.decode(buf.subarray(ils1, ilf1));
		if (message !== "OK") {
			error.message = message;
			let lines = error.stack.split_lines();
			lines[0] += `: ${message}`;
			error.stack = lines.join_lines(false);
			return {
				type: "error",
				data: error
			};
		}
		const bufobj = buf.subarray(ilf1 + 1);
		if (this.print_object_buffer) console.log(bufobj);
		return {
			type: "object",
			data: error.options.parse_object ?? this.parse_object ? DdbObj.parse(bufobj, this.le) : new DdbObj({
				form: DdbForm.scalar,
				type: DdbType.void,
				length: 0,
				le: this.le,
				buffer: bufobj
			})
		};
	}
	async subscribe() {
		let first = true;
		let win = {
			offset: 0,
			data: [],
			objs: []
		};
		let schema;
		console.log(t$1("订阅流表成功:"), (await this.call("publishTable", [
			"localhost",
			new DdbInt(0),
			this.streaming.table,
			this.streaming.action ||= `api_js_${(/* @__PURE__ */ new Date()).getTime()}`,
			this.streaming.offset === void 0 || this.streaming.offset === null ? new DdbVoid() : new DdbInt(this.streaming.offset),
			this.streaming.filters?.column || new DdbVoid()
		], {
			skip_connection_check: true,
			on_more_messages: (buffer) => {
				try {
					let data;
					const dv = new DataView(buffer.buffer, buffer.byteOffset, buffer.byteLength);
					const i_topic_end = buffer.indexOf(0, 17);
					const obj = DdbObj.parse(buffer.subarray(i_topic_end + 1), this.le);
					if (obj.form === DdbForm.scalar && obj.type === DdbType.string) {
						this.disconnect();
						const value = obj.value;
						throw new Error(value.slice(value.indexOf(":") + 1).trim());
					}
					if (first) {
						schema = data = obj.data({ table: "full" });
						data.name ||= this.streaming.table;
						first = false;
					} else {
						let rows;
						if (obj.form === DdbForm.table) {
							data = obj.data({ table: "full" });
							data.name ||= schema.name;
							rows = data.data.length;
						} else {
							const _data = obj.data();
							const { columns } = schema;
							rows = _data[0]?.length || 0;
							data = {
								...schema,
								data: seq(rows, (i) => zip_object(columns, seq(columns.length, (j) => _data[j][i])))
							};
						}
						win.data.push(...data.data);
						win.objs.push(obj);
						if (win.data.length >= 1e4 * 2 && win.objs.length >= 2) {
							let winsize_ = 0;
							let i = win.objs.length - 1;
							for (; winsize_ < winsize; i--) winsize_ += win.objs[i].value[0].rows;
							win.offset += win.data.length - winsize_;
							win.data = win.data.slice(-winsize_);
							win.objs = win.objs.slice(i);
						}
					}
					this.streaming.handler({
						...this.streaming,
						id: dv.getBigInt64(9, this.le),
						time: dv.getBigInt64(1, this.le),
						topic: this.dec.decode(buffer.subarray(17, i_topic_end)),
						obj,
						data,
						window: win
					});
				} catch (error) {
					this.streaming.handler({
						...this.streaming,
						error
					});
				}
			}
		})).data());
	}
	async define(definition, { urgent } = {}) {
		const matches = function_definition_patterns[this.language].exec(definition);
		if (!matches) throw new Error(t$1("DDB.define 方法传入的 definition 不符合函数定义格式 def xxx ()"));
		const func_name = matches[1];
		if (this.definitions.has(func_name)) return func_name;
		let promise = this.pdefinitions.get(func_name);
		if (!promise) this.pdefinitions.set(func_name, promise = this.execute(definition, { urgent }));
		await promise;
		this.definitions.set(func_name, definition);
		this.pdefinitions.delete(func_name);
		return func_name;
	}
	reset_definitions() {
		this.definitions.clear();
		this.pdefinitions.clear();
	}
};
const has_shared_array_buffer = typeof SharedArrayBuffer !== "undefined";
var BigInt128Array = class BigInt128Array {
	static of(...items) {
		return new BigInt128Array(items);
	}
	static from(arrayLike, mapfn, thisArg) {
		if (mapfn) {
			const array = [];
			for (let i = 0; i < arrayLike.length; i++) array.push(mapfn.call(thisArg, arrayLike[i], i));
			return new BigInt128Array(array);
		} else new BigInt128Array(arrayLike.length).set(arrayLike);
	}
	BYTES_PER_ELEMENT = 16;
	buffer;
	byteLength;
	byteOffset;
	constructor(fisrtArg, byteOffset, length) {
		if (typeof fisrtArg === "number") {
			const length = fisrtArg;
			this.buffer = new ArrayBuffer(length * this.BYTES_PER_ELEMENT);
			this.byteOffset = 0;
			this.byteLength = length * this.BYTES_PER_ELEMENT;
		} else if (fisrtArg instanceof ArrayBuffer || has_shared_array_buffer && fisrtArg instanceof SharedArrayBuffer) {
			this.buffer = fisrtArg;
			this.byteOffset = byteOffset ?? 0;
			let byteLength = 0;
			if (length !== void 0) {
				byteLength = length * this.BYTES_PER_ELEMENT;
				if (byteLength + this.byteOffset > fisrtArg.byteLength) throw new RangeError(`valid typed array length: ${length}`);
			} else {
				byteLength = fisrtArg.byteLength - this.byteOffset;
				if (byteLength % this.BYTES_PER_ELEMENT !== 0) throw new RangeError("byte length of BigInt128Array should be a multiple of 16");
			}
			this.byteLength = byteLength;
		} else {
			const array = [];
			for (const value of fisrtArg) array.push(value);
			this.buffer = new ArrayBuffer(array.length * this.BYTES_PER_ELEMENT);
			this.byteOffset = 0;
			this.byteLength = array.length * this.BYTES_PER_ELEMENT;
			this.set(array);
		}
		return new Proxy(this, {
			get(target, key) {
				if (typeof key === "string") {
					const index = Number(key);
					if (Number.isInteger(index) && index >= 0 && index < target.length) return target.at(index);
				}
				return Reflect.get(target, key);
			},
			set(target, key, value) {
				if (typeof key === "string") {
					const index = Number(key);
					if (Number.isInteger(index) && index >= 0 && index < target.length) target.set([value], index);
					return true;
				}
				return Reflect.set(target, key, value);
			},
			has(target, key) {
				if (typeof key === "string") {
					const index = Number(key);
					if (Number.isInteger(index) && index >= 0 && index < target.length) return true;
				}
				return Reflect.has(target, key);
			}
		});
	}
	get length() {
		return this.byteLength / this.BYTES_PER_ELEMENT;
	}
	set(array, offset = 0) {
		if (offset + array.length > this.length) throw new RangeError("offset is out of bounds");
		const dv = new DataView(this.buffer);
		for (let i = 0; i < array.length; i++) {
			const byteOffset = this.byteOffset + (offset + i) * this.BYTES_PER_ELEMENT;
			set_big_int_128(dv, byteOffset, array[i]);
		}
	}
	at(index) {
		const length = this.length;
		if (index < 0) index += length;
		if (index >= length || index < 0) return void 0;
		const dv = new DataView(this.buffer);
		return get_big_int_128(dv, this.byteOffset + index * this.BYTES_PER_ELEMENT);
	}
	subarray(begin = 0, end = this.length) {
		const length = this.length;
		if (begin < 0) begin += length;
		if (end < 0) end += length;
		if (begin < 0) begin = 0;
		else if (begin > length) begin = length;
		if (end < 0) end = 0;
		else if (end > length) end = length;
		const newLength = Math.max(end - begin, 0);
		return new BigInt128Array(this.buffer, this.byteOffset + begin * this.BYTES_PER_ELEMENT, newLength);
	}
	[Symbol.iterator]() {
		let index = 0;
		const array = this;
		return { next() {
			if (index < array.length) return {
				value: array.at(index++),
				done: false
			};
			else return { done: true };
		} };
	}
	toString() {
		const values = [];
		for (const value of this) values.push(value);
		return values.join(",");
	}
};
Object.defineProperty(BigInt128Array.prototype, Symbol.toStringTag, {
	configurable: false,
	writable: false,
	enumerable: false,
	value: "BigInt128Array"
});

//#endregion
//#region node_modules/.pnpm/xshell@1.4.38_supports-color@7.2.0/node_modules/xshell/storage.js
let storage = {
	getstr(key) {
		return localStorage.getItem(key) || "";
	},
	setstr(key, value = "") {
		localStorage.setItem(key, value);
	},
	get(key, _default = null) {
		const strvalue = localStorage.getItem(key);
		return strvalue === null ? _default : JSON.parse(strvalue);
	},
	set(key, value) {
		localStorage.setItem(key, JSON.stringify(value));
		return value;
	},
	list() {
		return Object.keys(localStorage);
	},
	delete(key) {
		localStorage.removeItem(key);
	},
	set_bool(key, value) {
		localStorage.setItem(key, value ? "1" : "0");
	},
	get_bool(key) {
		const v = localStorage.getItem(key);
		return v === null ? void 0 : v !== "0" && v !== "false";
	}
};

//#endregion
//#region i18n/dict.json
var dict_default = {
	控制台: { "en": "Console" },
	注销: { "en": "Log out" },
	登录: { "en": "Log in" },
	请先登录: { "en": "Please log in first" },
	"请先登录以使用 AI 功能": { "en": "Please log in to use AI features" },
	集群总览: { "en": "Cluster" },
	交互编程: { "en": "Shell" },
	作业管理: { "en": "Job" },
	文件系统: { "en": "DFS" },
	日志查看: { "en": "Log" },
	刷新: { "en": "Refresh" },
	"编译并刷新 (r)": { "en": "Compile and refresh (r)" },
	输入关键字后按回车可搜索作业: { "en": "Type keywords then press enter to search jobs" },
	同步作业: { "en": "Synchronized Jobs" },
	个进行中: { "en": "in progress" },
	异步作业: { "en": "Asynchronized Jobs" },
	个已完成: { "en": "finished" },
	定时作业: { "en": "Scheduled Jobs" },
	个已配置: { "en": "configured" },
	确认停止作业: { "en": "Stop the job?" },
	确认删除作业: { "en": "Delete the job?" },
	停止作业成功: { "en": "Stopped the job sucessfully" },
	删除作业成功: { "en": "Deleted the job successfully" },
	作业已完成: { "en": "Job is already finished" },
	停止: { "en": "Stop" },
	删除: { "en": "Delete" },
	请输入用户名: { "en": "Enter username." },
	" 用户名 (默认: admin)": { "en": " username (default: admin)" },
	请输入密码: { "en": "Enter password." },
	" 密码 (默认: 123456)": { "en": " password (default: 123456)" },
	运行中作业: { "en": "Running Jobs" },
	已提交作业: { "en": "Submitted Jobs" },
	已定时作业: { "en": "Scheduled Jobs" },
	登录成功: { "en": "Logged in successfully." },
	用户名或密码错误: { "en": "Incorrect username or password" },
	" 用户名": { "en": " Username" },
	" 密码": { "en": " Password" },
	停止作业指令发送成功: { "en": "The command of stopping the job was sent successfully" },
	集群管理: { "en": "Cluster Management" },
	新建集群: { "en": "Create Cluster" },
	确认删除集群: { "en": "Delete cluster" },
	集群删除成功: { "en": "Cluster deleted" },
	新建集群配置: { "en": "New Cluster Configuration" },
	集群创建成功: { "en": "Cluster created" },
	集群创建失败: { "en": "Cluster creation failed" },
	核: { "en": "core" },
	提交: { "en": "Submit" },
	重置: { "en": "Reset" },
	取消: { "en": "Cancel" },
	收起侧栏: { "en": "Collapse" },
	基本信息: { "en": "Basic Info" },
	配置参数: { "en": "Configuration" },
	集群参数: { "en": "Cluster Config" },
	控制节点参数: { "en": "Controller Config" },
	代理节点参数: { "en": "Agent Config" },
	请输入参数值: { "en": "Enter a config value." },
	保存更改: { "en": "Save" },
	编辑参数: { "en": "Edit" },
	提交参数修改: { "en": "Submit All" },
	重置全部参数: { "en": "Reset All" },
	参数重置成功: { "en": "parameters resetting succeed." },
	参数重置失败: { "en": "parameters resetting failed." },
	参数修改成功: { "en": "Configuration parameters successfully changed." },
	参数修改失败: { "en": "Submittion failed." },
	"确认重置?": { "en": "Reset parameters?" },
	"确认提交?": { "en": "Submit changes?" },
	名称: { "en": "Name" },
	模式: { "en": "mode" },
	版本: { "en": "Version" },
	服务: { "en": "Service" },
	状态: { "en": "Status" },
	状态_node_type: { "en": " Status" },
	操作: { "en": "Action" },
	当前值: { "en": "value" },
	默认值: { "en": "default value" },
	类型: { "en": "Type" },
	描述: { "en": "Description" },
	内存: { "en": "memory" },
	命名空间: { "en": "Namesapce" },
	日志模式: { "en": "log mode" },
	创建时间: { "en": "Created At" },
	存储类: { "en": "storage class" },
	输出到文件: { "en": "file" },
	输出到标准输出: { "en": "stdout" },
	同时输出到文件和标准输出: { "en": "file & stdout" },
	集群类型: { "en": "cluster type" },
	节点数: { "en": "number of nodes" },
	控制节点存储空间: { "en": "controller data size" },
	数据节点存储空间: { "en": "datanode data size" },
	"只能包含小写字母、数字以及'-'，必须以小写字母开头，以小写字母或数字结尾": { "en": "Cluster name must consist of lowercase letters, numbers or '-', start with lowercase letter and end with lowercase letter or number." },
	"集群名称只能包含小写字母、数字以及'-'，必须以小写字母开头，以小写字母或数字结尾": { "en": "Cluster name must consist of lowercase letters, numbers or '-', start with lowercase letter and end with lowercase letter or number." },
	控制节点配置: { "en": "Controller Configuration" },
	数据存储空间: { "en": "data size" },
	日志存储空间: { "en": "log size" },
	数据节点配置: { "en": "Datanode Configuration" },
	资源限制: { "en": "Resources Limit" },
	"确认重启？": { "en": "Restart node?" },
	正在重启节点: { "en": "Restarting node" },
	重启节点失败: { "en": "Restarting node failed" },
	重启: { "en": "Restart" },
	输入关键字搜索集群名称: { "en": "Input keywords to search cluster by name" },
	"内存已用 (已分配) / 最大可用": { "en": "memory used (allocated) / max" },
	"CPU 用量 (平均负载)": { "en": "CPU usage (load avg.)" },
	"当前连接 | 最大连接": { "en": "current | max connections" },
	"硬盘读取 | 硬盘写入": { "en": "hard disk read | write" },
	"网络接收 | 网络发送": { "en": "network receive | send" },
	"排队作业 | 运行作业": { "en": "queued | running jobs" },
	"排队任务 | 运行任务": { "en": "queued | running tasks" },
	端口: { "en": "port" },
	内存使用量: { "en": "memory usage" },
	"CPU 使用量": { "en": "cpu usage" },
	日志: { "en": "log" },
	日志刷新成功: { "en": "Log was refreshed successfully" },
	日志刷新失败: { "en": "Failed to refresh log" },
	配置: { "en": "Configuration" },
	显示所有配置: { "en": "Show All Configurations" },
	信息: { "en": "Info" },
	总览: { "en": "Overview" },
	数据: { "en": "Data" },
	数据表: { "en": "Tables" },
	"DolphinDB: 执行代码": { "en": "DolphinDB: Execute Code" },
	"DolphinDB: 执行当前行代码": { "en": "DolphinDB: Execute Current Line" },
	"DolphinDB: 保存代码": { "en": "DolphinDB: Save Code" },
	代码已保存在浏览器中: { "en": "The code is saved in the browser" },
	"确认删除服务？": { "en": "Delete service?" },
	服务删除成功: { "en": "Service deleted" },
	服务删除失败: { "en": "Service deletion failed" },
	"确认创建服务？": { "en": "Create service?" },
	服务创建成功: { "en": "Service created" },
	服务创建失败: { "en": "service creation failed" },
	创建: { "en": "Create" },
	控制节点: { "en": "Controller" },
	控制节点_node_type: { "en": "controller" },
	控制节点_node_type_title: { "en": "Controller" },
	数据节点: { "en": "Datanode" },
	数据节点_node_type: { "en": "datanode" },
	数据节点_node_type_title: { "en": "Datanode" },
	单机节点: { "en": " Standalone" },
	单机节点_node_type: { "en": "single" },
	单机节点_node_type_title: { "en": "Single" },
	单机: { "en": "Standalone" },
	集群监控: { "en": "Cluster Monitor" },
	计算节点: { "en": "Computenode" },
	计算节点_node_type: { "en": "computenode" },
	计算节点_node_type_title: { "en": "Computenode" },
	计算节点配置: { "en": "Computenode Configuration" },
	计算节点存储空间: { "en": "computenode data size" },
	集群: { "en": "cluster" },
	单控制节点: { "en": "singlecontroller" },
	多控制节点: { "en": "multicontroller" },
	"您访问的这个控制节点现在不是高可用 (raft) 集群的 leader 节点, 将会为您自动跳转到集群当前的 leader 节点: ": { "en": "The controller you're visiting is not the raft leader in the high-availability cluster. You will be redirected to the current leader: " },
	"左侧编辑器使用指南:\n": { "en": "Editor usage guide on the left\n" },
	"按 Ctrl + E 执行选中代码或光标所在行代码，点击 执行中 可取消作业\n": { "en": "Press Ctrl + E to execute selected code or the line of code where the cursor is placed. Click Executing to cancel the job\n" },
	"按 Ctrl + Shift + E 执行选中代码或全部代码\n": { "en": "Press Ctrl + Shift + E to execute selected code or all code\n" },
	"按 Ctrl + S 保存代码\n": { "en": "Press Ctrl + S to save the code\n" },
	"按 F1 查看更多编辑器命令": { "en": "Press F1 to see more editor commands" },
	终端: { "en": "Terminal" },
	隐藏终端: { "en": "Hide Terminal" },
	连接已关闭: { "en": "connection closed" },
	"连接出错: ": { "en": "connection errored: " },
	"已连接到: ": { "en": "connected to " },
	共享变量: { "en": "Shared Variables" },
	本地变量: { "en": "Local Variables" },
	成交量: { "en": "vol" },
	开盘价: { "en": "open" },
	收盘价: { "en": "close" },
	最高价: { "en": "high" },
	最低价: { "en": "low" },
	模块: { "en": "modules" },
	每节点最大可用内存: { "en": "max memory per node" },
	每节点最大可用核数: { "en": "max cores per node" },
	过期时间: { "en": "expiration" },
	最大节点数: { "en": "max nodes" },
	"绑定 CPU": { "en": "bind CPU" },
	许可类型: { "en": "license type" },
	授权类型: { "en": "authorization" },
	试用版: { "en": "trial" },
	商业版: { "en": "commercial" },
	社区版: { "en": "community" },
	客户名称: { "en": "client name" },
	授权客户: { "en": "client name" },
	内存已用: { "en": "memory used" },
	内存已分配: { "en": "memory allocated" },
	内存最大可用: { "en": "max memory available" },
	CPU用量: { "en": "CPU usage" },
	CPU平均负载: { "en": "CPU average load" },
	当前连接: { "en": "current connections" },
	最大连接: { "en": "maximum connections" },
	硬盘读取: { "en": "disk read rate" },
	硬盘写入: { "en": "disk write rate" },
	磁盘剩余容量: { "en": "disk free space" },
	磁盘总容量: { "en": "disk total capacity" },
	网络接收速率: { "en": "network receive rate" },
	网络发送速率: { "en": "network send rate" },
	排队作业: { "en": "queued jobs" },
	运行作业: { "en": "running jobs" },
	作业负载: { "en": "job load" },
	排队任务: { "en": "queued tasks" },
	运行任务: { "en": "running tasks" },
	"前 10 个查询耗费中间值": { "en": "last 10 queries' average cost" },
	"前 10 个查询耗费最大值": { "en": "last 10 queries' maximum cost" },
	"前 100 个查询耗费中间值": { "en": "last 100 queries' average cost" },
	"前 100 个查询耗费最大值": { "en": "last 100 queries' maximum cost" },
	前一分钟读磁盘容量: { "en": "last minute read volume rate" },
	前一分钟写磁盘容量: { "en": "last minute write volume rate" },
	前一分钟接收字节数: { "en": "last minute received bytes" },
	前一分钟发送字节数: { "en": "last minute send bytes" },
	前一批消息延时: { "en": "last message latency" },
	所有消息平均延时: { "en": "cumulative average latency" },
	节点内存空间上限: { "en": "memory limit" },
	"CPU 占用率": { "en": "CPU usage" },
	"CPU 平均负载": { "en": "CPU load average" },
	"worker 线程数": { "en": "workers" },
	"executor 线程数": { "en": "executors" },
	磁盘: { "en": "Disk" },
	磁盘读速率: { "en": "disk read rate" },
	磁盘写速率: { "en": "disk write rate" },
	前一分钟读磁盘量: { "en": "last minute disk read volume" },
	前一分钟写磁盘量: { "en": "last minute disk write volume" },
	网络: { "en": "network" },
	任务与作业: { "en": "Task and Job" },
	查询: { "en": "Query" },
	内存_perf: { "en": "Memory" },
	网络_perf: { "en": "Network" },
	磁盘可用空间占比: { "en": "disk available space ratio" },
	数据库: { "en": "Database" },
	全部折叠: { "en": "Collapse All" },
	"前 100 行": { "en": "The first 100 rows of table" },
	数据看板: { "en": "Dashboard" },
	"设置成功，目前小数位数为：": { "en": "Set up successfully, the current decimals is " },
	设置: { "en": "Set" },
	"设置小数位数: ": { "en": "Set decimal places: " },
	"重置成功，目前小数位数为：默认": { "en": "The reset is successful, the current number of decimal places is: default" },
	确定: { "en": "Confirm" },
	"正在加载代码编辑器...": { "en": "Loading code editor..." },
	在新窗口中打开: { "en": "Open in new window" },
	流表: { "en": "streaming table" },
	窗口: { "en": "window" },
	偏移量: { "en": "Offset" },
	继续显示流表更新: { "en": "continue to show flow table updates" },
	暂停显示流表更新: { "en": "pause showing flow table updates" },
	实时: { "en": "real time" },
	开始时间: { "en": "Start Time" },
	结束时间: { "en": "End Time" },
	错误信息: { "en": "Error Message" },
	"作业 ID": { "en": "Job ID" },
	"根作业 ID": { "en": "Root Job ID" },
	详情: { "en": "Description" },
	优先级: { "en": "Priority" },
	并行度: { "en": "Parallelism" },
	节点: { "en": "Node" },
	"用户 ID": { "en": "User ID" },
	收到作业时间: { "en": "Received Time" },
	"会话 ID": { "en": "Session ID" },
	"客户端 IP": { "en": "Client IP" },
	客户端端口: { "en": "Client Port" },
	全部任务: { "en": "Total Tasks" },
	已完成任务: { "en": "Finished Tasks" },
	正在运行的任务: { "en": "Running Tasks" },
	状态_job: { "en": "Status" },
	主题: { "en": "Theme" },
	进度: { "en": "Progress" },
	开始日期: { "en": "Start Date" },
	结束日期: { "en": "End Date" },
	执行频率: { "en": "Execution Frequency" },
	执行定时任务的时间: { "en": "Time to Execute" },
	执行定时任务的日期: { "en": "Date to Execute" },
	操作_job: { "en": "Actions" },
	首个任务开始时间: { "en": "First Task Start Time" },
	最后任务开始时间: { "en": "Last Task Start Time" },
	队列: { "en": "Queue" },
	类型_job: { "en": "Type" },
	"点击了 RefId 链接:": { "en": "RefId link clicked: " },
	实际位数: { "en": "actual decimals" },
	"输入应为空或介于 0 ~ 20": { "en": "Input should be empty or between 0 and 20" },
	"重置成功，目前小数位数为：实际位数": { "en": "Reset successfully, now with actual decimals " },
	上传文件: { "en": "Upload File" },
	文件上传路径: { "en": "Upload Path" },
	上传路径不能为空: { "en": "Upload path cannot be empty" },
	点击此处或者拖拽文件到此处: { "en": "Click or drag and drop a File here" },
	"确认启动？": { "en": "Start Node?" },
	启动节点失败: { "en": "Starting node failed" },
	启动: { "en": "Start" },
	"确认暂停？": { "en": "Pause Node?" },
	暂停成功: { "en": "Pausing node succeeded" },
	暂停节点失败: { "en": "Pausing node failed" },
	暂停: { "en": "Pause" },
	添加列: { "en": "Add column" },
	显示shchema信息: { "en": "Show schema" },
	显示前一百行数据: { "en": "Show first 100 rows" },
	添加成功: { "en": "Add successfully" },
	列名: { "en": "Name" },
	请输入列名: { "en": "Please enter the column name!" },
	请选择该列的类型: { "en": "Please select the type of the column!" },
	选择类型: { "en": "Select type" },
	注释: { "en": "Comment" },
	启动成功: { "en": "Start succeeded" },
	"上传文件至 {{instance}}": { "en": "Upload file to {{instance}}" },
	"Pod 内路径，如: /data/ddb/server/": { "en": "The path in the Pod, such as: /data/ddb/server/" },
	"文件大小限制 100 MB": { "en": "File size limit 100 MB" },
	"文件 {{filename}} 上传成功": { "en": "Upload succeeded" },
	"文件 {{filename}} 上传失败": { "en": "Upload failed" },
	设置_settings: { "en": "Settings" },
	文件上传成功: { "en": "File upload successfully" },
	文件上传失败: { "en": "File upload failed" },
	向下复制行: { "en": "Copy row down" },
	删除行: { "en": "Delete row" },
	"按 Ctrl + D 向下复制行\n": { "en": "Press Ctrl + D to copy lines down\n" },
	"按 Ctrl + Y 删除行\n": { "en": "Press Ctrl + Y to delete lines\n" },
	查看表结构: { "en": "Show table schema" },
	字体已全部加载: { "en": "Fonts are all loaded" },
	"正在加载字体...": { "en": "loading font" },
	首页: { "en": "Index" },
	模块数量: { "en": "number of modules" },
	"当前为中信证券的 web, 启用单点登录": { "en": "Currently for CITIC Securities' web, single sign-on is enabled" },
	"没有 sessionData 参数，将会跳转到登录页": { "en": "Without the sessionData parameter, it will jump to the login page" },
	"通过非 /dolphindb/ 路径直接访问中信证券 web": { "en": "Direct access to CITIC Securities web through a path other than /dolphindb/" },
	"ticket 登录失败": { "en": "ticket logged in failed" },
	"{{username}} 使用账号密码登陆成功": { "en": "{{username}} successfully logged in with the account password" },
	"没有自动登录的 ticket": { "en": "Tickets without auto-login" },
	"{{username}} 使用 ticket 登陆成功": { "en": "{{username}} successfully logged in with ticket" },
	"通过 session 登录失败，即将跳转到单点登录页": { "en": "Failed to log in through session, will jump to the single sign-on page" },
	"通过 session 登录成功:": { "en": "Successful logged in by session:" },
	"节点类型:": { "en": "node type:" },
	"节点名称:": { "en": "node name:" },
	"控制节点:": { "en": "control node:" },
	"版本:": { "en": "version:" },
	"集群节点:": { "en": "cluster nodes:" },
	"当前节点:": { "en": "current node:" },
	保存代码至浏览器中: { "en": "Save the code to the browser" },
	保存: { "en": "Save" },
	执行选中代码或全部代码: { "en": "Execute the selected code or all code" },
	执行: { "en": "Execute" },
	"当前连接正在执行作业，请等待": { "en": "The current connection is executing a job, please wait" },
	"按 Tab 补全函数\n": { "en": "Press Tab to complete functions\n" },
	查看数据表结构: { "en": "View data table structure" },
	查看前一百行数据: { "en": "View the first hundred rows of data" },
	词典: { "en": "dict" },
	个键: { "en": "keys" },
	集合: { "en": "set" },
	向量: { "en": "vector" },
	个元素: { "en": "items" },
	表格: { "en": "Table" },
	行: { "en": "rows" },
	列: { "en": "columns" },
	矩阵: { "en": "matrix" },
	备份管理: { "en": "Backup Management" },
	名字: { "en": "Name" },
	备份信息: { "en": "Backup Information" },
	主机: { "en": "Host" },
	新建备份: { "en": "Create Backup" },
	基础信息: { "en": "Basic Information" },
	服务器信息: { "en": "Server Information" },
	最大备份数: { "en": "Max Backups" },
	备份: { "en": "Backups" },
	还原: { "en": "Restores" },
	服务地址: { "en": "End Point" },
	供应商: { "en": "Providers" },
	访问密钥: { "en": "AccessKey" },
	加密密钥: { "en": "SecretAccessKey" },
	共享目录_backup: { "en": "Path" },
	调度中: { "en": "Scheduled" },
	清理中: { "en": "Complete" },
	清理完成: { "en": "Cleaned" },
	参数异常: { "en": "Invalid" },
	路径信息: { "en": "Path Information" },
	用户名: { "en": "User ID" },
	新建: { "en": "Create" },
	此项必填: { "en": "This item is required" },
	集群信息: { "en": "Cluster Information" },
	桶名: { "en": "Prefix" },
	存储类名称: { "en": "Storage Class Name" },
	名称_backup: { "en": "Name" },
	创建时间_backup: { "en": "Created At" },
	操作_backup: { "en": "Operation" },
	完成: { "en": "Complete" },
	云端存储配置: { "en": "Cloud Storage Configuration" },
	添加云端存储配置: { "en": "Add Cloud Storage Configuration" },
	云端存储类型: { "en": "Cloud Storage Type" },
	备份源: { "en": "Source of Backup" },
	存储路径: { "en": "Storage Path" },
	存储信息: { "en": "Storage Information" },
	存储空间: { "en": "Storage Space" },
	"确认删除？": { "en": "Delete?" },
	"确认重新触发？": { "en": "Retrigger?" },
	重新触发: { "en": "Retrigger" },
	类型_backup: { "en": "Type" },
	存储备份文件的存储系统配置: { "en": "Storage system configuration for storing backup files" },
	存储临时备份文件的存储卷名称: { "en": "The name of the storage volume where temporary backup files are stored" },
	区域: { "en": "Region" },
	"this.streaming.data 中的元素应该是 vector": { "en": "Elements in this.streaming.data should be vector" },
	"没有 mandate_code 参数，将会跳转到登录页": { "en": "Without the mandatory_code parameter, it will jump to the login page" },
	"代码地图:": { "en": "Code Map" },
	"回车补全:": { "en": "Enter Completion" },
	"字体大小:": { "en": "Font Size:" },
	"是否取消执行中的作业？": { "en": "Do you want to cancel the job in progress?" },
	取消作业: { "en": "Cancel Job" },
	不要取消: { "en": "Do Not Cancel" },
	执行中: { "en": "Executing" },
	空闲中: { "en": "Idle" },
	"按 Tab 或 Enter 补全函数\n": { "en": "Press Tab or Enter to complete functions\n" },
	控制是否显示缩略图: { "en": "Controls whether code mini map are displayed" },
	"控制除了 Tab 键以外，Enter 键是否同样可以接受建议。这能减少“插入新行”和“接受建议”命令之间的歧义。": { "en": "Controls whether the Enter key accepts suggestions in addition to the Tab key. This reduces the ambiguity between the \"insert newline\" and \"accept suggestion\" commands." },
	"函数文档 {{fname}} 已加载": { "en": "function documentation {{fname}} loaded" },
	下限必须小于上限: { "en": "Lower limit must be less than upper limit" },
	上限必须大于下限: { "en": "Upper limit must be greater than lower limit" },
	升级: { "en": "Upgrade" },
	下限: { "en": "Lower Limit" },
	上限: { "en": "Upper Limit" },
	"升级失败，请查看网络请求": { "en": "Upgrade failed, please check the network request" },
	"升级 {{name}}": { "en": "Upgrade {{name}}" },
	的词典: { "en": " dict" },
	"的 {{type}} 集合": { "en": " {{type}} set" },
	"的 {{type}} 向量": { "en": " {{type}} vector" },
	的表格: { "en": " table" },
	的流表: { "en": " streaming table" },
	的矩阵: { "en": " matrix" },
	排队中: { "en": "queuing" },
	已完成: { "en": "completed" },
	出错了: { "en": "failed" },
	"运行中_job.status": { "en": "running" },
	"登录后可查看{{info}}": { "en": "You need to be logged in to view {{info}}" },
	当前节点日志: { "en": "the logs of the current node" },
	去登录: { "en": "To log in" },
	下限必须小于或等于上限: { "en": "The lower bound must be less than or equal to the upper bound" },
	上限必须大于或等于下限: { "en": "The upper bound must be greater than or equal to lower bound" },
	升级成功: { "en": "Update successed" },
	运行正常: { "en": "Available" },
	等待调度: { "en": "Unschedulable" },
	已暂停: { "en": "Paused" },
	准备中_pending: { "en": "Pending" },
	开发: { "en": "development" },
	生产: { "en": "production" },
	使用默认账号密码登录失败: { "en": "Failed to log in with the default account and password" },
	"license 版本": { "en": "license version" },
	"web 构建时间": { "en": "web build time" },
	"web 开始初始化，当前处于{{mode}}模式，版本为 {{version}}": { "en": "The web starts to initialize, it is currently in {{mode}} mode, and the version is {{version}}" },
	"License Server 地址": { "en": "License Server Address" },
	"运行以下脚本时出错:\n": { "en": "An error occurred while running the following script:\n" },
	"调用 {{func}} 函数时出错，参数为:\n": { "en": "Error calling {{func}} function with arguments:\n" },
	"调用栈:\n": { "en": "Call stack:\n" },
	"web 初始化成功": { "en": "web initialization succeeded" },
	"使用 admin 账号密码登录失败": { "en": "Log in with admin account password failed" },
	"没有自动登录的 username": { "en": "No autologin username" },
	"getTablesByTabletChunk 应该只返回一个对应的 table": { "en": "getTablesByTabletChunk should only return a corresponding table" },
	"应该只有一个满足条件的 PartitionFile 在 PartitionDirectory 下面": { "en": "There should be only one PartitionFile that satisfies the condition under PartitionDirectory" },
	"directories 和 file 应该只有一个有值，另一个为空": { "en": "directories and file should only have a value, the other should be empty" },
	"数据库路径应该以 dfs:// 开头": { "en": "The database path should start with dfs://" },
	结构: { "en": "schema" },
	结构_title: { "en": "Schema" },
	分区数据: { "en": "partition data" },
	分区的数据: { "en": "partitioned data" },
	分区: { "en": "partitions" },
	"sites 中应该有存放 chunk 所在节点的信息": { "en": "There should be information about the node where the chunk is stored in sites" },
	登录后查看: { "en": "Log in to view" },
	去登陆: { "en": "To log in" },
	"web 强制登录:": { "en": "web login required:" },
	请登录: { "en": "Please log in" },
	其他方式: { "en": "Other" },
	机器指纹绑定: { "en": "Machine Fingerprint Bind" },
	在线验证: { "en": "Online Verify" },
	"LicenseServer 验证": { "en": "LicenseServer Verify" },
	"是否为 LicenseServer": { "en": "Is LicenseServer" },
	是: { "en": "Yes" },
	否: { "en": "No" },
	所有节点最大可用内存: { "en": "Max memory all nodes" },
	所有节点最大可用核数: { "en": "Max cores all nodes" },
	"数据节点:": { "en": "datanode:" },
	测试版: { "en": "test" },
	所有节点可用内存之和: { "en": "The sum of available memory of all nodes" },
	所有节点可用核数之和: { "en": "The sum of available cores of all nodes" },
	没有找到可以正常访问的节点: { "en": "Can not find a node that can be accessed normally" },
	", 即将关闭页面": { "en": ", the page will be closed" },
	设置注释: { "en": "Set comment" },
	设置注释成功: { "en": "Set comment successfully" },
	"输入列名，支持包含特殊字符": { "en": "Enter the name of the column, which supports special characters" },
	运行中_node: { "en": "Ready" },
	调度中_backup: { "en": "Scheduling" },
	运行中_backup: { "en": "Running" },
	运行成功: { "en": "Succeeded" },
	运行失败_backup: { "en": "Failed" },
	已就绪: { "en": "Ready" },
	调度中_cluster: { "en": "Progressing" },
	运行失败_cluster: { "en": "Unavailable" },
	未就绪: { "en": "Unknown" },
	"转译错误信息出错，待解析文本 {{ text }}": { "en": "An error occurred while translating the error message, text to be parsed: {{ text }}" },
	"启用 JIT": { "en": "Enable JIT" },
	日志管理: { "en": "Log Management" },
	复制: { "en": "Copy" },
	复制成功: { "en": "Copied successfully" },
	上一步: { "en": "Go Back" },
	"建表中...": { "en": "Creating table..." },
	创建失败: { "en": "Creation has failed" },
	"数据库路径 (directory)": { "en": "directory" },
	表类型: { "en": "table type" },
	分布式表: { "en": "partition table" },
	维度表: { "en": "dimension table" },
	表名: { "en": "Table Name" },
	已存在相同名称的表: { "en": "A table with the same name already exists" },
	数据列: { "en": "Data column" },
	分区列: { "en": "partition columns" },
	排序列: { "en": "sort columns" },
	重复值处理方式: { "en": "de-duplicate method" },
	保留全部: { "en": "keep all" },
	保留最后一项: { "en": "keep last" },
	保留第一项: { "en": "keep first" },
	下一步: { "en": "Next" },
	创建数据表: { "en": "Create table" },
	命令预览: { "en": "Command preview" },
	执行成功: { "en": "Execution finished" },
	创建数据库: { "en": "Create database" },
	数据库路径不能为空: { "en": "db path cannot be empty" },
	数据库路径不能包含双引号: { "en": "db path cannot contain double quotes" },
	请输入数据库路径: { "en": "Please enter db path" },
	分区层级: { "en": "partition layer count" },
	"分区层级必须在1-3之间": { "en": "Partition layer count must be between 1 and 3" },
	分区类型不能为空: { "en": "Partition type cannot be empty" },
	"顺序分区。分区方案格式为：整型标量，表示分区的数量。": { "en": "Sequential partition. partitionScheme format: integer scalar, indicating the number of partitions." },
	顺序分区: { "en": "sequential partition" },
	"范围分区。分区方案格式为：向量，向量的任意两个相邻元素定义分区的范围。": { "en": "Range partition. partitionScheme format: vector, where any two adjacent elements of the vector define the range of a sub-partition." },
	范围分区: { "en": "range partition" },
	"哈希分区。分区方案格式为：元组，第一个元素是分区列的数据类型，第二个元素是分区的数量。": { "en": "Hash partition. partitionScheme format: tuple, where the first element is the data type of the partition column, and the second element is the number of partitions." },
	哈希分区: { "en": "hash partition" },
	"值分区。分区方案格式为：向量，向量的每个元素定义了一个分区。": { "en": "Value partition. partitionScheme format: vector, where each element of the vector defines a partition." },
	值分区: { "en": "value partition" },
	"列表分区。分区方案格式为：嵌套向量，外层向量的每个元素定义了一个分区。": { "en": "List partition. partitionScheme format: vector of vector, where each element of the outer vector defines a partition." },
	列表分区: { "en": "list partition" },
	分区方案不能为空: { "en": "Partition scheme cannot be empty" },
	分区位置: { "en": "partition location" },
	"存储引擎 (engine)": { "en": "engine" },
	请选择存储引擎: { "en": "Please select storage engine" },
	"OLAP 引擎。OLAP 数据表的每个列存储为一个文件，数据以追加的方式存储到相应的列文件中，因此，数据写入的顺序决定了它们的存储顺序。": { "en": "OLAP engine. Each column of an OLAP table is stored as a file, and the data is stored in the corresponding column file in an append-only manner, so the order in which the data is written determines their storage order." },
	"TSDB 引擎。采用经典的 LSMT 模型，引入了排序列以提升在用户查询某个或少数几个设备（股票）在特定时间段数据的场景下的查询性能。": { "en": "TSDB engine. Using the classic LSMT model, the sorted column is introduced to improve the query performance in the scenario where the user queries the data of a few devices (or stocks) in a specific time period." },
	"写入事务原子性 (atomic)": { "en": "atomic" },
	请选择写入事务原子性: { "en": "Please select transaction atomicity" },
	"写入事务的原子性层级为事务，即一个事务写入多个分区时，若某个分区被其他写入事务锁定而出现写入冲突，则该事务的写入全部失败。因此，该设置下，不允许并发写入同一个分区。": { "en": "Transaction level transaction atomicity. That is, when a transaction writes to multiple partitions, if a partition is locked by another write transaction and a write conflict occurs, all writes of this transaction fail. Therefore, in this setting, concurrent writes to the same partition are not allowed." },
	事务级原子性: { "en": "transaction level transaction atomicity" },
	"写入事务的原子性层级为分区。若一个事务写入多个分区时，某分区被其它写入事务锁定而出现冲突，系统会完成其他分区的写入，同时对之前发生冲突的分区不断尝试写入，尝试数分钟后仍冲突才放弃。此设置下，允许并发写入同一个分区，但由于不能完全保证事务的原子性，可能出现部分分区写入成功而部分分区写入失败的情况。同时由于采用了重试机制，写入速度可能较慢。": { "en": "Partition level transaction atomicity. If a transaction writes to multiple partitions, and one of the partitions is locked by another write transaction so that a conflict occurs, the system will complete the write to other partitions first, and continuously attempts to write to the conflicted partition, giving up after several minutes of unsuccessful attempts. In this setting, concurrent writes to the same partition are allowed, but because the atomicity of the transaction cannot be guaranteed, it is possible that some partitions are written successfully while others fail. At the same time, due to the retry mechanism, the write speed may be slower." },
	分区级原子性: { "en": "partition level transaction atomicity" },
	"分区粒度 (chunkGranularity)": { "en": "chunkGranularity" },
	请选择分区粒度: { "en": "Please select chunk granularity" },
	"表级分区，设置后支持同时写入同一分区的不同表。": { "en": "Table level chunk granularity. Different tables can be written to the same partition at the same time." },
	表级分区: { "en": "table level chunk granularity" },
	"数据库级分区，设置后只支持同时写入不同分区。": { "en": "Database level chunk granularity. Only different partitions can be written to at the same time." },
	数据库级分区: { "en": "database level chunk granularity" },
	已存在相同名称的列: { "en": "A column with the same name already exists" },
	数据类型: { "en": "Data Type" },
	备注: { "en": "Comment" },
	压缩算法: { "en": "Compression" },
	"列 {{columns}} 不支持排序": { "en": "Column {{columns}} does not support sorting" },
	"索引列 {{columns}} 不能为 TIME, TIMESTAMP, NANOTIME, NANOTIMESTAMP 类型": { "en": "Index column {{columns}} cannot be of type TIME, TIMESTAMP, NANOTIME, and NANOTIMESTAMP" },
	清空: { "en": "Clear" },
	预览: { "en": "Preview" },
	脚本预览: { "en": "Script Preview" },
	"创建数据库的脚本:": { "en": "Scripts for creating database:" },
	创建数据库成功: { "en": "Database created successfully." },
	"{{i18nIndex}}分区类型 (partitionType)": { "en": "{{i18nIndex}} partitionType" },
	"请选择{{i18nIndex}}分区类型": { "en": "Please select the partition type of the {{i18nIndex}} partition" },
	"{{i18nIndex}}分区方案 (partitionScheme)": { "en": "{{i18nIndex}} partitionScheme" },
	"请输入{{i18nIndex}}分区方案": { "en": "Please enter the partition scheme of the {{i18nIndex}} partition" },
	参考教程: { "en": "Reference" },
	一级: { "en": "first" },
	二级: { "en": "second" },
	三级: { "en": "third" },
	仅支持单机节点和数据节点创建数据表: { "en": "Only single node and data node support create table" },
	"当前节点不是数据节点或单机节点，暂不支持在当前节点上创建数据库。": { "en": "The current node is not a data node or a single node, and does not support creating database yet." },
	仅支持单机节点和数据节点创建数据库: { "en": "Only single node and data node support create database" },
	小数位数: { "en": "Scale" },
	请输入小数位数: { "en": "Please input scale" },
	小数位数超出限制: { "en": "Scale out of limit" },
	分区方案: { "en": "Partition Schema" },
	请根据分区方案顺序选择分区列: { "en": "Please select partition columns according to partition schema" },
	该数据库没有需要配置的分区列: { "en": "This database has no partition columns that need to be configured" },
	"请先登录再调用 init": { "en": "Please login first before calling init" },
	登录失败: { "en": "Login Failed" },
	"jwt token 过期时间无法解析:": { "en": "invalid jwt token expire time:" },
	"License 过期提醒": { "en": "License expiration reminder" },
	"DolphinDB License 已过期，请联系管理人员立即更新，避免数据库关闭": { "en": "DolphinDB License has expired, please contact the administrator to update immediately to avoid database shutdown" },
	"DolphinDB License 将在两周内过期，请提醒管理人员及时更新，避免数据库过期后自动关闭": { "en": "The DolphinDB License will expire within two weeks, please remind the administrators to update it in time to avoid automatic shutdown of the database after expiration" },
	修改密码: { "en": "Change password" },
	登出: { "en": "Log out" },
	修改失败: { "en": "Fail to change password" },
	两次输入密码不一致: { "en": "The passwords entered twice are inconsistent" },
	请输入新密码: { "en": "Please enter a new password" },
	请重新输入新密码: { "en": "Please re-enter the new password" },
	确认: { "en": "Confirm" },
	刷新信息: { "en": "Refresh" },
	启动节点: { "en": "Start node" },
	停止节点: { "en": "Stop node" },
	集群节点配置: { "en": "Cluster Node Configuration" },
	已启动: { "en": "activated" },
	未启动: { "en": "unactivated" },
	"work 线程数": { "en": "num of worker" },
	读速率: { "en": "read rate" },
	前一分钟读入: { "en": "last minute read" },
	写速率: { "en": "write rate" },
	前一分钟写入: { "en": "last minute written" },
	用量: { "en": "Usage" },
	接收速率: { "en": "receive rate" },
	前一分钟接收: { "en": "last minute received bytes" },
	发送速率: { "en": "send rate" },
	前一分钟发送: { "en": "last minute sent bytes" },
	代理节点: { "en": "Agent" },
	单机总览: { "en": "Single Node Overview" },
	"worker 线程总数": { "en": "num of worker" },
	"executor 线程总数": { "en": "num of executor" },
	全部展开: { "en": "expand all" },
	占用率: { "en": "usage" },
	平均负载: { "en": "average load" },
	已分配: { "en": "allocated" },
	读: { "en": "read" },
	前一分钟读: { "en": "read (1 min)" },
	写: { "en": "write" },
	前一分钟写: { "en": "written (1 min)" },
	收: { "en": "receive" },
	前一分钟收: { "en": "received (1 min)" },
	发: { "en": "send" },
	前一分钟发: { "en": "sent (1 min)" },
	"代理节点: ": { "en": "agent node" },
	全选: { "en": "select all" },
	控制: { "en": "controller" },
	代理: { "en": "agent" },
	节点不可停止: { "en": "node is not stoppable" },
	确认启动以下节点: { "en": "Confirm the following nodes are to be started" },
	确认停止以下节点: { "en": "Confirm that the following nodes are to be stopped" },
	运行中: { "en": "running" },
	当前连接数: { "en": "connections" },
	最大连接数: { "en": "max number of connections" },
	前一批消息时延: { "en": "pre batch msgs delay" },
	所有消息平均时延: { "en": "all msgs avg latency" },
	"控制节点不可停止，停止控制节点将无法对集群节点进行启停操作。": { "en": "The control node cannot be stopped.Stopping the control node will not be able to start and stop the cluster nodes." },
	"代理节点不可停止，停止代理节点会导致控制节点发出的命令无法执行。": { "en": "The agent node cannot be stopped. Stopping the agent node will cause the commands issued by the controller node to be unable to be executed." },
	代理节点不可跳转: { "en": "agent nodes cannot navigate" },
	"当前用户未登录，请登录后再进行启停操作。": { "en": "Please log in before this operation." },
	"CDN 部署时无法使用配置管理": { "en": "Configuration management is not available for CDN deployments" },
	"设置当前代码执行的 SQL 标准": { "en": "Sets the SQL standard for the current code execution" },
	"SQL 标准:": { "en": "SQL Standard:" },
	"确认切换 SQL 标准？": { "en": "Confirm to switch SQL standard?" },
	"切换 SQL Standard 后，当前页面将会刷新，且内存变量会清空": { "en": "After switching to SQL Standard, the current page will be refreshed and the memory variables will be cleared" },
	"SQL 标准": { "en": "SQL Standard" },
	取消作业指令发送成功: { "en": "Cancel job command sent successfully" },
	点击可以取消当前执行中的作业: { "en": "Click to cancel the currently executing job" },
	"··· 共 {{total_lines}} 行 ···": { "en": "··· {{total_lines}} lines in total ···" },
	去启动节点: { "en": "To start the node" },
	没有正在运行的数据节点和计算节点: { "en": "No running data nodes" },
	偏移: { "en": "offset" },
	因子平台: { "en": "Starfish" },
	实时计算: { "en": "Computing" },
	流计算发布订阅状态: { "en": "Publish-Subscribe Status" },
	流引擎状态: { "en": "Streaming Engine Status" },
	流表状态: { "en": "Stream Table Status" },
	刷新成功: { "en": " refreshed successfully" },
	订阅线程状态: { "en": "Subscriber Thread State" },
	"表 SubWorkers 监控订阅节点的工作线程的状态。工作线程状态信息会按照 topic 来展示。": { "en": "Subscriber thread status. Displayed by subscription topic" },
	"表 PubTables 监控流数据表状态。每一行表示一个流数据表的信息。": { "en": "Stream table status" },
	订阅状态: { "en": "Subscriber status" },
	"表 SubConns 监控本地订阅节点和订阅节点之间的连接状态。": { "en": "Connection status between the local node and all publishing nodes" },
	发布状态: { "en": "Publisher Status" },
	"表 PubConns 监控本地发布节点和它的所有订阅节点之间的连接状态。": { "en": "Connection status between the local node and all subscribing nodes" },
	持久化线程状态: { "en": "Persistence thread status" },
	"表 PersistWorkers 监控负责持久化流数据表的工作线程的状态。": { "en": "Persistence thread status" },
	持久化共享流表状态: { "en": "Persisted shared stream table status" },
	"表 PersistenceMeta 返回启用了持久化的共享流数据表的元数据。": { "en": "Metadata of persisted shared stream tables" },
	非持久化共享流表状态: { "en": "Non-persisted shared stream table status" },
	"表 sharedStreamingTableStat 返回未启用持久化的共享流数据表的元数据。": { "en": "Metadata of non-persisted shared stream tables" },
	"表 EngineStat 返回流计算引擎的状态。": { "en": "Streaming engine status" },
	批量取消订阅: { "en": "Batch Unsubscribe" },
	"确认取消订阅选中的流数据表吗？": { "en": "Are you sure to unsubscribe the selected stream tables?" },
	批量删除: { "en": "Batch Delete" },
	"确认删除选中的引擎吗？": { "en": "Are you sure to delete the selected engines?" },
	"确认删除选中的持久化共享数据流表吗？": { "en": "Are you sure to delete the selected persisted shared stream tables?" },
	"确认删除选中的共享流数据表吗？": { "en": "Are you sure to delete the selected shared stream tables?" },
	"线程 ID": { "en": "Worker ID" },
	订阅主题: { "en": "Topic" },
	主题_data_collection: { "en": "Topic" },
	订阅队列深度: { "en": "Queue Depth" },
	订阅队列深度上限: { "en": "Queue Depth Limit" },
	最近处理失败的错误信息: { "en": "Last Error Message" },
	最近处理失败的时刻: { "en": "Last Failed Timestamp" },
	处理失败的消息总数: { "en": "Failed Message Count" },
	已处理消息数: { "en": "Processed Message Count" },
	"最近消息 ID": { "en": "Last Message ID" },
	"最近处理失败的消息 ID": { "en": "Last Failed Message ID" },
	共享流数据表: { "en": "Table Name" },
	订阅节点: { "en": "Subscriber" },
	最近消息的偏移量: { "en": "Message Offset" },
	订阅任务: { "en": "Actions" },
	发布队列深度上限: { "en": "Queue Depth Limit" },
	发布队列深度: { "en": "Queue Depth" },
	发布节点: { "en": "Publisher" },
	接收消息总量: { "en": "Cumulative Message Count" },
	接收消息平均延迟: { "en": "Average Message Latency" },
	最近消息的延迟: { "en": "Last Message Latency" },
	最近消息的接收时刻: { "en": "Last Update" },
	总行数: { "en": "Total Rows" },
	内存中行数: { "en": "Number of Rows in Memory" },
	内存中偏移量: { "en": "Offset in Memory" },
	磁盘中行数: { "en": "Number of Rows on Disk" },
	磁盘中偏移量: { "en": "Offset on Disk" },
	是否异步持久化: { "en": "Asynchronous Persistence" },
	保留时间: { "en": "Retention Minutes" },
	是否压缩: { "en": "Compressed" },
	持久化路径: { "en": "Persistence Dir" },
	持久化线程: { "en": "Persistence Worker" },
	"Raft 组": { "en": "Raft Group" },
	"Raft 日志序号": { "en": "Last Log Seq" },
	行数: { "en": "Number of Rows" },
	列数: { "en": "Number of Columns" },
	字节数: { "en": "Bytes" },
	引擎名: { "en": "Engine Name" },
	引擎类型: { "en": "Engine Type" },
	最近错误信息: { "en": "Last Error Message" },
	分组数: { "en": "Number of Groups" },
	"行数（单表）": { "en": "Number of Rows" },
	"行数（左表）": { "en": "Number of Rows (Left Table)" },
	"行数（右表）": { "en": "Number of Rows (Right Table)" },
	内存清理阈值: { "en": "Memory Cleanup Threshold" },
	指标数量: { "en": "Number of Metrics" },
	指标源码: { "en": "Metrics Code" },
	用户: { "en": "User" },
	窗口长度: { "en": "Window Size" },
	步长: { "en": "Step" },
	是否使用系统时间: { "en": "Use System Time" },
	快照目录: { "en": "Snapshot Directory" },
	快照间隔: { "en": "Snapshot Interval" },
	"快照 ID": { "en": "Snapshot ID" },
	快照时间戳: { "en": "Snapshot Timestamp" },
	触发方式: { "en": "Trigger" },
	触发间隔: { "en": "Trigger Interval" },
	时间间隔: { "en": "Time Interval" },
	等待时间间隔: { "en": "Wait Interval" },
	过滤条件: { "en": "Filter Condition" },
	"0 为绿色，1-10000 为橙色，10000 以上为红色。": { "en": "green: 0, orange: 1-10000, red: over 10000." },
	取消订阅成功: { "en": "Successfully unsubscribed" },
	引擎删除成功: { "en": "Deleted successfully" },
	流数据表删除成功: { "en": "Deleted successfully" },
	流数据表状态: { "en": "Stream tables status" },
	最近消息延迟: { "en": "last message latency" },
	最近消息接收时刻: { "en": "last message received time" },
	当前节点流计算状态: { "en": "Stream computing status" },
	队列深度: { "en": "Queue Depth" },
	队列深度上限: { "en": "Queue Depth Limit" },
	最近错误时刻: { "en": "Latest Error Timestamp" },
	失败消息总数: { "en": "Failed Message Count" },
	"最近错误消息 ID": { "en": "Latest Error Message ID" },
	最近接收时刻: { "en": "Receive Average Latency" },
	错误详细信息: { "en": "Errors" },
	详细: { "en": "Details" },
	接收平均延迟: { "en": "average receive latency" },
	流计算监控: { "en": "Streaming Monitor" },
	流计算引擎状态: { "en": "Streaming Engine Status" },
	"监控订阅节点的工作线程的状态。工作线程状态信息会按照 topic 来展示。": { "en": "Subscriber thread status. Displayed by subscription topic" },
	"监控本地发布节点和它的所有订阅节点之间的连接状态。": { "en": "Connection status between the local node and all subscribing nodes" },
	"监控负责持久化流数据表的工作线程的状态。": { "en": "Persistence thread status" },
	"监控启用了持久化的共享流数据表的元数据。": { "en": "Metadata of persisted shared stream tables" },
	"监控未启用持久化的共享流数据表的元数据。": { "en": "Metadata of non-persisted shared stream tables" },
	"监控流计算引擎的状态。": { "en": "Streaming engine status" },
	流数据表: { "en": "Stream Table" },
	取消订阅: { "en": "unsubscribe" },
	引擎: { "en": "Engines" },
	持久化共享数据流表: { "en": "Persisted Shared Stream Tables" },
	共享数据流表: { "en": "Shared Stream Tables" },
	"最近处理消息 ID": { "en": "Last Message ID" },
	条: { "en": "record" },
	毫秒: { "en": "millisecond" },
	更多信息: { "en": "More info" },
	点击查看: { "en": "click to view" },
	"请输入 'YES' 以确认该操作": { "en": "Please enter 'YES' to confirm this action" },
	"控制节点不支持流数据的发布订阅，请跳转到数据节点或计算节点查看流数据状态。": { "en": "Publishing/subscription of streaming data is not supported on the controller. Please switch to the data node or compute node to view the streaming status." },
	批量: { "en": "Batch " },
	当前配置不存在: { "en": "The current configuration does not exist" },
	"配置id重复，无法保存": { "en": "The configuration id is duplicated and cannot be saved" },
	"当前配置与已有配置重名，请改名": { "en": "The current configuration has the same name as the existing configuration, please change the name" },
	命名不可为空: { "en": "Name cannot be empty" },
	分布式数据库: { "en": "Distributed Database" },
	共享内存表: { "en": "Shared In-Memory Table" },
	函数视图: { "en": "Function View" },
	脚本权限: { "en": "script permissions" },
	"dfs 表名": { "en": "dfs table name" },
	"revoke 成功": { "en": "revoke successful" },
	权限赋予成功: { "en": "Permission granted successfully" },
	新增权限: { "en": "Add Access" },
	"请选择{{category}}": { "en": "Please choose {{category}}" },
	"请选择 dfs 数据库/表": { "en": "Please select DFS database/table" },
	请选择权限: { "en": "Please select permissions" },
	请选择权限类型: { "en": "Please select permission type" },
	增加: { "en": "add" },
	"当前查看{{role}}:": { "en": "currently viewing {{role}}" },
	组: { "en": "group" },
	"返回{{role}}列表": { "en": "return {{role}} list" },
	权限管理: { "en": "Permission" },
	权限查看: { "en": "permission view" },
	"请输入想要搜索的{{category}}": { "en": "Search {{category}}" },
	组名: { "en": "Group Name" },
	组内用户: { "en": "group members" },
	成员管理: { "en": "member management" },
	查看权限: { "en": "Access" },
	删除组: { "en": "Delete Group" },
	"确认删除组 {{group}} 吗": { "en": "Are you sure to delete {{group}}" },
	组删除成功: { "en": "Successfully Deleted" },
	新建组: { "en": "Create Group" },
	组创建成功: { "en": "Successfully Created" },
	成员: { "en": "Members" },
	请输入想查找的用户: { "en": "Please enter the user you want to search for" },
	"组 {{group}} 成员管理": { "en": "Manage Members for {{group}}" },
	成员修改成功: { "en": "Successfully Changed" },
	"确认删除选中的 {{num}} 个组吗？": { "en": "Are you sure to delete selected groups?" },
	请输入想要搜索的组: { "en": "Search Groups" },
	是否管理员: { "en": "Is Admin" },
	管理员: { "en": "Admin" },
	非管理员: { "en": "Non-admin" },
	请选择想要添加的组: { "en": "Please select the group." },
	重置密码: { "en": "Reset Password" },
	删除用户: { "en": "Delete User" },
	"确认删除用户 {{user}} 吗": { "en": "Are you sure to delete {{user}}?" },
	用户删除成功: { "en": "Successfully Deleted" },
	新建用户: { "en": "Create User" },
	用户创建成功: { "en": "Successfully Created" },
	密码: { "en": "Password" },
	确认密码: { "en": "Confirm Password" },
	"确认删除选中的 {{num}} 个用户吗？": { "en": "Are you sure to delete selected users?" },
	密码修改成功: { "en": "Successfully Reset Password." },
	"重置用户 {{user}} 密码": { "en": "Reset Password for {{user}}" },
	新密码: { "en": "New Password" },
	请输入想要搜索的用户: { "en": "Search Users" },
	用户管理: { "en": "User Management" },
	组管理: { "en": "Group" },
	数据面板: { "en": "Dashboard" },
	加载到内存: { "en": "Load into Memory" },
	内存大小: { "en": "Memory Size" },
	"查看数据库 {{db_name}} 用户权限": { "en": "View database {{db_name}} user permissions" },
	查看用户权限: { "en": "View user permissions" },
	"确认{{action}}选中的 ": { "en": "Are you sure to {{action}} the selected " },
	" 个{{item}}吗?": { "en": " {{item}} ?" },
	请选择想要添加的用户: { "en": "Please select the user you want to add." },
	请输入要搜索的流表名: { "en": "Please enter the table name you want to search." },
	以下内容已复制到剪切板: { "en": "The following content has been copied to the clipboard." },
	请编辑代码: { "en": "Please edit the code" },
	新建查询: { "en": "Create query" },
	向导查询: { "en": "Use Query Builder" },
	脚本查询: { "en": "Use Script Editor" },
	筛选查询列: { "en": "Select Columns" },
	查询列: { "en": "Selected" },
	非查询列: { "en": "Unselected" },
	增加查询列: { "en": "Add Column" },
	删除查询列: { "en": "Remove Column" },
	"查询列不可为空，请重新筛选！": { "en": "Select at least 1 column." },
	添加查询条件: { "en": "Set Query Conditions" },
	分区列查询条件: { "en": "Partitioning Columns" },
	"必填项，仅支持【且满足】，与”其他查询条件”亦为【且满足】关系。": { "en": "Set at least 1 condition. Conditions on partitioning columns can only be combined with others (on either partitioning or non-partitioning columns) using the AND operator." },
	请选择列名: { "en": "Select column" },
	请选择运算符: { "en": "Select operator" },
	请输入对比值: { "en": "Enter at least 1 value." },
	且满足: { "en": "AND" },
	增加且条件项: { "en": "Add AND condition" },
	删除该条件项: { "en": "Delete condition" },
	删除该条件块: { "en": "Delete condition group" },
	其他查询条件: { "en": "Non-Partitioning Columns" },
	或满足: { "en": "OR" },
	新增条件块: { "en": "Add Condition Group" },
	重置条件: { "en": "Reset" },
	"查看 SQL 语句": { "en": "View Generated Query" },
	返回修改: { "en": "Go Back" },
	预览数据: { "en": "Preview Data" },
	导出数据: { "en": "Export Data" },
	"当前数据量已达 50 万行，暂不支持导出功能。": { "en": "Cannot export data exceeding 500,000 rows." },
	"当前数据为空，暂不支持导出功能。": { "en": "No rows to export. Query returned no data." },
	"当前数据量已达 2000 万行的预览上限，此处仅显示部分截断数据。": { "en": "Showing a partial preview of the data. The full dataset exceeds 20 million rows." },
	"输入对比值时须带有通配符 “%”。“%” 表示任意 0 个或者多个字符，可匹配任意类型和长度的字符。使用时请注意区分大小写。以下为使用示例：": { "en": "The LIKE/NOT LIKE pattern must include the wildcard character %, which represents zero, one, or multiple characters of any type or length. It is case-sensitive. For example:" },
	"688%（匹配以 “688” 开头的字符串，能够匹配例如 “688101.SH”、”688101”的字符串）": { "en": "688% matches strings starting with \"688\", like \"688101\"." },
	"%SZ%（匹配包含 “SZ” 的字符串， 能够匹配例如 “300951.SZ”、 “SZ.300951”的字符串）": { "en": "%SZ% matches strings that contain \"SZ\", such as \"001SZ\"." },
	"%6（匹配以 “6” 结尾的字符串，能够匹配例如 “abcd6” 的字符串）": { "en": "%6 matches strings ending with \"6\", like \"abcd6\"." },
	"在对比值的下拉框中选择一个或多个枚举值。注意，下拉框中仅展示部分枚举值，且存在响应延时。": { "en": "For IN and NOT IN operators, the dropdown shows a subset of available values with a brief delay." },
	"请手动输入未显示的枚举值，单击回车键以完成操作。": { "en": "Alternatively, enter one or more values manually in the field, pressing 'Enter' after each." },
	复制代码: { "en": "Copy" },
	文件名: { "en": "File Name" },
	请输入文件名: { "en": "Specify a file name." },
	"等于 (=)": { "en": "= (Equal to)" },
	"不等于 (!=)": { "en": "!= (Not equal to)" },
	"匹配 (like)": { "en": "Like" },
	"不匹配 (not like)": { "en": "Not like" },
	"包含 (in)": { "en": "In" },
	"不包含 (not in)": { "en": "Not in" },
	"大于 (>)": { "en": "> (Greater than)" },
	"小于 (<)": { "en": "< (Less than)" },
	"大于等于 (>=)": { "en": ">= (Greater than or equal to)" },
	"小于等于 (<=)": { "en": "<= (Less than or equal to)" },
	导出成功: { "en": "Export successfully" },
	"共 {{total}} 条数据": { "en": "Number of Rows: {{total}}" },
	"请注意，无法删除或者编辑当前选中的选项": { "en": "Please note that currently selected options cannot be deleted or edited" },
	"仅单机节点、数据节点和计算节点支持新建查询": { "en": "Queries can only be created on data/compute nodes, or on a standalone server." },
	"CEP 流计算引擎": { "en": "CEP Streaming Engine" },
	引擎信息: { "en": "Engine Info" },
	数据视图: { "en": "Data View" },
	发送事件到引擎: { "en": "Send Event" },
	"CEP 引擎": { "en": "CEP Engine" },
	引擎名称: { "en": "Engine Name" },
	创建人: { "en": "Creator" },
	子引擎数: { "en": "Sub Engines" },
	"子引擎数：{{num}}": { "en": "Sub Engines: {{num}}" },
	接收事件数: { "en": "Received Events" },
	发送事件数: { "en": "Sent Events" },
	事件队列最大深度: { "en": "Maximum Event Queue Depth" },
	队列中发送事件数: { "en": "Sent Events in Output Queue" },
	子引擎信息: { "en": "Sub Engine Info" },
	事件队列中待处理事件数: { "en": "Pending Events in Event Queue" },
	事件监听数: { "en": "Event Listeners" },
	计时器数: { "en": "Timers" },
	插入队列头事件数: { "en": "Events Sent to Queue Head" },
	插入队列尾事件数: { "en": "Events Sent to Queue Tail" },
	匹配成功事件数: { "en": "Matched Events" },
	最近接收事件的时间: { "en": "Timestamp of the Last Received Event" },
	"请输入要查询的 key": { "en": "Please enter a key for query." },
	"发送事件到 {{name}} 引擎": { "en": "Send An Event to {{name}} Engine" },
	事件类型: { "en": "Event Type" },
	事件字段: { "en": "Fields" },
	类型说明: { "en": "DataTypes" },
	"{{type}} 的值": { "en": "Value of {{type}}" },
	"{{type}} 的精度": { "en": "Scale of {{type}}" },
	发送成功: { "en": "Success" },
	"字段类型有误，请检查": { "en": "The entered field type is incorrect." },
	请输入事件字段: { "en": "Please enter the fields." },
	请选择事件类型: { "en": "Please select the event type." },
	"数据类型为 {{name}}": { "en": "Please enter data of {{name}} type." },
	最近错误时间: { "en": "Last Error Time" },
	请选择数据视图: { "en": "Please select a data view" },
	监视器数: { "en": "Monitors" },
	"k 线图仅支持时间轴": { "en": "K-line only supports timeline" },
	配置管理: { "en": "Configuration" },
	请输入配置名: { "en": "Please enter config name" },
	"请输入配置名！": { "en": "Please enter config name!" },
	数值: { "en": "Value" },
	请输入配置值: { "en": "Please enter config value" },
	"请输入配置值！": { "en": "Please enter config value!" },
	"确认删除此配置项？": { "en": "Confirm to delete this config item?" },
	新增控制节点配置: { "en": "Add controller config" },
	请输入想要查找的配置项: { "en": "Please enter config name" },
	集群节点管理: { "en": "Cluster Node Management" },
	限定词: { "en": "Qualifier" },
	请输入选择器: { "en": "Please enter qualifier" },
	其它: { "en": "others" },
	新增配置: { "en": "New config" },
	请输入或选择配置项名: { "en": "Please enter or select a config item name" },
	请输入配置项值: { "en": "Please enter the config item value" },
	主机名: { "en": "Host" },
	请输入主机名: { "en": "Please enter host" },
	端口号: { "en": "Port" },
	请输入端口号: { "en": "Please enter the port" },
	别名: { "en": "Alias" },
	请输入别名: { "en": "Please enter an alias" },
	请选择节点类型: { "en": "Please select node mode" },
	"确认删除此节点？": { "en": "Confirm to delete this node?" },
	新增节点: { "en": "Add new node" },
	请输入想要查找的节点别名: { "en": "Please enter the node alias" },
	线程: { "en": "thread" },
	发布流: { "en": "streaming_pub" },
	订阅流: { "en": "streaming_sub" },
	系统: { "en": "system" },
	返回: { "en": "Return" },
	动作: { "en": "Actions" },
	撤销权限: { "en": "Revoke" },
	"确认 revoke 该权限吗？": { "en": "Confirm revoke permission?" },
	Revoke: { "en": "Revoke" },
	确认添加: { "en": "Confirm" },
	添加权限: { "en": "Add Access" },
	请选择权限应用范围: { "en": "Please select the access object." },
	应用范围为全局: { "en": "Global level" },
	预添加: { "en": "Add" },
	移除: { "en": "remove" },
	"Revoke 成功": { "en": "Revoke successfully" },
	"确认 revoke 选中的 {{num}} 条权限吗？": { "en": "Confirm {{num}} permissions selected by revoke?" },
	全局权限: { "en": "Global" },
	请输入组名: { "en": "Please enter a group name" },
	"组名长度不能超过 30 个字符": { "en": "Group name must be less than 30 characters." },
	预览修改: { "en": "Preview" },
	"确认对组 {{group}} 进行以下改动吗？": { "en": "Confirm the following changes to {{group}}?" },
	组内用户修改成功: { "en": "Users in the group have been modified successfully" },
	"原组内用户:": { "en": "Users in the original group" },
	"移入用户:": { "en": "Add" },
	"移出用户:": { "en": "Remove" },
	"非管理员不能查看权限管理模块。": { "en": "Available only for administrators." },
	"重置用户 ": { "en": "Reset user " },
	"用户 {{user}} 所属组管理": { "en": "Manage Groups for {{user}}" },
	请输入想查找的组: { "en": "Search Groups" },
	"确认对用户 {{user}} 进行以下改动吗？": { "en": "Confirm the following changes to {{user}}?" },
	用户所属组修改成功: { "en": "Successfully Changed" },
	"原有组:": { "en": "Groups" },
	"移入组:": { "en": "Move into" },
	"移出组:": { "en": "Move out" },
	用户组管理: { "en": "group management" },
	管理权限: { "en": "Manage Access" },
	批量撤销: { "en": "Revoke Access" },
	"DFS 表名": { "en": "DFS tables" },
	"确认撤销该权限吗？": { "en": "Are you sure to revoke this access?" },
	"确认撤销选中的 {{num}} 条权限吗？": { "en": "Are you sure to delete selected access?" },
	"当前{{role}}:": { "en": "Current {{role}}" },
	组成员: { "en": "Members" },
	"组名只能包含字母、下划线或数字，并且不能以数字或下划线开头": { "en": "Group name can only use letters, digits or underscores (_), and must start with letters." },
	非组成员: { "en": "Non-Members" },
	组成员修改成功: { "en": "Successfully Changed" },
	管理成员: { "en": "Manage Members" },
	所属组: { "en": "Group" },
	"请输入用户名!": { "en": "Please enter user ID." },
	"用户名长度不能超过 30 个字符": { "en": "User ID must be less than 30 characters." },
	"用户名只能包含字母、下划线或数字，并且不能以数字或下划线开头": { "en": "User ID can only use letters, digits or underscores (_), and must start with letters." },
	"请输入密码!": { "en": "Enter password." },
	"密码长度为 6-20 个字符，且不包含空格或中文": { "en": "Use a password 6-20 characters long. Spaces and Chinese characters are not allowed." },
	"请再次输入密码!": { "en": "Please confirm your password." },
	"两次输入密码需要保持一致!": { "en": "Your passwords do not match." },
	未所属组: { "en": "Other Groups" },
	管理用户组: { "en": "Manage Groups" },
	范围: { "en": "Scope" },
	"原组成员:": { "en": "Members" },
	设置密码: { "en": "Set Password" },
	设置权限: { "en": "Manage Access" },
	设置用户组: { "en": "Manage Groups" },
	配置项: { "en": "Key" },
	请输入配置项: { "en": "Please enter key" },
	"请输入配置项！": { "en": "Please enter key" },
	请输入或选择配置项: { "en": "Please enter or select key" },
	"主机名 / IP 地址": { "en": "Hostname/IP address" },
	"请输入主机名 / IP 地址": { "en": "Please enter hostname/IP address" },
	"请输入正确的主机名 / IP 地址": { "en": "Please enter correct hostname/IP address" },
	流发布: { "en": "streaming_pub" },
	流订阅: { "en": "streaming_sub" },
	停用: { "en": "Disable" },
	"{{label}}{{active_label}}提示": { "en": "{{label}} {{active_label}} tips" },
	"{{label}}{{active_label}}成功": { "en": "{{label}} {{active_label}} successfully" },
	可选功能: { "en": "Optional Features" },
	表结构必须大于等于三列: { "en": "The table structure must be greater than or equal to three columns" },
	库名: { "en": "Database Name" },
	请输入库名: { "en": "Please enter a database name." },
	"已有同名库，请修改": { "en": "A database with the same name already exists." },
	请输入表名: { "en": "Please enter a table name." },
	"仅支持数字、大小写字母、中文以及下划线，且必须以中文或英文字母开头": { "en": "The name can only use letters, digits or underscores (_), and must start with letters." },
	是否为时序数据: { "en": "Time-Series Data" },
	按时间顺序记录的数据: { "en": "A sequence of data points collected over time intervals" },
	日增数据量: { "en": "Daily Increment" },
	"0 - 10 万": { "en": "0 - 100K" },
	"10 万 - 100 万": { "en": "100K - 1M" },
	"100 万 - 1000 万": { "en": "1M - 10M" },
	"1000 万 - 1 亿": { "en": "10M - 100M" },
	"1 亿 - 10 亿": { "en": "100M - 1B" },
	"10 亿 - 100 亿": { "en": "1B - 10B" },
	"100 亿以上": { "en": "Over 10B" },
	自定义日增数据量: { "en": "Custom Daily Increment" },
	请输入自定义日增数据量: { "en": "Please enter a daily increment." },
	数据总量: { "en": "Total Data Volume" },
	"0 - 200 万": { "en": "0 - 2M" },
	"200 万以上": { "en": "Over 2M" },
	自定义数据总量: { "en": "Custom Total Data Volume" },
	请输入自定义数据总量: { "en": "Please enter a total data volume" },
	测点数: { "en": "Number of Measurements" },
	"以车联网数据采集场景为例说明测点含义。一辆车有发动机、轮胎、油箱等传感器，需要采集发动机、轮胎、油箱等数据，在这个场景中，测点是车辆，而不是传感器。": { "en": "Supposing a vehicle has multiple sensors collecting data from its components (such as engines, tires, and tanks), the measurement refers to the vehicle, not the sensor." },
	请输入测点数: { "en": "Please enter the number of measurements." },
	"已配置该列，请修改": { "en": "This column is already set." },
	请选择数据类型: { "en": "Please select the column type." },
	"DECIMAL 精度": { "en": "scale" },
	"DECIMAL32 精度有效范围是[0, 9]，DECIMAL64 精度有效范围是[0, 18]，DECIMAL128 精度有效范围是[0,38]": { "en": "The scale range is [0,9] for DECIMAL32, [0,18] for DECIMAL64, and [0,38] for DECIMAL128." },
	请输入备注: { "en": "Please set the column comment." },
	增加列配置: { "en": "Add Column" },
	"时序数据或总数据量大于 200 万的非时序数据，表结构至少有一列时间列与枚举列": { "en": "For time-series data (or non-time-series data with volume over 2M), the table must contain at least one time column and one enumeration column." },
	表结构至少包含一列时间列: { "en": "The table must contain at least one time column." },
	"请注意，至少需要一列时间列与枚举列，时间列类型包括DATE、DATETIME、TIMESTAMP、NANOTIMESTAMP，枚举列类型包括STRING、SYMBOL、CHAR。": { "en": "Note: at least one time column and one enumeration column are required. A temporal type can be DATE, DATETIME, TIMESTAMP, or NANOTIMESTAMP, and an enumerated type can be STRING, SYMBOL, or CHAR." },
	"请注意，至少需要一列枚举列，枚举列类型包括STRING、SYMBOL、CHAR。": { "en": "Note: at least one enumeration column are required. An enumerated type can be STRING, SYMBOL, or CHAR." },
	导入表文件: { "en": "Import Table" },
	导入方式: { "en": "Source" },
	本地导入: { "en": "Local" },
	服务器导入: { "en": "Remote" },
	自定义分隔符: { "en": "Custom Delimiter" },
	"默认分隔符为 ','，可自定义分隔符": { "en": "The default delimiter is ',' (comma). Please enter a custom delimiter." },
	"仅支持上传 csv 文件与 txt 文件": { "en": "Only CSV and TXT files are supported." },
	文件地址: { "en": "File Path" },
	请输入文件在服务器的绝对路径地址: { "en": "Please enter the absolute path of the file on the server." },
	常用筛选列: { "en": "Filter Columns" },
	请选择常用筛选列: { "en": "Please select filter columns" },
	"常用筛选列是查询时常作为常选条件的列，越重要的过滤条件，在筛选列中的位置越靠前。": { "en": "The filter columns are columns that are frequently used as filtering conditions in queries. It is recommended to arrange these columns by query frequency, with the most commonly used one at the beginning of the list." },
	"请选择两个常用筛选列，第一列需为时间列，第二列需为设备编号列": { "en": "Select two filter columns. The first column must be a time column, and the second column must be a device ID column." },
	"表结构中无 {{name}} 列，请修改": { "en": "Column {{name}} does not exist." },
	请选择两个常用筛选列: { "en": "Please select two filter columns." },
	"第一个常用筛选列必须为时间类型（DATE、DATETIME、TIMESTAMP、NANOTIMESTAMP）": { "en": "The first filter column must be of temporal type (DATE, DATETIME, TIMESTAMP, or NANOTIMESTAMP)." },
	"第二个常用筛选列必须为枚举类型（CHAR、SYMBOL、STRING）": { "en": "The second filter column must be of enumerated type (CHAR, SYMBOL, or STRING)." },
	存储引擎: { "en": "Storage Engine" },
	"存储引擎的选择与业务有关，若您的计算需求常以一定的时间跨度进行，推荐使用 TSDB 存储引擎；若您的查询常用于全量数据的密集计算，推荐使用 OLAP 存储引擎": { "en": "TSDB storage engine is recommended for computations over data within a specific time period; OLAP is recommended for queries on the entire dataset." },
	是否允许并发写入同一分区: { "en": "Concurrent Writes to the Same Partition" },
	"允许并发写入同一分区，会降低写入速度，且有极小概率导致数据不一致": { "en": "Enabling concurrent writes will decrease the write speed and could pose a minimal risk of data inconsistency." },
	建议不允许并发写入同一分区: { "en": "It is recommended to disable this feature." },
	请选择分区列: { "en": "Please select the partitioning columns." },
	"请选择两个分区列，第一个分区列为数据时间列，第二个分区列为设备编号列。": { "en": "Please select two partitioning columns: The first is a time column and the second is a deviceID column." },
	"第一个分区列需为时间类型 DATE、DATETIME、TIMESTAMP 或 NANOTIMESTAMP": { "en": "The first partitioning column must be of DATE, DATETIME, TIMESTAMP or NANOTIMESTAMP type" },
	"除第一列外，其余分区列的数据类型需为 STRING、SYMBOL 或 CHAR": { "en": "The data type of other partitioning columns must be STRING, SYMBOL or CHAR" },
	"分区列的数据类型需为 STRING、SYMBOL 或 CHAR": { "en": "The data type of the partitioning column must be STRING, SYMBOL or CHAR" },
	数据时间列: { "en": "Time Column" },
	请选择数据时间列: { "en": "Please select the time column" },
	唯一值数量: { "en": "Number of Distinct Values" },
	请填入唯一值数量: { "en": "Please enter the number of distinct values." },
	"已配置该常用筛选列，请修改": { "en": "This filter column is already set." },
	增加筛选列: { "en": "Add Filter Column" },
	"除分区列外，请选择查询时常作为过滤条件的列。越重要的过滤条件，在过滤列中的位置越靠前。结合您提供的信息，最多可选择2个常用筛选列，建议第一个过滤列为设备编号列。": { "en": "Apart from the partitioning columns, please select columns that are frequently used as filtering conditions during queries. It is recommended to arrange these columns by query frequency, with the most commonly used one at the beginning of the list. You can specify at most 2 filter columns, and the first one is recommended to be the device ID column." },
	重复数据保留策略: { "en": "Keep Duplicates" },
	"在同一个分区内，常用筛选列与时间列值相同的数据的处理策略，DolphinDB提供了三种策略": { "en": "How to deal with records with duplicate filter columns and time column values." },
	"ALL：保留所有数据": { "en": "ALL (recommended): keep all records;" },
	"LAST：仅保留最新数据": { "en": "LAST: only keep the last record;" },
	"FIRST：仅保留第一条数据": { "en": "FIRST: only keep the first record." },
	请选择重复数据保留策略: { "en": "Please select the policy for keeping duplicates." },
	生成脚本: { "en": "Generate Script" },
	导出表单配置: { "en": "Export Database Configuration" },
	立即执行: { "en": "Execute Script" },
	"确认要执行当前建库脚本吗?": { "en": "Execute the current script?" },
	"数据库 {{name}}": { "en": "Database: {{name}}" },
	"数据表 {{name}}": { "en": "Table: {{name}}" },
	再次创建: { "en": "Retry" },
	"错误信息: {{error_msg}}": { "en": "Error Message: {{error_msg}}" },
	建库信息: { "en": "Create Database" },
	建表信息: { "en": "Create Table" },
	是否使用现有库: { "en": "Use Existing Database" },
	现有库: { "en": "Database" },
	请选择现有库: { "en": "Please select an existing database." },
	新建库名: { "en": "Database Name" },
	请输入新建库名: { "en": "Please enter a database name." },
	日增量: { "en": "Daily Increment" },
	请选择日增量: { "en": "Please select a daily increment." },
	"0 - 1 万": { "en": "0 - 10k" },
	"1 万 - 10 万": { "en": "10k - 100k" },
	"总数据量小于 200 万且不新增": { "en": "Total data volume under 2M with no new additions" },
	"分区列 {{name}}": { "en": "Partitioning Column {{name}}" },
	"数据类型为 {{data_types}}": { "en": "Data type: {{data_types}}" },
	时间列: { "en": "Time Column" },
	"严格按时序增长排列的时间类型列，将按该列对数据进行分区": { "en": "Specify a partitioning column with time series data collected chronologically." },
	请选择时间列: { "en": "Please select the time column." },
	标的列: { "en": "Symbol Column" },
	"如股票ID、期货品种这样的枚举类型列，将按该列对数据进行分区": { "en": "Specify a partitioning column with enumerated values such as security ID and futures contract." },
	请选择标的列: { "en": "Please select the symbol column." },
	"经常用于查询时筛选数据的列，不能是除 INT 外的数值类型，最多只可选两列": { "en": "The filter columns are columns that are frequently used as filtering conditions in queries. It cannot be of numeric types other than INT. At most 2 filter columns can be specified." },
	"请注意，表结构至少需要一列时间列，时间列类型包括 {{name}}": { "en": "Note: The table must contain at least one time column. A temporal type can be {{name}}." },
	请输入唯一值数量: { "en": "Please enter the number of distinct values." },
	"根据已有数据库的分区信息，选择需要作为划分数据依据的列": { "en": "Select the partitioning columns based on the current partitioning scheme." },
	请选择日增数据量: { "en": "Please select a daily increment." },
	总数据量: { "en": "Total data volume" },
	请输入文件名称: { "en": "Please enter a file name." },
	"库 {{name}} 下已有该表，请修改表名": { "en": "The table name must be unique in database {{name}}." },
	"请选择一个分区列（数据时间列）。": { "en": "Please select a partitioning column (time column)." },
	"除分区列外，请选择查询时常作为过滤条件的列。越重要的过滤条件，在过滤列中的位置越靠前。结合您提供的信息，最多可选择1个常用筛选列，建议第一个过滤列为数据时间列。": { "en": "Apart from the partitioning columns, please select columns that are frequently used as filtering conditions during queries. It is recommended to arrange these columns by query frequency, with the most commonly used one at the beginning of the list. You can specify at most one filter column, and is recommended to be the data time column." },
	"请选择一个分区列（设备编号列）。": { "en": "Please select a partitioning column (device number column)." },
	"除分区列外，请选择查询时常作为过滤条件的列。越重要的过滤条件，在过滤列中的位置越靠前。": { "en": "Apart from the partitioning columns, please select columns that are frequently used as filtering conditions during queries. It is recommended to arrange these columns by query frequency, with the most commonly used one at the beginning of the list." },
	"除分区列外，请选择查询时常作为过滤条件的列。越重要的过滤条件，在过滤列中的位置越靠前。结合您提供的信息，最多可选择2个常用筛选列,建议第一个过滤列为设备编号列。": { "en": "Apart from the partitioning columns, please select columns that are frequently used as filtering conditions during queries. It is recommended to arrange these columns by query frequency, with the most commonly used one at the beginning of the list. You can specify at most two filter columns, and the first one is recommended to be the device ID column." },
	"结合您提供的信息，最多可选择2个常用筛选列，建议第一个过滤列为设备编号列。": { "en": "You can specify at most two filter columns, and the first one is recommended to be the device ID column." },
	"结合您提供的信息，最多可选择2个常用筛选列。": { "en": "You can specify at most two filter columns." },
	"结合您提供的信息，最多可选择1个常用筛选列。": { "en": "You can specify at most one filter column." },
	"除分区列外，请选择查询时常作为过滤条件的列。越重要的过滤条件，在过滤列中的位置越靠前。结合您提供的信息，最多可选择1个常用筛选列。": { "en": "Apart from the partitioning columns, please select columns that are frequently used as filtering conditions during queries. It is recommended to arrange these columns by query frequency, with the most commonly used one at the beginning of the list. You can specify at most one filter column." },
	简易版: { "en": "Basic" },
	进阶版: { "en": "Advanced" },
	第一步: { "en": "Step 1" },
	第二步: { "en": "Step 2" },
	导入配置: { "en": "Import Database Configuration" },
	点击或将文件拖拽到此区域: { "en": "Drag & drop or click here " },
	"仅支持上传 JSON 文件": { "en": "to upload a JSON file" },
	请上传文件: { "en": " Please upload a database configuration file." },
	运维工具: { "en": "Management Tools" },
	物联网库表向导: { "en": "IoT Scenario Guide" },
	金融库表向导: { "en": "Financial Scenario Guide" },
	执行结果: { "en": "Execution Result" },
	"数据库：{{name}}": { "en": "Database: {{name}}" },
	"数据表：{{name}}": { "en": "Table: {{name}}" },
	常用筛选列不能包含分区列: { "en": "Common filter columns cannot contain partition columns" },
	"此功能专为金融用户设计。用户通过此功能无需设计分区方案或编写复杂的 SQL 语句，只需输入库表名称、列名等基本信息，并通过列表选择参数，即可快速生成建库建表脚本，进而完成库表创建。": { "en": "Guided database and table creation for financial scenarios. This feature allows you to create databases and tables by providing basic information such as database, table, and column names. Simply select parameter values from a list, and the script is automatically generated. No need to worry about partitioning design or write complex SQL statements." },
	您确定要启用此功能吗: { "en": "Enable this feature?" },
	您确定要停用此功能吗: { "en": "Disable this feature?" },
	"此功能专为物联网用户设计。用户通过此功能无需设计分区方案或编写复杂的 SQL 语句，只需输入库表名称、列名等基本信息，并通过列表选择参数，即可快速生成建库建表脚本，进而完成库表创建。": { "en": "Guided database and table creation for IoT scenarios.  This feature allows you to create databases and tables by providing basic information such as database, table, and column names. Simply select parameter values from a list, and the script is automatically generated. No need to worry about partitioning design or write complex SQL statements." },
	功能设置: { "en": "Feature Settings" },
	"此工具专为物联网用户设计。用户通过此工具无需设计分区方案或编写复杂的 SQL 语句，只需输入库表名称、列名等基本信息，并通过列表选择参数，即可快速生成建库建表脚本，进而完成库表创建。": { "en": "Guided database and table creation for IoT scenarios.  This tool allows you to create databases and tables by providing basic information such as database, table, and column names. Simply select parameter values from a list, and the script is automatically generated. No need to worry about partitioning design or write complex SQL statements." },
	"已存在，粘贴失败!": { "en": "already exists, paste failed" },
	"初始化数据面板成功！": { "en": "Dashboard initialized successfully" },
	新数据面板: { "en": "New dashboard" },
	"提示：初始化后请完善相关配置（详见文档），并重启服务器": { "en": "After initialization, please set configuration parameters (see user manual) and restart the server." },
	新数据源: { "en": "New data source" },
	请输入新数据源的名称: { "en": "Enter a name for the data source" },
	新变量: { "en": "New variable" },
	请输入新变量的名称: { "en": "Enter a name for the variable" },
	"web 版本": { "en": "web version" },
	是否排序: { "en": "Sort" },
	"为多列设置排序时需设置优先级，该值越高表明优先级越高": { "en": "Set a priority when sorting multiple columns. Higher value means higher priority." },
	自定义端标签: { "en": "Custom end label" },
	"支持静态标签与模板变量，其中模板变量包含以下几种": { "en": "Supports static labels and template variables. Template variables include:" },
	"{a}：数据列名称": { "en": "{a}: Column name" },
	"{c}：当 x 轴为类目轴时显示 y 轴值，其余轴的情况下显示 x 轴值, y 轴值": { "en": "{c}: Display Y-axis value for a categorical X-axis, Otherwise, display both X and Y axes values." },
	"{b}：x 轴值": { "en": "{b}: X-axis value" },
	"示例: 名称-{a}": { "en": "Example: name-{a}" },
	"请注意，不填自定义端标签时默认展示 y 轴值": { "en": "Note: Y-axis is displayed by default if no custom end label is not filled." },
	请输入自定义端标签: { "en": "Enter custom end label" },
	仅数值类型可支持排序: { "en": "Only numeric types can be sorted" },
	标题: { "en": "Title" },
	数据源: { "en": "Data source" },
	基本属性: { "en": "Properties" },
	"数值轴，适用于连续数据": { "en": "Numerical axis, for continuous data" },
	"时间轴，适用于连续的时序数据": { "en": "Time axis, for continuous time-series data" },
	"对数轴，适用于对数数据": { "en": "Logarithmic axis, for logarithmic data" },
	"X 轴名称": { "en": "X-axis name" },
	增加数据列: { "en": "Add data column" },
	"增加 Y 轴": { "en": "Add Y-axis" },
	坐标列: { "en": "Axis column" },
	"是否展示 X 缩略轴": { "en": "Abbreviated X-axis" },
	"是否展示 Y 缩略轴": { "en": "Abbreviated Y-axis" },
	保存并应用: { "en": "Save and Apply" },
	请先选中您需要更改配置的图表: { "en": "Select the chart to change configuration" },
	请为您的图表配置数据源: { "en": "Configure data source for your chart" },
	图表: { "en": "Charts" },
	图例: { "en": "Legend" },
	提示: { "en": "Hint" },
	"X 轴缩略轴": { "en": "Abbreviated X-axis" },
	"Y 轴缩略轴": { "en": "Abbreviated Y-axis" },
	位置: { "en": "Position" },
	左侧: { "en": "Left" },
	"关联 Y 轴": { "en": "Associated Y-axis" },
	列配置: { "en": "Column configuration" },
	增加映射: { "en": "Add mappings" },
	原始列名: { "en": "Original column name" },
	展示列名: { "en": "Displayed column name" },
	分页设置: { "en": "Pagination settings" },
	需要分页: { "en": "Pagination required" },
	默认分页数: { "en": "Default page count" },
	编辑数据源: { "en": "Edit data source" },
	堆叠值: { "en": "Stack value" },
	同个类目轴上为数据列配置相同的堆叠值可以堆叠放置: { "en": "Columns with the same stack value on the same categorical axis can be stacked." },
	关联变量: { "en": "Associated variables" },
	"类目轴，适用于离散的类目数据，或者时序数据": { "en": "Categorical axis, for discrete categorical data or time-series data" },
	字号: { "en": "Font size" },
	强制包含零刻度: { "en": "Include zero" },
	底数: { "en": "Base" },
	时间格式化: { "en": "Time format" },
	"数据列 1": { "en": "Data column 1" },
	热力值列: { "en": "Heatmap column" },
	颜色: { "en": "Color" },
	标记点: { "en": "Marker points" },
	水平线: { "en": "Horizontal line" },
	阈值: { "en": "Threshold" },
	低于阈值配色: { "en": "Color below threshold" },
	高于阈值配色: { "en": "Color above threshold" },
	线类型: { "en": "Line type" },
	展示端标签: { "en": "Display end labels" },
	散点大小: { "en": "Scatter size" },
	散点标记: { "en": "Scatter marker" },
	阴暗色: { "en": "Dark color" },
	明亮色: { "en": "Bright color" },
	最小值: { "en": "Minimum" },
	最大值: { "en": "Maximum" },
	展示标签: { "en": "Display labels" },
	"Y 轴相对于左右默认位置的偏移": { "en": "Y-axis offset from default left/right position" },
	"Y 轴": { "en": "Y-axis" },
	"X 轴配置": { "en": "X-axis configuration" },
	"Y 轴配置": { "en": "Y-axis configuration" },
	每行变量数: { "en": "Variables per row" },
	查询按钮: { "en": "Query button" },
	"不展示查询按钮的情况，表单更新即会进行查询，在变量设置较多的情况下，建议使用查询按钮，点击之后再运行数据源代码": { "en": "Without setting a query button, updates on forms will trigger queries. It's recommended to set and click the query button for view with multiple variables before running the data source code." },
	上内边距: { "en": "Top" },
	下内边距: { "en": "Bottom" },
	左内边距: { "en": "Left" },
	右内边距: { "en": "Right" },
	标题字号: { "en": "Title font size" },
	提示框: { "en": "Tooltip" },
	展示网格线: { "en": "Display grid lines" },
	展示边框: { "en": "Display border" },
	展示列选择: { "en": "Display column selection" },
	倒序展示: { "en": "Display in reverse order" },
	流数据开启此功能可将最新的数据插入到表格头部: { "en": "Enable to display new data on top" },
	"启用此选项之后，会在表格内层滚动": { "en": "Enable inner scroll in table" },
	禁止滚动: { "en": "Disable scrolling" },
	变量设置: { "en": "Variable settings" },
	是否展示: { "en": "Display" },
	列宽: { "en": "Column width" },
	"数值列可设置阈值，设置之后后超过阈值的数值展示为红色，低于阈值则展示为绿色，非数值列不生效": { "en": "Thresholds can be set for numeric columns. Values above the threshold will be red, below green." },
	字体颜色: { "en": "Font color" },
	背景颜色: { "en": "Background color" },
	是否千分位: { "en": "Thousands separator" },
	对齐方式: { "en": "Alignment" },
	数据轴: { "en": "Numerical axis" },
	类目轴: { "en": "Categorical axis" },
	对数: { "en": "Logarithmic" },
	右侧: { "en": "Right" },
	平均值: { "en": "Average value" },
	实线: { "en": "Solid line" },
	虚线: { "en": "Dashed line" },
	点线: { "en": "Dotted line" },
	运行按钮文字: { "en": "Text for the run button" },
	按钮文字: { "en": "Button text" },
	时间轴: { "en": "Time axis" },
	"数值轴，适用于连续数据\n类目轴，适用于离散的类目数据或者时序数据\n对数轴，适用于对数数据": { "en": "Numerical axis, for continuous data \nCategorical axis, for discrete categorical data or time-series data \nLogarithmic axis, for logarithmic data" },
	交易量: { "en": "Trading volume" },
	"k 线颜色（涨）": { "en": "Candlestick color (up)" },
	"k 线颜色（跌）": { "en": "Candlestick  color (down)" },
	"k 线": { "en": "Candlestick " },
	"Y 轴分割线": { "en": "Y-axis grid line" },
	柱状图颜色: { "en": "Bar color" },
	曲线颜色: { "en": "Curve color" },
	倍率: { "en": "Multiplier" },
	行情数据档数: { "en": "Level of quotes" },
	订单图: { "en": "Order chart" },
	数据环: { "en": "Data loop" },
	增加环: { "en": "Add loop" },
	标签列: { "en": "Label column" },
	"正在加载 ReactQuill": { "en": "Loading ReactQuill" },
	添加文本: { "en": "Add text" },
	不保存: { "en": "Don't save" },
	"此数据源存在未保存的更改。你想保存吗？": { "en": "Do you want to save your changes on this data source?" },
	点击填充数据源: { "en": "Populate data source" },
	配置数据源: { "en": "Configure data source" },
	应用: { "en": "Apply" },
	关闭: { "en": "Close" },
	重命名: { "en": "Rename" },
	当前数据源已被图表绑定无法删除: { "en": "This data source has been bound to a chart and cannot be deleted." },
	该数据源名已存在: { "en": "Data source name already exists" },
	数据源名长度不能大于10: { "en": "Data source name cannot be longer than 10 characters" },
	数据源名不能为空: { "en": "Data source name cannot be empty" },
	当前数据源存在错误: { "en": "Error occurred in current data source" },
	轮询启动失败: { "en": "Polling failed" },
	无法订阅到流数据表: { "en": "Failed to subscribe to stream table" },
	复制失败: { "en": "Copy failed" },
	插入变量: { "en": "Insert a variable" },
	数据预览: { "en": "Preview" },
	自动刷新: { "en": "Auto refresh" },
	间隔时间: { "en": "Interval" },
	最大展示行数: { "en": "Maximum rows to display" },
	若该值为空则表示不对最大展示行数进行限制: { "en": "Empty means to set no limit on the maximum rows" },
	自定义: { "en": "Custom" },
	"列名预览（共{{length}}列）：": { "en": "Column name preview ({{length}} columns):" },
	列过滤: { "en": "Column filter" },
	"值过滤、范围过滤、哈希过滤": { "en": "VALUE, RANGE, HASH" },
	"当前过滤列为:": { "en": "Current filter column:" },
	当前流表无过滤列: { "en": "No filter column is specified for the current stream table" },
	表达式过滤: { "en": "Expression" },
	无可用流表: { "en": "No available stream table" },
	过滤: { "en": "Filter" },
	数据面板保存成功: { "en": "Dashboard saved successfully" },
	修改成功: { "en": "Modified Successfully" },
	当前数据面板列表为空: { "en": "Current dashboard list is empty" },
	撤销成功: { "en": "Revoked successfully" },
	"选择 dashboard": { "en": "Select dashboard" },
	仅编辑: { "en": "Edit only" },
	仅预览: { "en": "Preview only" },
	返回主界面: { "en": "Return to overview" },
	"离开此界面您当前更改会丢失，是否需要保存当前更改": { "en": "Leaving this page will discard unsaved changes. Do you want to save changes?" },
	请输入数据面板的名称: { "en": "Enter the dashboard name" },
	请输入新的数据面板名称: { "en": "Enter a new dashboard name" },
	创建副本成功: { "en": "Copy created successfully" },
	"请输入 dashboard 副本名称": { "en": "Enter the dashboard copy name" },
	新增: { "en": "Add" },
	导出: { "en": "Export" },
	创建副本: { "en": "Create copy" },
	修改名称: { "en": "Rename" },
	分享: { "en": "Share" },
	"确定当前 dashboard 删除吗？": { "en": "Do you want to delete the current dashboard?" },
	确认删除: { "en": "Delete Confirmation" },
	撤销: { "en": "Revoke" },
	批量导入: { "en": "Batch import" },
	导入: { "en": "Import" },
	"你确定要导入这 {{length}} 个 dashboard 吗？": { "en": "Do you want to import {{length}} dashboards?" },
	已存在: { "en": "already exists" },
	"导入成功！": { "en": "Import successful" },
	覆盖: { "en": "Overwrite" },
	重命名后导入: { "en": "Import after renaming" },
	"控制节点不支持数据面板，请跳转到数据节点或计算节点查看。": { "en": "Dashboard is not supported on controller. Please switch to a data node or compute node." },
	请点击下方按钮完成初始化: { "en": "Click the button to complete initialization" },
	"初始化操作将新增以下数据库表：": { "en": "The following databases/tables will be added:" },
	"以及 11 个以 dashboard_ 开头的函数视图（FunctionView）": { "en": "and 11 function views starting with dashboard_" },
	"你确定要初始化数据面板功能吗？": { "en": "Do you want to initialize the dashboard?" },
	初始化: { "en": "Initialize" },
	"数据面板功能未初始化，请联系管理员初始化数据面板功能": { "en": "Dashboard not initialized. Only administrators are allowed to initialize dashboard." },
	"dashboard 配置加载成功": { "en": "Dashboard configuration loaded successfully" },
	"当前 url 所指向的 dashboard 不存在": { "en": "The dashboard URL does not exist" },
	请输入新数据面板的名称: { "en": "Enter a new dashboard name" },
	"请输入新的 dashboard 名称": { "en": "Enter a new dashboard name" },
	"您没有删除 {{name}} 的权限": { "en": "Not granted to delete {{name}}" },
	"确认删除选中的 {{length}} 个数据面板吗？": { "en": "Do you want to delete the {{length}} selected dashboard" },
	来源于: { "en": "From" },
	"确定删除 {{name}} 吗？": { "en": "Do you want to delete {{name}}?" },
	"当前 dashboard 列表为空": { "en": "Current dashboard list is empty" },
	请选择至少一个面板进行导出: { "en": "Select at least one dashboard to export" },
	"您没有导出 {{name}} 的权限": { "en": "Not granted to export {{name}}" },
	批量导出: { "en": "Batch export" },
	请至少选中一个数据面板后再删除: { "en": "Select at least one dashboard" },
	基础: { "en": "Basic" },
	画布样式: { "en": "Canvas style" },
	"确定要重置配置吗？": { "en": "Do you want to reset the configuration?" },
	重置配置: { "en": "Reset" },
	"配置表单与数据源结构相关，如修改数据源结构，建议重置表单以适应最新结构": { "en": "The configured form is associated with the data source structure. Reset the form to adapt to updated data structure." },
	请至少选中一个数据面板后再分享: { "en": "Select at least one dashboard" },
	批量分享: { "en": "Batch share" },
	请选择需要分享的用户: { "en": "Select users to share with" },
	全部编辑: { "en": "Edit all" },
	"请选择想要分享的 dashboard": { "en": "Select dashboard to share" },
	"您没有分享 {{name}} 的权限": { "en": "Not granted to share {{name}}" },
	分享成功: { "en": "Share successful" },
	权限: { "en": "Access" },
	无: { "en": "None" },
	"dashboard 名称不允许为空": { "en": "Dashboard name cannot be empty" },
	"dashboard 名称中不允许包含 \"/\" 或 \"\\\" ": { "en": "Dashboard names cannot contain \"/\" or \"\\\" " },
	"名称重复，请重新输入": { "en": "Duplicate name, enter a different name" },
	标签: { "en": "Label" },
	值: { "en": "Value" },
	"确定要删除该选项吗？": { "en": "Do you want to delete this option?" },
	"可选项：": { "en": "Options:" },
	变量: { "en": "Variable" },
	不存在: { "en": "not exist" },
	当前变量已被数据源使用无法删除: { "en": "Variable is referenced by a data source and cannot be deleted" },
	该变量名已存在: { "en": "Variable name already exists" },
	变量名长度不能大于10: { "en": "Variable name cannot be longer than 10 characters" },
	变量名不能为空: { "en": "Variable name cannot be empty" },
	此变量已被数据源引用无法修改名称: { "en": "Variable is referenced by a data source and cannot be modified" },
	"变量冲突，复制失败": { "en": "copy filed. Variable with the same name already exists" },
	"此变量存在未保存的更改。你想保存吗？": { "en": "Do you want to save changes on this variable?" },
	配置变量: { "en": "Configure variables" },
	"显示名称：": { "en": "Display name:" },
	"变量类型：": { "en": "Variable type:" },
	单选: { "en": "Single-select" },
	多选: { "en": "Multi-select" },
	自由文本: { "en": "Free text" },
	日期: { "en": "Date" },
	"变量值：": { "en": "Variable value:" },
	"使用默认 admin 账号密码登录失败": { "en": "Failed to log in with default admin account" },
	柱状图: { "en": "Bar chart" },
	折线图: { "en": "Line chart" },
	饼图: { "en": "Pie chart" },
	"K 线": { "en": "Candlestick" },
	混合图: { "en": "Mixed chart" },
	富文本: { "en": "Rich text" },
	描述表: { "en": "Description table" },
	编辑器: { "en": "Editor" },
	仪表盘: { "en": "Gauge" },
	雷达图: { "en": "Radar chart" },
	散点图: { "en": "Scatter plot" },
	热力图: { "en": "Heatmap" },
	"保留时间（分钟）": { "en": "Retention minutes" },
	气泡提示: { "en": "Tooltip" },
	值列: { "en": "Value column" },
	标签字号: { "en": "Label font size" },
	值字号: { "en": "Value font size" },
	每行展示数量: { "en": "Items per row" },
	值颜色: { "en": "Value color" },
	列属性: { "en": "Column attributes" },
	编辑文本: { "en": "Edit text" },
	列名完全匹配: { "en": "Exact match" },
	为指定名称的列定制配置: { "en": "Configure for matched columns" },
	列名正则匹配: { "en": "Regex match" },
	为列名匹配正则表达式的列定制配置: { "en": "Configure for matched columns" },
	类型匹配: { "en": "Type match" },
	"为特定 DolphinDB 数据类型的列定制配置，如 INT, DOUBLE": { "en": "Configure for columns of specific DolphinDB data types (e.g. INT, DOUBLE)" },
	"配置规则 {{name}}": { "en": "Configure rule {{name}}" },
	匹配类型: { "en": "Type" },
	筛选列: { "en": "Filter Columns" },
	正则表达式: { "en": "Regular Expression" },
	支持子面量形式和构造函数形式的正则对象: { "en": "Supports regular objects in literal and constructor form" },
	"子面量：/abc/g": { "en": "Literal: /abc/g" },
	"构造函数：new RegExp(\"abc\", \"g\")": { "en": "Constructor: new RegExp(\"abc\", \"g\")" },
	正则表达式书写规则: { "en": "Regular expression rules" },
	请输入正则表达式: { "en": "Enter a regular expression" },
	增加配置规则: { "en": "Add configuration rules" },
	阈值设置: { "en": "Threshold setting" },
	阈值类型: { "en": "Threshold type" },
	绝对值: { "en": "Absolute value" },
	百分比: { "en": "Percentage" },
	个: { "en": "Count" },
	展开: { "en": "Expand" },
	"请选择需要观测的 key": { "en": "Select key to monitor" },
	"创建人：{{name}}": { "en": "Creator: {{name}}" },
	请输入: { "en": "Enter" },
	刻度间隔: { "en": "Tick interval" },
	标签占位: { "en": "Label placeholder" },
	标签相对单个变量的百分比占位: { "en": "Label percentage placeholder per variable" },
	按钮文案: { "en": "Button text" },
	是否开启动画: { "en": "Animation" },
	自动画图模式: { "en": "Auto charting" },
	"自动画图模式会自动查找各数据源选定类型的列（默认为时间类型）作为 X 轴，各数据源数值列作为数据列，在数据列配置区域可对特定数据列进行个性化配置": { "en": "Enable auto charting to select columns of specified types (default temporal) as X-axis, and numeric columns as data columns. You can configure for specific data columns in the configuration window." },
	"X 轴类型": { "en": "X-axis type" },
	请选择类型: { "en": "Select type" },
	网格线: { "en": "Grid lines" },
	缩略轴: { "en": "Abbreviated axis" },
	展示名称: { "en": "Displayed name" },
	列样式: { "en": "Column style" },
	"从左到右依次为字号、文字色与背景色": { "en": "From left to right: font size, text color, background color" },
	表头样式: { "en": "Header style" },
	布局: { "en": "Layout" },
	横向布局: { "en": "Horizontal" },
	纵向布局: { "en": "Vertical" },
	图例类型: { "en": "Legend type" },
	当图例数量较多时可以使用滚动布局: { "en": "Use scrolling layout with multiple legends" },
	普通图例: { "en": "General" },
	滚动图例: { "en": "Scrollable" },
	"下方四个输入框可依次输入离容器上侧、下侧、左侧、右侧的距离，以下是对填入值的说明：": { "en": "Enter top/bottom/left/right padding. Value descriptions:" },
	"具体像素值，如 20；": { "en": "Pixel value, e.g. 20" },
	"相对于容器宽高百分比，如 20%；": { "en": "Percentage relative to the height, e.g. 20%" },
	"可以设置为 left、center、right，组件会根据相应的位置自动对齐。": { "en": "Left/center/right for auto alignment" },
	上侧距离: { "en": "Top" },
	下侧距离: { "en": "Bottom" },
	左侧距离: { "en": "Left" },
	右侧距离: { "en": "Right" },
	图例间隔: { "en": "Legend spacing" },
	标记大小: { "en": "Marker size" },
	文字颜色: { "en": "Text color" },
	"X 轴数据列": { "en": "X-axis data column" },
	"Y 轴数据列": { "en": "Y-axis data column" },
	线宽: { "en": "Line width" },
	是否填充: { "en": "Fill" },
	透明度: { "en": "Opacity" },
	不展示: { "en": "Do not display" },
	区域填充: { "en": "Area fill" },
	线条: { "en": "Line" },
	"阈值 {{name}}": { "en": "Threshold {{name}}" },
	关联轴类型: { "en": "Associated axis type" },
	"X 轴": { "en": "X-axis" },
	仅支持数据轴: { "en": "Only numerical axis supported" },
	"关联 X 轴": { "en": "Associated X-axis" },
	展示类型: { "en": "Display type" },
	增加阈值: { "en": "Add threshold" },
	增加阈值设置: { "en": "Add threshold setting" },
	数据源匹配: { "en": "Match data source" },
	同数据源的数值列采用同配置: { "en": "Apply the same configuration for numeric columns from one data source" },
	数据列配置: { "en": "Data column configuration" },
	"单条数据列若命中多个配置规则，以第一项命中的为准": { "en": "Apply the first matched rule for data column" },
	支持字面量形式和构造函数形式的正则对象: { "en": "Supports regular objects in literal and constructor form" },
	"字面量：/abc/g": { "en": "Literal: /abc/g" },
	分段数: { "en": "Number of segments" },
	图配置: { "en": "Chart configuration" },
	文档: { "en": "Docs" },
	请选择数据源: { "en": "Select data source" },
	创建数据源: { "en": "Create data source" },
	"已有同名数据源，请修改": { "en": "A data source with the same name already exists" },
	请输入数据源的名称: { "en": "Enter a data source name" },
	"sql 执行得到的数据类型与数据源类型不符，请修改": { "en": "Data type mismatch between the SQL result and the data source" },
	"当前数据源: [{{source_name}}] 配置的流数据表 [{{table_name}}] 于当前节点不存在": { "en": "The stream table [{{table_name}}] configured for data source [{{source_name}}] does not exist on the current node" },
	"IP 端口": { "en": "IP Port" },
	"数据面板未初始化，请联系管理员在数据节点完成初始化。": { "en": "Dashboard not initialized. Only administrators are allowed to initialize dashboard." },
	"提示：初始化后请完善用户相关配置（详见": { "en": "After initialization, please set configuration parameters" },
	"dashboard 不存在": { "en": "dashboard does not exist" },
	"检测到以下配置不存在，请及时配置并重启数据库，避免影响数据面板功能使用，详见": { "en": "The following configuration parameters are missing. Please configure properly and restart the database." },
	"待配置项：": { "en": "Required configuration parameters:" },
	"SQL 导入：": { "en": "SQL import:" },
	"需返回一个两列的表格，第一列用作标签，第二列用作值。 ( 无法在此处使用变量 )": { "en": "A table with two columns should be returned, the first column as labels, and the second column as values. Variables cannot be used." },
	测试环境部署时无法使用配置管理: { "en": "Configuration management cannot be used in the test environment" },
	数据库路径: { "en": "Database path" },
	"可选项（共{{length}}项）：": { "en": "Options ({{length}} in total)" },
	"确定要清空所有选项吗？": { "en": "Do you want to clear all options?" },
	"返回结果必须是 table": { "en": "Must return a table with 2 columns" },
	"返回结果的列数必须是 2": { "en": "Must return a table with 2 columns" },
	多源图: { "en": "Multi-source" },
	数据配置: { "en": "Data configuration" },
	最小范围: { "en": "Minimum" },
	最大范围: { "en": "Maximum" },
	值精度: { "en": "Precision" },
	指针颜色: { "en": "Pointer color" },
	标题水平偏移: { "en": "Title horizontal offset" },
	标题垂直偏移: { "en": "Title vertical offset" },
	数值水平偏移: { "en": "Value horizontal offset" },
	数值垂直偏移: { "en": "Value vertical offset" },
	"返回结果必须是 table 或 matrix": { "en": "Must return a table or matrix" },
	相对仪表盘中心的水平偏移位置: { "en": "Horizontal offset position relative to the center of gauge" },
	相对仪表盘中心的垂直偏移位置: { "en": "Vertical offset position relative to the center of gauge" },
	"标签不可重复，重复会自动覆盖": { "en": "Labels cannot be repeated, and will be automatically overwritten if repeated." },
	"标签已存在，选项添加失败，请重试，必要时请修改现有标签": { "en": "The label already exists. Failed to add the option. Please try again. If necessary, please modify the existing label." },
	自动保存: { "en": "Autosave" },
	"开启自动保存后，将每隔 1 分钟保存一次配置": { "en": "After turning on autosave, the configuration will be saved every 1 minute." },
	不能为空: { "en": "Can not be empty" },
	"导出 CSV": { "en": "Export CSV" },
	导出范围: { "en": "Export Range" },
	全部: { "en": "All" },
	部分: { "en": "Custom Range" },
	"起始行需为大于等于 0 的整数": { "en": "The starting row must be an integer greater than or equal to 0" },
	起始行需小于等于结束行: { "en": "The starting row must be less than or equal to the ending row" },
	起始行: { "en": "Starting Row" },
	请输入起始行: { "en": "Please enter the starting row" },
	"结束行需为大于等于 0 且小于表格实际行数的整数": { "en": "The end row must be an integer greater than or equal to 0 and less than the actual number of rows in the table" },
	结束行需大于等于起始行: { "en": "The ending row must be greater than or equal to the starting row" },
	结束行: { "en": "Ending Row" },
	请输入结束行: { "en": "Please enter the ending row" },
	"注意：请根据实际的硬件情况选择导出范围，过大的范围可能导致浏览器崩溃！": { "en": "Note: Select a reasonable range to avoid browser performance issues." },
	"输入限制内存大小，单位为 GB": { "en": "Enter the limit memory size in GB" },
	"以 \"*\" 结尾，表示指定某个 dbName 的前缀范围，例如 \"dfs://test0*\"": { "en": "Ending with \"*\" means specifying the prefix range of a certain dbName, such as \"dfs://test0*\"" },
	上限值: { "en": "Limit" },
	"保存成功，重启集群生效": { "en": "Save successfully and restart the cluster to take effect." },
	"创建 catalog": { "en": "Create Catalog" },
	请输入名称: { "en": "Enter name." },
	"请选择 catalog": { "en": "Please select a catalog" },
	"请输入 schema": { "en": "Please enter a schema" },
	"错误信息：{{error_msg}}": { "en": "Error message: {{error_msg}}" },
	"除分区列外，请选择查询时常作为过滤条件的列。越重要的过滤条件，在过滤列中的位置越靠前。结合您提供的信息，最多可选择2个常用筛选列。": { "en": "Apart from the partitioning columns, please select columns that are frequently used as filtering conditions during queries. It is recommended to arrange these columns by query frequency, with the most commonly used one at the beginning of the list. You can specify at most 2 filter columns." },
	"{{label}}启用成功": { "en": "{{label}} enabled successfully" },
	"{{label}}停用成功": { "en": "{{label}} disabled successfully" },
	"是否在目录 (catalog) 下创建": { "en": "Use a catalog" },
	"目录 (catalog)": { "en": "catalog" },
	"名称 (schema)": { "en": "schema" },
	"DFS 数据库": { "en": "DFS DATABASE" },
	"catalog 名称只能包含字母、下划线或数字，并且不能以数字或下划线开头": { "en": "The catalog name can only contain letters, underscores, or numbers, and cannot begin with a number or an underscore." },
	"DFS 表": { "en": "DFS TABLE" },
	目录: { "en": "CATALOG" },
	表格视图: { "en": "Table" },
	卡片视图: { "en": "Card" },
	节点别名: { "en": "alias" },
	节点类型: { "en": "mode" },
	"是否 Leader": { "en": "is leader" },
	连接数: { "en": "connection num" },
	"前 10 查询耗时中位数": { "en": "median time taken by the last 10 queries" },
	"前 10 查询耗时最大值": { "en": "max time taken by the last 10 queries" },
	"前 100 查询耗时中位数": { "en": "median time taken by the last 100 queries" },
	"前 100 查询耗时最大值": { "en": "max time taken by the last 100 queries" },
	当前查询耗时最大值: { "en": "max running query time" },
	停止成功: { "en": "Stop succeeded" },
	"错误行:": { "en": "Error Line:" },
	流计算监控_menu: { "en": "Streaming" },
	插件管理: { "en": "Plugins" },
	拥有: { "en": "has" },
	"来源于 ": { "en": "from " },
	确认撤销: { "en": "Confirm Revocation" },
	全部仅预览: { "en": "All preview only" },
	全部无: { "en": "All None" },
	请选择文件: { "en": "Please select file" },
	请选择是否使用现有库: { "en": "Please select whether to use an existing library" },
	请输入日增数据量: { "en": "Please enter the daily increase in data volume" },
	请选择引擎类型: { "en": "Please select the engine type" },
	配置展示列: { "en": "Configure display columns" },
	安装或更新插件: { "en": "Install or Update a Plugin" },
	输入关键字后按回车可搜索插件: { "en": "Enter a keyword and press Enter to search for plugins" },
	"插件 ID": { "en": "Plugin ID" },
	集群已安装的最低版本: { "en": "Minimum Installed Version" },
	" (部分节点与数据库版本不一致，无法加载)": { "en": " (Some nodes are inconsistent with the database version and cannot be loaded)" },
	已安装节点: { "en": "Nodes Installed" },
	全部节点: { "en": "All Nodes" },
	待安装节点: { "en": "Nodes to Install" },
	同步: { "en": "Sync" },
	安装或更新插件至集群内全部节点: { "en": "Install or update the plugin to all nodes in the cluster" },
	安装或更新: { "en": "Install or Update" },
	同步插件至集群内其他节点: { "en": "Sync to other Nodes" },
	为空: { "en": "is empty" },
	非空: { "en": "not empty" },
	"oauthType 配置参数的值必须为 authorization code 或 implicit，默认为 implicit": { "en": "The value of the oauthType configuration parameter must be authorization code or implicit. The default value is implicit." },
	实现了: { "en": " implements " },
	未实现: { "en": " doesn't implemnt " },
	"尝试 oauth 单点登录，{{implemented}} oauthLogin, 类型是 implicit, token_type 为 {{token_type}}, access_token 为 {{access_token}}": { "en": "Try oauth single sign-on, {{implemented}} oauthLogin, type is implicit, token_type is {{token_type}}, access_token is {{access_token}}" },
	"尝试 oauth 单点登录，类型是 implicit, 无 access_token": { "en": "Try oauth single sign-on, type is implicit, no access_token" },
	"尝试 oauth 单点登录，{{implemented}} oauthLogin, 类型是 authorization code, code 为 {{code}}": { "en": "Try oauth single sign-on, {{implemented}} oauthLogin, type is authorization code, code is {{code}}" },
	"尝试 oauth 单点登录，类型是 authorization code, 无 code": { "en": "Try oauth single sign-on, type is authorization code, no code" },
	"通过 oauth 单点登录之后的 username 不能是 {{guest}}": { "en": "The username after single sign-on through oauth cannot be {{guest}}" },
	"必须配置 oauthAuthUri, oauthClientId 参数": { "en": "oauthAuthUri, oauthClientId parameters must be configured" },
	"跳转到 oauth 验证页面:": { "en": "Jump to the oauth verification page" },
	"配置文件:": { "en": "config file:" },
	"配置:": { "en": "config:" },
	"无法从当前节点 {{current}} 跳转回发起登录的节点 {{origin}}，找不到节点信息": { "en": "Unable to jump from the current node {{current}} back to the node {{origin}} where login was initiated. Node information cannot be found." },
	正在跳转: { "en": "jumping" },
	"尝试 oauth 单点登录，类型是 implicit, token_type 为 {{token_type}}, access_token 为 {{access_token}}, expires_in 为 {{expires_in}}": { "en": "Try oauth single sign-on, type is implicit, token_type is {{token_type}}, access_token is {{access_token}}, expires_in is {{expires_in}}" },
	"尝试 oauth 单点登录，类型是 authorization code, code 为 {{code}}": { "en": "Try oauth single sign-on, type is authorization code, code is {{code}}" },
	"{{username}} 使用 oauth 单点登录成功": { "en": "{{username}} successfully signed in using oauth" },
	启动指令发送成功: { "en": "The start command was sent successfully" },
	停止指令发送成功: { "en": "The stop command was sent successfully" },
	"不同节点插件版本不一致，需要同步": { "en": "The plug-in versions of different nodes are inconsistent and need to be synchronized" },
	需要同步: { "en": "Requires synchronization" },
	"拖拽文件到这里，或点击后弹框选择文件": { "en": "Drag and drop files here, or click on the pop-up window to select files" },
	暂无文件: { "en": "No files yet" },
	待上传文件: { "en": "Files to upload" },
	大小: { "en": "Size" },
	插件来源节点: { "en": "Plugin source node" },
	"插件:": { "en": "plugins:" },
	"执行 undef all 会导致 web 部分功能不可用，执行完成后需要刷新才能恢复, 确定执行吗？": { "en": "Executing undef all will cause some web functions to be unavailable. After execution, you need to refresh to restore. Are you sure you want to execute it?" },
	"执行 undef all 后需要刷新以恢复 web 功能，是否立即刷新？": { "en": "After executing undef all, a refresh is required to restore web functions. Do you want to refresh now?" },
	数据采集: { "en": "Data Acquisition" },
	连接信息: { "en": "Connections" },
	解析模板: { "en": "Parsing Templates" },
	个节点: { "en": " nodes" },
	计算组: { "en": "Compute Group" },
	别名必须以组名: { "en": "Alias must start with group name" },
	请输入值: { "en": "Please enter a value" },
	新增计算组: { "en": "New Compute Group" },
	计算组名称: { "en": "Compute Group Name" },
	请输入计算组名称: { "en": "Please enter compute group name" },
	计算组名称不能包含特殊字符: { "en": "Compute group name cannot contain special characters" },
	批量添加节点: { "en": "Batch Add Nodes" },
	在列表后添加: { "en": "Add after list" },
	批量添加: { "en": "Batch Add" },
	计算组配置: { "en": "Compute Group Configuration" },
	新增一条配置: { "en": "Add a Configuration" },
	"请添加至少 1 个节点": { "en": "Please add at least 1 node" },
	"指定此配置适用的节点名或节点名前缀（例如：node1 或 node%）": { "en": "Specify the node name or node name prefix to which this configuration applies (e.g., node1 or node%)" },
	"无法移除在线节点，请到集群总览中停止后移除": { "en": "Cannot remove online nodes, please stop them in the cluster overview before removing" },
	"新增节点成功，请到集群总览启动": { "en": "New node added successfully, please go to cluster overview to start" },
	"新增节点失败，服务端报错：": { "en": "Failed to add new node, server error:" },
	"该节点别名已存在，无法修改或添加": { "en": "The node alias already exists and cannot be modified or added" },
	"组内有在线节点，请到集群总览中停止节点后移除": { "en": "There are online nodes in the group, please stop the nodes in the cluster overview before removing" },
	"确定要删除计算组 {{group}} 吗？": { "en": "Are you sure you want to delete compute group {{group}}?" },
	删除计算组: { "en": "Delete Compute Group" },
	新建计算组: { "en": "New Compute Group" },
	"别名必须以组名 ": { "en": "Alias must start with group name " },
	存储集群: { "en": "Storage Cluster" },
	开头: { "en": " " },
	线颜色: { "en": "Line Color" },
	删除订阅: { "en": "Delete Subscription" },
	是否销毁流表: { "en": "Destroy Stream Table" },
	连接名称: { "en": "Connection Name" },
	协议: { "en": "Messaging Protocol" },
	服务器地址: { "en": "Server Address" },
	"确定要{{action}}{{name}}吗？": { "en": "{{action}} subscription {{name}}?" },
	订阅成功: { "en": "Subscription Created" },
	已停用订阅: { "en": "Subscription Disabled" },
	点位解析模板: { "en": "Parsing Template" },
	查看: { "en": "View" },
	更新时间: { "en": "Updated At" },
	订阅列表: { "en": "Subscriptions" },
	新增订阅: { "en": "New" },
	"编辑 {{name}}连接": { "en": "Edit {{name}} Connection" },
	"创建 {{name}}连接": { "en": "Create {{name}} Connection" },
	请输入服务器地址: { "en": "Enter server address." },
	请输入有效的服务器地址: { "en": "Enter a valid server address." },
	端口_data_collection: { "en": "Port" },
	请输入端口: { "en": "Enter a port." },
	请输入有效的端口: { "en": "Enter a valid port number." },
	自定义模板: { "en": "Script" },
	模板参考: { "en": "Script Reference" },
	编辑模板: { "en": "Edit Template" },
	创建模板: { "en": "Create Template" },
	请输入模板名称: { "en": "Enter template name." },
	请选择协议: { "en": "Select a protocol." },
	代码: { "en": "Custom Template" },
	请输入代码: { "en": "Enter script." },
	接收缓冲区大小: { "en": "Receive Buffer Size (Bytes)" },
	"默认为 20480 字节": { "en": "Defaults to 20480" },
	请输入接收缓冲区大小: { "en": "Enter receive buffer size." },
	"偏移量与分区需同时设置，或者均不设置": { "en": "Provide both topic partitions and offset, or omit both." },
	请输入分区数: { "en": "Enter the number of partitions." },
	请输入偏移量: { "en": "Enter an offset." },
	修改订阅: { "en": "Edit Subscription" },
	查看订阅: { "en": "View Subscription" },
	创建订阅: { "en": "New Subscription" },
	请输入主题: { "en": "Enter subscription topic." },
	默认为当前节点: { "en": "Defaults to the current node." },
	是否需要点位解析: { "en": "Enable Message Parsing" },
	默认流表名称: { "en": "Name of Default Stream Table" },
	请输入默认流表名称: { "en": "Enter a table name." },
	默认流表名称不能包含空格: { "en": "Table name must not contain spaces." },
	请选择点位解析模板: { "en": "Select a parsing template." },
	模板参数: { "en": "Set Template Parameters" },
	"请注意，自定义解析模板的输出流表需要自行创建": { "en": "When using a custom parsing template, the output stream table must be manually created." },
	参数值不能包含空格: { "en": "Value must not contain spaces." },
	"Kafka 消费参数配置": { "en": "Kafka Configuration Properties" },
	"设置偏移量与分区，group.id 参数会失效": { "en": "group.id is ignored when offset and partitions are manually specified." },
	参数: { "en": "Property" },
	请选择参数: { "en": "Select a property." },
	参数值: { "en": "Value" },
	参数值不能含有空格: { "en": "Value must not contain spaces." },
	增加消费参数配置: { "en": "Add Property" },
	"确定要删除连接 {{name}} 吗？": { "en": "Delete connection {{name}}?" },
	"确定要删除选中的 {{num}} 个连接吗": { "en": "Delete connections? Selected: {{num}}" },
	新建连接: { "en": "New Connection" },
	查看日志: { "en": "View Logs" },
	连接: { "en": "Connections" },
	请选择连接: { "en": "Select a connection." },
	"名称不能超过 50 个字符": { "en": "Name must be 50 characters or less." },
	名称不能包含空格: { "en": "Name must not contain spaces." },
	"数据采集平台初始化成功！": { "en": "Data acquisition platform initialized" },
	"请注意，控制节点无法使用数据采集平台": { "en": "The Data Acquisition Platform does not run on controller." },
	初始化数据采集平台: { "en": "Initialize Data Acquisition Platform" },
	初始化操作将新增以下数据库: { "en": "The following databases will be created from initialization" },
	"数据采集平台功能未初始化，请联系管理员初始化数据采集平台功能": { "en": "Contact administrator for initialization." },
	"无库表权限，请联系管理员赋权": { "en": "No access to databases/tables. Contact administrator for authorization." },
	"确定要删除选中的 {{num}} 项模板吗？": { "en": "Delete templates? Selected: {{num}}" },
	"该解析模板被引用 {{citeNumber}} 次, 确定要删除吗？": { "en": "Delete template? References to this template: {{citeNumber}}" },
	"确定要删除模板【{{name}}】吗？": { "en": "Delete template {{name}}?" },
	模板名称: { "en": "Template Name" },
	使用数: { "en": "Active Sub References" },
	引用数: { "en": "References" },
	"当前解析模板已被引用，请谨慎修改": { "en": "This template is referenced in subscriptions. Modify with caution." },
	是否启用: { "en": "Enabled" },
	分区_data_collection: { "en": "Partitions" },
	作业日志: { "en": "Job Logs" },
	查看更多: { "en": "Show More" },
	"保存成功，立即生效": { "en": "Save successfully, effective immediately" },
	"执行 undef all 后需要刷新以恢复 web 功能": { "en": "After executing undef all, refresh is required to restore web functionality" },
	立即刷新: { "en": "Refresh Now" },
	"标签页 ": { "en": "Tab" },
	提醒: { "en": "Tips" },
	"关闭标签页将会删除标签页内的所有内容，确认关闭？": { "en": "Closing this tab will discard all its contents. Are you sure you want to close it?" },
	默认标签页: { "en": "Default" },
	标签页名称: { "en": "Tab Name" },
	"保存成功，重启数据节点 / 计算节点生效": { "en": "Save successfully, restart the data / computing node to take effect" },
	"保存成功，重启计算节点生效": { "en": "Save successfully, restart the computing node to take effect" },
	集群中已存在主机名和端口号相同的节点: { "en": "A node with the same host name and port number already exists in the cluster" },
	"采集平台初始化成功！": { "en": "The acquisition platform was initialized successfully!" },
	"oauthType 配置参数的值必须为 authorization code 或 implicit，默认为 authorization code": { "en": "The value of the oauthType configuration parameter must be authorization code or implicit. The default value is authorization code." },
	"web 安全认证:": { "en": "Web Security Auth:" },
	"根据 state 参数跳转到节点:": { "en": "Jump to the node according to the state parameter:" },
	"server 版本:": { "en": "server version:" },
	"getClusterPerf(true) 执行超时，请检查集群节点状态是否正常，任务是否阻塞": { "en": "getClusterPerf(true) execution timeout, please check whether the cluster node status is normal and whether the task is blocked" },
	"配置文件校验失败，正在回滚配置文件": { "en": "Configuration file verification failed, rolling back configuration file" },
	"别名必须以组名 {{group}} 开头": { "en": "Aliases must start with the group name {{group}}" },
	批次大小: { "en": "Batch size" },
	等待间隔: { "en": "Wait interval" },
	过滤列: { "en": "Filter columns" },
	消息是否为表: { "en": "Message ingested as a table" },
	"订阅 hash 值": { "en": "Subscription hash value" },
	开启订阅偏移持久化: { "en": "Offset persistence" },
	强制按时间间隔触发: { "en": "Trigger at intervals" },
	"包含消息 ID": { "en": "Include message ID" },
	高可用组: { "en": "HA Raft group" },
	"配置文件存在错误 {{message}} 请检查输入内容并重新尝试。": { "en": "The configuration file contains an error: {{message}}. Please check your input and try again." },
	别名不能包含空格: { "en": "Alias cannot contain spaces" },
	"主机名 / IP 地址不能包含空格": { "en": "Hostname / IP cannot contain spaces" },
	持久化消息队列深度上限: { "en": "Queue Depth Limit" },
	持久化消息队列深度: { "en": "Queue Depth" },
	持久化表名: { "en": "Tables" },
	"主机名 / IP 地址不能为空": { "en": "Hostname / IP address cannot be empty" },
	别名不能为空: { "en": "Alias cannot be empty" },
	"别名必须以组名 {{group_name}} 开头": { "en": "The alias must start with the group name {{group_name}}." },
	"分享人：": { "en": "Shared by: " },
	流数据表_computing: { "en": "Stream Tables" },
	定时巡检: { "en": "Inspection" },
	添加指标: { "en": "Add indicators" },
	提交人: { "en": "Submitter" },
	运行时间: { "en": "Running time" },
	巡检描述: { "en": "Inspection description" },
	集群基础信息: { "en": "Basic cluster information" },
	集群运行状态: { "en": "Cluster operation status" },
	服务器运行状态: { "en": "Server running status" },
	编辑指标: { "en": "Edit Indicator" },
	请选择需要巡检的节点: { "en": "Please select the node that needs to be inspected" },
	所有节点: { "en": "All nodes" },
	脚本内容: { "en": "Script" },
	参数配置: { "en": "Parameters" },
	邮件告警设置: { "en": "Email alert settings" },
	邮箱名称: { "en": "Email Name" },
	"邮箱 SMTP 服务器地址": { "en": "Email SMTP server host" },
	"邮箱 SMTP 服务器端口": { "en": "Email SMTP server port" },
	发送者邮箱账号: { "en": "Sender's email account" },
	发送者邮箱密码: { "en": "Sender's email password" },
	"使用标准 SMTP 消息": { "en": "Standard SMTP messaging" },
	定时巡检模块初始化中: { "en": "The scheduled inspection module is initializing" },
	新增巡检: { "en": "Add inspection" },
	请输入想要搜索的巡检名称: { "en": "Please enter the name of the inspection you want to search" },
	"{{success}}/{{total}} 正常": { "en": "{{success}}/{{total}} OK" },
	"{{failedNum}}/{{total}} 异常": { "en": "{{failedNum}}/{{total}} exception" },
	查看详细报告: { "en": "View detailed report" },
	删除巡检结果: { "en": "Deleting inspection results" },
	"确认删除此巡检结果吗？": { "en": "Are you sure you want to delete this inspection result?" },
	巡检结果: { "en": "Inspection results" },
	批量删除巡检结果: { "en": "Deleting inspection results in batches" },
	"确认删除选中的巡检结果吗？": { "en": "Are you sure you want to delete the selected inspection results?" },
	批量删除成功: { "en": "Batch deletion successful" },
	确定巡检: { "en": "Confirm inspection" },
	"确定立即巡检 {{name}} 吗？": { "en": "Are you sure you want to inspect {{name}} now?" },
	立即巡检: { "en": "Inspect immediately" },
	查看详情: { "en": "View details" },
	查看最近一次巡检结果: { "en": "View the latest inspection results" },
	删除方案: { "en": "Deleting a plan" },
	"确认删除巡检方案 {{plan}} 吗？": { "en": "Are you sure you want to delete inspection plan {{plan}}?" },
	进行中的巡检队列: { "en": "Inspections in progress" },
	未进行的巡检队列: { "en": "Unchecked inspections" },
	批量删除巡检方案: { "en": "Deleting inspection plans in batches" },
	"确认删除选中的巡检方案吗？": { "en": "Are you sure you want to delete the selected inspection plan?" },
	请至少选中一个指标: { "en": "Please select at least one indicator" },
	请至少选中一个巡检节点: { "en": "Please select at least one inspection node" },
	查看巡检计划: { "en": "View inspection plan" },
	修改巡检计划: { "en": "Modify the inspection plan" },
	新增巡检计划: { "en": "New inspection plan" },
	"启用：": { "en": "Enable: " },
	启用成功: { "en": "Enabled successfully" },
	禁用成功: { "en": "Disable successfully" },
	"编辑模式：": { "en": "Edit Mode: " },
	立即执行一次巡检: { "en": "Perform an inspection immediately" },
	保存当前方案并立即执行一次巡检: { "en": "Save the current plan and perform an inspection immediately" },
	保存当前方案: { "en": "Save the current plan" },
	巡检名称: { "en": "Inspection Name" },
	请输入巡检名称: { "en": "Please enter the inspection name" },
	巡检计划描述: { "en": "Inspection plan description" },
	"巡检计划描述(非必填)": { "en": "Inspection plan description (optional)" },
	巡检周期: { "en": "Inspection cycle" },
	巡检频率: { "en": "Inspection frequency" },
	巡检日期: { "en": "Inspection date" },
	请选择巡检日期: { "en": "Please select the inspection date" },
	"第 {{day}} 天": { "en": "Day {{day}}" },
	巡检时间: { "en": "Inspection time" },
	添加: { "en": "Add" },
	请选择巡检时间: { "en": "Please select the inspection time" },
	是否启用邮件告警: { "en": "Whether to enable email alerts" },
	邮件告警接收人邮箱: { "en": "Email address of the email alert recipient" },
	指标列表: { "en": "Indicator list" },
	管理指标: { "en": "Management Indicators" },
	分组: { "en": "Group" },
	打印失败: { "en": "Printing failed" },
	下载巡检报告: { "en": "Download inspection report" },
	"{{report_id}} 巡检报告": { "en": "{{report_id}} Inspection report" },
	巡检结果总览: { "en": "Inspection results overview" },
	"指标说明: {{desc}}": { "en": "Indicator description: {{desc}}" },
	指标说明: { "en": "Indicator description" },
	是否正常: { "en": "Normal" },
	指标参数: { "en": "Indicator parameters" },
	指标版本: { "en": "Indicator version" },
	建议: { "en": "Suggestions" },
	检查通过: { "en": "Check passed" },
	ID: { "en": "ID" },
	正常: { "en": "Normal" },
	异常: { "en": "Abnormal" },
	指标名: { "en": "Indicator name" },
	指标分类: { "en": "Indicator classification" },
	"巡检报告_{{id}}": { "en": "Inspection report_{{id}}" },
	"检查项共 {{num}} 项": { "en": "Check items total {{num}} items" },
	"{{num}} 项异常。": { "en": "{{num}} exceptions." },
	"异常列表指标如下:": { "en": "The abnormal list indicators are as follows:" },
	"{{num_abnormal}}/{{num_total}} 项异常": { "en": "{{num_abnormal}}/{{num_total}} abnormal items" },
	"{{abnormalCount}}/{{totalCount}} 项异常": { "en": "{{abnormalCount}}/{{totalCount}} abnormal items" },
	"{{totalCount}}/{{totalCount}} 项正常": { "en": "{{totalCount}}/{{totalCount}} items are normal" },
	每日: { "en": "Daily" },
	每周: { "en": "Weekly" },
	每月: { "en": "Monthly" },
	周日: { "en": "Sunday" },
	周一: { "en": "Monday" },
	周二: { "en": "Tuesday" },
	周三: { "en": "Wednesday" },
	周四: { "en": "Thursday" },
	周五: { "en": "Friday" },
	周六: { "en": "Saturday" },
	" {{num}} 项异常。": { "en": " {{num}} exceptions." },
	"控制节点不支持定时巡检，请跳转到数据节点或计算节点查看。": { "en": "The control node does not support scheduled inspection. Please jump to the data node or computing node to check." },
	"你确定要初始化定时巡检功能吗？": { "en": "Are you sure you want to initialize the scheduled inspection function?" },
	"初始化定时巡检成功！": { "en": "Initialization of scheduled inspection successful!" },
	至少需要设置一个巡检时间: { "en": "At least one inspection time must be set" },
	执行节点: { "en": "Execution node" },
	"存在未安装 httpClient 插件的节点。": { "en": "There are nodes that do not have the httpClient plug-in installed." },
	"httpClient 插件版本与 DolphinDB 版本的前3位不一致。": { "en": "The first 3 digits of the httpClient plugin version and the DolphinDB version are inconsistent." },
	"确定初始化定时巡检？": { "en": "Are you sure you want to initialize scheduled inspection?" },
	成功: { "en": "Successfully" },
	"成功 {{successCount}}/{{totalCount}}": { "en": "{{successCount}}/{{totalCount}} succeeded" },
	收到巡检计划时间: { "en": "Received inspection plan time" },
	正在执行的巡检计划: { "en": "Inspection plan in progress" },
	待执行的巡检计划: { "en": "Inspection plans to be implemented" },
	功能介绍: { "en": "Function Introduction" },
	"系统监控：定期自动检查数据库各项指标，及时发现潜在问题": { "en": "System Monitoring: Regularly check the database indicators and discover potential problems in time" },
	"计划任务：支持自定义巡检计划，可设置执行周期和检查项目": { "en": "Plan Task: Support custom inspection plans, set execution cycles and inspection items" },
	"报告生成：生成巡检报告，展示系统运行状况": { "en": "Report Generation: Generate inspection reports to visually display system operation status" },
	"预警提醒：支持邮件告警，在发现异常时及时邮件通知": { "en": "Early Warning: Support email alarm, notify in time when anomalies are detected" },
	"历史追溯：保存历史巡检记录，便于问题分析和追踪": { "en": "Historical Traceability: Save historical inspection records for easier problem analysis and tracking" },
	"页数：": { "en": "Pages: " },
	"部分页面仍有图表存在，请确保所有图表已移除后再调整页面数": { "en": "Some pages still have charts, please make sure all charts have been removed before adjusting the page count." },
	"端标签的宽度最大为 80 像素，请注意控制字数不超过此范围": { "en": "The maximum width of the terminal label is 80 px. Please note that the number of control characters should not exceed this range." },
	"系统监控：定期自动检查数据库性能指标，及时发现潜在问题": { "en": "System monitoring: Regularly check the database performance indicators to identify potential problems" },
	"报告生成：自动生成巡检报告，直观展示系统运行状况": { "en": "Report generation: Automatically generate inspection reports to visually display system status" },
	"预警提醒：发现异常时及时通知，支持邮件告警配置": { "en": "Alert reminder: Notify immediately when an exception is detected, support email alert configuration" },
	取消执行成功: { "en": "Cancel execution successful" },
	取消执行: { "en": "Cancel execution" },
	"自动拓展页面大小：": { "en": "Automatically expands page size: " },
	"当前显示的是日志的一部分，点击以查看完整日志": { "en": "Currently displaying a portion of the log. Click to view the full log." },
	"原有项:": { "en": "Original items" },
	"移入项:": { "en": "Moved in items" },
	"移出项:": { "en": "Moved out items" },
	"数据库 {{db_name}}": { "en": "Database {{db_name}}" },
	"数据表 {{tb_name}}": { "en": "Table {{tb_name}}" },
	没有正在运行的数据节点: { "en": "No running data nodes" },
	自动: { "en": "auto" },
	会话管理: { "en": "Session Management" },
	"会话（ID: {{id}}）关闭成功": { "en": "Session (ID {{id}}) closed successfully." },
	文档说明: { "en": "Documentation" },
	用户会话: { "en": "Session" },
	占用内存: { "en": "Memory Usage" },
	客户端端口号: { "en": "Port" },
	会话创建时间: { "en": "Creation Time" },
	最近一次执行时间: { "en": "Last Execution" },
	"确定要关闭此会话（ID: {{id}}）吗？": { "en": "Are you sure you want to close this session (ID: {{id}})?" },
	缓存占用情况: { "en": "Cache Usage" },
	缓存类型: { "en": "Cache Type" },
	"占用内存/未处理的消息数": { "en": "Memory Usage / Unprocessed Message Count" },
	"{{file}} 的提交信息": { "en": "Commit message for {{file}}" },
	文件未修改: { "en": "File not modified" },
	请输入文件提交路径: { "en": "Please enter the file submission path" },
	提交成功: { "en": "Commit Success" },
	提交失败: { "en": "Commit Failed" },
	提交历史: { "en": "Commit History" },
	关闭提交历史: { "en": "Close Commit History" },
	查看提交历史: { "en": "View Commit History" },
	"本地文件，无提交历史": { "en": "Local file, no commit history" },
	文件提交路径: { "en": "File Submission Path" },
	"远程文件有更新，是否获取并覆盖当前编辑的内容": { "en": "The remote file has been updated. Do you want to fetch and overwrite the current content?" },
	更新文件: { "en": "Update File" },
	"未选择代码仓库，请选择一个代码仓库": { "en": "Code repository not selected, please select a code repository" },
	文件浏览: { "en": "File Browse" },
	"未选择代码仓库，请选择一个代码仓库以查看文件": { "en": "Code repository not selected, please select a code repository to view files" },
	搜索仓库文件: { "en": "Search repository files" },
	"今天 {{time}}": { "en": "{{time}}, Today" },
	"昨天 {{time}}": { "en": "{{time}}, Yesterday" },
	"fetch 仓库列表失败": { "en": "Failed to fetch repository list" },
	"获取文件失败，请检查权限": { "en": "Failed to get the file, please check permissions." },
	"使用 Oauth 登录到 GitLab": { "en": "Use OAuth to log in to GitLab" },
	"请输入 Client ID!": { "en": "Please enter Client ID!" },
	"请输入你的 GitLab 应用 Client ID": { "en": "Please enter your GitLab application Client ID" },
	"请输入 Redirect URL!": { "en": "Please enter the Redirect URL!" },
	"请输入你的 GitLab 应用 Redirect URL": { "en": "Please enter your GitLab application Redirect URL" },
	"请输入 GitLab 的路径!": { "en": "Please enter the GitLab path!" },
	"请输入有效的 URL!": { "en": "Please enter a valid URL!" },
	"请输入你的 GitLab 根路径，例如: https://gitlab.com": { "en": "Please enter your GitLab root path, for example: https://gitlab.com" },
	"请输入 GitLab API Root，默认为 /api/v4": { "en": "Please enter the GitLab API Root, the default is /api/v4" },
	"使用 Access Token 登录到 GitLab": { "en": "Use Access Token to log in to GitLab" },
	"请输入 Access Token!": { "en": "Please enter Access Token!" },
	"请输入你的 GitLab Access Token": { "en": "Please enter your GitLab Access Token" },
	"使用 Access Token 登录到 GitHub": { "en": "Use Access Token to log in to GitHub" },
	"请输入你的 GitHub Access Token": { "en": "Please enter your GitHub Access Token" },
	"使用 Oauth 登录到 GitHub": { "en": "Use OAuth to log in to GitHub" },
	"请输入你的 GitHub 应用 Client ID": { "en": "Please enter your GitHub App Client ID" },
	"请输入你的 GitHub 应用 Redirect URL": { "en": "Please enter your GitHub App Redirect URL" },
	"请输入 Client Secret!": { "en": "Please enter your Client Secret!" },
	"请输入你的 GitHub 应用 Client Secret": { "en": "Please enter your GitHub App Client Secret" },
	代码仓库: { "en": "Code Repositories" },
	"Git 集成": { "en": "Git Integration" },
	"无法获取仓库列表，请检查权限或：": { "en": "Unable to get the repository list. Please check your permissions or:" },
	"提交文件 {{file}} 到 {{repo}} 的分支 {{branch}}": { "en": "Commit file {{file}} to branch {{branch}} of {{repo}}" },
	"提交当前正在编辑的文件 {{file}} 到 {{repo}} 的分支 {{branch}}": { "en": "Commit the currently editing file {{file}} to the {{branch}} branch of {{repo}}" },
	"分支：{{b}}": { "en": "Branch: {{b}}" },
	覆盖远程文件: { "en": "Overwrite remote file" },
	"远程文件有更新，该提交将覆盖远程文件": { "en": "The remote file has been updated. This commit will overwrite the remote file." },
	"代码存储失败，请检查代码大小或本地存储空间剩余空间": { "en": "Code saving failed. Please check the code size or the remaining space of local storage." },
	获取文件列表失败或仓库为空: { "en": "Failed to get file list or repository is empty" },
	"只支持在 HTTPS 下使用该登录方式": { "en": "This login method is only supported under HTTPS." },
	"必须加载 httpClient 插件才能使用该登录方式": { "en": "The httpClient plugin must be loaded to use this login method." },
	"插件列表:": { "en": "plugins:" },
	"节点插件:": { "en": "plugin nodes:" },
	加载插件: { "en": "Load Plugin" },
	"确认加载插件至所选择的节点？（当前未安装或已加载的节点会被跳过）": { "en": "Are you sure you want to load the plugin to the selected node? (Nodes that are not currently installed or have already been loaded will be skipped)" },
	加载: { "en": "Load" },
	"加载插件:": { "en": "load plugin:" },
	插件加载成功: { "en": "Plugin loaded successfully" },
	"在下方表格中选择需要加载的插件，以及节点（当前未安装或已加载的节点会被跳过）": { "en": "Select the plugin and nodes to install it. Nodes that haven't installed the plugin or have already loaded it will be skipped." },
	安装插件: { "en": "Install Plugin" },
	已加载节点: { "en": "Loaded Nodes" },
	节点名: { "en": "Node" },
	已安装: { "en": "Installed" },
	安装版本: { "en": "Installed Version" },
	已加载: { "en": "Loaded" },
	加载版本: { "en": "Loaded Version" },
	"获取插件可安装节点:": { "en": "Get the plugin installable node:" },
	"安装插件:": { "en": "Install the plugin:" },
	"插件 {{plugin}} 安装成功": { "en": "Plugin {{plugin}} installed successfully" },
	"如: zip": { "en": "eg: zip" },
	离线安装: { "en": "Offline" },
	在线安装: { "en": "Online" },
	从某节点同步: { "en": "Synchronize from a Node" },
	"插件 zip 包": { "en": "Plugin Zip" },
	插件版本: { "en": "Plugin Version" },
	"选填，默认安装和当前版本匹配的最新版": { "en": "By default, the latest matching version is installed" },
	插件服务器地址: { "en": "Plugin Server" },
	"选填，参考 installPlugin 函数": { "en": "Plugins repository to download from. Refer to installPlugin function" },
	源节点: { "en": "Source Node" },
	安装方式: { "en": "Installation" },
	目标节点: { "en": "Target Node" },
	"控制节点不支持库表向导，请跳转到数据节点或计算节点查看。": { "en": "The control node does not support the library table wizard. Please jump to the data node or computing node to view it." },
	"Git 登录失败": { "en": "Login to Git failed." },
	列宽自适应: { "en": "Adaptive column width" },
	超长省略: { "en": "Ellipsis" },
	"查询在线插件列表:": { "en": "Query the online plug-in list:" },
	添加失败: { "en": "Add failed" },
	"getClusterPref 中节点的 agentSite 为空，无法通过 agent 查看日志": { "en": "The agentSite of the node in getClusterPref is empty, and logs cannot be viewed through the agent" },
	区间: { "en": "interval" },
	频次: { "en": "frequency" },
	组列表: { "en": "Group List" },
	用户列表: { "en": "User List" },
	编译并刷新: { "en": "Compile and Refresh" },
	" 新增控制节点配置": { "en": "Add Control Node Configuration" },
	" 新增节点": { "en": "Add Node" },
	"确认删除选中的 {{num}} 个巡检方案吗？": { "en": "Confirm to delete the selected {{num}} inspection plans?" },
	"确认删除选中的 {{num}} 条巡检结果吗？": { "en": "Confirm to delete the selected {{num}} inspection results?" },
	组名不能为空: { "en": "Group name cannot be empty" },
	计算组节点配置不正确: { "en": "The calculation group node configuration is incorrect" },
	配置项不能为空: { "en": "The configuration item cannot be empty" },
	"配置项 {{name}} 的限定词必须包含 %": { "en": "The qualifier for configuration item {{name}} must contain %" },
	"配置项 {{name}}的值必须包含 <ALIAS>": { "en": "The value of configuration item {{name}} must contain <ALIAS>" },
	"计算组名称不能与已存在的计算组 {{group}} 存在包含关系": { "en": "The compute group name cannot contain or be contained by the existing group \"{{group}}\"" },
	移除节点成功: { "en": "Node removed successfully" },
	"移除节点配置成功，重启集群生效": { "en": "Node configuration removed successfully. Changes take effect after cluster restart" },
	全选_button: { "en": "Select All" },
	插件名: { "en": "Plugin Name" },
	"PKEY 数据库引擎不支持 addColumn": { "en": "addColumn is not supported by PKEY database engine" },
	流图监控: { "en": "Stream Graph" },
	构建中: { "en": "Building" },
	错误: { "en": "Error" },
	失败: { "en": "Failed" },
	销毁中: { "en": "Destroying" },
	已销毁: { "en": "Destroyed" },
	流图名称: { "en": "Name" },
	创建者: { "en": "Created By" },
	数据执行次数: { "en": "Execution Count" },
	任务数量: { "en": "Task Count" },
	总任务数: { "en": "Total Task Count" },
	运行中任务数: { "en": "Running Task Count" },
	流图列表: { "en": "Stream Graphs" },
	任务ID: { "en": "Task ID" },
	Schema: { "en": "Schema" },
	节点状态: { "en": "Node Status" },
	节点详情: { "en": "Node Details" },
	子图指标: { "en": "Subgraph Metrics" },
	引擎指标: { "en": "Engine Metrics" },
	"检查点 ID": { "en": "Checkpoint ID" },
	"子作业 ID": { "en": "Subjob ID" },
	"收到第一个 Barrier 的时刻": { "en": "First Barrier Received Time" },
	"Barrier 对齐的时刻": { "en": "Barrier Alignment Time" },
	"转发 Barrier 时刻": { "en": "Barrier Forwarding Time" },
	"输入端 Channel 的 ID": { "en": "Input Channel ID" },
	快照大小: { "en": "Snapshot Size" },
	"加载作业信息失败：": { "en": "Failed to load job information" },
	没有作业数据: { "en": "No job data" },
	"加载子作业信息失败：": { "en": "Failed to load subjob information" },
	没有子作业数据: { "en": "No subjob data" },
	没有配置数据: { "en": "No configuration data" },
	作业: { "en": "Job" },
	子作业: { "en": "Subjob" },
	检查点配置: { "en": "Checkpoint Configuration" },
	"加载配置数据失败：": { "en": "Failed to load configuration data" },
	确认删除流图: { "en": "Are you sure you want to delete this stream graph?" },
	"吗？此操作不可恢复。": { "en": "This action cannot be undone." },
	删除流图: { "en": "Delete Stream Graph" },
	删除流图成功: { "en": "Stream graph deleted" },
	"删除流图失败：": { "en": "Failed to delete stream graph" },
	"加载失败：": { "en": "Failed to load stream graph details" },
	流图详情: { "en": "Stream Graph Details" },
	"流图 ID": { "en": "Stream Graph ID" },
	流图状态: { "en": "Stream Graph Status" },
	持续时间: { "en": "Duration" },
	执行次数: { "en": "Execution Count" },
	"无效的流图 ID": { "en": "Invalid Stream Graph ID" },
	"任务 ID": { "en": "Task ID" },
	订阅任务名称: { "en": "Action Name" },
	订阅方式: { "en": "Subscription Type" },
	"加载流任务订阅线程状态失败：": { "en": "Failed to load subscription task thread status" },
	流任务订阅线程状态: { "en": "Subscription Task Thread Status" },
	概览: { "en": "Overview" },
	检查点: { "en": "Checkpoint" },
	状态_streaming_flow: { "en": "Status" },
	"确定要删除当前选中的数据源吗？": { "en": "Are you sure you want to delete the currently selected data source?" },
	初始名称: { "en": "Initial Name" },
	额外信息: { "en": "Extra" },
	下游订阅偏移量: { "en": "Downstream Subscription Offset" },
	快照元数据: { "en": "Snapshot Metadata" },
	失败原因: { "en": "Failure Reason" },
	可用区: { "en": "Available Zone" },
	请输入可用区: { "en": "Please input the available zone" },
	所属区域: { "en": "Zone" },
	请输入所属区域: { "en": "Please input the zone" },
	"状态_streaming-graph": { "en": "Status" },
	"组名只能包含字母、数字、下划线、以及短横线，并且开头首字母必须为大小写英文字母": { "en": "Group names can only contain letters, numbers, underscores, and hyphens, and the first letter must be an uppercase or lowercase English letter." },
	"用户名只能包含字母、数字、下划线、以及短横线，并且开头首字母必须为大小写英文字母": { "en": "Usernames can only contain letters, numbers, underscores, and hyphens, and the first letter must be an uppercase or lowercase English letter." },
	"非 svg 背景图": { "en": "Non-svg background image" },
	返回的结果需要是表格: { "en": "The returned result needs to be a table" },
	"svg 背景图": { "en": "svg background image" },
	"svg 中顶层的 text 元素且含有 id 属性可以被下面的文本映射替换为动态文本;\n有 id 或 class 属性的元素可以设置动态颜色\n数据源的格式为 id, value 两列的表": { "en": "The top-level text element in svg with an id attribute can be replaced with dynamic text by the following text mapping;\nElements with id or class attributes can set dynamic colors\nThe data source format is a table with two columns: id and value" },
	"粘贴 svg 文件内容": { "en": "Paste the svg file content" },
	历史回放: { "en": "History Replay" },
	数据映射: { "en": "Data Mapping" },
	文本映射: { "en": "Text Mapping" },
	"一行一个映射，用英文冒号分隔，左边是背景中的文本 id，右边是数据 id，如:\ntext_id_0: data_id_0": { "en": "One mapping per line, separated by colons. The left side is the background text id, and the right side is the data id, such as:\ntext_id_0: data_id_0" },
	颜色映射: { "en": "Color Mapping" },
	"一行一个映射，用英文冒号分隔，左边是背景中的元素选择器，右边是数据 id，如:\nselector_0: data_id_0": { "en": "One mapping per line, separated by colons, with the element selector in the background on the left and the data id on the right, such as:\nselector_0: data_id_0" },
	"填写用于查询历史回放的脚本，支持 {{time}} 变量": { "en": "Fill in the script for querying historical playback, supporting the {{time}} variable" },
	"弹窗被浏览器拦截，请设置网页允许弹出式窗口和重定向": { "en": "The pop-up window is blocked by the browser. Please set the web page to allow pop-up windows and redirects." },
	从选定的时间开始回放: { "en": "Playback from selected time" },
	回放速率: { "en": "Playback Rate" },
	"回放已到达结束时间，切换回实时模式": { "en": "Playback has reached end time, switch back to real-time mode" },
	组态图: { "en": "Configuration" },
	最新: { "en": "Latest" },
	指标已更新: { "en": "Metrics updated" },
	未知错误: { "en": "Unknown error" },
	指标: { "en": "Metrics" },
	"node.properties 中的 metrics 数组长度应该为 1": { "en": "Metrics array length in node.properties should be 1" },
	"最后检查点 ID": { "en": "Last Checkpoint ID" },
	待处理消息: { "en": "Pending Message" },
	行计数: { "en": "Line Count" },
	"计划 ID": { "en": "Plan ID" },
	"报告 ID": { "en": "Report ID" },
	发送人: { "en": "Senders" },
	收件人: { "en": "Recipient" },
	邮件主题: { "en": "Message Subject" },
	发送时间: { "en": "Sending Time" },
	发送状态: { "en": "Sending Status" },
	发送中: { "en": "Sending" },
	发送失败: { "en": "Sending Failed" },
	邮件告警历史: { "en": "Mail Alarm History" },
	请选择发送状态: { "en": "Please select the sending status" },
	搜索: { "en": "Search" },
	"第 {{start}}-{{end}} 条，共 {{total}} 条": { "en": "{{start}}-{{end}}} of {{total}}" },
	没有足够的权限查看作业: { "en": "Not enough permissions to view job" },
	"使用 url 参数中的用户名密码登录失败，": { "en": "Failed to login using user name and password in url parameters" },
	"流图 {{name}} 不存在": { "en": "Stream graph {{name}} does not exist" },
	流图: { "en": "Stream graph" },
	删除流图失败: { "en": "Failed to delete stream graph" },
	无可用子图指标: { "en": "No available subgraph indicator" },
	"无 worker {{task_id}} 的可用子图指标": { "en": "No available subgraph indicator for worker {{task_id}}" },
	无可用引擎指标: { "en": "No available engine indicator" },
	子图: { "en": "Subgraph" },
	流任务订阅: { "en": "Stream task subscription" },
	流任务发布: { "en": "Stream task publishing" },
	客户端: { "en": "Client" },
	流引擎: { "en": "Stream engine" },
	"License 已过期，请联系管理人员立即更新，避免程序关闭": { "en": "The License has expired, please contact the manager to update it immediately to avoid the program closing" },
	"License 将在两周内过期，请提醒管理人员及时更新，避免程序过期后自动关闭": { "en": "The License will expire in two weeks, please remind the manager to update it in time to avoid the program closing automatically after it expires" },
	授权模块: { "en": "Authorized Module" },
	"数字用 \",\" 分组显示": { "en": "Numbers use\",\"Group Display" },
	"{{action}}成功，当前小数位数为：{{decimals}}; 数字分组显示: {{grouping}}": { "en": "{{action}} successful, current decimal digits are: {{decimals}}; Numbers display in groups: {{grouping}}" },
	"输入应为空或者 0 ~ 20 的整数": { "en": " Input should be empty or an integer from 0 to 20 " },
	"左快照消息 ID": { "en": " Left snapshot message ID" },
	"右快照消息 ID": { "en": " Right snapshot message ID" },
	"httpClient 插件版本与 server 版本的前3位不一致。": { "en": " The httpClient plug-in version is inconsistent with the first 3 bits of the server version. " },
	"控制节点不支持流计算监控，请跳转到数据节点或计算节点查看流计算监控。": { "en": "The control node does not support stream computing monitoring. Please jump to the data node or compute node to view stream computing monitoring. " },
	数据血缘: { "en": "Data Lineage" },
	已使用内存: { "en": "Memory used" },
	"控制节点不支持流图监控，请跳转到数据节点或计算节点查看流图监控。": { "en": "Control node does not support stream graph monitoring. Please jump to the data node or compute node to view stream graph monitoring. " },
	张量: { "en": "tensor" },
	开: { "en": "on" },
	关: { "en": "off" },
	"监控订阅节点的工作线程状态，以及流图中所有流任务的订阅信息\n": { "en": "Monitor the status of worker threads of subscribing nodes and subscription information of all flow tasks in the flow graph\n" },
	"监控流任务中所有订阅表对应的发布端连接状态\n": { "en": "Monitor the publisher connection status corresponding to all subscription tables in the flow task\n" },
	"监控流图中所有流计算引擎的状态\n": { "en": "Monitor the status of all flow calculation engines in the flow graph\n" },
	"监控流图中所有流表的状态\n": { "en": "Monitor the status of all flow tables in the flow graph\n" },
	"找不到流表 {{table_name}}，可能已经被删除": { "en": "Stream table {{table_name}} cannot be found. It may have been deleted" },
	"流表 {{name}} 的血缘关系图": { "en": "Lineage diagram of stream table {{name}}" },
	暂无流表: { "en": "No Stream table" },
	"引擎 {{id}} 已删除": { "en": "Engine {{id}} has been deleted" },
	"表名和引擎名称隐藏了中间的 .orca_table 和 .orca_engine": { "en": "Table name and engine name hide the middle .orca_table and .orca_engine" },
	测试模块: { "en": "Test Module" },
	查看数据血缘: { "en": "View Data Lineage" },
	"例如: 1h, 30m, 1d": { "en": "For example: 1h, 30m, 1d" },
	发送测试邮件: { "en": "Send Test Email" },
	测试邮件发送成功: { "en": "Test email sent successfully" },
	测试邮件发送失败: { "en": "Failed to send test email" },
	发送测试邮件失败: { "en": "Failed to send test email" },
	测试收件人: { "en": "Test Recipient" },
	请输入测试收件人邮箱: { "en": "Please enter the test recipient's email" },
	请输入有效的邮箱地址: { "en": "Please enter a valid email address" },
	多个邮箱请用逗号分隔: { "en": "Separate multiple emails with commas" },
	"例如: user1@example.com, user2@example.com": { "en": "e.g.: user1@example.com, user2@example.com" },
	邮件语言: { "en": "Email Language" },
	中文: { "en": "Chinese" },
	英文: { "en": "English" },
	请先完整填写邮件配置信息: { "en": "Please complete the email configuration first" },
	测试邮件: { "en": "Test Email" },
	"选填，留空表示不设置阈值": { "en": "Optional, leave blank to not set a threshold" },
	"{{label}}{{action}}成功": { "en": "{{label}} {{action}} successfully" },
	"查看流计算图相关信息，通过流图监控模块，用户可以直观监控通过 Orca 创建的流图任务及其运行状态，帮助用户实时掌握各流图的任务数量、执行次数和当前状态等。点击流图名称跳转至详情页面，查看具体任务结构与执行情况。": { "en": "View relevant information on stream calculation charts. Through the Stream Graph Module, users can intuitively monitor steam graph tasks created through Orca and their running status, helping users grasp the number of tasks, execution times and current status of each stream graph in real time. Click on the stream chart name to jump to the details page to view the specific task structure and execution status. " },
	"查看数据库表、计算引擎的血缘关系，清晰地展示节点的上游拓扑结构，帮助用户直观地理解数据流动路径，从而快速定位问题。": { "en": " View the blood relationship between database tables and calculation engines, clearly display the upstream topology of nodes, and help users intuitively understand the data flow path, thereby quickly locating problems. " },
	"OAuth 登录": { "en": "OAuth Login" },
	"确认删除流图 {{name}} 吗？\n此操作不可恢复。": { "en": "Confirm deletion of stream graph {{name}}? \nThis operation is irreversible." },
	"{{axis}} 轴名称": { "en": "{{axis}} axis name" },
	"加载中...": { "en": "Loading... " },
	已加载全部仓库: { "en": " All repos loaded " },
	"正在加载仓库列表...": { "en": " Loading repo list... " },
	"会话类型：": { "en": "Session type: " },
	所有会话: { "en": "All sessions" },
	系统缓存: { "en": "System cache" },
	"共 {{count}} 条会话，总占用内存 {{memory}}": { "en": "There are {{count}} sessions, total memory usage is {{memory}}" },
	"共 {{count}} 条会话，总占用内存 {{memory}}_plural": { "en": "There are {{count}} sessions, total memory usage is {{memory}}" },
	"系统缓存/用户会话": { "en": "System cache / User session" },
	仅管理员可使用会话管理功能: { "en": "Only administrators can use the session management function" },
	会话类型: { "en": "Session Type" },
	曲面图: { "en": "Surface" },
	"ddb 无 ticket，尝试通过密码 login 失败": { "en": "ddb has no ticket, attempt to login using password failed" },
	"控制除了 Tab 键以外，Enter 键是否同样可以接受建议。这能减少\"插入新行\"和\"接受建议\"命令之间的歧义。": { "en": "Controls whether the Enter key in addition to the Tab key can also accept suggestions. This reduces the ambiguity between the\"Insert new line\" and\"Accept suggestion\" commands. " },
	"编程语言:": { "en": "Programming Language:" },
	"请确认运行日志文件存在，并在启动命令或脚本（如 startSingle.sh）中通过 -logFile <path> 指定文件路径，不要在配置文件中设置 logFile": { "en": "Ensure the runtime log file exists, and set the file path with -logFile <path> in the startup command or script (e.g., startSingle.sh). Do not set logFile in the configuration file." },
	上传标签页代码到服务器: { "en": "Upload tab code to server" },
	上传: { "en": "Upload" },
	无法获取编辑器内容: { "en": "Unable to get editor content" },
	"上传成功: {{fp}}": { "en": "Upload successful: {{fp}}" },
	文件路径: { "en": "File path" },
	上传到服务器的文件路径: { "en": "File path uploaded to server" },
	"License Server 连接断开": { "en": "License Server connection disconnected" },
	"与 License Server 的连接已断开，剩余可用时间：{{days}} 天 {{hours}} 小时，请尽快恢复连接以避免服务关闭": { "en": "Connection to License Server has been disconnected, remaining available time: {{days}} days {{hours}}, please restore connection as soon as possible to avoid service shutdown" },
	"默认 (本地时区)": { "en": "Default (local time zone)" },
	复制文本操作应该成功: { "en": "Copy text operation should succeed" },
	自定义侧边菜单: { "en": "Customize Side Menu" },
	侧边菜单配置: { "en": "Side Menu Configuration" },
	添加菜单项: { "en": "Add Menu Item" },
	"暂无配置，点击上方按钮添加": { "en": "No configuration, click the button above to add" },
	"确认删除此菜单项？": { "en": "Are you sure to delete this menu item? " },
	编辑菜单项: { "en": " Edit menu item " },
	菜单标题: { "en": " Menu title " },
	请输入菜单标题: { "en": " Please enter menu title " },
	链接地址: { "en": " Link address " },
	"请输入链接地址，如 /xxx/xxx 或 https://dolphindb.cn": { "en": " Please enter link address, such as /xxx/xxx or https://dolphindb.cn " },
	自定义侧边菜单配置: { "en": "Custom Side Menu Configuration" },
	保存代码: { "en": "Save Code" },
	"设置默认字体大小（临时修改可将鼠标移到编辑器区域，通过 ctrl + 滚轮上下 调整）": { "en": "Set the default font size (for temporary modifications, you can move the mouse to the editor area and adjust it up and down using ctrl + wheel)" },
	"设置初始字体大小（临时修改可将鼠标移到编辑器区域，通过 ctrl + 滚轮上下 调整）": { "en": "Set initial font size (temporarily adjust by hovering over the editor area and using Ctrl + scroll wheel up/down)" },
	智能助手: { "en": "AI Assistant" },
	新建对话: { "en": "New Chat" },
	发送: { "en": "Send" },
	"请输入消息...": { "en": "Type a message..." },
	后端服务地址: { "en": "Backend Server URL" },
	"正在思考...": { "en": "Thinking..." },
	正在执行工具: { "en": "Running tool" },
	空闲: { "en": "Idle" },
	暂无对话: { "en": "No conversations" },
	请先新建对话: { "en": "Create a new chat to begin" },
	"智能助手初始化失败，请检查后端服务地址": { "en": "AI Assistant initialization failed, please check backend server URL" },
	工具调用: { "en": "Tool Call" },
	"工具调用已达到 {{count}} 轮，等待选择停止、继续或以后忽略。": { "en": "Tool calls reached {{count}} turns. Choose stop, continue, or ignore in the future." },
	工具调用限制已关闭: { "en": "Tool call limit is disabled" },
	继续且不再询问: { "en": "Continue and do not ask again" },
	"支持原生 tool call": { "en": "Native tool call support" },
	工具: { "en": "Tool" },
	推理过程: { "en": "Reasoning" },
	结果: { "en": "Result" },
	"确定删除此对话？": { "en": "Are you sure you want to delete this conversation?" },
	服务设置: { "en": "Server Settings" },
	模型配置: { "en": "Provider Settings" },
	技能管理: { "en": "Skills Management" },
	"配置可供 Agent 绑定和调用的技能。": { "en": "Configure skills that Agents can bind and use." },
	保存成功: { "en": "Saved successfully" },
	"连接失败，请检查地址": { "en": "Connection failed, please check the URL" },
	加载提供商列表失败: { "en": "Failed to load provider list" },
	新建提供商: { "en": "New Provider" },
	暂无提供商: { "en": "No providers" },
	"确定删除此提供商？": { "en": "Are you sure you want to delete this provider?" },
	已禁用: { "en": "Disabled" },
	请选择一个提供商或新建: { "en": "Select a provider or create a new one" },
	编辑提供商: { "en": "Edit Provider" },
	提供商名称: { "en": "Provider Name" },
	自定义请求头: { "en": "Custom Headers" },
	启用: { "en": "Enabled" },
	模型列表: { "en": "Models" },
	新增模型: { "en": "New Model" },
	暂无模型: { "en": "No models" },
	默认: { "en": "Default" },
	设为默认: { "en": "Set as Default" },
	编辑: { "en": "Edit" },
	"确定删除此模型？": { "en": "Are you sure you want to delete this model?" },
	编辑模型: { "en": "Edit Model" },
	模型名称: { "en": "Model Name" },
	模型代码: { "en": "Model Code" },
	上下文窗口: { "en": "Context Window" },
	"最大输出 Token": { "en": "Max Output Tokens" },
	支持工具调用: { "en": "Tool Calling Support" },
	额外配置: { "en": "Extra Config" },
	已设为默认模型: { "en": "Set as default model" },
	设置默认模型失败: { "en": "Failed to set default model" },
	创建成功: { "en": "Created successfully" },
	保存失败: { "en": "Save failed" },
	删除成功: { "en": "Deleted successfully" },
	删除失败: { "en": "Delete failed" },
	加载技能列表失败: { "en": "Failed to load skill list" },
	新建技能: { "en": "New Skill" },
	暂无技能: { "en": "No skills" },
	"确定删除此技能？": { "en": "Are you sure you want to delete this skill?" },
	请选择一个技能或新建: { "en": "Select a skill or create a new one" },
	编辑技能: { "en": "Edit Skill" },
	技能名称: { "en": "Skill Name" },
	脚本: { "en": "Script" },
	输入技能脚本内容: { "en": "Enter skill script content" },
	无描述: { "en": "No description" },
	新会话: { "en": "New Chat" },
	对话界面: { "en": "Chat" },
	工作区状态: { "en": "Workspace State" },
	文件列表: { "en": "Files" },
	选择模型: { "en": "Select Model" },
	暂无状态: { "en": "No state available" },
	空工作区: { "en": "Empty workspace" },
	在左侧树状图中选择文件以查看: { "en": "Select a file from the tree to view" },
	"输入消息发送给助手...": { "en": "Type a message to the assistant..." },
	"未配置 AI 模型服务，请先在系统设置中完成模型绑定。": { "en": "AI model service is not configured. Please bind a model in system settings first." },
	前往配置: { "en": "Go to Configuration" },
	请先创建会话: { "en": "Please create a session first" },
	工作区: { "en": "Workspace" },
	"AI 标签页": { "en": "AI Tab" },
	"AI 助手": { "en": "AI Assistant" },
	"新建 AI 标签页": { "en": "New AI Tab" },
	"正在连接 AI 助手...": { "en": "Connecting to AI assistant..." },
	输出结果已显示在下方面板: { "en": "Output displayed in the panel below" },
	"创建 AI 标签页失败": { "en": "Failed to create AI tab" },
	"上传本地文本文件到服务器（目前版本暂不支持上传二进制文件，二进制文件会被自动忽略）": { "en": "Upload local text files to server (binary files are not supported in this version and will be automatically ignored)" },
	上传本地文件: { "en": "Upload Local Files" },
	上传成功: { "en": "Upload successful" },
	"成功上传 {{count}} 个文本文件到 {{fpd}}": { "en": "Successfully uploaded {{count}} text file to {{fpd}}" },
	"成功上传 {{count}} 个文本文件到 {{fpd}}_plural": { "en": "Successfully uploaded {{count}} text files to {{fpd}}" },
	"跳过 {{count}} 个二进制文件:": { "en": "Skipped {{count}} binary file:" },
	"跳过 {{count}} 个二进制文件:_plural": { "en": "Skipped {{count}} binary files:" },
	远程路径: { "en": "Remote path" },
	"上传到服务器的目录路径，文件名将保持原名": { "en": "Directory path on the server to upload to, filenames will be kept unchanged" },
	选择文件: { "en": "Select files" },
	不支持上传文件夹: { "en": "Uploading folders is not supported" },
	待上传的文本文件: { "en": "Text files to upload" },
	上传标签页: { "en": "Upload Tab" },
	代码地图: { "en": "Code Map" },
	回车补全: { "en": "Enter Completion" },
	"语言:": { "en": "Language:" },
	已复制: { "en": "Copied" },
	"DolphinDB 连接已断开，无法发送消息": { "en": "DolphinDB connection is disconnected. Unable to send message." },
	"创建 AI 会话失败": { "en": "Failed to create AI session" },
	"AI 会话加载失败": { "en": "Failed to load AI session" },
	"会话不存在或已被删除，请新建 AI 会话。": { "en": "The session does not exist or has been deleted. Please create a new AI session." },
	继续: { "en": "Continue" },
	中断: { "en": "Interrupt" },
	"已运行 {{count}} 条命令": { "en": "Ran {{count}} command" },
	"已运行 {{count}} 条命令_plural": { "en": "Ran {{count}} commands" },
	"已编辑 {{count}} 个文件": { "en": "Edited {{count}} file" },
	"已编辑 {{count}} 个文件_plural": { "en": "Edited {{count}} files" },
	未知工具: { "en": "Unknown tool" },
	执行失败: { "en": "Execution failed" },
	已运行: { "en": "Ran" },
	思考中: { "en": "Thinking" },
	思考过程: { "en": "Reasoning" },
	步骤: { "en": "Steps" },
	文件不存在或已被删除: { "en": "The file does not exist or has been deleted" },
	加载文件失败: { "en": "Failed to load file" },
	关闭工作区: { "en": "Close workspace" },
	打开工作区: { "en": "Open workspace" },
	工作区文件: { "en": "Workspace files" },
	工作区和文件: { "en": "Workspace and Files" },
	关闭工作区和文件: { "en": "Close workspace and files" },
	打开工作区和文件: { "en": "Open workspace and files" },
	暂无工作区文件: { "en": "No workspace files" },
	暂无上传文件: { "en": "No uploaded files" },
	添加附件: { "en": "Add attachment" },
	上传新文件: { "en": "Upload new file" },
	"上传中...": { "en": "Uploading..." },
	上传附件失败: { "en": "Failed to upload attachment" },
	已上传文件: { "en": "Uploaded files" },
	"支持图片、PDF、DOCX、PPTX、XLSX 及文本文件（如 TXT、LOG、MD、CSV、TSV）": { "en": "Supports images, PDF, DOCX, PPTX, XLSX, and text files such as TXT, LOG, MD, CSV, and TSV" },
	不支持该文件格式: { "en": "Unsupported file format" },
	不限制: { "en": "Unlimited" },
	拖拽文件到此处上传: { "en": "Drop files here to upload" },
	暂无可选文件: { "en": "No files available" },
	取消发送附件: { "en": "Remove attachment from message" },
	加载工作区失败: { "en": "Failed to load workspace" },
	"加载 Agent 失败": { "en": "Failed to load Agent" },
	"加载 Agent 授权失败": { "en": "Failed to load Agent authorization" },
	已授权: { "en": "Authorized" },
	已撤销: { "en": "Revoked" },
	"Agent 权限": { "en": "Agent Permissions" },
	选择用户: { "en": "Select user" },
	"暂无 Agent": { "en": "No Agents" },
	"暂无可用 Agent": { "en": "No available Agents" },
	"当前账号没有可用的 Agent，请创建或激活一个 Agent 后使用。": { "en": "No available Agents for the current account. Please create or activate an Agent first." },
	"前往 Agent 管理": { "en": "Go to Agent Management" },
	未授权: { "en": "Unauthorized" },
	授权访问: { "en": "Grant access" },
	加载模型配置失败: { "en": "Failed to load model configs" },
	"加载用户 LLM 授权失败": { "en": "Failed to load user LLM authorization" },
	"加载用户组 LLM 授权失败": { "en": "Failed to load group LLM authorization" },
	用户模型权限: { "en": "User Model Permissions" },
	用户组模型权限: { "en": "Group Model Permissions" },
	模型: { "en": "Model" },
	Provider: { "en": "Provider" },
	授权: { "en": "Authorize" },
	加载技能失败: { "en": "Failed to load skills" },
	加载禁用技能失败: { "en": "Failed to load disabled skills" },
	已允许: { "en": "Allowed" },
	用户技能权限: { "en": "User Skill Permissions" },
	用户组技能权限: { "en": "Group Skill Permissions" },
	技能: { "en": "Skill" },
	允许使用: { "en": "Allow use" },
	允许: { "en": "Allow" },
	禁用: { "en": "Disabled" },
	暂无用户: { "en": "No users" },
	"正在编辑用户：{{user}}": { "en": "Editing user: {{user}}" },
	请选择用户: { "en": "Please select a user" },
	仅管理员可访问: { "en": "Administrators only" },
	用户权限: { "en": "User Permissions" },
	用户组权限: { "en": "Group Permissions" },
	选择需要管理的用户组: { "en": "Select a group to manage" },
	加载用户组失败: { "en": "Failed to load groups" },
	暂无用户组: { "en": "No groups" },
	请选择用户组: { "en": "Please select a group" },
	"正在编辑用户组：{{group}}": { "en": "Editing group: {{group}}" },
	授权对象不能为空: { "en": "Authorization subject cannot be empty" },
	用户组级别赋权功能暂未开启: { "en": "Group-level authorization is not enabled" },
	"请先选择 Agent": { "en": "Please select an Agent first" },
	加载会话失败: { "en": "Failed to load sessions" },
	加载历史消息失败: { "en": "Failed to load message history" },
	已归档: { "en": "Archived" },
	归档失败: { "en": "Failed to archive" },
	删除会话失败: { "en": "Failed to delete session" },
	请输入标题: { "en": "Please enter a title" },
	摘要生成失败: { "en": "Failed to generate summary" },
	会话: { "en": "Sessions" },
	"选择 Agent": { "en": "Select Agent" },
	"会话开始后不能切换 Agent，如需切换请新建会话": { "en": "Agent cannot be changed after a session starts. To switch Agents, create a new session." },
	暂无会话: { "en": "No sessions" },
	恢复会话失败: { "en": "Failed to restore session" },
	改标题: { "en": "Rename" },
	生成摘要: { "en": "Generate summary" },
	"归档后不可继续在该会话中发送消息，确定归档？": { "en": "You cannot send messages in this session after archiving it. Archive now?" },
	归档: { "en": "Archive" },
	"确定删除此会话？": { "en": "Delete this session?" },
	修改会话标题: { "en": "Edit session title" },
	"会话摘要：{{title}}": { "en": "Session Summary: {{title}}" },
	会话摘要: { "en": "Session Summary" },
	"摘要要求（可选，例如：重点保留结论和关键 SQL）": { "en": "Summary requirements (optional, for example: keep key conclusions and SQL)" },
	重新生成完整摘要: { "en": "Regenerate full summary" },
	摘要已生成: { "en": "Summary generated" },
	加载记忆失败: { "en": "Failed to load memory" },
	"{{count}} 个文件": { "en": "{{count}} files" },
	偏好: { "en": "Preference" },
	事实: { "en": "Fact" },
	流程: { "en": "Procedure" },
	失败防护: { "en": "Failure shield" },
	加载公共记忆失败: { "en": "Failed to load public memory" },
	公共记忆已保存: { "en": "Public memory saved" },
	保存公共记忆失败: { "en": "Failed to save public memory" },
	"确认保存公共记忆？": { "en": "Save public memory?" },
	"公共记忆会注入该 Agent 下所有用户的后续对话上下文，修改后可能影响所有用户的回答结果。确定保存？": { "en": "Public memory is injected into future conversation context for all users under this Agent. Changes may affect all users' responses. Save it?" },
	确认保存: { "en": "Save" },
	已清空: { "en": "Cleared" },
	清空公共记忆失败: { "en": "Failed to clear public memory" },
	"确认清空公共记忆？": { "en": "Clear public memory?" },
	"清空公共记忆会影响该 Agent 下所有用户的后续对话上下文。该操作会移除当前公共记忆内容，确定清空？": { "en": "Clearing public memory affects future conversation context for all users under this Agent. This will remove the current public memory content. Clear it?" },
	确认清空: { "en": "Clear" },
	"放弃未保存修改？": { "en": "Discard unsaved changes?" },
	"当前公共记忆修改尚未保存，放弃后将恢复为上次保存的内容。": { "en": "The current public memory changes have not been saved. Discarding them will restore the last saved content." },
	放弃修改: { "en": "Discard changes" },
	继续编辑: { "en": "Keep editing" },
	请填写记忆内容: { "en": "Please enter memory content" },
	请填写分类和内容: { "en": "Please enter category and content" },
	保存记忆失败: { "en": "Failed to save memory" },
	删除记忆失败: { "en": "Failed to delete memory" },
	记忆: { "en": "Memory" },
	主分类: { "en": "Category" },
	"更新人：{{user}}": { "en": "Updated by: {{user}}" },
	公共记忆内容: { "en": "Public memory content" },
	"请选择 Agent": { "en": "Please select an Agent" },
	加载记忆统计失败: { "en": "Failed to load memory stats" },
	加载记忆详情失败: { "en": "Failed to load memory details" },
	摘要: { "en": "Summary" },
	关键词: { "en": "Keywords" },
	综合分: { "en": "Rank score" },
	文本分: { "en": "Text score" },
	向量分: { "en": "Vector score" },
	保存配置: { "en": "Save Configuration" },
	"编辑 MCP Server 配置": { "en": "Edit MCP Server configuration" },
	测试: { "en": "Test" },
	查看候选文档: { "en": "View candidate documents" },
	查看原始响应: { "en": "View raw response" },
	撤销管理权限: { "en": "Revoke management permission" },
	"当前账号没有可用的 Agent，请联系管理员授权。": { "en": "No Agent is available for the current account. Contact an administrator for access." },
	"第三方 MCP": { "en": "Third-party MCP" },
	调用成功: { "en": "Call succeeded" },
	调用失败: { "en": "Call failed" },
	"该 MCP Server 仍被 Agent 绑定，请先解绑后再删除": { "en": "This MCP Server is still bound to an Agent. Unbind it before deleting." },
	"固定 Token": { "en": "Fixed Token" },
	"固定 Token 认证方式需要填写 Token": { "en": "Token is required for fixed Token authentication" },
	"关闭后，AI 助手将不会联网搜索 DolphinDB 官方文档。": { "en": "When disabled, the AI assistant will not search official DolphinDB documentation online." },
	"加载 Agent 管理权限失败": { "en": "Failed to load Agent management permissions" },
	"连接成功，发现 {{count}} 个工具: {{names}}": { "en": "Connection succeeded. Found {{count}} tools: {{names}}" },
	"连接成功，但缺少 MCP_EXEC 权限查看工具列表": { "en": "Connection succeeded, but MCP_EXEC permission is required to view the tool list" },
	连接失败: { "en": "Connection failed" },
	留空表示不修改: { "en": "Leave blank to keep unchanged" },
	"没有权限访问 AI 助手，请联系管理员授权。": { "en": "You do not have permission to access the AI assistant. Contact an administrator for access." },
	"配置可供 Agent 绑定和调用的 MCP Server。": { "en": "Configure MCP Servers that Agents can bind and call." },
	配置已保存: { "en": "Configuration saved" },
	配置已删除: { "en": "Configuration deleted" },
	启用文档搜索: { "en": "Enable document search" },
	"请输入 MCP Server 名称": { "en": "Please enter an MCP Server name" },
	"请输入 Server 地址": { "en": "Please enter a Server address" },
	"请先选择 Agent 和用户": { "en": "Please select an Agent and user first" },
	"请选择 MCP 类型": { "en": "Please select an MCP type" },
	请选择认证方式: { "en": "Please select an authentication method" },
	"确定解绑此 MCP Server？": { "en": "Unbind this MCP Server?" },
	"确定禁用此 MCP Server？": { "en": "Disable this MCP Server?" },
	"确定删除此 MCP Server 配置？": { "en": "Delete this MCP Server configuration?" },
	认证方式: { "en": "Authentication" },
	"使用当前 DolphinDB 用户": { "en": "Use current DolphinDB user" },
	"授权管理 Agent": { "en": "Grant Agent management permission" },
	"添加 MCP Server": { "en": "Add MCP Server" },
	"添加 MCP Server 配置": { "en": "Add MCP Server configuration" },
	"未授权管理 Agent": { "en": "Agent management not granted" },
	无需认证: { "en": "No authentication" },
	下载失败: { "en": "Download failed" },
	"新会话 ": { "en": "New session " },
	"已撤销 Agent 管理权限": { "en": "Agent management permission revoked" },
	"撤销 Agent 管理权限失败": { "en": "Failed to revoke Agent management permission" },
	"授予 Agent 管理权限失败": { "en": "Failed to grant Agent management permission" },
	"已授权管理 Agent": { "en": "Authorized to manage Agent" },
	"已授予 Agent 管理权限": { "en": "Agent management permission granted" },
	"暂无 MCP Server 配置": { "en": "No MCP Server configurations" },
	"暂无可用 MCP Server，请先在「MCP 管理」中添加配置": { "en": "No available MCP Server. Add one in MCP Management first." },
	"Agent 管理权限": { "en": "Agent management permissions" },
	"DolphinDB 内置 MCP": { "en": "Built-in DolphinDB MCP" },
	"MCP 绑定": { "en": "MCP bindings" },
	"MCP 管理": { "en": "MCP Management" },
	"MCP 类型": { "en": "MCP Type" },
	"MCP Server 配置": { "en": "MCP Server configuration" },
	"Server 地址": { "en": "Server Address" },
	"Server 禁用": { "en": "Server disabled" },
	"Server 可用": { "en": "Server available" },
	"Server 未知": { "en": "Server unknown" },
	记忆任务已触发: { "en": "Memory job triggered" },
	触发记忆任务失败: { "en": "Failed to trigger memory job" },
	触发记忆提取: { "en": "Trigger memory extraction" },
	请先启用记忆后再触发记忆提取: { "en": "Enable memory before triggering memory extraction" },
	总数: { "en": "Total" },
	个人记忆: { "en": "Personal memories" },
	平均重要度: { "en": "Average importance" },
	加载记忆设置失败: { "en": "Failed to load memory settings" },
	记忆设置已更新: { "en": "Memory settings updated" },
	更新记忆设置失败: { "en": "Failed to update memory settings" },
	加载记忆配置失败: { "en": "Failed to load memory config" },
	保存记忆配置失败: { "en": "Failed to save memory config" },
	"记忆配置 JSON": { "en": "Memory config JSON" },
	允许个人记忆: { "en": "Allow personal memory" },
	记忆模型配置: { "en": "Memory model config" },
	"使用 Agent 默认模型": { "en": "Use Agent default model" },
	记忆向量配置: { "en": "Memory embedding config" },
	不使用向量召回: { "en": "Do not use vector recall" },
	公共记忆上限: { "en": "Public memory limit" },
	记忆注入上限: { "en": "Memory injection limit" },
	候选主题召回上限: { "en": "Registry recall limit" },
	个人记忆预算: { "en": "Personal memory budget" },
	公共记忆预算: { "en": "Public memory budget" },
	会话空闲分钟: { "en": "Session idle minutes" },
	最大会话天数: { "en": "Max session age days" },
	自动整理冷却分钟: { "en": "Consolidation cooldown minutes" },
	单次整理候选上限: { "en": "Raw memory consolidation limit" },
	低频维护未使用天数: { "en": "Unused days threshold" },
	"请输入合法 JSON": { "en": "Please enter valid JSON" },
	忘记: { "en": "Forget" },
	忘记会话记忆: { "en": "Forget session memory" },
	请选择会话: { "en": "Please select a session" },
	忘记请求已提交: { "en": "Forget request submitted" },
	忘记会话记忆失败: { "en": "Failed to forget session memory" },
	Agent: { "en": "Agent" },
	个人: { "en": "Personal" },
	分类: { "en": "Category" },
	搜索记忆: { "en": "Search memory" },
	综合排序: { "en": "Hybrid ranking" },
	最近更新: { "en": "Recently updated" },
	重要度: { "en": "Importance" },
	相关度: { "en": "Relevance" },
	文本相关度: { "en": "Text relevance" },
	文本匹配: { "en": "Text match" },
	启用记忆: { "en": "Enable memory" },
	新增记忆: { "en": "Add memory" },
	"共 {{count}} 条": { "en": "{{count}} total" },
	任务类型: { "en": "Job Type" },
	任务状态: { "en": "Job Status" },
	"任务 Key": { "en": "Job Key" },
	完成时间: { "en": "Finish Time" },
	剩余重试: { "en": "Retries Left" },
	最近错误: { "en": "Last Error" },
	重试请求已提交: { "en": "Retry request submitted" },
	记忆任务重试次数已重置: { "en": "Memory job retry count reset" },
	加载记忆任务失败: { "en": "Failed to load memory jobs" },
	重试记忆任务失败: { "en": "Failed to retry memory job" },
	重置记忆任务重试次数失败: { "en": "Failed to reset memory job retry count" },
	加载记忆任务详情失败: { "en": "Failed to load memory job details" },
	记忆任务详情: { "en": "Memory job details" },
	Worker: { "en": "Worker" },
	重试时间: { "en": "Retry time" },
	输入水位: { "en": "Input watermark" },
	成功水位: { "en": "Success watermark" },
	用户记忆维护: { "en": "User memory maintenance" },
	触发记忆整理: { "en": "Trigger memory consolidation" },
	重置记忆: { "en": "Reset memory" },
	重置次数: { "en": "Reset retries" },
	请先选择用户: { "en": "Please select a user first" },
	重置用户个人记忆: { "en": "Reset user personal memory" },
	"重置所选 Agent 下该用户的记忆：": { "en": "Reset this user's memory under the selected Agent:" },
	移除个人记忆: { "en": "Remove personal memory" },
	清除中间记忆结果: { "en": "Clear intermediate memory results" },
	"确定重置该用户的个人记忆？": { "en": "Reset this user's personal memory?" },
	"已重置用户个人记忆，移除 {{count}} 条记忆": { "en": "User personal memory reset. Removed {{count}} memories" },
	重置用户个人记忆失败: { "en": "Failed to reset user personal memory" },
	总记忆: { "en": "Total memories" },
	我的记忆: { "en": "My memories" },
	"Agent 记忆": { "en": "Agent memory" },
	暂无记忆: { "en": "No memory" },
	来源: { "en": "Source" },
	内容: { "en": "Content" },
	"确定删除这条记忆？": { "en": "Delete this memory?" },
	编辑记忆: { "en": "Edit memory" },
	更新: { "en": "Update" },
	记忆内容: { "en": "Memory content" },
	记忆详情: { "en": "Memory details" },
	来源引用: { "en": "Source reference" },
	"请选择 Agent、会话并输入消息": { "en": "Please select an Agent and session, then enter a message" },
	加载上下文预览失败: { "en": "Failed to load context preview" },
	上下文预览: { "en": "Context Preview" },
	选择会话: { "en": "Select session" },
	输入待预览的用户消息: { "en": "Enter the user message to preview" },
	"Agent ID": { "en": "Agent ID" },
	工具列表: { "en": "Tools" },
	"最大上下文 Token 数": { "en": "Maximum Context Tokens" },
	"预估 Token": { "en": "Estimated Tokens" },
	"MCP 诊断": { "en": "MCP Diagnostics" },
	组装模式: { "en": "Assembly Mode" },
	记忆数量: { "en": "Memory Count" },
	历史消息数: { "en": "History Messages" },
	技能数量: { "en": "Skill Count" },
	已加载技能指令数: { "en": "Loaded Skill Instructions" },
	工具数量: { "en": "Tool Count" },
	包含公共记忆: { "en": "Includes Public Memory" },
	历史模式: { "en": "History Mode" },
	摘要已配置: { "en": "Summary Configured" },
	包含摘要: { "en": "Includes Summary" },
	摘要截止序号: { "en": "Summary Through Sequence" },
	历史消息起始序号: { "en": "History Start Sequence" },
	历史消息结束序号: { "en": "History End Sequence" },
	技能目录: { "en": "Skill Catalog" },
	记忆上下文: { "en": "Memory Context" },
	摘要消息: { "en": "Summary Message" },
	历史消息: { "en": "History Messages" },
	外部上下文: { "en": "External Context" },
	用户消息: { "en": "User Message" },
	工具定义: { "en": "Tool Definitions" },
	项目: { "en": "Item" },
	"Token 项": { "en": "Token Item" },
	数量: { "en": "Count" },
	角色: { "en": "Role" },
	加载用量失败: { "en": "Failed to load usage" },
	"部分 Agent 用量加载失败": { "en": "Failed to load usage for some agents" },
	我的用量: { "en": "My Usage" },
	暂无用量: { "en": "No usage" },
	"Agent 名称": { "en": "Agent Name" },
	请求次数: { "en": "Requests" },
	"输入 Token": { "en": "Input Tokens" },
	"输出 Token": { "en": "Output Tokens" },
	"总 Token": { "en": "Total Tokens" },
	用户用量: { "en": "User Usage" },
	"AI 助手初始化失败": { "en": "Failed to initialize AI assistant" },
	"等待 DolphinDB 脚本执行审批...": { "en": "Waiting for DolphinDB script execution approval..." },
	重复工具调用已跳过: { "en": "Skipped repeated tool call" },
	"模型仍在重复同一个工具调用，流程已停止。请基于已有工具结果回答，或换一个明确不同的策略。": { "en": "The model is still repeating the same tool call, so the flow has stopped. Answer based on existing tool results, or use a clearly different strategy." },
	"这个完全相同的工具调用已经尝试过 {{count}} 次，不要继续重复；请改用不同参数、查询文档，或基于已有结果回答。": { "en": "This exact same tool call has already been tried {{count}} time. Do not repeat it; use different parameters, search the documentation, or answer based on existing results." },
	"这个完全相同的工具调用已经尝试过 {{count}} 次，不要继续重复；请改用不同参数、查询文档，或基于已有结果回答。_plural": { "en": "This exact same tool call has already been tried {{count}} times. Do not repeat it; use different parameters, search the documentation, or answer based on existing results." },
	"{{count}} 次连续 DolphinDB 工具结果都没有提供有效信息。不要继续猜测 API；请查询官方文档、运行更小的验证脚本，或基于已知结果说明不确定性。": { "en": "{{count}} consecutive DolphinDB tool result did not provide useful information. Do not keep guessing the API; search the official documentation, run a smaller validation script, or explain the uncertainty based on known results." },
	"{{count}} 次连续 DolphinDB 工具结果都没有提供有效信息。不要继续猜测 API；请查询官方文档、运行更小的验证脚本，或基于已知结果说明不确定性。_plural": { "en": "{{count}} consecutive DolphinDB tool results did not provide useful information. Do not keep guessing the API; search the official documentation, run a smaller validation script, or explain the uncertainty based on known results." },
	"工具调用已达到 {{count}} 轮，等待选择停止或继续。": { "en": "Tool calls have reached {{count}} round. Waiting for a choice to stop or continue." },
	"工具调用已达到 {{count}} 轮，等待选择停止或继续。_plural": { "en": "Tool calls have reached {{count}} rounds. Waiting for a choice to stop or continue." },
	归档会话不可继续发送消息: { "en": "Archived sessions cannot continue sending messages" },
	"Agent 已连续运行较长时间，是否继续": { "en": "Agent has been running for a long time. Continue?" },
	流式响应不可读取: { "en": "Streaming response is not readable" },
	"流式响应 JSON 解析失败: {{error}}": { "en": "Failed to parse streaming response JSON: {{error}}" },
	"正在压缩上下文...": { "en": "Compacting context..." },
	流式响应返回错误: { "en": "Streaming response returned an error" },
	模型返回了空响应: { "en": "The model returned an empty response" },
	"工具调用 JSON 格式错误": { "en": "Tool call JSON format error" },
	"检测到以 tool 开头的 JSON 字段，但格式不符合要求。请使用 {\"tool_call\":\"工具名\",\"args\":[...]}，例如 {\"tool_call\":\"step_update\",\"args\":[\"0\",\"true\"]}。不要使用 tool_update、tool_calls_update 等自定义字段。": { "en": "Detected a JSON field starting with tool, but its format is invalid. Use {\"tool_call\":\"tool name\",\"args\":[...]}, for example {\"tool_call\":\"step_update\",\"args\":[\"0\",\"true\"]}. Do not use custom fields such as tool_update or tool_calls_update." },
	"用户未允许执行 DolphinDB 脚本。": { "en": "The user did not allow DolphinDB script execution." },
	"加载 Agent 列表失败": { "en": "Failed to load Agent list" },
	"请输入 Agent 名称": { "en": "Please enter an Agent name" },
	"Agent 创建成功": { "en": "Agent created" },
	"新建 Agent": { "en": "New Agent" },
	活跃: { "en": "Active" },
	当前: { "en": "Current" },
	"例如: DolphinDB 助手": { "en": "Example: DolphinDB Assistant" },
	"Agent 描述": { "en": "Agent Description" },
	"用于 DolphinDB 开发、调试、脚本生成和数据分析的内置编程助手。": { "en": "A built-in coding assistant for DolphinDB development, debugging, script generation, and data analysis." },
	"你是 DolphinDB Coding Agent，负责替用户完成 DolphinDB 相关的代码编写、调试、脚本生成、数据分析和问题排查。\n\n能执行就直接执行，尽量把工作推进到可用结果，而不是只给建议。回答要直接、可靠、便于复查；信息不足时只问必要问题，不臆造表结构、接口或运行结果。": { "en": "You are the DolphinDB Coding Agent. Your role is to help users complete DolphinDB-related coding, debugging, script generation, data analysis, and troubleshooting tasks.\n\nWhen you can take action, do so and move the work toward a usable result instead of only offering advice. Keep your answers direct, reliable, and easy to verify. If information is insufficient, ask only necessary questions. Do not invent table schemas, APIs, or execution results." },
	系统提示词: { "en": "System Prompt" },
	"系统提示词，会作为对话的首条 system message": { "en": "System prompt, used as the first system message in the conversation" },
	创建并激活: { "en": "Create and Activate" },
	"请选择一个 Agent": { "en": "Please select an Agent" },
	加载绑定信息失败: { "en": "Failed to load binding information" },
	已激活: { "en": "Activated" },
	激活失败: { "en": "Failed to activate" },
	激活: { "en": "Activate" },
	"确定挂起此 Agent？": { "en": "Suspend this Agent?" },
	已挂起: { "en": "Suspended" },
	挂起失败: { "en": "Failed to suspend" },
	挂起: { "en": "Suspend" },
	"确定删除此 Agent？": { "en": "Delete this Agent?" },
	已删除: { "en": "Deleted" },
	"Agent 配置": { "en": "Agent Config" },
	"保存 Agent": { "en": "Save Agent" },
	模型绑定: { "en": "Model Binding" },
	"优先级（数值越小优先级越高）": { "en": "Priority (smaller values have higher priority)" },
	设置失败: { "en": "Failed to set" },
	已设为默认: { "en": "Set as default" },
	解绑: { "en": "Unbind" },
	已解绑: { "en": "Unbound" },
	解绑失败: { "en": "Failed to unbind" },
	可用模型配置: { "en": "Available Model Configs" },
	绑定: { "en": "Bind" },
	已绑定: { "en": "Bound" },
	绑定失败: { "en": "Failed to bind" },
	"暂无可用模型配置，请先在「模型管理」中创建": { "en": "No model configurations available. Create one in Model Management first." },
	技能绑定: { "en": "Skill Binding" },
	已启用: { "en": "Enabled" },
	操作失败: { "en": "Operation failed" },
	可用技能: { "en": "Available Skills" },
	"暂无可用技能，请先在「技能管理」中上传": { "en": "No available skills. Please upload one in Skill Management first." },
	"{{field}} JSON 格式错误": { "en": "{{field}} JSON format error" },
	"请输入 Provider 名称": { "en": "Please enter a Provider name" },
	"请输入 Base URL": { "en": "Please enter Base URL" },
	"删除失败，请先删除该 Provider 下的所有模型配置": { "en": "Delete failed. Please delete all model configs under this Provider first." },
	禁用失败: { "en": "Failed to disable" },
	启用失败: { "en": "Failed to enable" },
	"请先选择一个 Provider": { "en": "Please select a Provider first" },
	"只有活跃 Provider 可以新增模型配置": { "en": "Only active Providers can add model configs" },
	请输入配置名称: { "en": "Please enter a config name" },
	请输入模型名称: { "en": "Please enter a model name" },
	"请求路径必须以 / 开头": { "en": "Request path must start with /" },
	自定义参数: { "en": "Custom Parameters" },
	重试配置: { "en": "Retry Config" },
	"embeddingMetric=cosine 时必须勾选归一化": { "en": "Normalization must be enabled when embeddingMetric=cosine" },
	"新建 Provider": { "en": "New Provider" },
	"暂无 Provider": { "en": "No Providers" },
	"未配置 Base URL": { "en": "Base URL not configured" },
	"模型数: {{count}}": { "en": "Models: {{count}}" },
	"模型数: {{count}}_plural": { "en": "Models: {{count}}" },
	"请从左侧选择一个 Provider，或点击「模型管理」右侧的 + 新建": { "en": "Select a Provider on the left, or click + to the right of Model Management." },
	"编辑 Provider": { "en": "Edit Provider" },
	"Provider 名称": { "en": "Provider Name" },
	适配器类型: { "en": "Adapter Type" },
	"确定禁用此 Provider？": { "en": "Disable this Provider?" },
	"禁用前需要确保没有未删除的模型配置继续引用该 Provider": { "en": "Before disabling, make sure no undeleted model configs still reference this Provider" },
	"禁用 Provider": { "en": "Disable Provider" },
	"确定启用此 Provider？": { "en": "Enable this Provider?" },
	"启用 Provider 不会自动启用引用它的模型配置": { "en": "Enabling a Provider will not automatically enable model configs that reference it" },
	"启用 Provider": { "en": "Enable Provider" },
	"确定删除此 Provider？": { "en": "Delete this Provider?" },
	"删除 Provider": { "en": "Delete Provider" },
	关联模型配置: { "en": "Related Model Configs" },
	"暂无模型，请点击「关联模型配置」右侧的「新增模型」添加": { "en": "No models. Click Add Model to the right of Related Model Configs." },
	已删除的模型配置不可编辑: { "en": "Deleted model configs cannot be edited" },
	"确定禁用此模型配置？": { "en": "Disable this model config?" },
	"确定启用此模型配置？": { "en": "Enable this model config?" },
	"启用前要求所属 Provider 为 ACTIVE": { "en": "The Provider must be ACTIVE before enabling" },
	"确定删除此模型配置？": { "en": "Delete this model config?" },
	新增模型配置: { "en": "Add Model Config" },
	编辑模型配置: { "en": "Edit Model Config" },
	配置名称: { "en": "Config Name" },
	能力: { "en": "Capabilities" },
	请求路径: { "en": "Request Path" },
	"最大并发（可选）": { "en": "Max Concurrency (optional)" },
	"速率限制 RPM（可选）": { "en": "Rate Limit RPM (optional)" },
	"超时毫秒（可选）": { "en": "Timeout Milliseconds (optional)" },
	嵌入维度: { "en": "Embedding Dimension" },
	嵌入度量: { "en": "Embedding Metric" },
	"对向量做归一化（metric=cosine 时必须开启）": { "en": "Normalize vectors (required when metric=cosine)" },
	"自定义参数 (JSON，传给模型的其他参数)": { "en": "Custom Parameters (JSON, additional parameters passed to the model)" },
	"重试配置 (JSON，可选)": { "en": "Retry Config (JSON, optional)" },
	"技能文件列表格式异常，已忽略无效文件": { "en": "Skill file list format is invalid. Invalid files have been ignored." },
	加载技能指令失败: { "en": "Failed to load skill instructions" },
	加载技能文件失败: { "en": "Failed to load skill files" },
	注册技能: { "en": "Register Skill" },
	技能包: { "en": "Skill Package" },
	"选择 ZIP 文件": { "en": "Select ZIP File" },
	"ZIP 包须包含 SKILL.md 入口文件（含 YAML frontmatter 元数据和 Markdown 指令体）": { "en": "The ZIP package must include the SKILL.md entry file, with YAML frontmatter metadata and Markdown instructions" },
	"覆盖元数据（可选，覆盖 SKILL.md 中的同名字段）": { "en": "Override metadata (optional, overrides fields with the same names in SKILL.md)" },
	"例如: search-database": { "en": "Example: search-database" },
	显示名称: { "en": "Display Name" },
	"例如: 数据库搜索": { "en": "Example: Database Search" },
	"例如: database": { "en": "Example: database" },
	"例如: 1.0.0": { "en": "Example: 1.0.0" },
	"技能描述，会作为 Agent 调用技能时的参考信息": { "en": "Skill description, used as reference when the Agent calls the skill" },
	"请选择技能包 ZIP 文件": { "en": "Please select a skill package ZIP file" },
	技能注册成功: { "en": "Skill registered" },
	注册失败: { "en": "Registration failed" },
	注册: { "en": "Register" },
	"暂无可用技能，请先创建": { "en": "No available skills. Please create one first." },
	激活技能: { "en": "Activate Skill" },
	"确定禁用此技能？": { "en": "Disable this skill?" },
	"技能详情：{{name}}": { "en": "Skill Details: {{name}}" },
	技能详情: { "en": "Skill Details" },
	公共技能: { "en": "Common Skill" },
	所有者: { "en": "Owner" },
	兼容性: { "en": "Compatibility" },
	参数提示: { "en": "Argument Hint" },
	内容版本: { "en": "Content Revision" },
	"内容 Hash": { "en": "Content Hash" },
	技能指令: { "en": "Skill Instructions" },
	暂无指令: { "en": "No instructions" },
	技能文件: { "en": "Skill Files" },
	暂无技能文件: { "en": "No skill files" },
	文件预览: { "en": "File Preview" },
	请选择左侧文件: { "en": "Please select a file on the left" },
	文件内容为空: { "en": "File content is empty" },
	初始化完成: { "en": "Initialization complete" },
	升级完成: { "en": "Upgrade complete" },
	"AI 内置资源初始化未完成": { "en": "AI built-in resource initialization was not completed" },
	"AI 内置资源升级未完成": { "en": "AI built-in resource upgrade was not completed" },
	"AI 内置资源初始化失败": { "en": "AI built-in resource initialization failed" },
	"AI 内置资源升级失败": { "en": "AI built-in resource upgrade failed" },
	"初始化未完成，详情请查看控制台": { "en": "Initialization was not completed. See the console for details." },
	"初始化失败，详情请查看控制台": { "en": "Initialization failed. See the console for details." },
	"AI 设置": { "en": "AI Settings" },
	"Agent 管理": { "en": "Agent Management" },
	模型管理: { "en": "Model Management" },
	记忆管理: { "en": "Memory Management" },
	记忆配置: { "en": "Memory Configuration" },
	记忆任务: { "en": "Memory Tasks" },
	个人中心: { "en": "Personal Center" },
	个人会话: { "en": "Personal Sessions" },
	个人用量: { "en": "Personal Usage" },
	"选择需要管理的 Provider": { "en": "Select a Provider to manage" },
	"选择需要管理会话的 Agent": { "en": "Select an Agent to manage sessions" },
	"选择需要查看记忆的 Agent": { "en": "Select an Agent to view memory" },
	"选择需要配置记忆的 Agent": { "en": "Select an Agent to configure memory" },
	"选择需要查看记忆任务的 Agent": { "en": "Select an Agent to view memory tasks" },
	"选择需要预览上下文的 Agent": { "en": "Select an Agent to preview context" },
	"选择需要查看用量的 Agent": { "en": "Select an Agent to view usage" },
	选择需要管理的用户: { "en": "Select a user to manage" },
	内置资源升级: { "en": "Built-in resource upgrade" },
	内置资源升级成功: { "en": "Built-in resource upgrade succeeded" },
	初始化部分成功: { "en": "Initialization partially succeeded" },
	继续初始化: { "en": "Continue initialization" },
	初始化资源有问题: { "en": "Initialization resources have issues" },
	"需要初始化 AI 内置资源": { "en": "AI built-in resources need to be initialized" },
	"需要升级 AI 内置资源": { "en": "AI built-in resources need to be upgraded" },
	"首次使用 AI 前，需要初始化内置 Agent 和 Skill。": { "en": "Before using AI for the first time, initialize the built-in Agent and Skill." },
	"检测到内置 Agent 或 Skill 可升级，请执行升级。": { "en": "Built-in Agent or Skill updates are available. Please run the upgrade." },
	"存在失败或冲突项，可继续初始化。": { "en": "Failures or conflicts exist. You can continue initialization." },
	"当前内置资源 manifest 缺失、无法解析或校验失败。": { "en": "The current built-in resource manifest is missing, cannot be parsed, or failed validation." },
	当前版本: { "en": "Current version" },
	可升级版本: { "en": "Available version" },
	暂无版本信息: { "en": "No version information" },
	错误码: { "en": "Error code" },
	最近失败项: { "en": "Recent failures" },
	"失败项过多，仅展示前 5 条": { "en": "Too many failures. Only the first 5 are shown." },
	"更新 Agent": { "en": "Updated Agents" },
	"待新建 Agent": { "en": "Agents pending creation" },
	"待更新 Agent": { "en": "Agents pending update" },
	"待新建 Skill": { "en": "Skills pending creation" },
	"待更新 Skill": { "en": "Skills pending update" },
	待新建绑定: { "en": "Bindings pending creation" },
	风险项: { "en": "Risk items" },
	"新建 Skill": { "en": "New Skills" },
	"更新 Skill": { "en": "Updated Skills" },
	新建绑定: { "en": "New Bindings" },
	跳过已有: { "en": "Skipped Existing" },
	跳过未变化: { "en": "Skipped Unchanged" },
	跳过用户修改: { "en": "Skipped User Modified" },
	一键初始化: { "en": "Initialize" },
	请联系管理员完成初始化: { "en": "Please contact an administrator to complete initialization" },
	"请联系管理员处理 AI 内置资源": { "en": "Please contact an administrator to handle AI built-in resources" },
	再次执行: { "en": "Run again" },
	"等待允许执行此 DolphinDB 脚本": { "en": "Waiting for permission to execute this DolphinDB script" },
	"AI模型可能会出错，因此请仔细检查输出内容。": { "en": "AI models may make mistakes, so double-check outputs." },
	"默认允许 Agent 在此会话执行脚本。AI 模型可能会出错。": { "en": "Allow Agent to execute scripts in this session by default. AI models may make mistakes." },
	不允许: { "en": "Deny" },
	允许且此会话默认允许: { "en": "Allow and remember for this session" },
	查看错误: { "en": "View Error" },
	查看文档内容: { "en": "View Document Content" },
	查看结果: { "en": "View Result" },
	表: { "en": "Table" },
	字段: { "en": "Fields" },
	样例: { "en": "Sample" },
	文档搜索: { "en": "Document Search" },
	匹配: { "en": "Matched" },
	条文档: { "en": "documents" },
	读取文档: { "en": "Read Document" },
	路径: { "en": "Path" },
	查看列表: { "en": "View List" },
	文件: { "en": "File" },
	查看内容: { "en": "View Content" },
	查看替换: { "en": "View Replacements" },
	查看搜索结果: { "en": "View Search Results" },
	任务: { "en": "Task" },
	查看任务: { "en": "View Tasks" },
	索引: { "en": "Index" },
	查看原内容: { "en": "View Original Content" },
	查看新内容: { "en": "View New Content" },
	查看描述: { "en": "View Description" },
	查看技能指令: { "en": "View Skill Instructions" },
	查看文件目录: { "en": "View File Tree" },
	已读取: { "en": "Read" },
	"文件 {{index}}": { "en": "File {{index}}" },
	源文件: { "en": "Source File" },
	目标文件: { "en": "Target File" },
	查看参数: { "en": "View Parameters" },
	助手执行出现错误: { "en": "Assistant execution error" },
	重试: { "en": "Retry" },
	助手: { "en": "Assistant" },
	文本消息: { "en": "Text Message" },
	系统消息: { "en": "System Message" },
	工具结果: { "en": "Tool Result" },
	技能结果: { "en": "Skill Result" },
	工具错误: { "en": "Tool Error" },
	代理错误: { "en": "Agent Error" },
	列定义: { "en": "Column Definitions" },
	试查表: { "en": "Preview Table" },
	展示数据: { "en": "Show Data" },
	执行脚本: { "en": "Execute Script" },
	执行文件: { "en": "Execute File" },
	列出文件: { "en": "List Files" },
	创建文件: { "en": "Create File" },
	读取文件: { "en": "Read File" },
	搜索文件: { "en": "Search Files" },
	删除文件: { "en": "Delete File" },
	创建待办: { "en": "Create Step" },
	更新待办: { "en": "Update Step" },
	清除待办: { "en": "Clear Steps" },
	技能读取: { "en": "Read Skill" },
	技能文件搜索: { "en": "Search Skill Files" },
	技能文件读取: { "en": "Read Skill File" },
	复制技能文件: { "en": "Copy Skill File" },
	文档读取: { "en": "Read Document" },
	读取工作区状态: { "en": "Read Workspace State" },
	更新工作区状态: { "en": "Update Workspace State" },
	"助手正在调用工具...": { "en": "Assistant is calling a tool..." },
	"助手正在思考...": { "en": "Assistant is thinking..." },
	"请先在 AI 设置中创建并配置 Agent": { "en": "Please create and configure an Agent in AI Settings first" },
	"创建 AI 会话": { "en": "Create AI Session" },
	自动选择模型: { "en": "Auto-select model" },
	"DolphinDB 脚本执行审批": { "en": "DolphinDB Script Execution Approval" },
	需要审批: { "en": "Approval required" },
	自动执行: { "en": "Auto execute" },
	当前会话工作区: { "en": "Current Session Workspace" },
	公共: { "en": "Public" },
	公共记忆: { "en": "Public Memories" },
	置信度: { "en": "Confidence" },
	允许模型失败时自动切换: { "en": "Allow automatic model fallback" },
	"开启后，当前模型调用失败且尚未输出内容时，会按模型绑定优先级尝试下一个模型。": { "en": "When enabled, if the current model call fails before producing output, the next model will be tried by binding priority." },
	"模型调用失败，已自动切换到备用模型。": { "en": "The model call failed and was automatically switched to a fallback model." },
	"模型：{{from}} → {{to}}": { "en": "Model: {{from}} → {{to}}" },
	"状态码：{{status}}": { "en": "Status code: {{status}}" },
	"原因：{{reason}}": { "en": "Reason: {{reason}}" },
	"请在计算节点使用 AI 模式": { "en": "Use AI Mode on a compute node" },
	"集群模式下，控制节点和数据节点暂不支持 AI 模式，请切换到计算节点后使用。": { "en": "In cluster mode, AI Mode is not supported on controller or data nodes. Please switch to a compute node." },
	"集群模式下 AI 模式需要在计算节点使用。": { "en": "In cluster mode, AI Mode must be used on a compute node." },
	下载: { "en": "Download" },
	"已重置用户个人记忆，移除 {{count}} 条记忆_plural": { "en": "The user’s personal memories have been reset; {{count}} memories removed." },
	"{{count}} 个文件_plural": { "en": "{{count}} files" },
	"共 {{count}} 条_plural": { "en": "Total: {{count}} items" },
	"{{count}} / {{limit}} tokens": { "en": "{{count}} / {{limit}} tokens" },
	"{{count}} / {{limit}} tokens_plural": { "en": "{{count}} / {{limit}} tokens" },
	"连接成功，发现 {{count}} 个工具: {{names}}_plural": { "en": "Connection successful. Found {{count}} tools: {{names}}" },
	"(编辑模式下无法编辑代码内容，请切换到预览模式编辑)": { "en": "(In edit mode, code content cannot be edited; please switch to preview mode to make edits.)" },
	加载用户失败: { "en": "Failed to load user information." },
	"Server 地址格式不正确，请输入合法的 URL": { "en": "The server address format is incorrect. Please enter a valid URL." },
	"Server 地址必须以 http:// 或 https:// 开头": { "en": "The server address must start with http:// or https://." },
	状态列名: { "en": "Status column name" },
	启用生成更新: { "en": "Enable generation of updates" },
	无效状态数: { "en": "Number of invalid statuses" },
	"启用 Q Parser Session（需预先加载 Q Parser）": { "en": "Enable Q Parser Session (requires Q Parser loaded)" },
	"持久化 worker": { "en": "Persistent worker" },
	"选择脚本语言，如果选择 Q，将会启用 Q Parser Session（需预先加载 Q Parser）": { "en": "Select the script language; if Q is chosen, the Q Parser Session will be enabled (Q Parser must be pre-loaded)." },
	"默认 (不偏移)": { "en": "Default (no offset)" },
	"web 时区偏移": { "en": "Web timezone offset" },
	"在 web 上增加一个时区偏移选项，默认不偏移。对于数据库返回的时间数据，在展示时自动加上这个时区偏移": { "en": "An option for timezone offset is added on the web; by default, no offset is applied. For time data returned by the database, this timezone offset is automatically added when displayed." },
	"时区已重置为默认，下次执行代码时生效": { "en": "Timezone reset to default; will take effect on the next code execution" },
	"时区已切换为 {{timezone}}，下次执行代码时生效": { "en": "Timezone switched to {{timezone}}; will take effect on the next code execution" },
	正在执行: { "en": "Executing…" },
	"图片大小上限（字节，0 表示不限制）": { "en": "Image size limit (bytes, 0 means unlimited)" },
	支持图片输入: { "en": "Supports image input" },
	第三方: { "en": "Third-party" },
	"管理 MCP Server。每个 Server 可以提供一组外部工具。": { "en": "Manage MCP servers. Each server can provide a set of external tools." },
	技能禁用: { "en": "Skill disabled" },
	加载技能详情失败: { "en": "Failed to load skill details" },
	加载文件内容失败: { "en": "Failed to load file content" },
	"连接成功，发现 {{count}} 个工具": { "en": "Connected successfully. Found {{count}} tools." },
	模型禁用: { "en": "Model disabled" },
	"添加 Server": { "en": "Add Server" },
	未激活: { "en": "Inactive" },
	注册成功: { "en": "Registered successfully" },
	"DolphinDB 内置": { "en": "DolphinDB built-in" },
	"MCP Server 连接测试成功": { "en": "MCP server connection test succeeded" },
	"MCP Server 连接测试失败": { "en": "MCP server connection test failed" },
	"MCP Server 连接成功，但当前用户缺少 MCP_EXEC 权限": { "en": "The MCP server connected successfully, but the current user does not have MCP_EXEC permission" },
	"绑定后，Agent 可在对话推理时使用该知识库进行知识检索与问答。": { "en": "Once bound, the Agent can use this knowledge base for retrieval and question answering." },
	包含标题: { "en": "Include headings" },
	"保存全局 Rerank 配置成功": { "en": "Global rerank configuration saved" },
	"保存全局 Rerank 配置失败": { "en": "Failed to save global rerank configuration" },
	编辑知识库: { "en": "Edit knowledge base" },
	"测试 Agent（权限归属）": { "en": "Test Agent (usage attribution)" },
	查看完整正文: { "en": "View full content" },
	查看召回片段: { "en": "View retrieved chunks" },
	查看知识库列表: { "en": "View knowledge bases" },
	初始构建: { "en": "Initial build" },
	初始化中: { "en": "Initializing" },
	触发类型: { "en": "Trigger type" },
	触发索引构建失败: { "en": "Failed to start index build" },
	创建知识库: { "en": "Create knowledge base" },
	创建知识库失败: { "en": "Failed to create knowledge base" },
	等待中: { "en": "Pending" },
	等待重试: { "en": "Waiting to retry" },
	点击或将文件拖拽至此处上传: { "en": "Click or drag a file here to upload" },
	读取结果: { "en": "Read result" },
	读取知识片段: { "en": "Read knowledge chunk" },
	分块大小: { "en": "Chunk size" },
	"分块大小 (200~4000)": { "en": "Chunk size (200-4000)" },
	"分片校验与上传中...": { "en": "Validating and uploading parts..." },
	"复用当前索引配置（重新全量索引）": { "en": "Reuse current index configuration (full rebuild)" },
	更新知识库失败: { "en": "Failed to update knowledge base" },
	"共 {{count}} 个可用知识库": { "en": "{{count}} knowledge bases available" },
	"共读取 {{count}} 个片段": { "en": "Read {{count}} chunks" },
	"构建索引 Generation": { "en": "Build index generation" },
	构建新索引: { "en": "Build new index" },
	构建新索引失败: { "en": "Failed to build new index" },
	后置片段: { "en": "Following chunk" },
	"候选重排数量 (20~50)": { "en": "Rerank candidate count (20-50)" },
	"加载 Agent 绑定列表失败": { "en": "Failed to load Agent bindings" },
	加载后台任务列表失败: { "en": "Failed to load background jobs" },
	"加载全局 Rerank 配置失败": { "en": "Failed to load global rerank configuration" },
	加载索引版本列表失败: { "en": "Failed to load index generations" },
	加载文档列表失败: { "en": "Failed to load documents" },
	加载知识库绑定失败: { "en": "Failed to load knowledge base bindings" },
	加载知识库列表失败: { "en": "Failed to load knowledge bases" },
	检索: { "en": "Retrieve" },
	检索测试: { "en": "Test retrieval" },
	检索测试失败: { "en": "Retrieval test failed" },
	检索测试与相关性诊断: { "en": "Retrieval test and relevance diagnostics" },
	检索查询词: { "en": "Retrieval query" },
	检索词: { "en": "Query" },
	检索结果: { "en": "Retrieval result" },
	检索诊断: { "en": "Retrieval diagnostics" },
	阶段: { "en": "Stage" },
	解析中: { "en": "Parsing" },
	解析状态: { "en": "Parse status" },
	就绪: { "en": "Ready" },
	开始构建: { "en": "Start build" },
	开始上传: { "en": "Start upload" },
	块: { "en": "chunks" },
	"例如：产品手册、运维知识库": { "en": "For example: Product manuals or operations knowledge" },
	列出知识库: { "en": "List knowledge bases" },
	描述该知识库覆盖的范围和内容: { "en": "Describe the scope and content covered by this knowledge base" },
	"命中 {{count}} 条结果": { "en": "{{count}} results found" },
	目标片段: { "en": "Target chunk" },
	"内置 Embedding (granite)": { "en": "Built-in embedding (granite)" },
	配置变更: { "en": "Configuration change" },
	配置概要: { "en": "Configuration summary" },
	篇: { "en": "documents" },
	"启用全局 Rerank": { "en": "Enable global rerank" },
	"启用全局 Rerank 时必须选择模型配置": { "en": "Select a model configuration before enabling global rerank" },
	前置片段: { "en": "Preceding chunk" },
	请输入检索词: { "en": "Enter a retrieval query" },
	请输入知识库描述: { "en": "Enter a knowledge base description" },
	请输入知识库名称: { "en": "Enter a knowledge base name" },
	"请选择 Embedding 模型配置": { "en": "Select an embedding model configuration" },
	"请选择要上传的文档或 ZIP 压缩包": { "en": "Select a document or ZIP archive to upload" },
	"仅支持上传 PDF、DOCX、TXT、MD 或 ZIP 格式文件": { "en": "Only PDF, DOCX, TXT, MD, or ZIP files are supported" },
	"请选择一个活跃 Agent": { "en": "Select an active Agent" },
	请选择一个知识库: { "en": "Select a knowledge base" },
	取消任务失败: { "en": "Failed to cancel job" },
	取消中: { "en": "Cancelling" },
	"全局 Rerank": { "en": "Global rerank" },
	"全局 Rerank 重排配置": { "en": "Global rerank configuration" },
	"确定取消该任务？": { "en": "Cancel this job?" },
	"确定删除此知识库？": { "en": "Delete this knowledge base?" },
	"确定删除该文档？": { "en": "Delete this document?" },
	任务历史: { "en": "Job history" },
	融合候选数: { "en": "Fused candidates" },
	"删除后将发起后台清理任务，不可恢复。": { "en": "Deletion starts a background cleanup job and cannot be undone." },
	删除中: { "en": "Deleting" },
	上传失败: { "en": "Upload failed" },
	上传时间: { "en": "Upload time" },
	"上传完成，文档处理任务已在后台启动": { "en": "Upload completed and document processing has started" },
	上传文档: { "en": "Upload document" },
	"上传文档或 ZIP 导入": { "en": "Upload a document or import a ZIP archive" },
	手动重建: { "en": "Manual rebuild" },
	输入想要在知识库中搜索的自然语言或关键词: { "en": "Enter natural language or keywords to search the knowledge base" },
	"搜索知识库...": { "en": "Search knowledge bases..." },
	索引版本: { "en": "Index generations" },
	索引构建: { "en": "Index build" },
	索引清理: { "en": "Index cleanup" },
	未绑定: { "en": "Not bound" },
	未检索到匹配的相关片段: { "en": "No matching chunks were retrieved" },
	未应用: { "en": "Not applied" },
	未找到相关内容: { "en": "No relevant content found" },
	文本分词器: { "en": "Text parser" },
	文本候选数: { "en": "Text candidates" },
	文本索引应用: { "en": "Text index applied" },
	"文档 / Chunk": { "en": "Documents / Chunks" },
	文档导入: { "en": "Document import" },
	"文档导入、分块解析、索引构建和清理等后台异步任务。": { "en": "Background jobs for document import, parsing, index building, and cleanup." },
	文档管理: { "en": "Documents" },
	文档删除: { "en": "Document deletion" },
	向量候选数: { "en": "Vector candidates" },
	向量索引类型: { "en": "Vector index type" },
	向量索引应用: { "en": "Vector index applied" },
	向量与索引配置: { "en": "Vector and index configuration" },
	新建知识库: { "en": "New knowledge base" },
	"选择启用的 Chat 模型配置": { "en": "Select an enabled chat model configuration" },
	"选择启用的 Embedding 模型配置": { "en": "Select an enabled embedding model configuration" },
	已触发任务重试: { "en": "Job retry started" },
	"已触发新索引 Generation 构建任务": { "en": "New index generation build started" },
	"已禁用，使用多路召回 RRF 融合结果": { "en": "Disabled; retrieval uses RRF fusion" },
	"已启用，知识库检索将对候选 chunk 进行二次重排": { "en": "Enabled; retrieved chunks will be reranked" },
	已请求取消任务: { "en": "Job cancellation requested" },
	已取消: { "en": "Cancelled" },
	已提交删除任务: { "en": "Deletion job submitted" },
	已应用: { "en": "Applied" },
	"英文 (english)": { "en": "English" },
	英文词干提取: { "en": "English stemming" },
	英文统一小写: { "en": "Lowercase English text" },
	"暂无活跃 Agent，无法执行检索测试": { "en": "No active Agent is available for retrieval testing" },
	"暂无可用知识库，请先在「知识库管理」中创建": { "en": "No knowledge bases are available. Create one in Knowledge Base Management first." },
	暂无任务: { "en": "No jobs" },
	暂无索引版本: { "en": "No index generations" },
	暂无文档: { "en": "No documents" },
	暂无知识库: { "en": "No knowledge bases" },
	"暂无知识库，请先创建": { "en": "No knowledge bases. Create one first." },
	"召回 {{count}} 条相关片段": { "en": "Retrieved {{count}} relevant chunks" },
	召回结果: { "en": "Retrieved results" },
	"支持单文件上传（PDF、DOCX、TXT、MD，最大 100MB）或 ZIP 压缩包批量导入（ZIP 内所有文件必须在同一层，最大 100MB）。": { "en": "Upload one PDF, DOCX, TXT, or MD file up to 100 MB, or import a flat ZIP archive up to 100 MB." },
	"支持上传单个 PDF、DOCX、TXT、MD 文档，或打包为单层 ZIP 批量导入。": { "en": "Upload a PDF, DOCX, TXT, or MD document, or import multiple files in a flat ZIP archive." },
	知识检索: { "en": "Knowledge retrieval" },
	附件检索: { "en": "Attachment retrieval" },
	知识库: { "en": "Knowledge base" },
	知识库绑定: { "en": "Knowledge base bindings" },
	"知识库创建成功，正在后台初始化索引": { "en": "Knowledge base created; the index is initializing in the background" },
	"知识库的物理索引版本（Generation）。修改参数或重建时会生成新版本并异步激活。": { "en": "Physical index generations for this knowledge base. Configuration changes and rebuilds create and activate a new generation asynchronously." },
	知识库管理: { "en": "Knowledge Base Management" },
	知识库删除: { "en": "Knowledge base deletion" },
	"Flat (精确搜索)": { "en": "Flat (exact search)" },
	"HNSW (近似图索引)": { "en": "HNSW (approximate graph index)" },
	"中文 (chinese)": { "en": "Chinese" },
	中文全模式分词: { "en": "Chinese full-mode tokenization" },
	"中英混合 (mixed)": { "en": "Mixed Chinese and English" },
	"重叠字符数不能超过最大分块字符数的 25%": { "en": "Chunk overlap cannot exceed 25% of the maximum chunk size" },
	重叠字数: { "en": "Overlap characters" },
	"重叠字数 (≤25%)": { "en": "Overlap characters (≤25%)" },
	重建索引: { "en": "Rebuild index" },
	重试任务: { "en": "Retry job" },
	重试任务失败: { "en": "Failed to retry job" },
	"自定义 Embedding 配置": { "en": "Custom embedding configuration" },
	自定义新索引配置: { "en": "Use a custom index configuration" },
	"Agent 绑定": { "en": "Agent bindings" },
	"Embedding 模型": { "en": "Embedding model" },
	"Rerank 评估模型": { "en": "Rerank evaluation model" },
	"Rerank 应用": { "en": "Rerank applied" },
	"Top K": { "en": "Top K" },
	"ZIP 批量导入": { "en": "ZIP batch import" },
	"ZIP 导入要求文件名以 .zip 结尾": { "en": "ZIP imports require a file name ending in .zip" },
	"文件大小必须在 1 字节到 100 MiB 之间": { "en": "File size must be between 1 byte and 100 MiB" },
	"AI 文件与知识库插件": { "en": "AI File and Knowledge Base Plugins" },
	"AI 对话附件和知识库功能需要加载以下两个插件。": { "en": "AI chat attachments and knowledge bases require the following two plugins." },
	相关操作失败: { "en": "The related operation failed" },
	检查插件状态失败: { "en": "Failed to check plugin status" },
	插件操作失败: { "en": "Plugin operation failed" },
	所需插件均已加载: { "en": "All required plugins are loaded" },
	当前插件加载情况: { "en": "Current plugin status" },
	"版本：{{version}}": { "en": "Version: {{version}}" },
	未加载: { "en": "Not loaded" },
	未知: { "en": "Unknown" },
	自动下载: { "en": "Automatic download" },
	下载并加载缺失插件: { "en": "Download and load missing plugins" },
	"如果无法自动下载插件，请": { "en": "If the plugins cannot be downloaded automatically," },
	查看手动安装指引: { "en": "View manual installation guide" },
	"插件 {{plugin}} 加载成功": { "en": "Plugin {{plugin}} loaded successfully" },
	所需插件已下载并加载: { "en": "The required plugins were downloaded and loaded" },
	"未加载：{{plugins}}": { "en": "Not loaded: {{plugins}}" },
	需要下载插件: { "en": "Plugins required" },
	源码: { "en": "Source Code" },
	无法加载图片预览: { "en": "Failed to load image preview" },
	当前显示文档解析提取的文本内容: { "en": "Currently showing text extracted from document parsing" },
	"该文件格式暂不支持直接预览，可下载后在本地查看": { "en": "This file format does not support preview yet. Please download to view locally." },
	附件已删除: { "en": "Attachment deleted" },
	删除附件失败: { "en": "Failed to delete attachment" },
	"确定删除该文件？": { "en": "Are you sure to delete this file?" },
	加载预算配置失败: { "en": "Failed to load budget configuration" },
	用量统计结束时间不能早于开始时间: { "en": "Usage statistics end time cannot be earlier than start time" },
	请选择模型: { "en": "Please select a model" },
	不能重复配置同一个模型: { "en": "Cannot configure the same model repeatedly" },
	预算配置已保存: { "en": "Budget configuration saved" },
	保存预算配置失败: { "en": "Failed to save budget configuration" },
	"Token 预算配置": { "en": "Token Budget Configuration" },
	"0 表示不限制；未配置模型预算时，该模型不单独限制。": { "en": "0 means no limit; when model budget is not configured, the model is not limited individually." },
	启用预算限制: { "en": "Enable budget limit" },
	"Agent 总 Token 上限": { "en": "Agent Total Token Limit" },
	用量统计开始时间: { "en": "Usage Statistics Start Time" },
	用量统计结束时间: { "en": "Usage Statistics End Time" },
	"模型 Token 上限": { "en": "Model Token Limit" },
	"0 表示不限制": { "en": "0 means no limit" },
	添加模型预算: { "en": "Add Model Budget" },
	"剩余 Token": { "en": "Remaining Tokens" },
	预算配置: { "en": "Budget Configuration" },
	"Token 预算": { "en": "Token Budget" },
	"版本 ID": { "en": "Generation ID" },
	"命中 {{count}} 条结果_plural": { "en": "Found {{count}} results" },
	"连接成功，发现 {{count}} 个工具_plural": { "en": "Connected successfully, discovered {{count}} tools" },
	"共 {{count}} 个可用知识库_plural": { "en": "Total {{count}} available knowledge bases" },
	"召回 {{count}} 条相关片段_plural": { "en": "Retrieved {{count}} relevant chunks" },
	读取成功: { "en": "Read successfully" },
	"共读取 {{count}} 个片段_plural": { "en": "Total {{count}} chunks read" },
	连接已断开: { "en": "Connection Disconnected" },
	"AI 专属 DolphinDB 连接已断开且重连失败，请刷新页面以恢复连接。": { "en": "The AI dedicated DolphinDB connection was disconnected and reconnection failed. Please refresh the page to restore the connection." },
	"DolphinDB 连接在执行期间中断，本次执行失败，但连接已自动恢复。": { "en": "The DolphinDB connection was interrupted during execution. This execution failed, but the connection has been restored automatically." },
	"DolphinDB 连接已恢复，但本次脚本可能只执行了部分内容。请停止调用任何工具，直接请用户调整任务并检查代码后重新发起；无需刷新页面。": { "en": "The DolphinDB connection has been restored, but the script may have been only partially executed. Stop calling all tools and ask the user to adjust the task, inspect the code, and start again. The page does not need to be refreshed." },
	"DolphinDB 连接已断开，工具执行已终止。": { "en": "DolphinDB connection is disconnected, tool execution has been terminated." },
	"DolphinDB 连接已断开，已停止工具循环。请直接向用户输出回复。": { "en": "DolphinDB connection is disconnected, tool loop has been stopped. Please reply directly to the user." },
	"DolphinDB 连接已断开，执行失败。": { "en": "DolphinDB connection is disconnected, execution failed." },
	"DolphinDB 连接已断开，无法继续执行脚本。请停止调用任何工具，直接向用户总结已有信息或说明连接断开需要刷新页面。": { "en": "DolphinDB connection is disconnected and script execution cannot continue. Please stop calling any tools and summarize existing information directly to the user or explain that the connection is lost and the page needs to be refreshed." },
	"DolphinDB 连接已断开": { "en": "DolphinDB connection is disconnected" },
	"DolphinDB 连接已断开，请刷新页面。": { "en": "DolphinDB connection is disconnected, please refresh the page." },
	"DolphinDB 连接已断开，重连失败。": { "en": "DolphinDB connection disconnected, reconnection failed." },
	启用个人记忆: { "en": "Enable personal memory" },
	"选择需要管理的 Agent": { "en": "Select an Agent to manage" },
	"请输入公共记忆内容，保存后将注入该 Agent 下所有用户的后续对话上下文...": { "en": "Enter public memory content. Once saved, it will be injected into subsequent conversation context for all users under this Agent..." },
	清空公共记忆: { "en": "Clear public memory" },
	撤销修改: { "en": "Revert changes" },
	"当前模型已被知识库「全局重排」引用，请先在知识库管理中关闭重排或切换其他模型。": { "en": "This model is currently referenced by Knowledge Base Global Rerank. Please disable rerank or switch to another model in Knowledge Base Management first." },
	"当前模型已被知识库「全局向量」引用，请先在知识库管理中解除关联或切换其他模型。": { "en": "This model is currently referenced by Knowledge Base Global Embedding. Please unbind it or switch to another model in Knowledge Base Management first." },
	"当前模型仍被 {{count}} 个 Agent（如「{{name}}」）绑定，请先在 Agent 管理中解绑或切换模型。": { "en": "This model is still bound to {{count}} Agent (such as \"{{name}}\"). Please unbind or switch models in Agent Management first." },
	"当前模型仍被 {{count}} 个 Agent（如「{{name}}」）绑定，请先在 Agent 管理中解绑或切换模型。_plural": { "en": "This model is still bound to {{count}} Agents (such as \"{{name}}\"). Please unbind or switch models in Agent Management first." },
	"当前模型仍被 {{count}} 个 Agent 绑定，请先在 Agent 管理中解绑或切换模型。": { "en": "This model is still bound to {{count}} Agent. Please unbind or switch models in Agent Management first." },
	"当前模型仍被 {{count}} 个 Agent 绑定，请先在 Agent 管理中解绑或切换模型。_plural": { "en": "This model is still bound to {{count}} Agents. Please unbind or switch models in Agent Management first." },
	"当前模型已被 Agent「{{name}}」绑定，请先在 Agent 管理中解绑或切换模型。": { "en": "This model is bound to Agent \"{{name}}\". Please unbind or switch models in Agent Management first." },
	"当前模型已被 Agent 绑定，请先在 Agent 管理中解绑或切换模型。": { "en": "This model is bound to an Agent. Please unbind or switch models in Agent Management first." },
	"当前技能仍被 {{count}} 个 Agent（如「{{name}}」）绑定，请先在 Agent 管理中解绑。": { "en": "This skill is still bound to {{count}} Agent (such as \"{{name}}\"). Please unbind it in Agent Management first." },
	"当前技能仍被 {{count}} 个 Agent（如「{{name}}」）绑定，请先在 Agent 管理中解绑。_plural": { "en": "This skill is still bound to {{count}} Agents (such as \"{{name}}\"). Please unbind it in Agent Management first." },
	"当前技能仍被 {{count}} 个 Agent 绑定，请先在 Agent 管理中解绑。": { "en": "This skill is still bound to {{count}} Agent. Please unbind it in Agent Management first." },
	"当前技能仍被 {{count}} 个 Agent 绑定，请先在 Agent 管理中解绑。_plural": { "en": "This skill is still bound to {{count}} Agents. Please unbind it in Agent Management first." },
	"当前技能已被 Agent「{{name}}」绑定，请先在 Agent 管理中解绑。": { "en": "This skill is bound to Agent \"{{name}}\". Please unbind it in Agent Management first." },
	"当前技能已被 Agent 绑定，请先在 Agent 管理中解绑。": { "en": "This skill is bound to an Agent. Please unbind it in Agent Management first." },
	"当前模型已被 Agent「{{name}}」的记忆配置引用，请先在记忆管理中修改配置。": { "en": "This model is referenced by the memory configuration of Agent \"{{name}}\". Please update the configuration in Memory Management first." },
	"当前模型已被 Agent 记忆配置引用，请先在记忆管理中修改配置。": { "en": "This model is referenced by Agent memory configuration. Please update the configuration in Memory Management first." },
	"当前模型已被 Agent「{{name}}」引用，请先在 Agent 管理中解绑或切换模型。": { "en": "This model is referenced by Agent \"{{name}}\". Please unbind or switch models in Agent Management first." },
	"当前模型已被关联的 Agent 引用，请先在 Agent 管理中解绑或切换模型。": { "en": "This model is referenced by an associated Agent. Please unbind or switch models in Agent Management first." },
	"当前技能已被 Agent「{{name}}」引用，请先在 Agent 管理中解绑。": { "en": "This skill is referenced by Agent \"{{name}}\". Please unbind it in Agent Management first." },
	"当前技能已被关联的 Agent 引用，请先在 Agent 管理中解绑。": { "en": "This skill is referenced by an associated Agent. Please unbind it in Agent Management first." },
	"Agent「{{name}}」": { "en": "Agent \"{{name}}\"" },
	"相关 Agent": { "en": "Related Agent" },
	"当前模型已被知识库全局重排引用，请先在知识库管理中关闭重排或切换其他模型。": { "en": "This model is currently referenced by Knowledge Base Global Rerank. Please disable rerank or switch to another model in Knowledge Base Management first." },
	"当前模型已被知识库全局向量引用，请先在知识库管理中解除关联或切换其他模型。": { "en": "This model is currently referenced by Knowledge Base Global Embedding. Please unbind it or switch to another model in Knowledge Base Management first." },
	"当前模型仍被 {{count}} 个 Agent（如 {{name}}）绑定，请先在 Agent 管理中解绑或切换模型。": { "en": "This model is still bound to {{count}} Agent (such as {{name}}). Please unbind or switch models in Agent Management first." },
	"当前模型仍被 {{count}} 个 Agent（如 {{name}}）绑定，请先在 Agent 管理中解绑或切换模型。_plural": { "en": "This model is still bound to {{count}} Agents (such as {{name}}). Please unbind or switch models in Agent Management first." },
	"当前模型已被 Agent {{name}} 绑定，请先在 Agent 管理中解绑或切换模型。": { "en": "This model is bound to Agent {{name}}. Please unbind or switch models in Agent Management first." },
	"当前技能仍被 {{count}} 个 Agent（如 {{name}}）绑定，请先在 Agent 管理中解绑。": { "en": "This skill is still bound to {{count}} Agent (such as {{name}}). Please unbind it in Agent Management first." },
	"当前技能仍被 {{count}} 个 Agent（如 {{name}}）绑定，请先在 Agent 管理中解绑。_plural": { "en": "This skill is still bound to {{count}} Agents (such as {{name}}). Please unbind it in Agent Management first." },
	"当前技能已被 Agent {{name}} 绑定，请先在 Agent 管理中解绑。": { "en": "This skill is bound to Agent {{name}}. Please unbind it in Agent Management first." },
	"当前模型已被 Agent {{name}} 的记忆配置引用，请先在记忆管理中修改配置。": { "en": "This model is referenced by the memory configuration of Agent {{name}}. Please update the configuration in Memory Management first." },
	"当前模型已被 Agent {{name}} 引用，请先在 Agent 管理中解绑或切换模型。": { "en": "This model is referenced by Agent {{name}}. Please unbind or switch models in Agent Management first." },
	"当前技能已被 Agent {{name}} 引用，请先在 Agent 管理中解绑。": { "en": "This skill is referenced by Agent {{name}}. Please unbind it in Agent Management first." },
	"Agent {{name}}": { "en": "Agent {{name}}" },
	"当前模型已被知识库“全局重排”引用，请先在知识库管理中关闭重排或切换其他模型。": { "en": "This model is currently referenced by Knowledge Base \"Global Rerank\". Please disable rerank or switch to another model in Knowledge Base Management first." },
	"当前模型已被知识库“全局向量”引用，请先在知识库管理中解除关联或切换其他模型。": { "en": "This model is currently referenced by Knowledge Base \"Global Embedding\". Please unbind it or switch to another model in Knowledge Base Management first." },
	"当前模型仍被 {{count}} 个 Agent（如“{{name}}”）绑定，请先在 Agent 管理中解绑或切换模型。": { "en": "This model is still bound to {{count}} Agent (such as \"{{name}}\"). Please unbind or switch models in Agent Management first." },
	"当前模型仍被 {{count}} 个 Agent（如“{{name}}”）绑定，请先在 Agent 管理中解绑或切换模型。_plural": { "en": "This model is still bound to {{count}} Agents (such as \"{{name}}\"). Please unbind or switch models in Agent Management first." },
	"当前模型已被 Agent“{{name}}”绑定，请先在 Agent 管理中解绑或切换模型。": { "en": "This model is bound to Agent \"{{name}}\". Please unbind or switch models in Agent Management first." },
	"当前技能仍被 {{count}} 个 Agent（如“{{name}}”）绑定，请先在 Agent 管理中解绑。": { "en": "This skill is still bound to {{count}} Agent (such as \"{{name}}\"). Please unbind it in Agent Management first." },
	"当前技能仍被 {{count}} 个 Agent（如“{{name}}”）绑定，请先在 Agent 管理中解绑。_plural": { "en": "This skill is still bound to {{count}} Agents (such as \"{{name}}\"). Please unbind it in Agent Management first." },
	"当前技能已被 Agent“{{name}}”绑定，请先在 Agent 管理中解绑。": { "en": "This skill is bound to Agent \"{{name}}\". Please unbind it in Agent Management first." },
	"当前模型已被 Agent“{{name}}”的记忆配置引用，请先在记忆管理中修改配置。": { "en": "This model is referenced by the memory configuration of Agent \"{{name}}\". Please update the configuration in Memory Management first." },
	"当前模型已被 Agent“{{name}}”引用，请先在 Agent 管理中解绑或切换模型。": { "en": "This model is referenced by Agent \"{{name}}\". Please unbind or switch models in Agent Management first." },
	"当前技能已被 Agent“{{name}}”引用，请先在 Agent 管理中解绑。": { "en": "This skill is referenced by Agent \"{{name}}\". Please unbind it in Agent Management first." },
	"Agent“{{name}}”": { "en": "Agent \"{{name}}\"" },
	检索发生降级: { "en": "Retrieval degraded" },
	总耗时: { "en": "Total latency" },
	"Rerank 耗时": { "en": "Rerank latency" },
	已降级: { "en": "Degraded" },
	降级原因: { "en": "Degradation reason" },
	额外模型权限: { "en": "Additional Model Permissions" },
	用户组额外模型权限: { "en": "Group Additional Model Permissions" },
	"知识库的历史索引版本记录。修改参数或重建索引时会自动构建新版本并在就绪后激活。": { "en": "Historical index versions of the knowledge base. Modifying parameters or rebuilding will automatically build a new version and activate it once ready." },
	字符: { "en": "chars" },
	开始重建: { "en": "Start Rebuild" },
	复用当前配置重建索引: { "en": "Rebuild index using current configuration" },
	修改配置并重建索引: { "en": "Modify configuration and rebuild index" },
	"分块字符数 (200~4000)": { "en": "Chunk Size in Chars (200~4000)" },
	"重叠字符数 (≤25%)": { "en": "Overlap Chars (≤25%)" },
	英文忽略大小写: { "en": "Case-insensitive English" },
	部分失败: { "en": "Partial Failure" },
	"成功 {{success}}/{{total}}": { "en": "{{success}}/{{total}} succeeded" },
	"插件“{{plugin}}”尚未下载，请先点击下方的“下载并加载缺失插件”，或参考手动安装指引。": { "en": "Plugin \"{{plugin}}\" is not downloaded yet. Please click \"Download and load missing plugins\" below or refer to manual installation guide." },
	"插件“{{plugin}}”加载成功": { "en": "Plugin \"{{plugin}}\" loaded successfully" },
	插件加载失败: { "en": "Failed to load plugin" },
	"启用 Rerank 时必须选择评估模型": { "en": "An evaluation model must be selected when Rerank is enabled" },
	"初步召回候选数必须在 {{min}} 到 50 之间": { "en": "Candidate count must be between {{min}} and 50" },
	"检索与 Rerank 配置": { "en": "Retrieval & Rerank Configuration" },
	"最终返回条目 (Top K: 1~20)": { "en": "Returned Chunks (Top K: 1~20)" },
	"初步召回候选数 ({{min}}~50)": { "en": "Candidate Count ({{min}}~50)" },
	"启用 Rerank": { "en": "Enable Rerank" },
	"已启用，检索将对融合候选进行二次重排": { "en": "Enabled; retrieval will perform secondary reranking on fused candidates" },
	"选择启用的 Chat 评估模型": { "en": "Select an active Chat evaluation model" },
	知识库设置: { "en": "Knowledge Base Settings" },
	"启用 Rerank 时请选择评估模型": { "en": "Please select an evaluation model when Rerank is enabled" },
	"以下检索设置仅对本次测试生效，不会修改知识库本身的配置": { "en": "The following retrieval settings apply to this test only and will not modify the knowledge base configuration" },
	恢复知识库设置: { "en": "Restore KB Settings" },
	"当前检索启用 Rerank": { "en": "Enable Rerank for Current Retrieval" },
	"实际 Top K": { "en": "Actual Top K" },
	实际候选窗口: { "en": "Actual Candidate Count" },
	本次检索设置: { "en": "Current Retrieval Settings" },
	检索设置: { "en": "Retrieval Settings" },
	"召回及融合候选窗口，推荐 30": { "en": "Recall & fusion candidate window, recommended: 30" },
	"最终返回 Agent 的片段上限，推荐 8": { "en": "Maximum chunks returned to Agent, recommended: 8" },
	"初步检索出的候选片段数，供重排筛选，推荐 30": { "en": "Number of preliminary candidate chunks for reranking and filtering; recommended: 30" },
	"最终返回给 Agent 的片段数，推荐 8": { "en": "Number of chunks returned to the Agent; recommended: 8" },
	"此模型关联不同提供商：{{providers}}（配置：{{configs}}）": { "en": "This model is associated with multiple providers: {{providers}} (configs: {{configs}})" },
	"Rerank 由 LLM 执行且对响应速度敏感，建议选用低延迟模型，如需进一步提速亦可关闭深度思考。Rerank 与 Agent 的任务特性不同，建议配置为不同的模型。": {
		"en": "Rerank is executed by LLM and sensitive to response latency. It is recommended to choose a low-latency model, and deep thinking can also be disabled for further speedup. Because Rerank and Agent have different task characteristics, it is recommended to configure them with different models.",
		"ja": "RerankはLLMによって実行され、レイテンシに敏感です。低遅延モデルの選択を推奨します。さらに高速化が必要な場合はディープシンキングを無効化することも可能です。RerankとAgentはタスク特性が異なるため、別々のモデルを設定することを推奨します。",
		"ko": "Rerank는 LLM으로 실행되며 지연 시간에 민감합니다. 지연 시간이 짧은 모델을 선택하는 것이 좋으며, 추가적인 속도 향상이 필요한 경우 딥 씽킹을 비활성화할 수도 있습니다. Rerank와 Agent는 작업 특성이 다르므로 서로 다른 모델을 구성하는 것을 권장합니다."
	},
	"用量限制在服务商返回 Token 用量时可用。": { "en": "Usage limits are available when the provider returns token usage." },
	"用量消耗在服务商返回 Token 用量时可用。": { "en": "Usage consumption is available when the provider returns token usage." },
	"用量统计在服务商返回 Token 用量时可用。": { "en": "Usage statistics are available when the provider returns token usage." }
};

//#endregion
//#region i18n/index.ts
const i18n = new I18N(dict_default);
if (!I18N.LANGUAGE_REGEXP.test(Intl.DateTimeFormat().resolvedOptions().locale.slice(0, 2))) i18n.language = i18n$1.language = i18n$2.language = "en";
const { t, language } = i18n;

//#endregion
//#region node_modules/.pnpm/clsx@2.1.1/node_modules/clsx/dist/clsx.mjs
function r(e) {
	var t, f, n = "";
	if ("string" == typeof e || "number" == typeof e) n += e;
	else if ("object" == typeof e) if (Array.isArray(e)) {
		var o = e.length;
		for (t = 0; t < o; t++) e[t] && (f = r(e[t])) && (n && (n += " "), n += f);
	} else for (f in e) e[f] && (n && (n += " "), n += f);
	return n;
}
function clsx() {
	for (var e, t, f = 0, n = "", o = arguments.length; f < o; f++) (e = arguments[f]) && (t = r(e)) && (n && (n += " "), n += t);
	return n;
}

//#endregion
//#region node_modules/.pnpm/@ant-design+fast-color@3.0.1/node_modules/@ant-design/fast-color/es/presetColors.js
var presetColors_default = {
	aliceblue: "9ehhb",
	antiquewhite: "9sgk7",
	aqua: "1ekf",
	aquamarine: "4zsno",
	azure: "9eiv3",
	beige: "9lhp8",
	bisque: "9zg04",
	black: "0",
	blanchedalmond: "9zhe5",
	blue: "73",
	blueviolet: "5e31e",
	brown: "6g016",
	burlywood: "8ouiv",
	cadetblue: "3qba8",
	chartreuse: "4zshs",
	chocolate: "87k0u",
	coral: "9yvyo",
	cornflowerblue: "3xael",
	cornsilk: "9zjz0",
	crimson: "8l4xo",
	cyan: "1ekf",
	darkblue: "3v",
	darkcyan: "rkb",
	darkgoldenrod: "776yz",
	darkgray: "6mbhl",
	darkgreen: "jr4",
	darkgrey: "6mbhl",
	darkkhaki: "7ehkb",
	darkmagenta: "5f91n",
	darkolivegreen: "3bzfz",
	darkorange: "9yygw",
	darkorchid: "5z6x8",
	darkred: "5f8xs",
	darksalmon: "9441m",
	darkseagreen: "5lwgf",
	darkslateblue: "2th1n",
	darkslategray: "1ugcv",
	darkslategrey: "1ugcv",
	darkturquoise: "14up",
	darkviolet: "5rw7n",
	deeppink: "9yavn",
	deepskyblue: "11xb",
	dimgray: "442g9",
	dimgrey: "442g9",
	dodgerblue: "16xof",
	firebrick: "6y7tu",
	floralwhite: "9zkds",
	forestgreen: "1cisi",
	fuchsia: "9y70f",
	gainsboro: "8m8kc",
	ghostwhite: "9pq0v",
	goldenrod: "8j4f4",
	gold: "9zda8",
	gray: "50i2o",
	green: "pa8",
	greenyellow: "6senj",
	grey: "50i2o",
	honeydew: "9eiuo",
	hotpink: "9yrp0",
	indianred: "80gnw",
	indigo: "2xcoy",
	ivory: "9zldc",
	khaki: "9edu4",
	lavenderblush: "9ziet",
	lavender: "90c8q",
	lawngreen: "4vk74",
	lemonchiffon: "9zkct",
	lightblue: "6s73a",
	lightcoral: "9dtog",
	lightcyan: "8s1rz",
	lightgoldenrodyellow: "9sjiq",
	lightgray: "89jo3",
	lightgreen: "5nkwg",
	lightgrey: "89jo3",
	lightpink: "9z6wx",
	lightsalmon: "9z2ii",
	lightseagreen: "19xgq",
	lightskyblue: "5arju",
	lightslategray: "4nwk9",
	lightslategrey: "4nwk9",
	lightsteelblue: "6wau6",
	lightyellow: "9zlcw",
	lime: "1edc",
	limegreen: "1zcxe",
	linen: "9shk6",
	magenta: "9y70f",
	maroon: "4zsow",
	mediumaquamarine: "40eju",
	mediumblue: "5p",
	mediumorchid: "79qkz",
	mediumpurple: "5r3rv",
	mediumseagreen: "2d9ip",
	mediumslateblue: "4tcku",
	mediumspringgreen: "1di2",
	mediumturquoise: "2uabw",
	mediumvioletred: "7rn9h",
	midnightblue: "z980",
	mintcream: "9ljp6",
	mistyrose: "9zg0x",
	moccasin: "9zfzp",
	navajowhite: "9zest",
	navy: "3k",
	oldlace: "9wq92",
	olive: "50hz4",
	olivedrab: "472ub",
	orange: "9z3eo",
	orangered: "9ykg0",
	orchid: "8iu3a",
	palegoldenrod: "9bl4a",
	palegreen: "5yw0o",
	paleturquoise: "6v4ku",
	palevioletred: "8k8lv",
	papayawhip: "9zi6t",
	peachpuff: "9ze0p",
	peru: "80oqn",
	pink: "9z8wb",
	plum: "8nba5",
	powderblue: "6wgdi",
	purple: "4zssg",
	rebeccapurple: "3zk49",
	red: "9y6tc",
	rosybrown: "7cv4f",
	royalblue: "2jvtt",
	saddlebrown: "5fmkz",
	salmon: "9rvci",
	sandybrown: "9jn1c",
	seagreen: "1tdnb",
	seashell: "9zje6",
	sienna: "6973h",
	silver: "7ir40",
	skyblue: "5arjf",
	slateblue: "45e4t",
	slategray: "4e100",
	slategrey: "4e100",
	snow: "9zke2",
	springgreen: "1egv",
	steelblue: "2r1kk",
	tan: "87yx8",
	teal: "pds",
	thistle: "8ggk8",
	tomato: "9yqfb",
	turquoise: "2j4r4",
	violet: "9b10u",
	wheat: "9ld4j",
	white: "9zldr",
	whitesmoke: "9lhpx",
	yellow: "9zl6o",
	yellowgreen: "61fzm"
};

//#endregion
//#region node_modules/.pnpm/@ant-design+fast-color@3.0.1/node_modules/@ant-design/fast-color/es/FastColor.js
const round = Math.round;
function splitColorStr(str, parseNum) {
	const match = str.replace(/^[^(]*\((.*)/, "$1").replace(/\).*/, "").match(/\d*\.?\d+%?/g) || [];
	const numList = match.map((item) => parseFloat(item));
	for (let i = 0; i < 3; i += 1) numList[i] = parseNum(numList[i] || 0, match[i] || "", i);
	if (match[3]) numList[3] = match[3].includes("%") ? numList[3] / 100 : numList[3];
	else numList[3] = 1;
	return numList;
}
const parseHSVorHSL = (num, _, index) => index === 0 ? num : num / 100;
function limitRange(value, max) {
	const mergedMax = max || 255;
	if (value > mergedMax) return mergedMax;
	if (value < 0) return 0;
	return value;
}
var FastColor = class FastColor {
	isValid = true;
	r = 0;
	g = 0;
	b = 0;
	a = 1;
	_h;
	_hsl_s;
	_hsv_s;
	_l;
	_v;
	_max;
	_min;
	_brightness;
	constructor(input) {
		function matchFormat(str) {
			return str[0] in input && str[1] in input && str[2] in input;
		}
		if (!input) {} else if (typeof input === "string") {
			const trimStr = input.trim();
			function matchPrefix(prefix) {
				return trimStr.startsWith(prefix);
			}
			if (/^#?[A-F\d]{3,8}$/i.test(trimStr)) this.fromHexString(trimStr);
			else if (matchPrefix("rgb")) this.fromRgbString(trimStr);
			else if (matchPrefix("hsl")) this.fromHslString(trimStr);
			else if (matchPrefix("hsv") || matchPrefix("hsb")) this.fromHsvString(trimStr);
			else {
				const presetColor = presetColors_default[trimStr.toLowerCase()];
				if (presetColor) this.fromHexString(parseInt(presetColor, 36).toString(16).padStart(6, "0"));
			}
		} else if (input instanceof FastColor) {
			this.r = input.r;
			this.g = input.g;
			this.b = input.b;
			this.a = input.a;
			this._h = input._h;
			this._hsl_s = input._hsl_s;
			this._hsv_s = input._hsv_s;
			this._l = input._l;
			this._v = input._v;
		} else if (matchFormat("rgb")) {
			this.r = limitRange(input.r);
			this.g = limitRange(input.g);
			this.b = limitRange(input.b);
			this.a = typeof input.a === "number" ? limitRange(input.a, 1) : 1;
		} else if (matchFormat("hsl")) this.fromHsl(input);
		else if (matchFormat("hsv")) this.fromHsv(input);
		else throw new Error("@ant-design/fast-color: unsupported input " + JSON.stringify(input));
	}
	setR(value) {
		return this._sc("r", value);
	}
	setG(value) {
		return this._sc("g", value);
	}
	setB(value) {
		return this._sc("b", value);
	}
	setA(value) {
		return this._sc("a", value, 1);
	}
	setHue(value) {
		const hsv = this.toHsv();
		hsv.h = value;
		return this._c(hsv);
	}
	getLuminance() {
		function adjustGamma(raw) {
			const val = raw / 255;
			return val <= .03928 ? val / 12.92 : Math.pow((val + .055) / 1.055, 2.4);
		}
		const R = adjustGamma(this.r);
		const G = adjustGamma(this.g);
		const B = adjustGamma(this.b);
		return .2126 * R + .7152 * G + .0722 * B;
	}
	getHue() {
		if (typeof this._h === "undefined") {
			const delta = this.getMax() - this.getMin();
			if (delta === 0) this._h = 0;
			else this._h = round(60 * (this.r === this.getMax() ? (this.g - this.b) / delta + (this.g < this.b ? 6 : 0) : this.g === this.getMax() ? (this.b - this.r) / delta + 2 : (this.r - this.g) / delta + 4));
		}
		return this._h;
	}
	getSaturation() {
		return this.getHSVSaturation();
	}
	getHSVSaturation() {
		if (typeof this._hsv_s === "undefined") {
			const delta = this.getMax() - this.getMin();
			if (delta === 0) this._hsv_s = 0;
			else this._hsv_s = delta / this.getMax();
		}
		return this._hsv_s;
	}
	getHSLSaturation() {
		if (typeof this._hsl_s === "undefined") {
			const delta = this.getMax() - this.getMin();
			if (delta === 0) this._hsl_s = 0;
			else {
				const l = this.getLightness();
				this._hsl_s = delta / 255 / (1 - Math.abs(2 * l - 1));
			}
		}
		return this._hsl_s;
	}
	getLightness() {
		if (typeof this._l === "undefined") this._l = (this.getMax() + this.getMin()) / 510;
		return this._l;
	}
	getValue() {
		if (typeof this._v === "undefined") this._v = this.getMax() / 255;
		return this._v;
	}
	getBrightness() {
		if (typeof this._brightness === "undefined") this._brightness = (this.r * 299 + this.g * 587 + this.b * 114) / 1e3;
		return this._brightness;
	}
	darken(amount = 10) {
		const h = this.getHue();
		const s = this.getSaturation();
		let l = this.getLightness() - amount / 100;
		if (l < 0) l = 0;
		return this._c({
			h,
			s,
			l,
			a: this.a
		});
	}
	lighten(amount = 10) {
		const h = this.getHue();
		const s = this.getSaturation();
		let l = this.getLightness() + amount / 100;
		if (l > 1) l = 1;
		return this._c({
			h,
			s,
			l,
			a: this.a
		});
	}
	mix(input, amount = 50) {
		const color = this._c(input);
		const p = amount / 100;
		const calc = (key) => (color[key] - this[key]) * p + this[key];
		const rgba = {
			r: round(calc("r")),
			g: round(calc("g")),
			b: round(calc("b")),
			a: round(calc("a") * 100) / 100
		};
		return this._c(rgba);
	}
	tint(amount = 10) {
		return this.mix({
			r: 255,
			g: 255,
			b: 255,
			a: 1
		}, amount);
	}
	shade(amount = 10) {
		return this.mix({
			r: 0,
			g: 0,
			b: 0,
			a: 1
		}, amount);
	}
	onBackground(background) {
		const bg = this._c(background);
		const alpha = this.a + bg.a * (1 - this.a);
		const calc = (key) => {
			return round((this[key] * this.a + bg[key] * bg.a * (1 - this.a)) / alpha);
		};
		return this._c({
			r: calc("r"),
			g: calc("g"),
			b: calc("b"),
			a: alpha
		});
	}
	isDark() {
		return this.getBrightness() < 128;
	}
	isLight() {
		return this.getBrightness() >= 128;
	}
	equals(other) {
		return this.r === other.r && this.g === other.g && this.b === other.b && this.a === other.a;
	}
	clone() {
		return this._c(this);
	}
	toHexString() {
		let hex = "#";
		const rHex = (this.r || 0).toString(16);
		hex += rHex.length === 2 ? rHex : "0" + rHex;
		const gHex = (this.g || 0).toString(16);
		hex += gHex.length === 2 ? gHex : "0" + gHex;
		const bHex = (this.b || 0).toString(16);
		hex += bHex.length === 2 ? bHex : "0" + bHex;
		if (typeof this.a === "number" && this.a >= 0 && this.a < 1) {
			const aHex = round(this.a * 255).toString(16);
			hex += aHex.length === 2 ? aHex : "0" + aHex;
		}
		return hex;
	}
	toHsl() {
		return {
			h: this.getHue(),
			s: this.getHSLSaturation(),
			l: this.getLightness(),
			a: this.a
		};
	}
	toHslString() {
		const h = this.getHue();
		const s = round(this.getHSLSaturation() * 100);
		const l = round(this.getLightness() * 100);
		return this.a !== 1 ? `hsla(${h},${s}%,${l}%,${this.a})` : `hsl(${h},${s}%,${l}%)`;
	}
	toHsv() {
		return {
			h: this.getHue(),
			s: this.getHSVSaturation(),
			v: this.getValue(),
			a: this.a
		};
	}
	toRgb() {
		return {
			r: this.r,
			g: this.g,
			b: this.b,
			a: this.a
		};
	}
	toRgbString() {
		return this.a !== 1 ? `rgba(${this.r},${this.g},${this.b},${this.a})` : `rgb(${this.r},${this.g},${this.b})`;
	}
	toString() {
		return this.toRgbString();
	}
	_sc(rgb, value, max) {
		const clone = this.clone();
		clone[rgb] = limitRange(value, max);
		return clone;
	}
	_c(input) {
		return new this.constructor(input);
	}
	getMax() {
		if (typeof this._max === "undefined") this._max = Math.max(this.r, this.g, this.b);
		return this._max;
	}
	getMin() {
		if (typeof this._min === "undefined") this._min = Math.min(this.r, this.g, this.b);
		return this._min;
	}
	fromHexString(trimStr) {
		const withoutPrefix = trimStr.replace("#", "");
		function connectNum(index1, index2) {
			return parseInt(withoutPrefix[index1] + withoutPrefix[index2 || index1], 16);
		}
		if (withoutPrefix.length < 6) {
			this.r = connectNum(0);
			this.g = connectNum(1);
			this.b = connectNum(2);
			this.a = withoutPrefix[3] ? connectNum(3) / 255 : 1;
		} else {
			this.r = connectNum(0, 1);
			this.g = connectNum(2, 3);
			this.b = connectNum(4, 5);
			this.a = withoutPrefix[6] ? connectNum(6, 7) / 255 : 1;
		}
	}
	fromHsl({ h: _h, s, l, a }) {
		const h = (_h % 360 + 360) % 360;
		this._h = h;
		this._hsl_s = s;
		this._l = l;
		this.a = typeof a === "number" ? a : 1;
		if (s <= 0) {
			const rgb = round(l * 255);
			this.r = rgb;
			this.g = rgb;
			this.b = rgb;
			return;
		}
		let r = 0, g = 0, b = 0;
		const huePrime = h / 60;
		const chroma = (1 - Math.abs(2 * l - 1)) * s;
		const secondComponent = chroma * (1 - Math.abs(huePrime % 2 - 1));
		if (huePrime >= 0 && huePrime < 1) {
			r = chroma;
			g = secondComponent;
		} else if (huePrime >= 1 && huePrime < 2) {
			r = secondComponent;
			g = chroma;
		} else if (huePrime >= 2 && huePrime < 3) {
			g = chroma;
			b = secondComponent;
		} else if (huePrime >= 3 && huePrime < 4) {
			g = secondComponent;
			b = chroma;
		} else if (huePrime >= 4 && huePrime < 5) {
			r = secondComponent;
			b = chroma;
		} else if (huePrime >= 5 && huePrime < 6) {
			r = chroma;
			b = secondComponent;
		}
		const lightnessModification = l - chroma / 2;
		this.r = round((r + lightnessModification) * 255);
		this.g = round((g + lightnessModification) * 255);
		this.b = round((b + lightnessModification) * 255);
	}
	fromHsv({ h: _h, s, v, a }) {
		const h = (_h % 360 + 360) % 360;
		this._h = h;
		this._hsv_s = s;
		this._v = v;
		this.a = typeof a === "number" ? a : 1;
		const vv = round(v * 255);
		this.r = vv;
		this.g = vv;
		this.b = vv;
		if (s <= 0) return;
		const hh = h / 60;
		const i = Math.floor(hh);
		const ff = hh - i;
		const p = round(v * (1 - s) * 255);
		const q = round(v * (1 - s * ff) * 255);
		const t = round(v * (1 - s * (1 - ff)) * 255);
		switch (i) {
			case 0:
				this.g = t;
				this.b = p;
				break;
			case 1:
				this.r = q;
				this.b = p;
				break;
			case 2:
				this.r = p;
				this.b = t;
				break;
			case 3:
				this.r = p;
				this.g = q;
				break;
			case 4:
				this.r = t;
				this.g = p;
				break;
			default:
				this.g = p;
				this.b = q;
		}
	}
	fromHsvString(trimStr) {
		const cells = splitColorStr(trimStr, parseHSVorHSL);
		this.fromHsv({
			h: cells[0],
			s: cells[1],
			v: cells[2],
			a: cells[3]
		});
	}
	fromHslString(trimStr) {
		const cells = splitColorStr(trimStr, parseHSVorHSL);
		this.fromHsl({
			h: cells[0],
			s: cells[1],
			l: cells[2],
			a: cells[3]
		});
	}
	fromRgbString(trimStr) {
		const cells = splitColorStr(trimStr, (num, txt) => txt.includes("%") ? round(num / 100 * 255) : num);
		this.r = cells[0];
		this.g = cells[1];
		this.b = cells[2];
		this.a = cells[3];
	}
};

//#endregion
//#region node_modules/.pnpm/@ant-design+colors@8.0.1/node_modules/@ant-design/colors/es/generate.js
const hueStep = 2;
const saturationStep = .16;
const saturationStep2 = .05;
const brightnessStep1 = .05;
const brightnessStep2 = .15;
const lightColorCount = 5;
const darkColorCount = 4;
const darkColorMap = [
	{
		index: 7,
		amount: 15
	},
	{
		index: 6,
		amount: 25
	},
	{
		index: 5,
		amount: 30
	},
	{
		index: 5,
		amount: 45
	},
	{
		index: 5,
		amount: 65
	},
	{
		index: 5,
		amount: 85
	},
	{
		index: 4,
		amount: 90
	},
	{
		index: 3,
		amount: 95
	},
	{
		index: 2,
		amount: 97
	},
	{
		index: 1,
		amount: 98
	}
];
function getHue(hsv, i, light) {
	let hue;
	if (Math.round(hsv.h) >= 60 && Math.round(hsv.h) <= 240) hue = light ? Math.round(hsv.h) - hueStep * i : Math.round(hsv.h) + hueStep * i;
	else hue = light ? Math.round(hsv.h) + hueStep * i : Math.round(hsv.h) - hueStep * i;
	if (hue < 0) hue += 360;
	else if (hue >= 360) hue -= 360;
	return hue;
}
function getSaturation(hsv, i, light) {
	if (hsv.h === 0 && hsv.s === 0) return hsv.s;
	let saturation;
	if (light) saturation = hsv.s - saturationStep * i;
	else if (i === darkColorCount) saturation = hsv.s + saturationStep;
	else saturation = hsv.s + saturationStep2 * i;
	if (saturation > 1) saturation = 1;
	if (light && i === lightColorCount && saturation > .1) saturation = .1;
	if (saturation < .06) saturation = .06;
	return Math.round(saturation * 100) / 100;
}
function getValue(hsv, i, light) {
	let value;
	if (light) value = hsv.v + brightnessStep1 * i;
	else value = hsv.v - brightnessStep2 * i;
	value = Math.max(0, Math.min(1, value));
	return Math.round(value * 100) / 100;
}
function generate$1(color, opts = {}) {
	const patterns = [];
	const pColor = new FastColor(color);
	const hsv = pColor.toHsv();
	for (let i = lightColorCount; i > 0; i -= 1) {
		const c = new FastColor({
			h: getHue(hsv, i, true),
			s: getSaturation(hsv, i, true),
			v: getValue(hsv, i, true)
		});
		patterns.push(c);
	}
	patterns.push(pColor);
	for (let i = 1; i <= darkColorCount; i += 1) {
		const c = new FastColor({
			h: getHue(hsv, i),
			s: getSaturation(hsv, i),
			v: getValue(hsv, i)
		});
		patterns.push(c);
	}
	if (opts.theme === "dark") return darkColorMap.map(({ index, amount }) => new FastColor(opts.backgroundColor || "#141414").mix(patterns[index], amount).toHexString());
	return patterns.map((c) => c.toHexString());
}

//#endregion
//#region node_modules/.pnpm/@ant-design+colors@8.0.1/node_modules/@ant-design/colors/es/presets.js
const red = [
	"#fff1f0",
	"#ffccc7",
	"#ffa39e",
	"#ff7875",
	"#ff4d4f",
	"#f5222d",
	"#cf1322",
	"#a8071a",
	"#820014",
	"#5c0011"
];
red.primary = red[5];
const volcano = [
	"#fff2e8",
	"#ffd8bf",
	"#ffbb96",
	"#ff9c6e",
	"#ff7a45",
	"#fa541c",
	"#d4380d",
	"#ad2102",
	"#871400",
	"#610b00"
];
volcano.primary = volcano[5];
const orange = [
	"#fff7e6",
	"#ffe7ba",
	"#ffd591",
	"#ffc069",
	"#ffa940",
	"#fa8c16",
	"#d46b08",
	"#ad4e00",
	"#873800",
	"#612500"
];
orange.primary = orange[5];
const gold = [
	"#fffbe6",
	"#fff1b8",
	"#ffe58f",
	"#ffd666",
	"#ffc53d",
	"#faad14",
	"#d48806",
	"#ad6800",
	"#874d00",
	"#613400"
];
gold.primary = gold[5];
const yellow = [
	"#feffe6",
	"#ffffb8",
	"#fffb8f",
	"#fff566",
	"#ffec3d",
	"#fadb14",
	"#d4b106",
	"#ad8b00",
	"#876800",
	"#614700"
];
yellow.primary = yellow[5];
const lime = [
	"#fcffe6",
	"#f4ffb8",
	"#eaff8f",
	"#d3f261",
	"#bae637",
	"#a0d911",
	"#7cb305",
	"#5b8c00",
	"#3f6600",
	"#254000"
];
lime.primary = lime[5];
const green = [
	"#f6ffed",
	"#d9f7be",
	"#b7eb8f",
	"#95de64",
	"#73d13d",
	"#52c41a",
	"#389e0d",
	"#237804",
	"#135200",
	"#092b00"
];
green.primary = green[5];
const cyan = [
	"#e6fffb",
	"#b5f5ec",
	"#87e8de",
	"#5cdbd3",
	"#36cfc9",
	"#13c2c2",
	"#08979c",
	"#006d75",
	"#00474f",
	"#002329"
];
cyan.primary = cyan[5];
const blue = [
	"#e6f4ff",
	"#bae0ff",
	"#91caff",
	"#69b1ff",
	"#4096ff",
	"#1677ff",
	"#0958d9",
	"#003eb3",
	"#002c8c",
	"#001d66"
];
blue.primary = blue[5];
const geekblue = [
	"#f0f5ff",
	"#d6e4ff",
	"#adc6ff",
	"#85a5ff",
	"#597ef7",
	"#2f54eb",
	"#1d39c4",
	"#10239e",
	"#061178",
	"#030852"
];
geekblue.primary = geekblue[5];
const purple = [
	"#f9f0ff",
	"#efdbff",
	"#d3adf7",
	"#b37feb",
	"#9254de",
	"#722ed1",
	"#531dab",
	"#391085",
	"#22075e",
	"#120338"
];
purple.primary = purple[5];
const magenta = [
	"#fff0f6",
	"#ffd6e7",
	"#ffadd2",
	"#ff85c0",
	"#f759ab",
	"#eb2f96",
	"#c41d7f",
	"#9e1068",
	"#780650",
	"#520339"
];
magenta.primary = magenta[5];
const grey = [
	"#a6a6a6",
	"#999999",
	"#8c8c8c",
	"#808080",
	"#737373",
	"#666666",
	"#404040",
	"#1a1a1a",
	"#000000",
	"#000000"
];
grey.primary = grey[5];
const redDark = [
	"#2a1215",
	"#431418",
	"#58181c",
	"#791a1f",
	"#a61d24",
	"#d32029",
	"#e84749",
	"#f37370",
	"#f89f9a",
	"#fac8c3"
];
redDark.primary = redDark[5];
const volcanoDark = [
	"#2b1611",
	"#441d12",
	"#592716",
	"#7c3118",
	"#aa3e19",
	"#d84a1b",
	"#e87040",
	"#f3956a",
	"#f8b692",
	"#fad4bc"
];
volcanoDark.primary = volcanoDark[5];
const orangeDark = [
	"#2b1d11",
	"#442a11",
	"#593815",
	"#7c4a15",
	"#aa6215",
	"#d87a16",
	"#e89a3c",
	"#f3b765",
	"#f8cf8d",
	"#fae3b7"
];
orangeDark.primary = orangeDark[5];
const goldDark = [
	"#2b2111",
	"#443111",
	"#594214",
	"#7c5914",
	"#aa7714",
	"#d89614",
	"#e8b339",
	"#f3cc62",
	"#f8df8b",
	"#faedb5"
];
goldDark.primary = goldDark[5];
const yellowDark = [
	"#2b2611",
	"#443b11",
	"#595014",
	"#7c6e14",
	"#aa9514",
	"#d8bd14",
	"#e8d639",
	"#f3ea62",
	"#f8f48b",
	"#fafab5"
];
yellowDark.primary = yellowDark[5];
const limeDark = [
	"#1f2611",
	"#2e3c10",
	"#3e4f13",
	"#536d13",
	"#6f9412",
	"#8bbb11",
	"#a9d134",
	"#c9e75d",
	"#e4f88b",
	"#f0fab5"
];
limeDark.primary = limeDark[5];
const greenDark = [
	"#162312",
	"#1d3712",
	"#274916",
	"#306317",
	"#3c8618",
	"#49aa19",
	"#6abe39",
	"#8fd460",
	"#b2e58b",
	"#d5f2bb"
];
greenDark.primary = greenDark[5];
const cyanDark = [
	"#112123",
	"#113536",
	"#144848",
	"#146262",
	"#138585",
	"#13a8a8",
	"#33bcb7",
	"#58d1c9",
	"#84e2d8",
	"#b2f1e8"
];
cyanDark.primary = cyanDark[5];
const blueDark = [
	"#111a2c",
	"#112545",
	"#15325b",
	"#15417e",
	"#1554ad",
	"#1668dc",
	"#3c89e8",
	"#65a9f3",
	"#8dc5f8",
	"#b7dcfa"
];
blueDark.primary = blueDark[5];
const geekblueDark = [
	"#131629",
	"#161d40",
	"#1c2755",
	"#203175",
	"#263ea0",
	"#2b4acb",
	"#5273e0",
	"#7f9ef3",
	"#a8c1f8",
	"#d2e0fa"
];
geekblueDark.primary = geekblueDark[5];
const purpleDark = [
	"#1a1325",
	"#24163a",
	"#301c4d",
	"#3e2069",
	"#51258f",
	"#642ab5",
	"#854eca",
	"#ab7ae0",
	"#cda8f0",
	"#ebd7fa"
];
purpleDark.primary = purpleDark[5];
const magentaDark = [
	"#291321",
	"#40162f",
	"#551c3b",
	"#75204f",
	"#a02669",
	"#cb2b83",
	"#e0529c",
	"#f37fb7",
	"#f8a8cc",
	"#fad2e3"
];
magentaDark.primary = magentaDark[5];
const greyDark = [
	"#151515",
	"#1f1f1f",
	"#2d2d2d",
	"#393939",
	"#494949",
	"#5a5a5a",
	"#6a6a6a",
	"#7b7b7b",
	"#888888",
	"#969696"
];
greyDark.primary = greyDark[5];

//#endregion
//#region node_modules/.pnpm/@ant-design+icons@6.2.5_rea_edcba2dbaf139d479fed699ef1e02546/node_modules/@ant-design/icons/es/components/Context.js
const IconContext = /*#__PURE__*/ (0, import_external__react.createContext)({});

//#endregion
//#region node_modules/.pnpm/@rc-component+util@1.11.1_r_c9ee825d3eec4ff46837f2aceb930dc1/node_modules/@rc-component/util/es/Dom/canUseDom.js
function canUseDom() {
	return !!(typeof window !== "undefined" && window.document && window.document.createElement);
}

//#endregion
//#region node_modules/.pnpm/@rc-component+util@1.11.1_r_c9ee825d3eec4ff46837f2aceb930dc1/node_modules/@rc-component/util/es/hooks/useLayoutEffect.js
const useInternalLayoutEffect = canUseDom() ? import_external__react.useLayoutEffect : import_external__react.useEffect;

//#endregion
//#region node_modules/.pnpm/@rc-component+util@1.11.1_r_c9ee825d3eec4ff46837f2aceb930dc1/node_modules/@rc-component/util/es/hooks/useId.js
function getUseId() {
	return { ...import_external__react }.useId;
}
const useOriginId = getUseId();

//#endregion
//#region node_modules/.pnpm/@rc-component+util@1.11.1_r_c9ee825d3eec4ff46837f2aceb930dc1/node_modules/@rc-component/util/es/hooks/useMemo.js
function useMemo(getValue, condition, shouldUpdate) {
	const cacheRef = import_external__react.useRef({});
	if (!("value" in cacheRef.current) || shouldUpdate(cacheRef.current.condition, condition)) {
		cacheRef.current.value = getValue();
		cacheRef.current.condition = condition;
	}
	return cacheRef.current.value;
}

//#endregion
//#region node_modules/.pnpm/react-is@18.2.0/node_modules/react-is/cjs/react-is.production.min.js
var require_react_is_production_min = /* @__PURE__ */ __commonJS({ "node_modules/.pnpm/react-is@18.2.0/node_modules/react-is/cjs/react-is.production.min.js": ((exports) => {}) });

//#endregion
//#region node_modules/.pnpm/react-is@18.2.0/node_modules/react-is/index.js
var require_react_is = /* @__PURE__ */ __commonJS({ "node_modules/.pnpm/react-is@18.2.0/node_modules/react-is/index.js": ((exports, module) => {
	module.exports = require_react_is_production_min();
}) });

//#endregion
//#region node_modules/.pnpm/@rc-component+util@1.11.1_r_c9ee825d3eec4ff46837f2aceb930dc1/node_modules/@rc-component/util/es/ref.js
var import_react_is = require_react_is();
const ReactMajorVersion = Number(import_external__react.version.split(".")[0]);
const fillRef = (ref, node) => {
	if (typeof ref === "function") ref(node);
	else if (typeof ref === "object" && ref && "current" in ref) ref.current = node;
};
const composeRef = (...refs) => {
	const refList = refs.filter(Boolean);
	if (refList.length <= 1) return refList[0];
	return (node) => {
		refs.forEach((ref) => {
			fillRef(ref, node);
		});
	};
};
const useComposeRef = (...refs) => {
	return useMemo(() => composeRef(...refs), refs, (prev, next) => prev.length !== next.length || prev.every((ref, i) => ref !== next[i]));
};

//#endregion
//#region node_modules/.pnpm/@rc-component+util@1.11.1_r_c9ee825d3eec4ff46837f2aceb930dc1/node_modules/@rc-component/util/es/Dom/contains.js
function contains(root, n) {
	if (!root) return false;
	if (root.contains) return root.contains(n);
	let node = n;
	while (node) {
		if (node === root) return true;
		node = node.parentNode;
	}
	return false;
}

//#endregion
//#region node_modules/.pnpm/@rc-component+util@1.11.1_r_c9ee825d3eec4ff46837f2aceb930dc1/node_modules/@rc-component/util/es/Dom/dynamicCSS.js
const APPEND_ORDER = "data-rc-order";
const APPEND_PRIORITY = "data-rc-priority";
const MARK_KEY = `rc-util-key`;
const containerCache = /* @__PURE__ */ new Map();
function getMark({ mark } = {}) {
	if (mark) return mark.startsWith("data-") ? mark : `data-${mark}`;
	return MARK_KEY;
}
function getContainer(option) {
	if (option.attachTo) return option.attachTo;
	return document.querySelector("head") || document.body;
}
function getOrder(prepend) {
	if (prepend === "queue") return "prependQueue";
	return prepend ? "prepend" : "append";
}
function findStyles(container) {
	return Array.from((containerCache.get(container) || container).children).filter((node) => node.tagName === "STYLE");
}
function injectCSS(css, option = {}) {
	if (!canUseDom()) return null;
	const { csp, prepend, priority = 0 } = option;
	const mergedOrder = getOrder(prepend);
	const isPrependQueue = mergedOrder === "prependQueue";
	const styleNode = document.createElement("style");
	styleNode.setAttribute(APPEND_ORDER, mergedOrder);
	if (isPrependQueue && priority) styleNode.setAttribute(APPEND_PRIORITY, `${priority}`);
	if (csp?.nonce) styleNode.nonce = csp?.nonce;
	styleNode.innerHTML = css;
	const container = getContainer(option);
	const { firstChild } = container;
	if (prepend) {
		if (isPrependQueue) {
			const existStyle = (option.styles || findStyles(container)).filter((node) => {
				if (!["prepend", "prependQueue"].includes(node.getAttribute(APPEND_ORDER))) return false;
				const nodePriority = Number(node.getAttribute(APPEND_PRIORITY) || 0);
				return priority >= nodePriority;
			});
			if (existStyle.length) {
				container.insertBefore(styleNode, existStyle[existStyle.length - 1].nextSibling);
				return styleNode;
			}
		}
		container.insertBefore(styleNode, firstChild);
	} else container.appendChild(styleNode);
	return styleNode;
}
function findExistNode(key, option = {}) {
	let { styles } = option;
	styles ||= findStyles(getContainer(option));
	return styles.find((node) => node.getAttribute(getMark(option)) === key);
}
function syncRealContainer(container, option) {
	const cachedRealContainer = containerCache.get(container);
	if (!cachedRealContainer || !contains(document, cachedRealContainer)) {
		const placeholderStyle = injectCSS("", option);
		const { parentNode } = placeholderStyle;
		containerCache.set(container, parentNode);
		container.removeChild(placeholderStyle);
	}
}
function updateCSS(css, key, originOption = {}) {
	const container = getContainer(originOption);
	const styles = findStyles(container);
	const option = {
		...originOption,
		styles
	};
	syncRealContainer(container, option);
	const existNode = findExistNode(key, option);
	if (existNode) {
		if (option.csp?.nonce && existNode.nonce !== option.csp?.nonce) existNode.nonce = option.csp?.nonce;
		if (existNode.innerHTML !== css) existNode.innerHTML = css;
		return existNode;
	}
	const newNode = injectCSS(css, option);
	newNode.setAttribute(getMark(option), key);
	return newNode;
}

//#endregion
//#region node_modules/.pnpm/@rc-component+util@1.11.1_r_c9ee825d3eec4ff46837f2aceb930dc1/node_modules/@rc-component/util/es/Dom/shadow.js
function getRoot(ele) {
	return ele?.getRootNode?.();
}
function inShadow(ele) {
	return getRoot(ele) instanceof ShadowRoot;
}
function getShadowRoot(ele) {
	return inShadow(ele) ? getRoot(ele) : null;
}

//#endregion
//#region node_modules/.pnpm/@rc-component+util@1.11.1_r_c9ee825d3eec4ff46837f2aceb930dc1/node_modules/@rc-component/util/es/warning.js
let warned = {};
const preWarningFns = [];
const preMessage = (fn) => {
	preWarningFns.push(fn);
};
function warning$1(valid, message) {}
function note(valid, message) {}
function resetWarned() {
	warned = {};
}
function call(method, valid, message) {
	if (!valid && !warned[message]) {
		method(false, message);
		warned[message] = true;
	}
}
function warningOnce(valid, message) {
	call(warning$1, valid, message);
}
function noteOnce(valid, message) {
	call(note, valid, message);
}
warningOnce.preMessage = preMessage;
warningOnce.resetWarned = resetWarned;
warningOnce.noteOnce = noteOnce;

//#endregion
//#region node_modules/.pnpm/is-mobile@5.0.0/node_modules/is-mobile/index.js
var require_is_mobile = /* @__PURE__ */ __commonJS({ "node_modules/.pnpm/is-mobile@5.0.0/node_modules/is-mobile/index.js": ((exports, module) => {
	module.exports = isMobile;
	module.exports.isMobile = isMobile;
	module.exports.default = isMobile;
	const mobileRE = /(android|bb\d+|meego).+mobile|armv7l|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|redmi|series[46]0|samsungbrowser.*mobile|symbian|treo|up\.(browser|link)|vodafone|wap|windows (ce|phone)|xda|xiino/i;
	const notMobileRE = /CrOS/;
	const tabletRE = /android|ipad|playbook|silk/i;
	function isMobile(opts) {
		if (!opts) opts = {};
		let ua = opts.ua;
		if (!ua && typeof navigator !== "undefined") ua = navigator.userAgent;
		if (ua && ua.headers && typeof ua.headers["user-agent"] === "string") ua = ua.headers["user-agent"];
		if (typeof ua !== "string") return false;
		let result = mobileRE.test(ua) && !notMobileRE.test(ua) || !!opts.tablet && tabletRE.test(ua);
		if (!result && opts.tablet && opts.featureDetect && navigator && navigator.maxTouchPoints > 1 && ua.indexOf("Macintosh") !== -1 && ua.indexOf("Safari") !== -1) result = true;
		return result;
	}
}) });

//#endregion
//#region node_modules/.pnpm/@rc-component+util@1.11.1_r_c9ee825d3eec4ff46837f2aceb930dc1/node_modules/@rc-component/util/es/isMobile.js
var import_is_mobile = /* @__PURE__ */ __toESM(require_is_mobile());

//#endregion
//#region node_modules/.pnpm/@rc-component+util@1.11.1_r_c9ee825d3eec4ff46837f2aceb930dc1/node_modules/@rc-component/util/es/pickAttrs.js
const propList = `accept acceptCharset accessKey action allowFullScreen allowTransparency
    alt async autoComplete autoFocus autoPlay capture cellPadding cellSpacing challenge
    charSet checked classID className colSpan cols content contentEditable contextMenu
    controls coords crossOrigin data dateTime default defer dir disabled download draggable
    encType form formAction formEncType formMethod formNoValidate formTarget frameBorder
    headers height hidden high href hrefLang htmlFor httpEquiv icon id inputMode integrity
    is keyParams keyType kind label lang list loop low manifest marginHeight marginWidth max maxLength media
    mediaGroup method min minLength multiple muted name noValidate nonce open
    optimum pattern placeholder poster preload radioGroup readOnly rel required
    reversed role rowSpan rows sandbox scope scoped scrolling seamless selected
    shape size sizes span spellCheck src srcDoc srcLang srcSet start step style
    summary tabIndex target title type useMap value width wmode wrap onCopy onCut onPaste onCompositionEnd onCompositionStart onCompositionUpdate onKeyDown
    onKeyPress onKeyUp onFocus onBlur onChange onInput onSubmit onClick onContextMenu onDoubleClick
    onDrag onDragEnd onDragEnter onDragExit onDragLeave onDragOver onDragStart onDrop onMouseDown
    onMouseEnter onMouseLeave onMouseMove onMouseOut onMouseOver onMouseUp onSelect onTouchCancel
    onTouchEnd onTouchMove onTouchStart onScroll onWheel onAbort onCanPlay onCanPlayThrough
    onDurationChange onEmptied onEncrypted onEnded onError onLoadedData onLoadedMetadata
    onLoadStart onPause onPlay onPlaying onProgress onRateChange onSeeked onSeeking onStalled onSuspend onTimeUpdate onVolumeChange onWaiting onLoad onError`.split(/[\s\n]+/);

//#endregion
//#region node_modules/.pnpm/@rc-component+util@1.11.1_r_c9ee825d3eec4ff46837f2aceb930dc1/node_modules/@rc-component/util/es/raf.js
let raf = (callback) => +setTimeout(callback, 16);
let caf = (num) => clearTimeout(num);
if (typeof window !== "undefined" && "requestAnimationFrame" in window) {
	raf = (callback) => window.requestAnimationFrame(callback);
	caf = (handle) => window.cancelAnimationFrame(handle);
}
let rafUUID = 0;
const rafIds = /* @__PURE__ */ new Map();
function cleanup(id) {
	rafIds.delete(id);
}
const wrapperRaf = (callback, times = 1) => {
	rafUUID += 1;
	const id = rafUUID;
	function callRef(leftTimes) {
		if (leftTimes === 0) {
			cleanup(id);
			callback();
		} else {
			const realId = raf(() => {
				callRef(leftTimes - 1);
			});
			rafIds.set(id, realId);
		}
	}
	callRef(times);
	return id;
};
wrapperRaf.cancel = (id) => {
	const realId = rafIds.get(id);
	cleanup(id);
	return caf(realId);
};

//#endregion
//#region external: react-dom
var require_external__react_dom = /* @__PURE__ */ __commonJS({ "external: react-dom": ((exports, module) => {
	module.exports = globalThis.ReactDOM;
}) });

//#endregion
//#region node_modules/.pnpm/@rc-component+util@1.11.1_r_c9ee825d3eec4ff46837f2aceb930dc1/node_modules/@rc-component/util/es/Portal.js
var import_external__react_dom = /* @__PURE__ */ __toESM(require_external__react_dom());

//#endregion
//#region node_modules/.pnpm/@ant-design+icons@6.2.5_rea_edcba2dbaf139d479fed699ef1e02546/node_modules/@ant-design/icons/es/utils.js
function camelCase(input) {
	return input.replace(/-(.)/g, (match, g) => g.toUpperCase());
}
function warning(valid, message) {
	warningOnce(valid, `[@ant-design/icons] ${message}`);
}
function isIconDefinition(target) {
	return typeof target === "object" && typeof target.name === "string" && typeof target.theme === "string" && (typeof target.icon === "object" || typeof target.icon === "function");
}
function normalizeAttrs(attrs = {}) {
	return Object.keys(attrs).reduce((acc, key) => {
		const val = attrs[key];
		switch (key) {
			case "class":
				acc.className = val;
				delete acc.class;
				break;
			default:
				delete acc[key];
				acc[camelCase(key)] = val;
		}
		return acc;
	}, {});
}
function generate(node, key, rootProps) {
	if (!rootProps) return /*#__PURE__*/ import_external__react.default.createElement(node.tag, {
		key,
		...normalizeAttrs(node.attrs)
	}, (node.children || []).map((child, index) => generate(child, `${key}-${node.tag}-${index}`)));
	return /*#__PURE__*/ import_external__react.default.createElement(node.tag, {
		key,
		...normalizeAttrs(node.attrs),
		...rootProps
	}, (node.children || []).map((child, index) => generate(child, `${key}-${node.tag}-${index}`)));
}
function getSecondaryColor(primaryColor) {
	return generate$1(primaryColor)[0];
}
function normalizeTwoToneColors(twoToneColor) {
	if (!twoToneColor) return [];
	return Array.isArray(twoToneColor) ? twoToneColor : [twoToneColor];
}
const svgBaseProps = {
	width: "1em",
	height: "1em",
	fill: "currentColor",
	"aria-hidden": "true",
	focusable: "false"
};
const iconStyles = `
.anticon {
  display: inline-flex;
  align-items: center;
  color: inherit;
  font-style: normal;
  line-height: 0;
  text-align: center;
  text-transform: none;
  vertical-align: -0.125em;
  text-rendering: optimizeLegibility;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

.anticon > * {
  line-height: 1;
}

.anticon svg {
  display: inline-block;
  vertical-align: inherit;
}

.anticon::before {
  display: none;
}

.anticon .anticon-icon {
  display: block;
}

.anticon[tabindex] {
  cursor: pointer;
}

.anticon-spin {
  -webkit-animation: loadingCircle 1s infinite linear;
  animation: loadingCircle 1s infinite linear;
}

@-webkit-keyframes loadingCircle {
  100% {
    -webkit-transform: rotate(360deg);
    transform: rotate(360deg);
  }
}

@keyframes loadingCircle {
  100% {
    -webkit-transform: rotate(360deg);
    transform: rotate(360deg);
  }
}
`;
const useInsertStyles = (eleRef) => {
	const { csp, prefixCls, layer } = (0, import_external__react.useContext)(IconContext);
	let mergedStyleStr = iconStyles;
	if (prefixCls) mergedStyleStr = mergedStyleStr.replace(/anticon/g, prefixCls);
	if (layer) mergedStyleStr = `@layer ${layer} {\n${mergedStyleStr}\n}`;
	(0, import_external__react.useEffect)(() => {
		const ele = eleRef.current;
		const shadowRoot = getShadowRoot(ele);
		updateCSS(mergedStyleStr, "@ant-design-icons", {
			prepend: !layer,
			csp,
			attachTo: shadowRoot
		});
	}, []);
};

//#endregion
//#region node_modules/.pnpm/@ant-design+icons@6.2.5_rea_edcba2dbaf139d479fed699ef1e02546/node_modules/@ant-design/icons/es/components/IconBase.js
const twoToneColorPalette = {
	primaryColor: "#333",
	secondaryColor: "#E6E6E6",
	calculated: false
};
function setTwoToneColors({ primaryColor, secondaryColor }) {
	twoToneColorPalette.primaryColor = primaryColor;
	twoToneColorPalette.secondaryColor = secondaryColor || getSecondaryColor(primaryColor);
	twoToneColorPalette.calculated = !!secondaryColor;
}
function getTwoToneColors() {
	return { ...twoToneColorPalette };
}
const IconBase = (props) => {
	const { icon, className, onClick, style, primaryColor, secondaryColor, ...restProps } = props;
	const svgRef = import_external__react.useRef(null);
	let colors = twoToneColorPalette;
	if (primaryColor) colors = {
		primaryColor,
		secondaryColor: secondaryColor || getSecondaryColor(primaryColor)
	};
	useInsertStyles(svgRef);
	warning(isIconDefinition(icon), `icon should be icon definiton, but got ${icon}`);
	if (!isIconDefinition(icon)) return null;
	let target = icon;
	if (target && typeof target.icon === "function") target = {
		...target,
		icon: target.icon(colors.primaryColor, colors.secondaryColor)
	};
	return generate(target.icon, `svg-${target.name}`, {
		className,
		onClick,
		style,
		"data-icon": target.name,
		width: "1em",
		height: "1em",
		fill: "currentColor",
		"aria-hidden": "true",
		...restProps,
		ref: svgRef
	});
};
IconBase.displayName = "IconReact";
IconBase.getTwoToneColors = getTwoToneColors;
IconBase.setTwoToneColors = setTwoToneColors;

//#endregion
//#region node_modules/.pnpm/@ant-design+icons@6.2.5_rea_edcba2dbaf139d479fed699ef1e02546/node_modules/@ant-design/icons/es/components/twoTonePrimaryColor.js
function setTwoToneColor(twoToneColor) {
	const [primaryColor, secondaryColor] = normalizeTwoToneColors(twoToneColor);
	return IconBase.setTwoToneColors({
		primaryColor,
		secondaryColor
	});
}
function getTwoToneColor() {
	const colors = IconBase.getTwoToneColors();
	if (!colors.calculated) return colors.primaryColor;
	return [colors.primaryColor, colors.secondaryColor];
}

//#endregion
//#region node_modules/.pnpm/@ant-design+icons@6.2.5_rea_edcba2dbaf139d479fed699ef1e02546/node_modules/@ant-design/icons/es/components/AntdIcon.js
function _extends$2() {
	_extends$2 = Object.assign ? Object.assign.bind() : function(target) {
		for (var i = 1; i < arguments.length; i++) {
			var source = arguments[i];
			for (var key in source) if (Object.prototype.hasOwnProperty.call(source, key)) target[key] = source[key];
		}
		return target;
	};
	return _extends$2.apply(this, arguments);
}
setTwoToneColor(blue.primary);
const Icon$1 = /*#__PURE__*/ import_external__react.forwardRef((props, ref) => {
	const { className, icon, spin, rotate, tabIndex, onClick, twoToneColor, ...restProps } = props;
	const { prefixCls = "anticon", rootClassName } = import_external__react.useContext(IconContext);
	const classString = clsx(rootClassName, prefixCls, {
		[`${prefixCls}-${icon.name}`]: !!icon.name,
		[`${prefixCls}-spin`]: !!spin || icon.name === "loading"
	}, className);
	let iconTabIndex = tabIndex;
	if (iconTabIndex === void 0 && onClick) iconTabIndex = -1;
	const svgStyle = rotate ? {
		msTransform: `rotate(${rotate}deg)`,
		transform: `rotate(${rotate}deg)`
	} : void 0;
	const [primaryColor, secondaryColor] = normalizeTwoToneColors(twoToneColor);
	return /*#__PURE__*/ import_external__react.createElement("span", _extends$2({
		role: "img",
		"aria-label": icon.name
	}, restProps, {
		ref,
		tabIndex: iconTabIndex,
		onClick,
		className: classString
	}), /*#__PURE__*/ import_external__react.createElement(IconBase, {
		icon,
		primaryColor,
		secondaryColor,
		style: svgStyle
	}));
});
Icon$1.getTwoToneColor = getTwoToneColor;
Icon$1.setTwoToneColor = setTwoToneColor;

//#endregion
//#region node_modules/.pnpm/@ant-design+icons-svg@4.4.2/node_modules/@ant-design/icons-svg/lib/asn/RightOutlined.js
var require_RightOutlined = /* @__PURE__ */ __commonJS({ "node_modules/.pnpm/@ant-design+icons-svg@4.4.2/node_modules/@ant-design/icons-svg/lib/asn/RightOutlined.js": ((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	var RightOutlined = {
		"icon": {
			"tag": "svg",
			"attrs": {
				"viewBox": "64 64 896 896",
				"focusable": "false"
			},
			"children": [{
				"tag": "path",
				"attrs": { "d": "M765.7 486.8L314.9 134.7A7.97 7.97 0 00302 141v77.3c0 4.9 2.3 9.6 6.1 12.6l360 281.1-360 281.1c-3.9 3-6.1 7.7-6.1 12.6V883c0 6.7 7.7 10.4 12.9 6.3l450.8-352.1a31.96 31.96 0 000-50.4z" }
			}]
		},
		"name": "right",
		"theme": "outlined"
	};
	exports.default = RightOutlined;
}) });

//#endregion
//#region node_modules/.pnpm/@ant-design+icons@6.2.5_rea_edcba2dbaf139d479fed699ef1e02546/node_modules/@ant-design/icons/es/icons/RightOutlined.js
var import_RightOutlined = /* @__PURE__ */ __toESM(require_RightOutlined());
function _extends$1() {
	_extends$1 = Object.assign ? Object.assign.bind() : function(target) {
		for (var i = 1; i < arguments.length; i++) {
			var source = arguments[i];
			for (var key in source) if (Object.prototype.hasOwnProperty.call(source, key)) target[key] = source[key];
		}
		return target;
	};
	return _extends$1.apply(this, arguments);
}
const RightOutlined = (props, ref) => /*#__PURE__*/ import_external__react.createElement(Icon$1, _extends$1({}, props, {
	ref,
	icon: import_RightOutlined.default
}));
const RefIcon = /*#__PURE__*/ import_external__react.forwardRef(RightOutlined);

//#endregion
//#region node_modules/.pnpm/@ant-design+icons@6.2.5_rea_edcba2dbaf139d479fed699ef1e02546/node_modules/@ant-design/icons/es/components/Icon.js
function _extends() {
	_extends = Object.assign ? Object.assign.bind() : function(target) {
		for (var i = 1; i < arguments.length; i++) {
			var source = arguments[i];
			for (var key in source) if (Object.prototype.hasOwnProperty.call(source, key)) target[key] = source[key];
		}
		return target;
	};
	return _extends.apply(this, arguments);
}
const Icon = /*#__PURE__*/ import_external__react.forwardRef((props, ref) => {
	const { className, component: Component, viewBox, spin, rotate, tabIndex, onClick, children, ...restProps } = props;
	const iconRef = import_external__react.useRef(null);
	const mergedRef = useComposeRef(iconRef, ref);
	warning(Boolean(Component || children), "Should have `component` prop or `children`.");
	useInsertStyles(iconRef);
	const { prefixCls = "anticon", rootClassName } = import_external__react.useContext(IconContext);
	const classString = clsx(rootClassName, prefixCls, { [`${prefixCls}-spin`]: !!spin && !!Component }, className);
	const svgClassString = clsx({ [`${prefixCls}-spin`]: !!spin });
	const svgStyle = rotate ? {
		msTransform: `rotate(${rotate}deg)`,
		transform: `rotate(${rotate}deg)`
	} : void 0;
	const innerSvgProps = {
		...svgBaseProps,
		className: svgClassString,
		style: svgStyle,
		viewBox
	};
	if (!viewBox) delete innerSvgProps.viewBox;
	const renderInnerNode = () => {
		if (Component) return /*#__PURE__*/ import_external__react.createElement(Component, innerSvgProps, children);
		if (children) {
			warning(Boolean(viewBox) || import_external__react.Children.count(children) === 1 && /*#__PURE__*/ import_external__react.isValidElement(children) && import_external__react.Children.only(children).type === "use", "Make sure that you provide correct `viewBox` prop (default `0 0 1024 1024`) to the icon.");
			return /*#__PURE__*/ import_external__react.createElement("svg", _extends({}, innerSvgProps, { viewBox }), children);
		}
		return null;
	};
	let iconTabIndex = tabIndex;
	if (iconTabIndex === void 0 && onClick) iconTabIndex = -1;
	return /*#__PURE__*/ import_external__react.createElement("span", _extends({ role: "img" }, restProps, {
		ref: mergedRef,
		tabIndex: iconTabIndex,
		onClick,
		className: classString
	}), renderInnerNode());
});

//#endregion
//#region external: echarts
var require_external__echarts = /* @__PURE__ */ __commonJS({ "external: echarts": ((exports, module) => {
	module.exports = globalThis.echarts;
}) });

//#endregion
//#region node_modules/.pnpm/react-object-model@1.2.34_react@19.2.8/node_modules/react-object-model/hooks.js
var import_external__echarts = /* @__PURE__ */ __toESM(require_external__echarts(), 1);
function use_rerender() {
	const set_state = (0, import_external__react.useState)({})[1];
	return function rerender() {
		set_state({});
	};
}
function use_size(ref) {
	let [size, set_size] = (0, import_external__react.useState)(void 0);
	const on_resize = (0, import_external__react.useCallback)((entries) => {
		const { width, height } = entries[0].contentRect;
		set_size({
			width,
			height
		});
	}, []);
	(0, import_external__react.useEffect)(() => {
		let observer = new ResizeObserver(on_resize);
		observer.observe(ref.current);
		return () => {
			observer.disconnect();
		};
	}, [ref, on_resize]);
	return size;
}

//#endregion
//#region src/theme.ts
const primary_color = "#6774bd";
const dark_background = "#282828";
const common_config = { hashed: false };
const common_tokens = {
	motion: false,
	borderRadius: 0,
	controlOutlineWidth: 0
};
const tabs = { horizontalMargin: "0px 0px 8px 0px" };
const notifications = { width: 1100 };
const light = {
	...common_config,
	token: {
		...common_tokens,
		colorPrimary: primary_color,
		colorError: "#ff4d4f",
		colorLink: primary_color,
		colorInfo: primary_color,
		colorBgLayout: "#f9f9fb",
		colorTextDisabled: "#000000a0",
		colorTextPlaceholder: "#00000070"
	},
	components: {
		Table: {
			headerBg: "#f9f9fb",
			rowSelectedBg: "#ebf0fa",
			headerColor: "#666e7d",
			colorText: "#000000",
			cellPaddingBlock: 10,
			bodySortBg: "unset",
			headerSortActiveBg: "#f9f9fb"
		},
		Segmented: {
			itemSelectedColor: primary_color,
			trackPadding: 4
		},
		Tabs: tabs,
		Notification: notifications
	}
};
const dark = {
	...common_config,
	token: {
		...common_tokens,
		colorPrimary: primary_color,
		colorBgContainer: dark_background,
		colorBgElevated: "#555555",
		colorInfoActive: "#4093d3",
		colorBgLayout: "#313131",
		colorTextDisabled: "#ffffff60",
		colorTextPlaceholder: "#ffffff70"
	},
	algorithm: import_external__antd.theme.darkAlgorithm,
	components: {
		Table: {
			headerBg: "#313131",
			headerColor: "#ffffff",
			colorText: "#ffffff",
			cellPaddingBlock: 10
		},
		Segmented: {
			itemSelectedColor: primary_color,
			itemSelectedBg: "#313131",
			trackPadding: 4
		},
		Tabs: tabs,
		Notification: notifications
	}
};

//#endregion
//#region external: react/jsx-runtime
var require_jsx_runtime = /* @__PURE__ */ __commonJS({ "external: react/jsx-runtime": ((exports, module) => {
	module.exports = globalThis.ReactJSX;
}) });

//#endregion
//#region external: plotly.js-dist-min
var require_external__plotly = /* @__PURE__ */ __commonJS({ "external: plotly.js-dist-min": ((exports, module) => {
	module.exports = globalThis.Plotly;
}) });

//#endregion
//#region src/components/Surface.tsx
var import_jsx_runtime = require_jsx_runtime();
let Plotly;
function Surface({ data, options, assets_root }) {
	let rdiv = (0, import_external__react.useRef)(void 0);
	let size = use_size(rdiv);
	let rinited = (0, import_external__react.useRef)(false);
	(0, import_external__react.useEffect)(() => {
		let { current: div } = rdiv;
		(async () => {
			const pdelay = delay$1(100);
			if (!Plotly) {
				await load_script(`${assets_root}vendors/plotly.js-dist-min/plotly.min.js`);
				({default: Plotly} = await Promise.resolve().then(() => /* @__PURE__ */ __toESM(require_external__plotly(), 1)));
			}
			await pdelay;
			Plotly.newPlot(div, get_data(data), get_layout({
				width: div.clientWidth,
				height: div.clientHeight
			}, options));
			rinited.current = true;
		})();
		return () => {
			Plotly?.purge(div);
		};
	}, []);
	(0, import_external__react.useEffect)(() => {
		if (!rinited.current || !size) return;
		Plotly.react(rdiv.current, get_data(data), get_layout(size, options));
	}, [
		size,
		options,
		data
	]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "surface-chart",
		ref: rdiv
	});
}
function get_data({ x, y, z }) {
	return [{
		type: "surface",
		x: x?.map(bigint2number),
		y: y?.map(bigint2number),
		z
	}];
}
function bigint2number(x) {
	return typeof x === "bigint" ? Number(x) : x;
}
function get_layout({ width, height }, options) {
	const { title, title_size = 16, font, dark } = options;
	return {
		width,
		height,
		title: {
			yanchor: "top",
			y: 5,
			text: title,
			font: {
				color: dark ? "#ffffff" : void 0,
				size: title_size
			}
		},
		scene: Object.fromEntries(axises.map((a) => {
			const axis = `${a}axis`;
			return [axis, {
				title: { text: options[axis] || a },
				gridcolor: "#888888"
			}];
		})),
		margin: {
			l: 0,
			r: 0,
			b: 0,
			t: title ? title_size + 20 : 0
		},
		...dark ? {
			paper_bgcolor: dark_background,
			plot_bgcolor: dark_background
		} : {},
		font: {
			color: dark ? "#ffffff" : void 0,
			family: font || void 0
		}
	};
}
const axises = [
	"x",
	"y",
	"z"
];

//#endregion
//#region src/icons/link.icon.svg
const Link = (props) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("svg", {
	xmlns: "http://www.w3.org/2000/svg",
	width: 16,
	height: 16,
	viewBox: "0 0 16 16",
	...props,
	children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("g", {
		fill: "currentColor",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M8 3l1.793 1.793L6 8.586 7.414 10l3.793-3.793L13 8V3z" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M11 11H5V5h2V3H3v10h10V9h-2z" })]
	})
});

//#endregion
//#region src/obj.tsx
const max_strlen = 1e4;
const page_sizes = [
	1,
	2,
	3,
	5,
	10,
	15,
	20,
	25,
	30,
	40,
	50,
	75,
	100,
	150,
	200,
	300,
	400,
	500,
	750,
	1e3,
	5e3,
	1e4,
	1e5
];
const views = {
	[DdbForm.vector]: Vector,
	[DdbForm.set]: Vector,
	[DdbForm.table]: Table,
	[DdbForm.matrix]: Matrix,
	[DdbForm.chart]: Chart,
	[DdbForm.dict]: Dict,
	[DdbForm.tensor]: Tensor
};
function Obj({ obj, objref, ctx = "webview", remote, ddb, ExportCsv, options, product_name, assets_root, font, dark, ddb_language = "dolphindb" }) {
	const View = views[(obj || objref).form] || Default;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(View, {
		obj,
		objref,
		ctx,
		remote,
		ddb,
		options,
		ExportCsv,
		product_name,
		assets_root,
		font,
		dark,
		ddb_language
	});
}
async function open_obj({ obj, objref, remote, ddb, options, product_name, assets_root }) {
	let win = window.open("./window.html", (/* @__PURE__ */ new Date()).toString(), "left=100,top=100,width=1000,height=640,popup");
	if (!win) throw new Error(t("弹窗被浏览器拦截，请设置网页允许弹出式窗口和重定向"));
	await new Promise((resolve) => {
		win.resolve = resolve;
	});
	win.model.set({
		obj,
		objref,
		remote,
		ddb,
		options,
		product_name,
		assets_root
	});
}
function Default({ obj, objref, options }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "default-obj",
		children: (obj || objref).toString(options)
	});
}
function Dict({ obj, objref, remote, ddb, ctx, options }) {
	const [page_size, set_page_size] = (0, import_external__react.useState)(100);
	const [page_index, set_page_index] = (0, import_external__react.useState)(0);
	const render = use_rerender();
	const _obj = obj || objref.obj;
	(0, import_external__react.useEffect)(() => {
		(async () => {
			set_page_index(0);
			set_page_size(100);
			if (_obj) return;
			const { node, name } = objref;
			console.log("dict.fetch:", name);
			objref.obj = ddb ? await ddb.eval(name) : DdbObj.parse(...await remote.call("eval", [node, name]));
			render();
		})();
	}, [obj, objref]);
	if (!_obj) return null;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "dict",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_external__antd.Tree, {
				treeData: (() => {
					if (!_obj) return [];
					const start = page_index * page_size;
					const end = Math.min(start + page_size, _obj.rows);
					return build_tree_data_with_slice(_obj, start, end, {
						remote,
						ddb,
						ctx,
						options
					});
				})(),
				defaultExpandAll: true,
				focusable: false,
				blockNode: true,
				showLine: true,
				motion: null
			}, genid()),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "bottom-bar-placeholder" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "bottom-bar",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "info",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
						className: "desc",
						children: [
							_obj.rows,
							" ",
							t("个键"),
							objref ? ` (${Number(objref.bytes).to_fsize_str()}) ` : ""
						]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "type",
						children: t("的词典")
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_external__antd.Pagination, {
					className: "pagination",
					total: _obj.rows,
					current: page_index + 1,
					pageSize: page_size,
					pageSizeOptions: page_sizes,
					size: "small",
					showSizeChanger: true,
					showQuickJumper: true,
					hideOnSinglePage: page_size <= 50,
					onChange: (page, size) => {
						set_page_size(size);
						set_page_index(page - 1);
					}
				})]
			})
		]
	});
}
function build_tree_data_with_slice(obj, start, end, { remote, ctx, ddb, options }) {
	const [dict_key, dict_value] = obj.value;
	return seq(Math.min(Math.max(end - start, 0), dict_key.rows), (i) => {
		const ireal = start + i;
		const key = formati(dict_key, ireal, options);
		const valueobj = dict_value.value[ireal];
		if (valueobj && Object.getPrototypeOf(valueobj)?.constructor.name === "DdbObj") if (valueobj.form === DdbForm.dict) return {
			title: `${key}: `,
			key: genid(),
			children: build_tree_data_with_slice(valueobj, 0, valueobj.rows, {
				remote,
				ctx,
				ddb
			})
		};
		else if (valueobj.form === DdbForm.scalar) return {
			title: `${key}: ${format(valueobj.type, valueobj.value, valueobj.le, {
				...options,
				quote: true,
				nullstr: true
			})}`,
			key: genid()
		};
		else {
			const View = views[valueobj.form] || Default;
			return {
				title: `${key}:`,
				key: genid(),
				children: [{
					title: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(View, {
						obj: valueobj,
						ctx,
						ddb,
						remote,
						options
					}),
					key: genid()
				}]
			};
		}
		else return {
			title: `${key}: ${formati(dict_value, ireal, options).truncate(max_strlen, true)}`,
			key: genid()
		};
	});
}
function Tensor({ obj, objref, remote, ddb }) {
	const render = use_rerender();
	const _obj = obj || objref.obj;
	const [cwd, set_cwd] = (0, import_external__react.useState)([]);
	const [page_size, set_page_size] = (0, import_external__react.useState)(10);
	const [page, set_page] = (0, import_external__react.useState)(1);
	(0, import_external__react.useEffect)(() => {
		(async () => {
			if (_obj) return;
			const { node, name } = objref;
			console.log("tensor.fetch:", name);
			objref.obj = ddb ? await ddb.eval(name) : DdbObj.parse(...await remote.call("eval", [node, name]));
			render();
		})();
		set_cwd([]);
		set_page_size(10);
		set_page(1);
	}, [obj, objref]);
	if (!_obj) return null;
	const shape = _obj.value.shape;
	const strides = _obj.value.strides;
	const dataByte = ddb_tensor_bytes[_obj.value.data_type];
	const type_name = DdbType[_obj.value.data_type];
	const pageIndex = page - 1;
	const currentDim = cwd.length;
	const isLeaf = currentDim === _obj.value.dimensions - 1;
	const thisDimSize = shape[currentDim];
	const totalPageCount = Math.ceil(thisDimSize / page_size);
	const data = _obj.value.data;
	function pushDimIndex(index) {
		set_cwd([...cwd, index]);
		set_page(1);
	}
	function popDimIndexTo(index) {
		set_cwd(cwd.slice(0, index));
		set_page(1);
	}
	const currentDimSize = _obj.value.shape[currentDim];
	const elems = [];
	const offset = cwd.reduce((prev, curr, index) => prev + strides[index] * curr * dataByte, 0);
	let array_string = "";
	for (let j = 0; j < _obj.value.dimensions; j++) array_string += `[${shape[j]}]`;
	if (!isLeaf) for (let i = pageIndex * page_size; i < pageIndex * page_size + page_size && i < thisDimSize; i++) {
		let arrstr = "";
		for (let j = currentDim + 1; j < _obj.value.dimensions; j++) arrstr += `[${shape[j]}]`;
		let previewStr = "";
		if (currentDim === _obj.value.dimensions - 2) {
			previewStr = "[";
			for (let k = 0; k < shape[currentDim + 1]; k++) {
				const offsetElem = offset + i * dataByte * strides[currentDim] + k * dataByte * strides[currentDim + 1];
				const targetArr = data.subarray(offsetElem, offsetElem + dataByte);
				const val = get_value_from_uint8_array(_obj.value.data_type, targetArr, _obj.le);
				previewStr += `${val}`;
				if (k === 10) {
					previewStr += ", ...";
					break;
				} else if (k !== shape[currentDim + 1] - 1) previewStr += ", ";
			}
			previewStr += "]";
		}
		elems.push(/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			onClick: () => {
				pushDimIndex(i);
			},
			className: "tensor-elem",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "tensor-elem-count",
					children: i
				}),
				": ",
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
					className: "type-name",
					children: [type_name, arrstr]
				}),
				" ",
				previewStr
			]
		}, `dim${i}`));
	}
	else for (let i = pageIndex * page_size; i < pageIndex * page_size + page_size && i < thisDimSize; i++) {
		const offsetElem = offset + i * dataByte;
		const targetArr = data.subarray(offsetElem, offsetElem + dataByte);
		const val = get_value_from_uint8_array(_obj.value.data_type, targetArr, _obj.le);
		elems.push(/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "tensor-elem",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "tensor-elem-count",
					children: i
				}),
				": ",
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "type-name",
					children: type_name
				}),
				" ",
				String(val)
			]
		}, `tensor-elem-offset-${offsetElem}`));
	}
	const navItems = cwd.map((e, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "tensor-nav-elem",
		onClick: () => {
			popDimIndexTo(i + 1);
		},
		children: [
			"[",
			e,
			"] ",
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(RefIcon, { style: { transform: "scale(0.8,0.8) translate(0,2px)" } })
		]
	}, `tensor-index-${i}`));
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "tensor",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "tensor-nav",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
					className: "tensor-title",
					onClick: () => {
						popDimIndexTo(0);
					},
					children: [t("张量"), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(RefIcon, { style: { transform: "scale(0.8,0.8) translate(0,2px)" } })]
				}), navItems]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "tensor-view",
				children: elems
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "tensor-page",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
					className: "tensor-desc",
					children: [
						t("张量"),
						" ",
						type_name,
						array_string
					]
				}), totalPageCount > 1 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_external__antd.Pagination, {
					current: page,
					total: currentDimSize,
					pageSize: page_size,
					onChange: (page, pageSize) => {
						set_page(page);
						set_page_size(pageSize);
					},
					showSizeChanger: true
				})]
			})
		]
	});
}
function get_value_from_uint8_array(dataType, data, le) {
	const dv = new DataView(data.buffer, data.byteOffset);
	switch (dataType) {
		case DdbType.bool: {
			const value = dv.getInt8(0);
			return value === nulls.int8 ? null : Boolean(value);
		}
		case DdbType.char: {
			const value = dv.getInt8(0);
			return value === nulls.int8 ? null : value;
		}
		case DdbType.short: {
			const value = dv.getInt16(0, le);
			return value === nulls.int16 ? null : value;
		}
		case DdbType.int: {
			const value = dv.getInt32(0, le);
			return value === nulls.int32 ? null : value;
		}
		case DdbType.long: {
			const value = dv.getBigInt64(0, le);
			return value === nulls.int64 ? null : value;
		}
		case DdbType.float: {
			const value = dv.getFloat32(0, le);
			return value === nulls.float32 ? null : value;
		}
		case DdbType.double: {
			const value = dv.getFloat64(0, le);
			return value === nulls.double ? null : value;
		}
	}
}
function Vector({ obj, objref, ctx, remote, ddb, ddb_language, options, product_name, assets_root }) {
	const info = obj || objref;
	const { type } = info;
	const typestr = (64 <= type && type < 128 ? `${DdbType[type - 64]}[]` : DdbType[type]) || String(type);
	const ncols = Math.min(10, info.rows);
	const [page_size, set_page_size] = (0, import_external__react.useState)(ctx === "page" || ctx === "window" ? 200 : 100);
	const nrows = info.rows === 0 ? 0 : Math.min(Math.ceil(info.rows / ncols), Math.ceil(page_size / ncols));
	const [page_index, set_page_index] = (0, import_external__react.useState)(0);
	const render = (0, import_external__react.useState)({})[1];
	(0, import_external__react.useEffect)(() => {
		set_page_index(0);
	}, [obj, objref]);
	(0, import_external__react.useEffect)(() => {
		(async () => {
			if (obj || info.form === DdbForm.set && objref.obj) return;
			const { node, name, rows, form } = objref;
			const offset = page_size * page_index;
			if (rows === 0 && offset === 0 || offset < rows) {
				const script = form === DdbForm.set || rows === 0 ? name : ddb_language === "q" ? `(${offset};${page_size}) sublist ${name}` : `${name}[${offset}..${Math.min(offset + page_size, rows) - 1}]`;
				console.log(`${DdbForm[form]}.fetch:`, script);
				objref.obj = ddb ? await ddb.eval(script) : DdbObj.parse(...await remote.call("eval", [node, script]));
				render({});
			}
		})();
	}, [
		obj,
		objref,
		page_index,
		page_size
	]);
	if (!(obj || objref.obj)) return null;
	if (!info.rows) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_jsx_runtime.Fragment, { children: (obj || objref.obj).toString(options) });
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "vector",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_external__antd.Table, {
				dataSource: seq(nrows),
				rowKey: (x) => x,
				bordered: true,
				pagination: false,
				columns: [{
					title: "",
					key: "index",
					className: "row-head",
					fixed: "left",
					render(value, row, index) {
						return page_size * page_index + index * ncols;
					}
				}, ...seq(ncols, (index) => new VectorColumn({
					obj,
					objref,
					index,
					form: info.form,
					ncols,
					page_index,
					page_size,
					options
				}))]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "bottom-bar-placeholder" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "bottom-bar",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "info",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "desc",
								children: [
									info.rows,
									" ",
									t("个元素"),
									objref ? ` (${Number(objref.bytes).to_fsize_str()}) ` : ""
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "type",
								children: info.form === DdbForm.set ? t("的 {{type}} 集合", { type: typestr }) : t("的 {{type}} 向量", { type: typestr })
							}),
							info.name && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "name",
								children: info.name
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_external__antd.Pagination, {
						className: "pagination",
						total: info.rows,
						current: page_index + 1,
						pageSize: page_size,
						pageSizeOptions: page_sizes,
						size: "small",
						showSizeChanger: true,
						showQuickJumper: true,
						hideOnSinglePage: page_size <= 200,
						onChange: (page_index, page_size) => {
							set_page_size(page_size);
							set_page_index(page_index - 1);
						}
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "actions",
						children: (ctx === "page" || ctx === "embed") && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, {
							className: "icon-link",
							title: t("在新窗口中打开"),
							component: Link,
							onClick: async () => {
								await open_obj({
									obj,
									objref,
									remote,
									ddb,
									options,
									product_name,
									assets_root
								});
							}
						})
					})
				]
			})
		]
	});
}
var VectorColumn = class {
	index;
	form;
	obj;
	objref;
	ncols;
	page_index;
	page_size;
	title;
	key;
	options;
	constructor(data) {
		Object.assign(this, data);
		this.title = String(this.index);
		this.key = this.index;
	}
	render = (value, row, index) => {
		const obj = this.obj || this.objref.obj;
		if (!obj) return null;
		const index_ = (this.obj || this.form === DdbForm.set ? this.page_size * this.page_index : 0) + this.ncols * index + this.index;
		return index_ < obj.rows ? formati(obj, index_, this.options).truncate(max_strlen, true) : null;
	};
};
function Table({ obj, objref, ctx, remote, ddb, options, ExportCsv, show_bottom_bar = true, product_name, assets_root, ddb_language, ...others }) {
	const info = obj || objref;
	const ncols = info.cols;
	const [page_size, set_page_size] = (0, import_external__react.useState)(ctx === "page" || ctx === "window" ? 20 : 10);
	const nrows = Math.min(page_size, info.rows);
	const [page_index, set_page_index] = (0, import_external__react.useState)(0);
	const render = use_rerender();
	(0, import_external__react.useEffect)(() => {
		set_page_index(0);
	}, [obj, objref]);
	(0, import_external__react.useEffect)(() => {
		(async () => {
			if (obj) return;
			const { node, name, rows } = objref;
			const offset = page_size * page_index;
			if (rows === 0 && offset === 0 || offset < rows) {
				const script = ddb_language === "q" ? `(${offset};${page_size}) sublist ${name}` : `select * from ${name} limit ${offset}, ${page_size}`;
				console.log("table.fetch:", script);
				if (ddb) objref.obj = await ddb.eval(script);
				else objref.obj = DdbObj.parse(...await remote.call("eval", [node, script]));
				render();
			}
		})();
	}, [
		obj,
		objref,
		page_index,
		page_size
	]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "table",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_external__antd.Table, {
				dataSource: seq(nrows),
				rowKey: (x) => x,
				bordered: true,
				pagination: false,
				columns: [{
					title: "",
					key: "index",
					className: "row-head",
					fixed: "left",
					render: (irow) => page_size * page_index + irow
				}, ...seq(ncols, (index) => new TableColumn({
					obj,
					objref,
					index,
					page_index,
					page_size,
					options
				}))],
				...others
			}),
			show_bottom_bar && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "bottom-bar-placeholder" }),
			show_bottom_bar && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "bottom-bar",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "info",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "desc",
								children: [
									info.rows ? `${info.rows} ${t("行")} ` : " ",
									info.cols,
									" ",
									t("列"),
									objref ? ` (${Number(objref.bytes).to_fsize_str()}) ` : ""
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "type",
								children: t("的表格")
							}),
							info.name && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "name",
								children: info.name
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_external__antd.Pagination, {
						className: "pagination",
						total: info.rows,
						current: page_index + 1,
						pageSize: page_size,
						pageSizeOptions: page_sizes,
						size: "small",
						showSizeChanger: true,
						showQuickJumper: true,
						hideOnSinglePage: page_size <= 50,
						onChange: (page_index, page_size) => {
							set_page_size(page_size);
							set_page_index(page_index - 1);
						}
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "actions",
						children: (ctx === "page" || ctx === "embed") && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, {
							className: "icon-link",
							title: t("在新窗口中打开"),
							component: Link,
							onClick: async () => {
								await open_obj({
									obj,
									objref,
									remote,
									ddb,
									options,
									product_name,
									assets_root
								});
							}
						}), ExportCsv && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ExportCsv, { info })] })
					})
				]
			})
		]
	});
}
var TableColumn = class TableColumn {
	static left_align_types = /* @__PURE__ */ new Set([
		DdbType.symbol,
		DdbType.symbol_extended,
		DdbType.string,
		DdbType.functiondef,
		DdbType.handle,
		DdbType.code,
		DdbType.datasource,
		DdbType.resource
	]);
	index;
	obj;
	objref;
	col;
	page_index;
	page_size;
	title;
	key;
	align;
	options;
	constructor(data) {
		Object.assign(this, data);
		this.key = this.index;
		let obj = this.obj || this.objref.obj;
		if (!obj) return;
		this.col = obj.value[this.index];
		this.title = /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_external__antd.Tooltip, {
			title: DdbType[this.col.type === DdbType.symbol_extended ? DdbType.symbol : this.col.type],
			children: this.col.name
		});
		this.align = TableColumn.left_align_types.has(this.col.type) ? "left" : "right";
	}
	render = (irow) => {
		const obj = this.col;
		if (!obj) return null;
		const index = (this.obj ? this.page_size * this.page_index : 0) + irow;
		return index < obj.rows ? formati(obj, index, this.options).truncate(max_strlen, true) : null;
	};
};
function Matrix({ obj, objref, ctx, remote, ddb, options, product_name, assets_root }) {
	const info = obj || objref;
	const ncols = info.cols;
	const [page_size, set_page_size] = (0, import_external__react.useState)(ctx === "page" || ctx === "window" ? 20 : 10);
	const nrows = Math.min(page_size, info.rows);
	const [page_index, set_page_index] = (0, import_external__react.useState)(0);
	const render = (0, import_external__react.useState)({})[1];
	(0, import_external__react.useEffect)(() => {
		set_page_index(0);
	}, [obj, objref]);
	(0, import_external__react.useEffect)(() => {
		(async () => {
			if (obj) return;
			const { node, name, rows } = objref;
			const offset = page_size * page_index;
			if (offset >= rows) return;
			const script = `${name}[${offset}:${Math.min(offset + page_size, rows)},]`;
			console.log("matrix.fetch:", script);
			if (ddb) objref.obj = await ddb.eval(script);
			else objref.obj = DdbObj.parse(...await remote.call("eval", [node, script]));
			render({});
		})();
	}, [
		obj,
		objref,
		page_index,
		page_size
	]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "matrix",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_external__antd.Table, {
				dataSource: seq(nrows),
				rowKey: (x) => x,
				bordered: true,
				pagination: false,
				columns: [{
					title: "",
					key: "index",
					className: "row-head",
					fixed: "left",
					render(irow) {
						const i = obj ? page_size * page_index + irow : irow;
						const rows = (obj || objref.obj)?.value.rows;
						return rows ? i < rows.rows ? formati(rows, i, options) : "" : i;
					}
				}, ...seq(ncols, (index) => new MatrixColumn({
					obj,
					objref,
					index,
					page_index,
					page_size,
					options
				}))]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "bottom-bar-placeholder" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "bottom-bar",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "info",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "desc",
								children: [
									info.rows,
									" ",
									t("行"),
									" ",
									info.cols,
									" ",
									t("列"),
									objref ? ` (${Number(objref.bytes).to_fsize_str()}) ` : ""
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "type",
								children: t("的矩阵")
							}),
							info.name && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "name",
								children: info.name
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_external__antd.Pagination, {
						className: "pagination",
						total: info.rows,
						current: page_index + 1,
						pageSize: page_size,
						pageSizeOptions: page_sizes,
						size: "small",
						showSizeChanger: true,
						showQuickJumper: true,
						hideOnSinglePage: page_size <= 50,
						onChange: (page_index, page_size) => {
							set_page_size(page_size);
							set_page_index(page_index - 1);
						}
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "actions",
						children: (ctx === "page" || ctx === "embed") && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, {
							className: "icon-link",
							title: t("在新窗口中打开"),
							component: Link,
							onClick: async () => {
								await open_obj({
									obj,
									objref,
									remote,
									ddb,
									options,
									product_name,
									assets_root
								});
							}
						})
					})
				]
			})
		]
	});
}
var MatrixColumn = class {
	index;
	obj;
	objref;
	page_index;
	page_size;
	title;
	key;
	options;
	constructor(data) {
		Object.assign(this, data);
		this.title = String(this.index);
		this.key = this.index;
		let obj = this.obj || this.objref.obj;
		if (!obj) return;
		const cols = obj?.value.cols;
		if (cols) this.title = formati(cols, this.index, this.options);
	}
	render = (irow) => {
		const obj = this.obj || this.objref.obj;
		if (!obj) return null;
		if ((this.obj ? this.page_size * this.page_index + irow : irow) >= obj.rows) return null;
		const nitems = obj.cols * obj.rows;
		const index = this.obj ? obj.rows * this.index + this.page_size * this.page_index + irow : obj.rows * this.index + irow;
		assert(index < nitems, "index < obj.cols * obj.rows");
		return formati(new DdbObj({
			form: DdbForm.vector,
			type: obj.type,
			rows: nitems,
			value: obj.value.data
		}), index, this.options);
	};
};
function to_chart_data(data, datatype) {
	switch (datatype) {
		case DdbType.int: return data === nulls.int32 ? null : Number(data);
		case DdbType.short: return data === nulls.int16 ? null : Number(data);
		case DdbType.float: return data === nulls.float32 ? null : Number(data);
		case DdbType.double: return data === nulls.double ? null : Number(data);
		case DdbType.long: return data === nulls.int64 ? null : Number(data);
		default: return Number(data);
	}
}
function Chart({ obj, objref, ctx, remote, ddb, options, product_name, assets_root, font, dark }) {
	const [config, set_config] = (0, import_external__react.useState)({
		inited: false,
		charttype: DdbChartType.line,
		data: [],
		titles: {},
		stacking: false,
		multi_y_axes: false,
		auto_scale_y_axes: false,
		col_labels: [],
		bin_count: null,
		bin_start: null,
		bin_end: null,
		font
	});
	let [surface_data, set_surface_data] = (0, import_external__react.useState)(void 0);
	(0, import_external__react.useEffect)(() => {
		(async () => {
			const { value: { bin_count, bin_start, bin_end, titles, type: charttype, stacking, extras, data: { rows, cols, type: datatype, value: { rows: rows_, cols: cols_, data } } } } = obj || (ddb ? await ddb.eval(objref.name) : DdbObj.parse(...await remote.call("eval", [objref.node, objref.name])));
			const { multi_y_axes = false, auto_scale_y_axes = false } = extras || {};
			const col_labels_ = (cols_?.value || seq(cols)).map((col_label) => col_label?.value?.name || col_label);
			const row_labels = (() => {
				if (!rows_) return seq(rows);
				else if (charttype === DdbChartType.kline || charttype === DdbChartType.scatter) return rows_.value;
				else return seq(rows, (i) => formati(rows_, i, options));
			})();
			const n = charttype === DdbChartType.line && multi_y_axes || charttype === DdbChartType.kline || charttype === DdbChartType.surface ? rows : rows * cols;
			let data_ = new Array(n);
			switch (charttype) {
				case DdbChartType.line:
					if (multi_y_axes) for (let j = 0; j < rows; j++) {
						let dataobj = {};
						dataobj.row = row_labels[j];
						for (let i = 0; i < cols; i++) {
							let idata = i * rows + j;
							dataobj[col_labels_[i]] = to_chart_data(data[idata], datatype);
						}
						data_[j] = dataobj;
					}
					else for (let i = 0; i < cols; i++) for (let j = 0; j < rows; j++) {
						const idata = i * rows + j;
						data_[idata] = {
							row: row_labels[j],
							col: col_labels_[i],
							value: to_chart_data(data[idata], datatype)
						};
					}
					break;
				case DdbChartType.kline:
					for (let j = 0; j < rows; j++) {
						let dataobj = {};
						dataobj.row = row_labels[j];
						dataobj.row_ = formati(rows_, j, options);
						dataobj.open = to_chart_data(data[j], datatype);
						dataobj.high = to_chart_data(data[rows + j], datatype);
						dataobj.low = to_chart_data(data[rows * 2 + j], datatype);
						dataobj.close = to_chart_data(data[rows * 3 + j], datatype);
						if (cols === 5) dataobj.vol = to_chart_data(data[rows * 4 + j], datatype);
						data_[j] = dataobj;
					}
					break;
				case DdbChartType.surface:
					set_surface_data({
						x: cols_?.data(options),
						y: rows_?.data(options),
						z: seq(rows, (i) => seq(cols, (j) => to_chart_data(data[i + j * rows], datatype)))
					});
					break;
				default:
					for (let i = 0; i < cols; i++) for (let j = 0; j < rows; j++) {
						const idata = i * rows + j;
						data_[idata] = {
							row: row_labels[j],
							col: col_labels_[i],
							value: to_chart_data(data[idata], datatype)
						};
					}
					if (charttype === DdbChartType.histogram && bin_start && bin_end) data_ = data_.filter((data) => data.value >= Number(bin_start.value) && data.value <= Number(bin_end.value));
			}
			set_config({
				inited: true,
				charttype,
				data: data_,
				titles,
				stacking,
				multi_y_axes,
				auto_scale_y_axes,
				col_labels: col_labels_,
				bin_count,
				bin_start,
				bin_end
			});
		})();
	}, [obj, objref]);
	if (!config.inited) return null;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "chart",
		children: [config.charttype === DdbChartType.surface ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Surface, {
			data: surface_data,
			options: {
				font,
				dark,
				title: config.titles.chart,
				...Object.fromEntries(axises.map((a) => [`${a}axis`, config.titles[`${a}_axis`]]))
			},
			assets_root
		}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EChartsComponent, { option: get_chart_option(config) }), (ctx === "page" || ctx === "embed") && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "bottom-bar-placeholder" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "bottom-bar",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "actions",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, {
					className: "icon-link",
					title: t("在新窗口中打开"),
					component: Link,
					onClick: async () => {
						await open_obj({
							obj,
							objref,
							remote,
							ddb,
							options,
							product_name,
							assets_root
						});
					}
				})
			})
		})] })]
	});
}
let foreground_color;
function get_chart_option(config) {
	const { charttype, data, titles, stacking, multi_y_axes, auto_scale_y_axes, col_labels, bin_count } = config;
	foreground_color ??= window.getComputedStyle(document.documentElement).getPropertyValue("--vscode-editor-foreground").trim() || "#000000";
	const base = {
		...titles.chart && { title: {
			text: titles.chart,
			top: 0,
			left: "center",
			textStyle: {
				color: foreground_color,
				fontSize: 16,
				fontWeight: "normal",
				overflow: "breakAll"
			}
		} },
		tooltip: {
			trigger: "axis",
			axisPointer: {
				type: "cross",
				label: { borderRadius: 0 }
			},
			borderRadius: 0
		},
		legend: {
			data: col_labels.map(String),
			top: 0,
			right: 10,
			icon: "rect",
			textStyle: {
				color: foreground_color,
				overflow: "breakAll"
			}
		},
		grid: {
			top: multi_y_axes ? 40 : 20,
			bottom: 0,
			left: 10,
			right: 10,
			outerBoundsMode: "same"
		},
		animation: false
	};
	const axis_style = {
		axisLine: {},
		splitLine: { lineStyle: {
			color: "#80808050",
			width: .5
		} },
		nameTextStyle: {
			fontSize: 12,
			padding: [
				0,
				10,
				0,
				10
			]
		},
		nameLocation: "middle",
		nameGap: 10,
		axisTick: {
			show: true,
			alignWithLabel: true
		},
		axisLabel: {
			interval: "auto",
			hideOverlap: true,
			formatter(value, index) {
				if (typeof value === "string" && value.length > 10) return value.truncate(10);
				return value;
			}
		}
	};
	switch (charttype) {
		case DdbChartType.line: if (!multi_y_axes) return {
			...base,
			xAxis: {
				type: "category",
				name: titles.x_axis,
				data: [...new Set(data.map((item) => item.row))],
				...axis_style
			},
			yAxis: {
				type: "value",
				name: titles.y_axis,
				scale: auto_scale_y_axes,
				...axis_style
			},
			series: col_labels.map((label) => ({
				name: String(label),
				type: "line",
				stack: stacking ? "total" : void 0,
				data: data.filter((d) => d.col === label).map((d) => d.value),
				symbol: "none",
				smooth: false
			}))
		};
		else return {
			...base,
			xAxis: {
				...axis_style,
				type: "category",
				name: titles.x_axis,
				data: data.map((d) => d.row)
			},
			yAxis: col_labels.map((label, index) => ({
				...axis_style,
				type: "value",
				position: index % 2 ? "right" : "left",
				offset: Math.floor(index / 2) * 30,
				name: label,
				nameLocation: "end",
				nameGap: 20 + Math.floor(index / 2) * 20,
				alignTicks: true,
				axisLabel: { margin: 8 },
				scale: auto_scale_y_axes
			})),
			series: col_labels.map((label, index) => ({
				name: String(label),
				type: "line",
				yAxisIndex: index,
				data: data.map((d) => d[label]),
				symbol: "none",
				smooth: false
			}))
		};
		case DdbChartType.column: return {
			...base,
			xAxis: {
				...axis_style,
				type: "category",
				name: titles.x_axis,
				data: unique(data.map((item) => item.row))
			},
			yAxis: {
				...axis_style,
				type: "value",
				name: titles.y_axis,
				scale: auto_scale_y_axes
			},
			series: col_labels.map((label) => ({
				name: label,
				type: "bar",
				stack: stacking ? "total" : void 0,
				data: data.filter((d) => d.col === label).map((d) => d.value)
			}))
		};
		case DdbChartType.bar: return {
			...base,
			xAxis: {
				...axis_style,
				type: "value",
				name: titles.y_axis
			},
			yAxis: {
				...axis_style,
				type: "category",
				name: titles.x_axis,
				data: unique(data.map((item) => item.row))
			},
			series: col_labels.map((label) => ({
				name: label,
				type: "bar",
				stack: stacking ? "total" : void 0,
				data: data.filter((d) => d.col === label).map((d) => d.value)
			}))
		};
		case DdbChartType.pie: return {
			...base,
			series: [{
				type: "pie",
				radius: "90%",
				data: data.map((d) => ({
					name: d.row,
					value: d.value
				})),
				label: {
					formatter(params) {
						return `${params.name}: ${params.percent.toFixed(2)}%`;
					},
					backgroundColor: "transparent",
					color: "#888888"
				}
			}]
		};
		case DdbChartType.area: return {
			...base,
			xAxis: {
				...axis_style,
				type: "category",
				name: titles.x_axis,
				data: [...new Set(data.map((item) => item.row))]
			},
			yAxis: {
				...axis_style,
				type: "value",
				name: titles.y_axis,
				scale: auto_scale_y_axes
			},
			series: col_labels.map((label) => ({
				name: label,
				type: "line",
				areaStyle: {},
				stack: stacking ? "total" : void 0,
				data: data.filter((d) => d.col === label).map((d) => d.value),
				symbol: "none",
				smooth: false
			}))
		};
		case DdbChartType.scatter: return {
			...base,
			legend: null,
			tooltip: {
				trigger: "item",
				formatter: function(params) {
					return `X : ${params.data[0]}<br/>
                                Y : ${params.data[1]}`;
				}
			},
			xAxis: {
				...axis_style,
				type: "value",
				name: titles.x_axis
			},
			yAxis: {
				...axis_style,
				type: "value",
				name: titles.y_axis,
				scale: auto_scale_y_axes
			},
			series: col_labels.map((label) => ({
				name: label,
				type: "scatter",
				data: data.filter((d) => d.col === label).map((d) => [d.row, d.value])
			}))
		};
		case DdbChartType.histogram:
			const values = data.map((d) => d.value);
			const minValue = config.bin_start ? Number(config.bin_start.value) : values.min();
			const maxValue = config.bin_end ? Number(config.bin_end.value) : values.max();
			const xMin = Math.floor(minValue);
			const xMax = Math.ceil(maxValue);
			const binCount = config.bin_count ? Number(config.bin_count.value) : 30;
			const binWidth = (maxValue - minValue) / binCount;
			const bins = new Array(binCount).fill(0);
			values.forEach((value) => {
				if (value >= minValue && value <= maxValue) {
					const binIndex = Math.min(Math.floor((value - minValue) / binWidth), binCount - 1);
					bins[binIndex]++;
				}
			});
			return {
				...base,
				tooltip: { formatter: (params) => {
					const i = params.dataIndex;
					const start = minValue + i * binWidth;
					const end = minValue + (i + 1) * binWidth;
					const count = bins[i];
					const percentage = (count / values.length * 100).toFixed(2);
					return `[${start.toFixed(2)}, ${end.toFixed(2)}]: ${percentage}% (${count})`;
				} },
				xAxis: {
					...axis_style,
					type: "value",
					name: !titles.x_axis || titles.x_axis === "" ? t("区间") : titles.x_axis,
					min: xMin,
					max: xMax
				},
				yAxis: {
					...axis_style,
					type: "value",
					name: !titles.y_axis || titles.y_axis === "" ? t("频次") : titles.y_axis,
					scale: auto_scale_y_axes
				},
				series: [{
					type: "custom",
					renderItem: (params, api) => ({
						type: "rect",
						shape: {
							x: api.coord([minValue + params.dataIndex * binWidth, 0])[0],
							y: api.coord([0, api.value(0)])[1],
							width: api.size([binWidth, 0])[0],
							height: api.size([0, api.value(0)])[1]
						},
						style: api.style()
					}),
					data: bins
				}]
			};
		case DdbChartType.kline: return {
			...base,
			xAxis: {
				...axis_style,
				type: "category",
				name: titles.x_axis,
				data: data.map((d) => d.row_)
			},
			yAxis: [{
				...axis_style,
				type: "value",
				name: titles.y_axis,
				scale: auto_scale_y_axes
			}, {
				...axis_style,
				type: "value",
				name: t("成交量"),
				scale: auto_scale_y_axes
			}],
			series: [{
				type: "candlestick",
				data: data.map((d) => [
					d.open,
					d.close,
					d.low,
					d.high
				])
			}, ...data[0].vol ? [{
				name: t("成交量"),
				type: "bar",
				yAxisIndex: 1,
				data: data.map((d) => d.vol)
			}] : []]
		};
		default: return base;
	}
}
function EChartsComponent({ option }) {
	let rchart = (0, import_external__react.useRef)(null);
	let chart = (0, import_external__react.useRef)(null);
	(0, import_external__react.useEffect)(() => {
		if (rchart.current) {
			chart.current = import_external__echarts.init(rchart.current);
			chart.current.setOption(option);
		}
		let observer;
		if (rchart.current) {
			observer = new ResizeObserver(() => {
				chart.current?.resize();
			});
			observer.observe(rchart.current);
		}
		return () => {
			chart.current?.dispose();
			observer?.disconnect();
		};
	}, [option]);
	(0, import_external__react.useEffect)(() => {
		chart.current?.setOption(option);
	}, [option]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		ref: rchart,
		className: "chart-body",
		style: {
			width: "100%",
			height: "100%"
		}
	});
}

//#endregion
//#region src/icons/favicon.italic.svg
var favicon_italic_default = "data:image/svg+xml,<?xml version=\"1.0\" encoding=\"UTF-8\"?><svg id=\"_图层_1\" xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" viewBox=\"0 0 85.33 87.59\"><defs><style>.cls-1{fill:url(%23_未命名的渐变_43);}</style><radialGradient id=\"_未命名的渐变_43\" cx=\"24.65\" cy=\".43\" fx=\"24.65\" fy=\".43\" r=\"82.28\" gradientUnits=\"userSpaceOnUse\"><stop offset=\"0\" stop-color=\"%2300a0cd\"/><stop offset=\".42\" stop-color=\"%23009199\"/><stop offset=\"1\" stop-color=\"%231e247e\"/></radialGradient></defs><path class=\"cls-1\" d=\"M64.18,2.31H31.81L4.59,84.61h32.37c5.39,0,10.97-1.83,16-4.92,2.79-2.21,4.49-4.51,5.2-5.7,3.92-6.49,1.38-14.31-.15-16.55-2.29-3.38-5.88-6.53-11.47-8.54-.07-.02-.2,0-.19.13.08.92.41,4.7.89,6.54.07.27.13.63-.04.53-1-.59-4.7-3.12-6.08-9.31-1.61-7.2-10.89-9.16-11.37-9.24-.48-.08-4.82-.86-4.47-1.81,0,0,.45-1.74,3.86-1.58,3.45.17,2.66-3.27,7.82-3.5,5.16-.23,15.42,3.51,21.03,6.78,5.62,3.27,11.99-.11,14.87,2.46,2.89,2.57-5.93.9-5.95,4.59-.02,3.69,2.62,8.07,2.05,15.27-.02.29-.05.58-.08.87.09-.26.18-.52.27-.78l10.85-32.79c4.52-13.67-2.57-24.75-15.84-24.75Z\"/></svg>";

//#endregion
//#region src/icons/favicon.png
var favicon_default = "data:image/png;base64,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";

//#endregion
//#region src/utils.common.ts
function apply_favicon(shf) {
	let link = document.createElement("link");
	link.rel = "icon";
	link.type = shf ? "image/png" : "image/svg+xml";
	link.href = shf ? favicon_default : favicon_italic_default;
	document.head.appendChild(link);
	return link;
}

//#endregion
//#region src/window.tsx
const locales = {
	zh: localeValues,
	en: import_en_US.default,
	ja: import_ja_JP.default,
	ko: import_ko_KR.default
};
var WindowModel = class extends Model {
	obj;
	objref;
	remote;
	ddb;
	options;
	product_name = "DolphinDB";
	assets_root;
};
let model = window.model = new WindowModel();
(0, import_client.createRoot)(document.querySelector(".root")).render(/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Root, {}));
function Root() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_external__antd.ConfigProvider, {
		prefixCls: "",
		locale: locales[language],
		button: { autoInsertSpace: false },
		theme: {
			hashed: false,
			token: {
				borderRadius: 0,
				motion: false
			}
		},
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_external__antd.App, {
			className: "app",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DdbObjWindow, {})
		})
	});
}
function DdbObjWindow() {
	const { obj, objref, remote, ddb, options, product_name, assets_root } = model.use([
		"obj",
		"objref",
		"remote",
		"ddb",
		"options",
		"product_name",
		"assets_root"
	]);
	Object.assign(model, import_external__antd.App.useApp());
	(0, import_external__react.useEffect)(() => {
		(async () => {
			let i = 0;
			while (!window.resolve) {
				if (i >= 10) return;
				await delay$1(200);
				++i;
			}
			window.resolve();
		})();
	}, []);
	(0, import_external__react.useEffect)(() => {
		if (!obj && !objref) return;
		const { name, form } = obj || objref;
		document.title = `${name || DdbForm[form]} - ${product_name}`;
		(async () => {
			await delay$1(200);
			const $table = document.querySelector("table");
			if (!$table) return;
			window.resizeTo(Math.min($table.offsetWidth + 40, screen.width - 100), Math.min($table.offsetHeight + 140, screen.height - 100));
		})();
	}, [
		obj,
		objref,
		product_name
	]);
	(0, import_external__react.useEffect)(() => {
		apply_favicon(storage.getstr("ddb.shf") === "1");
	}, []);
	if (!obj && !objref) return null;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "obj-result themed window",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Obj, {
			obj,
			objref,
			ctx: "window",
			remote,
			ddb,
			ddb_language: ddb?.language,
			options,
			product_name,
			assets_root,
			dark: false
		})
	});
}

//#endregion
export { WindowModel };