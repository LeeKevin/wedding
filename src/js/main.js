if (!String.prototype.includes) {
    String.prototype.includes = function (search, start) {
        'use strict'
        if (typeof start !== 'number') {
            start = 0
        }

        if (start + search.length > this.length) {
            return false
        } else {
            return this.indexOf(search, start) !== -1
        }
    }
}

function prepare() {
    const menuButton = document.getElementById('menu-button')

    menuButton.addEventListener('touchstart', toggleMenu)
    menuButton.addEventListener('click', toggleMenu)

    window.addEventListener('scroll', setHeaderClasses)
    window.addEventListener('resize', handleWindowResize)
}

function toggleMenu(event) {
    event.stopPropagation()
    event.preventDefault()

    const menu = document.getElementById('header-menu')

    if (menu.className.includes('header-menu-open')) {
        menu.classList.remove('header-menu-open')
    } else {
        menu.classList.add('header-menu-open')
    }
}

function handleWindowResize() {
    const menu = document.getElementById('header-menu')
    const menuButton = document.getElementById('menu-button')
    // Check if in mobile mode

    const isMenuButtonVisible = !!menuButton.offsetParent
    if (!isMenuButtonVisible && menu.className.includes('header-menu-open')) {
        menu.classList.remove('header-menu-open')
    }
}

function setHeaderClasses() {
    const header = document.getElementById('header')
    const menu = document.getElementById('header-menu')

    const isScrolled = menu.className.includes('scrolled')
    const headerThreshold = isScrolled ? header.scrollHeight : header.scrollHeight - menu.scrollHeight

    if (document.body.scrollTop > headerThreshold || document.documentElement.scrollTop > headerThreshold) {
        menu.classList.add('scrolled')
        menu.setAttribute('style', 'position: fixed; top: 0;')
    } else if (isScrolled) {
        menu.classList.remove('scrolled')
        menu.setAttribute('style', 'position: relative;')
    }
}

window.addEventListener('load', function () {
    setHeaderClasses()

    // page is fully rendered
    prepare()
})
