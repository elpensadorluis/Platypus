/*global platypus, recycle, springroll, setTimeout */
platypus.Async = (function () {
    'use strict';
    
    var callback = function () {
            this.increment -= 1;
            if (!this.increment) {
                setTimeout(this.finalCallback, 0); //ensure async to keep code flow consistent.
                this.recycle();
            }
        },
        Async = function (arr, finalCallback) {
            var cb = callback.bind(this),
                i = arr.length;

            if (!i) {
                finalCallback();
                this.recycle();
            } else {
                this.increment = i;
                this.finalCallback = finalCallback;

                while (i--) {
                    arr[i](cb);
                }
            }
        };
    
    /**
     * Returns an Async from cache or creates a new one if none are available.
     *
     * @method Async.setUp
     * @return {platypus.Async} The instantiated Async.
     */
    /**
     * Returns an Async back to the cache.
     *
     * @method Async.recycle
     * @param async {platypus.Async} The Async to be recycled.
     */
    /**
     * Relinquishes properties of the Async and recycles it.
     *
     * @method recycle
     */
    recycle.add(Async, !!springroll.Debug, 'Async', function () {
        this.increment = 0;
        this.finalCallback = null;
    });

    return Async;
}());