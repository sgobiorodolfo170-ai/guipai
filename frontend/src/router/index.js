import {createRouter, createWebHashHistory} from 'vue-router'

// 路由组件懒加载
const Dashboard = () => import('@/views/dashboard/Dashboard.vue')
const StockList = () => import('@/views/stock/StockList.vue')
const StockDetail = () => import('@/views/stock/StockDetail.vue')
const StockAnalysis = () => import('@/views/stock/StockAnalysis.vue')
const Watchlist = () => import('@/views/watchlist/Watchlist.vue')
const NoteList = () => import('@/views/note/NoteList.vue')
const NoteDetail = () => import('@/views/note/NoteDetail.vue')
const TemplateList = () => import('@/views/template/TemplateList.vue')
const TemplateEdit = () => import('@/views/template/TemplateEdit.vue')
const Profile = () => import('@/views/user/Profile.vue')
const ApiTest = () => import('@/views/test/ApiTest.vue')
const Review = () => import('@/views/review/Review.vue')
const KTest = () => import('@/views/test/KTest.vue')
const AI = () => import('@/components/common/KLine.vue')
const DataManagement = () => import('@/views/admin/DataManagement.vue')
const DataManagementTest = () => import('@/views/test/DataManagementTest.vue')
const KlinePractice = () => import('@/views/kline-practice/RandomStockPractice.vue')

const routes = [
    {
        path: '/',
        redirect: '/dashboard'
    },
    {
        path: '/dashboard',
        name: 'Dashboard',
        component: Dashboard,
        meta: {
            title: '仪表盘',
            icon: 'Dashboard'
        }
    },
    {
        path: '/Review',
        name: 'Review',
        component: Review,
        meta: {
            title: '复盘',
            icon: 'Review'
        }
    },
    {
        path: '/kline-practice',
        name: 'KlinePractice',
        meta: {
            title: 'K线实战',
            icon: 'TrendCharts'
        },
        children: [
            {
                path: 'random-stock',
                name: 'RandomStockPractice',
                component: KlinePractice,
                meta: {
                    title: 'A股随机K线实战'
                }
            }
        ]
    },
    {
        path: '/admin',
        name: 'Admin',
        meta: {
            title: '数据管理',
            icon: 'Setting'
        },
        children: [
            {
                path: 'data-management',
                name: 'DataManagement',
                component: DataManagement,
                meta: {
                    title: '复盘数据任务表'
                }
            },
            {
                path: 'error-log',
                name: 'ErrorLog',
                component: () => import('@/views/admin/ErrorLog.vue'),
                meta: {
                    title: '报错日志'
                }
            }
        ]
    },
    {
        path: '/stocks',
        name: 'Stocks',
        meta: {
            title: '股票',
            icon: 'TrendCharts'
        },
        children: [
            {
                path: '',
                name: 'StockList',
                component: StockList,
                meta: {
                    title: '股票列表'
                }
            },
            {
                path: ':code',
                name: 'StockDetail',
                component: StockDetail,
                meta: {
                    title: '股票详情',
                    hideInMenu: true
                }
            },
            {
                path: ':code/analysis',
                name: 'StockAnalysis',
                component: StockAnalysis,
                meta: {
                    title: '股票分析',
                    hideInMenu: true
                }
            }
        ]
    },
    {
        path: '/watchlist',
        name: 'Watchlist',
        component: Watchlist,
        meta: {
            title: '自选股',
            icon: 'Star'
        }
    },
    {
        path: '/notes',
        name: 'Notes',
        meta: {
            title: '笔记',
            icon: 'Document'
        },
        children: [
            {
                path: '',
                name: 'NoteList',
                component: NoteList,
                meta: {
                    title: '笔记列表'
                }
            },
            {
                path: 'create',
                name: 'NoteCreate',
                component: NoteDetail,
                meta: {
                    title: '创建笔记',
                    hideInMenu: true
                }
            },
            {
                path: ':id',
                name: 'NoteDetail',
                component: NoteDetail,
                meta: {
                    title: '笔记详情',
                    hideInMenu: true
                }
            }
        ]
    },
    {
        path: '/templates',
        name: 'Templates',
        meta: {
            title: '模板',
            icon: 'Files'
        },
        children: [
            {
                path: '',
                name: 'TemplateList',
                component: TemplateList,
                meta: {
                    title: '模板列表'
                }
            },
            {
                path: 'create',
                name: 'TemplateCreate',
                component: TemplateEdit,
                meta: {
                    title: '创建模板',
                    hideInMenu: true
                }
            },
            {
                path: ':id/edit',
                name: 'TemplateEdit',
                component: TemplateEdit,
                meta: {
                    title: '编辑模板',
                    hideInMenu: true
                }
            }
        ]
    },
    {
        path: '/test',
        name: 'Test',
        meta: {
            title: 'API测试',
            icon: 'Setting'
        },
        children: [
            {
                path: '/api',
                name: 'ApiTest',
                component: ApiTest,
                meta: {
                    title: 'API测试'
                }
            },{
                path: '/kTest',
                name: 'KTest',
                component: KTest,
                meta: {
                    title: 'K线模版'
                }
            },{
                path: '/AI',
                name: 'AI',
                component: AI,
                meta: {
                    title: 'AI生成的页面'
                }
            },{
                path: '/data-test',
                name: 'DataManagementTest',
                component: DataManagementTest,
                meta: {
                    title: '数据管理测试'
                }
            },

        ]
    },
    {
        path: '/profile',
        name: 'Profile',
        component: Profile,
        meta: {
            title: '个人中心',
            icon: 'User'
        }
    },
    {
        path: '/:pathMatch(.*)*',
        name: 'NotFound',
        component: () => import('@/views/error/NotFound.vue'),
        meta: {
            title: '页面不存在',
            hideInMenu: true
        }
    }
]

const router = createRouter({
    history: createWebHashHistory(),
    routes,
    scrollBehavior(to, from, savedPosition) {
        if (savedPosition) {
            return savedPosition
        } else {
            return {top: 0}
        }
    }
})

router.beforeEach((to, from, next) => {
    if (to.meta.title) {
        document.title = `${to.meta.title} - 龟派`
    }
    next()
})

export default router
