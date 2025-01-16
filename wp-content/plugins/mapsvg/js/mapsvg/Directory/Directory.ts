/**
 * Creates a container with a list of objects near the map
 * @class
 * @extends Controller
 * @param options - List of options
 *
 * @example
 * var directory = mapsvg.controllers.directory;
 *
 *  // Toggle map/list view on mobile devices
 * if(mapsvg.utils.env.isPhone()){
 *   directory.toggle(true); // show directory
 * }
 */
import { BaseEventHandler } from "@/Core/Events"
import { isPhone } from "@/Core/Utils"
import { DirectoryOptions } from "@/Map/OptionsInterfaces/MapOptions"
import { Marker } from "@/Marker/Marker"
import { Model } from "@/Model/Model"
import { Region } from "@/Region/Region"
import { Controller, ControllerOptions } from "../Core/Controller"
import { RepositoryInterface } from "../Core/Repository"
import "./directory.css"
const $ = jQuery

export enum DirectoryEvent {
  CLICK = "click",
  MOUSEOVER = "mouseover",
  MOUSEOUT = "mouseout",
}

interface DirectoryControllerOptions extends ControllerOptions {
  repository: RepositoryInterface
  options: DirectoryOptions
  events: ControllerOptions["events"] & {
    [K in DirectoryEvent]?: BaseEventHandler<{
      regions: Region[]
      object: Model
      marker: Marker
      directoryItem: HTMLElement
    }>
  }
}
export class DirectoryController extends Controller {
  repository: RepositoryInterface
  menuBtn: HTMLElement
  mapBtn: HTMLElement
  mobileButtons: HTMLElement
  options: DirectoryOptions

  constructor(options: DirectoryControllerOptions) {
    super(options)
    this.name = "directory"
    this.classList.push(...["mapsvg-directory", "mapsvg-controller-no-padding"])

    this.repository = options.repository
    this.styles.padding = "0"
  }

  /**
   * Returns a HTML content for the Directory toolbar
   * @returns {string} HTML content
   */
  getToolbarTemplate() {
    let t = '<div class="mapsvg-directory-search-wrap">'
    t += '<div class="mapsvg-directory-filter-wrap filter-wrap"></div>'
    t += "</div>"
    t += "</div>"
    return t
  }

  /**
   * Does all required actions when the view is loaded: adds mobile buttons for mobile devices.
   * @private
   */
  viewDidLoad() {
    const _this = this
    $(this.containers.main).toggleClass("flex", this.scrollable)
    this.menuBtn = $(
      '<div class="mapsvg-button-menu"><i class="mapsvg-icon-menu"></i> ' +
        this.map.options.mobileView.labelList +
        "</div>",
    )[0]
    this.mapBtn = $(
      '<div class="mapsvg-button-map"><i class="mapsvg-icon-map"></i> ' +
        this.map.options.mobileView.labelMap +
        "</div>",
    )[0]

    // Make directory hidden by default on mobiles
    if (isPhone() && this.options.hideOnMobile) {
      if (this.options.showFirst == "map") {
        this.toggle(false)
      } else {
        this.toggle(true)
      }
    }

    this.mobileButtons = $('<div class="mapsvg-mobile-buttons"></div>')[0]
    this.mobileButtons.append(this.menuBtn, this.mapBtn)

    if (this.options.on !== false) {
      this.map.containers.wrapAll.appendChild(this.mobileButtons)
    }
  }

  setEventHandlers() {
    const _this = this

    $(window).on("resize", function () {
      _this.updateTopShift()
    })

    $(this.menuBtn).on("click", function () {
      _this.toggle(true)
    })
    $(this.mapBtn).on("click", function () {
      _this.toggle(false)
      _this.map.redraw()
    })

    $(this.containers.view)
      .on("click.menu.mapsvg", ".mapsvg-directory-item", function (e) {
        if (e.target.nodeName == "A") {
          return
        }

        const objID = $(this).data("object-id")

        _this.deselectItems()
        _this.selectItems(objID, false)

        if (_this.options.hideOnMobile && isPhone() && _this.options.showMapOnClick) {
          _this.toggle(false)
        }

        _this.events.trigger("click", e, {
          directoryItem: e.target,
          ..._this.getDirectoryItemObjects(objID),
        })
      })
      .on("mouseover.menu.mapsvg", ".mapsvg-directory-item", function (e) {
        const objID = $(this).data("object-id")

        _this.events.trigger("mouseover", e, {
          directoryItem: e.target,
          ..._this.getDirectoryItemObjects(objID),
        })
      })
      .on("mouseout.menu.mapsvg", ".mapsvg-directory-item", function (e) {
        const objID = $(this).data("object-id")

        _this.events.trigger("mouseout", e, {
          directoryItem: e.target,
          ..._this.getDirectoryItemObjects(objID),
        })
      })

    $(this.containers.contentView).on("click", ".mapsvg-category-item", function () {
      const panel = $(this).next(".mapsvg-category-block")

      if (panel[0].style.maxHeight || panel.hasClass("active")) {
        panel[0].style.maxHeight = null
      } else {
        panel[0].style.maxHeight = panel[0].scrollHeight + "px"
      }

      if ($(this).hasClass("active")) {
        $(this).toggleClass("active", false)
        $(this).next(".mapsvg-category-block").addClass("collapsed").removeClass("active")
      } else {
        if (_this.options.categories.collapseOther) {
          $(this).parent().find(".mapsvg-category-item.active").removeClass("active")
          $(this)
            .parent()
            .find(".mapsvg-category-block.active")
            .removeClass("active")
            .addClass("collapsed")
        }
        $(this).toggleClass("active", true)
        $(this).next(".mapsvg-category-block").removeClass("collapsed").addClass("active")
      }

      const panels = $(".mapsvg-category-block.collapsed")
      panels.each(function (i, panel) {
        panel.style.maxHeight = null
      })
    })
  }

