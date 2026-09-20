/* ========================================================================
   InfiniteSpiral — vanilla JS port of the React Bits <InfiniteSpiral />
   component (https://reactbits.dev), for use without React.
   ======================================================================== */

(function (global) {
    'use strict';

    function clamp(value, min, max) {
        return Math.min(Math.max(value, min), max);
    }

    function modulo(value, divisor) {
        return ((value % divisor) + divisor) % divisor;
    }

    function smoothstep(min, max, value) {
        var x = clamp((value - min) / (max - min || 1), 0, 1);
        return x * x * (3 - 2 * x);
    }

    function InfiniteSpiral(container, options) {
        options = options || {};

        this.container = container;
        this.items = (options.items || []).map(function (item, index) {
            if (typeof item === 'string') {
                return { src: item, alt: 'Spiral image ' + (index + 1) };
            }
            return Object.assign({ alt: 'Spiral image ' + (index + 1) }, item);
        });

        this.speed = options.speed != null ? options.speed : 0.55;
        this.direction = options.direction || 'up';
        this.animationMode = options.animationMode || 'auto';
        this.radius = options.radius != null ? options.radius : 170;
        this.cardWidth = options.cardWidth != null ? options.cardWidth : 100;
        this.cardHeight = options.cardHeight != null ? options.cardHeight : 100;
        this.verticalSpacing = options.verticalSpacing != null ? options.verticalSpacing : 60;
        this.perspective = options.perspective != null ? options.perspective : 1000;
        this.cardsPerTurn = options.cardsPerTurn != null ? options.cardsPerTurn : 7;
        this.rotation = options.rotation != null ? options.rotation : 0;
        this.cardTilt = options.cardTilt != null ? options.cardTilt : 0;
        this.cardRadius = options.cardRadius != null ? options.cardRadius : 10;
        this.centerScale = options.centerScale != null ? options.centerScale : 1.2;
        this.edgeFade = options.edgeFade != null ? options.edgeFade : 0.3;
        this.edgeBlur = options.edgeBlur != null ? options.edgeBlur : 6;
        this.pauseOnHover = options.pauseOnHover !== false;
        this.imageFit = options.imageFit || 'cover';
        this.grayscale = options.grayscale != null ? options.grayscale : 0;
        this.className = options.className || '';

        this.progress = 0;
        this.targetProgress = 0;
        this.autoSpeed = 0;
        this.hovered = false;
        this.visible = true;
        this.dragging = false;
        this.lastPointerY = 0;
        this.dragMoved = false;
        this.cards = [];
        this.rafId = null;
        this.previousTime = null;
        this.bounds = { width: 0, height: 0 };
        this.lastScrollY = window.scrollY;

        this._onMouseEnter = this._onMouseEnter.bind(this);
        this._onMouseLeave = this._onMouseLeave.bind(this);
        this._onPointerDown = this._onPointerDown.bind(this);
        this._onPointerMove = this._onPointerMove.bind(this);
        this._onPointerUp = this._onPointerUp.bind(this);
        this._onClickCapture = this._onClickCapture.bind(this);
        this._onScroll = this._onScroll.bind(this);
        this._render = this._render.bind(this);

        this._build();
        this._init();
    }

    InfiniteSpiral.prototype._build = function () {
        var dragEnabled = this.animationMode === 'drag' || this.animationMode === 'all';

        this.container.className = ('infinite-spiral ' + this.className).trim();
        this.container.style.perspective = this.perspective + 'px';
        this.container.style.setProperty('--infinite-spiral-card-width', this.cardWidth + 'px');
        this.container.style.setProperty('--infinite-spiral-card-height', this.cardHeight + 'px');
        this.container.style.setProperty('--infinite-spiral-card-radius', this.cardRadius + 'px');
        this.container.style.cursor = dragEnabled ? 'grab' : 'default';
        this.container.style.touchAction = dragEnabled ? 'pan-x' : 'auto';
        this.container.style.userSelect = dragEnabled ? 'none' : 'auto';

        this.stage = document.createElement('div');
        this.stage.className = 'infinite-spiral__stage';
        this.stage.setAttribute('role', 'list');
        this.stage.setAttribute('aria-label', 'Infinite spiral gallery');
        this.container.appendChild(this.stage);

        var self = this;
        this.items.forEach(function (item, index) {
            var card = document.createElement(item.href ? 'a' : 'div');
            card.className = 'infinite-spiral__item';
            card.style.width = self.cardWidth + 'px';
            card.style.height = self.cardHeight + 'px';
            card.style.borderRadius = self.cardRadius + 'px';
            if (item.href) {
                card.href = item.href;
                if (item.target) card.target = item.target;
                if (item.target === '_blank') card.rel = 'noreferrer';
            }
            card.setAttribute('role', 'listitem');
            card.setAttribute('aria-label', item.label || item.alt);

            var img = document.createElement('img');
            img.className = 'infinite-spiral__image';
            img.src = item.src;
            img.alt = item.alt;
            img.loading = index < 6 ? 'eager' : 'lazy';
            img.draggable = false;
            img.style.width = self.cardWidth + 'px';
            img.style.height = self.cardHeight + 'px';
            img.style.maxWidth = 'none';
            img.style.maxHeight = 'none';
            img.style.objectFit = self.imageFit;
            img.style.filter = 'grayscale(' + Math.min(1, Math.max(0, self.grayscale)) + ')';

            card.appendChild(img);
            self.stage.appendChild(card);
            self.cards.push(card);
        });

        this.container.addEventListener('mouseenter', this._onMouseEnter);
        this.container.addEventListener('mouseleave', this._onMouseLeave);
        if (dragEnabled) {
            this.container.addEventListener('pointerdown', this._onPointerDown);
            this.container.addEventListener('pointermove', this._onPointerMove);
            this.container.addEventListener('pointerup', this._onPointerUp);
            this.container.addEventListener('pointercancel', this._onPointerUp);
            this.container.addEventListener('click', this._onClickCapture, true);
        }
    };

    InfiniteSpiral.prototype._onMouseEnter = function () {
        this.hovered = true;
    };

    InfiniteSpiral.prototype._onMouseLeave = function () {
        this.hovered = false;
    };

    InfiniteSpiral.prototype._onPointerDown = function (event) {
        if (event.button !== 0) return;
        this.dragging = true;
        this.dragMoved = false;
        this.lastPointerY = event.clientY;
        this.targetProgress = this.progress;
        this.container.setPointerCapture(event.pointerId);
        this.container.style.cursor = 'grabbing';
    };

    InfiniteSpiral.prototype._onPointerMove = function (event) {
        if (!this.dragging) return;
        var pointerDelta = event.clientY - this.lastPointerY;
        this.lastPointerY = event.clientY;
        if (Math.abs(pointerDelta) > 0.5) this.dragMoved = true;
        this.targetProgress -= pointerDelta / Math.max(this.verticalSpacing, 1);
    };

    InfiniteSpiral.prototype._onPointerUp = function (event) {
        if (!this.dragging) return;
        this.dragging = false;
        if (this.container.hasPointerCapture(event.pointerId)) {
            this.container.releasePointerCapture(event.pointerId);
        }
        this.container.style.cursor = 'grab';
    };

    InfiniteSpiral.prototype._onClickCapture = function (event) {
        if (!this.dragMoved) return;
        event.preventDefault();
        event.stopPropagation();
        this.dragMoved = false;
    };

    InfiniteSpiral.prototype._onScroll = function () {
        var scrollEnabled = this.animationMode === 'scroll' || this.animationMode === 'all';
        var nextScrollY = window.scrollY;
        var scrollDelta = nextScrollY - this.lastScrollY;
        this.lastScrollY = nextScrollY;
        if (!scrollEnabled || !this.visible || scrollDelta === 0) return;
        var scrollSpeedMultiplier = Math.max(this.speed, 0) / 0.55;
        this.targetProgress += clamp(
            (scrollDelta * scrollSpeedMultiplier) / Math.max(this.verticalSpacing * 2, 1),
            -1.5,
            1.5
        );
    };

    InfiniteSpiral.prototype._render = function (time) {
        if (this.previousTime === null) this.previousTime = time;
        var delta = Math.min((time - this.previousTime) / 1000, 0.05);
        this.previousTime = time;

        var autoEnabled = this.animationMode === 'auto' || this.animationMode === 'all';
        var motionPaused = this.dragging || (this.pauseOnHover && this.hovered);
        var directionMultiplier = this.direction === 'down' ? -1 : 1;
        var desiredAutoSpeed =
            autoEnabled && this.visible && !this.reducedMotionMQ.matches && !motionPaused
                ? this.speed * directionMultiplier
                : 0;
        var speedBlend = 1 - Math.exp(-delta * 7);
        this.autoSpeed += (desiredAutoSpeed - this.autoSpeed) * speedBlend;
        this.targetProgress += this.autoSpeed * delta;

        var followBlend = 1 - Math.exp(-delta * (this.dragging ? 22 : 11));
        this.progress += (this.targetProgress - this.progress) * followBlend;

        var count = this.items.length;
        var half = count / 2;
        var width = Math.max(this.bounds.width, 1);
        var height = Math.max(this.bounds.height, 1);
        var fit = Math.min(1, width / (this.cardWidth * 2.8), height / (this.cardHeight * 2.35));
        var responsiveRadius = Math.min(this.radius, Math.max(72, width * 0.36)) * fit;
        var fadeStart = clamp(1 - this.edgeFade, 0, 0.98);
        var turnSize = Math.max(this.cardsPerTurn, 1);

        for (var index = 0; index < this.cards.length; index++) {
            var card = this.cards[index];
            if (!card) continue;

            var offset = index - this.progress;
            offset = modulo(offset + half, count) - half;

            var edge = Math.min(Math.abs(offset) / Math.max(half, 1), 1);
            var opacity = 1 - smoothstep(fadeStart, 1, edge);
            var focus = 1 - Math.min(Math.abs(offset) / Math.max(turnSize * 0.65, 1), 1);
            var scale = (1 + (this.centerScale - 1) * focus) * fit;
            var angle = offset * (360 / turnSize) + this.rotation;
            var angleRadians = (angle * Math.PI) / 180;
            var x = Math.sin(angleRadians) * responsiveRadius;
            var z = Math.cos(angleRadians) * responsiveRadius;
            var depthScale = clamp(this.perspective / Math.max(this.perspective - z, 1), 0.72, 1.45);
            var visualScale = scale * depthScale;
            var depth = (z / Math.max(responsiveRadius, 1) + 1) / 2;
            var blur = this.edgeBlur * smoothstep(0.35, 1, edge);

            card.style.transform =
                'translate(-50%, -50%) translate3d(' + x + 'px, ' + (offset * this.verticalSpacing * fit) + 'px, 0) rotateZ(' +
                this.cardTilt + 'deg) scale(' + visualScale + ')';
            card.style.opacity = opacity.toFixed(3);
            card.style.filter = blur > 0.01 ? 'blur(' + blur.toFixed(2) + 'px)' : 'none';
            card.style.zIndex = String(Math.round(depth * 100000) + index);
            card.style.pointerEvents = opacity > 0.25 ? 'auto' : 'none';
        }

        this.rafId = requestAnimationFrame(this._render);
    };

    InfiniteSpiral.prototype._init = function () {
        var self = this;
        if (this.items.length === 0) return;

        this.bounds = this.container.getBoundingClientRect();
        this.reducedMotionMQ = window.matchMedia('(prefers-reduced-motion: reduce)');

        this.resizeObserver = new ResizeObserver(function () {
            self.bounds = self.container.getBoundingClientRect();
        });
        this.resizeObserver.observe(this.container);

        this.intersectionObserver = new IntersectionObserver(
            function (entries) {
                self.visible = entries[0].isIntersecting;
            },
            { threshold: 0.02 }
        );
        this.intersectionObserver.observe(this.container);

        window.addEventListener('scroll', this._onScroll, { passive: true });

        this.rafId = requestAnimationFrame(this._render);
    };

    InfiniteSpiral.prototype.destroy = function () {
        if (this.rafId) cancelAnimationFrame(this.rafId);
        if (this.resizeObserver) this.resizeObserver.disconnect();
        if (this.intersectionObserver) this.intersectionObserver.disconnect();
        window.removeEventListener('scroll', this._onScroll);
        this.container.removeEventListener('mouseenter', this._onMouseEnter);
        this.container.removeEventListener('mouseleave', this._onMouseLeave);
        this.container.removeEventListener('pointerdown', this._onPointerDown);
        this.container.removeEventListener('pointermove', this._onPointerMove);
        this.container.removeEventListener('pointerup', this._onPointerUp);
        this.container.removeEventListener('pointercancel', this._onPointerUp);
        this.container.removeEventListener('click', this._onClickCapture, true);
    };

    global.InfiniteSpiral = InfiniteSpiral;
})(window);
