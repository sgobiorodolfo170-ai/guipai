// /**
//  * 股票交易日期工具类
//  */
// class StockDateUtil {
//     /**
//      * 获取最近的交易日
//      * @returns {string} 格式：YYYYMMDD
//      */
//     static getRecentTradingDay() {
//         const now = new Date()
//         const hour = now.getHours()
//
//         // 如果是周末，回退到上周五
//         let targetDate = new Date(now)
//
//         // 如果是周六(6)或周日(0)，回退到上周五
//         if (targetDate.getDay() === 0) { // 周日
//             targetDate.setDate(targetDate.getDate() - 2)
//         } else if (targetDate.getDay() === 6) { // 周六
//             targetDate.setDate(targetDate.getDate() - 1)
//         } else if (hour < 15) {
//             // 工作日但还没收盘，使用前一个交易日
//             targetDate.setDate(targetDate.getDate() - 1)
//             // 如果前一天是周末，继续回退
//             if (targetDate.getDay() === 0) { // 周日
//                 targetDate.setDate(targetDate.getDate() - 2)
//             } else if (targetDate.getDay() === 6) { // 周六
//                 targetDate.setDate(targetDate.getDate() - 1)
//             }
//         }
//
//         return this.formatDate(targetDate, 'YYYYMMDD')
//     }
//
//     /**
//      * 获取昨天的交易日
//      * @returns {string} 格式：YYYYMMDD
//      */
//     static getYesterdayTradingDay() {
//         const yesterday = new Date()
//         yesterday.setDate(yesterday.getDate() - 1)
//
//         // 如果昨天是周末，回退到上周五
//         if (yesterday.getDay() === 0) { // 周日
//             yesterday.setDate(yesterday.getDate() - 2)
//         } else if (yesterday.getDay() === 6) { // 周六
//             yesterday.setDate(yesterday.getDate() - 1)
//         }
//
//         return this.formatDate(yesterday, 'YYYYMMDD')
//     }
//
//     /**
//      * 格式化日期
//      * @param {Date} date 日期对象
//      * @param {string} format 格式：YYYY-MM-DD 或 YYYYMMDD
//      * @returns {string} 格式化后的日期字符串
//      */
//     static formatDate(date, format = 'YYYY-MM-DD') {
//         const year = date.getFullYear()
//         const month = String(date.getMonth() + 1).padStart(2, '0')
//         const day = String(date.getDate()).padStart(2, '0')
//
//         if (format === 'YYYYMMDD') {
//             return `${year}${month}${day}`
//         }
//         return `${year}-${month}-${day}`
//     }
//
//     /**
//      * 将YYYYMMDD格式转换为YYYY-MM-DD格式
//      * @param {string} dateStr YYYYMMDD格式的日期字符串
//      * @returns {string} YYYY-MM-DD格式的日期字符串
//      */
//     static formatToStandardDate(dateStr) {
//         if (!dateStr || dateStr.length !== 8) return dateStr
//
//         const year = dateStr.substring(0, 4)
//         const month = dateStr.substring(4, 6)
//         const day = dateStr.substring(6, 8)
//
//         return `${year}-${month}-${day}`
//     }
//
//     /**
//      * 将YYYY-MM-DD格式转换为YYYYMMDD格式
//      * @param {string} dateStr YYYY-MM-DD格式的日期字符串
//      * @returns {string} YYYYMMDD格式的日期字符串
//      */
//     static formatToCompactDate(dateStr) {
//         if (!dateStr) return dateStr
//         return dateStr.replace(/-/g, '')
//     }
//
//     /**
//      * 判断是否为交易日（简单判断，不考虑节假日）
//      * @param {Date|string} date 日期对象或字符串
//      * @returns {boolean} 是否为交易日
//      */
//     static isTradingDay(date) {
//         const targetDate = typeof date === 'string' ? new Date(date) : date
//         const dayOfWeek = targetDate.getDay()
//
//         // 周一到周五为交易日（不考虑节假日）
//         return dayOfWeek >= 1 && dayOfWeek <= 5
//     }
//
//     /**
//      * 获取指定日期前N个交易日的日期列表
//      * @param {number} days 天数
//      * @param {Date} fromDate 起始日期，默认为今天
//      * @returns {string[]} 日期列表，格式：YYYY-MM-DD
//      */
//     static getTradingDays(days, fromDate = new Date()) {
//         const dates = []
//         const currentDate = new Date(fromDate)
//
//         while (dates.length < days) {
//             if (this.isTradingDay(currentDate)) {
//                 dates.push(this.formatDate(currentDate))
//             }
//             currentDate.setDate(currentDate.getDate() - 1)
//         }
//
//         return dates.reverse() // 按时间正序返回
//     }
//
//     /**
//      * 获取日期范围内的所有交易日
//      * @param {string} startDate 开始日期 YYYY-MM-DD
//      * @param {string} endDate 结束日期 YYYY-MM-DD
//      * @returns {string[]} 交易日列表
//      */
//     static getTradingDaysInRange(startDate, endDate) {
//         const dates = []
//         const start = new Date(startDate)
//         const end = new Date(endDate)
//
//         for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
//             if (this.isTradingDay(d)) {
//                 dates.push(this.formatDate(d))
//             }
//         }
//
//         return dates
//     }
//
//     /**
//      * 获取友好的日期显示格式
//      * @param {string} dateStr 日期字符串
//      * @returns {string} 友好格式的日期
//      */
//     static getFriendlyDate(dateStr) {
//         if (!dateStr) return '--'
//
//         const date = new Date(dateStr)
//         const today = new Date()
//         const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000)
//
//         // 格式化为 MM-DD 格式进行比较
//         const dateStr_MMDD = this.formatDate(date).substring(5)
//         const todayStr_MMDD = this.formatDate(today).substring(5)
//         const yesterdayStr_MMDD = this.formatDate(yesterday).substring(5)
//
//         if (dateStr_MMDD === todayStr_MMDD) {
//             return '今天'
//         } else if (dateStr_MMDD === yesterdayStr_MMDD) {
//             return '昨天'
//         } else {
//             return date.toLocaleDateString('zh-CN', {
//                 month: '2-digit',
//                 day: '2-digit',
//                 weekday: 'short'
//             })
//         }
//     }
//
//     /**
//      * 计算两个日期之间的天数差
//      * @param {string} startDate 开始日期
//      * @param {string} endDate 结束日期
//      * @returns {number} 天数差
//      */
//     static getDaysDiff(startDate, endDate) {
//         const start = new Date(startDate)
//         const end = new Date(endDate)
//         const diffTime = Math.abs(end - start)
//         return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
//     }
// }
//
// export default StockDateUtil



