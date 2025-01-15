export class RejectablePromise {
  promise: Promise<any>;
  resolve: any;
  reject: any;
  constructor() {
    let outerResolve, outerReject;
    const promise = new Promise((innerResolve, innerReject) => {
      outerResolve = innerResolve;
      outerReject = innerReject;
    });
    this.promise = promise;
    this.resolve = outerResolve;
    this.reject = outerReject;
  }
}
