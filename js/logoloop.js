/* ========================================================================
   LogoLoop — vanilla JS port of the React Bits <LogoLoop /> component
   (https://reactbits.dev), for use without React.
   ======================================================================== */

(function (global) {
    'use strict';

    var MIN_COPIES = 2;
    var COPY_HEADROOM = 2;
    var SMOOTH_TAU = 0.25;

    function toCssLength(value) {
        return typeof value === 'number' ? value + 'px' : value;
    }

    function LogoLoop(container, options) {
        options = options || {};

        this.container = container;
        this.logos = options.logos || [];
        this.speed = options.speed != null ? options.speed : 120;
        this.direction = options.direction || 'left';
        this.width = options.width != null ? options.width : '100%';
        this.logoHeight = options.logoHeight != null ? options.logoHeight : 28;
        this.gap = options.gap != null ? options.gap : 32;
        this.hoverSpeed = options.hoverSpeed !== undefined ? options.hoverSpeed : 0;
        this.fadeOut = !!options.fadeOut;
        this.fadeOutColor = options.fadeOutColor || null;
        this.scaleOnHover = !!options.scaleOnHover;
        this.ariaLabel = options.ariaLabel || 'Partner logos';
        this.className = options.className || '';

        this.isVertical = this.direction === 'up' || this.direction === 'down';

        var magnitude = Math.abs(this.speed);
        var directionMultiplier = this.isVertical
            ? (this.direction === 'up' ? 1 : -1)
            : (this.direction === 'left' ? 1 : -1);
        var speedMultiplier = this.speed < 0 ? -1 : 1;
        this.targetVelocity = magnitude * directionMultiplier * speedMultiplier;

        this.isHovered = false;
        this.offset = 0;
        this.velocity = 0;
        this.seqWidth = 0;
        this.seqHeight = 0;
        this.rafId = null;
        this.lastTimestamp = null;
        this.resizeObserver = null;
        this.copies = [];

        this._onMouseEnter = this._onMouseEnter.bind(this);
        this._onMouseLeave = this._onMouseLeave.bind(this);
        this._animate = this._animate.bind(this);
        this._updateDimensions = this._updateDimensions.bind(this);

        this._build();
        this._init();
    }

    LogoLoop.prototype._build = function () {
        var classes = ['logoloop', this.isVertical ? 'logoloop--vertical' : 'logoloop--horizontal'];
        if (this.fadeOut) classes.push('logoloop--fade');
        if (this.scaleOnHover) classes.push('logoloop--scale-hover');
        if (this.className) classes.push(this.className);

        this.container.className = (this.container.className ? this.container.className + ' ' : '') + classes.join(' ');
        this.container.setAttribute('role', 'region');
        this.container.setAttribute('aria-label', this.ariaLabel);

        this.container.style.setProperty('--logoloop-gap', this.gap + 'px');
        this.container.style.setProperty('--logoloop-logoHeight', this.logoHeight + 'px');
        if (this.fadeOutColor) this.container.style.setProperty('--logoloop-fadeColor', this.fadeOutColor);

        if (!this.isVertical) {
            this.container.style.width = toCssLength(this.width) || '100%';
        }

        this.track = document.createElement('div');
        this.track.className = 'logoloop__track';
        this.track.addEventListener('mouseenter', this._onMouseEnter);
        this.track.addEventListener('mouseleave', this._onMouseLeave);

        this.seqEl = this._buildList(false);
        this.track.appendChild(this.seqEl);
        this.container.appendChild(this.track);

        this.copies = [this.seqEl];
    };

    LogoLoop.prototype._buildList = function (hidden) {
        var list = document.createElement('ul');
        list.className = 'logoloop__list';
        list.setAttribute('role', 'list');
        if (hidden) list.setAttribute('aria-hidden', 'true');

        this.logos.forEach(function (item) {
            var li = document.createElement('li');
            li.className = 'logoloop__item';

            var content;
            if (item.html) {
                content = document.createElement('span');
                content.className = 'logoloop__node';
                content.innerHTML = item.html;
            } else {
                content = document.createElement('img');
                content.src = item.src;
                content.alt = item.alt || '';
                if (item.title) content.title = item.title;
                content.loading = 'lazy';
                content.decoding = 'async';
                content.draggable = false;
            }

            if (item.href) {
                var a = document.createElement('a');
                a.className = 'logoloop__link';
                a.href = item.href;
                a.target = '_blank';
                a.rel = 'noreferrer noopener';
                a.setAttribute('aria-label', item.title || item.alt || 'logo link');
                a.appendChild(content);
                li.appendChild(a);
            } else {
                li.appendChild(content);
            }

            list.appendChild(li);
        });

        return list;
    };

    LogoLoop.prototype._onMouseEnter = function () {
        this.isHovered = true;
    };

    LogoLoop.prototype._onMouseLeave = function () {
        this.isHovered = false;
    };

    LogoLoop.prototype._updateDimensions = function () {
        var containerWidth = this.container.clientWidth || 0;
        var rect = this.seqEl.getBoundingClientRect();
        var copiesNeeded;

        if (this.isVertical) {
            var parentHeight = this.container.parentElement ? this.container.parentElement.clientHeight : 0;
            if (parentHeight > 0) this.container.style.height = Math.ceil(parentHeight) + 'px';
            if (rect.height > 0) {
                this.seqHeight = Math.ceil(rect.height);
                var viewportH = this.container.clientHeight || parentHeight || rect.height;
                copiesNeeded = Math.ceil(viewportH / rect.height) + COPY_HEADROOM;
            }
        } else if (rect.width > 0) {
            this.seqWidth = Math.ceil(rect.width);
            copiesNeeded = Math.ceil(containerWidth / rect.width) + COPY_HEADROOM;
        }

        if (copiesNeeded) this._setCopyCount(Math.max(MIN_COPIES, copiesNeeded));
    };

    LogoLoop.prototype._setCopyCount = function (count) {
        while (this.copies.length < count) {
            var clone = this._buildList(true);
            this.track.appendChild(clone);
            this.copies.push(clone);
        }
        while (this.copies.length > count) {
            var extra = this.copies.pop();
            this.track.removeChild(extra);
        }
    };

    LogoLoop.prototype._animate = function (timestamp) {
        if (this.lastTimestamp === null) this.lastTimestamp = timestamp;
        var deltaTime = Math.max(0, timestamp - this.lastTimestamp) / 1000;
        this.lastTimestamp = timestamp;

        var target = this.isHovered ? this.hoverSpeed : this.targetVelocity;
        var easingFactor = 1 - Math.exp(-deltaTime / SMOOTH_TAU);
        this.velocity += (target - this.velocity) * easingFactor;

        var seqSize = this.isVertical ? this.seqHeight : this.seqWidth;
        if (seqSize > 0) {
            var next = this.offset + this.velocity * deltaTime;
            next = ((next % seqSize) + seqSize) % seqSize;
            this.offset = next;

            this.track.style.transform = this.isVertical
                ? 'translate3d(0, ' + (-this.offset) + 'px, 0)'
                : 'translate3d(' + (-this.offset) + 'px, 0, 0)';
        }

        this.rafId = requestAnimationFrame(this._animate);
    };

    LogoLoop.prototype._init = function () {
        var self = this;

        if (window.ResizeObserver) {
            this.resizeObserver = new ResizeObserver(function () { self._updateDimensions(); });
            this.resizeObserver.observe(this.container);
            this.resizeObserver.observe(this.seqEl);
        } else {
            window.addEventListener('resize', this._updateDimensions);
        }

        var images = Array.prototype.slice.call(this.seqEl.querySelectorAll('img'));
        if (images.length === 0) {
            this._updateDimensions();
        } else {
            var remaining = images.length;
            var onImgLoad = function () {
                remaining -= 1;
                if (remaining === 0) self._updateDimensions();
            };
            images.forEach(function (img) {
                if (img.complete) {
                    onImgLoad();
                } else {
                    img.addEventListener('load', onImgLoad, { once: true });
                    img.addEventListener('error', onImgLoad, { once: true });
                }
            });
        }

        this._updateDimensions();
        this.rafId = requestAnimationFrame(this._animate);
    };

    LogoLoop.prototype.destroy = function () {
        if (this.rafId) cancelAnimationFrame(this.rafId);
        if (this.resizeObserver) this.resizeObserver.disconnect();
        window.removeEventListener('resize', this._updateDimensions);
        this.track.removeEventListener('mouseenter', this._onMouseEnter);
        this.track.removeEventListener('mouseleave', this._onMouseLeave);
    };

    global.LogoLoop = LogoLoop;
})(window);
