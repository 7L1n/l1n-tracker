export const createHistoryEvent = <T extends keyof History>(type:T) => {
    // history无法通过popstate监听pushState和replaceState 这里是重写函数
    //获取原始函数
    const origin = history[type]
    //this不会传进来 只是假参数

    return function (this:any) {
        const res = origin.apply(this,arguments)
        // 发布订阅模式
        // Event创建自定义事件
        // dispatchEvent派发事件
        // addEventListener监听事件
        const e = new Event(type)
        window.dispatchEvent(e)
        return res
    }
}