'use strict';

//版本
var TrackerConfig;
(function (TrackerConfig) {
    TrackerConfig["version"] = "1.0.0";
})(TrackerConfig || (TrackerConfig = {}));

const createHistoryEvent = (type) => {
    // history无法通过popstate监听pushState和replaceState 这里是重写函数
    //获取原始函数
    const origin = history[type];
    //this不会传进来 只是假参数
    return function () {
        const res = origin.apply(this, arguments);
        // 发布订阅模式
        // Event创建自定义事件
        // dispatchEvent派发事件
        // addEventListener监听事件
        const e = new Event(type);
        window.dispatchEvent(e);
        return res;
    };
};

//监听事件
const MouseEventList = ['click', 'dblclick', 'contextmenu', 'mousedown', 'mouseup', 'mouseenter', 'mouseout', 'mouseover'];
class Tracker {
    constructor(options) {
        this.data = Object.assign(this.initDef(), options);
        this.installTracker();
    }
    initDef() {
        window.history['pushState'] = createHistoryEvent('pushState');
        window.history['replaceState'] = createHistoryEvent('replaceState');
        return {
            sdkVersion: TrackerConfig.version,
            historyTracker: false,
            hashTracker: false,
            domTracker: false,
            jsError: false
        };
    }
    setUserId(uuid) {
        this.data.uuid = uuid;
    }
    setExtra(extra) {
        this.data.extra = extra;
    }
    //手动上报
    sendTracker(data) {
        this.reportTracker(data);
    }
    //dom点击上报
    targetKeyReport() {
        MouseEventList.forEach(ev => {
            window.addEventListener(ev, e => {
                const target = e.target;
                const targetKey = target.getAttribute('target-key');
                if (targetKey) {
                    this.reportTracker({
                        event: ev,
                        targetKey
                    });
                }
            });
        });
    }
    jsError() {
        this.errorEvent();
        this.promiseReject();
    }
    //js报错日志上报
    errorEvent() {
        window.addEventListener('error', e => {
            this.sendTracker({
                targetKey: 'message',
                event: 'error',
                message: e.message
            });
        });
    }
    //Promise错误日志上报
    promiseReject() {
        window.addEventListener('unhandledrejection', e => {
            e.promise.catch(error => {
                this.sendTracker({
                    targetKey: 'reject',
                    event: 'promise',
                    message: error
                });
            });
        });
    }
    //自动上报
    captureEvents(mouseEventList, targetKey, data) {
        mouseEventList.forEach(event => {
            window.addEventListener(event, () => {
                console.log('监听事件操作');
                this.reportTracker({
                    event,
                    targetKey,
                    data
                });
            });
        });
    }
    //初始化重写函数
    installTracker() {
        //监听history
        if (this.data.historyTracker) {
            //把要捕获的事件传入
            //targetKey值由后端来定义，记录事件
            this.captureEvents(['pushState', 'replaceState', 'popstate'], 'history-pv');
        }
        //监听hash
        if (this.data.hashTracker) {
            this.captureEvents(['hashState'], 'history-pv');
        }
        //监听dom
        if (this.data.domTracker) {
            this.targetKeyReport();
        }
        //监听js和promise错误日志
        if (this.data.jsError) {
            this.jsError();
        }
    }
    //上报
    reportTracker(data) {
        const params = Object.assign(this.data, data, { time: new Date().getTime() });
        //用navigator.sendBeacon来上报 可以在浏览器关闭的时候也上报 因为BodyInit类型不支持JSON所以要改成键值对形式
        //url是被编码（encoded）过的所以用这个请求头
        let headers = {
            type: 'application/x-www-form-urlencoded'
        };
        let blob = new Blob([JSON.stringify(params)], headers);
        navigator.sendBeacon(this.data.requestUrl, blob);
    }
}

module.exports = Tracker;
