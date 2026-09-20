/* ========================================================================
   ScrollStack — vanilla JS + Lenis port of the React Bits <ScrollStack />
   component (https://reactbits.dev), for use without React.
   ======================================================================== */

(function (global) {
    'use strict';

    function ScrollStack(scroller, options) {
        options = options || {};

        this.scroller = scroller;
        this.itemDistance = options.itemDistance != null ? options.itemDistance : 100;
        this.itemScale = options.itemScale != null ? options.itemScale : 0.03;
        this.itemStackDistance = options.itemStackDistance != null ? options.itemStackDistance : 30;
        this.stackPosition = options.stackPosition != null ? options.stackPosition : '20%';
        this.scaleEndPosition = options.scaleEndPosition != null ? options.scaleEndPosition : '10%';
        this.baseScale = options.baseScale != null ? options.baseScale : 0.85;
        this.rotationAmount = options.rotationAmount != null ? options.rotationAmount : 0;
        this.blurAmount = options.blurAmount != null ? options.blurAmount : 0;
        this.useWindowScroll = !!options.useWindowScroll;
        this.onStackComplete = options.onStackComplete || null;
        this.reducedMotion = !!options.reducedMotion;

        this.cards = Array.prototype.slice.call(
            this.useWindowScroll
                ? document.querySelectorAll('.scroll-stack-card')
                : scroller.querySelectorAll('.scroll-stack-card')
        );
        this.lastTransforms = new Map();
        this.stackCompleted = false;
        this.isUpdating = false;
        this.lenis = null;
        this.rafId = null;
        this._boundUpdate = this._updateCardTransforms.bind(this);

        this._init();
    }

    ScrollStack.prototype._calculateProgress = function (scrollTop, start, end) {
        if (scrollTop < start) return 0;
        if (scrollTop > end) return 1;
        return (scrollTop - start) / (end - start);
    };

    ScrollStack.prototype._parsePercentage = function (value, containerHeight) {
        if (typeof value === 'string' && value.indexOf('%') !== -1) {
            return (parseFloat(value) / 100) * containerHeight;
        }
        return parseFloat(value);
    };

    ScrollStack.prototype._getScrollData = function () {
        if (this.useWindowScroll) {
            return { scrollTop: window.scrollY, containerHeight: window.innerHeight };
        }
        return { scrollTop: this.scroller.scrollTop, containerHeight: this.scroller.clientHeight };
    };

    ScrollStack.prototype._getElementOffset = function (element) {
        if (this.useWindowScroll) {
            return element.getBoundingClientRect().top + window.scrollY;
        }
        return element.offsetTop;
    };

    ScrollStack.prototype._updateCardTransforms = function () {
        if (!this.cards.length || this.isUpdating) return;
        this.isUpdating = true;

        var self = this;
        var data = this._getScrollData();
        var scrollTop = data.scrollTop;
        var containerHeight = data.containerHeight;
        var stackPositionPx = this._parsePercentage(this.stackPosition, containerHeight);
        var scaleEndPositionPx = this._parsePercentage(this.scaleEndPosition, containerHeight);

        var endElement = this.useWindowScroll
            ? document.querySelector('.scroll-stack-end')
            : this.scroller.querySelector('.scroll-stack-end');
        var endElementTop = endElement ? this._getElementOffset(endElement) : 0;

        this.cards.forEach(function (card, i) {
            var cardTop = self._getElementOffset(card);
            var triggerStart = cardTop - stackPositionPx - self.itemStackDistance * i;
            var triggerEnd = cardTop - scaleEndPositionPx;
            var pinStart = cardTop - stackPositionPx - self.itemStackDistance * i;
            var pinEnd = endElementTop - containerHeight / 2;

            var scaleProgress = self._calculateProgress(scrollTop, triggerStart, triggerEnd);
            var targetScale = self.baseScale + i * self.itemScale;
            var scale = 1 - scaleProgress * (1 - targetScale);
            var rotation = self.rotationAmount ? i * self.rotationAmount * scaleProgress : 0;

            var blur = 0;
            if (self.blurAmount) {
                var topCardIndex = 0;
                for (var j = 0; j < self.cards.length; j++) {
                    var jCardTop = self._getElementOffset(self.cards[j]);
                    var jTriggerStart = jCardTop - stackPositionPx - self.itemStackDistance * j;
                    if (scrollTop >= jTriggerStart) topCardIndex = j;
                }
                if (i < topCardIndex) {
                    blur = Math.max(0, (topCardIndex - i) * self.blurAmount);
                }
            }

            var translateY = 0;
            var isPinned = scrollTop >= pinStart && scrollTop <= pinEnd;
            if (isPinned) {
                translateY = scrollTop - cardTop + stackPositionPx + self.itemStackDistance * i;
            } else if (scrollTop > pinEnd) {
                translateY = pinEnd - cardTop + stackPositionPx + self.itemStackDistance * i;
            }

            var newTransform = {
                translateY: Math.round(translateY * 100) / 100,
                scale: Math.round(scale * 1000) / 1000,
                rotation: Math.round(rotation * 100) / 100,
                blur: Math.round(blur * 100) / 100
            };

            var last = self.lastTransforms.get(i);
            var changed = !last ||
                Math.abs(last.translateY - newTransform.translateY) > 0.1 ||
                Math.abs(last.scale - newTransform.scale) > 0.001 ||
                Math.abs(last.rotation - newTransform.rotation) > 0.1 ||
                Math.abs(last.blur - newTransform.blur) > 0.1;

            if (changed) {
                card.style.transform = 'translate3d(0, ' + newTransform.translateY + 'px, 0) scale(' + newTransform.scale + ') rotate(' + newTransform.rotation + 'deg)';
                card.style.filter = newTransform.blur > 0 ? 'blur(' + newTransform.blur + 'px)' : '';
                self.lastTransforms.set(i, newTransform);
            }

            if (i === self.cards.length - 1) {
                var isInView = scrollTop >= pinStart && scrollTop <= pinEnd;
                if (isInView && !self.stackCompleted) {
                    self.stackCompleted = true;
                    if (self.onStackComplete) self.onStackComplete();
                } else if (!isInView && self.stackCompleted) {
                    self.stackCompleted = false;
                }
            }
        });

        this.isUpdating = false;
    };

    ScrollStack.prototype._setupLenis = function () {
        var self = this;
        var lenisOptions = {
            duration: 1.2,
            easing: function (t) { return Math.min(1, 1.001 - Math.pow(2, -10 * t)); },
            smoothWheel: true,
            touchMultiplier: 2,
            infinite: false,
            wheelMultiplier: 1,
            lerp: 0.1,
            syncTouch: true,
            syncTouchLerp: 0.075
        };

        if (!this.useWindowScroll) {
            lenisOptions.wrapper = this.scroller;
            lenisOptions.content = this.scroller.querySelector('.scroll-stack-inner');
            lenisOptions.gestureOrientationHandler = true;
            lenisOptions.normalizeWheel = true;
            lenisOptions.touchInertiaMultiplier = 35;
            lenisOptions.touchInertia = 0.6;
        }

        var lenis = new Lenis(lenisOptions);
        lenis.on('scroll', this._boundUpdate);

        function raf(time) {
            lenis.raf(time);
            self.rafId = requestAnimationFrame(raf);
        }
        this.rafId = requestAnimationFrame(raf);
        this.lenis = lenis;
    };

    ScrollStack.prototype._init = function () {
        var self = this;

        this.cards.forEach(function (card, i) {
            if (i < self.cards.length - 1) {
                card.style.marginBottom = self.itemDistance + 'px';
            }
            card.style.willChange = 'transform, filter';
            card.style.transformOrigin = 'top center';
            card.style.backfaceVisibility = 'hidden';
            card.style.transform = 'translateZ(0)';
            card.style.perspective = '1000px';
        });

        if (this.reducedMotion) return;

        this._setupLenis();
        this._updateCardTransforms();
    };

    ScrollStack.prototype.destroy = function () {
        if (this.rafId) cancelAnimationFrame(this.rafId);
        if (this.lenis) this.lenis.destroy();
        this.stackCompleted = false;
        this.cards = [];
        this.lastTransforms.clear();
        this.isUpdating = false;
    };

    global.ScrollStack = ScrollStack;
})(window);
