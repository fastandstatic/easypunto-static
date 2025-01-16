import { EventWithData } from "@/Core/Events"
import "@glidejs/glide/dist/css/glide.core.min.css"
import "@glidejs/glide/dist/css/glide.theme.min.css"
import "justifiedGallery/dist/css/justifiedGallery.min.css"
import "photoswipe/style.css"
import { Controller } from "../Core/Controller"
import { MapSVGMap } from "../Map/Map"
import "./gallery.css"

type GalleryProps = {
  mapsvg: MapSVGMap
}

export default class GalleryController {
  mapsvg: MapSVGMap
  constructor(props: GalleryProps) {
    const { mapsvg } = props
    this.mapsvg = mapsvg
  }
  PhotoSwipeLightbox: any

  init() {
    Handlebars.registerHelper("mapsvg_gallery", function (id, images) {
      if (!images) return
      if (images.full && images.length === undefined) {
        images = [images]
      }
      let html = ""
      id = id + ""
      id = id.split(".")
      const map_id = id[0]
      const gal_id = id[1]
      const mapsvg = window.mapsvg.getById(map_id)
      let gal

      mapsvg.getData().options.galleries.forEach(function (g) {
        if (g.id == gal_id) {
          gal = g
        }
      })
      const thumb_margin =
        typeof gal.thumb_margin !== "undefined" ? (gal.thumb_margin + "").replace("px", "") : 0
      const type = gal.type
      html +=
        `<div class="${type === "slider" ? "glide" : ""}" style="background-color: ${gal.background}; "> \
          <div class="mapsvg-gallery-wrap ${type === "slider" ? "glide__track" : ""}" data-glide-el="track" style="background-color: ${gal.background}"> \
            <div class="${type === "slider" ? "glide__slides" : ""} mapsvg-gallery mapsvg-gallery-${type} ${gal.lightbox ? " mapsvg-gallery-lightbox pswp-gallery " : ""}"` +
        `${
          gal.type == "original" || gal.type == "justified" || gal.type == "multi"
            ? ' data-thumb-margins="' + thumb_margin + '"'
            : ""
        } ${
          gal.type == "original" || gal.type == "justified" || gal.type == "multi"
            ? ' data-thumb-height="' +
              (typeof gal.thumb_height !== "undefined"
                ? (gal.thumb_height + "").replace("px", "")
                : 0) +
              '"'
            : ""
        } style="gap: ${thumb_margin}px;" >`

      images.forEach(function (image, index) {
        let thumb
        let large = true
        if (gal.type == "multi") {
          thumb = image.medium
          large = false
        } else if (gal.type == "justified") {
          thumb = image.medium
          large = true
        } else {
          if (!((index === 0 && (type == "single" || type == "combo")) || type == "slider")) {
            large = false
            thumb = image.medium
          } else {
            large = true
            thumb = image.full
          }
          thumb =
            (index === 0 && (type == "single" || type == "combo")) || type == "slider"
              ? image.full
              : image.medium
        }
        html +=
          `<a href="${image.full}" data-pswp-width="${image.sizes.full.width}" data-pswp-height="${image.sizes.full.height}` +
          `" ><img src="${thumb}" style="` +
          (!large ? `max-width: ${gal.thumb_width ? gal.thumb_width : 80}px;` : "") +
          (gal.type == "multi"
            ? `width: ${gal.thumb_width}px; height: ${gal.thumb_width}px; `
            : "") +
          (gal.type == "slider" ? `max-height: ${gal.max_height}px;` : "") +
          `" itemprop="thumbnail" /></a>`
      })
      html += "</div>"
      if (type == "single" && gal.lb_button_show) {
        html +=
          '<button class="mapsvg-gallery-button">' +
          gal.lb_button_text.replace("{{counter}}", images.length) +
          "</button>"
      }
      html += `</div>`
      if (type == "slider") {
        html += `<div class="glide__bullets" data-glide-el="controls[nav]">
                    <button class="glide__bullet" data-glide-dir="=0"></button>
                    <button class="glide__bullet" data-glide-dir="=1"></button>
                    <button class="glide__bullet" data-glide-dir="=2"></button>
                  </div>      
                  <div class="glide__arrows" data-glide-el="controls">
                    <button class="glide__arrow glide__arrow--left" data-glide-dir="<">
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24">
                        <path d="M0 12l10.975 11 2.848-2.828-6.176-6.176H24v-3.992H7.646l6.176-6.176L10.975 1 0 12z"></path>
                      </svg>
                    </button>
                    <button class="glide__arrow glide__arrow--right" data-glide-dir=">">
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24">
                        <path d="M13.025 1l-2.847 2.828 6.176 6.176h-16.354v3.992h16.354l-6.176 6.176 2.847 2.828 10.975-11z"></path>
                      </svg>
                    </button>
                  </div>`
      }

      html += `</div>`
      return new Handlebars.SafeString(html)
    })
    this.setEventHandlers()
  }

  setEventHandlers() {
    const controllerShownHandler = async <C extends Controller>({
      data: { controller },
    }: EventWithData<{ controller: C }>) => {
      if (controller.containers.view.querySelector(".mapsvg-gallery-lightbox")) {
        const { default: PhotoSwipeLightbox } = await import("photoswipe/lightbox")
        // require("photoswipe/style.css")
        //@ts-ignore
        this.PhotoSwipeLightbox = new PhotoSwipeLightbox({
          gallery: ".pswp-gallery",
          children: "a",
          pswpModule: () => import("photoswipe"),
        })
        this.PhotoSwipeLightbox.init()
        $(".mapsvg-gallery-button").on("click", () => {
          this.PhotoSwipeLightbox.loadAndOpen(0)
        })
      }
      const slider = $(controller.containers.view).find(".mapsvg-gallery-slider")
      if (slider.length) {
        const { default: Glide } = await import("@glidejs/glide/dist/glide.esm.js")
        new Glide(".glide", {
          perView: 1,
        }).mount()
      }

      const j = window.jQuery(controller.containers.view).find(".mapsvg-gallery-justified")
      if (j) {
        //Justify Gallery
        const justify_scale = screen.height * 0.2

        const items = document.querySelectorAll(".mapsvg-gallery-justified a")

        Array.prototype.forEach.call(items, (item) => {
          const image = item.querySelector("img")

          const adjustImageSize = () => {
            const ratio = image.width / image.height
            item.style.width = justify_scale * ratio + "px"
            item.style.flexGrow = ratio
          }

          if (image.complete) {
            adjustImageSize()
          } else {
            image.onload = adjustImageSize
          }
        })
      }
    }

    this.mapsvg.events.on("afterRedraw.popover", controllerShownHandler)
    this.mapsvg.events.on("afterRedraw.detailsView", controllerShownHandler)
  }
}
