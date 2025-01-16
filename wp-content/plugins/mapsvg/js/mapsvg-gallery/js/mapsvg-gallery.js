(function ($, window) {
    if (!MapSVG.galleryApiLoaded) {
        var html =
            '<div class="pswp" tabindex="-1" role="dialog" aria-hidden="true">' +
            '<div class="pswp__bg"></div>' +
            '<div class="pswp__scroll-wrap">' +
            '<div class="pswp__container">' +
            '<div class="pswp__item"></div>' +
            '<div class="pswp__item"></div>' +
            '<div class="pswp__item"></div>' +
            "</div>" +
            '<div class="pswp__ui pswp__ui--hidden">' +
            '<div class="pswp__top-bar">' +
            '<div class="pswp__counter"></div>' +
            '<button class="pswp__button pswp__button--close" title="Close (Esc)"></button>' +
            '<button class="pswp__button pswp__button--share" title="Share"></button>' +
            '<button class="pswp__button pswp__button--fs" title="Toggle fullscreen"></button>' +
            '<button class="pswp__button pswp__button--zoom" title="Zoom in/out"></button>' +
            '<div class="pswp__preloader">' +
            '<div class="pswp__preloader__icn">' +
            '<div class="pswp__preloader__cut">' +
            '<div class="pswp__preloader__donut"></div>' +
            "</div>" +
            "</div>" +
            "</div>" +
            "</div>" +
            '<div class="pswp__share-modal pswp__share-modal--hidden pswp__single-tap">' +
            '<div class="pswp__share-tooltip"></div>' +
            "</div>" +
            '<button class="pswp__button pswp__button--arrow--left" title="Previous (arrow left)"></button>' +
            '<button class="pswp__button pswp__button--arrow--right" title="Next (arrow right)"></button>' +
            '<div class="pswp__caption"><div class="pswp__caption__center"></div></div>' +
            "</div>" +
            "</div>" +
            "</div>";
        $(document).ready(function () {
            $("body").append($(html));
            MapSVG.galleryApiLoaded = true;
            Handlebars.registerHelper("mapsvg_gallery", function (id, images) {
                if (!images) return;
                if (images.full && images.length === undefined) {
                    images = [images];
                }
                var html = "";
                id = id + "";
                id = id.split(".");
                var map_id = id[0];
                var gal_id = id[1];
                var mapsvg = MapSVG.getById(map_id);
                var gal;
                mapsvg.getData().options.galleries.forEach(function (g) {
                    if (g.id == gal_id) {
                        gal = g;
                    }
                });
                type = gal.type;
                html +=
                    '<div class="mapsvg-gallery-wrap" style="background-color: ' +
                    gal.background +
                    '">' +
                    "<div " +
                    'class="mapsvg-gallery mapsvg-gallery-' +
                    type +
                    " " +
                    "" +
                    (type == "multi" || type == "justified" ? " mapsvg-gallery-justified " : "") +
                    "" +
                    (gal.lightbox ? " mapsvg-gallery-lightbox " : "") +
                    'itemscope itemtype="http://schema.org/ImageGallery"' +
                    (gal.type == "original" || gal.type == "justified" || gal.type == "multi"
                        ? ' data-thumb-margins="' + gal.thumb_margin.replace("px", "") + '"'
                        : "") +
                    " " +
                    (gal.type == "original" || gal.type == "justified" || gal.type == "multi"
                        ? ' data-thumb-height="' + gal.thumb_height.replace("px", "") + '"'
                        : "") +
                    " " +
                    ">";
                images.forEach(function (image, index) {
                    var thumb;
                    var large = true;
                    if (gal.type == "multi") {
                        thumb = image.thumbnail;
                        large = false;
                    } else if (gal.type == "justified") {
                        thumb = image.medium;
                        large = true;
                    } else {
                        if (
                            !(
                                (index === 0 && (type == "single" || type == "combo")) ||
                                type == "slider"
                            )
                        ) {
                            large = false;
                            thumb = image.thumbnail;
                        } else {
                            large = true;
                            thumb = image.full;
                        }
                        thumb =
                            (index === 0 && (type == "single" || type == "combo")) ||
                            type == "slider"
                                ? image.full
                                : image.thumbnail;
                    }
                    html +=
                        '<figure itemprop="associatedMedia" itemscope itemtype="http://schema.org/ImageObject">\
                    <a href="' +
                        image.full +
                        '" itemprop="contentUrl" data-size="' +
                        image.sizes.full.width +
                        "x" +
                        image.sizes.full.height +
                        '">\
                        <!--alt="Image description"-->\
                        <!--padding: ' +
                        gal.thumb_margin +
                        ';-->\
                        <img src="' +
                        thumb +
                        '" style="' +
                        // (gal.type=='multi' ? 'padding: '+gal.thumb_margin+'px; ':'')+
                        (type == "slider" && gal.max_height
                            ? "max-height: " + gal.max_height + "px"
                            : "") +
                        '" itemprop="thumbnail"  ' +
                        (!large ? 'width="' + gal.thumb_width + '"' : "") +
                        '/>\
                    </a>\
                    <figcaption itemprop="caption description">' +
                        image.caption +
                        "</figcaption>\
                    </figure>";
                });
                html += "</div>";
                if (type == "single" && gal.lb_button_show) {
                    html +=
                        '<button class="mapsvg-gallery-button">' +
                        gal.lb_button_text.replace("{{counter}}", images.length) +
                        "</button>";
                }
                html += "</div>";
                return new Handlebars.SafeString(html);
            });
        });
    }

    var initPhotoSwipeFromDOM = function (gallerySelector, options) {
        // parse slide data (url, title, size ...) from DOM elements
        // (children of gallerySelector)
        var parseThumbnailElements = function (el) {
            var thumbElements = el,
                numNodes = thumbElements.length,
                items = [],
                figureEl,
                linkEl,
                size,
                item;

            for (var i = 0; i < numNodes; i++) {
                figureEl = thumbElements[i]; // <figure> element

                // include only element nodes
                if (figureEl.nodeType !== 1) {
                    continue;
                }

                linkEl = figureEl.children[0]; // <a> element

                size = linkEl.getAttribute("data-size").split("x");

                // create slide object
                item = {
                    src: linkEl.getAttribute("href"),
                    w: parseInt(size[0], 10),
                    h: parseInt(size[1], 10),
                };

                if (figureEl.children.length > 1) {
                    // <figcaption> content
                    item.title = figureEl.children[1].innerHTML;
                }

                if (linkEl.children.length > 0) {
                    // <img> thumbnail element, retrieving thumbnail url
                    item.msrc = linkEl.children[0].getAttribute("src");
                }

                item.el = figureEl; // save link to element for getThumbBoundsFn
                items.push(item);
            }

            return items;
        };

        // find nearest parent element
        var closest = function closest(el, fn) {
            return el && (fn(el) ? el : closest(el.parentNode, fn));
        };

        // triggers when user clicks on thumbnail
        var onThumbnailsClick = function (e) {
            e = e || window.event;
            e.preventDefault ? e.preventDefault() : (e.returnValue = false);

            var eTarget = e.target || e.srcElement;

            // find root element of slide
            var clickedListItem = closest(eTarget, function (el) {
                return el.tagName && el.tagName.toUpperCase() === "FIGURE";
            });

            if (!clickedListItem) {
                return;
            }

            // find index of clicked item by looping through all child nodes
            // alternatively, you may define index via data- attribute
            var clickedGallery = $(clickedListItem).closest(".mapsvg-gallery")[0],
                childNodes = $(clickedListItem).closest(".mapsvg-gallery").find("figure"),
                numChildNodes = childNodes.length,
                nodeIndex = 0,
                index;

            for (var i = 0; i < numChildNodes; i++) {
                if (childNodes[i].nodeType !== 1) {
                    continue;
                }

                if (childNodes[i] === clickedListItem) {
                    index = nodeIndex;
                    break;
                }
                nodeIndex++;
            }

            if (index >= 0) {
                // open PhotoSwipe if valid index found
                openPhotoSwipe(index, clickedGallery);
            }
            return false;
        };

        // parse picture index and gallery index from URL (#&pid=1&gid=2)
        var photoswipeParseHash = function () {
            var hash = window.location.hash.substring(1),
                params = {};

            if (hash.length < 5) {
                return params;
            }

            var vars = hash.split("&");
            for (var i = 0; i < vars.length; i++) {
                if (!vars[i]) {
                    continue;
                }
                var pair = vars[i].split("=");
                if (pair.length < 2) {
                    continue;
                }
                params[pair[0]] = pair[1];
            }

            if (params.gid) {
                params.gid = parseInt(params.gid, 10);
            }

            return params;
        };

        var openPhotoSwipe = function (index, galleryElement, disableAnimation, fromURL) {
            var pswpElement = document.querySelectorAll(".pswp")[0],
                gallery,
                options,
                items;

            items = parseThumbnailElements($(galleryElement).find("figure"));

            // define options (if needed)
            options = {
                // define gallery index (for URL)
                galleryUID: galleryElement.getAttribute("data-pswp-uid"),

                getThumbBoundsFn: function (index) {
                    // See Options -> getThumbBoundsFn section of documentation for more info
                    var thumbnail = items[index].el.getElementsByTagName("img")[0], // find thumbnail
                        pageYScroll = window.pageYOffset || document.documentElement.scrollTop,
                        rect = thumbnail.getBoundingClientRect();

                    return { x: rect.left, y: rect.top + pageYScroll, w: rect.width };
                },

                shareEl: false,
                captionEl: true,
            };

            // PhotoSwipe opened from URL
            if (fromURL) {
                if (options.galleryPIDs) {
                    // parse real index when custom PIDs are used
                    // http://photoswipe.com/documentation/faq.html#custom-pid-in-url
                    for (var j = 0; j < items.length; j++) {
                        if (items[j].pid == index) {
                            options.index = j;
                            break;
                        }
                    }
                } else {
                    // in URL indexes start from 1
                    options.index = parseInt(index, 10) - 1;
                }
            } else {
                options.index = parseInt(index, 10);
            }

            // exit if index not found
            if (isNaN(options.index)) {
                return;
            }

            if (disableAnimation) {
                options.showAnimationDuration = 0;
            }

            // Pass data to PhotoSwipe and initialize it
            gallery = new PhotoSwipe(pswpElement, PhotoSwipeUI_Default, items, options);
            gallery.init();
        };

        // loop through all gallery elements and bind events
        var galleryElements = document.querySelectorAll(gallerySelector);

        for (var i = 0, l = galleryElements.length; i < l; i++) {
            galleryElements[i].setAttribute("data-pswp-uid", i + 1);
            galleryElements[i].onclick = onThumbnailsClick;
            $(".mapsvg-gallery-button").on("click", function () {
                openPhotoSwipe(0, $(this).parent().find(".mapsvg-gallery")[0]);
            });
        }

        // Parse URL and open gallery if it contains #&pid=3&gid=1
        var hashData = photoswipeParseHash();
        if (hashData.pid && hashData.gid) {
            openPhotoSwipe(hashData.pid, galleryElements[hashData.gid - 1], true, true);
        }
    };

    $(window).on("shown.popover", function (e, mapsvg, popover) {
        if ($(popover.containers.view).find(".mapsvg-gallery-lightbox").length) {
            initPhotoSwipeFromDOM(".mapsvg-gallery-lightbox", {
                captionEl: false,
                addCaptionHTMLFn: function (item, captionEl, isFake) {
                    // item      - slide object
                    // captionEl - caption DOM element
                    // isFake    - true when content is added to fake caption container
                    //             (used to get size of next or previous caption)

                    if (!item.title) {
                        captionEl.children[0].innerHTML = "";
                        return false;
                    }
                    captionEl.children[0].innerHTML = item.title;
                    return true;
                },
            });
        }
        var slider = $(popover.containers.view).find(".mapsvg-gallery-slider");
        if (slider.length) {
            slider.slick({
                dots: true,
            });
            // $('.slick-dots').appendTo('.mapsvg-gallery-wrap');
            // $('.slick-prev').appendTo('.mapsvg-gallery-wrap');
            // $('.slick-next').appendTo('.mapsvg-gallery-wrap');
        }
        var j = $(popover.containers.view).find(".mapsvg-gallery-justified");
        if (j) {
            j.justifiedGallery({
                selector: "figure, div:not(.spinner)",
                margins: j.data("thumb-margins") || 2,
                rowHeight: j.data("thumb-height") || 100,
            });
        }
    });
    $(window).on("shown.detailsView", function (e, mapsvg, detailsView) {
        if ($(detailsView.containers.view).find(".mapsvg-gallery-lightbox").length) {
            initPhotoSwipeFromDOM(".mapsvg-gallery-lightbox");
        }
        var slider = $(detailsView.containers.view).find(".mapsvg-gallery-slider");
        if (slider.length) {
            slider.slick({
                dots: true,
            });
            // $('.slick-dots').appendTo('.mapsvg-gallery-wrap');
            // $('.slick-prev').appendTo('.mapsvg-gallery-wrap');
            // $('.slick-next').appendTo('.mapsvg-gallery-wrap');
        }
        var j = $(detailsView.containers.view).find(".mapsvg-gallery-justified");
        if (j) {
            j.justifiedGallery({
                selector: "figure, div:not(.spinner)",
                margins: j.data("thumb-margins") || 2,
                rowHeight: j.data("thumb-height") || 100,
            });
        }
    });

    (function ($) {
        $.fn.unveil = function (threshold, callback) {
            var $w = $(window),
                th = threshold || 0,
                retina = window.devicePixelRatio > 1,
                attrib = retina ? "data-src-retina" : "data-src",
                images = this,
                loaded;

            this.one("unveil", function () {
                var source = this.getAttribute(attrib);
                source = source || this.getAttribute("data-src");
                if (source) {
                    this.setAttribute("src", source);
                    if (typeof callback === "function") callback.call(this);
                }
            });

            function unveil() {
                var inview = images.filter(function () {
                    var $e = $(this);
                    if ($e.is(":hidden")) return;

                    var wt = $w.scrollTop(),
                        wb = wt + $w.height(),
                        et = $e.offset().top,
                        eb = et + $e.height();

                    return eb >= wt - th && et <= wb + th;
                });

                loaded = inview.trigger("unveil");
                images = images.not(loaded);
            }

            $w.on("scroll.unveil resize.unveil lookup.unveil", unveil);

            unveil();

            return this;
        };
    })(window.jQuery || window.Zepto);
})(jQuery, window);
