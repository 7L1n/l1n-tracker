import { DefaultOptons,Options,TrackerConfig } from "../types/index";
import { createHistoryEvent } from "../utils/pv"
//监听事件
const MouseEventList: string[] = ['click', 'dblclick', 'contextmenu', 'mousedown', 'mouseup', 'mouseenter', 'mouseout', 'mouseover']
export default class Tracker {
    public data:Options
    constructor(options:Options) {
        this.data = Object.assign(this.initDef(),options)
        this.installTracker()
    }
    private initDef(): DefaultOptons {
        window.history['pushState'] = createHistoryEvent('pushState')
        window.history['replaceState'] = createHistoryEvent('replaceState')
        return <DefaultOptons>{
            sdkVersion:TrackerConfig.version,
            historyTracker: false,
            hashTracker: false,
            domTracker: false,
            jsError: false
        }
    }
    public setUserId<T extends DefaultOptons['uuid']>(uuid:T) {
        this.data.uuid = uuid
    }
    public setExtra<T extends DefaultOptons['extra']>(extra:T) {
        this.data.extra = extra
    }
    //手动上报
    public sendTracker<T>(data:T) {
        this.reportTracker(data)
    }
    //dom点击上报
    private targetKeyReport(){
        MouseEventList.forEach(ev => {
            window.addEventListener(ev, e => {
                const target = e.target as HTMLElement
                const targetKey = target.getAttribute('target-key')
                if(targetKey) {
                    this.reportTracker({
                        event:ev,
                        targetKey
                    })
                }
            })
        })
    }
    private jsError() {
        this.errorEvent()
        this.promiseReject()
    }
    //js报错日志上报
    private errorEvent() {
        window.addEventListener('error', e => {
            this.sendTracker({
                targetKey:'message',
                event:'error',
                message: e.message
            })
        })
    }
    //Promise错误日志上报
    private promiseReject() {
        window.addEventListener('unhandledrejection',e =>{
            e.promise.catch(error => {
                this.sendTracker({
                    targetKey:'reject',
                    event:'promise',
                    message:error
                })
            })
        })
    }
    //自动上报
    private captureEvents <T>(mouseEventList:string[],targetKey:string,data?:T) {
        mouseEventList.forEach(event=>{
            window.addEventListener(event,()=>{
                this.reportTracker({
                    event,
                    targetKey,
                    data
                })
            })
        })
    }

    //初始化重写函数
    private installTracker(){
        //监听history
        if(this.data.historyTracker){
            //把要捕获的事件传入
            //targetKey值由后端来定义，记录事件
            this.captureEvents(['pushState','replaceState','popstate'],'history-pv')
        }
        //监听hash
        if(this.data.hashTracker){
            this.captureEvents(['hashState'],'history-pv')
        }
        //监听dom
        if(this.data.domTracker){
            this.targetKeyReport()
        }
        //监听js和promise错误日志
        if(this.data.jsError){
            this.jsError()
        }
        }

    //上报
    private reportTracker<T>(data:T){
        const params = Object.assign(this.data,data,{time: new Date().getTime()})
        
        //用navigator.sendBeacon来上报 可以在浏览器关闭的时候也上报 因为BodyInit类型不支持JSON所以要改成键值对形式
        //url是被编码（encoded）过的所以用这个请求头
        let headers = {
            type: 'application/x-www-form-urlencoded'
        }
        let blob = new Blob([JSON.stringify(params)],headers)
        navigator.sendBeacon(this.data.requestUrl,blob)
    }    
    }
