import React from './_includes/no-react'
import scrollToElement from 'scroll-to-element'

const defaultZoom = 13
const defaultCenter = { lat: 51.0446, lng: -114.0526 }

let map = null
let markers = []
let currentSection = null

function inView(elem) {
    const bounding = elem.getBoundingClientRect()
    return (
        bounding.top >= 0 &&
        bounding.left >= 0 &&
        bounding.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
        bounding.right <= (window.innerWidth || document.documentElement.clientWidth)
    )
}

function prepareSections(sections) {
    const nav = document.getElementById('itinerary-nav')
    nav.classList.add('active')

    const sectionLinks = []

    let defaultSectionIndex = 0
    sections.forEach((section, i) => {
        section.classList.add('hidden')
        const header = section.querySelector('h3').innerText

        const navEl = document.createElement('a')
        navEl.innerText = header
        nav.appendChild(navEl)
        sectionLinks.push(navEl)

        navEl.addEventListener('click', () => {
            handleSectionLinkClick(i, sections, sectionLinks)
        })

        if (section.classList.contains('default')) {
            defaultSectionIndex = i
        }
    })

    if (sections.length) {
        currentSection = sections[defaultSectionIndex]
        handleSectionLinkClick(defaultSectionIndex, sections, sectionLinks)
    }

    return sectionLinks
}

function handleSectionLinkClick(index, sections, sectionLinks) {
    const section = sections[index]
    const sectionLink = sectionLinks[index]

    sections.forEach((s) => s.classList.add('hidden'))
    sectionLinks.forEach((l) => l.classList.remove('selected'))

    section.classList.remove('hidden')
    sectionLink.classList.add('selected')
    currentSection = section

    loadItineraryMap(section)
}

function handleMapPosition() {
    const container = document.getElementById('map-container')
    const wrapper = document.getElementById('map-wrapper')

    const rect = container.getBoundingClientRect()
    const threshold = window.pageYOffset + rect.top
    if (document.body.scrollTop > threshold || document.documentElement.scrollTop > threshold) {
        wrapper.classList.add('fixed')
        wrapper.setAttribute('style', `width: ${rect.width}px;`)
    } else {
        wrapper.classList.remove('fixed')
        wrapper.setAttribute('style', '')
    }

    // Now check for visible map locations in content.
    // Highlight them on map
    const locations = Array.from(document.querySelectorAll('.map-location'))

    let foundVisibleLocation = false
    let i = 0
    while (i < locations.length && i < markers.length) {
        const location = locations[i]
        const marker = markers[i]

        if (marker.el) {
            if (!foundVisibleLocation && inView(location)) {
                marker.el.classList.add('active')
                map.panTo(marker.getPosition())

                let locationSibling = location.nextElementSibling
                while (locationSibling && locationSibling.classList.contains('map-location')) {
                    i++

                    const siblingMarker = markers[i]
                    siblingMarker.el.classList.add('active')
                    locationSibling = locationSibling.nextElementSibling
                }

                foundVisibleLocation = true
            } else {
                marker.el.classList.remove('active')
            }
        }

        i++
    }
}

function createMapMarker({ OverlayView = google.maps.OverlayView, latlng, map, number, label }) {
    class MapMarker extends OverlayView {
        constructor() {
            super()
            this.latlng = latlng
            this.number = number
            this.label = label

            this.el = null

            this.setMap(map)
        }

        createDiv() {
            this.el = <div
                className="map-marker"
                style="position: absolute;"
            >
                <div className="map-marker__point map-marker__shadow"/>
                <div
                    className="map-marker__inner"
                >
                    <div className="map-marker__number">{this.number}</div>
                </div>
                <div className="map-marker__point"/>
                <div className="map-marker__label">
                    <span>{this.label}</span>
                </div>
            </div>

            google.maps.event.addDomListener(this.el, 'click', event => {
                event.stopPropagation()

                google.maps.event.trigger(this, 'click')
            })

            google.maps.event.addDomListener(this.el, 'mouseover', event => {
                google.maps.event.trigger(this, 'mouseover')
            })

            google.maps.event.addDomListener(this.el, 'mouseout', event => {
                google.maps.event.trigger(this, 'mouseout')
            })
        }

        appendDivToOverlay() {
            const panes = this.getPanes()
            panes.overlayMouseTarget.appendChild(this.el)
        }

        positionDiv() {
            const point = this.getProjection().fromLatLngToDivPixel(this.latlng)
            if (point) {
                this.el.style.left = `${point.x}px`
                this.el.style.top = `${point.y}px`
            }
        }

        draw() {
            if (!this.el) {
                this.createDiv()
                this.appendDivToOverlay()
            }
            this.positionDiv()
        }

        remove() {
            if (this.el) {
                this.el.parentNode.removeChild(this.el)
                this.el = null
            }

            this.setMap(null)
        }

        getPosition() {
            return this.latlng
        }

        getDraggable() {
            return false
        }
    }

    return new MapMarker()
}