//todo 合并

/**
 * A股交易日工具类
 * 核心规则：非周六周日 + 非法定节假日 = 交易日
 * 调休工作日（如周末调为上班日）仍视为非交易日
 */
const StockDateUtil = {
    /**
     * 法定节假日列表（格式：YYYYMMDD）
     * 建议提前维护未来3年节假日，可从交易所公告获取更新
     */
    holidays: [
        // 2023年节假日
        '20230102', '20230122', '20230123', '20230124', '20230125', '20230126', '20230127',
        '20230405', '20230429', '20230430', '20230501', '20230502', '20230503',
        '20230622', '20230623', '20230624',
        '20230929', '20230930', '20231001', '20231002', '20231003', '20231004', '20231005',

        // 2024年节假日
        '20240101', '20240210', '20240211', '20240212', '20240213', '20240214',
        '20240404', '20240405', '20240406',
        '20240501', '20240502', '20240503', '20240504',
        '20240610', '20240611', '20240612',
        '20240915', '20240916', '20240917',
        '20241001', '20241002', '20241003', '20241004', '20241005', '20241006', '20241007',

        // 2025年节假日（示例，需按实际公告更新）
        '20250101', '20250129', '20250130', '20250131', '20250201', '20250202', '20250203',
        '20250404', '20250405', '20250406',
        '20250501', '20250502', '20250503', '20250504',
        '20250608', '20250609', '20250610',
        '20250913', '20250914', '20250915',
        '20251001', '20251002', '20251003', '20251004', '20251005', '20251006', '20251007',
        // 2026年节假日（预测）
        '20260101', // 元旦
        '20260122', '20260123', '20260124', '20260125', '20260126', '20260127', '20260128', // 春节
        '20260405', '20260406', '20260407', // 清明节
        '20260501', '20260502', '20260503', '20260504', // 劳动节
        '20260607', '20260608', '20260609', // 端午节
        '20260912', '20260913', '20260914', // 中秋节
        '20261001', '20261002', '20261003', '20261004', '20261005', '20261006', '20261007', // 国庆节

        // 2027年节假日（预测）
        '20270101', // 元旦
        '20270209', '20270210', '20270211', '20270212', '20270213', '20270214', '20270215', // 春节
        '20270404', '20270405', '20270406', // 清明节
        '20270501', '20270502', '20270503', '20270504', // 劳动节
        '20270626', '20270627', '20270628', // 端午节
        '20270930', '20271001', // 中秋节（与国庆连休）
        '20271002', '20271003', '20271004', '20271005', '20271006', '20271007', // 国庆节

        // 2028年节假日（预测）
        '20280101', // 元旦
        '20280129', '20280130', '20280131', '20280201', '20280202', '20280203', '20280204', // 春节
        '20280403', '20280404', '20280405', // 清明节
        '20280501', '20280502', '20280503', '20280504', // 劳动节
        '20280615', '20280616', '20280617', // 端午节
        '20280918', '20280919', '20280920', // 中秋节
        '20281001', '20281002', '20281003', '20281004', '20281005', '20281006', '20281007' // 国庆节

    ],

    /**
     * 日期格式化：将Date对象转为YYYYMMDD字符串
     * @param {Date} date - 日期对象
     * @returns {string} 格式化后的日期字符串
     */
    formatDate(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0'); // 月份从0开始，补0
        const day = String(date.getDate()).padStart(2, '0'); // 日期补0
        return `${year}${month}${day}`;
    },

    /**
     * 日期解析：将YYYYMMDD字符串转为Date对象
     * @param {string} dateStr - 格式为YYYYMMDD的字符串
     * @returns {Date} 日期对象
     */
    parseDate(dateStr) {
        const year = parseInt(dateStr.slice(0, 4), 10);
        const month = parseInt(dateStr.slice(4, 6), 10) - 1; // 转为0-based月份
        const day = parseInt(dateStr.slice(6, 8), 10);
        return new Date(year, month, day);
    },

    /**
     * 判断日期是否为周末（周六或周日）
     * @param {Date} date - 日期对象
     * @returns {boolean} 是周末返回true，否则false
     */
    isWeekend(date) {
        const day = date.getDay(); // 0=周日，6=周六
        return day === 0 || day === 6;
    },

    /**
     * 判断日期是否为节假日
     * @param {string} dateStr - 格式为YYYYMMDD的字符串
     * @returns {boolean} 是节假日返回true，否则false
     */
    isHoliday(dateStr) {
        return this.holidays.includes(dateStr);
    },

    /**
     * 判断日期是否为交易日
     * @param {string} dateStr - 格式为YYYYMMDD的字符串
     * @returns {boolean} 是交易日返回true，否则false
     */
    isTradingDay(dateStr) {
        const date = this.parseDate(dateStr);
        // 周末或节假日均为非交易日
        if (this.isWeekend(date) || this.isHoliday(dateStr)) {
            return false;
        }
        return true;
    },

    /**
     * 获取今天的日期，若今天非交易日则返回最近的上一个交易日
     * @returns {string} 最近交易日（格式YYYYMMDD）
     */
    getRecentTradingDay() {
        let currentDate = new Date(); // 当前系统日期
        let currentDateStr = this.formatDate(currentDate);

        // 若今天是交易日，直接返回
        if (this.isTradingDay(currentDateStr)) {
            return currentDateStr;
        }

        // 今天非交易日，往前追溯最近的交易日
        while (true) {
            currentDate.setDate(currentDate.getDate() - 1); // 日期减1天
            currentDateStr = this.formatDate(currentDate);
            if (this.isTradingDay(currentDateStr)) {
                return currentDateStr;
            }
        }
    },

    /**
     * 获取上一个交易日（默认基于最近交易日计算）
     * @param {string} [baseDate] - 基准日期（格式YYYYMMDD，默认使用最近交易日）
     * @returns {string} 上一个交易日（格式YYYYMMDD）
     */
    getPreviousTradingDay(baseDate = this.getRecentTradingDay()) {
        let currentDate = this.parseDate(baseDate);
        currentDate.setDate(currentDate.getDate() - 1); // 从基准日期前一天开始找
        let currentDateStr = this.formatDate(currentDate);

        // 循环找前一个交易日
        while (true) {
            if (this.isTradingDay(currentDateStr)) {
                return currentDateStr;
            }
            currentDate.setDate(currentDate.getDate() - 1); // 继续往前找
            currentDateStr = this.formatDate(currentDate);
        }
    }
};

export default StockDateUtil;
