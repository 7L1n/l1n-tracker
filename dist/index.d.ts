/**
 * @requestUrl 接口地址
 * @historyTracker history上报
 * @hashTracker hash上报
 * @domTracker 携带Tracker-key 点击事件上报
 * @sdkVersionsdk 版本
 * @extra 透传字段
 * @jsError js 和 promise 报错异常上报
 */
interface DefaultOptons {
    uuid: string | undefined;
    requestUrl: string | undefined;
    historyTracker: boolean;
    hashTracker: boolean;
    domTracker: boolean;
    sdkVersion: string | number;
    extra: Record<string, any> | undefined;
    jsError: boolean;
}
interface Options extends Partial<DefaultOptons> {
    requestUrl: string;
}

declare class Tracker {
    data: Options;
    constructor(options: Options);
    private initDef;
    setUserId<T extends DefaultOptons['uuid']>(uuid: T): void;
    setExtra<T extends DefaultOptons['extra']>(extra: T): void;
    sendTracker<T>(data: T): void;
    private targetKeyReport;
    private jsError;
    private errorEvent;
    private promiseReject;
    private captureEvents;
    private installTracker;
    private reportTracker;
}

export { Tracker as default };