function loadItineraryMap(section) {
    // Clear existing markers
    markers.forEach((marker) => marker.remove())
    markers = []

    // Get zoom and center location
    const lat = parseFloat(section.getAttribute('data-lat'))
    const long = parseFloat(section.getAttribute('data-long'))
    const zoom = parseFloat(section.getAttribute('data-zoom'))
    map.panTo(lat && long
        ? new google.maps.LatLng(lat, long)
        : new google.maps.LatLng(defaultCenter.lat, defaultCenter.lng))
    map.setZoom(zoom || defaultZoom)

    // Add Markers
    Array.from(section.querySelectorAll('.map-location')).forEach((location, i) => {
        let marker = createMapMarker({
            latlng: new google.maps.LatLng(
                parseFloat(location.getAttribute('data-lat')),
                parseFloat(location.getAttribute('data-long'))
            ),
            map: map,
            number: i + 1,
            label: location.innerText || location.text || '',
        })
        markers.push(marker)

        google.maps.event.addListener(marker, 'click', (e) => {
            scrollToElement(location, {
                offset: -50,
                ease: 'outQuint',
                duration: 1000
            });
        })

        google.maps.event.addListener(marker, 'mouseover', () => {
            marker.el.classList.add('hover')
        })

        google.maps.event.addListener(marker, 'mouseout', () => {
            marker.el.classList.remove('hover')
        })
    })
}

function initMap() {
    const container = document.getElementById('map-container')
    const mapEl = document.getElementById('map')

    const styles = [
        {
            "featureType": "administrative.country",
            "elementType": "geometry.fill",
            "stylers": [
                {
                    "color": "#ff0000"
                }
            ]
        },
        {
            "featureType": "administrative.province",
            "elementType": "geometry.fill",
            "stylers": [
                {
                    "color": "#7b3535"
                }
            ]
        },
        {
            "featureType": "administrative.locality",
            "elementType": "geometry.fill",
            "stylers": [
                {
                    "color": "#794c4c"
                }
            ]
        },
        {
            "featureType": "administrative.neighborhood",
            "elementType": "geometry.fill",
            "stylers": [
                {
                    "color": "#531a1a"
                }
            ]
        },
        {
            "featureType": "administrative.neighborhood",
            "elementType": "labels",
            "stylers": [
                {
                    "visibility": "on"
                }
            ]
        },
        {
            "featureType": "administrative.neighborhood",
            "elementType": "labels.text",
            "stylers": [
                {
                    "visibility": "on"
                }
            ]
        },
        {
            "featureType": "administrative.land_parcel",
            "elementType": "geometry.fill",
            "stylers": [
                {
                    "color": "#381313"
                }
            ]
        },
        {
            "featureType": "landscape.man_made",
            "elementType": "geometry.fill",
            "stylers": [
                {
                    "color": "#e1e1e1"
                }
            ]
        },
        {
            "featureType": "road.arterial",
            "elementType": "geometry.fill",
            "stylers": [
                {
                    "visibility": "on"
                }
            ]
        },
        {
            "featureType": "road.arterial",
            "elementType": "geometry.stroke",
            "stylers": [
                {
                    "visibility": "on"
                }
            ]
        },
        {
            "featureType": "road.local",
            "elementType": "geometry.fill",
            "stylers": [
                {
                    "visibility": "on"
                },
                {
                    "weight": "0.5"
                },
                {
                    "gamma": "1.65"
                }
            ]
        },
        {
            "featureType": "road.local",
            "elementType": "labels",
            "stylers": [
                {
                    "visibility": "off"
                }
            ]
        },
        {
            "featureType": "water",
            "elementType": "geometry",
            "stylers": [
                {
                    "color": "#add4dd"
                },
                {
                    "visibility": "simplified"
                },
                {
                    "weight": "1.00"
                }
            ]
        },
        {
            "featureType": "water",
            "elementType": "geometry.fill",
            "stylers": [
                {
                    "saturation": "48"
                },
                {
                    "visibility": "on"
                }
            ]
        },
        {
            "featureType": "water",
            "elementType": "labels",
            "stylers": [
                {
                    "visibility": "off"
                }
            ]
        },
        {
            "featureType": "water",
            "elementType": "labels.text.fill",
            "stylers": [
                {
                    "visibility": "off"
                }
            ]
        }
    ]
    map = new google.maps.Map(mapEl, {
        center: defaultCenter,
        zoom: defaultZoom,
        zoomControlOptions: {
            position: google.maps.ControlPosition.RIGHT_CENTER
        },
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
        clickableIcons: false,
        styles,
    })

    container.classList.add('active')
    handleMapPosition()

    let initialSection = currentSection
    if (!initialSection) initialSection = document.querySelector('section.itinerary')
    if (initialSection) {
        loadItineraryMap(initialSection)
    }
}

window.initMap = initMap
window.addEventListener('load', function () {
    // Prepare itineraries
    const sections = Array.from(document.querySelectorAll('section.itinerary'))
    const sectionLinks = prepareSections(sections)

    window.addEventListener('scroll', handleMapPosition)
    window.addEventListener('resize', handleMapPosition)
})
window.React = React
