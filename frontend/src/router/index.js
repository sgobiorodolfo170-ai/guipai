import {createRouter, createWebHashHistory} from 'vue-router'

// 路由组件懒加载
const Dashboard = () => import('@/views/dashboard/Dashboard.vue')
const StockList = () => import('@/views/stock/StockList.vue')
const StockDetail = () => import('@/views/stock/StockDetail.vue')
const Watchlist = () => import('@/views/watchlist/Watchlist.vue')
const NoteList = () => import('@/views/note/NoteList.vue')
const NoteDetail = () => import('@/views/note/NoteDetail.vue')
const TemplateList = () => import('@/views/template/TemplateList.vue')
const TemplateEdit = () => import('@/views/template/TemplateEdit.vue')
const Profile = () => import('@/views/user/Profile.vue')
const Settings = () => import('@/views/settings/Settings.vue')
const Review = () => import('@/views/review/Review.vue')
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
                path: 'data-overview',
                name: 'DataOverview',
                component: () => import('@/views/admin/DataOverview.vue'),
                meta: {
                    title: '数据总览'
                }
            },
            {
                path: 'close-data-sync',
                name: 'CloseDataSync',
                component: () => import('@/views/admin/CloseDataSync.vue'),
                meta: {
                    title: '收盘数据同步'
                }
            },
            {
                path: 'stock-data-pull',
                name: 'StockDataPull',
                component: () => import('@/views/admin/StockDataPull.vue'),
                meta: {
                    title: '股票数据拉取'
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
        path: '/profile',
        name: 'Profile',
        component: Profile,
        meta: {
            title: '个人中心',
            icon: 'User'
        }
    },
    {
        path: '/settings',
        name: 'Settings',
        component: Settings,
        meta: {
            title: '设置',
            icon: 'Setting'
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