  getDirectoryItemObjects(id: string) {
    let regions: Region[]
    let detailsViewObject
    let eventObject
    let marker
    let object: Model

    if (this.options.source == "regions") {
      regions = [this.map.getRegion(id)]
    } else {
      object = this.repository.getLoadedObject(id)
      const _regions = object.getRegions(this.map.regionsRepository.schema.name)
      if (_regions) {
        regions = _regions.map((region) => {
          return this.map.getRegion(region.id)
        })
      }
      if (object["location"]) {
        marker = object["location"].marker
      }
    }
    return { regions, object, marker }
  }

  /**
   * Highlights directory items
   * @param {array} ids - A list of object IDs
   */
  highlightItems(ids) {
    const _this = this
    if (typeof ids != "object") ids = [ids]
    ids.forEach(function (id) {
      $(_this.containers.view)
        .find("#mapsvg-directory-item-" + _this.convertId(id))
        .addClass("hover")
    })
  }

  /**
   * Unhighlights directory items
   */
  unhighlightItems() {
    $(this.containers.view).find(".mapsvg-directory-item").removeClass("hover")
  }

  /**
   * Highlights directory items
   * @param {array} ids - A list of object IDs
   */
  selectItems(ids, scrollTo = true) {
    if (typeof ids != "object") ids = [ids]
    ids.forEach((id) => {
      $(this.containers.view)
        .find("#mapsvg-directory-item-" + this.convertId(id))
        .addClass("selected")
    })

    if (scrollTo && $("#mapsvg-directory-item-" + ids[0]).length > 0) {
      this.scrollable &&
        $(this.containers.contentWrap).nanoScroller({
          scrollTo: $(this.containers.view).find(
            "#mapsvg-directory-item-" + this.convertId(ids[0]),
          ),
        })
    }
  }

  /**
   * Deselects directory items
   */
  deselectItems() {
    $(this.containers.view).find(".mapsvg-directory-item").removeClass("selected")
  }

  viewDidRedraw(): void {
    if (this.options.categories.on) {
      if (
        this.options.categories.collapse &&
        this.state.categories !== null &&
        this.state.categories.length > 1
      ) {
        $(this.containers.contentView).find(".mapsvg-category-block").addClass("collapsed")
      } else if (
        this.options.categories.collapse &&
        this.state.categories !== null &&
        this.state.categories.length === 1
      ) {
        $(this.containers.contentView).find(".mapsvg-category-item").addClass("active")
        $(this.containers.contentView).find(".mapsvg-category-block").addClass("active")
        const panel = $(this.containers.contentView).find(".mapsvg-category-block")[0]
        if (panel) panel.style.maxHeight = panel.scrollHeight + "px"
      } else if (!this.options.categories.collapse) {
        $(this.containers.contentView).find(".mapsvg-category-item").addClass("active")
        $(this.containers.contentView).find(".mapsvg-category-block").addClass("active")
        const panels = $(this.containers.contentView).find(".mapsvg-category-block")
        if (panels.length)
          panels.each(function (i, panel) {
            panel.style.maxHeight = panel.scrollHeight + "px"
          })
      }
    }
  }

  /**
   * Toggles view between map and directory on mobile devices
   * @param {boolean} on - If "true", directory is shown and map is hidden, and vice-versa.
   */
  toggle(on?: boolean) {
    const _this = this
    if (on) {
      $(this.containers.main).parent().show()
      $(_this.map.containers.mapContainer).hide()
      // _this.mapsvg.$wrapAll.toggleClass('mapsvg-mobile-show-map', true);
      // _this.mapsvg.$wrapAll.toggleClass('mapsvg-mobile-show-directory', ƒalse);
      $(this.menuBtn).addClass("active")
      $(this.mapBtn).removeClass("active")
      // redraw?
    } else {
      $(this.containers.main).parent().hide()
      $(_this.map.containers.mapContainer).show()
      // _this.mapsvg.$wrapAll.toggleClass('mapsvg-mobile-show-map', false);
      // _this.mapsvg.$wrapAll.toggleClass('mapsvg-mobile-show-directory', true);
      $(this.menuBtn).removeClass("active")
      $(this.mapBtn).addClass("active")
    }

    if (!$(this.containers.main).parent().is(":visible")) {
      if (isPhone()) {
        $(_this.map.containers.wrap).css("height", "auto")
        _this.updateScroll()
      }
    } else {
      if (isPhone() && $(this.containers.main).height() < parseInt(this.options.minHeight)) {
        $(_this.map.containers.wrap).css("height", parseInt(this.options.minHeight) + "px")
        _this.updateScroll()
      }
    }

    this.updateTopShift()
  }

  /**
   * Adds pagination buttons to the directory.
   * @param {string} pager - HTML string with the buttons
   */
  setPagination(pager: HTMLElement | null) {
    $(this.containers.contentView).find(".mapsvg-pagination-container").remove()
    if (pager) {
      $(this.containers.contentView).append('<div class="mapsvg-pagination-container"></div>')
      $(this.containers.contentView).find(".mapsvg-pagination-container").html(pager)
    }
  }

  convertId(id) {
    return (id + "")
      .split(" ")
      .join("_")
      .replace(/(:|\(|\)|\.|\[|\]|,|=|@)/g, "\\$1")
  }
}
