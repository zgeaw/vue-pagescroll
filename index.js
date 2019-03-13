(function() {
    'use strict'

    let fullpage = {
        opt: {
            start: 0,
            duration: 500,
            loop: false,
            dir: 'v',
            der: 0.1,
            movingFlag: false,
            preventWechat: false,
            needInitAfterUpdated: false,
            beforeChange(data){},
            afterChange(data){}
        },
        install(Vue, options){        
            Vue.directive('fullpage', {
                inserted: (el, binding, vnode) => {
                    let opts = binding.value || {}
                    this.init(el, opts, vnode)
                },
                componentUpdated: (el, binding, vnode) => {
                    if (!this.opt.needInitAfterUpdated) {
                        return
                    }
                    let opts = binding.value || {}
                    this.init(el, opts, vnode)
                }
            })

            Vue.directive('animate', {
                inserted: (el, binding, vnode) => {
                    if (binding.value) {
                        this.initAnimate(el, binding, vnode)
                    }
                }
            })
        },
        initAnimate(el, binding, vnode){
            let vm = vnode.context
            let aminate = binding.value
            el.style.opacity = '0'
            vm.$on('toogle_animate', (curIndex) => {
                let parent = el.parentNode
                while(parent.getAttribute('data-id') === null) {
                    parent = parent.parentNode
                }
                let curPage = +parent.getAttribute('data-id')
                if (curIndex === curPage) {
                    this.addAnimated(el, aminate)
                } else {
                    el.style.opacity = '0'
                    this.removeAnimated(el, aminate)
                }
            })
        },
        addAnimated(el, animate){
            let delay = animate.delay || 0
            el.classList.add('animated')
            window.setTimeout(() => {
                el.style.opacity = '1'
                el.classList.add(animate.value)
            }, delay)
        },
        removeAnimated(el, animate){
            let classes = el.getAttribute('class')
            if (classes && classes.indexOf('animated') > -1) {
                el.classList.remove(animate.value)
            }
        },
        assignOpts(option){
            let opt = option || {}
            for (let key in opt) {
                if (!opt.hasOwnProperty(key)) {
                    opt[key] = opt[key]
                }
            }
            if(JSON.stringify(opt) != '{}'){
                this.opt = opt
            }
        },
        initScrollDirection(){
            if (this.opt.dir !== 'v') {
                this.el.classList.add('fullpage-wp-h')
            }
        },
        init(el, options, vnode){
            this.assignOpts(options)
            this.vm = vnode.context
            this.vm.$fullpage = this
            this.curIndex = this.opt.start
            this.startY = 0
            this.opt.movingFlag = false
            this.el = el
            this.el.classList.add('fullpage-wp')
            this.parentEle = this.el.parentNode
            this.parentEle.classList.add('fullpage-container')
            this.pageEles = this.el.children
            this.total = this.pageEles.length
            this.initScrollDirection()
            window.setTimeout(() => {
                this.width = this.parentEle.offsetWidth
                this.height = this.parentEle.offsetHeight

                for (let i = 0; i < this.pageEles.length; i++) {
                    let pageEle = this.pageEles[i]
                    pageEle.setAttribute('data-id', i)
                    pageEle.classList.add('page')
                    pageEle.style.width = this.width + 'px'
                    pageEle.style.height = this.height + 'px'
                    this.initEvent(pageEle)
                }
                this.moveTo(this.curIndex, false)
            }, 0)
        },
        initEvent(el){
            this.prevIndex = this.curIndex
            el.addEventListener('touchstart', e => {
                if (this.opt.movingFlag) {
                    return false
                }
                this.startX = e.targetTouches[0].pageX
                this.startY = e.targetTouches[0].pageY
            })
            el.addEventListener('touchend', e => {
                if (this.opt.movingFlag) {
                    return false
                }
                let dir = this.opt.dir
                let sub = dir === 'v' ? (e.changedTouches[0].pageY - this.startY) / this.height : (e.changedTouches[0].pageX - this.startX) / this.width
                let der = sub > this.opt.der ? -1 : sub < -this.opt.der ? 1 : 0
                // this.curIndex推迟到moveTo执行完之后再更新
                let nextIndex = this.curIndex + der

                if (nextIndex >= 0 && nextIndex < this.total) {
                    this.moveTo(nextIndex, true)
                } else {
                    if (this.opt.loop) {
                        nextIndex = nextIndex < 0 ? this.total - 1 : 0
                        this.moveTo(nextIndex, true)
                    } else {
                        this.curIndex = nextIndex < 0 ? 0 : this.total - 1
                    }
                }
            })
            if (this.opt.preventWechat) {
                el.addEventListener('touchmove', e => {
                    e.preventDefault()
                })
            }
        },
        moveTo(curIndex, anim){
            let dist = this.opt.dir === 'v' ? (curIndex) * (-this.height) : curIndex * (-this.width)
            this.opt.movingFlag = true
            let flag = this.opt.beforeChange(this.prevIndex, curIndex)
            if (flag === false) {
                // 重置movingFlag
                this.opt.movingFlag = false
                return false
            }
            this.curIndex = curIndex

            if (anim) {
                this.el.classList.add('anim')
            } else {
                this.el.classList.remove('anim')
            }

            this.move(dist)
            window.setTimeout(() => {
                this.opt.afterChange(this.prevIndex, curIndex)
                this.opt.movingFlag = false
                this.prevIndex = curIndex
                this.vm.$emit('toogle_animate', curIndex)
            }, this.opt.duration)
        },
        move(dist){
            let xPx = '0px'
            let yPx = '0px'
            if (this.opt.dir === 'v') {
                yPx = dist + 'px'
            } else {
                xPx = dist + 'px'
            }
            this.el.style.cssText += ('-webkit-transform:translate3d(' + xPx + ', ' + yPx + ', 0px);transform:translate3d(' + xPx + ', ' + yPx + ', 0px);')
        }
    }

    if (typeof exports === 'object') {
        module.exports = fullpage
    } else if (typeof define === 'function' && define.amd) {
        define([], function() {
            return fullpage
        })
    } else if (window.Vue) {
        window.VueFullpage = fullpage
        Vue.use(fullpage)
    }
})()
